import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle2, Trophy, BookOpen, ChevronDown, HelpCircle } from 'lucide-react';
import { Mode } from '../types';

interface Props {
  type: Mode.PRELIMS | Mode.MAINS | Mode.MOCK | 'VOCAB' | 'OPTIONAL' | 'MOCK_TEST' | 'CURRENT_AFFAIRS'; 
  onBack: () => void;
  tableName: string; 
}

export const QuestionView: React.FC<Props> = ({ type, onBack, tableName }) => {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [selExam, setSelExam] = useState('Rajyaseva'); 
  const [selYear, setSelYear] = useState('All');
  const [selSubject, setSelSubject] = useState('All');

  // फॉरमॅट ठरवण्यासाठी मदतनीस कन्डिशन्स
  const isMcqMode = type === Mode.PRELIMS || type === Mode.MAINS || type === Mode.MOCK || type === 'MOCK_TEST';
  const isDetailMode = type === 'OPTIONAL' || type === 'CURRENT_AFFAIRS' || type === 'VOCAB';

  const getSubjects = () => {
    if (type === Mode.PRELIMS || type === 'MOCK_TEST') {
      return ['History', 'Geography', 'Polity', 'Economics', 'Science', 'Environment', 'Current Affairs', 'Maths'];
    } 
    if (type === Mode.MAINS) {
      return selExam === 'Rajyaseva' ? ['Marathi', 'English', 'Paper 1', 'Paper 2', 'Paper 3', 'Paper 4'] : ['Paper 1', 'Paper 2', 'Maths'];
    }
    if (type === 'OPTIONAL') {
      return ['Marathi Literature', 'Public Administration', 'History', 'Geography', 'Political Science'];
    }
    if (type === 'VOCAB') {
      return ['Marathi Grammar', 'English Grammar', 'Idioms', 'Phrases', 'One Word Substitution'];
    }
    return [];
  };

  const subjectsList = getSubjects();
  const yearsList = Array.from({ length: new Date().getFullYear() - 2018 + 1 }, (_, i) => (2018 + i).toString()).reverse();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from(tableName).select('*');
        if (!['OPTIONAL', 'VOCAB', 'CURRENT_AFFAIRS'].includes(type) && selExam !== 'All') {
          query = query.eq('exam_name', selExam);
        }
        if (selSubject !== 'All') query = query.eq('subject', selSubject);
        if (type !== 'MOCK_TEST' && selYear !== 'All') {
          query = query.eq('year', parseInt(selYear));
        }

        const { data, error } = await query.order('id', { ascending: false });
        if (error) throw error;
        setDataList(data || []);
        setSelectedAnswers({}); 
      } catch (err: any) {
        console.error("Error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tableName, type, selExam, selYear, selSubject]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            {type === 'OPTIONAL' ? "वैकल्पिक विषय" : 
             type === 'MOCK_TEST' ? "सराव परीक्षा" :
             type === 'VOCAB' ? "शब्दसंग्रह (Vocab)" :
             type === 'CURRENT_AFFAIRS' ? "चालू घडामोडी" : "प्रश्न संच"}
          </h2>
          {!['OPTIONAL', 'VOCAB'].includes(type) && (
            <p className="text-sm font-bold text-indigo-500 uppercase flex items-center gap-2">
              <Trophy size={16} /> {selExam} विशेष
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={`bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10 grid grid-cols-1 ${isDetailMode ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
        {!isDetailMode && (
          <FilterSelect 
              label="परीक्षा निवडा" 
              options={['Rajyaseva', 'Combined Group B', 'Combined Group C']} 
              value={selExam} 
              onChange={(val: string) => { setSelExam(val); setSelSubject('All'); }} 
          />
        )}
        <FilterSelect 
            label="विषय निवडा" 
            options={subjectsList} 
            value={selSubject} 
            onChange={setSelSubject} 
        />
        {type !== 'MOCK_TEST' && (
          <FilterSelect label="वर्ष निवडा" options={yearsList} value={selYear} onChange={setSelYear} />
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20 font-bold text-slate-400 italic animate-pulse">डेटा लोड होत आहे...</div>
        ) : dataList.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold text-lg">माहिती उपलब्ध नाही.</p>
          </div>
        ) : (
          dataList.map((item, idx) => (
            isDetailMode ? (
              /* --- DETAIL FORMAT (Vocab, Optional, Current Affairs) --- */
              <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-4 transition-all hover:shadow-md">
                <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                      <Badge text={item.subject || item.category} color="bg-orange-50 text-orange-600" />
                      {item.year && <Badge text={`${item.year}`} color="bg-slate-100 text-slate-500" />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 leading-snug">
                       {item.question || item.question_title || item.title}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-full transition-transform ${expandedId === item.id ? 'bg-indigo-50 text-indigo-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                    <ChevronDown size={20} />
                  </div>
                </button>
                {expandedId === item.id && (
                  <div className="px-8 pb-8 animate-in slide-in-from-top-2">
                    <div className="h-px bg-slate-100 mb-6" />
                    <div className="text-slate-600 leading-relaxed font-medium text-lg whitespace-pre-line bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       {/* Vocab साठी explanation आणि इतरांसाठी answer_details/details */}
                       {item.explanation || item.answer_details || item.details}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* --- MCQ FORMAT (Prelims, Mains, Mock Test) --- */
              <div key={item.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm mb-6">
                 <div className="flex flex-wrap gap-2 mb-6">
                    <Badge text={item.exam_name || 'MPSC'} color="bg-indigo-50 text-indigo-600" />
                    <Badge text={item.subject} color="bg-purple-50 text-purple-600" />
                    {item.year && <Badge text={`${item.year}`} color="bg-slate-100 text-slate-500" />}
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">
                    <span className="text-indigo-600 mr-2">Q.{idx + 1}</span> {item.question}
                 </h3>
                 <div className="grid grid-cols-1 gap-4 mb-8">
                    {item.options?.map((option: string, optIdx: number) => {
                        const isSelected = selectedAnswers[item.id] === optIdx;
                        const isCorrect = optIdx === item.correct_answer_index;
                        const showResult = selectedAnswers[item.id] !== undefined;
                        return (
                          <button
                            key={optIdx}
                            disabled={showResult}
                            onClick={() => setSelectedAnswers(prev => ({ ...prev, [item.id]: optIdx }))}
                            className={`p-5 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between
                              ${isSelected 
                                ? (isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-500 bg-rose-50 text-rose-700') 
                                : (showResult && isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-white')
                              }`}
                          >
                            <span>{option}</span>
                            {showResult && isCorrect && <CheckCircle2 size={20} className="text-emerald-600" />}
                          </button>
                        );
                    })}
                 </div>
                 {selectedAnswers[item.id] !== undefined && (
                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 mb-3 text-indigo-700 font-black uppercase text-[10px] tracking-widest"><BookOpen size={16} /> स्पष्टीकरण</div>
                      <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-line">{item.explanation}</p>
                    </div>
                 )}
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
};

const Badge = ({ text, color }: { text: string; color: string }) => (
  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${color}`}>{text}</span>
);

const FilterSelect = ({ label, options, value, onChange }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none appearance-none border border-transparent focus:border-indigo-500 focus:bg-white transition-all cursor-pointer">
        <option value="All">सर्व</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
    </div>
  </div>
);

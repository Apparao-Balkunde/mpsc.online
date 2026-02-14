import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle2, Filter, Trophy, Calendar, BookOpen, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
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

  // Default values
  const [selExam, setSelExam] = useState('Rajyaseva'); 
  const [selYear, setSelYear] = useState('All');
  const [selSubject, setSelSubject] = useState('All');

  const getSubjects = () => {
    if (type === Mode.PRELIMS) {
      return ['History', 'Geography', 'Polity', 'Economics', 'Science', 'Environment', 'Current Affairs', 'GS Paper 2'];
    }
    if (type === Mode.MAINS) {
      if (selExam === 'Rajyaseva') {
        return ['Marathi', 'English', 'Paper 1 (History & Geo)', 'Paper 2 (Polity)', 'Paper 3 (HR & HRD)', 'Paper 4 (Sci-Tech & Econ)'];
      }
      return ['Paper 1 (Lang)', 'Paper 2 (GS)'];
    }
    if (type === 'OPTIONAL') {
      return ['Marathi Literature', 'Public Administration', 'History', 'Geography', 'Political Science'];
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
        
        // Optional मोडमध्ये Exam फिल्टर लावायचा नाही, बाकी मोडमध्ये लावायचा
        if (type !== 'OPTIONAL' && selExam !== 'All') {
          query = query.eq('exam_name', selExam);
        }
        
        if (selSubject !== 'All') query = query.eq('subject', selSubject);
        
        if (type !== 'MOCK_TEST' && selYear !== 'All') {
          query = query.eq('year', parseInt(selYear));
        }

        const { data, error } = await query.order('id', { ascending: false });
        if (error) throw error;
        setDataList(data || []);
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
            {type === 'OPTIONAL' ? "वैकल्पिक विषय (Optional)" : 
             type === 'CURRENT_AFFAIRS' ? "चालू घडामोडी" : "प्रश्न संच"}
          </h2>
          {/* Optional मध्ये Exam नाव लपवले आहे */}
          {type !== 'OPTIONAL' && (
            <p className="text-sm font-bold text-indigo-500 uppercase flex items-center gap-2">
              <Trophy size={16} /> {selExam} विशेष
            </p>
          )}
        </div>
      </div>

      {/* Filters Section - Optional साठी फक्त २ कॉलम्सची ग्रिड */}
      <div className={`bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10 grid grid-cols-1 ${type === 'OPTIONAL' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
        
        {/* १. परीक्षा निवडा - Optional साठी लपवला आहे */}
        {type !== 'OPTIONAL' && (
          <FilterSelect 
              label="परीक्षा निवडा" 
              options={['Rajyaseva', 'Combined Group B', 'Combined Group C']} 
              value={selExam} 
              onChange={(val: string) => { setSelExam(val); setSelSubject('All'); }} 
          />
        )}
        
        {/* २. विषय / Optional विषय */}
        <FilterSelect 
            label={type === 'OPTIONAL' ? "Optional विषय निवडा" : "विषय निवडा"} 
            options={subjectsList} 
            value={selSubject} 
            onChange={setSelSubject} 
        />
        
        {/* ३. वर्ष */}
        {type !== 'MOCK_TEST' && (
          <FilterSelect 
              label="वर्ष निवडा" 
              options={yearsList} 
              value={selYear} 
              onChange={setSelYear} 
          />
        )}
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20 font-bold text-slate-400 italic animate-pulse">डेटा लोड होत आहे...</div>
        ) : dataList.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold text-lg">या निवडीसाठी माहिती उपलब्ध नाही.</p>
          </div>
        ) : (
          dataList.map((item, idx) => (
            type === 'CURRENT_AFFAIRS' || type === 'OPTIONAL' ? (
              /* Descriptive UI (Current Affairs & Optional) */
              <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-4 transition-all hover:shadow-md">
                <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                      <Badge text={item.subject} color="bg-orange-50 text-orange-600" />
                      <Badge text={`${item.year}`} color="bg-slate-100 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 leading-snug">{item.question_title || item.title}</h3>
                  </div>
                  <div className={`p-2 rounded-full transition-transform ${expandedId === item.id ? 'bg-indigo-50 text-indigo-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                    <ChevronDown size={20} />
                  </div>
                </button>
                {expandedId === item.id && (
                  <div className="px-8 pb-8 animate-in slide-in-from-top-2">
                    <div className="h-px bg-slate-100 mb-6" />
                    <p className="text-slate-600 leading-relaxed font-medium text-lg whitespace-pre-line bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      {item.answer_details || item.details}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* MCQ UI - जसा आहे तसाच */
              <div key={item.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm mb-6">
                 <div className="flex flex-wrap gap-2 mb-6">
                    <Badge text={item.exam_name} color="bg-indigo-50 text-indigo-600" />
                    <Badge text={item.subject} color="bg-purple-50 text-purple-600" />
                    <Badge text={`${item.year}`} color="bg-slate-100 text-slate-500" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">
                    <span className="text-indigo-600 mr-2">Q.{idx + 1}</span> {item.question}
                 </h3>
                 {/* MCQ Options logic here... */}
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
};

const Badge = ({ text, color }: { text: string; color: string }) => (
  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${color}`}>
    {text}
  </span>
);

const FilterSelect = ({ label, options, value, onChange }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none appearance-none border border-transparent focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
      >
        <option value="All">सर्व</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
    </div>
  </div>
);

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle2, HelpCircle, Filter, GraduationCap, Trophy } from 'lucide-react';
import { MPSCQuestion, Mode } from '../types';

interface Props {
  // 'MOCK_TEST' हा नवीन प्रकार जोडला आहे
  type: Mode.PRELIMS | Mode.MAINS | Mode.MOCK | 'VOCAB' | 'LITERATURE' | 'MOCK_TEST'; 
  onBack: () => void;
  tableName: string; 
}

export const QuestionView: React.FC<Props> = ({ type, onBack, tableName }) => {
  const [questions, setQuestions] = useState<MPSCQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  // Mock Test साठी पहिली पसंती 'Rajyaseva'
  const [selExam, setSelExam] = useState(type === 'MOCK_TEST' ? 'Rajyaseva' : 'Combined Group B'); 
  const [selSubject, setSelSubject] = useState('All');
  const [selYear, setSelYear] = useState('All');

  const yearsList = Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, i) => (2010 + i).toString()).reverse();

  // १. परीक्षेचे पर्याय (Mock Test साठी तुझे हवे असलेले ३ पर्याय)
  const getExamOptions = () => {
    if (type === 'MOCK_TEST') {
      return ['Rajyaseva', 'Combined Group B', 'Combined Group C'];
    }
    return ['Rajyaseva', 'Combined Group B', 'Combined Group C', 'Saral Seva'];
  };

  // २. विषयांचे पर्याय
  const getDynamicSubjects = () => {
    if (type === 'MOCK_TEST') {
        return ['GS', 'CSAT', 'Full Length Test'];
    }
    if (type === 'VOCAB') return ['Synonyms', 'Antonyms', 'One Word', 'Idioms & Phrases'];
    if (type === 'LITERATURE') return ['Marathi Sahitya', 'Authors & Books'];
    
    const isCombined = selExam.includes('Combined');
    if (type === Mode.MAINS) {
      if (selExam === 'Rajyaseva') return ['Paper 1', 'Paper 2', 'Paper 3', 'Paper 4'];
      if (isCombined) return ['Paper 1', 'Paper 2'];
    }

    return ['Polity', 'History', 'Geography', 'Economics', 'Environment', 'Science', 'Current Affairs'];
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        let query = supabase.from(tableName).select('*');

        if (selExam !== 'All') query = query.eq('exam_name', selExam);
        
        if (selSubject !== 'All') {
            query = query.eq('subject', selSubject);
        }
        
        // --- बदल: जर Mock Test असेल तर Year फिल्टर कोरी टाकला आहे ---
        if (type !== 'MOCK_TEST' && selYear !== 'All') {
            query = query.eq('year', parseInt(selYear));
        }

        const { data, error } = await query.order('id', { ascending: false });
        if (error) throw error;
        setQuestions(data || []);
      } catch (err: any) {
        console.error("Error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [tableName, type, selExam, selSubject, selYear]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            {type === 'MOCK_TEST' ? "Mock Test" : "प्रश्न संच"}
          </h2>
          <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
            <Trophy size={16} /> {selExam} Special
          </p>
        </div>
      </div>

      {/* --- बदल: Mock Test असेल तर Year फिल्टर गायब होईल आणि २ कॉलम्स दिसतील --- */}
      <div className={`bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10 grid grid-cols-1 ${type === 'MOCK_TEST' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
        <FilterSelect 
            label="परीक्षा निवडा" 
            options={getExamOptions()} 
            value={selExam} 
            onChange={(v: string) => { setSelExam(v); setSelSubject('All'); }} 
        />
        <FilterSelect 
            label="विषय" 
            options={getDynamicSubjects()} 
            value={selSubject} 
            onChange={setSelSubject} 
        />
        {/* Year फिल्टर फक्त Mock Test नसतानाच दिसेल */}
        {type !== 'MOCK_TEST' && (
          <FilterSelect 
              label="वर्ष" 
              options={yearsList} 
              value={selYear} 
              onChange={setSelYear} 
          />
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-20 font-bold text-slate-400 italic animate-pulse">डेटा लोड होत आहे...</div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge text={q.exam_name} color="bg-indigo-50 text-indigo-600" />
                <Badge text={q.subject} color="bg-purple-50 text-purple-600" />
                {/* कार्डवर सुद्धा वर्ष फक्त Mock Test नसेल तरच दिसेल */}
                {type !== 'MOCK_TEST' && q.year && <Badge text={`${q.year}`} color="bg-slate-100 text-slate-500" />}
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">
                <span className="text-indigo-600 mr-2">Q.{idx + 1}</span> {q.question}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {q.options?.map((opt, i) => {
                  const answered = selectedAnswers[q.id] !== undefined;
                  const isCorrect = q.correct_answer_index === i;
                  const isSelected = selectedAnswers[q.id] === i;
                  return (
                    <button 
                      key={i} 
                      disabled={answered}
                      onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: i }))}
                      className={`p-5 rounded-3xl border-2 text-left font-bold transition-all flex items-center justify-between ${
                        answered ? (isCorrect ? "border-emerald-500 bg-emerald-50" : isSelected ? "border-rose-500 bg-rose-50" : "opacity-40 border-slate-50") : "border-slate-100 hover:border-indigo-200"
                      }`}
                    >
                      <span className="flex-1">{opt}</span>
                      {answered && isCorrect && <CheckCircle2 className="text-emerald-600" size={22} />}
                    </button>
                  );
                })}
                {selectedAnswers[q.id] !== undefined && (
                  <div className="mt-4 p-6 bg-indigo-50 rounded-3xl border-l-8 border-indigo-600">
                    <p className="text-slate-700 font-medium">
                      <strong className="text-indigo-700">स्पष्टीकरण:</strong> {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Helper Components
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
        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
      >
        <option value="All">सर्व</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
    </div>
  </div>
);

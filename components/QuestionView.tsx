import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle2, HelpCircle, Filter, GraduationCap } from 'lucide-react';
import { MPSCQuestion, Mode } from '../types';

interface Props {
  type: Mode.PRELIMS | Mode.MAINS | Mode.MOCK;
  onBack: () => void;
  tableName: string; 
}

export const QuestionView: React.FC<Props> = ({ type, onBack, tableName }) => {
  const [questions, setQuestions] = useState<MPSCQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const [selExam, setSelExam] = useState('Combined Group B'); // Default Combined ठेवले आहे
  const [selSubject, setSelSubject] = useState('All');
  const [selYear, setSelYear] = useState('All');

  const yearsList = Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, i) => (2010 + i).toString()).reverse();

  // Combined साठी फक्त Paper 1 आणि Paper 2 चे लॉजिक
  const getDynamicSubjects = () => {
    const isCombined = selExam.includes('Combined');
    
    if (isCombined && type === Mode.MAINS) {
      return ['Paper 1', 'Paper 2'];
    }
    
    if (selExam === 'Rajyaseva' && type === Mode.MAINS) {
      return ['GS 1', 'GS 2', 'GS 3', 'GS 4', 'Marathi & English'];
    }

    if (selExam === 'Saral Seva') {
      return ['General Studies', 'Marathi Grammar', 'English Grammar'];
    }

    return ['Polity', 'History', 'Geography', 'Economics', 'Environment', 'Science', 'Current Affairs'];
  };

  const examOptions = type === Mode.MAINS 
    ? ['Combined Group B', 'Combined Group C', 'Rajyaseva'] 
    : ['Combined Group B', 'Combined Group C', 'Rajyaseva', 'Saral Seva'];

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        let query = supabase.from(tableName).select('*');

        // १. परीक्षेनुसार फिल्टर
        if (selExam !== 'All') query = query.eq('exam_name', selExam);
        
        // २. पेपर/विषयानुसार स्मार्ट फिल्टरिंग
        if (selSubject === 'Paper 1') {
            // Combined Paper 1 मध्ये सहसा भाषा विषय असतात
            query = query.in('subject', ['Marathi Grammar', 'English Grammar', 'Marathi', 'English']);
        } else if (selSubject === 'Paper 2') {
            // Paper 2 मध्ये GS आणि बुद्धिमत्ता असते
            query = query.not('subject', 'in', '("Marathi Grammar","English Grammar","Marathi","English")');
        } else if (selSubject !== 'All') {
            query = query.eq('subject', selSubject);
        }
        
        // ३. वर्षानुसार फिल्टर
        if (selYear !== 'All') query = query.eq('year', parseInt(selYear));

        const { data, error } = await query.order('year', { ascending: false });
        if (error) throw error;
        setQuestions(data || []);
      } catch (err: any) {
        console.error("डेटा लोड करताना चूक झाली:", err.message);
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
            {type === Mode.MAINS ? 'मुख्य परीक्षा' : 'पूर्व परीक्षा'}
          </h2>
          <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
            <GraduationCap size={16} /> {selExam} स्पेशल
          </p>
        </div>
      </div>

      {/* फिल्टर्स */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <FilterSelect 
            label="परीक्षा निवडा" 
            options={examOptions} 
            value={selExam} 
            onChange={(v: string) => { setSelExam(v); setSelSubject('All'); }} 
        />
        <FilterSelect 
            label={selExam.includes('Combined') && type === Mode.MAINS ? "पेपर निवडा" : "विषय निवडा"} 
            options={getDynamicSubjects()} 
            value={selSubject} 
            onChange={setSelSubject} 
        />
        <FilterSelect 
            label="वर्ष" 
            options={yearsList} 
            value={selYear} 
            onChange={setSelYear} 
        />
      </div>

      {/* प्रश्नांची यादी */}
      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-20 font-bold text-slate-400 italic animate-pulse">माहिती लोड होत आहे...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <HelpCircle className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="font-bold text-slate-400">या निवडीसाठी प्रश्न उपलब्ध नाहीत.</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge text={q.exam_name} color="bg-indigo-50 text-indigo-600" />
                <Badge text={q.subject} color="bg-purple-50 text-purple-600" />
                <Badge text={`${q.year}`} color="bg-slate-100 text-slate-500" />
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
                  <div className="mt-4 p-6 bg-indigo-50 rounded-3xl border-l-8 border-indigo-600 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-slate-700 font-medium leading-relaxed">
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

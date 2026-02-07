import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, Filter } from 'lucide-react';
import { MPSCQuestion, Mode } from '../types';

interface Props {
  type: Mode.PRELIMS | Mode.MAINS | Mode.MOCK;
  onBack: () => void;
}

export const QuestionView: React.FC<Props> = ({ type, onBack }) => {
  const [questions, setQuestions] = useState<MPSCQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  
  // फिल्टर्स स्टेट
  const [selExam, setSelExam] = useState('All');
  const [selSubject, setSelSubject] = useState('All');
  const [selYear, setSelYear] = useState('All');

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      // १. सुरुवातीला सर्व प्रश्न आणा जे 'PRELIMS' किंवा 'MAINS' आहेत
      let query = supabase.from('mpsc_questions').select('*').eq('exam_type', type);

      // २. जर युजरने फिल्टर निवडले असतील तर ते लावा
      if (selExam !== 'All') query = query.eq('exam_name', selExam);
      if (selSubject !== 'All') query = query.eq('subject', selSubject);
      if (selYear !== 'All') query = query.eq('year', parseInt(selYear));

      const { data, error } = await query.order('id', { ascending: true });
      if (!error && data) setQuestions(data as MPSCQuestion[]);
      setLoading(false);
    };
    fetchQuestions();
  }, [type, selExam, selSubject, selYear]);

  // युनिक फिल्टर्स काढण्यासाठी (ड्रॉपडाऊनसाठी)
  const exams = ['Rajyaseva', 'Combined Group B', 'Combined Group C'];
  const subjects = ['Polity', 'History', 'Geography', 'Economics', 'Science', 'Marathi', 'English'];
  const years = ['2024', '2023', '2022', '2021', '2020'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-slate-50 transition-all border border-slate-100">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800">{type === 'PRELIMS' ? 'पूर्व परीक्षा' : 'मुख्य परीक्षा'}</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">निवड करा आणि सराव सुरू करा</p>
        </div>
      </div>

      {/* Filters UI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <FilterSelect label="परीक्षा" options={exams} value={selExam} onChange={setSelExam} />
        <FilterSelect label="विषय" options={subjects} value={selSubject} onChange={setSelSubject} />
        <FilterSelect label="वर्ष" options={years} value={selYear} onChange={setSelYear} />
      </div>

      {/* Questions List */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex flex-col items-center py-20 animate-pulse">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-slate-400">प्रश्न शोधत आहोत...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed">
            <HelpCircle className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="font-bold text-slate-400">या निवडीसाठी प्रश्न उपलब्ध नाहीत.</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex gap-2 mb-4">
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black">{q.exam_name}</span>
                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black">{q.year}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-6">Q.{idx + 1} {q.question}</h3>
              {/* ... बाकीचा ऑप्शन्स आणि स्पष्टीकरणाचा कोड आधीसारखाच ... */}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Filter UI Component
const FilterSelect = ({ label, options, value, onChange }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">{label}</label>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
    >
      <option value="All">सर्व</option>
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

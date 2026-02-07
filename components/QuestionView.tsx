import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, BookOpen, ListChecks } from 'lucide-react';
import { MPSCQuestion, Mode } from '../types';

interface Props {
  type: Mode.PRELIMS | Mode.MAINS | Mode.MOCK;
  onBack: () => void;
}

export const QuestionView: React.FC<Props> = ({ type, onBack }) => {
  const [questions, setQuestions] = useState<MPSCQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showModelAnswer, setShowModelAnswer] = useState<Record<number, boolean>>({});

  const [selExam, setSelExam] = useState('All');
  const [selSubject, setSelSubject] = useState('All');
  const [selYear, setSelYear] = useState('All');

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      let query = supabase.from('mpsc_questions').select('*').eq('exam_type', type);

      if (selExam !== 'All') query = query.eq('exam_name', selExam);
      if (selSubject !== 'All') query = query.eq('subject', selSubject);
      if (selYear !== 'All') query = query.eq('year', parseInt(selYear));

      const { data, error } = await query.order('id', { ascending: true });
      if (!error && data) setQuestions(data as any[]);
      setLoading(false);
    };
    fetchQuestions();
  }, [type, selExam, selSubject, selYear]);

  const handleOptionClick = (questionId: number, optionIndex: number) => {
    if (selectedAnswers[questionId] !== undefined) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-slate-50 transition-all border border-slate-100">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800">{type === 'PRELIMS' ? 'पूर्व परीक्षा' : 'मुख्य परीक्षा'}</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">नवीन पॅटर्ननुसार सराव</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <FilterSelect label="परीक्षा" options={['Rajyaseva', 'Combined Group B', 'Combined Group C']} value={selExam} onChange={setSelExam} />
        <FilterSelect label="विषय" options={['Polity', 'History', 'Geography', 'Marathi', 'English']} value={selSubject} onChange={setSelSubject} />
        <FilterSelect label="वर्ष" options={['2024', '2023', '2022', '2021']} value={selYear} onChange={setSelYear} />
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-20 font-bold text-slate-400 animate-pulse">लोड होत आहे...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <HelpCircle className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="font-bold text-slate-400">माहिती उपलब्ध नाही.</p>
          </div>
        ) : (
          questions.map((q: any, idx) => (
            <div key={q.id} className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex gap-2 mb-6">
                <Badge text={q.exam_name} color="bg-indigo-50 text-indigo-600" />
                <Badge text={q.pattern_type} color={q.pattern_type === 'DESCRIPTIVE' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"} />
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">
                <span className="text-indigo-600 mr-2">Q.{idx + 1}</span> {q.question}
              </h3>

              {/* पॅटर्ननुसार रेंडरिंग */}
              {q.pattern_type === 'DESCRIPTIVE' ? (
                <div className="space-y-4">
                  <button 
                    onClick={() => setShowModelAnswer(prev => ({...prev, [q.id]: !prev[q.id]}))}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
                  >
                    <BookOpen size={18} /> {showModelAnswer[q.id] ? 'उत्तर लपवा' : 'आदर्श उत्तर / मुद्दे पहा'}
                  </button>
                  
                  {showModelAnswer[q.id] && (
                    <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100 animate-in slide-in-from-top-2">
                      <h4 className="text-sm font-black text-amber-700 uppercase mb-3">मुख्य उत्तर मुद्दे:</h4>
                      <p className="text-slate-700 whitespace-pre-wrap leading-loose font-medium">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {q.options?.map((opt: string, i: number) => {
                    const isSelected = selectedAnswers[q.id] === i;
                    const isCorrect = q.correctAnswerIndex === i;
                    const answered = selectedAnswers[q.id] !== undefined;

                    let stateClass = "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30";
                    if (answered) {
                      if (isCorrect) stateClass = "border-emerald-500 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-50";
                      else if (isSelected) stateClass = "border-rose-500 bg-rose-50 text-rose-700";
                      else stateClass = "border-slate-50 opacity-40";
                    }

                    return (
                      <button key={i} onClick={() => handleOptionClick(q.id, i)} className={`p-5 rounded-3xl border-2 text-left font-bold transition-all flex items-center justify-between ${stateClass}`}>
                        <span>{opt}</span>
                        {answered && isCorrect && <CheckCircle2 className="text-emerald-600" size={22} />}
                      </button>
                    );
                  })}
                  {selectedAnswers[q.id] !== undefined && (
                    <div className="mt-4 p-6 bg-slate-50 rounded-3xl border-l-8 border-indigo-500 font-medium text-slate-700">
                      {q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Badge = ({ text, color }: any) => <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${color}`}>{text}</span>;

const FilterSelect = ({ label, options, value, onChange }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
      <option value="All">सर्व</option>
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

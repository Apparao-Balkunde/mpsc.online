import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, BookOpen, Filter, PenTool, GraduationCap } from 'lucide-react';
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

  const [selExam, setSelExam] = useState('Rajyaseva');
  const [selSubject, setSelSubject] = useState('All');
  const [selYear, setSelYear] = useState('All');

  // २०१० पासूनची वर्षे
  const yearsList = Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, i) => (2010 + i).toString()).reverse();

  // परीक्षेनुसार विषयांची यादी मिळवणे
  const subjectsList = selExam === 'Rajyaseva' 
    ? ['Polity', 'History', 'Culture', 'Geography', 'Economics', 'Environment', 'Science', 'Current Affairs', 'Marathi Literature']
    : selExam.includes('Combined')
    ? ['Polity', 'History', 'Culture', 'Geography', 'Economics', 'Science', 'Environment', 'Current Affairs', 'Marathi Grammar', 'English Grammar']
    : ['General Studies', 'Marathi Grammar', 'English Grammar'];

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        let query = supabase.from('mpsc_questions').select('*').eq('exam_type', type);
        if (selExam !== 'All') query = query.eq('exam_name', selExam);
        if (selSubject !== 'All') query = query.eq('subject', selSubject);
        if (selYear !== 'All') query = query.eq('year', parseInt(selYear));

        const { data, error } = await query.order('year', { ascending: false });
        if (error) throw error;
        setQuestions(data || []);
      } catch (err: any) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [type, selExam, selSubject, selYear]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800">{type === 'PRELIMS' ? 'पूर्व परीक्षा' : 'मुख्य परीक्षा'}</h2>
          <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
            <GraduationCap size={16} /> {selExam} स्पेशल
          </p>
        </div>
      </div>

      {/* Dynamic Filters */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <FilterSelect 
          label="परीक्षा निवडा" 
          options={['Rajyaseva', 'Combined Group B', 'Combined Group C', 'Saral Seva']} 
          value={selExam} 
          onChange={(val: string) => { setSelExam(val); setSelSubject('All'); }} 
        />
        <FilterSelect 
          label="विषय निवडा" 
          options={subjectsList} 
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

      {/* Questions List */}
      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-20 font-bold text-slate-400">माहिती लोड होत आहे...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <HelpCircle className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="font-bold text-slate-400">या निवडीसाठी सध्या प्रश्न उपलब्ध नाहीत.</p>
          </div>
        ) : (
          questions.map((q: any, idx) => (
            <div key={q.id} className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge text={q.exam_name} color="bg-indigo-50 text-indigo-600" />
                <Badge text={q.subject} color="bg-purple-50 text-purple-600" />
                <Badge text={`${q.year}`} color="bg-slate-100 text-slate-500" />
                <Badge text={q.pattern_type} color={q.pattern_type === 'DESCRIPTIVE' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"} />
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">
                <span className="text-indigo-600 mr-2">Q.{idx + 1}</span> {q.question}
              </h3>

              {q.pattern_type === 'DESCRIPTIVE' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <PenTool size={18} className="text-blue-600" />
                    <p className="text-xs font-bold text-blue-700">हा लेखी स्वरूपाचा प्रश्न आहे. मुद्दे तपासा.</p>
                  </div>
                  <button 
                    onClick={() => setShowModelAnswer(prev => ({...prev, [q.id]: !prev[q.id]}))}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
                  >
                    <BookOpen size={18} /> {showModelAnswer[q.id] ? 'उत्तर लपवा' : 'आदर्श उत्तर पहा'}
                  </button>
                  {showModelAnswer[q.id] && (
                    <div className="p-8 bg-amber-50/50 rounded-[2rem] border border-amber-100 animate-in slide-in-from-top-2">
                      <div className="text-slate-700 whitespace-pre-wrap leading-loose font-medium">{q.explanation}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {q.options?.map((opt: string, i: number) => {
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
                        {opt} {answered && isCorrect && <CheckCircle2 className="text-emerald-600" size={22} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Badge = ({ text, color }: any) => <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${color}`}>{text}</span>;

const FilterSelect = ({ label, options, value, onChange }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none transition-all">
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

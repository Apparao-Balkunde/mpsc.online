import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  type: 'PRELIMS' | 'MAINS' | 'MOCK';
  onBack: () => void;
}

export const QuestionView: React.FC<Props> = ({ type, onBack }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  
  // Filters
  const [subject, setSubject] = useState('All');
  const [year, setYear] = useState('All');
  const [examName, setExamName] = useState('All');

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      let query = supabase.from('mpsc_questions').select('*').eq('exam_type', type);

      if (subject !== 'All') query = query.eq('subject', subject);
      if (year !== 'All') query = query.eq('year', parseInt(year));
      if (examName !== 'All') query = query.eq('exam_name', examName);

      const { data } = await query.order('id', { ascending: true });
      setQuestions(data || []);
      setLoading(false);
    };
    fetchQuestions();
  }, [type, subject, year, examName]);

  const handleOptionClick = (questionId: number, optionIndex: number) => {
    if (selectedAnswers[questionId] !== undefined) return; // एकदा उत्तर दिले की बदलता येणार नाही
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm"><ArrowLeft /></button>
        <h2 className="text-2xl font-black text-slate-800">{type} विभाग</h2>
      </div>

      {/* Filters Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-indigo-50 p-4 rounded-3xl">
        <select onChange={(e) => setExamName(e.target.value)} className="p-3 rounded-2xl border-none font-bold">
          <option value="All">सर्व परीक्षा</option>
          <option value="Rajyaseva">राज्यसेवा</option>
          <option value="Combined B">संयुक्त गट ब</option>
        </select>
        <select onChange={(e) => setSubject(e.target.value)} className="p-3 rounded-2xl border-none font-bold">
          <option value="All">सर्व विषय</option>
          <option value="Polity">राज्यशास्त्र</option>
          <option value="History">इतिहास</option>
          <option value="Geography">भूगोल</option>
        </select>
        <select onChange={(e) => setYear(e.target.value)} className="p-3 rounded-2xl border-none font-bold">
          <option value="All">सर्व वर्षे</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>
      </div>

      {/* Questions List */}
      <div className="space-y-8">
        {loading ? <div className="text-center font-bold text-slate-400">माहिती शोधत आहे...</div> : 
         questions.length === 0 ? <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed">या विषयाचे प्रश्न अजून उपलब्ध नाहीत.</div> :
         questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex gap-2 mb-4">
               <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase">{q.subject}</span>
               <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full">{q.year || 'N/A'}</span>
            </div>
            <p className="text-lg font-bold text-slate-800 mb-6">{idx + 1}. {q.question}</p>
            
            <div className="grid grid-cols-1 gap-3">
              {q.options.map((opt: string, i: number) => {
                const isSelected = selectedAnswers[q.id] === i;
                const isCorrect = q.correctAnswerIndex === i;
                const showResult = selectedAnswers[q.id] !== undefined;

                let btnClass = "p-4 rounded-2xl border-2 font-medium text-left transition-all ";
                if (!showResult) btnClass += "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50";
                else if (isCorrect) btnClass += "border-emerald-500 bg-emerald-50 text-emerald-700";
                else if (isSelected && !isCorrect) btnClass += "border-rose-500 bg-rose-50 text-rose-700";
                else btnClass += "border-slate-50 opacity-50";

                return (
                  <button key={i} onClick={() => handleOptionClick(q.id, i)} className={btnClass}>
                    <div className="flex justify-between items-center">
                      <span>{opt}</span>
                      {showResult && isCorrect && <CheckCircle2 size={20} />}
                      {showResult && isSelected && !isCorrect && <XCircle size={20} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedAnswers[q.id] !== undefined && (
              <div className="mt-6 p-5 bg-slate-50 rounded-2xl border-l-4 border-indigo-500 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-black text-indigo-600 uppercase mb-2">स्पष्टीकरण</p>
                <p className="text-slate-700 leading-relaxed">{q.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

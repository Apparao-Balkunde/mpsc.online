import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // फोल्डरच्या बाहेर जाण्यासाठी ../ वापरले आहे
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { MPSCQuestion, Mode } from '../types'; // फोल्डरच्या बाहेर जाण्यासाठी ../ वापरले आहे

interface Props {
  type: Mode.PRELIMS | Mode.MAINS | Mode.MOCK;
  onBack: () => void;
}

export const QuestionView: React.FC<Props> = ({ type, onBack }) => {
  const [questions, setQuestions] = useState<MPSCQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  
  const [subject, setSubject] = useState('All');

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        // तुमच्या DB मध्ये सध्या exam_type नसल्याने सर्व डेटा सिलेक्ट करत आहोत
        const { data, error } = await supabase
          .from('mpsc_questions')
          .select('*');

        if (error) throw error;

        if (data) {
          setQuestions(data as MPSCQuestion[]);
        }
      } catch (error: any) {
        console.error("Supabase Error:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [type]);

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
          <h2 className="text-2xl font-black text-slate-800">
            {type === 'PRELIMS' ? 'पूर्व परीक्षा' : type === 'MAINS' ? 'मुख्य परीक्षा' : 'सराव संच'}
          </h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">MPSC PYQ Series</p>
        </div>
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="font-bold text-slate-400">प्रश्न लोड होत आहेत...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 bg-slate-100/50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <HelpCircle className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="font-bold text-slate-400">सध्या डेटाबेसमध्ये प्रश्न उपलब्ध नाहीत.</p>
          </div>
        ) : questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge text="MPSC" color="bg-indigo-50 text-indigo-600" />
              <Badge text="GK" color="bg-slate-100 text-slate-500" />
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">
              <span className="text-indigo-600 mr-2">Q.{idx + 1}</span> {q.question}
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {q.options.map((opt, i) => {
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
                  <button 
                    key={i} 
                    onClick={() => handleOptionClick(q.id, i)} 
                    className={`group relative p-5 rounded-3xl border-2 text-left font-bold transition-all flex items-center justify-between ${stateClass}`}
                  >
                    <span>{opt}</span>
                    {answered && isCorrect && <CheckCircle2 className="text-emerald-600" size={22} />}
                    {answered && isSelected && !isCorrect && <XCircle className="text-rose-600" size={22} />}
                  </button>
                );
              })}
            </div>

            {selectedAnswers[q.id] !== undefined && (
              <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border-l-8 border-indigo-500 animate-in slide-in-from-top-4 duration-500">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">उत्तर व स्पष्टीकरण :</h4>
                <p className="text-slate-700 leading-relaxed font-medium">{q.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Badge = ({ text, color }: { text: string; color: string }) => (
  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${color}`}>{text}</span>
);

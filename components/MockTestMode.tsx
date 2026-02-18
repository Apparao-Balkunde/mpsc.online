import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase'; 
import { LoadingState, QuizQuestion } from '../types';
import { 
  ShieldCheck, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, 
  Loader2, Clock, Trophy, Info, BookOpen, Check, X
} from 'lucide-react';

interface MockTestModeProps {
  onBack: () => void;
}

export function MockTestMode({ onBack }: MockTestModeProps) {
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(3600); // १ तास डिफॉल्ट
  const [isFinished, setIsFinished] = useState(false);
  
  const timerRef = useRef<any>(null);

  const startTest = async () => {
    setStatus('loading');
    try {
      const { data, error } = await supabase
        .from('mock_questions') 
        .select('*')
        .limit(100); // १०० प्रश्न फेच करणे

      if (error) throw error;

      const formatted = data.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options, 
        correctAnswerIndex: q.correct_answer_index,
        explanation: q.explanation,
        subCategory: q.sub_category || 'General'
      }));

      setQuestions(formatted);
      setUserAnswers(new Array(formatted.length).fill(-1));
      setTimeLeft(formatted.length * 60); // प्रति प्रश्न १ मिनिट
      setStatus('success');
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { finishTest(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      setStatus('error');
    }
  };

  const finishTest = () => {
    clearInterval(timerRef.current);
    setIsFinished(true);
    window.scrollTo(0, 0);
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (status === 'idle') return (
    <div className="text-center p-10 bg-white rounded-3xl shadow-xl">
      <Trophy size={60} className="mx-auto text-yellow-500 mb-4" />
      <h2 className="text-3xl font-black mb-6">१०० प्रश्नांची सराव परीक्षा</h2>
      <p className="mb-8 text-slate-500">उत्तरे आणि स्पष्टीकरण चाचणी सबमिट केल्यानंतरच दिसतील.</p>
      <button onClick={startTest} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xl w-full">सुरू करा</button>
    </div>
  );

  if (status === 'loading') return <div className="text-center p-20"><Loader2 className="animate-spin mx-auto mb-4" /> प्रश्न लोड होत आहेत...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center sticky top-4 z-40 shadow-2xl">
        <div className="flex items-center gap-4">
          <span className="bg-indigo-600 px-3 py-1 rounded-lg text-xs font-black italic">LIVE EXAM</span>
          <h3 className="font-bold hidden md:block">प्रश्न: {currentIdx + 1} / {questions.length}</h3>
        </div>
        <div className="font-mono text-2xl font-black text-yellow-400 flex items-center gap-2">
          <Clock size={24}/> {formatTime(timeLeft)}
        </div>
      </div>

      {!isFinished ? (
        /* चाचणी दरम्यानचा इंटरफेस */
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="mb-8">
            <span className="text-indigo-600 font-black text-sm uppercase tracking-widest">{questions[currentIdx].subCategory}</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-2 leading-tight text-slate-800">{questions[currentIdx].question}</h2>
          </div>

          <div className="grid gap-4 mb-10">
            {questions[currentIdx].options.map((opt, i) => (
              <button 
                key={i}
                onClick={() => {
                  const newAns = [...userAnswers];
                  newAns[currentIdx] = i;
                  setUserAnswers(newAns);
                }}
                className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-bold text-lg ${userAnswers[currentIdx] === i ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 hover:bg-slate-50 text-slate-600'}`}
              >
                <span className="mr-4 opacity-50">{String.fromCharCode(65 + i)}.</span> {opt}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-8 border-t">
            <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="font-bold text-slate-400 disabled:opacity-0">मागे</button>
            <div className="flex gap-4">
              {currentIdx === questions.length - 1 ? (
                <button onClick={finishTest} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg">चाचणी संपवा</button>
              ) : (
                <button onClick={() => setCurrentIdx(prev => prev + 1)} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg">पुढील प्रश्न</button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* चाचणी संपल्यानंतरचा 'निकाल आणि विश्लेषण' इंटरफेस */
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center border-b-8 border-indigo-600">
            <Trophy size={80} className="mx-auto text-yellow-500 mb-4" />
            <h2 className="text-4xl font-black text-slate-900">तुमचा निकाल</h2>
            <div className="text-7xl font-black text-indigo-600 my-6">
              {userAnswers.filter((ans, i) => ans === questions[i].correctAnswerIndex).length} <span className="text-2xl text-slate-400">/ {questions.length}</span>
            </div>
            <button onClick={onBack} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">डॅशबोर्डवर जा</button>
          </div>

          <h3 className="text-2xl font-black px-4 flex items-center gap-2"><BookOpen /> सविस्तर स्पष्टीकरण:</h3>
          
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className={`bg-white p-8 rounded-3xl shadow-md border-l-8 ${userAnswers[idx] === q.correctAnswerIndex ? 'border-emerald-500' : 'border-red-500'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="font-black text-slate-400">प्रश्न {idx + 1}</span>
                  {userAnswers[idx] === q.correctAnswerIndex ? 
                    <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg"><Check size={16}/> बरोबर</span> : 
                    <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-3 py-1 rounded-lg"><X size={16}/> चुकीचे</span>
                  }
                </div>
                <h4 className="text-xl font-bold mb-6 text-slate-800">{q.question}</h4>
                
                <div className="grid gap-2 mb-6">
                  {q.options.map((opt, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${i === q.correctAnswerIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : i === userAnswers[idx] ? 'bg-red-50 border-red-200 text-red-800' : 'border-slate-100 opacity-60'}`}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  ))}
                </div>

                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2 text-indigo-900 font-black"><Info size={18}/> स्पष्टीकरण:</div>
                  <p className="text-indigo-800 leading-relaxed">{q.explanation || 'स्पष्टीकरण उपलब्ध नाही.'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

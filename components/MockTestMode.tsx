import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase'; 
import { LoadingState, QuizQuestion } from '../types';
import { 
  Clock, Trophy, CheckCircle2, ArrowLeft, ArrowRight, 
  Loader2, LayoutDashboard, Check, X, ShieldCheck, Target 
} from 'lucide-react';

interface MockTestModeProps { onBack: () => void; }

export function MockTestMode({ onBack }: MockTestModeProps) {
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(3600); 
  const [isFinished, setIsFinished] = useState(false);
  
  // नवीन स्टेट: परीक्षेचा प्रकार निवडण्यासाठी
  const [testType, setTestType] = useState('Rajyaseva');
  
  const timerRef = useRef<any>(null);

  const startTest = async () => {
    setStatus('loading');
    try {
      let query = supabase.from('mock_questions').select('*');
      
      // युजरने निवडलेल्या परीक्षेनुसार फिल्टर
      if (testType !== 'All') {
        query = query.eq('exam_name', testType);
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        alert("या परीक्षेसाठी सध्या प्रश्न उपलब्ध नाहीत!");
        setStatus('idle');
        return;
      }

      const formatted = data.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options, 
        correctAnswerIndex: q.correct_answer_index,
        explanation: q.explanation,
        subCategory: q.subject || 'General'
      }));

      setQuestions(formatted);
      setUserAnswers(new Array(formatted.length).fill(-1));
      setTimeLeft(formatted.length * 60); // १ मिनिट प्रति प्रश्न
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
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // --- १. सुरूवातीचा इंटरफेस (फिल्टरसह) ---
  if (status === 'idle') return (
    <div className="max-w-2xl mx-auto mt-10 p-8 md:p-12 bg-white rounded-[3rem] shadow-xl border border-slate-100 text-center">
      <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Target size={40} className="text-amber-500" />
      </div>
      <h2 className="text-3xl font-black text-slate-800 mb-2">सराव परीक्षा निवडा</h2>
      <p className="text-slate-500 font-bold mb-10 italic">तुमचे टार्गेट निवडा आणि टेस्ट सुरू करा</p>

      {/* परीक्षा निवडण्याचे बटन्स */}
      <div className="grid grid-cols-1 gap-4 mb-10">
        {['Rajyaseva', 'Combined Group B', 'Combined Group C', 'Saralseva'].map((type) => (
          <button
            key={type}
            onClick={() => setTestType(type)}
            className={`p-5 rounded-2xl border-2 font-black text-lg transition-all flex items-center justify-between ${testType === type ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-100' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
          >
            {type}
            {testType === type && <CheckCircle2 size={24} />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <button onClick={startTest} className="bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          चाचणी सुरू करा
        </button>
        <button onClick={onBack} className="text-slate-400 font-bold hover:text-slate-600 transition-colors">
          डॅशबोर्डवर परत जा
        </button>
      </div>
    </div>
  );

  if (status === 'loading') return (
    <div className="text-center py-40">
      <Loader2 className="animate-spin mx-auto mb-4 text-indigo-600" size={48} />
      <p className="font-black text-slate-500 italic uppercase tracking-widest text-sm">प्रश्न संच तयार होत आहे...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      {/* Exam Header */}
      <div className="bg-slate-900 text-white p-5 rounded-[2.5rem] flex justify-between items-center sticky top-4 z-40 shadow-2xl border border-slate-700 mb-8">
        {!isFinished && (
          <button onClick={() => confirm("बाहेर पडायचे का?") && onBack()} className="bg-slate-800 p-2 px-4 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-rose-600 transition-all uppercase tracking-widest"><ArrowLeft size={14}/> Exit</button>
        )}
        
        <div className="text-center">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{testType}</div>
          <div className="font-mono text-2xl font-black text-yellow-400">{formatTime(timeLeft)}</div>
        </div>

        {!isFinished && (
          <button onClick={() => confirm("चाचणी सबमिट करायची का?") && finishTest()} className="bg-emerald-600 p-2 px-4 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg shadow-emerald-900/40 uppercase tracking-widest"><CheckCircle2 size={14}/> Submit</button>
        )}
      </div>

      {/* चाचणीचा मुख्य भाग (आधीच्या कोडप्रमाणेच राहील) */}
      {!isFinished ? (
        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-xl border border-slate-100">
           <div className="mb-10">
              <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">{questions[currentIdx].subCategory}</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-8 leading-tight text-slate-800">
                <span className="text-indigo-600 mr-2">Q.{currentIdx + 1}</span> {questions[currentIdx].question}
              </h2>
           </div>

           <div className="grid gap-4 mb-10">
              {questions[currentIdx].options.map((opt, i) => (
                <button 
                  key={i}
                  onClick={() => { const n = [...userAnswers]; n[currentIdx] = i; setUserAnswers(n); }}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-bold text-lg flex items-center gap-4 ${userAnswers[currentIdx] === i ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 hover:bg-slate-50 text-slate-600'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${userAnswers[currentIdx] === i ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  {opt}
                </button>
              ))}
           </div>

           <div className="flex justify-between items-center pt-8 border-t border-slate-100">
              <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="font-black text-slate-400 hover:text-slate-600 disabled:opacity-0">मागे</button>
              <button onClick={() => currentIdx === questions.length - 1 ? finishTest() : setCurrentIdx(prev => prev + 1)} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100">
                {currentIdx === questions.length - 1 ? 'निकाल पहा' : 'पुढील प्रश्न'}
              </button>
           </div>
        </div>
      ) : (
        /* Result Screen (आधीच्या कोडप्रमाणेच राहील) */
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl text-center border-b-[12px] border-indigo-600">
           <Trophy size={80} className="mx-auto text-yellow-500 mb-6" />
           <h2 className="text-4xl font-black text-slate-900 mb-2">तुमचा निकाल</h2>
           <p className="text-slate-400 font-bold mb-8 uppercase tracking-widest">{testType} Mock Test</p>
           <div className="text-7xl font-black text-indigo-600 my-8">
              {userAnswers.filter((ans, i) => ans === questions[i].correctAnswerIndex).length} <span className="text-2xl text-slate-300">/ {questions.length}</span>
           </div>
           <button onClick={onBack} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black flex items-center gap-3 mx-auto shadow-2xl hover:bg-slate-800 transition-all">
              <LayoutDashboard size={24}/> डॅशबोर्डवर जा
           </button>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase'; 
import { LoadingState, QuizQuestion } from '../types';
import { 
  Clock, Trophy, CheckCircle2, ArrowLeft, ArrowRight, 
  Loader2, LayoutDashboard, Check, X, ShieldCheck, Target, 
  HelpCircle, BookOpen, AlertCircle
} from 'lucide-react';

interface MockTestModeProps { onBack: () => void; }

export function MockTestMode({ onBack }: MockTestModeProps) {
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(3600); 
  const [isFinished, setIsFinished] = useState(false);
  const [testType, setTestType] = useState('Rajyaseva');
  const timerRef = useRef<any>(null);

  const startTest = async () => {
    setStatus('loading');
    try {
      // १. परीक्षेनुसार मर्यादा आणि वेळ ठरवणे
      let limit = 100;
      let duration = 60 * 60; // Default 60 min

      if (testType === 'Rajyaseva') {
        limit = 100;
        duration = 120 * 60; // 120 min
      } else if (testType === 'Combined Group B' || testType === 'Combined Group C') {
        limit = 100;
        duration = 60 * 60; // 60 min
      } else if (testType === 'Saralseva') {
        limit = 120;
        duration = 120 * 60; // 120 min
      }

      let query = supabase.from('mock_questions').select('*');
      if (testType !== 'All') {
        query = query.eq('exam_name', testType);
      }

      const { data, error } = await query.limit(limit);
      
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
      setTimeLeft(duration);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 
      ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
      : `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // --- १. सुरूवातीचा इंटरफेस ---
  if (status === 'idle') return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-[3rem] shadow-xl border border-slate-100 text-center">
      <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Target size={40} className="text-amber-500" />
      </div>
      <h2 className="text-3xl font-black text-slate-800 mb-2">सराव परीक्षा निवडा</h2>
      
      <div className="grid grid-cols-1 gap-4 my-8">
        {[
          { id: 'Rajyaseva', label: 'राज्यसेवा (Pre)', info: '100 Q | 120 Min' },
          { id: 'Combined Group B', label: 'संयुक्त गट-ब', info: '100 Q | 60 Min' },
          { id: 'Combined Group C', label: 'संयुक्त गट-क', info: '100 Q | 60 Min' },
          { id: 'Saralseva', label: 'सरळसेवा भरती', info: '120 Q | 120 Min' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTestType(t.id)}
            className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${testType === t.id ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-100' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
          >
            <div>
              <div className={`font-black text-lg ${testType === t.id ? 'text-indigo-700' : 'text-slate-600'}`}>{t.label}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t.info}</div>
            </div>
            {testType === t.id && <CheckCircle2 size={24} className="text-indigo-600" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <button onClick={startTest} className="bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg hover:bg-indigo-700 transition-all">चाचणी सुरू करा</button>
        <button onClick={onBack} className="text-slate-400 font-bold hover:text-slate-600">मागे जा</button>
      </div>
    </div>
  );

  if (status === 'loading') return (
    <div className="text-center py-40">
      <Loader2 className="animate-spin mx-auto mb-4 text-indigo-600" size={48} />
      <p className="font-black text-slate-500 italic uppercase tracking-widest text-sm">तुमची सराव परीक्षा तयार होत आहे...</p>
    </div>
  );

  // --- २. निकाल आणि रिव्ह्यू स्क्रीन ---
  if (isFinished) {
    const score = userAnswers.filter((ans, i) => ans === questions[i].correctAnswerIndex).length;
    const attempted = userAnswers.filter(ans => ans !== -1).length;
    const unattempted = questions.length - attempted;

    return (
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl text-center border-b-[12px] border-indigo-600 mb-10">
          <Trophy size={60} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-3xl font-black text-slate-900 uppercase">चाचणी पूर्ण झाली!</h2>
          
          <div className="grid grid-cols-3 gap-4 my-10">
            <div className="bg-slate-50 p-6 rounded-3xl">
              <div className="text-3xl font-black text-indigo-600">{score}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">एकूण गुण</div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-3xl">
              <div className="text-3xl font-black text-emerald-600">{attempted}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">सोडवलेले</div>
            </div>
            <div className="bg-rose-50 p-6 rounded-3xl">
              <div className="text-3xl font-black text-rose-600">{unattempted}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">राहून गेलेले</div>
            </div>
          </div>

          <button onClick={onBack} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 mx-auto">
            <LayoutDashboard size={20}/> डॅशबोर्डवर जा
          </button>
        </div>

        {/* Detailed Review Section */}
        <h3 className="text-2xl font-black text-slate-800 mb-6 px-4">प्रश्नांचे विश्लेषण (Review)</h3>
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className={`bg-white p-8 rounded-[2.5rem] border-2 shadow-sm ${userAnswers[idx] === q.correctAnswerIndex ? 'border-emerald-100' : userAnswers[idx] === -1 ? 'border-slate-100' : 'border-rose-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black px-3 py-1 bg-slate-100 rounded-lg text-slate-500 uppercase italic">प्रश्न {idx + 1}</span>
                {userAnswers[idx] === -1 ? (
                  <span className="text-amber-500 font-black text-[10px] uppercase flex items-center gap-1"><AlertCircle size={12}/> सोडवला नाही</span>
                ) : userAnswers[idx] === q.correctAnswerIndex ? (
                  <span className="text-emerald-500 font-black text-[10px] uppercase flex items-center gap-1"><Check size={12}/> बरोबर उत्तर</span>
                ) : (
                  <span className="text-rose-500 font-black text-[10px] uppercase flex items-center gap-1"><X size={12}/> चुकीचे उत्तर</span>
                )}
              </div>
              
              <h4 className="text-lg font-bold text-slate-800 mb-6">{q.question}</h4>
              
              <div className="grid gap-2 mb-6">
                {q.options.map((opt, i) => (
                  <div key={i} className={`p-4 rounded-xl border flex items-center justify-between text-sm font-bold ${i === q.correctAnswerIndex ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : i === userAnswers[idx] ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-slate-50 text-slate-500'}`}>
                    {opt}
                    {i === q.correctAnswerIndex && <Check size={16}/>}
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl text-xs">
                <div className="flex items-center gap-2 text-indigo-400 font-black uppercase mb-2">
                  <BookOpen size={14}/> स्पष्टीकरण
                </div>
                <p className="text-slate-300 leading-relaxed font-medium">{q.explanation || 'स्पष्टीकरण उपलब्ध नाही.'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- ३. चाचणी सुरू असतानाचा इंटरफेस ---
  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      <div className="bg-slate-900 text-white p-5 rounded-[2.5rem] flex justify-between items-center sticky top-4 z-40 shadow-2xl border border-slate-700 mb-8">
        <button onClick={() => confirm("बाहेर पडायचे का?") && onBack()} className="bg-slate-800 p-2 px-4 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-rose-600 transition-all uppercase tracking-widest"><ArrowLeft size={14}/> Exit</button>
        <div className="text-center">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{testType}</div>
          <div className={`font-mono text-2xl font-black ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-yellow-400'}`}>{formatTime(timeLeft)}</div>
        </div>
        <button onClick={() => confirm("चाचणी सबमिट करायची का?") && finishTest()} className="bg-emerald-600 p-2 px-4 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg uppercase tracking-widest"><CheckCircle2 size={14}/> Submit</button>
      </div>

      {/* Question Navigation Bubbles */}
      <div className="flex flex-wrap gap-2 mb-6 px-4">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${currentIdx === i ? 'bg-indigo-600 text-white scale-110' : userAnswers[i] !== -1 ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 border border-slate-100'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

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
          <div className="text-slate-300 font-bold text-sm">{currentIdx + 1} / {questions.length}</div>
          <button onClick={() => currentIdx === questions.length - 1 ? finishTest() : setCurrentIdx(prev => prev + 1)} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:scale-105 transition-all">
            {currentIdx === questions.length - 1 ? 'निकाल पहा' : 'पुढील प्रश्न'}
          </button>
        </div>
      </div>
    </div>
  );
}

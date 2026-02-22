import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase'; 
import { LoadingState, QuizQuestion } from '../types';
import { 
  Trophy, CheckCircle2, ArrowLeft, Loader2, LayoutDashboard, 
  Check, X, Target, BookOpen, AlertCircle, Clock
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

  // १. चाचणी सुरू करणे (RPC - Random Questions)
  const startTest = async () => {
    setStatus('loading');
    try {
      let limit = 100;
      let duration = 60 * 60;

      if (testType === 'Rajyaseva') { limit = 100; duration = 120 * 60; }
      else if (testType === 'Saralseva') { limit = 120; duration = 120 * 60; }
      else { limit = 100; duration = 60 * 60; }

      const { data, error } = await supabase.rpc('get_random_mock_questions', {
        exam_filter: testType,
        row_limit: limit
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        alert("या परीक्षेसाठी सध्या प्रश्न उपलब्ध नाहीत!");
        setStatus('idle');
        return;
      }

      const formatted = data.map((q: any) => ({
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
      setCurrentIdx(0);
      setIsFinished(false);
      setStatus('success');
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { finishTest(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      console.error("Error:", e);
      setStatus('error');
    }
  };

  // २. चाचणी संपवणे आणि निकाल सेव्ह करणे
  const finishTest = async () => {
    clearInterval(timerRef.current);
    setIsFinished(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const score = userAnswers.filter((ans, i) => ans === questions[i].correctAnswerIndex).length;
    const attemptedCount = userAnswers.filter(ans => ans !== -1).length;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_results').insert([{
          user_id: user.id,
          test_type: testType,
          score: score,
          total_questions: questions.length,
          correct_answers: score,
          wrong_answers: attemptedCount - score
        }]);
      }
    } catch (err) {
      console.error("Result save error:", err);
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` : `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // --- ३. निकाल आणि सविस्तर विश्लेषण स्क्रीन ---
  if (isFinished) {
    const score = userAnswers.filter((ans, i) => ans === questions[i].correctAnswerIndex).length;
    const attempted = userAnswers.filter(ans => ans !== -1).length;

    return (
      <div className="max-w-4xl mx-auto px-4 pb-20">
        {/* स्कोअर कार्ड */}
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl text-center border-b-[12px] border-indigo-600 mb-10 mt-10">
          <Trophy size={60} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-3xl font-black text-slate-900 uppercase">चाचणी पूर्ण झाली!</h2>
          <div className="grid grid-cols-3 gap-4 my-10">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="text-3xl font-black text-indigo-600">{score}/{questions.length}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">गुण</div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
              <div className="text-3xl font-black text-emerald-600">{attempted}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">सोडवलेले</div>
            </div>
            <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
              <div className="text-3xl font-black text-rose-600">{questions.length - attempted}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">बाकी</div>
            </div>
          </div>
          <button onClick={onBack} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 mx-auto shadow-xl hover:bg-slate-800 transition-all">
            <LayoutDashboard size={20}/> डॅशबोर्डवर जा
          </button>
        </div>

        <h3 className="text-2xl font-black text-slate-800 mb-8 px-4 flex items-center gap-2">
            <BookOpen className="text-indigo-600" /> प्रश्नांचे विश्लेषण (Review)
        </h3>

        {/* रिव्ह्यू लिस्ट */}
        <div className="space-y-10">
          {questions.map((q, idx) => {
            const isCorrect = userAnswers[idx] === q.correctAnswerIndex;
            const isUnattempted = userAnswers[idx] === -1;

            return (
              <div key={idx} className={`bg-white p-8 rounded-[2.5rem] border-2 shadow-sm ${isCorrect ? 'border-emerald-100 shadow-emerald-50' : isUnattempted ? 'border-slate-100' : 'border-rose-100 shadow-rose-50'}`}>
                
                {/* स्टेटस बॅज */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black px-4 py-1.5 bg-slate-900 text-white rounded-full uppercase tracking-widest">प्रश्न {idx + 1}</span>
                  {isCorrect ? (
                    <span className="text-emerald-600 font-black text-xs uppercase flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100"> <CheckCircle2 size={16}/> बरोबर </span>
                  ) : isUnattempted ? (
                    <span className="text-amber-500 font-black text-xs uppercase flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100"> <AlertCircle size={16}/> सोडवला नाही </span>
                  ) : (
                    <span className="text-rose-600 font-black text-xs uppercase flex items-center gap-1.5 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100"> <X size={16}/> चुकीचे उत्तर </span>
                  )}
                </div>

                <h4 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">{q.question}</h4>
                
                {/* तुलना विभाग: तुमचे उत्तर vs बरोबर उत्तर */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className={`p-5 rounded-2xl border-2 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : isUnattempted ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-200'}`}>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">तुमचे उत्तर:</p>
                    <p className={`font-bold ${isCorrect ? 'text-emerald-700' : isUnattempted ? 'text-slate-500 italic' : 'text-rose-700'}`}>
                      {isUnattempted ? 'दिले नाही' : q.options[userAnswers[idx]]}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl border-2 bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-100">
                    <p className="text-[10px] font-black uppercase text-emerald-600 mb-2">अचूक उत्तर:</p>
                    <p className="font-bold text-emerald-800">{q.options[q.correctAnswerIndex]}</p>
                  </div>
                </div>

                {/* स्पष्टीकरण बॉक्स */}
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2.5rem] relative overflow-hidden">
                  <div className="flex items-center gap-2 text-indigo-700 font-black uppercase text-[10px] mb-3 tracking-widest">
                    <BookOpen size={16}/> सविस्तर स्पष्टीकरण:
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium italic">
                    {q.explanation || 'या प्रश्नाचे स्पष्टीकरण सध्या उपलब्ध नाही.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- मुख्य चाचणी इंटरफेस ---
  if (status === 'success') return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      <div className="bg-slate-900 text-white p-5 rounded-[2.5rem] flex justify-between items-center sticky top-4 z-40 shadow-2xl border border-slate-700 mb-8">
        <button onClick={() => confirm("बाहेर पडायचे?") && onBack()} className="bg-slate-800 p-2 px-4 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-rose-600 uppercase transition-all tracking-widest"><ArrowLeft size={14}/> Exit</button>
        <div className="text-center">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{testType}</div>
          <div className={`font-mono text-2xl font-black ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-yellow-400'}`}>{formatTime(timeLeft)}</div>
        </div>
        <button onClick={() => confirm("चाचणी सबमिट करायची का?") && finishTest()} className="bg-emerald-600 p-2 px-4 rounded-xl text-[10px] font-black flex items-center gap-2 uppercase tracking-widest shadow-lg"><CheckCircle2 size={14}/> Submit</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 px-4">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrentIdx(i)} className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${currentIdx === i ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200' : userAnswers[i] !== -1 ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-300 border border-slate-100'}`}>
            {i + 1}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-xl border border-slate-100">
        <div className="mb-10">
          <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">{questions[currentIdx].subCategory}</span>
          <h2 className="text-2xl md:text-3xl font-bold mt-8 text-slate-800 leading-tight"><span className="text-indigo-600 mr-2">Q.{currentIdx + 1}</span> {questions[currentIdx].question}</h2>
        </div>

        <div className="grid gap-4 mb-10">
          {questions[currentIdx].options.map((opt: string, i: number) => (
            <button key={i} onClick={() => { const n = [...userAnswers]; n[currentIdx] = i; setUserAnswers(n); }}
              className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-bold text-lg flex items-center gap-4 ${userAnswers[currentIdx] === i ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-50 hover:bg-slate-50 text-slate-600'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${userAnswers[currentIdx] === i ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{String.fromCharCode(65 + i)}</div>
              {opt}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-slate-100">
          <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="font-black text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all uppercase tracking-widest text-xs">मागे</button>
          <div className="text-slate-300 font-bold text-sm tracking-widest">{currentIdx + 1} / {questions.length}</div>
          <button onClick={() => currentIdx === questions.length - 1 ? finishTest() : setCurrentIdx(prev => prev + 1)} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:scale-105 transition-all uppercase tracking-widest text-xs">
            {currentIdx === questions.length - 1 ? 'निकाल पहा' : 'पुढील प्रश्न'}
          </button>
        </div>
      </div>
    </div>
  );

  // --- सिलेक्शन स्क्रीन (Idle) ---
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
          <button key={t.id} onClick={() => setTestType(t.id)} className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${testType === t.id ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-100' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}>
            <div>
              <div className={`font-black text-lg ${testType === t.id ? 'text-indigo-700' : 'text-slate-600'}`}>{t.label}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t.info}</div>
            </div>
            {testType === t.id && <CheckCircle2 size={24} className="text-indigo-600" />}
          </button>
        ))}
      </div>
      <button onClick={startTest} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg hover:bg-indigo-700 transition-all uppercase tracking-widest">चाचणी सुरू करा</button>
      <button onClick={onBack} className="mt-6 text-slate-400 font-bold hover:text-slate-600 transition-all uppercase tracking-widest text-xs">मागे जा</button>
    </div>
  );

  if (status === 'loading') return (
    <div className="text-center py-40">
      <Loader2 className="animate-spin mx-auto mb-4 text-indigo-600" size={48} />
      <p className="font-black text-slate-500 italic uppercase tracking-widest text-sm">तुमची सराव चाचणी तयार होत आहे...</p>
    </div>
  );

  return null;
}

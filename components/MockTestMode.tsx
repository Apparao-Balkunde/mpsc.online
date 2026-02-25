import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase'; 
import { LoadingState, QuizQuestion } from '../types';
import { 
  Trophy, CheckCircle2, ArrowLeft, Loader2, LayoutDashboard, 
  Check, X, Target, BookOpen, Heart, Coffee
} from 'lucide-react';

interface MockTestModeProps { onBack: () => void; }

const SupportModule = ({ title }: { title: string }) => {
  const [amt, setAmt] = useState<string>("");
  const [hasPaid, setHasPaid] = useState(false);
  const currentAmt = amt && parseFloat(amt) > 0 ? amt : "0";

  // UPI Deep Link तयार करणे
  const upiLink = `upi://pay?pa=apparaobalkunde901@oksbi&pn=Apparao%20Bal%20kunde&am=${currentAmt}&cu=INR`;

  if (hasPaid) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-[2.5rem] text-center animate-in zoom-in duration-500 mb-6">
        <div className="bg-emerald-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200">
          <Check size={24} className="text-white" />
        </div>
        <h3 className="text-lg font-black text-emerald-800 uppercase tracking-tight">धन्यवाद! ❤️</h3>
        <p className="text-[11px] font-bold text-emerald-600 leading-tight mt-1">
          तुमच्या ₹{amt} च्या योगदानाबद्दल आम्ही आभारी आहोत!
        </p>
        <button onClick={() => { setHasPaid(false); setAmt(""); }} className="mt-4 text-[10px] font-black text-emerald-700 uppercase underline decoration-2">पुन्हा सपोर्ट करा</button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm mb-6 relative group">
      <div className="flex items-center gap-2 mb-2">
        <Heart size={16} className="text-rose-500 fill-rose-500 animate-pulse" />
        <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{title}</h3>
      </div>
      
      <p className="text-[10px] text-slate-500 mb-4 font-bold italic leading-tight">
        "तुमचा सपोर्ट, माझं मोटिव्हेशन!" – खालील बटण दाबून थेट ॲपवरून पेमेंट करा.
      </p>

      {/* रक्कम टाकण्यासाठी इनपुट */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
        <input 
          type="number" 
          inputMode="decimal"
          value={amt}
          placeholder="रक्कम टाका"
          className="w-full bg-white border-2 border-slate-100 rounded-xl pl-7 pr-3 py-2 font-black text-indigo-600 outline-none focus:border-indigo-400 text-sm transition-all shadow-inner"
          onChange={(e) => setAmt(e.target.value)}
        />
      </div>

      {/* मोबाईल युजर्ससाठी डायरेक्ट पेमेंट बटण */}
      {parseFloat(currentAmt) > 0 ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <a 
            href={upiLink}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest"
          >
            <Coffee size={16} /> GPay / PhonePe ने पे करा
          </a>
          
          <div className="flex items-center gap-4 my-2">
            <div className="h-[1px] bg-slate-100 flex-1"></div>
            <span className="text-[9px] font-black text-slate-300 uppercase">किंवा क्यूआर स्कॅन करा</span>
            <div className="h-[1px] bg-slate-100 flex-1"></div>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-sm border border-indigo-50 flex justify-center">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`} 
              alt="QR Code" 
              className="w-24 h-24"
            />
          </div>

          <button 
            onClick={() => setHasPaid(true)}
            className="w-full mt-2 bg-emerald-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
          >
            मी पेमेंट केले आहे ✅
          </button>
        </div>
      ) : (
        <div className="text-center p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">सपोर्ट करण्यासाठी रक्कम टाका</p>
        </div>
      )}
    </div>
  );
};
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
      let limit = 100;
      let duration = 3600;
      if (testType === 'Rajyaseva') { limit = 100; duration = 7200; }
      else if (testType === 'Saralseva') { limit = 120; duration = 7200; }

      const { data, error } = await supabase.rpc('get_random_mock_questions', {
        exam_filter: testType,
        row_limit: limit
      });

      if (error) throw error;
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
      setStatus('success');
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { finishTest(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (e) { setStatus('error'); }
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
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` : `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // --- १. निकाल रिव्ह्यू स्क्रीन ---
  if (isFinished) {
    const score = userAnswers.filter((ans, i) => ans === questions[i].correctAnswerIndex).length;
    const attempted = userAnswers.filter(ans => ans !== -1).length;

    return (
      <div className="max-w-4xl mx-auto px-4 pb-20 mt-10">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl text-center border-b-[12px] border-indigo-600 mb-10">
          <Trophy size={60} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-3xl font-black text-slate-900 uppercase">चाचणी निकाल</h2>
          <div className="grid grid-cols-3 gap-4 my-10">
            <div className="bg-slate-50 p-6 rounded-3xl">
              <div className="text-3xl font-black text-indigo-600">{score}/{questions.length}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">गुण</div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-3xl text-emerald-600">
              <div className="text-3xl font-black">{attempted}</div>
              <div className="text-[10px] font-black uppercase tracking-widest">दिलेली उत्तरे</div>
            </div>
            <div className="bg-rose-50 p-6 rounded-3xl text-rose-600">
              <div className="text-3xl font-black">{questions.length - score}</div>
              <div className="text-[10px] font-black uppercase tracking-widest">चुकीची</div>
            </div>
          </div>
          <button onClick={onBack} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 mx-auto transition-all hover:scale-105 shadow-xl">
            <LayoutDashboard size={20}/> डॅशबोर्डवर जा
          </button>
        </div>

        {/* --- तिसरी जागा: रिव्ह्यू लिस्ट सुरू होण्यापूर्वी --- */}
        <SupportModule title="तुम्हाला ही चाचणी आवडली का?" />

        <h3 className="text-2xl font-black text-slate-800 mb-8 px-4 flex items-center gap-2">
            <BookOpen className="text-indigo-600" /> सर्व प्रश्नांचे विश्लेषण
        </h3>

        <div className="space-y-12">
          {questions.map((q, idx) => {
            const userAnswer = userAnswers[idx];
            const isCorrect = userAnswer === q.correctAnswerIndex;
            return (
              <div key={idx} className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-3 ${userAnswer === -1 ? 'bg-slate-200' : isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <div className="flex justify-between items-start mb-6 ml-2">
                  <span className="bg-slate-900 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase">प्रश्न {idx + 1}</span>
                  {userAnswer === -1 ? <span className="text-amber-500 text-xs font-black uppercase italic bg-amber-50 px-3 py-1 rounded-lg">सोडला</span> : 
                   isCorrect ? <span className="text-emerald-600 text-xs font-black uppercase bg-emerald-50 px-3 py-1 rounded-lg flex items-center gap-1"><Check size={14}/> बरोबर</span> : 
                   <span className="text-rose-600 text-xs font-black uppercase bg-rose-50 px-3 py-1 rounded-lg flex items-center gap-1"><X size={14}/> चुकीचे</span>}
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-8 ml-2">{q.question}</h4>
                <div className="grid gap-3 mb-8 ml-2">
                  {q.options.map((opt, optIdx) => {
                    const isActuallyCorrect = q.correctAnswerIndex === optIdx;
                    return (
                      <div key={optIdx} className={`p-5 rounded-2xl border-2 flex items-center justify-between font-bold transition-all ${isActuallyCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${isActuallyCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{String.fromCharCode(65 + optIdx)}</span>
                          {opt}
                        </div>
                        {isActuallyCorrect && <CheckCircle2 className="text-emerald-500" size={20} />}
                      </div>
                    );
                  })}
                </div>
                <div className="bg-indigo-50/80 border border-indigo-100 p-6 rounded-[2rem] ml-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-black uppercase text-[10px] mb-3"><BookOpen size={16}/> स्पष्टीकरण:</div>
                  <p className="text-slate-700 leading-relaxed font-medium italic">{q.explanation || 'स्पष्टीकरण उपलब्ध नाही.'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- २. ऍक्टिव्ह टेस्ट इंटरफेस ---
  if (status === 'success') return (
    <div className="max-w-7xl mx-auto px-4 pb-20 mt-4">
      <div className="bg-slate-900 text-white p-5 rounded-[2.5rem] flex justify-between items-center sticky top-4 z-40 shadow-2xl border border-slate-700 mb-8">
        <button onClick={() => confirm("बाहेर पडायचे?") && onBack()} className="bg-slate-800 p-2 px-4 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-rose-600 uppercase transition-all tracking-widest shadow-lg"><ArrowLeft size={14}/> Exit</button>
        <div className="text-center">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{testType}</div>
          <div className={`font-mono text-2xl font-black ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-yellow-400'}`}>{formatTime(timeLeft)}</div>
        </div>
        <button onClick={() => confirm("सबमिट करायची का?") && finishTest()} className="bg-emerald-600 p-2 px-4 rounded-xl text-[10px] font-black flex items-center gap-2 uppercase tracking-widest shadow-lg"><CheckCircle2 size={14}/> Submit</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-80 order-2 lg:order-1">
          {/* --- दुसरी जागा: प्रोग्रेस डॉट्सच्या वर --- */}
          <SupportModule title="आम्हाला सपोर्ट करा" />

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-32">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">प्रश्नावली ({questions.length})</h3>
            <div className="grid grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {questions.map((_, i) => (
                <button key={i} onClick={() => setCurrentIdx(i)} className={`h-10 w-full rounded-xl text-[10px] font-bold transition-all ${currentIdx === i ? 'bg-indigo-600 text-white scale-110 shadow-lg ring-2 ring-indigo-100' : userAnswers[i] !== -1 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>{i + 1}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 order-1 lg:order-2">
          <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-xl border border-slate-100 min-h-[550px] flex flex-col justify-between">
            <div>
              <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{questions[currentIdx].subCategory}</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-8 text-slate-800 leading-tight">
                <span className="text-indigo-600 mr-2">Q.{currentIdx + 1}</span> {questions[currentIdx].question}
              </h2>
              <div className="grid gap-4 mt-10">
                {questions[currentIdx].options.map((opt: string, i: number) => (
                  <button key={i} onClick={() => { const n = [...userAnswers]; n[currentIdx] = i; setUserAnswers(n); }}
                    className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-bold text-lg flex items-center gap-4 ${userAnswers[currentIdx] === i ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-50 hover:bg-slate-50 text-slate-600'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${userAnswers[currentIdx] === i ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{String.fromCharCode(65 + i)}</div>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center pt-10 mt-10 border-t border-slate-100">
              <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="font-black text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all uppercase tracking-widest text-xs">मागे</button>
              <div className="text-slate-300 font-bold text-sm tracking-widest">{currentIdx + 1} / {questions.length}</div>
              <button onClick={() => currentIdx === questions.length - 1 ? finishTest() : setCurrentIdx(prev => prev + 1)} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-xs">{currentIdx === questions.length - 1 ? 'निकाल पहा' : 'पुढील प्रश्न'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- ३. सिलेक्शन स्क्रीन ---
  if (status === 'idle') return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-8 md:p-12">
        <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Target size={40} className="text-amber-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-8 text-center uppercase tracking-tight">सराव परीक्षा निवडा</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="grid grid-cols-1 gap-4">
            {['Rajyaseva', 'Combined Group B', 'Combined Group C', 'Saralseva'].map((id) => (
              <button key={id} onClick={() => setTestType(id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all flex items-center justify-between ${testType === id ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-50 bg-slate-50 hover:bg-slate-100'}`}>
                <span className={`font-black text-lg ${testType === id ? 'text-indigo-700' : 'text-slate-600'}`}>{id} Exam</span>
                {testType === id && <CheckCircle2 size={24} className="text-indigo-600" />}
              </button>
            ))}
          </div>

          {/* --- पहिली जागा: सिलेक्शनच्या शेजारी --- */}
          <div className="h-full">
            <SupportModule title="तुम्ही पेमेंट करू इच्छिता?" />
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
               <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                 "सपोर्ट करणे पूर्णपणे ऐच्छिक आहे. तुमच्या मदतीमुळे आम्हाला असेच दर्जेदार प्रश्न संच मोफत उपलब्ध करून देण्यास प्रेरणा मिळते!"
               </p>
            </div>
          </div>
        </div>

        <button onClick={startTest} className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest mt-10 hover:scale-[1.02]">चाचणी सुरू करा</button>
      </div>
    </div>
  );

  if (status === 'loading') return (
    <div className="text-center py-40">
      <Loader2 className="animate-spin mx-auto mb-4 text-indigo-600" size={48} />
      <p className="font-black text-slate-500 italic uppercase tracking-widest text-sm">प्रिया, तुमची सराव चाचणी तयार होत आहे...</p>
    </div>
  );

  return null;
}

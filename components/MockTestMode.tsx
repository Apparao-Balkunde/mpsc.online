
// Fix: Corrected property access and type assignments for CachedResponse.
import React, { useState, useEffect, useRef } from 'react';
import { ExamType, LoadingState, QuizQuestion, SubjectFocus } from '../types';
import { generateMockTest } from '../services/gemini';
import { STANDARD_RAJYASEVA_MOCK, STANDARD_COMBINED_MOCK } from '../services/localData';
import { ShieldCheck, Timer, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2, Save, Send, Eye, Copy, Check, Settings2, SlidersHorizontal, LayoutGrid, RotateCcw, Zap, Database, Cloud } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MockTestModeProps {
  onBack: () => void;
}

export const MockTestMode: React.FC<MockTestModeProps> = ({ onBack }) => {
  const [examType, setExamType] = useState<ExamType>('RAJYASEVA');
  const [questionCount, setQuestionCount] = useState(10);
  const [subjectFocus, setSubjectFocus] = useState<SubjectFocus>('BALANCED');
  const [testSource, setTestSource] = useState<'AI' | 'LOCAL'>('LOCAL');
  
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTest = async (forceLocal = false) => {
    setStatus('loading');
    setQuestions([]);
    
    try {
      if (testSource === 'LOCAL' || forceLocal) {
          await new Promise(r => setTimeout(r, 600));
          const data = examType === 'RAJYASEVA' ? [...STANDARD_RAJYASEVA_MOCK] : [...STANDARD_COMBINED_MOCK];
          setQuestions(data);
          setUserAnswers(new Array(data.length).fill(-1));
          setTimeLeft(data.length * 90);
          setStatus('success');
      } else {
          // AI Mode with Batching (Handled in service)
          const result = await generateMockTest(examType, questionCount, subjectFocus);
          if (!result || result.data.length === 0) throw new Error("Generation failed");
          
          setQuestions(result.data);
          setUserAnswers(new Array(result.data.length).fill(-1));
          setTimeLeft(result.data.length * 90); 
          setStatus('success');
      }
      
      setIsFinished(false);
      setCurrentIdx(0);
      startTimer();
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getScore = () => {
    let correct = 0;
    userAnswers.forEach((ans, idx) => {
      if (ans === questions[idx]?.correctAnswerIndex) correct++;
    });
    return correct;
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  useEffect(() => {
    if (examType === 'RAJYASEVA') {
        setQuestionCount(20); 
    } else {
        setQuestionCount(10);
    }
  }, [examType]);

  if (status === 'error') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border-2 border-red-100 rounded-3xl p-10 text-center shadow-2xl">
            <AlertCircle size={64} className="mx-auto mb-6 text-red-500 animate-pulse" />
            <h2 className="text-3xl font-black text-slate-900 mb-4">AI Connection Issue</h2>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed font-medium">
                AI सर्व्हरला तांत्रिक मर्यादा येत आहेत. घाबरू नका! 
                पुन्हा प्रयत्न करा किंवा आमचा <strong>Offline Standard Paper</strong> निवडा.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <button onClick={() => setStatus('idle')} className="bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all">
                    Settings
                </button>
                <button onClick={() => startTest(true)} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl transition-all">
                    <Database size={20}/> Start Offline Paper
                </button>
            </div>
        </div>
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="p-10 bg-indigo-700 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 -rotate-12 translate-x-1/4 -translate-y-1/4">
                <Database size={200} />
            </div>
            <ShieldCheck size={56} className="mx-auto mb-4 text-yellow-400 relative z-10" />
            <h2 className="text-4xl font-black mb-2 relative z-10 tracking-tight">MPSC Exam Center</h2>
            <p className="text-indigo-100 relative z-10 font-medium">Auto-Saving Papers for Offline Success</p>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <button 
                onClick={() => setExamType('RAJYASEVA')}
                className={`p-6 rounded-2xl border-2 text-left transition-all relative group ${examType === 'RAJYASEVA' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
              >
                <h3 className="font-black text-xl mb-1 text-indigo-900">Rajyaseva (राज्यसेवा)</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">GS Pattern</p>
                {examType === 'RAJYASEVA' && <div className="absolute top-4 right-4 text-indigo-600"><CheckCircle2 size={24} /></div>}
              </button>
              
              <button 
                onClick={() => setExamType('GROUP_B')}
                className={`p-6 rounded-2xl border-2 text-left transition-all relative group ${examType === 'GROUP_B' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
              >
                <h3 className="font-black text-xl mb-1 text-indigo-900">Combined (गट-ब/क)</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mixed Pattern</p>
                {examType === 'GROUP_B' && <div className="absolute top-4 right-4 text-indigo-600"><CheckCircle2 size={24} /></div>}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => setTestSource('LOCAL')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 font-black transition-all ${testSource === 'LOCAL' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300'}`}
                >
                    <Database size={20} />
                    <div className="text-left">
                        <div className="text-sm">Standard Paper</div>
                        <div className="text-[10px] opacity-80 uppercase tracking-tighter">Fast & Offline</div>
                    </div>
                </button>
                <button 
                    onClick={() => setTestSource('AI')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 font-black transition-all ${testSource === 'AI' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                >
                    <Cloud size={20} />
                    <div className="text-left">
                        <div className="text-sm">AI Smart Paper</div>
                        <div className="text-[10px] opacity-80 uppercase tracking-tighter">Unique Questions</div>
                    </div>
                </button>
            </div>

            {testSource === 'AI' && (
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6 animate-in slide-in-from-top-4 duration-300">
                 <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-indigo-900 font-black text-sm uppercase tracking-widest">
                        <Settings2 size={18} /> Mock Settings
                    </div>
                    <div className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Batch Mode Enabled</div>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-700">Questions: <span className="text-indigo-600 text-lg font-black">{questionCount}</span></label>
                    </div>
                    <input 
                        type="range" min="5" max="50" step="5" 
                        value={questionCount} 
                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                        <span>5</span>
                        <span>25</span>
                        <span>50</span>
                    </div>
                 </div>

                 {examType !== 'RAJYASEVA' && (
                 <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">Subject Mix</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['BALANCED', 'MARATHI_HEAVY', 'ENGLISH_HEAVY', 'GS_HEAVY'].map(f => (
                            <button
                                key={f}
                                onClick={() => setSubjectFocus(f as SubjectFocus)}
                                className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${subjectFocus === f ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'}`}
                            >
                                {f.replace('_HEAVY', '')}
                            </button>
                        ))}
                    </div>
                 </div>
                 )}
            </div>
            )}

            <button 
              onClick={() => startTest()}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-2xl hover:bg-black shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {testSource === 'LOCAL' ? <Database /> : <Zap className="animate-pulse" />}
              {testSource === 'LOCAL' ? 'START OFFLINE TEST' : 'GENERATE AI PAPER'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-20 text-center">
        <Loader2 className="animate-spin h-16 w-16 text-indigo-600 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-800">
            {testSource === 'AI' ? 'Smart Batching in Progress...' : 'Fetching Local Records...'}
        </h2>
        <p className="text-slate-500 mt-2 font-medium">Generating questions in small sets for maximum reliability.</p>
        <div className="mt-8 max-w-md mx-auto bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full animate-[loading_15s_ease-in-out_infinite]"></div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-6 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
            <Database size={12} /> Auto-Saving to browser cache
        </div>
        <style>{`
            @keyframes loading {
                0% { width: 0%; }
                30% { width: 40%; }
                60% { width: 75%; }
                100% { width: 95%; }
            }
        `}</style>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden sticky top-24 z-30">
          <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
             <div className="flex items-center gap-3">
               <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${testSource === 'AI' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>{testSource} Mode</span>
               <h3 className="font-bold">{isFinished ? 'Analysis' : 'Live Paper'}</h3>
             </div>
             {!isFinished && (
               <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                 <Timer size={18} className="text-yellow-400" />
                 <span className="font-mono font-black text-lg">{formatTime(timeLeft)}</span>
               </div>
             )}
          </div>
        </div>

        {isFinished ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border-4 border-indigo-100 relative overflow-hidden">
              <h1 className="text-5xl font-black text-indigo-950 mb-4">Exam Results</h1>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                 <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <div className="text-[10px] font-black text-indigo-400 uppercase mb-1">Total Questions</div>
                    <div className="text-4xl font-black text-indigo-800">{questions.length}</div>
                 </div>
                 <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                    <div className="text-[10px] font-black text-emerald-400 uppercase mb-1">Correct</div>
                    <div className="text-4xl font-black text-emerald-800">{getScore()}</div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-2xl col-span-2 md:col-span-1 border border-slate-200">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Accuracy</div>
                    <div className="text-4xl font-black text-slate-800">{questions.length > 0 ? Math.round((getScore() / questions.length) * 100) : 0}%</div>
                 </div>
              </div>
              <button onClick={() => setStatus('idle')} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all">TAKE ANOTHER TEST</button>
            </div>

            <div className="space-y-6">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                 <Eye className="text-indigo-600" /> Detailed Review
               </h3>
               {questions.map((q, idx) => (
                 <div key={idx} className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
                    <div className="flex gap-4 mb-6">
                       <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-white shrink-0 shadow-sm ${userAnswers[idx] === q.correctAnswerIndex ? 'bg-emerald-500' : 'bg-red-500'}`}>{idx + 1}</span>
                       <h4 className="text-lg font-bold text-slate-900 leading-relaxed">{q.question}</h4>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mb-6 ml-0 md:ml-12">
                       {q.options.map((opt, oIdx) => (
                         <div key={oIdx} className={`p-4 rounded-2xl border-2 text-sm font-medium ${oIdx === q.correctAnswerIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : (userAnswers[idx] === oIdx ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100 text-slate-400')}`}>
                            <span className="font-black mr-2 opacity-30">{String.fromCharCode(65 + oIdx)}</span>
                            {opt}
                         </div>
                       ))}
                    </div>
                    <div className="ml-0 md:ml-12 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Analysis</h5>
                       <div className="text-sm text-slate-700 leading-relaxed font-medium">
                          <ReactMarkdown>{q.explanation}</ReactMarkdown>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-slate-100">
            <div className="flex justify-between items-start mb-8">
               <div className="flex gap-5">
                 <span className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">{currentIdx + 1}</span>
                 <h2 className="text-2xl font-bold text-slate-900 leading-relaxed">{questions[currentIdx]?.question}</h2>
               </div>
            </div>

            <div className="space-y-3 mb-12 ml-0 md:ml-16">
               {questions[currentIdx]?.options.map((opt, oIdx) => (
                 <button 
                  key={oIdx}
                  onClick={() => {
                    const newAns = [...userAnswers];
                    newAns[currentIdx] = oIdx;
                    setUserAnswers(newAns);
                  }}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${userAnswers[currentIdx] === oIdx ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-black shadow-md' : 'border-slate-100 hover:border-slate-300 text-slate-700'}`}
                 >
                    <span className="flex items-center gap-5">
                      <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${userAnswers[currentIdx] === oIdx ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 group-hover:border-indigo-400'}`}>{String.fromCharCode(65 + oIdx)}</span>
                      {opt}
                    </span>
                    {userAnswers[currentIdx] === oIdx && <CheckCircle2 size={24} className="text-indigo-600" />}
                 </button>
               ))}
            </div>

            <div className="flex justify-between items-center pt-10 border-t border-slate-100">
               <button 
                 disabled={currentIdx === 0}
                 onClick={() => setCurrentIdx(prev => prev - 1)}
                 className="flex items-center gap-2 font-black text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
               >
                 <ArrowLeft size={20} /> PREVIOUS
               </button>
               
               {currentIdx === questions.length - 1 ? (
                 <button 
                   onClick={finishTest}
                   className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 shadow-xl transition-all flex items-center gap-2 scale-110"
                 >
                   SUBMIT PAPER <Send size={20} />
                 </button>
               ) : (
                 <button 
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                    className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl transition-all flex items-center gap-2"
                 >
                   NEXT QUESTION <ArrowRight size={20} />
                 </button>
               )}
            </div>
          </div>
        )}
      </div>

      {!isFinished && (
        <div className="w-full md:w-80 shrink-0">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sticky top-24">
             <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">Question Palette</h4>
             <div className="grid grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`h-11 rounded-xl text-xs font-black transition-all ${currentIdx === i ? 'ring-4 ring-indigo-200 scale-110 z-10' : ''} ${userAnswers[i] !== -1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    {i + 1}
                  </button>
                ))}
             </div>
             <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> Attempted</div>
                   <span>{userAnswers.filter(a => a !== -1).length}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-100 rounded-sm border border-slate-200"></div> Remaining</div>
                   <span>{questions.length - userAnswers.filter(a => a !== -1).length}</span>
                </div>
                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2">
                    <Database size={14} className="text-amber-600 shrink-0" />
                    <p className="text-[10px] text-amber-700 font-bold leading-tight uppercase tracking-tighter">This paper is automatically cached in your local datastore.</p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

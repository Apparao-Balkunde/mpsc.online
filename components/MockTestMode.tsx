
import React, { useState, useEffect, useRef } from 'react';
import { ExamType, LoadingState, QuizQuestion, SubjectFocus } from '../types';
import { generateMockTest } from '../services/gemini';
import { ShieldCheck, Timer, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2, Save, Send, Eye, Copy, Check, Settings2, SlidersHorizontal, LayoutGrid, RotateCcw, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MockTestModeProps {
  onBack: () => void;
}

export const MockTestMode: React.FC<MockTestModeProps> = ({ onBack }) => {
  const [examType, setExamType] = useState<ExamType>('RAJYASEVA');
  const [questionCount, setQuestionCount] = useState(10);
  const [subjectFocus, setSubjectFocus] = useState<SubjectFocus>('BALANCED');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTest = async (customCount?: number) => {
    const finalCount = customCount || questionCount;
    setStatus('loading');
    setQuestions([]);
    try {
      const data = await generateMockTest(examType, finalCount, subjectFocus);
      if (!data || data.length === 0) throw new Error("No data generated");
      
      setQuestions(data);
      setUserAnswers(new Array(data.length).fill(-1));
      setTimeLeft(data.length * 90); 
      setStatus('success');
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
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-10 text-center shadow-xl">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-600" />
            <h2 className="text-2xl font-black text-red-900 mb-2">Generation Limit Exceeded</h2>
            <p className="text-red-700 mb-8 max-w-md mx-auto">
                मराठीतील स्पष्टीकरणासह जास्त प्रश्न जनरेट करताना AI ला मर्यादा येऊ शकतात. 
                कृपया लहान संच (५ किंवा १० प्रश्न) निवडून पहा.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button onClick={() => setStatus('idle')} className="bg-white text-slate-700 border border-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all">
                    Change Settings
                </button>
                <button onClick={() => startTest(5)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-md transition-all">
                    <Zap size={18}/> Try 5 Questions
                </button>
                <button onClick={() => startTest(10)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-md transition-all">
                    <Zap size={18}/> Try 10 Questions
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

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="p-8 bg-indigo-700 text-white text-center">
            <ShieldCheck size={48} className="mx-auto mb-4 text-yellow-400" />
            <h2 className="text-3xl font-black mb-2">MPSC AI Mock Test</h2>
            <p className="text-indigo-100">Intelligent paper generation for your success.</p>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <button 
                onClick={() => setExamType('RAJYASEVA')}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${examType === 'RAJYASEVA' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <h3 className="font-black text-xl mb-2 text-indigo-900">Rajyaseva Prelims</h3>
                <p className="text-xs text-slate-500 mb-2">Pattern: GS Paper 1</p>
                <div className="h-1 w-full bg-indigo-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600" style={{ width: '100%' }}></div>
                </div>
              </button>
              
              <button 
                onClick={() => setExamType('GROUP_B')}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${examType === 'GROUP_B' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <h3 className="font-black text-xl mb-2 text-indigo-900">Combined B/C</h3>
                <p className="text-xs text-slate-500 mb-2">Pattern: Mixed Sub. Mock</p>
                <div className="h-1 w-full bg-emerald-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600" style={{ width: '100%' }}></div>
                </div>
              </button>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
                 <div className="flex items-center gap-2 text-indigo-900 font-black text-sm uppercase tracking-widest mb-2">
                    <Settings2 size={18} /> Mock Test Settings
                 </div>
                 
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <SlidersHorizontal size={14} /> Questions to Generate: <span className="text-indigo-600 text-lg font-black">{questionCount}</span>
                        </label>
                    </div>
                    <input 
                        type="range" 
                        min="5" 
                        max="40" 
                        step="5" 
                        value={questionCount} 
                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                        <span>5</span>
                        <span>20</span>
                        <span>40 (Max)</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                        <Zap size={12} className="text-blue-600" />
                        <p className="text-[10px] text-blue-700 font-bold italic">Small batches (5-10) generate faster and more accurately.</p>
                    </div>
                 </div>

                 {examType !== 'RAJYASEVA' && (
                 <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <LayoutGrid size={14} /> Subject Priority
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                            { id: 'BALANCED', label: 'Balanced' },
                            { id: 'MARATHI_HEAVY', label: 'Marathi' },
                            { id: 'ENGLISH_HEAVY', label: 'English' },
                            { id: 'GS_HEAVY', label: 'More GS' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setSubjectFocus(f.id as SubjectFocus)}
                                className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${subjectFocus === f.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                 </div>
                 )}
            </div>

            <button 
              onClick={() => startTest()}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-xl hover:bg-indigo-700 shadow-xl transition-all active:scale-95"
            >
              GENERATE MOCK TEST
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
        <h2 className="text-2xl font-black text-slate-800">Setting up the Exam...</h2>
        <p className="text-slate-500 mt-2">AI is preparing {questionCount} unique questions for you.</p>
        <div className="mt-8 max-w-md mx-auto bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full animate-[loading_12s_ease-in-out_infinite]"></div>
        </div>
        <p className="text-slate-400 text-[10px] mt-4 uppercase tracking-widest font-black">Scanning Pattern & Difficulty</p>
        <style>{`
            @keyframes loading {
                0% { width: 0%; }
                20% { width: 40%; }
                70% { width: 85%; }
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
               <span className="bg-indigo-600 px-2 py-0.5 rounded text-[10px] font-black">{examType}</span>
               <h3 className="font-bold">{isFinished ? 'Test Results' : 'Mock Test Live'}</h3>
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
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-10 text-center border-4 border-indigo-100">
              <h1 className="text-4xl font-black text-indigo-900 mb-4">Final Score</h1>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                 <div className="bg-indigo-50 p-6 rounded-2xl">
                    <div className="text-xs font-black text-indigo-400 uppercase">Questions</div>
                    <div className="text-4xl font-black text-indigo-800">{questions.length}</div>
                 </div>
                 <div className="bg-emerald-50 p-6 rounded-2xl">
                    <div className="text-xs font-black text-emerald-400 uppercase">Correct</div>
                    <div className="text-4xl font-black text-emerald-800">{getScore()}</div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-2xl col-span-2 md:col-span-1">
                    <div className="text-xs font-black text-slate-400 uppercase">Accuracy</div>
                    <div className="text-4xl font-black text-slate-800">{questions.length > 0 ? Math.round((getScore() / questions.length) * 100) : 0}%</div>
                 </div>
              </div>
              <button onClick={() => setStatus('idle')} className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all">TRY ANOTHER PAPER</button>
            </div>

            <div className="space-y-6">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                 <Eye className="text-indigo-600" /> Review Questions
               </h3>
               {questions.map((q, idx) => (
                 <div key={idx} className="bg-white rounded-2xl shadow-md p-8 border border-slate-200">
                    <div className="flex gap-4 mb-6">
                       <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-white shrink-0 ${userAnswers[idx] === q.correctAnswerIndex ? 'bg-emerald-500' : 'bg-red-500'}`}>{idx + 1}</span>
                       <h4 className="text-lg font-bold text-slate-900 leading-relaxed">{q.question}</h4>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mb-6 ml-12">
                       {q.options.map((opt, oIdx) => (
                         <div key={oIdx} className={`p-3 rounded-xl border-2 text-sm font-medium ${oIdx === q.correctAnswerIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : (userAnswers[idx] === oIdx ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100 text-slate-400')}`}>
                            {opt}
                         </div>
                       ))}
                    </div>
                    <div className="ml-12 bg-slate-50 p-5 rounded-xl border border-slate-200">
                       <div className="flex justify-between items-center mb-3">
                         <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Analysis</h5>
                         <button onClick={() => handleCopy(q.explanation, idx)} className="text-slate-400 hover:text-indigo-600 flex items-center gap-1">
                            {copiedIdx === idx ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            <span className="text-[10px] font-bold">{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                         </button>
                       </div>
                       <div className="text-sm text-slate-700 leading-relaxed">
                          <ReactMarkdown>{q.explanation}</ReactMarkdown>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            <div className="flex justify-between items-start mb-8">
               <div className="flex gap-4">
                 <span className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl">{currentIdx + 1}</span>
                 <h2 className="text-2xl font-bold text-slate-900 leading-relaxed">{questions[currentIdx]?.question}</h2>
               </div>
            </div>

            <div className="space-y-3 mb-12">
               {questions[currentIdx]?.options.map((opt, oIdx) => (
                 <button 
                  key={oIdx}
                  onClick={() => {
                    const newAns = [...userAnswers];
                    newAns[currentIdx] = oIdx;
                    setUserAnswers(newAns);
                  }}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${userAnswers[currentIdx] === oIdx ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-100 hover:border-slate-200 text-slate-700'}`}
                 >
                    <span className="flex items-center gap-4">
                      <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${userAnswers[currentIdx] === oIdx ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>{String.fromCharCode(65 + oIdx)}</span>
                      {opt}
                    </span>
                    {userAnswers[currentIdx] === oIdx && <CheckCircle2 size={20} className="text-indigo-600" />}
                 </button>
               ))}
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-slate-100">
               <button 
                 disabled={currentIdx === 0}
                 onClick={() => setCurrentIdx(prev => prev - 1)}
                 className="flex items-center gap-2 font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-30"
               >
                 <ArrowLeft size={18} /> Previous
               </button>
               
               {currentIdx === questions.length - 1 ? (
                 <button 
                   onClick={finishTest}
                   className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black hover:bg-emerald-700 shadow-lg flex items-center gap-2"
                 >
                   SUBMIT TEST <Send size={18} />
                 </button>
               ) : (
                 <button 
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black hover:bg-indigo-700 shadow-lg flex items-center gap-2"
                 >
                   Next Question <ArrowRight size={18} />
                 </button>
               )}
            </div>
          </div>
        )}
      </div>

      {!isFinished && (
        <div className="w-full md:w-80 shrink-0">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 sticky top-24">
             <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-4">Question Palette</h4>
             <div className="grid grid-cols-5 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`h-10 rounded-lg text-xs font-black transition-all ${currentIdx === i ? 'ring-2 ring-indigo-600 scale-110 z-10' : ''} ${userAnswers[i] !== -1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                  >
                    {i + 1}
                  </button>
                ))}
             </div>
             <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                   <div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> Attempted: {userAnswers.filter(a => a !== -1).length}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                   <div className="w-3 h-3 bg-slate-100 rounded-sm border border-slate-200"></div> Unattempted: {questions.length - userAnswers.filter(a => a !== -1).length}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

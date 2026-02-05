
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ExamType, LoadingState, QuizQuestion, SubjectFocus } from '../types';
import { generateMockTest, getCachedMockKeys } from '../services/gemini';
import { STANDARD_RAJYASEVA_MOCK, STANDARD_COMBINED_MOCK } from '../services/localData';
import { ShieldCheck, Timer, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2, Save, Send, Eye, Copy, Check, Settings2, SlidersHorizontal, LayoutGrid, RotateCcw, Zap, Database, Cloud, History, Play, Clock, ListFilter, Info, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MockTestModeProps {
  onBack: () => void;
}

export const MockTestMode: React.FC<MockTestModeProps> = ({ onBack }) => {
  const [examType, setExamType] = useState<ExamType>('RAJYASEVA');
  const [questionCount, setQuestionCount] = useState(10);
  const [subjectFocus, setSubjectFocus] = useState<SubjectFocus>('BALANCED');
  const [testSource, setTestSource] = useState<'AI' | 'LOCAL'>('LOCAL');
  const [recentPapers, setRecentPapers] = useState<string[]>([]);
  
  const [status, setStatus] = useState<LoadingState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadRecentKeys();
  }, []);

  const loadRecentKeys = async () => {
    const keys = await getCachedMockKeys();
    setRecentPapers(keys);
  };

  const startTest = async (forceLocal = false) => {
    setStatus('loading');
    setErrorMsg('');
    setQuestions([]);
    setSelectedTypeFilter('ALL');
    
    try {
      if (testSource === 'LOCAL' || forceLocal) {
          await new Promise(r => setTimeout(r, 600));
          const data = examType === 'RAJYASEVA' ? [...STANDARD_RAJYASEVA_MOCK] : [...STANDARD_COMBINED_MOCK];
          setQuestions(data);
          setFromCache(true);
          setUserAnswers(new Array(data.length).fill(-1));
          setTimeLeft(data.length * 90);
          setStatus('success');
      } else {
          const result = await generateMockTest(examType, questionCount, subjectFocus);
          if (!result || result.data.length === 0) throw new Error("Could not generate questions.");
          
          setQuestions(result.data);
          setFromCache(result.fromCache);
          setUserAnswers(new Array(result.data.length).fill(-1));
          setTimeLeft(result.data.length * 90); 
          setStatus('success');
          loadRecentKeys();
      }
      setIsFinished(false);
      setCurrentIdx(0);
      startTimer();
    } catch (e: any) {
      setErrorMsg(e.message || "An error occurred.");
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

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    questions.forEach(q => { if (q.subCategory) types.add(q.subCategory); });
    return Array.from(types).sort();
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    if (selectedTypeFilter === 'ALL') return questions;
    return questions.filter(q => q.subCategory === selectedTypeFilter);
  }, [questions, selectedTypeFilter]);

  useEffect(() => { setCurrentIdx(0); }, [selectedTypeFilter]);

  if (status === 'error') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border-2 border-red-100 rounded-3xl p-10 text-center shadow-2xl">
            <AlertCircle size={64} className="mx-auto mb-6 text-red-500" />
            <h2 className="text-3xl font-black text-slate-900 mb-4">Error Detected</h2>
            <p className="text-slate-600 mb-8">{errorMsg}</p>
            <button onClick={() => setStatus('idle')} className="bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl font-black">Back to Settings</button>
        </div>
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-2 transition-colors">
                <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
            </button>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                <div className="p-10 bg-indigo-700 text-white text-center">
                    <ShieldCheck size={56} className="mx-auto mb-4 text-yellow-400" />
                    <h2 className="text-4xl font-black mb-2">MPSC Mock Portal</h2>
                    <p className="text-indigo-100 italic">"Detailed Solutions for every attempt"</p>
                </div>
                <div className="p-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                        <button onClick={() => setExamType('RAJYASEVA')} className={`p-6 rounded-2xl border-2 text-left ${examType === 'RAJYASEVA' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-slate-50'}`}>
                            <h3 className="font-black text-xl mb-1 text-indigo-900">Rajyaseva (राज्यसेवा)</h3>
                        </button>
                        <button onClick={() => setExamType('GROUP_B')} className={`p-6 rounded-2xl border-2 text-left ${examType === 'GROUP_B' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-slate-50'}`}>
                            <h3 className="font-black text-xl mb-1 text-indigo-900">Combined (गट-ब/क)</h3>
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setTestSource('LOCAL')} className={`p-4 rounded-2xl border-2 font-black ${testSource === 'LOCAL' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>Offline Paper</button>
                        <button onClick={() => setTestSource('AI')} className={`p-4 rounded-2xl border-2 font-black ${testSource === 'AI' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>AI Generator</button>
                    </div>
                    <button onClick={() => startTest()} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-2xl shadow-2xl transition-all active:scale-95">START PAPER</button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-20 text-center">
        <Loader2 className="animate-spin h-16 w-16 text-indigo-600 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-800">Generating Analysis-Rich Paper...</h2>
        <div className="mt-8 bg-slate-100 h-2 rounded-full overflow-hidden max-w-md mx-auto">
            <div className="bg-indigo-600 h-full animate-pulse w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden sticky top-24 z-30">
          <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
             <div className="flex items-center gap-3">
               <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${fromCache ? 'bg-emerald-600' : 'bg-indigo-600'}`}>{fromCache ? 'Local Bank' : 'AI Direct'}</span>
               <h3 className="font-bold">{isFinished ? 'Post-Exam Analysis' : 'Live Mock'}</h3>
             </div>
             {!isFinished && <div className="font-mono font-black text-lg bg-slate-800 px-4 py-2 rounded-xl text-yellow-400">{formatTime(timeLeft)}</div>}
          </div>
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3 overflow-x-auto no-scrollbar">
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase shrink-0"><ListFilter size={14} /> Filter Subject:</div>
             <div className="flex gap-2">
                <button onClick={() => setSelectedTypeFilter('ALL')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 ${selectedTypeFilter === 'ALL' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>All ({questions.length})</button>
                {availableTypes.map(type => (
                  <button key={type} onClick={() => setSelectedTypeFilter(type)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 ${selectedTypeFilter === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>{type}</button>
                ))}
             </div>
          </div>
        </div>

        {isFinished ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border-4 border-indigo-100">
              <h1 className="text-5xl font-black text-indigo-950 mb-4">Exam Summary</h1>
              <div className="grid grid-cols-3 gap-6 mb-10">
                 <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <div className="text-[10px] font-black text-indigo-400 uppercase mb-1">Total</div>
                    <div className="text-4xl font-black text-indigo-800">{questions.length}</div>
                 </div>
                 <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                    <div className="text-[10px] font-black text-emerald-400 uppercase mb-1">Correct</div>
                    <div className="text-4xl font-black text-emerald-800">{getScore()}</div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Score</div>
                    <div className="text-4xl font-black text-slate-800">{Math.round((getScore() / Math.max(1, questions.length)) * 100)}%</div>
                 </div>
              </div>
              <button onClick={() => setStatus('idle')} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700">TRY ANOTHER</button>
            </div>

            <div className="space-y-8 pb-12">
               <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2 px-4">
                 <BookOpen className="text-indigo-600" /> Detailed Solutions Review
               </h3>
               {filteredQuestions.map((q, filteredIdx) => {
                 const originalIdx = questions.indexOf(q);
                 const isCorrect = userAnswers[originalIdx] === q.correctAnswerIndex;
                 return (
                 <div key={originalIdx} className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200 relative overflow-hidden">
                    {isCorrect ? <div className="absolute top-0 right-0 p-4 bg-emerald-100 text-emerald-600 font-black text-[10px] rounded-bl-xl uppercase tracking-widest">Correct Solution</div> : <div className="absolute top-0 right-0 p-4 bg-red-100 text-red-600 font-black text-[10px] rounded-bl-xl uppercase tracking-widest">Wrong Attempt</div>}
                    <div className="flex gap-4 mb-6">
                       <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-white shrink-0 shadow-sm ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>{originalIdx + 1}</span>
                       <div>
                         <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">{q.subCategory}</span>
                         <h4 className="text-lg font-bold text-slate-900 leading-relaxed">{q.question}</h4>
                       </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mb-8 ml-0 md:ml-12">
                       {q.options.map((opt, oIdx) => (
                         <div key={oIdx} className={`p-4 rounded-2xl border-2 text-sm font-medium ${oIdx === q.correctAnswerIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : (userAnswers[originalIdx] === oIdx ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100 text-slate-400')}`}>
                            <span className="font-black mr-2 opacity-30">{String.fromCharCode(65 + oIdx)}</span>
                            {opt}
                         </div>
                       ))}
                    </div>
                    <div className="ml-0 md:ml-12 bg-slate-900 p-8 rounded-3xl text-white shadow-2xl animate-in zoom-in-95">
                       <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-4">
                          <Zap className="text-yellow-400 h-6 w-6" />
                          <div>
                            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">MPSC Sarathi Academic Analysis</h5>
                            <p className="text-[10px] text-yellow-400/80 font-bold uppercase tracking-tighter italic">"Deep Dive into the Concept"</p>
                          </div>
                       </div>
                       <div className="text-base text-slate-300 leading-loose prose prose-invert prose-p:my-2 max-w-none">
                          <ReactMarkdown>{q.explanation}</ReactMarkdown>
                       </div>
                       <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between opacity-50">
                          <span className="text-[10px] font-black uppercase tracking-widest">End of Analysis</span>
                          <Info size={14} />
                       </div>
                    </div>
                 </div>
               )})}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 min-h-[500px] flex flex-col">
            {filteredQuestions.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40"><ListFilter size={80} className="mb-4 text-slate-300" /><h3 className="text-xl font-black text-slate-500">No questions found.</h3></div>
            ) : (
               <>
                <div className="flex justify-between items-start mb-8">
                   <div className="flex gap-5">
                     <div className="flex flex-col items-center gap-1 shrink-0">
                        <span className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">{questions.indexOf(filteredQuestions[currentIdx]) + 1}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Q-Pos</span>
                     </div>
                     <div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{filteredQuestions[currentIdx]?.subCategory}</span>
                        <h2 className="text-2xl font-bold text-slate-900 leading-relaxed">{filteredQuestions[currentIdx]?.question}</h2>
                     </div>
                   </div>
                </div>
                <div className="space-y-3 mb-12 ml-0 md:ml-16 flex-1">
                   {filteredQuestions[currentIdx]?.options.map((opt, oIdx) => {
                     const originalIdx = questions.indexOf(filteredQuestions[currentIdx]);
                     return (
                     <button key={oIdx} onClick={() => { const n = [...userAnswers]; n[originalIdx] = oIdx; setUserAnswers(n); }} className={`w-full text-left p-6 rounded-2xl border-2 flex items-center justify-between group ${userAnswers[originalIdx] === oIdx ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-black shadow-md' : 'border-slate-100 text-slate-700'}`}>
                        <span className="flex items-center gap-5"><span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black ${userAnswers[originalIdx] === oIdx ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>{String.fromCharCode(65 + oIdx)}</span>{opt}</span>
                     </button>
                   )})}
                </div>
                <div className="flex justify-between items-center pt-10 border-t border-slate-100 mt-auto">
                   <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="flex items-center gap-2 font-black text-slate-400 hover:text-indigo-600 disabled:opacity-30 uppercase text-sm tracking-widest"><ArrowLeft size={20} /> Prev</button>
                   <div className="text-xs font-bold text-slate-400 uppercase">Question {currentIdx + 1} of {filteredQuestions.length}</div>
                   {currentIdx === filteredQuestions.length - 1 ? (
                     <button onClick={finishTest} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl flex items-center gap-2">FINISH <Send size={20} /></button>
                   ) : (
                     <button onClick={() => setCurrentIdx(prev => prev + 1)} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl flex items-center gap-2 uppercase tracking-widest">Next <ArrowRight size={20} /></button>
                   )}
                </div>
               </>
            )}
          </div>
        )}
      </div>

      {!isFinished && (
        <div className="w-full md:w-80 shrink-0">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sticky top-24">
             <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">Navigator</h4>
             <div className="grid grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredQuestions.map((q, i) => {
                  const oIdx = questions.indexOf(q);
                  return <button key={i} onClick={() => setCurrentIdx(i)} className={`h-11 rounded-xl text-xs font-black transition-all ${currentIdx === i ? 'ring-4 ring-indigo-200 scale-110 z-10' : ''} ${userAnswers[oIdx] !== -1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>{oIdx + 1}</button>
                })}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

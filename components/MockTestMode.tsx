
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ExamType, LoadingState, QuizQuestion, SubjectFocus } from '../types';
import { generateMockTest, getCachedMockKeys } from '../services/gemini';
import { STANDARD_RAJYASEVA_MOCK, STANDARD_COMBINED_MOCK } from '../services/localData';
import { ShieldCheck, Timer, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2, Save, Send, Eye, Copy, Check, Settings2, SlidersHorizontal, LayoutGrid, RotateCcw, Zap, Database, Cloud, History, Play, Clock, ListFilter } from 'lucide-react';
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
  
  // Filtering Logic
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
          if (!result || result.data.length === 0) throw new Error("Could not generate questions. AI is busy.");
          
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
      console.error(e);
      let msg = e.message || "An unexpected error occurred.";
      if (msg.includes('429')) {
          msg = "API Quota Exceeded. Please wait 60 seconds before generating a new AI paper, or use the Offline Paper mode.";
      }
      setErrorMsg(msg);
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

  // Unique types from current question set
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    questions.forEach(q => {
      if (q.subCategory) types.add(q.subCategory);
    });
    return Array.from(types).sort();
  }, [questions]);

  // Filtered view questions
  const filteredQuestions = useMemo(() => {
    if (selectedTypeFilter === 'ALL') return questions;
    return questions.filter(q => q.subCategory === selectedTypeFilter);
  }, [questions, selectedTypeFilter]);

  // Adjust currentIdx when filter changes to prevent out-of-bounds
  useEffect(() => {
    setCurrentIdx(0);
  }, [selectedTypeFilter]);

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
            <h2 className="text-3xl font-black text-slate-900 mb-4">{errorMsg.includes('Quota') ? 'Rate Limit Reached' : 'Generation Failed'}</h2>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed font-medium">
                {errorMsg}
            </p>
            <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
                <button onClick={() => setStatus('idle')} className="flex-1 bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all">
                    Back to Settings
                </button>
                <button onClick={() => startTest(true)} className="flex-1 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-xl transition-all">
                    <Database size={20}/> Use Offline Data
                </button>
            </div>
            {errorMsg.includes('Quota') && (
                <p className="mt-6 text-xs text-slate-400 font-bold flex items-center justify-center gap-1 uppercase tracking-widest">
                    <Clock size={12} /> Suggestion: Wait 1 minute for AI refresh
                </p>
            )}
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
                <div className="p-10 bg-indigo-700 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10 -rotate-12 translate-x-1/4 -translate-y-1/4">
                        <Database size={200} />
                    </div>
                    <ShieldCheck size={56} className="mx-auto mb-4 text-yellow-400 relative z-10" />
                    <h2 className="text-4xl font-black mb-2 relative z-10 tracking-tight">MPSC Mock Portal</h2>
                    <p className="text-indigo-100 relative z-10 font-medium italic">"Smart Generation with Offline Fallback"</p>
                </div>
                
                <div className="p-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                        <button 
                            onClick={() => setExamType('RAJYASEVA')}
                            className={`p-6 rounded-2xl border-2 text-left transition-all relative group ${examType === 'RAJYASEVA' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
                        >
                            <h3 className="font-black text-xl mb-1 text-indigo-900">Rajyaseva (राज्यसेवा)</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Prelims Pattern</p>
                            {examType === 'RAJYASEVA' && <div className="absolute top-4 right-4 text-indigo-600"><CheckCircle2 size={24} /></div>}
                        </button>
                        
                        <button 
                            onClick={() => setExamType('GROUP_B')}
                            className={`p-6 rounded-2xl border-2 text-left transition-all relative group ${examType === 'GROUP_B' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
                        >
                            <h3 className="font-black text-xl mb-1 text-indigo-900">Combined (गट-ब/क)</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Combined Group Exam</p>
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
                                <div className="text-sm">Static Paper</div>
                                <div className="text-[10px] opacity-80 uppercase tracking-tighter">Instant & No API Limits</div>
                            </div>
                        </button>
                        <button 
                            onClick={() => setTestSource('AI')}
                            className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 font-black transition-all ${testSource === 'AI' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                        >
                            <Cloud size={20} />
                            <div className="text-left">
                                <div className="text-sm">AI Generator</div>
                                <div className="text-[10px] opacity-80 uppercase tracking-tighter">Unique AI Content</div>
                            </div>
                        </button>
                    </div>

                    {testSource === 'AI' && (
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2 text-indigo-900 font-black text-sm uppercase tracking-widest">
                                <Settings2 size={18} /> Mock Configurations
                            </div>
                            <div className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                <History size={10} /> Auto-Caching
                            </div>
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
                        </div>

                        {examType !== 'RAJYASEVA' && (
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700">Focus Area</label>
                            <div className="grid grid-cols-2 gap-2">
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
                    {testSource === 'LOCAL' ? 'START OFFLINE SET' : 'GENERATE AI PAPER'}
                    </button>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                        <History size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Library</h4>
                        <p className="text-[10px] text-slate-400 font-bold">Stored generated papers</p>
                    </div>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {recentPapers.length === 0 ? (
                        <div className="text-center py-10 opacity-30">
                            <Cloud size={48} className="mx-auto mb-2" />
                            <p className="text-xs font-black">No AI Papers Stored</p>
                        </div>
                    ) : (
                        recentPapers.map((key, idx) => {
                            const parts = key.split('_');
                            const type = parts[2] || 'RAJYASEVA';
                            const count = parts[3] || '10';
                            const focus = parts[4] || 'BALANCED';
                            return (
                                <button
                                    key={idx}
                                    onClick={async () => {
                                        setExamType(type as ExamType);
                                        setQuestionCount(parseInt(count));
                                        setSubjectFocus(focus as SubjectFocus);
                                        setTestSource('AI');
                                        await new Promise(r => setTimeout(r, 100));
                                        startTest();
                                    }}
                                    className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{type}</span>
                                            <span className="text-sm font-bold text-slate-700">{count} Qs • {focus}</span>
                                        </div>
                                        <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Play size={14} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
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
        <h2 className="text-2xl font-black text-slate-800">
            {testSource === 'AI' ? 'Assembling AI Paper...' : 'Loading Offline Paper...'}
        </h2>
        <p className="text-slate-500 mt-2 font-medium italic">"Checking your Local Database first..."</p>
        <div className="mt-8 max-w-md mx-auto bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full animate-[loading_10s_ease-in-out_infinite]"></div>
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
               <h3 className="font-bold">{isFinished ? 'Analysis' : 'Live Mock'}</h3>
             </div>
             {!isFinished && (
               <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                 <Timer size={18} className="text-yellow-400" />
                 <span className="font-mono font-black text-lg">{formatTime(timeLeft)}</span>
               </div>
             )}
          </div>
          
          {/* Filtering UI */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3 overflow-x-auto no-scrollbar">
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                <ListFilter size={14} /> Filter Subject:
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedTypeFilter('ALL')}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap border-2 transition-all ${selectedTypeFilter === 'ALL' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                >
                  All ({questions.length})
                </button>
                {availableTypes.map(type => (
                  <button 
                    key={type}
                    onClick={() => setSelectedTypeFilter(type)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap border-2 transition-all ${selectedTypeFilter === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                  >
                    {type} ({questions.filter(q => q.subCategory === type).length})
                  </button>
                ))}
             </div>
          </div>
        </div>

        {isFinished ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border-4 border-indigo-100">
              <h1 className="text-5xl font-black text-indigo-950 mb-4">Exam Summary</h1>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                 <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <div className="text-[10px] font-black text-indigo-400 uppercase mb-1">Total</div>
                    <div className="text-4xl font-black text-indigo-800">{questions.length}</div>
                 </div>
                 <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                    <div className="text-[10px] font-black text-emerald-400 uppercase mb-1">Correct</div>
                    <div className="text-4xl font-black text-emerald-800">{getScore()}</div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-2xl col-span-2 md:col-span-1 border border-slate-200">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Score</div>
                    <div className="text-4xl font-black text-slate-800">{Math.round((getScore() / Math.max(1, questions.length)) * 100)}%</div>
                 </div>
              </div>
              <button onClick={() => setStatus('idle')} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all">TRY ANOTHER</button>
            </div>

            <div className="space-y-6">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 px-4">
                 <Eye className="text-indigo-600" /> Answer Key & Review {selectedTypeFilter !== 'ALL' && <span className="text-sm font-bold text-indigo-400">(Filtered: {selectedTypeFilter})</span>}
               </h3>
               {filteredQuestions.map((q, filteredIdx) => {
                 // Find the original index for correct numbering and answer lookup
                 const originalIdx = questions.indexOf(q);
                 return (
                 <div key={originalIdx} className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
                    <div className="flex gap-4 mb-6">
                       <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-white shrink-0 shadow-sm ${userAnswers[originalIdx] === q.correctAnswerIndex ? 'bg-emerald-500' : 'bg-red-500'}`}>{originalIdx + 1}</span>
                       <div>
                         <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">{q.subCategory}</span>
                         <h4 className="text-lg font-bold text-slate-900 leading-relaxed">{q.question}</h4>
                       </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mb-6 ml-0 md:ml-12">
                       {q.options.map((opt, oIdx) => (
                         <div key={oIdx} className={`p-4 rounded-2xl border-2 text-sm font-medium ${oIdx === q.correctAnswerIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : (userAnswers[originalIdx] === oIdx ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100 text-slate-400')}`}>
                            <span className="font-black mr-2 opacity-30">{String.fromCharCode(65 + oIdx)}</span>
                            {opt}
                         </div>
                       ))}
                    </div>
                    <div className="ml-0 md:ml-12 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Logic Analysis</h5>
                       <div className="text-sm text-slate-700 leading-relaxed font-medium prose prose-sm max-w-none">
                          <ReactMarkdown>{q.explanation}</ReactMarkdown>
                       </div>
                    </div>
                 </div>
               )})}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 min-h-[500px] flex flex-col">
            {filteredQuestions.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40">
                  <ListFilter size={80} className="mb-4 text-slate-300" />
                  <h3 className="text-xl font-black text-slate-500">No questions found for this subject.</h3>
                  <p className="text-sm">Try another filter or view "All".</p>
               </div>
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
                     <button 
                      key={oIdx}
                      onClick={() => {
                        const newAns = [...userAnswers];
                        newAns[originalIdx] = oIdx;
                        setUserAnswers(newAns);
                      }}
                      className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${userAnswers[originalIdx] === oIdx ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-black shadow-md' : 'border-slate-100 hover:border-slate-300 text-slate-700'}`}
                     >
                        <span className="flex items-center gap-5">
                          <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${userAnswers[originalIdx] === oIdx ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 group-hover:border-indigo-400'}`}>{String.fromCharCode(65 + oIdx)}</span>
                          {opt}
                        </span>
                        {userAnswers[originalIdx] === oIdx && <CheckCircle2 size={24} className="text-indigo-600" />}
                     </button>
                   )})}
                </div>

                <div className="flex justify-between items-center pt-10 border-t border-slate-100 mt-auto">
                   <button 
                     disabled={currentIdx === 0}
                     onClick={() => setCurrentIdx(prev => prev - 1)}
                     className="flex items-center gap-2 font-black text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors uppercase text-sm tracking-widest"
                   >
                     <ArrowLeft size={20} /> Prev
                   </button>
                   
                   <div className="text-xs font-bold text-slate-400 uppercase">
                      Question {currentIdx + 1} of {filteredQuestions.length}
                   </div>

                   {currentIdx === filteredQuestions.length - 1 ? (
                     <button 
                       onClick={finishTest}
                       className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 shadow-xl transition-all flex items-center gap-2 scale-110"
                     >
                       FINISH <Send size={20} />
                     </button>
                   ) : (
                     <button 
                        onClick={() => setCurrentIdx(prev => prev + 1)}
                        className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl transition-all flex items-center gap-2 uppercase tracking-widest"
                     >
                       Next <ArrowRight size={20} />
                     </button>
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
                  const originalIdx = questions.indexOf(q);
                  return (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`h-11 rounded-xl text-xs font-black transition-all ${currentIdx === i ? 'ring-4 ring-indigo-200 scale-110 z-10' : ''} ${userAnswers[originalIdx] !== -1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    {originalIdx + 1}
                  </button>
                )})}
             </div>
             <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> Answered</div>
                   <span>{userAnswers.filter(a => a !== -1).length} / {questions.length}</span>
                </div>
                {fromCache && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-2">
                        <Database size={14} className="text-emerald-600 shrink-0" />
                        <p className="text-[9px] text-emerald-700 font-bold leading-tight uppercase">Loaded from Browser Memory.</p>
                    </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

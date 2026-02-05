
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ExamType, LoadingState, QuizQuestion, SubjectFocus } from '../types';
import { generateMockTest, getCachedMockKeys } from '../services/gemini';
import { STANDARD_RAJYASEVA_MOCK, STANDARD_COMBINED_MOCK } from '../services/localData';
import { 
  ShieldCheck, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, 
  Loader2, Save, Send, Eye, Copy, Check, Settings2, SlidersHorizontal, 
  LayoutGrid, RotateCcw, Zap, Database, History, Play, Clock, 
  ListFilter, Info, BookOpen, GraduationCap, BrainCircuit 
} from 'lucide-react';
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
  const timerRef = useRef<any>(null);

  useEffect(() => { 
    loadRecentKeys(); 
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const loadRecentKeys = async () => {
    try {
      const keys = await getCachedMockKeys();
      setRecentPapers(keys);
    } catch (e) {
      console.error("Failed to load keys", e);
    }
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
      setErrorMsg(e.message || "An error occurred during paper generation.");
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
    userAnswers.forEach((ans, idx) => { if (ans === questions[idx]?.correctAnswerIndex) correct++; });
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
      <div className="max-w-4xl mx-auto p-6 text-center">
        <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-3xl font-black mb-4">Error Detected</h2>
        <p className="mb-8">{errorMsg}</p>
        <button onClick={() => setStatus('idle')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">Try Again</button>
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-2 transition-colors">
            <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </button>
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-12 bg-indigo-700 text-white text-center relative">
                <ShieldCheck size={64} className="mx-auto mb-6 text-yellow-400" />
                <h2 className="text-4xl font-black mb-2 tracking-tight">MPSC Mock Portal</h2>
                <p className="text-indigo-100 italic">"Detailed Marathi Analysis with Expert Summaries"</p>
            </div>
            <div className="p-10 space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                    <button onClick={() => setExamType('RAJYASEVA')} className={`p-6 rounded-2xl border-2 text-left transition-all ${examType === 'RAJYASEVA' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-slate-50'}`}>
                        <h3 className="font-black text-xl mb-1 text-indigo-900">Rajyaseva</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">State Services Prelims</p>
                    </button>
                    <button onClick={() => setExamType('GROUP_B')} className={`p-6 rounded-2xl border-2 text-left transition-all ${examType === 'GROUP_B' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-slate-50'}`}>
                        <h3 className="font-black text-xl mb-1 text-indigo-900">Combined</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Group B & C PSI/STI/ASO</p>
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setTestSource('LOCAL')} className={`p-4 rounded-2xl border-2 font-black transition-all ${testSource === 'LOCAL' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200'}`}>Standard Bank</button>
                    <button onClick={() => setTestSource('AI')} className={`p-4 rounded-2xl border-2 font-black transition-all ${testSource === 'AI' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}>AI Generator</button>
                </div>
                <button onClick={() => startTest()} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-2xl hover:bg-black shadow-2xl transition-all active:scale-[0.98]">START TEST</button>
            </div>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-20 text-center animate-in fade-in duration-300">
        <Loader2 className="animate-spin h-16 w-16 text-indigo-600 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-800">Generating Exam Paper...</h2>
        <p className="text-slate-500 mt-2">Preparing 80-90 word Marathi explanations for your review.</p>
        <div className="mt-8 bg-slate-100 h-2 rounded-full overflow-hidden max-w-sm mx-auto">
            <div className="bg-indigo-600 h-full animate-pulse w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 animate-in fade-in duration-700">
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden sticky top-24 z-30">
          <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
             <div className="flex items-center gap-3">
               <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${fromCache ? 'bg-emerald-600' : 'bg-indigo-600'}`}>{fromCache ? 'Standard' : 'Dynamic AI'}</span>
               <h3 className="font-bold">{isFinished ? 'Analysis Report' : 'In Progress'}</h3>
             </div>
             {!isFinished && <div className="font-mono font-black text-lg bg-slate-800 px-4 py-2 rounded-xl text-yellow-400 flex items-center gap-2"><Clock size={18} /> {formatTime(timeLeft)}</div>}
          </div>
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3 overflow-x-auto no-scrollbar">
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0"><ListFilter size={14} /> Subject:</div>
             <div className="flex gap-2">
                <button onClick={() => setSelectedTypeFilter('ALL')} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 transition-all ${selectedTypeFilter === 'ALL' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>All ({questions.length})</button>
                {availableTypes.map(type => (
                  <button key={type} onClick={() => setSelectedTypeFilter(type)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 transition-all ${selectedTypeFilter === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>{type}</button>
                ))}
             </div>
          </div>
        </div>

        {isFinished ? (
          <div className="space-y-12 pb-24 animate-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-12 text-center border-4 border-indigo-100">
              <h1 className="text-5xl font-black text-indigo-950 mb-6">Test Results</h1>
              <div className="grid grid-cols-3 gap-8 mb-12">
                 <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100">
                    <div className="text-[10px] font-black text-indigo-400 uppercase mb-1">Questions</div>
                    <div className="text-5xl font-black text-indigo-800">{questions.length}</div>
                 </div>
                 <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
                    <div className="text-[10px] font-black text-emerald-400 uppercase mb-1">Correct</div>
                    <div className="text-5xl font-black text-emerald-800">{getScore()}</div>
                 </div>
                 <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Accuracy</div>
                    <div className="text-5xl font-black text-slate-800">{Math.round((getScore() / Math.max(1, questions.length)) * 100)}%</div>
                 </div>
              </div>
              <button onClick={() => setStatus('idle')} className="bg-indigo-600 text-white px-16 py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">START NEW SESSION</button>
            </div>

            <div className="space-y-12">
               <div className="flex items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="bg-indigo-600 text-white p-4 rounded-2xl"><BookOpen size={32} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">Topic-Wise Analysis</h3>
                    <p className="text-slate-500 font-medium">Detailed 80-90 word Marathi summaries for each concept below.</p>
                  </div>
               </div>

               {filteredQuestions.map((q, filteredIdx) => {
                 const originalIdx = questions.indexOf(q);
                 const isCorrect = userAnswers[originalIdx] === q.correctAnswerIndex;
                 return (
                 <div key={originalIdx} className="bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-200 relative overflow-hidden group hover:border-indigo-400 transition-all">
                    {isCorrect ? <div className="absolute top-0 right-0 p-5 bg-emerald-100 text-emerald-600 font-black text-xs rounded-bl-3xl uppercase tracking-widest">Correct Answer</div> : <div className="absolute top-0 right-0 p-5 bg-red-100 text-red-600 font-black text-xs rounded-bl-3xl uppercase tracking-widest">Incorrect</div>}
                    
                    <div className="flex gap-6 mb-8">
                       <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xl shrink-0 shadow-lg ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>{originalIdx + 1}</span>
                       <div className="flex-1">
                         <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">{q.subCategory}</span>
                         </div>
                         <h4 className="text-2xl font-bold text-slate-900 leading-relaxed">{q.question}</h4>
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-12 ml-0 md:ml-16">
                       {q.options.map((opt, oIdx) => (
                         <div key={oIdx} className={`p-6 rounded-3xl border-2 text-base font-bold flex items-center gap-4 ${oIdx === q.correctAnswerIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm' : (userAnswers[originalIdx] === oIdx ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100 text-slate-400')}`}>
                            <span className="w-8 h-8 rounded-full bg-white border-2 border-inherit flex items-center justify-center text-xs shrink-0">{String.fromCharCode(65 + oIdx)}</span>
                            {opt}
                         </div>
                       ))}
                    </div>

                    <div className="ml-0 md:ml-16 space-y-6">
                        {q.mnemonic && (
                            <div className="bg-amber-100 p-8 rounded-[2.5rem] border-2 border-amber-200 flex items-start gap-5">
                                <div className="bg-amber-500 text-white p-3 rounded-2xl shadow-lg"><BrainCircuit size={28} /></div>
                                <div>
                                    <h5 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">Trick (लक्षात ठेवण्यासाठी)</h5>
                                    <p className="text-xl font-black text-amber-900 leading-tight">"{q.mnemonic}"</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-900 p-12 rounded-[3rem] text-white shadow-2xl relative">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <GraduationCap size={160} />
                            </div>
                            <div className="flex items-center gap-3 mb-8 border-b border-slate-700 pb-8">
                                <Zap className="text-yellow-400 h-10 w-10" />
                                <div>
                                    <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest">Syllabus-Linked Analysis</h5>
                                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-tight italic">Detailed Analytical Summary</p>
                                </div>
                            </div>
                            <div className="text-lg text-slate-200 leading-loose prose prose-invert prose-headings:text-indigo-400 prose-headings:font-black prose-p:my-4 max-w-none font-medium">
                                <ReactMarkdown>{q.explanation}</ReactMarkdown>
                            </div>
                            <div className="mt-12 pt-8 border-t border-slate-800 flex items-center justify-between opacity-30">
                                <span className="text-[10px] font-black uppercase tracking-widest">MPSC Sarathi AI Archives</span>
                                <Info size={20} />
                            </div>
                        </div>
                    </div>
                 </div>
               )})}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] shadow-2xl p-12 border border-slate-100 min-h-[600px] flex flex-col animate-in zoom-in-95 duration-500">
            {filteredQuestions.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-30"><ListFilter size={100} className="mb-6 text-slate-300" /><h3 className="text-2xl font-black text-slate-500">No questions match filter.</h3></div>
            ) : (
               <>
                <div className="flex justify-between items-start mb-12">
                   <div className="flex gap-6">
                     <div className="flex flex-col items-center gap-2 shrink-0">
                        <span className="bg-indigo-600 text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-3xl shadow-xl">{questions.indexOf(filteredQuestions[currentIdx]) + 1}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Question</span>
                     </div>
                     <div className="pt-2">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-4 py-1 rounded-full mb-3 inline-block">{filteredQuestions[currentIdx]?.subCategory}</span>
                        <h2 className="text-3xl font-bold text-slate-900 leading-tight">{filteredQuestions[currentIdx]?.question}</h2>
                     </div>
                   </div>
                </div>
                <div className="space-y-4 mb-12 ml-0 md:ml-20 flex-1">
                   {filteredQuestions[currentIdx]?.options.map((opt, oIdx) => {
                     const originalIdx = questions.indexOf(filteredQuestions[currentIdx]);
                     return (
                     <button key={oIdx} onClick={() => { const n = [...userAnswers]; n[originalIdx] = oIdx; setUserAnswers(n); }} className={`w-full text-left p-8 rounded-3xl border-2 flex items-center justify-between group transition-all ${userAnswers[originalIdx] === oIdx ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xl scale-[1.02]' : 'border-slate-100 hover:border-slate-300 text-slate-700'}`}>
                        <span className="flex items-center gap-6"><span className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-black transition-all ${userAnswers[originalIdx] === oIdx ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 group-hover:border-indigo-400'}`}>{String.fromCharCode(65 + oIdx)}</span><span className="text-xl">{opt}</span></span>
                        {userAnswers[originalIdx] === oIdx && <CheckCircle2 size={32} className="text-indigo-600 animate-in zoom-in" />}
                     </button>
                   )})}
                </div>
                <div className="flex justify-between items-center pt-12 border-t border-slate-100 mt-auto">
                   <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="flex items-center gap-3 font-black text-slate-400 hover:text-indigo-600 disabled:opacity-20 uppercase text-sm tracking-widest transition-colors"><ArrowLeft size={24} /> Previous</button>
                   <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Q {currentIdx + 1} / {filteredQuestions.length}</div>
                   {currentIdx === filteredQuestions.length - 1 ? (
                     <button onClick={finishTest} className="bg-emerald-600 text-white px-14 py-5 rounded-2xl font-black text-xl shadow-2xl flex items-center gap-3 hover:bg-emerald-700 active:scale-95 transition-all">SUBMIT <Send size={24} /></button>
                   ) : (
                     <button onClick={() => setCurrentIdx(prev => prev + 1)} className="bg-indigo-600 text-white px-14 py-5 rounded-2xl font-black text-xl shadow-2xl flex items-center gap-3 hover:bg-indigo-700 active:scale-95 transition-all">NEXT <ArrowRight size={24} /></button>
                   )}
                </div>
               </>
            )}
          </div>
        )}
      </div>

      {!isFinished && (
        <div className="w-full md:w-80 shrink-0">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 sticky top-24 overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><LayoutGrid size={80} /></div>
             <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-8 border-b border-slate-100 pb-4">Navigator</h4>
             <div className="grid grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredQuestions.map((q, i) => {
                  const oIdx = questions.indexOf(q);
                  return (
                    <button 
                      key={i} 
                      onClick={() => setCurrentIdx(i)} 
                      className={`h-12 rounded-2xl text-xs font-black transition-all ${currentIdx === i ? 'ring-4 ring-indigo-200 scale-110 z-10' : ''} ${userAnswers[oIdx] !== -1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      {oIdx + 1}
                    </button>
                  );
                })}
             </div>
             <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> Answered</div>
                   <span>{userAnswers.filter(a => a !== -1).length} / {questions.length}</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

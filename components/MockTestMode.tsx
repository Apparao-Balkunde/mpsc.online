import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ExamType, LoadingState, QuizQuestion, SubjectFocus } from '../types';
// AI ऐवजी आता फक्त लोकल डेटा आणि स्टोरेज सेवा वापरा
import { STANDARD_RAJYASEVA_MOCK, STANDARD_COMBINED_MOCK } from '../services/localData';
import { 
  ShieldCheck, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, 
  Loader2, Send, Clock, ListFilter, Info, BookOpen, GraduationCap, BrainCircuit, LayoutGrid, Zap 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MockTestModeProps {
  onBack: () => void;
}

export function MockTestMode({ onBack }: MockTestModeProps) {
  const [examType, setExamType] = useState<ExamType>('RAJYASEVA');
  const [testSource, setTestSource] = useState<'STANDARD' | 'DYNAMIC'>('STANDARD');
  
  const [status, setStatus] = useState<LoadingState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  
  const timerRef = useRef<any>(null);

  useEffect(() => { 
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTest = async () => {
    setStatus('loading');
    setErrorMsg('');
    
    try {
      // नैसर्गिक फील येण्यासाठी छोटा डिले
      await new Promise(r => setTimeout(r, 800));
      
      const data = examType === 'RAJYASEVA' ? [...STANDARD_RAJYASEVA_MOCK] : [...STANDARD_COMBINED_MOCK];
      
      if (!data || data.length === 0) throw new Error("प्रश्न संच उपलब्ध नाही.");
      
      setQuestions(data);
      setUserAnswers(new Array(data.length).fill(-1));
      setTimeLeft(data.length * 90); // प्रति प्रश्न ९० सेकंद
      setStatus('success');
      setIsFinished(false);
      setCurrentIdx(0);
      startTimer();
    } catch (e: any) {
      setErrorMsg("पेपर लोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.");
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (status === 'error') {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-3xl font-black mb-4 font-devanagari">तांत्रिक अडचण!</h2>
        <p className="mb-8">{errorMsg}</p>
        <button onClick={() => setStatus('idle')} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">परत जा</button>
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 font-bold transition-colors">
            <ArrowLeft size={18} className="mr-2" /> डॅशबोर्डवर परत जा
        </button>
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-12 bg-indigo-800 text-white text-center relative">
                <ShieldCheck size={64} className="mx-auto mb-6 text-yellow-400" />
                <h2 className="text-4xl font-black mb-2 tracking-tight">MPSC सराव चाचणी</h2>
                <p className="text-indigo-100 italic font-devanagari">"तज्ञांनी तयार केलेले प्रश्न आणि सखोल विश्लेषण"</p>
            </div>
            <div className="p-10 space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                    <button onClick={() => setExamType('RAJYASEVA')} className={`p-6 rounded-3xl border-4 text-left transition-all ${examType === 'RAJYASEVA' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-50 bg-slate-50 opacity-60'}`}>
                        <h3 className="font-black text-2xl mb-1 text-indigo-950">राज्यसेवा</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">MPSC State Services</p>
                    </button>
                    <button onClick={() => setExamType('GROUP_B')} className={`p-6 rounded-3xl border-4 text-left transition-all ${examType === 'GROUP_B' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-50 bg-slate-50 opacity-60'}`}>
                        <h3 className="font-black text-2xl mb-1 text-indigo-950">संयुक्त परीक्षा</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">PSI / STI / ASO (Group B & C)</p>
                    </button>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">चाचणीचे स्वरूप निवडा</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setTestSource('STANDARD')} className={`p-4 rounded-xl border-2 font-black transition-all ${testSource === 'STANDARD' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500'}`}>प्रमाणित प्रश्न संच</button>
                      <button onClick={() => setTestSource('DYNAMIC')} className={`p-4 rounded-xl border-2 font-black transition-all ${testSource === 'DYNAMIC' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500'}`}>नवीन सराव संच</button>
                  </div>
                </div>

                <button onClick={startTest} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-2xl hover:bg-black shadow-2xl transition-all active:scale-[0.98] uppercase tracking-wider">परीक्षा सुरू करा</button>
            </div>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-20 text-center animate-in fade-in duration-300">
        <Loader2 className="animate-spin h-16 w-16 text-indigo-600 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-800">प्रश्नपत्रिका तयार होत आहे...</h2>
        <p className="text-slate-500 mt-2 font-medium">तुमच्यासाठी दर्जेदार मराठी स्पष्टीकरणे लोड केली जात आहेत.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 animate-in fade-in">
      <div className="flex-1 space-y-6">
        {/* Header/Timer during test */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden sticky top-24 z-30">
          <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
             <div className="flex items-center gap-3">
               <span className="px-3 py-1 bg-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">MPSC पोर्टल</span>
               <h3 className="font-bold">{isFinished ? 'निकाल आणि विश्लेषण' : 'चाचणी सुरू आहे'}</h3>
             </div>
             {!isFinished && (
               <div className="font-mono font-black text-xl bg-slate-800 px-5 py-2 rounded-xl text-yellow-400 flex items-center gap-2 border border-slate-700 shadow-inner">
                 <Clock size={20} /> {formatTime(timeLeft)}
               </div>
             )}
          </div>
          
          {/* Subject Filter */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3 overflow-x-auto no-scrollbar">
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0"><ListFilter size={14} /> विषय निवडा:</div>
             <div className="flex gap-2">
                <button onClick={() => setSelectedTypeFilter('ALL')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 transition-all ${selectedTypeFilter === 'ALL' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>सर्व ({questions.length})</button>
                {availableTypes.map(type => (
                  <button key={type} onClick={() => setSelectedTypeFilter(type)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 transition-all ${selectedTypeFilter === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}>{type}</button>
                ))}
             </div>
          </div>
        </div>

        {isFinished ? (
          <div className="space-y-12 pb-24">
            {/* Scorecard */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-12 text-center border-4 border-indigo-100">
              <h1 className="text-5xl font-black text-indigo-950 mb-6">तुमचा निकाल</h1>
              <div className="grid grid-cols-3 gap-4 md:gap-8 mb-12">
                 <div className="bg-indigo-50 p-6 md:p-8 rounded-3xl border border-indigo-100">
                    <div className="text-[10px] font-black text-indigo-400 uppercase mb-1">एकूण प्रश्न</div>
                    <div className="text-4xl md:text-5xl font-black text-indigo-800">{questions.length}</div>
                 </div>
                 <div className="bg-emerald-50 p-6 md:p-8 rounded-3xl border border-emerald-100">
                    <div className="text-[10px] font-black text-emerald-400 uppercase mb-1">बरोबर</div>
                    <div className="text-4xl md:text-5xl font-black text-emerald-800">{getScore()}</div>
                 </div>
                 <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">अचूकता</div>
                    <div className="text-4xl md:text-5xl font-black text-slate-800">{Math.round((getScore() / Math.max(1, questions.length)) * 100)}%</div>
                 </div>
              </div>
              <button onClick={() => setStatus('idle')} className="bg-indigo-600 text-white px-16 py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">नवीन परीक्षा सुरू करा</button>
            </div>

            {/* Analysis Section */}
            <div className="space-y-12">
               <div className="flex items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="bg-indigo-600 text-white p-4 rounded-2xl"><BookOpen size={32} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">विषयनिहाय विश्लेषण</h3>
                    <p className="text-slate-500 font-medium font-devanagari">खाली दिलेल्या प्रत्येक संकल्पनेचे सखोल मराठी विश्लेषण वाचा.</p>
                  </div>
               </div>

               {filteredQuestions.map((q, filteredIdx) => {
                 const originalIdx = questions.indexOf(q);
                 const isCorrect = userAnswers[originalIdx] === q.correctAnswerIndex;
                 return (
                 <div key={originalIdx} className="bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-200 relative overflow-hidden group hover:border-indigo-400 transition-all">
                    {isCorrect ? (
                      <div className="absolute top-0 right-0 p-5 bg-emerald-100 text-emerald-600 font-black text-xs rounded-bl-3xl uppercase tracking-widest">बरोबर उत्तर</div>
                    ) : (
                      <div className="absolute top-0 right-0 p-5 bg-red-100 text-red-600 font-black text-xs rounded-bl-3xl uppercase tracking-widest">चूक उत्तर</div>
                    )}
                    
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
                                    <h5 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">स्मरण युक्ती (Trick)</h5>
                                    <p className="text-xl font-black text-amber-900 leading-tight">"{q.mnemonic}"</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-900 p-12 rounded-[3rem] text-white shadow-2xl relative">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><GraduationCap size={160} /></div>
                            <div className="flex items-center gap-3 mb-8 border-b border-slate-700 pb-8">
                                <Zap className="text-yellow-400 h-10 w-10" />
                                <div>
                                    <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest tracking-widest">अभ्यासक्रम आधारित विश्लेषण</h5>
                                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-tight italic">Detailed Marathi Summary</p>
                                </div>
                            </div>
                            <div className="text-lg text-slate-200 leading-loose prose prose-invert max-w-none font-medium">
                                <ReactMarkdown>{q.explanation}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                 </div>
               )})}
            </div>
          </div>
        ) : (
          /* Quiz Interface */
          <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 border border-slate-100 min-h-[600px] flex flex-col">
            {filteredQuestions.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-30">
                 <ListFilter size={100} className="mb-6 text-slate-300" />
                 <h3 className="text-2xl font-black text-slate-500 font-devanagari">या विषयाचे प्रश्न उपलब्ध नाहीत.</h3>
               </div>
            ) : (
               <>
                <div className="flex justify-between items-start mb-12">
                   <div className="flex flex-col md:flex-row gap-6">
                     <div className="flex flex-col items-center gap-2 shrink-0">
                        <span className="bg-indigo-600 text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-3xl shadow-xl">{questions.indexOf(filteredQuestions[currentIdx]) + 1}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">प्रश्न क्र.</span>
                     </div>
                     <div className="pt-2">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-4 py-1 rounded-full mb-3 inline-block">{filteredQuestions[currentIdx]?.subCategory}</span>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{filteredQuestions[currentIdx]?.question}</h2>
                     </div>
                   </div>
                </div>
                
                <div className="space-y-4 mb-12 ml-0 md:ml-20 flex-1">
                   {filteredQuestions[currentIdx]?.options.map((opt, oIdx) => {
                     const originalIdx = questions.indexOf(filteredQuestions[currentIdx]);
                     return (
                     <button 
                        key={oIdx} 
                        onClick={() => { const n = [...userAnswers]; n[originalIdx] = oIdx; setUserAnswers(n); }} 
                        className={`w-full text-left p-6 md:p-8 rounded-3xl border-2 flex items-center justify-between group transition-all ${userAnswers[originalIdx] === oIdx ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xl scale-[1.01]' : 'border-slate-100 hover:border-slate-300 text-slate-700'}`}
                     >
                        <span className="flex items-center gap-6">
                          <span className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-black transition-all ${userAnswers[originalIdx] === oIdx ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="text-lg md:text-xl font-medium">{opt}</span>
                        </span>
                        {userAnswers[originalIdx] === oIdx && <CheckCircle2 size={32} className="text-indigo-600 animate-in zoom-in" />}
                     </button>
                   )})}
                </div>
                
                <div className="flex justify-between items-center pt-8 border-t border-slate-100 mt-auto">
                   <button 
                      disabled={currentIdx === 0} 
                      onClick={() => setCurrentIdx(prev => prev - 1)} 
                      className="flex items-center gap-3 font-black text-slate-400 hover:text-indigo-600 disabled:opacity-20 uppercase text-xs tracking-widest transition-colors"
                    >
                      <ArrowLeft size={20} /> मागे
                    </button>
                   <div className="text-sm font-black text-slate-400 uppercase tracking-widest">{currentIdx + 1} / {filteredQuestions.length}</div>
                   {currentIdx === filteredQuestions.length - 1 ? (
                     <button onClick={finishTest} className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl flex items-center gap-3 hover:bg-emerald-700 active:scale-95 transition-all">सबमिट करा <Send size={20} /></button>
                   ) : (
                     <button onClick={() => setCurrentIdx(prev => prev + 1)} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl flex items-center gap-3 hover:bg-indigo-700 active:scale-95 transition-all">पुढील प्रश्न <ArrowRight size={20} /></button>
                   )}
                </div>
               </>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Navigation */}
      {!isFinished && (
        <div className="w-full md:w-80 shrink-0">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 sticky top-24">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><LayoutGrid size={80} /></div>
             <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-8 border-b border-slate-100 pb-4">प्रश्न तालिका</h4>
             <div className="grid grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredQuestions.map((q, i) => {
                  const oIdx = questions.indexOf(q);
                  return (
                    <button 
                      key={i} 
                      onClick={() => setCurrentIdx(i)} 
                      className={`h-11 rounded-xl text-xs font-black transition-all ${currentIdx === i ? 'ring-4 ring-indigo-200 scale-110 z-10' : ''} ${userAnswers[oIdx] !== -1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      {oIdx + 1}
                    </button>
                  );
                })}
             </div>
             <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> सोडवले</div>
                   <span>{userAnswers.filter(a => a !== -1).length} / {questions.length}</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

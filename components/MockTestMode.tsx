
import React, { useState, useEffect, useRef } from 'react';
import { ExamType, LoadingState, QuizQuestion } from '../types';
import { generateMockTest } from '../services/gemini';
import { ShieldCheck, Timer, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2, Save, Send, Eye, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MockTestModeProps {
  onBack: () => void;
}

export const MockTestMode: React.FC<MockTestModeProps> = ({ onBack }) => {
  const [examType, setExamType] = useState<ExamType>('RAJYASEVA');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTest = async () => {
    setStatus('loading');
    try {
      const data = await generateMockTest(examType);
      setQuestions(data);
      setUserAnswers(new Array(data.length).fill(-1));
      setTimeLeft(examType === 'RAJYASEVA' ? 7200 : 3600); // 2 hours or 1 hour
      setStatus('success');
      startTimer();
    } catch (e) {
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
      if (ans === questions[idx].correctAnswerIndex) correct++;
    });
    return correct;
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (status === 'idle') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="p-8 bg-indigo-700 text-white text-center">
            <ShieldCheck size={48} className="mx-auto mb-4 text-yellow-400" />
            <h2 className="text-3xl font-black mb-2">MPSC Full Mock Test</h2>
            <p className="text-indigo-100">AI-generated papers based on latest exam patterns.</p>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <button 
                onClick={() => setExamType('RAJYASEVA')}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${examType === 'RAJYASEVA' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <h3 className="font-black text-xl mb-2 text-indigo-900">Rajyaseva Prelims</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• 100 Questions (GS Paper 1)</li>
                  <li>• Time: 120 Minutes</li>
                  <li>• Subject: All GS Sections</li>
                </ul>
              </button>
              
              <button 
                onClick={() => setExamType('GROUP_B')}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${examType === 'GROUP_B' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <h3 className="font-black text-xl mb-2 text-indigo-900">Combined Quick Mock</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• 10 Mixed Questions</li>
                  <li>• Time: 15 Minutes (Practice Goal)</li>
                  <li>• Marathi, English & GS</li>
                </ul>
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
              <AlertCircle className="text-amber-600 shrink-0" size={20} />
              <div className="text-sm text-amber-800">
                <strong>Instructions:</strong> Once the test starts, the timer will begin. Do not refresh the page. After submission, you will see a detailed analysis of your performance.
              </div>
            </div>

            <button 
              onClick={startTest}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-xl hover:bg-indigo-700 shadow-xl transition-all active:scale-95"
            >
              START MOCK TEST
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
        <h2 className="text-2xl font-black text-slate-800">Generating Exam Paper...</h2>
        <p className="text-slate-500 mt-2">Crafting {examType === 'RAJYASEVA' ? '100 authentic' : '10 mixed'} questions for your practice.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
      {/* Test Interface */}
      <div className="flex-1 space-y-6">
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden sticky top-24 z-30">
          <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
             <div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{examType} MOCK</span>
               <h3 className="font-bold">{isFinished ? 'Performance Analysis' : 'Exam in Progress'}</h3>
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
              <h1 className="text-4xl font-black text-indigo-900 mb-4">Result Summary</h1>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                 <div className="bg-indigo-50 p-6 rounded-2xl">
                    <div className="text-xs font-black text-indigo-400 uppercase">Total Questions</div>
                    <div className="text-4xl font-black text-indigo-800">{questions.length}</div>
                 </div>
                 <div className="bg-emerald-50 p-6 rounded-2xl">
                    <div className="text-xs font-black text-emerald-400 uppercase">Correct Answers</div>
                    <div className="text-4xl font-black text-emerald-800">{getScore()}</div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-2xl col-span-2 md:col-span-1">
                    <div className="text-xs font-black text-slate-400 uppercase">Accuracy</div>
                    <div className="text-4xl font-black text-slate-800">{Math.round((getScore() / questions.length) * 100)}%</div>
                 </div>
              </div>
              <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-black shadow-lg hover:bg-indigo-700">EXIT TEST</button>
            </div>

            <div className="space-y-6">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                 <Eye className="text-indigo-600" /> Detailed Review
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
                 <h2 className="text-2xl font-bold text-slate-900 leading-relaxed">{questions[currentIdx].question}</h2>
               </div>
            </div>

            <div className="space-y-3 mb-12">
               {questions[currentIdx].options.map((opt, oIdx) => (
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

      {/* Question Palette (Sticky) */}
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

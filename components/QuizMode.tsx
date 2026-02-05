
import React, { useState, useEffect } from 'react';
import { Subject, LoadingState, QuizQuestion, DifficultyLevel, GSSubCategory } from '../types';
import { generateQuiz } from '../services/gemini';
import { saveQuizResult } from '../services/progress';
import { HelpCircle, CheckCircle2, XCircle, Loader2, ArrowLeft, RefreshCcw, Sparkles, Search, Play, Download, Info, Eye, EyeOff, Gauge, LayoutGrid, Database, AlertTriangle, Zap, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QuizModeProps {
  initialSubject?: Subject;
  initialTopic?: string;
  onBack: () => void;
}

const SUGGESTED_TOPICS: Record<Subject, string[]> = {
  [Subject.MARATHI]: ["संधी", "समास", "प्रयोग", "अलंकार", "वृत्ते", "म्हणी व वाक्प्रचार"],
  [Subject.ENGLISH]: ["Articles", "Tenses", "Voice", "Direct/Indirect", "Clauses", "Spotting Errors"],
  [Subject.GS]: ["Fundamental Rights", "Maharashtra Rivers", "Governor Generals", "GST & Budget"]
};

export const QuizMode: React.FC<QuizModeProps> = ({ initialSubject = Subject.MARATHI, initialTopic = '', onBack }) => {
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [topic, setTopic] = useState(initialTopic);
  const [gsCategory, setGsCategory] = useState<GSSubCategory>('ALL');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  useEffect(() => {
    if (initialTopic) {
        startQuiz();
    }
  }, []);

  const startQuiz = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim()) return;
    setStatus('loading');
    try {
      const result = await generateQuiz(subject, topic, difficulty, subject === Subject.GS ? gsCategory : undefined);
      if (!result.data || result.data.length === 0) throw new Error("No questions generated");
      setQuestions(result.data);
      setFromCache(result.fromCache);
      setUserAnswers(new Array(result.data.length).fill(-1));
      setShowResults(false);
      setStatus('success');
    } catch (error) { setStatus('error'); }
  };

  const handleOptionSelect = (qIdx: number, oIdx: number) => {
    if (showResults) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const submitQuiz = () => {
    setShowResults(true);
    let score = 0;
    questions.forEach((q, idx) => { if (userAnswers[idx] === q.correctAnswerIndex) score++; });
    saveQuizResult(topic || subject, score, questions.length);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      {(status === 'idle' || status === 'error') && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
           <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center"><HelpCircle className="mr-3 text-indigo-600 h-8 w-8" /> Quiz Master</h2>
           {status === 'error' && <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 font-bold">Generation failed. Please try a different topic.</div>}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">1. Choose Subject</label>
                    <div className="space-y-2">
                        {Object.values(Subject).map(s => (
                            <button key={s} onClick={() => setSubject(s)} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${subject === s ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-600'}`}>
                                <span className="font-bold">{s}</span>
                                {subject === s && <CheckCircle2 size={18} />}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">2. Difficulty</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {(['EASY', 'MEDIUM', 'HARD'] as DifficultyLevel[]).map(l => (
                            <button key={l} onClick={() => setDifficulty(l)} className={`flex-1 py-3 text-[11px] font-black rounded-lg ${difficulty === l ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>{l}</button>
                        ))}
                    </div>
                </div>
           </div>
           <form onSubmit={startQuiz}>
                <label className="block text-xs font-black text-slate-400 uppercase mb-3">3. Pick Topic</label>
                <div className="flex flex-col md:flex-row gap-2">
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Fundamental Rights, समास..." className="flex-1 p-4 border border-slate-200 rounded-xl outline-none text-lg font-medium" />
                    <button type="submit" disabled={!topic.trim()} className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-black shadow-lg flex items-center justify-center gap-2">START <Play size={20}/></button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {SUGGESTED_TOPICS[subject]?.map(t => <button key={t} type="button" onClick={() => setTopic(t)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">{t}</button>)}
                </div>
           </form>
        </div>
      )}

      {status === 'loading' && (
        <div className="text-center py-20 bg-white rounded-2xl shadow-xl border border-slate-100">
          <Loader2 className="animate-spin h-16 w-16 text-indigo-600 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-slate-800">Generating Interactive Paper...</h3>
        </div>
      )}

      {status === 'success' && questions.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center bg-indigo-900 text-white p-5 rounded-2xl sticky top-24 z-20 shadow-2xl">
             <div className="flex items-center gap-2">
                 <Zap className="text-yellow-400" size={20} />
                 <h2 className="font-black text-xl">{topic}</h2>
             </div>
             <div className="text-right"><div className="text-2xl font-black">{userAnswers.filter(a => a !== -1).length} / {questions.length}</div></div>
          </div>
          <div className="space-y-12 pb-24">
            {showResults && (
                <div className="bg-white border-2 border-indigo-100 rounded-3xl p-10 shadow-2xl text-center">
                    <h1 className="text-4xl font-black text-indigo-950 mb-4">Quiz Completed</h1>
                    <div className="text-lg font-bold text-slate-500 mb-6">You scored {questions.filter((q, i) => userAnswers[i] === q.correctAnswerIndex).length} out of {questions.length}</div>
                    <button onClick={() => setStatus('idle')} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black">NEW TOPIC</button>
                </div>
            )}
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 group">
                <div className="flex gap-5 mb-6">
                    <span className="bg-indigo-50 text-indigo-600 w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0">{qIdx + 1}</span>
                    <h3 className="text-xl font-bold text-slate-900">{q.question}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {q.options.map((opt, oIdx) => (
                    <button key={oIdx} onClick={() => handleOptionSelect(qIdx, oIdx)} disabled={showResults} className={`text-left p-4 rounded-2xl border-2 transition-all ${userAnswers[qIdx] === oIdx ? (showResults ? (oIdx === q.correctAnswerIndex ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-red-600 bg-red-50 text-red-900') : 'border-indigo-600 bg-indigo-50 font-bold') : (showResults && oIdx === q.correctAnswerIndex ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100 text-slate-700')}`}>
                        <span className="mr-3 opacity-30 font-black">{String.fromCharCode(65 + oIdx)}</span>{opt}
                    </button>
                  ))}
                </div>
                {showResults && (
                    <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 text-slate-300 animate-in zoom-in-95 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4">
                            <BookOpen className="text-yellow-500 h-6 w-6" />
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Academic Analysis</h4>
                        </div>
                        <div className="text-base leading-relaxed prose prose-invert max-w-none">
                            <ReactMarkdown>{q.explanation}</ReactMarkdown>
                        </div>
                    </div>
                )}
              </div>
            ))}
          </div>
          {!showResults && <button onClick={submitQuiz} disabled={userAnswers.includes(-1)} className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-2xl shadow-2xl active:scale-95 disabled:opacity-50">SUBMIT PAPER</button>}
        </div>
      )}
    </div>
  );
};

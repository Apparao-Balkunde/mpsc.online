
import React, { useState, useRef } from 'react';
import { Subject, LoadingState, QuizQuestion, DifficultyLevel, GSSubCategory } from '../types';
import { generateQuiz } from '../services/gemini';
import { saveQuizResult } from '../services/progress';
import { HelpCircle, CheckCircle2, XCircle, Loader2, ArrowLeft, RefreshCcw, Sparkles, Search, Play, Download, Info, Eye, EyeOff, Gauge, LayoutGrid, Database } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ReactMarkdown from 'react-markdown';

interface QuizModeProps {
  initialSubject?: Subject;
  onBack: () => void;
}

const GS_TOPICS: Record<GSSubCategory, string[]> = {
    ALL: ["Overall GS Review", "Mixed PYQ Patterns"],
    HISTORY: ["Social Reformers of Maharashtra", "Maratha Empire", "1857 Revolt", "Governor Generals", "Ancient/Medieval Maharashtra"],
    POLITY: ["Fundamental Rights", "Parliamentary System", "Panchayat Raj", "Constitutional Amendments", "State Judiciary"],
    GEOGRAPHY: ["Rivers of Maharashtra", "Sahyadri Ranges", "Climatic Zones", "Census 2011 Highlights", "Mineral Wealth"],
    ECONOMICS: ["RBI & Banking", "National Income Concepts", "Five Year Plans", "Poverty & Unemployment Committees", "GST & Budget"],
    SCIENCE: ["Human Biology", "Physics (Light/Sound)", "Chemistry in Everyday Life", "Nutrition & Health", "Environment Basics"],
    ENVIRONMENT: ["Pollution & Control", "Biodiversity Hotspots", "International Treaties", "National Parks of Maharashtra"]
};

const SUGGESTED_TOPICS: Record<Subject, string[]> = {
  [Subject.MARATHI]: ["संधी", "समास", "प्रयोग", "अलंकार", "वृत्ते", "म्हणी व वाक्प्रचार"],
  [Subject.ENGLISH]: ["Articles", "Tenses", "Voice", "Direct/Indirect", "Clauses", "Spotting Errors"],
  [Subject.GS]: []
};

export const QuizMode: React.FC<QuizModeProps> = ({ initialSubject = Subject.MARATHI, onBack }) => {
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [topic, setTopic] = useState('');
  const [gsCategory, setGsCategory] = useState<GSSubCategory>('ALL');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const startQuiz = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim()) return;
    setStatus('loading');
    try {
      const result = await generateQuiz(subject, topic, difficulty, subject === Subject.GS ? gsCategory : undefined);
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

      {status === 'idle' && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
           <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center">
               <HelpCircle className="mr-3 text-indigo-600 h-8 w-8" /> Quiz Master
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">1. Choose Subject</label>
                    {Object.values(Subject).map(s => (
                        <button key={s} onClick={() => setSubject(s)} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${subject === s ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-600'}`}>
                            <span className="font-bold">{s}</span>
                            {subject === s && <CheckCircle2 size={18} />}
                        </button>
                    ))}
                </div>
                <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">2. Settings</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {(['EASY', 'MEDIUM', 'HARD'] as DifficultyLevel[]).map(l => (
                            <button key={l} onClick={() => setDifficulty(l)} className={`flex-1 py-2 text-[10px] font-black rounded-lg ${difficulty === l ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400'}`}>{l}</button>
                        ))}
                    </div>
                </div>
           </div>
           <form onSubmit={startQuiz}>
                <label className="block text-xs font-black text-slate-400 uppercase mb-3">3. Pick Topic</label>
                <div className="flex gap-2">
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Fundamental Rights, Tenses..." className="flex-1 p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                    <button type="submit" disabled={!topic.trim()} className="bg-indigo-600 text-white px-8 rounded-xl font-black hover:bg-indigo-700 shadow-lg flex items-center gap-2">GO <Play size={18}/></button>
                </div>
           </form>
        </div>
      )}

      {status === 'loading' && (
        <div className="text-center py-20 bg-white rounded-2xl shadow-xl">
          <Loader2 className="animate-spin h-14 w-14 text-indigo-600 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-800">Checking Offline Repository...</h3>
        </div>
      )}

      {status === 'success' && questions.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-indigo-900 text-white p-5 rounded-2xl shadow-xl sticky top-24 z-20">
             <div>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{subject}</span>
                    {fromCache && <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><Database size={10}/> LOCAL BANK</span>}
                 </div>
                 <h2 className="font-black text-xl leading-tight">{topic}</h2>
             </div>
             <div className="text-right text-xl font-black">{userAnswers.filter(a => a !== -1).length} / {questions.length}</div>
          </div>

          <div className="space-y-6">
            {showResults && (
                <div className="bg-white border-2 border-indigo-100 rounded-3xl p-10 shadow-2xl text-center">
                    <h1 className="text-4xl font-black text-indigo-950 mb-8">Exam Analysis</h1>
                    <button onClick={() => setStatus('idle')} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl transition-all">TRY NEW TOPIC</button>
                </div>
            )}
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                <div className="flex gap-5 mb-6">
                    <span className="bg-indigo-50 text-indigo-600 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg border border-indigo-100 shrink-0">{qIdx + 1}</span>
                    <h3 className="text-xl font-bold text-slate-900 leading-relaxed">{q.question}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {q.options.map((opt, oIdx) => (
                    <button key={oIdx} onClick={() => handleOptionSelect(qIdx, oIdx)} disabled={showResults} className={`text-left p-4 rounded-2xl border-2 transition-all ${userAnswers[qIdx] === oIdx ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-100 text-slate-700'}`}>{opt}</button>
                  ))}
                </div>
                {showResults && (
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                        <div className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none"><ReactMarkdown>{q.explanation}</ReactMarkdown></div>
                    </div>
                )}
              </div>
            ))}
          </div>

          {!showResults && <button onClick={submitQuiz} disabled={userAnswers.includes(-1)} className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-2xl hover:bg-emerald-700 disabled:opacity-50 shadow-2xl">SUBMIT PAPER</button>}
        </div>
      )}
    </div>
  );
};

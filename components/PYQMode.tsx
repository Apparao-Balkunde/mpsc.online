
import React, { useState, useEffect } from 'react';
import { Subject, LoadingState, QuizQuestion, ExamType, GSSubCategory } from '../types';
import { generatePYQs } from '../services/gemini';
import { History, Search, Loader2, ArrowLeft, Eye, CheckCircle2, Bookmark, Info, Calendar, Filter, BookOpen, ShieldCheck, AlertCircle, Copy, Check, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PYQModeProps {
  initialExamType?: ExamType;
  onBack: () => void;
}

const YEARS = Array.from({ length: 16 }, (_, i) => (2025 - i).toString());

const GS_SECTIONS: { label: string; value: GSSubCategory }[] = [
    { label: 'All GS (Mix)', value: 'ALL' },
    { label: 'History (इतिहास)', value: 'HISTORY' },
    { label: 'Polity (राज्यशास्त्र)', value: 'POLITY' },
    { label: 'Geography (भूगोल)', value: 'GEOGRAPHY' },
    { label: 'Economics (अर्थशास्त्र)', value: 'ECONOMICS' },
    { label: 'Science (विज्ञान)', value: 'SCIENCE' },
    { label: 'Environment (पर्यावरण)', value: 'ENVIRONMENT' }
];

export const PYQMode: React.FC<PYQModeProps> = ({ initialExamType = 'ALL', onBack }) => {
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [examType, setExamType] = useState<ExamType>(initialExamType);
  const [gsCategory, setGsCategory] = useState<GSSubCategory>('ALL');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  const [bookmarks, setBookmarks] = useState<QuizQuestion[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('mpsc_pyq_bookmarks');
    if (saved) setBookmarks(JSON.parse(saved));
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setStatus('loading');
    try {
      const result = await generatePYQs(Subject.GS, selectedYear, examType, gsCategory);
      setQuestions(result.data);
      setFromCache(result.fromCache);
      setRevealedAnswers([]);
      setStatus('success');
    } catch (e) { setStatus('error'); }
  };

  const toggleReveal = (index: number) => {
    setRevealedAnswers(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const toggleBookmark = (q: QuizQuestion) => {
    const exists = bookmarks.some(b => b.question === q.question);
    const newBookmarks = exists ? bookmarks.filter(b => b.question !== q.question) : [...bookmarks, q];
    setBookmarks(newBookmarks);
    localStorage.setItem('mpsc_pyq_bookmarks', JSON.stringify(newBookmarks));
  };

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1 flex items-center">
                <ShieldCheck className="mr-2 text-indigo-600" />
                GS PYQ Archive (2010-2025)
            </h2>
            <p className="text-slate-600 text-sm font-medium">All retrieved archives are auto-saved locally.</p>
          </div>
          {fromCache && <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-lg border border-emerald-400 animate-pulse"><Database size={12}/> DATA SOURCE: LOCAL BANK</div>}
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white items-end">
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="rounded-lg border-slate-300 border p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
          <select value={examType} onChange={(e) => setExamType(e.target.value as ExamType)} className="rounded-lg border-slate-300 border p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500"><option value="RAJYASEVA">Rajyaseva</option><option value="GROUP_B">Combined B</option><option value="GROUP_C">Combined C</option></select>
          <select value={gsCategory} onChange={(e) => setGsCategory(e.target.value as GSSubCategory)} className="rounded-lg border-slate-300 border p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500">{GS_SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
          <button onClick={fetchQuestions} className="bg-indigo-600 text-white p-2.5 rounded-lg font-bold shadow-md hover:bg-indigo-700">Fetch Archive</button>
        </div>
      </div>

      {status === 'loading' && <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-100"><Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" /><p className="text-slate-600 font-bold">Scanning Local Records...</p></div>}

      {status === 'success' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-indigo-800 font-bold text-sm">{questions.length} Items Found</span>
            <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="Filter results..." className="w-64 py-2 px-3 border border-slate-200 rounded-lg text-sm" />
          </div>
          
          {filteredQuestions.map((q, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                        <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0">{idx + 1}</span>
                        <p className="text-lg text-slate-900 font-bold leading-relaxed">{q.question}</p>
                    </div>
                    <button onClick={() => toggleBookmark(q)} className={bookmarks.some(b => b.question === q.question) ? 'text-pink-500' : 'text-slate-300'}><Bookmark size={20} fill={bookmarks.some(b => b.question === q.question) ? "currentColor" : "none"} /></button>
                </div>
                <div className="ml-12 grid md:grid-cols-2 gap-3 mb-6">
                    {q.options.map((opt, oIdx) => <div key={oIdx} className="p-3 border border-slate-200 rounded-lg text-slate-700 text-sm bg-slate-50/50">({String.fromCharCode(65 + oIdx)}) {opt}</div>)}
                </div>
                <div className="ml-12">
                    <button onClick={() => toggleReveal(idx)} className="px-5 py-2.5 rounded-lg text-sm font-bold bg-indigo-50 text-indigo-700">{revealedAnswers.includes(idx) ? 'Hide Analysis' : 'Show Answer'}</button>
                    {revealedAnswers.includes(idx) && (
                        <div className="mt-4 bg-slate-50 p-5 rounded-lg border border-slate-200"><ReactMarkdown>{q.explanation}</ReactMarkdown></div>
                    )}
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

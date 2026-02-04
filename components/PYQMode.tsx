
import React, { useState, useEffect } from 'react';
import { Subject, LoadingState, QuizQuestion, ExamType, GSSubCategory } from '../types';
import { generatePYQs } from '../services/gemini';
import { History, Search, Loader2, ArrowLeft, Eye, CheckCircle2, Bookmark, Info, Calendar, Filter, BookOpen, ShieldCheck, AlertCircle } from 'lucide-react';
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
    setQuestions([]);
    setRevealedAnswers([]);
    setSearchKeyword('');
    try {
      // Calling updated service with strict category enforcement
      const data = await generatePYQs(Subject.GS, selectedYear, examType, gsCategory);
      setQuestions(data);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
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
    q.question.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    q.explanation.toLowerCase().includes(searchKeyword.toLowerCase())
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
                Pure GS PYQ Archive (2010-2025)
            </h2>
            <p className="text-slate-600 text-sm font-medium">Authentic Section-Wise Archive. Enforced Category Integrity.</p>
          </div>
          <span className="hidden md:block text-xs bg-indigo-600 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wider">Strict Local Cache: V13</span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white items-end">
          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Exam Category</label>
             <select value={examType} onChange={(e) => setExamType(e.target.value as ExamType)} className="w-full rounded-lg border-slate-300 border p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="RAJYASEVA">Rajyaseva (राज्यसेवा)</option>
                <option value="GROUP_B">Combined B (गट-ब)</option>
                <option value="GROUP_C">Combined C (गट-क)</option>
                <option value="ALL">Other MPSC GS Exams</option>
              </select>
          </div>
          <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">GS Section (Strict)</label>
              <select value={gsCategory} onChange={(e) => setGsCategory(e.target.value as GSSubCategory)} className="w-full rounded-lg border-slate-300 border p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 bg-amber-50">
                {GS_SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full rounded-lg border-slate-300 border p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 bg-white">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={fetchQuestions} disabled={status === 'loading'} className="w-full bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition-all font-bold shadow-md flex items-center justify-center gap-2">
            {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />} Fetch Archive
          </button>
        </div>
      </div>

      {status === 'loading' && (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-100">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-bold">Accessing {gsCategory} Archives...</p>
          <p className="text-slate-400 text-xs mt-1">Filtering for ${examType} ${selectedYear}. Serving locally if already indexed.</p>
        </div>
      )}

      {status === 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-xl flex flex-col items-center gap-4">
              <AlertCircle size={48} />
              <div className="text-center">
                  <h3 className="font-bold text-xl">Download Interrupted</h3>
                  <p className="text-sm">Unable to retrieve the 100-question set. Please check your internet or try another year.</p>
              </div>
              <button onClick={fetchQuestions} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold">Retry</button>
          </div>
      )}

      {status === 'success' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center text-indigo-800 font-bold text-sm">
                <CheckCircle2 size={18} className="mr-2 text-green-600" />
                <span>Section: {gsCategory} | Found {questions.length} Questions</span>
            </div>
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="Filter these questions..." className="block w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-colors" />
            </div>
          </div>
          
          {filteredQuestions.length > 0 ? filteredQuestions.map((q, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-4">
                            <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border border-slate-200 shrink-0">{idx + 1}</span>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">{q.examSource || `${examType} ${selectedYear}`}</span>
                                    <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">{gsCategory}</span>
                                </div>
                                <p className="text-lg text-slate-900 font-bold leading-relaxed">{q.question}</p>
                            </div>
                        </div>
                        <button onClick={() => toggleBookmark(q)} className={`p-2 rounded-full transition-colors ${bookmarks.some(b => b.question === q.question) ? 'text-pink-500 bg-pink-50' : 'text-slate-300 hover:text-pink-400'}`}>
                            <Bookmark size={20} fill={bookmarks.some(b => b.question === q.question) ? "currentColor" : "none"} />
                        </button>
                    </div>
                    <div className="ml-0 md:ml-12 grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                        {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="p-3 border border-slate-200 rounded-lg text-slate-700 text-sm bg-slate-50/50 hover:bg-white transition-colors cursor-default border-l-4 hover:border-l-indigo-500">
                            <span className="font-bold mr-2 text-slate-400">({String.fromCharCode(65 + oIdx)})</span> {opt}
                        </div>
                        ))}
                    </div>
                    <div className="ml-0 md:ml-12">
                        <button onClick={() => toggleReveal(idx)} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${revealedAnswers.includes(idx) ? 'bg-slate-800 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                            <Eye size={16} /> {revealedAnswers.includes(idx) ? 'Hide Explanation' : 'Show Answer & Explanation'}
                        </button>
                        {revealedAnswers.includes(idx) && (
                            <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-3 rounded-r-lg shadow-sm">
                                    <p className="text-green-800 font-black mb-1">Correct Answer: {String.fromCharCode(65 + q.correctAnswerIndex)}</p>
                                    <p className="text-green-700 text-sm font-bold">{q.options[q.correctAnswerIndex]}</p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                    <h5 className="font-black text-slate-800 mb-3 text-xs uppercase tracking-widest flex items-center gap-2"><Info size={14} className="text-indigo-500" /> Analytical Breakdown</h5>
                                    <div className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none"><ReactMarkdown>{q.explanation}</ReactMarkdown></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          )) : <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300"><p className="text-slate-500 font-bold">No questions found matching your filter.</p></div>}
        </div>
      )}
    </div>
  );
};

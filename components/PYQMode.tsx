import React, { useState, useEffect } from 'react';
import { Subject, LoadingState, QuizQuestion, ExamType } from '../types';
import { generatePYQs } from '../services/gemini';
import { History, Search, Loader2, ArrowLeft, Eye, CheckCircle2, AlertCircle, Filter, Bookmark, X } from 'lucide-react';

interface PYQModeProps {
  onBack: () => void;
}

const YEARS = Array.from({ length: 15 }, (_, i) => (2024 - i).toString());

export const PYQMode: React.FC<PYQModeProps> = ({ onBack }) => {
  const [selectedYear, setSelectedYear] = useState<string>('2023');
  const [subject, setSubject] = useState<Subject>(Subject.MARATHI);
  const [examType, setExamType] = useState<ExamType>('ALL');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  const [bookmarks, setBookmarks] = useState<QuizQuestion[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('mpsc_pyq_bookmarks');
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }
  }, []);

  const fetchQuestions = async () => {
    setStatus('loading');
    setQuestions([]);
    setRevealedAnswers([]);
    setSearchKeyword('');
    try {
      const data = await generatePYQs(subject, selectedYear, examType);
      setQuestions(data);
      setStatus('success');
    } catch (e) {
      setStatus('error');
    }
  };

  const toggleReveal = (index: number) => {
    if (revealedAnswers.includes(index)) {
      setRevealedAnswers(revealedAnswers.filter(i => i !== index));
    } else {
      setRevealedAnswers([...revealedAnswers, index]);
    }
  };

  const toggleBookmark = (q: QuizQuestion) => {
    const exists = bookmarks.some(b => b.question === q.question);
    let newBookmarks;
    if (exists) {
        newBookmarks = bookmarks.filter(b => b.question !== q.question);
    } else {
        newBookmarks = [...bookmarks, q];
    }
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
        <div className="p-6 bg-indigo-50 border-b border-indigo-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center">
            <History className="mr-2 text-indigo-600" />
            Previous Year Questions (PYQs)
          </h2>
          <p className="text-slate-600">Review authentic MPSC questions from 2010 to current exams.</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
            <select 
              value={subject}
              onChange={(e) => setSubject(e.target.value as Subject)}
              className="w-full rounded-lg border-slate-300 border p-3 focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value={Subject.MARATHI}>Marathi (मराठी)</option>
              <option value={Subject.ENGLISH}>English</option>
              <option value={Subject.GS}>General Studies</option>
            </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">Exam Filter</label>
             <div className="relative">
                <Filter size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <select 
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as ExamType)}
                  className="w-full pl-9 rounded-lg border-slate-300 border p-3 focus:ring-2 focus:ring-indigo-500 shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                  disabled={subject === Subject.ENGLISH} // English covers all exams automatically
                  title={subject === Subject.ENGLISH ? "English covers MPSC, SSC, UPSC & CDS" : "Select MPSC Exam Type"}
                >
                  <option value="ALL">All Exams</option>
                  <option value="RAJYASEVA">Rajyaseva (State Services)</option>
                  <option value="GROUP_B">Group B (PSI/STI/ASO)</option>
                  <option value="GROUP_C">Group C (Clerk/Tax Asst)</option>
                </select>
             </div>
             {subject === Subject.ENGLISH && <p className="text-xs text-slate-500 mt-1">Includes SSC, UPSC, CDS & MPSC</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-lg border-slate-300 border p-3 focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex items-end">
            <button 
              onClick={fetchQuestions}
              disabled={status === 'loading'}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition font-semibold shadow flex items-center justify-center gap-2"
            >
              {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              Fetch Questions
            </button>
          </div>
        </div>
      </div>

      {status === 'loading' && (
        <div className="text-center py-20">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Scanning archives for {subject} questions...</p>
          <p className="text-slate-400 text-sm mt-1">Targeting {subject === Subject.ENGLISH ? 'SSC, UPSC, MPSC' : examType} sources</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex items-center gap-4">
          <AlertCircle size={32} />
          <div>
            <h4 className="font-bold">Retrieval Failed</h4>
            <p className="text-sm">We couldn't fetch questions for this selection. Please try a different year or subject.</p>
          </div>
        </div>
      )}

      {status === 'success' && questions.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center text-indigo-800 font-semibold">
                <CheckCircle2 size={18} className="mr-2" />
                <span>Found {questions.length} questions</span>
                <span className="mx-2">•</span>
                <span className="text-sm bg-indigo-100 px-3 py-1 rounded-full text-indigo-700">
                    {subject} / {selectedYear}
                </span>
            </div>
            
            <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Search keyword..."
                    className="block w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {searchKeyword && (
                    <button 
                        onClick={() => setSearchKeyword('')}
                        className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
          </div>
          
          {filteredQuestions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                  <Search size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500">No questions match your search.</p>
              </div>
          ) : (
            filteredQuestions.map((q, idx) => {
                // Find the original index to maintain correct numbering relative to the fetched set if needed, 
                // but usually simply numbering the filtered view is better UI. 
                // Let's stick to simple filtered numbering for clean look.
                const isBookmarked = bookmarks.some(b => b.question === q.question);
                return (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-start gap-3">
                            <div className="flex flex-col gap-2 shrink-0 items-center">
                                <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                </span>
                            </div>
                            <div className="flex-1">
                                {q.examSource && (
                                    <span className="inline-block text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded mb-2">
                                        {q.examSource}
                                    </span>
                                )}
                                <p className="text-lg text-slate-900 font-medium leading-relaxed">{q.question}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => toggleBookmark(q)}
                            className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-pink-500 bg-pink-50' : 'text-slate-300 hover:text-pink-400 hover:bg-slate-50'}`}
                            title={isBookmarked ? "Remove Bookmark" : "Bookmark Question"}
                        >
                            <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <div className="ml-11 grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                        {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="p-3 border border-slate-200 rounded-lg text-slate-700 text-sm bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-colors">
                            <span className="font-bold mr-2 text-slate-400">({String.fromCharCode(65 + oIdx)})</span>
                            {opt}
                        </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => toggleReveal(idx)}
                        className={`ml-11 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        revealedAnswers.includes(idx)
                        ? 'bg-slate-800 text-white'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                    >
                        <Eye size={16} />
                        {revealedAnswers.includes(idx) ? 'Hide Answer' : 'Show Answer & Explanation'}
                    </button>

                    {revealedAnswers.includes(idx) && (
                        <div className="ml-11 mt-4 animate-in slide-in-from-top-2">
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-3 rounded-r-lg">
                            <p className="text-green-800 font-bold mb-1">Correct Answer: {String.fromCharCode(65 + q.correctAnswerIndex)}</p>
                            <p className="text-green-700 text-sm font-medium">{q.options[q.correctAnswerIndex]}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h5 className="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wide">Explanation:</h5>
                            <p className="text-slate-600 text-sm leading-relaxed">{q.explanation}</p>
                        </div>
                        </div>
                    )}
                    </div>
                </div>
                );
            })
          )}
        </div>
      )}

      {status === 'success' && questions.length === 0 && (
         <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">No specific questions found for this selection. Try another year or exam type.</p>
         </div>
      )}
    </div>
  );
};
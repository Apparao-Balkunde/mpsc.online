import React, { useState, useEffect, useCallback } from 'react';
import { Subject, LoadingState, QuizQuestion, ExamType } from '../types';
import { generatePYQs } from '../services/gemini';
// 'storageService' मधून इम्पोर्ट केल्याची खात्री करा (बिल्ड एरर टाळण्यासाठी)
import { getProgress, toggleQuestionBookmark } from '../services/storageService';
import { History, Search, Loader2, ArrowLeft, Bookmark, ShieldCheck, Database, GraduationCap, Zap, BrainCircuit, Sparkles, BookA, Languages, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PYQModeProps {
  initialExamType?: ExamType;
  onBack: () => void;
}

const YEARS = Array.from({ length: 16 }, (_, i) => (2025 - i).toString());

const TOPICS_CONFIG: Record<Subject, { label: string; value: string }[]> = {
  [Subject.GS]: [
    { label: 'All GS (Mix)', value: 'ALL' },
    { label: 'History (इतिहास)', value: 'HISTORY' },
    { label: 'Polity (राज्यशास्त्र)', value: 'POLITY' },
    { label: 'Geography (भूगोल)', value: 'GEOGRAPHY' },
    { label: 'Economics (अर्थशास्त्र)', value: 'ECONOMICS' },
    { label: 'Science (विज्ञान)', value: 'SCIENCE' },
    { label: 'Environment (पर्यावरण)', value: 'ENVIRONMENT' }
  ],
  [Subject.MARATHI]: [
    { label: 'All Marathi (Mix)', value: 'ALL' },
    { label: 'Vyakaran (व्याकरण)', value: 'GRAMMAR' },
    { label: 'Samas (समास)', value: 'SAMAS' },
    { label: 'Prayog (प्रयोग)', value: 'PRAYOG' },
    { label: 'Shabdasiddhi (शब्दसिद्धी)', value: 'VOCAB' },
    { label: 'Mhani/Vakprachar (म्हणी/वाक्प्रचार)', value: 'IDIOMS' }
  ],
  [Subject.ENGLISH]: [
    { label: 'All English (Mix)', value: 'ALL' },
    { label: 'Grammar (Rules)', value: 'GRAMMAR' },
    { label: 'Vocabulary', value: 'VOCAB' },
    { label: 'Articles & Tenses', value: 'ARTICLES_TENSES' },
    { label: 'Voice & Speech', value: 'VOICE_SPEECH' },
    { label: 'One Word Substitution', value: 'ONE_WORD' }
  ]
};

export function PYQMode({ initialExamType = 'ALL', onBack }: PYQModeProps) {
  const [subject, setSubject] = useState<Subject>(Subject.GS);
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [examType, setExamType] = useState<ExamType>(initialExamType === 'ALL' ? 'RAJYASEVA' : initialExamType);
  const [topic, setTopic] = useState<string>('ALL');
  
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // १. डेटा फेचिंग लॉजिक (Memoized)
  const fetchQuestions = useCallback(async () => {
    setStatus('loading');
    setQuestions([]);
    try {
      const result = await generatePYQs(subject, selectedYear, examType, topic);
      setQuestions(result.data);
      setFromCache(result.fromCache);
      setRevealedAnswers([]);
      setStatus('success');
    } catch (e) { 
      setStatus('error'); 
    }
  }, [subject, selectedYear, examType, topic]);

  // २. सुरुवातीला डेटा लोड करणे
  useEffect(() => {
    const progress = getProgress();
    setBookmarks(progress.bookmarks.questions.map(q => q.question));
    fetchQuestions();
  }, [fetchQuestions]);

  const toggleReveal = (index: number) => {
    setRevealedAnswers(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const handleToggleBookmark = (q: QuizQuestion) => {
    const isAdded = toggleQuestionBookmark(q);
    setBookmarks(prev => isAdded ? [...prev, q.question] : prev.filter(text => text !== q.question));
  };

  const handleCopyExplanation = (q: QuizQuestion, idx: number) => {
    const textToCopy = `प्रश्न: ${q.question}\n\nउत्तर: ${q.options[q.correctAnswerIndex]}\n\nविश्लेषण:\n${q.explanation}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    q.explanation.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors font-bold">
        <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-10 bg-indigo-700 text-white relative">
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
             <History size={160} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
             <div>
                <h2 className="text-4xl font-black mb-2 flex items-center gap-4">
                    <History className="text-yellow-400" size={40} />
                    PYQ Master Archive
                </h2>
                <p className="text-indigo-100 text-lg font-medium">Authentic MPSC questions with deep context analysis.</p>
             </div>
             {fromCache && (
                <div className="bg-emerald-600/30 backdrop-blur-md text-white px-6 py-2 rounded-2xl text-[11px] font-black flex items-center gap-3 border border-emerald-400/30 shadow-2xl">
                    <Database size={16}/> LOCAL CACHE ACTIVE
                </div>
             )}
          </div>

          {/* Subject Tabs */}
          <div className="flex flex-wrap gap-3 mt-10 relative z-10">
            {Object.values(Subject).map(s => (
                <button 
                  key={s} 
                  onClick={() => { setSubject(s); setTopic('ALL'); }}
                  className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${subject === s ? 'bg-white text-indigo-700 shadow-2xl scale-105' : 'bg-indigo-600/50 text-indigo-100 hover:bg-indigo-600'}`}
                >
                    {s === Subject.MARATHI && <Languages size={14} />}
                    {s === Subject.ENGLISH && <BookA size={14} />}
                    {s === Subject.GS && <Sparkles size={14} />}
                    {s}
                </button>
            ))}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-10 relative z-10">
            <FilterSelect label="Archive Year" value={selectedYear} onChange={setSelectedYear} options={YEARS} />
            <FilterSelect 
              label="Exam Stream" 
              value={examType} 
              onChange={(v) => setExamType(v as ExamType)} 
              options={['RAJYASEVA', 'GROUP_B', 'GROUP_C']} 
            />
            <FilterSelect 
              label="Category" 
              value={topic} 
              onChange={setTopic} 
              options={TOPICS_CONFIG[subject].map(t => t.value)} 
              labels={TOPICS_CONFIG[subject].map(t => t.label)}
            />
            <button onClick={fetchQuestions} className="bg-yellow-400 text-indigo-900 py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-yellow-300 active:scale-95 transition-all flex items-center justify-center gap-2 h-[52px]">
                <Search size={18} /> Refresh Archives
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 bg-slate-50/50 min-h-[400px]">
             {status === 'loading' && (
                <div className="text-center py-32">
                    <Loader2 className="animate-spin h-20 w-20 text-indigo-600 mx-auto mb-6" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Accessing Official MPSC Archives...</p>
                </div>
             )}

             {status === 'success' && (
                <div className="space-y-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xl">{filteredQuestions.length}</div>
                            <div>
                                <h4 className="font-black text-slate-900 text-lg">Official Records Retrieved</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{subject} • {selectedYear} • {examType}</p>
                            </div>
                        </div>
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                            <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="Filter keywords..." className="w-full py-4 pl-12 pr-6 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold transition-all outline-none" />
                        </div>
                    </div>
                    
                    <div className="space-y-12 pb-24">
                        {filteredQuestions.map((q, idx) => (
                            <div key={idx} className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 p-12 hover:border-indigo-400 transition-all relative group overflow-hidden">
                                <div className="absolute top-0 left-0 w-3 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex justify-between items-start mb-10">
                                    <div className="flex gap-8">
                                        <span className="bg-slate-900 text-white w-14 h-14 rounded-[1.25rem] flex items-center justify-center font-black text-2xl shrink-0 shadow-2xl">{idx + 1}</span>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">Official {selectedYear} Question</span>
                                            </div>
                                            <p className="text-2xl text-slate-900 font-bold leading-tight">{q.question}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleToggleBookmark(q)} className={`${bookmarks.includes(q.question) ? 'text-pink-500 scale-125' : 'text-slate-200'} hover:text-pink-600 transition-all p-3`}>
                                        <Bookmark size={32} fill={bookmarks.includes(q.question) ? "currentColor" : "none"} />
                                    </button>
                                </div>
                                
                                <div className="ml-0 md:ml-22 grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="p-6 border-2 border-slate-50 rounded-3xl text-slate-800 text-lg bg-slate-50/50 font-bold flex items-center gap-4">
                                            <span className="w-10 h-10 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[12px] font-black text-slate-400 shadow-sm shrink-0">{String.fromCharCode(65 + oIdx)}</span>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="ml-0 md:ml-22 flex flex-col items-start gap-6">
                                    <button onClick={() => toggleReveal(idx)} className={`px-12 py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 ${revealedAnswers.includes(idx) ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                        {revealedAnswers.includes(idx) ? 'Close Review' : 'Detailed Analysis'}
                                        {revealedAnswers.includes(idx) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                    
                                    {revealedAnswers.includes(idx) && (
                                        <div className="w-full mt-6 space-y-8 animate-in slide-in-from-top-6 duration-500">
                                            {q.mnemonic && (
                                                <div className="bg-amber-100 p-8 rounded-[2.5rem] border-2 border-amber-200 flex items-start gap-6 shadow-sm">
                                                    <div className="bg-amber-500 text-white p-3 rounded-2xl shadow-xl shrink-0"><BrainCircuit size={28} /></div>
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Trick / लक्षात ठेवण्याची क्लृप्ती</h5>
                                                        <p className="text-xl font-black text-amber-950 italic">"{q.mnemonic}"</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="bg-slate-950 p-12 rounded-[3.5rem] border border-slate-800 text-slate-100 relative shadow-2xl overflow-hidden">
                                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><GraduationCap size={160} /></div>
                                                <div className="flex items-center justify-between mb-10 border-b border-slate-800 pb-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl"><Zap className="text-yellow-400" size={24} /></div>
                                                        <div>
                                                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Expert Explanation</h4>
                                                            <p className="text-xs text-indigo-400 font-bold uppercase tracking-tight italic">Detailed Logical Breakdown</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleCopyExplanation(q, idx)}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-black transition-all"
                                                    >
                                                        {copiedIdx === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                                        {copiedIdx === idx ? 'Copied!' : 'Copy to Notes'}
                                                    </button>
                                                </div>
                                                <div className="mb-6">
                                                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-black text-sm uppercase tracking-widest">
                                                        Correct Answer: {String.fromCharCode(65 + q.correctAnswerIndex)}
                                                    </span>
                                                </div>
                                                <div className="prose prose-invert prose-slate max-w-none text-slate-300 text-xl leading-[1.8] font-medium font-serif">
                                                    <ReactMarkdown>{q.explanation}</ReactMarkdown>
                                                </div>
                                                <div className="mt-12 pt-8 border-t border-slate-900 flex items-center justify-between opacity-30">
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Archive Logic Analysis • Sarathi AI</span>
                                                    <ShieldCheck size={24} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             )}
        </div>
      </div>
    </div>
  );
}

// हेल्पर घटक: फिल्टर सिलेक्ट
function FilterSelect({ label, value, onChange, options, labels }: { label: string, value: string, onChange: (v: string) => void, options: string[], labels?: string[] }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest ml-1">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full rounded-2xl border-none bg-white text-slate-900 p-4 text-sm font-bold shadow-lg outline-none focus:ring-4 focus:ring-yellow-400 transition-all cursor-pointer"
      >
        {options.map((opt, i) => (
          <option key={opt} value={opt}>{labels ? labels[i] : opt}</option>
        ))}
      </select>
    </div>
  );
}

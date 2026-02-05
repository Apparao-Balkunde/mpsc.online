
import React, { useState, useEffect, useMemo } from 'react';
import { Subject, VocabWord, VocabCategory, LoadingState } from '../types';
import { generateVocab, playTextToSpeech } from '../services/gemini';
import { getProgress, toggleVocabBookmark, updateVocabSRS } from '../services/progress';
import { BookA, Loader2, ArrowLeft, RotateCw, Volume2, Bookmark, Database, Sparkles, CheckCircle2, XCircle, BrainCircuit, Calendar, Play } from 'lucide-react';

interface VocabModeProps {
  onBack: () => void;
}

export const VocabMode: React.FC<VocabModeProps> = ({ onBack }) => {
  const [subject, setSubject] = useState<Subject>(Subject.ENGLISH);
  const [category, setCategory] = useState<VocabCategory>('SYNONYMS');
  const [words, setWords] = useState<VocabWord[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  
  const [isSRSReview, setIsSRSReview] = useState(false);
  const [srsReviewIdx, setSRSReviewIdx] = useState(0);
  const [showSRSMeaning, setShowSRSMeaning] = useState(false);

  const srsData = useMemo(() => {
    const progress = getProgress();
    const srs = progress.vocabSRS || {};
    const dueWords = progress.bookmarks.vocab.filter(v => {
        const item = srs[v.word];
        if (!item) return true;
        return new Date(item.nextReview) <= new Date();
    });
    return dueWords;
  }, [bookmarks, isSRSReview]);

  useEffect(() => { 
    setBookmarks(getProgress().bookmarks.vocab.map(v => v.word));
    fetchVocab(false); 
  }, [subject, category]);

  const fetchVocab = async (forceRefresh = false) => {
    setStatus('loading');
    setWords([]); 
    try {
      const result = await generateVocab(subject, category, forceRefresh);
      setWords(result.data);
      setFromCache(result.fromCache);
      setStatus('success');
    } catch (e) { setStatus('error'); }
  };

  const handlePlayAudio = async (text: string, index: number) => {
    if (playingIndex !== null) return;
    setPlayingIndex(index);
    try { await playTextToSpeech(text); } catch(e) {} finally { setPlayingIndex(null); }
  }

  const handleToggleBookmark = (word: VocabWord) => {
    const isAdded = toggleVocabBookmark(word);
    if (isAdded) {
      setBookmarks(prev => [...prev, word.word]);
    } else {
      setBookmarks(prev => prev.filter(w => w !== word.word));
    }
  };

  const handleSRSResponse = (success: boolean) => {
    const word = srsData[srsReviewIdx].word;
    updateVocabSRS(word, success);
    if (srsReviewIdx < srsData.length - 1) {
        setSRSReviewIdx(prev => prev + 1);
        setShowSRSMeaning(false);
    } else {
        setIsSRSReview(false);
        setSRSReviewIdx(0);
        setShowSRSMeaning(false);
        setBookmarks(getProgress().bookmarks.vocab.map(v => v.word));
    }
  };

  if (isSRSReview) {
      const currentWord = srsData[srsReviewIdx];
      return (
          <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in zoom-in-95 duration-500">
               <div className="flex justify-between items-center mb-10">
                    <button onClick={() => setIsSRSReview(false)} className="flex items-center text-slate-500 hover:text-indigo-600 font-black uppercase text-xs tracking-widest"><ArrowLeft size={16} className="mr-1" /> Exit Session</button>
                    <div className="bg-indigo-600 text-white px-6 py-2 rounded-2xl font-black text-xs">REVIEW {srsReviewIdx + 1} / {srsData.length}</div>
               </div>

               <div className="bg-white rounded-[3rem] shadow-2xl p-16 text-center border-4 border-indigo-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><BrainCircuit size={180} /></div>
                    <div className="mb-10">
                        <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Flashcard Mode</span>
                        <h2 className="text-6xl font-black text-slate-900 mb-2">{currentWord.word}</h2>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{currentWord.type}</p>
                    </div>

                    {!showSRSMeaning ? (
                        <button onClick={() => setShowSRSMeaning(true)} className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black text-xl shadow-2xl hover:bg-black transition-all">REVEAL MEANING</button>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100">
                                <p className="text-3xl font-bold text-indigo-900 mb-2">{currentWord.meaning}</p>
                                <p className="text-slate-600 italic">"{currentWord.usage}"</p>
                            </div>
                            <div className="flex gap-4 justify-center">
                                <button onClick={() => handleSRSResponse(false)} className="bg-red-500 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-red-600 active:scale-95 transition-all"><XCircle /> FORGOT</button>
                                <button onClick={() => handleSRSResponse(true)} className="bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-emerald-600 active:scale-95 transition-all"><CheckCircle2 /> REMEMBERED</button>
                            </div>
                        </div>
                    )}
               </div>
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-80 space-y-6 shrink-0 sticky top-24">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-6 bg-indigo-900 text-white">
                    <h2 className="text-xl font-black flex items-center gap-3"><BookA size={24} className="text-yellow-400" /> Vocabulary Archive</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Subject</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setSubject(Subject.MARATHI)} className={`py-3 rounded-xl text-sm font-black transition-all ${subject === Subject.MARATHI ? 'bg-orange-100 text-orange-700 border-2 border-orange-400' : 'bg-slate-50 text-slate-600 border-2 border-transparent'}`}>Marathi</button>
                            <button onClick={() => setSubject(Subject.ENGLISH)} className={`py-3 rounded-xl text-sm font-black transition-all ${subject === Subject.ENGLISH ? 'bg-blue-100 text-blue-700 border-2 border-blue-400' : 'bg-slate-50 text-slate-600 border-2 border-transparent'}`}>English</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Study Focus</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value as VocabCategory)} className="w-full p-3.5 border-2 border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all">
                          <option value="SYNONYMS">Synonyms (समानार्थी)</option>
                          <option value="ANTONYMS">Antonyms (विरुद्धार्थी)</option>
                          <option value="IDIOMS">Idioms & Phrases</option>
                          <option value="ONE_WORD">One Word Substitution</option>
                        </select>
                    </div>
                    <button onClick={() => fetchVocab(true)} disabled={status === 'loading'} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors shadow-2xl">
                        {status === 'loading' ? <Loader2 className="animate-spin" size={18}/> : <RotateCw size={18} />} Refresh List
                    </button>
                </div>
            </div>

            <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform"><BrainCircuit size={100} /></div>
                <h3 className="font-black text-xs uppercase tracking-widest mb-2 text-indigo-200">Spaced Repetition</h3>
                <h2 className="text-2xl font-black mb-4">SRS Review</h2>
                <div className="flex items-center justify-between mb-6 bg-indigo-700/50 p-4 rounded-2xl">
                    <span className="text-xs font-bold text-indigo-100 flex items-center gap-2"><Calendar size={14}/> Due for review</span>
                    <span className="text-xl font-black">{srsData.length} words</span>
                </div>
                <button 
                    disabled={srsData.length === 0} 
                    onClick={() => setIsSRSReview(true)} 
                    className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                >
                    <Play size={16} /> Start Session
                </button>
            </div>
        </div>

        <div className="flex-1 min-w-0">
             <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                 <div>
                    <h1 className="text-3xl font-black text-slate-900">{category} Master List</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500 text-sm font-medium">Lexical relations for high-speed revision.</p>
                        {fromCache && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1 font-black"><Database size={10}/> LOCAL BANK</span>}
                    </div>
                 </div>
                 <Sparkles className="text-yellow-400 h-10 w-10 opacity-30" />
             </div>

             {status === 'loading' && (
               <div className="text-center py-32 bg-white rounded-3xl shadow-xl border border-slate-100">
                  <Loader2 className="animate-spin h-16 w-16 text-indigo-600 mx-auto mb-6" />
                  <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Assembling Lexical Data...</p>
               </div>
             )}

             {status === 'success' && words.length > 0 && (
                <div className="space-y-8 pb-24">
                    {words.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10 flex flex-col group hover:border-indigo-400 transition-all relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                       <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{item.type}</span>
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry #{idx + 1}</span>
                                    </div>
                                    <h3 className="text-4xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors tracking-tight">{item.word}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                  <button onClick={() => handleToggleBookmark(item)} className={`${bookmarks.includes(item.word) ? 'text-pink-500 scale-125' : 'text-slate-200'} hover:text-pink-600 transition-all p-2`}>
                                    <Bookmark size={32} fill={bookmarks.includes(item.word) ? 'currentColor' : 'none'} />
                                  </button>
                                  <button onClick={() => handlePlayAudio(item.word, idx)} className="text-slate-300 hover:text-indigo-600 transition-all p-2">
                                    {playingIndex === idx ? <Loader2 size={32} className="animate-spin"/> : <Volume2 size={32} />}
                                  </button>
                                </div>
                            </div>
                            
                            <div className="mb-10">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Exact Meaning</h4>
                                <p className="text-2xl text-slate-800 font-bold leading-tight">{item.meaning}</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-10">
                                <div className="bg-emerald-50/50 p-8 rounded-[2rem] border-2 border-emerald-100">
                                    <h5 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle2 size={16}/> Synonyms (समानार्थी)</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {item.synonyms?.map((s, i) => <span key={i} className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-emerald-800 border border-emerald-200 shadow-sm">{s}</span>)}
                                    </div>
                                </div>
                                <div className="bg-red-50/50 p-8 rounded-[2rem] border-2 border-red-100">
                                    <h5 className="text-[11px] font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2"><XCircle size={16}/> Antonyms (विरुद्धार्थी)</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {item.antonyms?.map((a, i) => <span key={i} className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-red-800 border border-red-200 shadow-sm">{a}</span>)}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 relative group/usage">
                                <div className="absolute top-4 right-4 text-slate-700 font-black italic text-4xl opacity-20">"</div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Practical Usage</h4>
                                <p className="text-lg text-slate-100 italic font-serif leading-relaxed">"{item.usage}"</p>
                            </div>
                        </div>
                    ))}
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

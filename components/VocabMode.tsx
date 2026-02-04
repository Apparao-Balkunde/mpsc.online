
import React, { useState, useEffect } from 'react';
import { Subject, VocabWord, VocabCategory, LoadingState } from '../types';
import { generateVocab, playTextToSpeech } from '../services/gemini';
import { BookA, Loader2, ArrowLeft, RotateCw, Volume2, GraduationCap, Quote, ArrowRightLeft, Spline, WholeWord, Layers, ArrowRight, Repeat, Link2, Filter, AlertTriangle, ArrowRightLeft as SwapIcon, Database } from 'lucide-react';

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

  useEffect(() => { fetchVocab(false); }, [subject, category]);

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

  const renderRelatedWordTag = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.startsWith('vs:') || lower.includes('pair:')) {
      return (
        <div key={text} className="w-full mt-2 p-3 rounded-xl border flex flex-col gap-1 bg-amber-50 text-amber-900 border-amber-400 font-bold shadow-sm">
            <div className="flex items-center text-[10px] uppercase font-black text-amber-600"><SwapIcon size={14} className="mr-1" /> MPSC TRAP</div>
            <div className="text-sm font-bold">{text.replace(/^(vs:|tricky pair:)/i, 'VS').trim()}</div>
        </div>
      );
    }
    return <span key={text} className="text-[10px] px-2.5 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200">{text}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-80 bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden shrink-0 sticky top-24">
             <div className="p-4 bg-indigo-900 text-white">
                <h2 className="font-bold flex items-center gap-2"><BookA size={20} className="text-yellow-400" /> Vocabulary Bank</h2>
            </div>
            <div className="p-4 space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subject</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setSubject(Subject.MARATHI)} className={`py-2 rounded-lg text-sm font-semibold ${subject === Subject.MARATHI ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-600'}`}>Marathi</button>
                        <button onClick={() => setSubject(Subject.ENGLISH)} className={`py-2 rounded-lg text-sm font-semibold ${subject === Subject.ENGLISH ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-600'}`}>English</button>
                    </div>
                </div>
                <button onClick={() => fetchVocab(true)} disabled={status === 'loading'} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                    {status === 'loading' ? <Loader2 className="animate-spin" size={18}/> : <RotateCw size={18} />} Generate Fresh Set
                </button>
            </div>
        </div>

        <div className="flex-1 min-w-0">
             <div className="mb-6 flex justify-between items-center">
                 <div>
                    <h1 className="text-2xl font-bold text-slate-900">{category}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500 text-sm">Reviewing high-yield items.</p>
                        {fromCache && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-black"><Database size={10}/> LOCAL STORE</span>}
                    </div>
                 </div>
             </div>

             {status === 'loading' && <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-100"><Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto" /><p className="text-slate-500 font-bold mt-2">Checking Offline Data Bank...</p></div>}

             {status === 'success' && words.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {words.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col group hover:shadow-lg transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{item.word}</h3>
                                <button onClick={() => handlePlayAudio(item.word, idx)} className="text-slate-400 hover:text-indigo-600 p-1">{playingIndex === idx ? <Loader2 size={20} className="animate-spin"/> : <Volume2 size={20} />}</button>
                            </div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200 mb-4">{item.type}</span>
                            <div className="mb-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Meaning</h4>
                                <p className="text-slate-700 font-bold">{item.meaning}</p>
                            </div>
                            <div className="bg-indigo-50/30 p-3 rounded-lg border border-indigo-100 mb-4">
                                <p className="text-sm text-slate-700 italic font-serif leading-relaxed">"{item.usage}"</p>
                            </div>
                            {item.relatedWords && item.relatedWords.length > 0 && (
                                <div className="mt-auto pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                                    {item.relatedWords.map((rw) => renderRelatedWordTag(rw))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

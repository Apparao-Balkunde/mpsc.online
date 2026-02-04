
import React, { useState, useEffect } from 'react';
import { Subject, VocabWord, VocabCategory, LoadingState } from '../types';
import { generateVocab, playTextToSpeech } from '../services/gemini';
import { BookA, Loader2, ArrowLeft, RotateCw, Volume2, GraduationCap, Quote, ArrowRightLeft, Spline, WholeWord, Layers, ArrowRight, ArrowLeft as ArrowLeftIcon, Repeat, Link2, Filter, Info, AlertTriangle } from 'lucide-react';

interface VocabModeProps {
  onBack: () => void;
}

export const VocabMode: React.FC<VocabModeProps> = ({ onBack }) => {
  const [subject, setSubject] = useState<Subject>(Subject.ENGLISH);
  const [category, setCategory] = useState<VocabCategory>('SYNONYMS');
  const [words, setWords] = useState<VocabWord[]>([]);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // Practice Mode State
  const [viewMode, setViewMode] = useState<'LIST' | 'FLASHCARDS'>('LIST');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Filter State
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchVocab(false); // Initial load uses cache
  }, [subject, category]);

  const fetchVocab = async (forceRefresh = false) => {
    setStatus('loading');
    setWords([]); 
    setTypeFilter('ALL');
    setViewMode('LIST');
    try {
      const data = await generateVocab(subject, category, forceRefresh);
      setWords(data);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handlePlayAudio = async (text: string, index: number) => {
    if (playingIndex !== null) return;
    setPlayingIndex(index);
    try {
        await playTextToSpeech(text);
    } catch(e) {
        console.error(e);
    } finally {
        setPlayingIndex(null);
    }
  }

  const startFlashcards = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setViewMode('FLASHCARDS');
  };

  const getBaseType = (typeStr: string) => {
    if (!typeStr || typeof typeStr !== 'string') return 'Other';
    return typeStr.split('(')[0].trim();
  };

  const filteredWords = words.filter(word => 
    typeFilter === 'ALL' || getBaseType(word.type) === typeFilter
  );

  const uniqueTypes = Array.from(new Set(words.map(w => getBaseType(w.type)))).filter(Boolean).sort();

  const handleFilterChange = (newType: string) => {
      setTypeFilter(newType);
      setCurrentIndex(0);
      setIsFlipped(false);
  };

  const nextCard = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < filteredWords.length - 1) {
        setCurrentIndex(c => c + 1);
        setIsFlipped(false);
    }
  };

  const prevCard = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
        setCurrentIndex(c => c - 1);
        setIsFlipped(false);
    }
  };
  
  const shuffleCards = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const getCategoryConfig = (cat: VocabCategory, sub: Subject) => {
      const isMarathi = sub === Subject.MARATHI;
      switch(cat) {
          case 'IDIOMS': 
            return { label: isMarathi ? 'म्हणी व वाक्प्रचार' : 'Idioms & Phrases', icon: Quote };
          case 'SYNONYMS': 
            return { label: isMarathi ? 'समानार्थी शब्द' : 'Synonyms', icon: Spline };
          case 'ANTONYMS': 
            return { label: isMarathi ? 'विरुद्धार्थी शब्द' : 'Antonyms', icon: ArrowRightLeft };
          case 'ONE_WORD': 
            return { label: isMarathi ? 'शब्दसमूहाबद्दल एक शब्द' : 'One Word Substitution', icon: WholeWord };
          default:
            return { label: cat, icon: BookA };
      }
  }

  const renderRelatedWordTag = (text: string) => {
    let styles = "bg-slate-50 text-slate-600 border-slate-200";
    let icon = null;
    
    const lower = text.toLowerCase();
    if (lower.includes('syn:') || lower.includes('समानार्थी:')) {
      styles = "bg-green-50 text-green-700 border-green-200";
    } else if (lower.includes('ant:') || lower.includes('विरुद्धार्थी:')) {
      styles = "bg-red-50 text-red-700 border-red-200";
    } else if (lower.includes('pair:') || lower.includes('गोंधळात') || lower.includes('confused') || lower.includes('युग्म:')) {
      styles = "bg-amber-100 text-amber-900 border-amber-400 font-black scale-105 shadow-sm";
      icon = <AlertTriangle size={10} className="mr-1" />;
    }

    return (
      <span key={text} className={`text-[10px] md:text-xs px-2.5 py-1 rounded border flex items-center transition-all hover:scale-105 ${styles}`}>
        {icon}
        {text}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-80 bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden shrink-0 sticky top-24">
             <div className="p-4 bg-indigo-900 text-white">
                <h2 className="font-bold flex items-center gap-2">
                <BookA size={20} className="text-yellow-400" />
                Vocabulary Bank
                </h2>
                <p className="text-xs text-indigo-300 mt-1">Enhance your word power for MPSC</p>
            </div>
            
            <div className="p-4 space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => setSubject(Subject.MARATHI)}
                            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${subject === Subject.MARATHI ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        >
                            Marathi (मराठी)
                        </button>
                        <button 
                             onClick={() => setSubject(Subject.ENGLISH)}
                            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${subject === Subject.ENGLISH ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        >
                            English
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                    <div className="space-y-1">
                        {(['IDIOMS', 'SYNONYMS', 'ANTONYMS', 'ONE_WORD'] as VocabCategory[]).map(cat => {
                            const config = getCategoryConfig(cat, subject);
                            const Icon = config.icon;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
                                        category === cat 
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' 
                                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded-md ${category === cat ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                                        <Icon size={16} />
                                    </div>
                                    <div className="leading-tight font-bold">{config.label}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button 
                    onClick={() => fetchVocab(true)} 
                    disabled={status === 'loading'}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    {status === 'loading' ? <Loader2 className="animate-spin" size={18}/> : <RotateCw size={18} />}
                    Generate New Set
                </button>
            </div>
        </div>

        <div className="flex-1 min-w-0">
             <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                 <div>
                    <h1 className="text-2xl font-bold text-slate-900">{getCategoryConfig(category, subject).label}</h1>
                    <p className="text-slate-500 text-sm">Reviewing {subject} high-yield items.</p>
                 </div>
                 
                 {status === 'success' && words.length > 0 && (
                     <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative">
                            <select
                                value={typeFilter}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-3 pr-8 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm hover:bg-slate-50"
                            >
                                <option value="ALL">All Types</option>
                                {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <button 
                            onClick={viewMode === 'LIST' ? startFlashcards : () => setViewMode('LIST')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm text-sm ${viewMode === 'LIST' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                        >
                            {viewMode === 'LIST' ? <Layers size={16} /> : <BookA size={16} />} 
                            {viewMode === 'LIST' ? 'Flashcards' : 'View List'}
                        </button>
                     </div>
                 )}
             </div>

             {status === 'loading' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse"></div>
                    ))}
                </div>
             )}

             {status === 'success' && viewMode === 'FLASHCARDS' && (
                 <div className="max-w-xl mx-auto py-4 animate-in fade-in zoom-in-95 duration-300">
                     {filteredWords.length > 0 ? (
                     <div 
                        className="relative h-[480px] cursor-pointer group perspective-1000" 
                        onClick={() => setIsFlipped(!isFlipped)}
                        style={{ perspective: '1000px' }}
                     >
                         <div 
                            className="relative w-full h-full transition-all duration-500 shadow-xl rounded-2xl" 
                            style={{ 
                                transformStyle: 'preserve-3d', 
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
                            }}
                         >
                             <div className="absolute inset-0 w-full h-full bg-white rounded-2xl border-2 border-indigo-100 p-8 flex flex-col items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
                                 <span className="absolute top-6 right-6 text-xs font-bold text-indigo-400 px-2 py-1 rounded bg-indigo-50 border border-indigo-100">{currentIndex + 1} / {filteredWords.length}</span>
                                 <span className="text-xs font-bold text-white bg-indigo-500 px-3 py-1 rounded-full uppercase tracking-widest mb-6 shadow-sm">{getBaseType(filteredWords[currentIndex].type)}</span>
                                 <h2 className="text-3xl md:text-4xl font-black text-slate-800 text-center mb-8 leading-tight">{filteredWords[currentIndex].word}</h2>
                                 <button onClick={(e) => { e.stopPropagation(); handlePlayAudio(filteredWords[currentIndex].word, currentIndex); }} disabled={playingIndex !== null} className="p-3 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                                     {playingIndex === currentIndex ? <Loader2 size={24} className="animate-spin" /> : <Volume2 size={24} />}
                                 </button>
                                 <p className="text-slate-400 text-xs font-medium mt-auto flex items-center gap-1">Tap card to reveal analysis <RotateCw size={12}/></p>
                             </div>
                             <div className="absolute inset-0 w-full h-full bg-indigo-600 text-white rounded-2xl p-6 md:p-8 flex flex-col items-center overflow-y-auto" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                 <div className="text-center mb-4 w-full">
                                     <h3 className="text-indigo-200 mb-1 uppercase text-[10px] font-black tracking-widest border-b border-indigo-500/50 pb-1 inline-block">Meaning</h3>
                                     <p className="text-lg md:text-xl font-bold leading-tight">{filteredWords[currentIndex].meaning}</p>
                                 </div>
                                 <div className="text-center bg-indigo-800/50 p-3 rounded-xl w-full border border-indigo-500/30 mb-4">
                                     <h3 className="text-indigo-300 mb-1 uppercase text-[10px] font-black tracking-widest flex items-center justify-center gap-2"><Quote size={10} /> Usage</h3>
                                     <p className="text-sm italic text-indigo-100 font-serif leading-snug">"{filteredWords[currentIndex].usage}"</p>
                                 </div>
                                 {filteredWords[currentIndex].relatedWords && filteredWords[currentIndex].relatedWords.length > 0 && (
                                     <div className="w-full text-center">
                                         <h3 className="text-indigo-300 mb-2 uppercase text-[10px] font-black tracking-widest flex items-center justify-center gap-2"><Link2 size={10} /> Analysis & Tricky Pairs</h3>
                                         <div className="flex flex-wrap justify-center gap-2">
                                             {filteredWords[currentIndex].relatedWords.map((rw) => renderRelatedWordTag(rw))}
                                         </div>
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                     ) : <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300"><p className="text-slate-500 font-bold">No words found.</p></div>}
                     {filteredWords.length > 0 && (
                     <div className="flex justify-between items-center mt-8 px-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                         <button onClick={prevCard} disabled={currentIndex === 0} className="p-3 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-100 disabled:opacity-30 transition-all"><ArrowLeftIcon size={20} /></button>
                         <button onClick={(e) => { e.stopPropagation(); shuffleCards(); }} className="text-xs font-black text-slate-500 hover:text-indigo-600 bg-slate-50 px-4 py-2 rounded-full border border-slate-200"><Repeat size={14} className="inline mr-1"/> Shuffle</button>
                         <button onClick={nextCard} disabled={currentIndex === filteredWords.length - 1} className="p-3 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"><ArrowRight size={20} /></button>
                     </div>
                     )}
                 </div>
             )}

             {status === 'success' && viewMode === 'LIST' && (
                filteredWords.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredWords.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-slate-200 overflow-hidden flex flex-col group">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{item.word}</h3>
                                    <button onClick={() => handlePlayAudio(item.word, idx)} className="text-slate-400 hover:text-indigo-600 p-1">
                                        {playingIndex === idx ? <Loader2 size={20} className="animate-spin text-indigo-600"/> : <Volume2 size={20} />}
                                    </button>
                                </div>
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 mb-4">{item.type}</span>
                                <div className="mb-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Meaning</h4>
                                    <p className="text-slate-700 font-bold leading-relaxed">{item.meaning}</p>
                                </div>
                                <div className="bg-indigo-50/30 p-3 rounded-lg border border-indigo-100 mb-4">
                                    <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1">Usage</h4>
                                    <p className="text-sm text-slate-700 italic font-serif">"{item.usage}"</p>
                                </div>
                                {item.relatedWords && item.relatedWords.length > 0 && (
                                    <div className="mt-auto pt-4 border-t border-slate-100">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Analysis & Tricky Pairs</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {item.relatedWords.map((rw) => renderRelatedWordTag(rw))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                ) : <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300"><p className="text-slate-500 font-bold">No results found.</p></div>
             )}
        </div>
      </div>
    </div>
  );
};

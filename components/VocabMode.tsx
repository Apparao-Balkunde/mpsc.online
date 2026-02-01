import React, { useState, useEffect } from 'react';
import { Subject, VocabWord, VocabCategory, LoadingState } from '../types';
import { generateVocab, playTextToSpeech } from '../services/gemini';
import { BookA, Loader2, ArrowLeft, RotateCw, Volume2, GraduationCap, Quote, ArrowRightLeft, Spline, WholeWord, Layers, ArrowRight, ArrowLeft as ArrowLeftIcon, Repeat } from 'lucide-react';

interface VocabModeProps {
  onBack: () => void;
}

export const VocabMode: React.FC<VocabModeProps> = ({ onBack }) => {
  const [subject, setSubject] = useState<Subject>(Subject.ENGLISH);
  const [category, setCategory] = useState<VocabCategory>('IDIOMS');
  const [words, setWords] = useState<VocabWord[]>([]);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // Practice Mode State
  const [viewMode, setViewMode] = useState<'LIST' | 'FLASHCARDS'>('LIST');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    fetchVocab();
  }, [subject, category]);

  const fetchVocab = async () => {
    setStatus('loading');
    setWords([]);
    setViewMode('LIST');
    try {
      const data = await generateVocab(subject, category);
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

  const nextCard = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < words.length - 1) {
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
            return { 
                label: isMarathi ? 'म्हणी व वाक्प्रचार (Idioms)' : 'Idioms & Phrases',
                icon: Quote,
                desc: isMarathi ? 'Language richness' : 'Figurative expressions'
            };
          case 'SYNONYMS': 
            return { 
                label: isMarathi ? 'समानार्थी शब्द (Synonyms)' : 'Synonyms',
                icon: Spline,
                desc: isMarathi ? 'Similar meanings' : 'Similar words'
            };
          case 'ANTONYMS': 
            return { 
                label: isMarathi ? 'विरुद्धार्थी शब्द (Antonyms)' : 'Antonyms',
                icon: ArrowRightLeft,
                desc: isMarathi ? 'Opposite meanings' : 'Opposites'
            };
          case 'ONE_WORD': 
            return { 
                label: isMarathi ? 'शब्दसमूहाबद्दल एक शब्द' : 'One Word Substitution',
                icon: WholeWord,
                desc: isMarathi ? 'Concise expression' : 'Vocabulary precision'
            };
          default:
            return { label: cat, icon: BookA, desc: '' };
      }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar Controls */}
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
                            Marathi
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
                                    <div>
                                        <div className="leading-tight">{config.label}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button 
                    onClick={fetchVocab}
                    disabled={status === 'loading'}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    {status === 'loading' ? <Loader2 className="animate-spin" size={18}/> : <RotateCw size={18} />}
                    Generate New Set
                </button>
            </div>
        </div>

        {/* Main Card Area */}
        <div className="flex-1 min-w-0">
             <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                 <div>
                    <h1 className="text-2xl font-bold text-slate-900">{getCategoryConfig(category, subject).label}</h1>
                    <p className="text-slate-500 text-sm">Reviewing {subject} vocabulary</p>
                 </div>
                 
                 {status === 'success' && words.length > 0 && (
                     <div className="flex gap-2">
                        {viewMode === 'LIST' ? (
                            <button 
                                onClick={startFlashcards}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm text-sm"
                            >
                                <Layers size={16} /> Flashcards
                            </button>
                        ) : (
                            <button 
                                onClick={() => setViewMode('LIST')}
                                className="flex items-center gap-2 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors text-sm"
                            >
                                <BookA size={16} /> View List
                            </button>
                        )}
                        <span className="hidden sm:inline-block text-sm bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg font-medium border border-indigo-100">
                            {words.length} Items
                        </span>
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

             {status === 'error' && (
                <div className="bg-red-50 text-red-700 p-8 rounded-xl text-center border border-red-200">
                     <h3 className="text-lg font-bold mb-2">Generation Failed</h3>
                     <p>Please check your internet connection and try again.</p>
                </div>
             )}

             {/* FLASHCARD MODE */}
             {status === 'success' && viewMode === 'FLASHCARDS' && (
                 <div className="max-w-xl mx-auto py-4 animate-in fade-in zoom-in-95 duration-300">
                     <div 
                        className="relative h-96 cursor-pointer group perspective-1000" 
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
                             {/* Front of Card */}
                             <div 
                                className="absolute inset-0 w-full h-full bg-white rounded-2xl border-2 border-indigo-100 p-8 flex flex-col items-center justify-center" 
                                style={{ backfaceVisibility: 'hidden' }}
                             >
                                 <span className="absolute top-6 right-6 text-xs font-bold text-indigo-400 px-2 py-1 rounded bg-indigo-50 border border-indigo-100">
                                     {currentIndex + 1} / {words.length}
                                 </span>
                                 <span className="text-xs font-bold text-white bg-indigo-500 px-3 py-1 rounded-full uppercase tracking-widest mb-6 shadow-sm">
                                     {words[currentIndex].type.split('(')[0]} {/* Simplify type display */}
                                 </span>
                                 
                                 <h2 className="text-3xl md:text-4xl font-black text-slate-800 text-center mb-8 leading-tight">
                                     {words[currentIndex].word}
                                 </h2>
                                 
                                 <div className="flex gap-3">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handlePlayAudio(words[currentIndex].word, currentIndex); }}
                                        disabled={playingIndex !== null}
                                        className="p-3 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                        title="Listen"
                                    >
                                        {playingIndex === currentIndex ? <Loader2 size={24} className="animate-spin" /> : <Volume2 size={24} />}
                                    </button>
                                 </div>
                                 
                                 <p className="text-slate-400 text-xs font-medium mt-auto flex items-center gap-1">
                                     Tap card to reveal answer <RotateCw size={12}/>
                                 </p>
                             </div>

                             {/* Back of Card */}
                             <div 
                                className="absolute inset-0 w-full h-full bg-indigo-600 text-white rounded-2xl p-8 flex flex-col items-center justify-center" 
                                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                             >
                                 <div className="text-center mb-6 w-full">
                                     <h3 className="text-indigo-200 mb-2 uppercase text-[10px] font-bold tracking-widest border-b border-indigo-500/50 pb-2 inline-block">Meaning</h3>
                                     <p className="text-xl md:text-2xl font-bold leading-relaxed">{words[currentIndex].meaning}</p>
                                 </div>
                                 
                                 <div className="text-center bg-indigo-800/50 p-4 rounded-xl w-full border border-indigo-500/30">
                                     <h3 className="text-indigo-300 mb-2 uppercase text-[10px] font-bold tracking-widest flex items-center justify-center gap-2">
                                         <Quote size={10} /> Example Usage
                                     </h3>
                                     <p className="text-base italic text-indigo-100 font-serif">"{words[currentIndex].usage}"</p>
                                 </div>
                                 
                                 <p className="text-indigo-400 text-xs font-medium mt-auto">Tap to flip back</p>
                             </div>
                         </div>
                     </div>

                     {/* Controls */}
                     <div className="flex justify-between items-center mt-8 px-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                         <button 
                             onClick={prevCard}
                             disabled={currentIndex === 0}
                             className="p-3 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                         >
                             <ArrowLeftIcon size={20} />
                         </button>

                         <div className="flex flex-col items-center gap-1">
                             <button
                                onClick={(e) => { e.stopPropagation(); shuffleCards(); }}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-200"
                             >
                                 <Repeat size={12} /> Shuffle Deck
                             </button>
                         </div>

                         <button 
                             onClick={nextCard}
                             disabled={currentIndex === words.length - 1}
                             className="p-3 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                         >
                             <ArrowRight size={20} />
                         </button>
                     </div>
                 </div>
             )}

             {/* LIST MODE (Default) */}
             {status === 'success' && viewMode === 'LIST' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {words.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-slate-200 overflow-hidden flex flex-col group">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                                        {item.word}
                                    </h3>
                                    <button 
                                        onClick={() => handlePlayAudio(item.word, idx)}
                                        disabled={playingIndex !== null}
                                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                                        title="Pronounce"
                                    >
                                        {playingIndex === idx ? <Loader2 size={20} className="animate-spin text-indigo-600"/> : <Volume2 size={20} />}
                                    </button>
                                </div>
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-500 border border-slate-200 mb-4">
                                    {item.type}
                                </span>
                                
                                <div className="mb-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Meaning</h4>
                                    <p className="text-slate-700 font-medium leading-relaxed">{item.meaning}</p>
                                </div>
                                
                                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                                        <GraduationCap size={12} /> Usage
                                    </h4>
                                    <p className="text-sm text-slate-700 italic">"{item.usage}"</p>
                                </div>
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

import React, { useState, useEffect } from 'react';
import { Subject, VocabWord, VocabCategory, LoadingState } from '../types';
import { generateVocab, playTextToSpeech } from '../services/gemini';
import { BookA, Loader2, ArrowLeft, RotateCw, Volume2, Bookmark, GraduationCap } from 'lucide-react';

interface VocabModeProps {
  onBack: () => void;
}

export const VocabMode: React.FC<VocabModeProps> = ({ onBack }) => {
  const [subject, setSubject] = useState<Subject>(Subject.ENGLISH);
  const [category, setCategory] = useState<VocabCategory>('IDIOMS');
  const [words, setWords] = useState<VocabWord[]>([]);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchVocab();
  }, [subject, category]);

  const fetchVocab = async () => {
    setStatus('loading');
    setWords([]);
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

  const getCategoryTitle = (cat: VocabCategory, sub: Subject) => {
      if (sub === Subject.MARATHI) {
          switch(cat) {
              case 'IDIOMS': return 'म्हणी व वाक्प्रचार (Idioms)';
              case 'SYNONYMS': return 'समानार्थी शब्द (Synonyms)';
              case 'ANTONYMS': return 'विरुद्धार्थी शब्द (Antonyms)';
              case 'ONE_WORD': return 'शब्दसमूहाबद्दल एक शब्द';
          }
      } else {
          switch(cat) {
              case 'IDIOMS': return 'Idioms & Phrases';
              case 'SYNONYMS': return 'Synonyms';
              case 'ANTONYMS': return 'Antonyms';
              case 'ONE_WORD': return 'One Word Substitution';
          }
      }
      return cat;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar Controls */}
        <div className="w-full md:w-72 bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden shrink-0 sticky top-24">
             <div className="p-4 bg-indigo-900 text-white">
                <h2 className="font-bold flex items-center gap-2">
                <BookA size={20} className="text-yellow-400" />
                Vocabulary Bank
                </h2>
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
                        {(['IDIOMS', 'SYNONYMS', 'ANTONYMS', 'ONE_WORD'] as VocabCategory[]).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    category === cat 
                                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                                }`}
                            >
                                {getCategoryTitle(cat, subject)}
                            </button>
                        ))}
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
             <div className="mb-6 flex justify-between items-center">
                 <h1 className="text-2xl font-bold text-slate-900">{getCategoryTitle(category, subject)}</h1>
                 <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium border border-indigo-100">
                    {words.length} Items Loaded
                 </span>
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

             {status === 'success' && (
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
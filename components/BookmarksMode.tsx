import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';
import { Bookmark, ArrowLeft, Trash2, Eye } from 'lucide-react';

interface BookmarksModeProps {
  onBack: () => void;
}

export const BookmarksMode: React.FC<BookmarksModeProps> = ({ onBack }) => {
  const [bookmarks, setBookmarks] = useState<QuizQuestion[]>([]);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('mpsc_pyq_bookmarks');
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }
  }, []);

  const removeBookmark = (questionText: string) => {
    const updated = bookmarks.filter(b => b.question !== questionText);
    setBookmarks(updated);
    localStorage.setItem('mpsc_pyq_bookmarks', JSON.stringify(updated));
  };

  const toggleReveal = (index: number) => {
    if (revealedAnswers.includes(index)) {
      setRevealedAnswers(revealedAnswers.filter(i => i !== index));
    } else {
      setRevealedAnswers([...revealedAnswers, index]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden mb-6">
        <div className="p-6 bg-pink-50 border-b border-pink-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center">
            <Bookmark className="mr-2 text-pink-600" fill="currentColor" />
            Bookmarked Questions
          </h2>
          <p className="text-slate-600">Your saved collection of important questions.</p>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <Bookmark size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No bookmarks yet.</p>
            <p className="text-slate-400 text-sm mt-1">Save questions from the PYQ section to review them here.</p>
        </div>
      ) : (
        <div className="space-y-6">
           {bookmarks.map((q, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow relative group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-2 shrink-0 items-center">
                            <span className="bg-pink-100 text-pink-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                {idx + 1}
                            </span>
                        </div>
                        <div>
                            {q.examSource && (
                                <span className="inline-block text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded mb-2">
                                    {q.examSource}
                                </span>
                            )}
                            <p className="text-lg text-slate-900 font-medium leading-relaxed">{q.question}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => removeBookmark(q.question)}
                        className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                        title="Remove Bookmark"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>

                <div className="ml-11 grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="p-3 border border-slate-200 rounded-lg text-slate-700 text-sm bg-slate-50/50">
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
          ))}
        </div>
      )}
    </div>
  );
};
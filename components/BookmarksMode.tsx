import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, VocabWord, SavedNote, Subject } from '../types';
import { getProgress, toggleQuestionBookmark, toggleVocabBookmark, removeNote, exportLibrary, importLibrary } from '../services/progress';
import { Bookmark, ArrowLeft, Trash2, Eye, BookA, FileText, GraduationCap, Volume2, Database, Clock, Download, Upload, Check, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BookmarksModeProps {
  onBack: () => void;
}

type BookmarkTab = 'QUESTIONS' | 'VOCAB' | 'NOTES';

export const BookmarksMode: React.FC<BookmarksModeProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<BookmarkTab>('QUESTIONS');
  const [bookmarks, setBookmarks] = useState(getProgress().bookmarks);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBookmarks(getProgress().bookmarks);
  }, []);

  const refresh = () => setBookmarks(getProgress().bookmarks);

  const handleRemoveQuestion = (q: QuizQuestion) => {
    toggleQuestionBookmark(q);
    refresh();
  };

  const handleRemoveVocab = (v: VocabWord) => {
    toggleVocabBookmark(v);
    refresh();
  };

  const handleRemoveNote = (id: string) => {
    removeNote(id);
    refresh();
  };

  const toggleReveal = (index: number) => {
    setRevealedAnswers(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const handleExport = () => {
    exportLibrary();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importLibrary(content);
      if (success) {
        refresh();
        setShowImportSuccess(true);
        setTimeout(() => setShowImportSuccess(false), 3000);
      } else {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </button>
        <div className="flex gap-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
            />
            <button 
                onClick={handleImportClick}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
                <Upload size={14} /> Restore Backup
            </button>
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"
            >
                <Download size={14} /> Download Backup
            </button>
        </div>
      </div>

      {showImportSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 animate-in fade-in slide-in-from-top-4">
              <Check className="bg-emerald-500 text-white rounded-full p-0.5" size={18} />
              <span className="font-bold text-sm">Library restored successfully!</span>
          </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-6">
        <div className="p-8 bg-indigo-700 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Bookmark size={120} fill="currentColor" />
          </div>
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <Bookmark fill="currentColor" className="text-yellow-400" />
            My Offline Library
          </h2>
          <p className="text-indigo-100 font-medium">Items saved here are stored in your browser. Use 'Download Backup' to keep them forever.</p>
        </div>
        
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          {(['QUESTIONS', 'VOCAB', 'NOTES'] as BookmarkTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === tab ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {tab === 'QUESTIONS' && `Questions (${bookmarks.questions.length})`}
              {tab === 'VOCAB' && `Vocabulary (${bookmarks.vocab.length})`}
              {tab === 'NOTES' && `Study Notes (${bookmarks.notes.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 animate-in fade-in duration-500">
        {activeTab === 'QUESTIONS' && (
          bookmarks.questions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <Bookmark size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold">No saved questions yet.</p>
                <p className="text-slate-400 text-sm mt-1">Bookmark questions from the PYQ or Mock Test section.</p>
            </div>
          ) : (
            bookmarks.questions.map((q, idx) => (
              <div key={idx} className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 group relative hover:border-indigo-200 transition-colors">
                 <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                        <span className="bg-indigo-50 text-indigo-600 w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0">{idx + 1}</span>
                        <h4 className="text-xl font-bold text-slate-900 leading-relaxed">{q.question}</h4>
                    </div>
                    <button onClick={() => handleRemoveQuestion(q)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                 </div>
                 <div className="ml-12 grid md:grid-cols-2 gap-3 mb-6">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className={`p-4 rounded-2xl border-2 text-sm font-medium ${oIdx === q.correctAnswerIndex ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-slate-50 text-slate-400'}`}>
                        <span className="font-black mr-2 opacity-30">{String.fromCharCode(65 + oIdx)}</span>
                        {opt}
                      </div>
                    ))}
                 </div>
                 <div className="ml-12">
                    <button onClick={() => toggleReveal(idx)} className="text-indigo-600 font-bold text-sm flex items-center gap-2 hover:underline">
                      <Eye size={16} /> {revealedAnswers.includes(idx) ? 'Hide Explanation' : 'Show Explanation'}
                    </button>
                    {revealedAnswers.includes(idx) && (
                      <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2">
                        {/* Fixed: Wrapped ReactMarkdown in a div as it doesn't support className directly in some versions */}
                        <div className="prose prose-sm font-medium text-slate-700">
                          <ReactMarkdown>{q.explanation}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
            ))
          )
        )}

        {activeTab === 'VOCAB' && (
          bookmarks.vocab.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <BookA size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold">No saved words yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookmarks.vocab.map((v, idx) => (
                <div key={idx} className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 relative hover:border-indigo-200 transition-colors">
                  <button onClick={() => handleRemoveVocab(v)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                  <h3 className="text-2xl font-black text-indigo-900 mb-2">{v.word}</h3>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-500 mb-4">{v.type}</span>
                  <p className="text-slate-800 font-bold text-lg mb-4">{v.meaning}</p>
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <p className="text-sm italic text-slate-600 font-serif leading-relaxed">"{v.usage}"</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'NOTES' && (
          bookmarks.notes.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold">No saved study notes yet.</p>
            </div>
          ) : (
            bookmarks.notes.map((note, idx) => (
              <div key={note.id} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden group">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl"><GraduationCap size={20}/></div>
                      <div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{note.subject}</span>
                        <h4 className="font-black text-lg text-slate-900">{note.topic}</h4>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase"><Clock size={12}/> {new Date(note.createdAt).toLocaleDateString()}</span>
                      <button onClick={() => handleRemoveNote(note.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                   </div>
                </div>
                <div className="p-10 prose prose-slate max-w-none">
                  <ReactMarkdown>{note.content}</ReactMarkdown>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

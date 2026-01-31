import React from 'react';
import { BookOpen, GraduationCap, History, Newspaper, BookA, Bookmark, PenTool } from 'lucide-react';
import { Mode } from '../types';

interface HeaderProps {
  currentMode: Mode;
  onNavigate: (mode: Mode) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentMode, onNavigate }) => {
  return (
    <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
          className="flex items-center space-x-2 cursor-pointer" 
          onClick={() => onNavigate(Mode.HOME)}
        >
          <GraduationCap size={32} className="text-yellow-300" />
          <div>
            <h1 className="text-xl font-bold leading-tight">MPSC Sarathi</h1>
            <p className="text-xs text-indigo-200">Your AI Study Companion</p>
          </div>
        </div>
        
        <nav className="hidden xl:flex space-x-5 text-sm font-medium">
          <button 
            onClick={() => onNavigate(Mode.HOME)}
            className={`hover:text-yellow-300 transition ${currentMode === Mode.HOME ? 'text-yellow-300 font-bold' : 'text-indigo-100'}`}
          >
            Dashboard
          </button>
          <button 
             onClick={() => onNavigate(Mode.STUDY)}
            className={`hover:text-yellow-300 transition ${currentMode === Mode.STUDY ? 'text-yellow-300 font-bold' : 'text-indigo-100'}`}
          >
            Study Notes
          </button>
          <button 
             onClick={() => onNavigate(Mode.LITERATURE)}
            className={`hover:text-yellow-300 transition flex items-center gap-1 ${currentMode === Mode.LITERATURE ? 'text-yellow-300 font-bold' : 'text-indigo-100'}`}
          >
            <PenTool size={14} /> Lit. Practice
          </button>
          <button 
             onClick={() => onNavigate(Mode.VOCAB)}
            className={`hover:text-yellow-300 transition flex items-center gap-1 ${currentMode === Mode.VOCAB ? 'text-yellow-300 font-bold' : 'text-indigo-100'}`}
          >
            <BookA size={16} /> Vocab
          </button>
          <button 
             onClick={() => onNavigate(Mode.QUIZ)}
            className={`hover:text-yellow-300 transition ${currentMode === Mode.QUIZ ? 'text-yellow-300 font-bold' : 'text-indigo-100'}`}
          >
            Quiz
          </button>
          <button 
             onClick={() => onNavigate(Mode.PYQ)}
            className={`hover:text-yellow-300 transition flex items-center gap-1 ${currentMode === Mode.PYQ ? 'text-yellow-300 font-bold' : 'text-indigo-100'}`}
          >
            <History size={16} /> PYQs
          </button>
          <button 
             onClick={() => onNavigate(Mode.BOOKMARKS)}
            className={`hover:text-yellow-300 transition flex items-center gap-1 ${currentMode === Mode.BOOKMARKS ? 'text-yellow-300 font-bold' : 'text-indigo-100'}`}
          >
            <Bookmark size={16} /> Saved
          </button>
          <button 
             onClick={() => onNavigate(Mode.CURRENT_AFFAIRS)}
            className={`hover:text-yellow-300 transition flex items-center gap-1 ${currentMode === Mode.CURRENT_AFFAIRS ? 'text-yellow-300 font-bold' : 'text-indigo-100'}`}
          >
            <Newspaper size={16} /> Current Affairs
          </button>
        </nav>

         <div className="xl:hidden">
             <button onClick={() => onNavigate(Mode.HOME)} className="p-2"><BookOpen size={24} /></button>
         </div>
      </div>
    </header>
  );
};
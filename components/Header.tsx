import React from 'react';
import { BookOpen, GraduationCap, History, Newspaper } from 'lucide-react';
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
        
        <nav className="hidden xl:flex space-x-6">
          <button 
            onClick={() => onNavigate(Mode.HOME)}
            className={`hover:text-yellow-300 transition ${currentMode === Mode.HOME ? 'text-yellow-300 font-semibold' : ''}`}
          >
            Dashboard
          </button>
          <button 
             onClick={() => onNavigate(Mode.STUDY)}
            className={`hover:text-yellow-300 transition ${currentMode === Mode.STUDY ? 'text-yellow-300 font-semibold' : ''}`}
          >
            Study Notes
          </button>
          <button 
             onClick={() => onNavigate(Mode.QUIZ)}
            className={`hover:text-yellow-300 transition ${currentMode === Mode.QUIZ ? 'text-yellow-300 font-semibold' : ''}`}
          >
            Quiz Practice
          </button>
          <button 
             onClick={() => onNavigate(Mode.PYQ)}
            className={`hover:text-yellow-300 transition flex items-center gap-1 ${currentMode === Mode.PYQ ? 'text-yellow-300 font-semibold' : ''}`}
          >
            <History size={16} /> PYQs
          </button>
          <button 
             onClick={() => onNavigate(Mode.CURRENT_AFFAIRS)}
            className={`hover:text-yellow-300 transition flex items-center gap-1 ${currentMode === Mode.CURRENT_AFFAIRS ? 'text-yellow-300 font-semibold' : ''}`}
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
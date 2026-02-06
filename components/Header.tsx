import React from 'react';
import { Layout, User, BookOpen } from 'lucide-react';
// पाथ तपासा: storageService (s स्मॉल) असल्याची खात्री करा
import { getProgress } from '../services/storageService'; 

export function Header() {
  const progress = getProgress();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Layout className="text-white" size={24} />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">MPSC SARATHI AI</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
            <BookOpen size={16} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-600">
              Score: {progress.correctAnswers} / {progress.totalQuestionsAttempted}
            </span>
          </div>
          <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}

import React, { useState } from 'react';
import { Header } from './components/Header';
import { StudyMode } from './components/StudyMode';
import { QuizMode } from './components/QuizMode';
import { PYQMode } from './components/PYQMode';
import { CurrentAffairsMode } from './components/CurrentAffairsMode';
import { VocabMode } from './components/VocabMode';
import { Subject, Mode } from './types';
import { BookOpen, BrainCircuit, Languages, History, Newspaper, ArrowRight as ArrowIcon, BookA } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>(Mode.HOME);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.MARATHI);

  // Simplified navigation handler
  const navigate = (newMode: Mode, subject?: Subject) => {
    if (subject) setSelectedSubject(subject);
    setMode(newMode);
  };

  // Render Home Dashboard
  const renderHome = () => (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Ace Your <span className="text-indigo-600">MPSC Exam</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Comprehensive AI-powered preparation for Marathi and English papers. 
          Generate notes, practice quizzes, and review previous year questions for Rajyaseva, Group B, and Group C.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Marathi Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 hover:border-indigo-200 transition-all group">
           <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500 p-6 flex items-end justify-between">
             <h2 className="text-3xl font-bold text-white">मराठी (Marathi)</h2>
             <Languages className="text-white/80 w-12 h-12" />
           </div>
           <div className="p-6">
              <p className="text-slate-600 mb-6">Master Grammar (व्याकरण), Comprehension, and Vocabulary for State Services.</p>
              <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => navigate(Mode.STUDY, Subject.MARATHI)}
                    className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-3 rounded-lg font-semibold hover:bg-indigo-100 transition"
                  >
                      <BookOpen size={18} /> Learn
                  </button>
                   <button 
                    onClick={() => navigate(Mode.QUIZ, Subject.MARATHI)}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                  >
                      <BrainCircuit size={18} /> Practice
                  </button>
              </div>
           </div>
        </div>

        {/* English Card */}
         <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 hover:border-blue-200 transition-all group">
           <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 flex items-end justify-between">
             <h2 className="text-3xl font-bold text-white">English</h2>
             <Languages className="text-white/80 w-12 h-12" />
           </div>
           <div className="p-6">
              <p className="text-slate-600 mb-6">Master Grammar for MPSC, UPSC, SSC & CDS exams.</p>
               <div className="grid grid-cols-2 gap-4">
                  <button 
                     onClick={() => navigate(Mode.STUDY, Subject.ENGLISH)}
                    className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-3 rounded-lg font-semibold hover:bg-indigo-100 transition"
                  >
                      <BookOpen size={18} /> Learn
                  </button>
                   <button 
                    onClick={() => navigate(Mode.QUIZ, Subject.ENGLISH)}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                  >
                      <BrainCircuit size={18} /> Practice
                  </button>
              </div>
           </div>
        </div>
      </div>

      {/* Feature Sections */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* PYQ Quick Access */}
          <div className="bg-indigo-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-10">
                <History size={140} />
             </div>
             <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <History className="text-yellow-400" />
                    PYQs
                </h3>
                <p className="text-indigo-200 text-sm mb-6">Authentic questions from Rajyaseva, Group B, Group C (2010-2024).</p>
             </div>
             <button 
                onClick={() => setMode(Mode.PYQ)}
                className="relative z-10 bg-yellow-400 text-indigo-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-300 transition-all shadow-lg flex items-center justify-center gap-2 w-full text-sm"
             >
                Solve PYQs <ArrowRight className="w-4 h-4" />
             </button>
          </div>

          {/* Vocabulary Quick Access */}
          <div className="bg-purple-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-10">
                <BookA size={140} />
             </div>
             <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <BookA className="text-purple-300" />
                    Vocabulary
                </h3>
                <p className="text-purple-200 text-sm mb-6">Idioms, Phrases, Synonyms & Antonyms for Marathi & English.</p>
             </div>
             <button 
                onClick={() => setMode(Mode.VOCAB)}
                className="relative z-10 bg-purple-400 text-purple-950 px-4 py-2 rounded-lg font-bold hover:bg-purple-300 transition-all shadow-lg flex items-center justify-center gap-2 w-full text-sm"
             >
                Learn Words <ArrowRight className="w-4 h-4" />
             </button>
          </div>

          {/* Current Affairs Quick Access */}
           <div className="bg-emerald-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-10">
                <Newspaper size={140} />
             </div>
             <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Newspaper className="text-emerald-300" />
                    Current Affairs
                </h3>
                <p className="text-emerald-100 text-sm mb-6">Daily updates on Maharashtra & India events for exams.</p>
             </div>
             <button 
                onClick={() => setMode(Mode.CURRENT_AFFAIRS)}
                className="relative z-10 bg-emerald-400 text-emerald-950 px-4 py-2 rounded-lg font-bold hover:bg-emerald-300 transition-all shadow-lg flex items-center justify-center gap-2 w-full text-sm"
             >
                Read News <ArrowRight className="w-4 h-4" />
             </button>
          </div>
      </div>

      {/* Quick Tips Section */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-slate-100 p-6 rounded-xl">
            <h4 className="font-bold text-slate-800 mb-2">Grammar Focus</h4>
            <p className="text-sm text-slate-600">MPSC asks deep conceptual questions. Don't just memorize rules, understand the logic (Contextual Grammar).</p>
        </div>
        <div className="bg-slate-100 p-6 rounded-xl">
            <h4 className="font-bold text-slate-800 mb-2">Vocab Strategy</h4>
            <p className="text-sm text-slate-600">For Marathi, focus on 'Samanarthi/Viruddharthi Shabd' and 'Mhani'. For English, focus on Idioms.</p>
        </div>
        <div className="bg-slate-100 p-6 rounded-xl">
            <h4 className="font-bold text-slate-800 mb-2">Consistency</h4>
            <p className="text-sm text-slate-600">Solve at least 50 MCQs daily. Use the Quiz mode here to generate fresh questions every time.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header currentMode={mode} onNavigate={setMode} />
      
      <main className="flex-grow">
        {mode === Mode.HOME && renderHome()}
        {mode === Mode.STUDY && (
          <StudyMode 
            initialSubject={selectedSubject} 
            onBack={() => setMode(Mode.HOME)} 
          />
        )}
        {mode === Mode.QUIZ && (
          <QuizMode 
            initialSubject={selectedSubject} 
            onBack={() => setMode(Mode.HOME)} 
          />
        )}
        {mode === Mode.PYQ && (
          <PYQMode 
            onBack={() => setMode(Mode.HOME)} 
          />
        )}
        {mode === Mode.VOCAB && (
          <VocabMode 
            onBack={() => setMode(Mode.HOME)} 
          />
        )}
        {mode === Mode.CURRENT_AFFAIRS && (
          <CurrentAffairsMode 
            onBack={() => setMode(Mode.HOME)} 
          />
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} MPSC Sarathi. Created for Aspirants.</p>
          <p className="text-xs mt-2 opacity-50">Powered by Google Gemini AI</p>
        </div>
      </footer>
    </div>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
);

export default App;
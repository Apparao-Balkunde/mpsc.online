import React, { useState } from 'react';
import { Header } from './components/Header';
import { StudyMode } from './components/StudyMode';
import { QuizMode } from './components/QuizMode';
import { Subject, Mode, VocabWord } from './types';
import { generateVocab } from './services/gemini';
import { BookOpen, BrainCircuit, Languages, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>(Mode.HOME);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.MARATHI);
  const [dailyVocab, setDailyVocab] = useState<VocabWord[]>([]);
  const [vocabLoading, setVocabLoading] = useState(false);

  // Simplified navigation handler
  const navigate = (newMode: Mode, subject?: Subject) => {
    if (subject) setSelectedSubject(subject);
    setMode(newMode);
  };

  const loadDailyVocab = async (subject: Subject) => {
    setVocabLoading(true);
    try {
        const words = await generateVocab(subject);
        setDailyVocab(words);
    } catch (e) {
        console.error("Failed to load vocab");
    } finally {
        setVocabLoading(false);
    }
  }

  // Render Home Dashboard
  const renderHome = () => (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Ace Your <span className="text-indigo-600">MPSC Exam</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Comprehensive AI-powered preparation for Marathi and English papers. 
          Generate notes, practice quizzes, and build vocabulary instantly.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
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
               <button 
                onClick={() => loadDailyVocab(Subject.MARATHI)}
                className="mt-4 w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition"
              >
                  <Sparkles size={16} /> Generate Important Vocab (Mani/Vakprachar)
              </button>
           </div>
        </div>

        {/* English Card */}
         <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 hover:border-blue-200 transition-all group">
           <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 flex items-end justify-between">
             <h2 className="text-3xl font-bold text-white">English</h2>
             <Languages className="text-white/80 w-12 h-12" />
           </div>
           <div className="p-6">
              <p className="text-slate-600 mb-6">Master Grammar, Idioms, Phrases and Comprehension for MPSC.</p>
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
              <button 
                onClick={() => loadDailyVocab(Subject.ENGLISH)}
                className="mt-4 w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition"
              >
                  <Sparkles size={16} /> Generate Daily Vocab
              </button>
           </div>
        </div>
      </div>

        {/* Vocab Section Display */}
        {vocabLoading && (
            <div className="text-center py-4">
                <span className="inline-block animate-pulse text-indigo-600 font-medium">✨ Finding important words for you...</span>
            </div>
        )}

        {dailyVocab.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-yellow-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">✨ Quick Study Words</h3>
                    <button onClick={() => setDailyVocab([])} className="text-sm text-slate-400 hover:text-red-500">Clear</button>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    {dailyVocab.map((item, idx) => (
                        <div key={idx} className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-lg font-bold text-slate-900">{item.word}</span>
                                <span className="text-xs font-mono bg-white px-2 py-0.5 rounded text-slate-500 border">{item.type}</span>
                            </div>
                            <p className="text-slate-700 mb-2 font-medium">{item.meaning}</p>
                            <p className="text-slate-500 text-sm italic">"{item.usage}"</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

      {/* Quick Tips Section */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
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

export default App;

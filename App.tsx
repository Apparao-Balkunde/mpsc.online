
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StudyMode } from './components/StudyMode';
import { QuizMode } from './components/QuizMode';
import { PYQMode } from './components/PYQMode';
import { CurrentAffairsMode } from './components/CurrentAffairsMode';
import { VocabMode } from './components/VocabMode';
import { BookmarksMode } from './components/BookmarksMode';
import { LiteratureMode } from './components/LiteratureMode';
import { MockTestMode } from './components/MockTestMode';
import { GlobalLibrary } from './components/GlobalLibrary';
import { Subject, Mode, UserProgress, ExamType } from './types';
import { getProgress } from './services/progress';
import { BookOpen, BrainCircuit, Languages, History, Newspaper, ArrowRight as ArrowIcon, BookA, Bookmark, PenTool, TrendingUp, CheckCircle2, PieChart, Globe, ShieldCheck, Database, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>(Mode.HOME);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.MARATHI);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('ALL');
  const [progress, setProgress] = useState<UserProgress>({ 
    studyTopicsViewed: [], 
    quizzesCompleted: [],
    bookmarks: { questions: [], vocab: [], notes: [] }
  });

  useEffect(() => {
    if (mode === Mode.HOME) {
        setProgress(getProgress());
    }
  }, [mode]);

  const navigate = (newMode: Mode, subject?: Subject, examType: ExamType = 'ALL') => {
    if (subject) setSelectedSubject(subject);
    setSelectedExamType(examType);
    setMode(newMode);
  };

  const navigateToQuiz = (subject: Subject, topic: string) => {
      setSelectedSubject(subject);
      setSelectedTopic(topic);
      setMode(Mode.QUIZ);
  };

  const getQuizAvg = () => {
    if (progress.quizzesCompleted.length === 0) return 0;
    const sum = progress.quizzesCompleted.reduce((acc, curr) => acc + (curr.score / curr.total) * 100, 0);
    return Math.round(sum / progress.quizzesCompleted.length);
  }

  const renderHome = () => (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Ace Your <span className="text-indigo-600">MPSC Exam</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          AI-powered study companion for Marathi, English, and General Studies. 
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-10">
        <div className="xl:col-span-3 bg-gradient-to-r from-indigo-50 to-slate-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
            <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <TrendingUp className="text-indigo-600" /> Your Prep Progress
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                        <CheckCircle2 size={20} />
                    </div>
                    <div className="text-2xl font-black text-slate-800">{progress.studyTopicsViewed.length}</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Topics</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                        <BrainCircuit size={20} />
                    </div>
                    <div className="text-2xl font-black text-slate-800">{progress.quizzesCompleted.length}</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quizzes</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mb-2">
                        <PieChart size={20} />
                    </div>
                    <div className="text-2xl font-black text-slate-800">{getQuizAvg()}%</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Accuracy</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-2">
                        <Bookmark size={20} />
                    </div>
                    <div className="text-2xl font-black text-slate-800">{progress.bookmarks.notes.length + progress.bookmarks.questions.length}</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bookmarks</div>
                </div>
            </div>
        </div>
        
        <div className="bg-emerald-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                <Database size={80} />
            </div>
            <div>
                <h3 className="font-black text-emerald-400 text-xs uppercase tracking-widest mb-1">Standard Material</h3>
                <h2 className="text-xl font-bold leading-tight mb-2">Global Library</h2>
                <p className="text-emerald-100 text-xs font-medium">Verified notes and questions available permanently for everyone.</p>
            </div>
            <button 
                onClick={() => setMode(Mode.GLOBAL_LIBRARY)}
                className="mt-4 bg-emerald-500 text-emerald-950 py-2 px-4 rounded-xl font-black text-xs hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
            >
                OPEN LIBRARY <ArrowIcon size={14} />
            </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
        {/* Mock Test Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-indigo-600 hover:scale-[1.02] transition-all group">
           <div className="h-24 bg-indigo-700 p-6 flex items-end justify-between">
             <h2 className="text-xl font-bold text-white">Mock Test Center</h2>
             <ShieldCheck className="text-yellow-400 w-8 h-8" />
           </div>
           <div className="p-6">
              <p className="text-slate-600 mb-4 text-sm font-bold">Full-length pattern-based papers.</p>
              <button 
                onClick={() => setMode(Mode.MOCK_TEST)} 
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black hover:bg-indigo-700 transition shadow-lg flex items-center justify-center gap-2"
              >
                Start New Test <ArrowIcon size={18} />
              </button>
           </div>
        </div>

        {/* Marathi Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 hover:border-orange-200 transition-all group">
           <div className="h-24 bg-gradient-to-r from-orange-400 to-red-500 p-6 flex items-end justify-between">
             <h2 className="text-xl font-bold text-white">Marathi (मराठी)</h2>
             <Languages className="text-white/80 w-8 h-8" />
           </div>
           <div className="p-6">
              <p className="text-slate-600 mb-6 text-sm">Vyakaran, Vocabulary & Comprehensive Notes.</p>
              <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => navigate(Mode.STUDY, Subject.MARATHI)} className="bg-indigo-50 text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-100 transition text-sm flex flex-col items-center gap-1">
                      <BookOpen size={16} /> Study
                  </button>
                   <button onClick={() => navigate(Mode.QUIZ, Subject.MARATHI)} className="bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-sm flex flex-col items-center gap-1">
                      <BrainCircuit size={16} /> Practice Quiz
                  </button>
              </div>
           </div>
        </div>

        {/* English Card */}
         <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 hover:border-blue-200 transition-all group">
           <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 flex items-end justify-between">
             <h2 className="text-xl font-bold text-white">English Grammar</h2>
             <Languages className="text-white/80 w-8 h-8" />
           </div>
           <div className="p-6">
              <p className="text-slate-600 mb-6 text-sm">MPSC Combined & Rajyaseva Pattern.</p>
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => navigate(Mode.STUDY, Subject.ENGLISH)} className="bg-indigo-50 text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-100 transition text-sm flex flex-col items-center gap-1">
                      <BookOpen size={16} /> Study
                  </button>
                   <button onClick={() => navigate(Mode.QUIZ, Subject.ENGLISH)} className="bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition text-sm flex flex-col items-center gap-1">
                      <BrainCircuit size={16} /> Practice Quiz
                  </button>
              </div>
           </div>
        </div>
      </div>

      {/* Feature Sections */}
      <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="bg-indigo-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-10"><History size={140} /></div>
             <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <History className="text-yellow-400" /> GS PYQs
                </h3>
                <p className="text-indigo-200 text-sm mb-6">Authentic 2010-2025 GS archive.</p>
             </div>
             <button onClick={() => setMode(Mode.PYQ)} className="relative z-10 bg-yellow-400 text-indigo-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-300 transition-all shadow-lg flex items-center justify-center gap-2 w-full text-sm">
                Explore Archive <ArrowIcon size={16} />
             </button>
          </div>

          <div className="bg-purple-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-10"><BookA size={140} /></div>
             <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <BookA className="text-purple-300" /> Vocab
                </h3>
                <p className="text-purple-200 text-sm mb-6">Tricky words & idioms.</p>
             </div>
             <button onClick={() => setMode(Mode.VOCAB)} className="relative z-10 bg-purple-400 text-purple-950 px-4 py-2 rounded-lg font-bold hover:bg-purple-300 transition-all shadow-lg flex items-center justify-center gap-2 w-full text-sm">
                Learn Words <ArrowIcon size={16} />
             </button>
          </div>

          <div className="bg-emerald-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-10"><Newspaper size={140} /></div>
             <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Newspaper className="text-emerald-300" /> News
                </h3>
                <p className="text-emerald-100 text-sm mb-6">Maharashtra & India events.</p>
             </div>
             <button onClick={() => setMode(Mode.CURRENT_AFFAIRS)} className="relative z-10 bg-emerald-400 text-emerald-950 px-4 py-2 rounded-lg font-bold hover:bg-emerald-300 transition-all shadow-lg flex items-center justify-center gap-2 w-full text-sm">
                Current Affairs <ArrowIcon size={16} />
             </button>
          </div>

           <div className="bg-pink-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-10"><Bookmark size={140} /></div>
             <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Bookmark className="text-pink-300" fill="currentColor" /> Saved
                </h3>
                <p className="text-pink-100 text-sm mb-6">Review your marks.</p>
             </div>
             <button onClick={() => setMode(Mode.BOOKMARKS)} className="relative z-10 bg-pink-400 text-pink-950 px-4 py-2 rounded-lg font-bold hover:bg-pink-300 transition-all shadow-lg flex items-center justify-center gap-2 w-full text-sm">
                View Bookmarks <ArrowIcon size={16} />
             </button>
          </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <Header currentMode={mode} onNavigate={(m) => navigate(m)} />

      <main className="pt-4">
        {mode === Mode.HOME && renderHome()}
        
        {mode === Mode.STUDY && (
           <StudyMode initialSubject={selectedSubject} onBack={() => navigate(Mode.HOME)} onNavigateToQuiz={navigateToQuiz} />
        )}
        
        {mode === Mode.QUIZ && (
           <QuizMode initialSubject={selectedSubject} initialTopic={selectedTopic} onBack={() => navigate(Mode.HOME)} />
        )}
        
        {mode === Mode.PYQ && (
           <PYQMode initialExamType={selectedExamType} onBack={() => navigate(Mode.HOME)} />
        )}

        {mode === Mode.CURRENT_AFFAIRS && (
            <CurrentAffairsMode onBack={() => navigate(Mode.HOME)} />
        )}

        {mode === Mode.VOCAB && (
            <VocabMode onBack={() => navigate(Mode.HOME)} />
        )}
        
        {mode === Mode.BOOKMARKS && (
            <BookmarksMode onBack={() => navigate(Mode.HOME)} />
        )}

        {mode === Mode.LITERATURE && (
            <LiteratureMode onBack={() => navigate(Mode.HOME)} />
        )}

        {mode === Mode.MOCK_TEST && (
            <MockTestMode onBack={() => navigate(Mode.HOME)} />
        )}

        {mode === Mode.GLOBAL_LIBRARY && (
            <GlobalLibrary onBack={() => navigate(Mode.HOME)} />
        )}
      </main>

      <footer className="text-center text-slate-400 py-6 text-sm border-t border-slate-200 mt-8">
          <p>© {new Date().getFullYear()} MPSC Sarathi AI. Empowering Maharashtra's Future Officers.</p>
      </footer>
    </div>
  );
};

export default App;

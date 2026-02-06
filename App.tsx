import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Header } from './components/Header';
import { QuizMode } from './components/QuizMode';
import { Mode, UserProgress } from './types';
import { Database, BookOpen, GraduationCap, LayoutDashboard, History, Settings } from 'lucide-react';

// Supabase Configuration
const supabaseUrl = 'https://vswtorhncwprbxlzewar.supabase.co';
const supabaseKey = 'तुमची_KEY_इथे_टाका'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>(Mode.HOME);
  const [dbQuestions, setDbQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Progress State
  const [progress, setProgress] = useState<UserProgress>({ 
    studyTopicsViewed: [], quizzesCompleted: [],
    bookmarks: { questions: [], vocab: [], notes: [] }
  });

  // डेटाबेस मधून प्रश्न लोड करणे
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('mpsc_questions')
          .select('*');
        
        if (!error && data) {
          setDbQuestions(data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const navigate = (newMode: Mode) => setMode(newMode);

  const renderHome = () => (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="text-left">
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
            MPSC <span className="text-indigo-600">Learning Portal</span>
          </h1>
          <p className="text-slate-500 font-medium">अधिकृत अभ्यासक्रम आणि प्रश्नांचा संच.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Database</p>
              <p className="text-lg font-bold text-slate-700">{dbQuestions.length} Questions</p>
           </div>
           <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Database size={20} />
           </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Practice Module */}
        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group">
            <div className="flex justify-between items-start mb-6">
               <div className="bg-orange-50 p-4 rounded-2xl text-orange-600">
                  <GraduationCap size={32} />
               </div>
               <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full">LIVE DATA</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">प्रश्नसंच सराव</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">आयोगाच्या धर्तीवर आधारित वस्तुनिष्ठ प्रश्नांचा सराव करा.</p>
            <button 
              onClick={() => setMode(Mode.QUIZ)} 
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 group-hover:bg-indigo-600 transition-all"
            >
              सराव सुरू करा <LayoutDashboard size={18} />
            </button>
        </div>

        {/* Sidebar Modules */}
        <div className="space-y-6">
           {/* Global Library */}
           <div className="bg-indigo-900 p-6 rounded-[2rem] text-white shadow-xl">
              <BookOpen className="mb-4 text-indigo-300" size={28} />
              <h3 className="text-xl font-bold mb-2">Syllabus Library</h3>
              <p className="text-indigo-200 text-sm mb-6">सर्व विषयांच्या नोट्स आणि संदर्भ साहित्य.</p>
              <button onClick={() => setMode(Mode.GLOBAL_LIBRARY)} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-sm font-bold transition-all border border-white/20">
                Explore Library
              </button>
           </div>

           {/* Progress Tracking */}
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-slate-900">
                 <History size={20} className="text-indigo-600" />
                 <h3 className="font-bold">तुमची प्रगती</h3>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">सोडवलेले प्रश्न</span>
                    <span className="font-bold">{progress.quizzesCompleted.length}</span>
                 </div>
                 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[20%]"></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header currentMode={mode} onNavigate={navigate} />
      
      <main className="min-h-[80vh]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-500 font-bold">डेटाबेसशी संपर्क होत आहे...</p>
          </div>
        )}
        
        {!loading && mode === Mode.HOME && renderHome()}
        
        {!loading && mode === Mode.QUIZ && (
          <QuizMode 
            questions={dbQuestions} 
            onBack={() => navigate(Mode.HOME)} 
          />
        )}
      </main>

      <footer className="border-t border-slate-200 py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
           <div className="flex justify-center gap-6 mb-4 text-slate-400">
              <Settings size={18} />
              <Database size={18} />
           </div>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
             © {new Date().getFullYear()} MPSC Sarathi Portal • Internal Database System
           </p>
        </div>
      </footer>
    </div>
  );
};

export default App;

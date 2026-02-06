import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Header } from './components/Header';
import { QuizMode } from './components/QuizMode';
// ... इतर सर्व मोड इम्पोर्ट करा ...
import { Mode, Subject, ExamType, UserProgress } from './types';
import { Database, TrendingUp, CheckCircle2, BrainCircuit, PieChart, Bookmark, ArrowRight as ArrowIcon } from 'lucide-react';

// Supabase Configuration
const supabaseUrl = 'https://vswtorhncwprbxlzewar.supabase.co';
const supabaseKey = 'तुमची_ANON_PUBLIC_KEY_इथे_टाका'; // तुमची API Key इथे पेस्ट करा
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

  // १. डेटाबेस मधून प्रश्न लोड करणे
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('mpsc_questions')
        .select('*');
      
      if (!error && data) {
        setDbQuestions(data);
      }
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  const navigate = (newMode: Mode) => setMode(newMode);

  const renderHome = () => (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Ace Your <span className="text-indigo-600">MPSC Exam</span>
        </h1>
        <p className="text-slate-600">डेटाबेसमधून थेट {dbQuestions.length} प्रश्न उपलब्ध आहेत.</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-10">
        <div className="xl:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
           {/* प्रगतीचे आकडे इथे दाखवा */}
           <div className="flex flex-col items-center">
             <div className="text-2xl font-bold text-indigo-600">{dbQuestions.length}</div>
             <div className="text-xs text-slate-500 uppercase">Live Questions</div>
           </div>
        </div>
        
        {/* Global Library Card */}
        <div className="bg-emerald-900 rounded-2xl p-6 text-white shadow-xl">
           <Database className="mb-4 text-emerald-400" />
           <h2 className="text-xl font-bold mb-2">Global Library</h2>
           <button onClick={() => setMode(Mode.GLOBAL_LIBRARY)} className="w-full bg-emerald-500 py-2 rounded-lg text-sm font-bold">OPEN</button>
        </div>
      </div>

      {/* Main Feature Cards */}
      <div className="grid md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-2xl border shadow-sm border-orange-100">
            <h2 className="text-xl font-bold mb-4">Practice Quiz</h2>
            <button onClick={() => setMode(Mode.QUIZ)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold w-full">Start Practicing</button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header currentMode={mode} onNavigate={navigate} />
      <main className="pt-4">
        {loading && <div className="text-center p-10 font-bold">डेटा लोड होत आहे...</div>}
        
        {mode === Mode.HOME && renderHome()}
        
        {mode === Mode.QUIZ && (
          <QuizMode 
            questions={dbQuestions} // Supabase मधून आलेले प्रश्न पाठवले
            onBack={() => navigate(Mode.HOME)} 
          />
        )}
        
        {/* इतर सर्व मोड्स (STUDY, PYQ इ.) इथे जोडा */}
      </main>
      <footer className="text-center py-10 text-slate-400 text-sm">
        © {new Date().getFullYear()} MPSC Sarathi AI
      </footer>
    </div>
  );
};

export default App;

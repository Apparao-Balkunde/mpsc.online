import React, { useState, useEffect } from 'react';
import { Mode, Subject } from './types';
import { supabase } from './lib/supabase';

// Components
import { QuizMode } from './components/QuizMode';
import { VocabMode } from './components/VocabMode';
import { PYQMode } from './components/PYQMode';

// Icons
import { 
  BookOpen, GraduationCap, LayoutDashboard, 
  Settings, User, History, Star, Search,
  Menu, X, BookCheck, BrainCircuit
} from 'lucide-react';

function App() {
  const [mode, setMode] = useState<Mode>(Mode.HOME);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [userStats, setUserStats] = useState({ quizCount: 0, vocabLearned: 0 });

  // १. युजरची प्रगती लोड करणे (Supabase मधून)
  useEffect(() => {
    const fetchStats = async () => {
      // इथे आपण फक्त काउंट्स घेत आहोत
      const { count: qCount } = await supabase
        .from('mpsc_questions')
        .select('*', { count: 'exact', head: true });
        
      const { count: vCount } = await supabase
        .from('vocab_questions')
        .select('*', { count: 'exact', head: true });

      setUserStats({
        quizCount: qCount || 0,
        vocabLearned: vCount || 0
      });
    };
    fetchStats();
  }, []);

  // २. होम स्क्रीनवरील कार्ड्स
  const MenuCard = ({ title, icon: Icon, targetMode, color }: any) => (
    <button
      onClick={() => setMode(targetMode)}
      className={`group relative p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 text-left overflow-hidden`}
    >
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="text-white" size={28} />
      </div>
      <h3 className="text-lg font-black text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">सुरू करा →</p>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white p-4 flex justify-between items-center sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white" size={18} />
          </div>
          <span className="font-black text-xl tracking-tighter italic">MPSC सारथी</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-50 rounded-xl text-slate-600">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <div className="flex max-w-[1600px] mx-auto">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 h-screen w-72 bg-white border-r border-slate-100 p-8 z-40 transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="hidden lg:flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <GraduationCap className="text-white" size={24} />
            </div>
            <span className="font-black text-2xl tracking-tighter italic">MPSC सारथी</span>
          </div>

          <nav className="space-y-2">
            <button onClick={() => {setMode(Mode.HOME); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${mode === Mode.HOME ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}>
              <LayoutDashboard size={20} /> डॅशबोर्ड
            </button>
            <button onClick={() => {setMode(Mode.QUIZ); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${mode === Mode.QUIZ ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}>
              <BrainCircuit size={20} /> सराव चाचणी
            </button>
            <button onClick={() => {setMode(Mode.VOCAB); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${mode === Mode.VOCAB ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}>
              <BookOpen size={20} /> शब्दसंग्रह
            </button>
            <button onClick={() => {setMode(Mode.PYQ); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${mode === Mode.PYQ ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}>
              <History size={20} /> मागील प्रश्न (PYQ)
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 lg:p-12 min-h-screen">
          {mode === Mode.HOME && (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Welcome Section */}
              <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                  नमस्कार, <span className="text-indigo-600">विद्यार्थी मित्र!</span> 👋
                </h1>
                <p className="text-slate-500 font-medium text-lg">तुमच्या स्पर्धा परीक्षेच्या तयारीला आजपासून गती द्या.</p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <p className="text-xs font-black text-slate-400 uppercase mb-1">एकूण प्रश्न</p>
                  <p className="text-3xl font-black text-slate-900">{userStats.quizCount}</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <p className="text-xs font-black text-slate-400 uppercase mb-1">शब्दसंग्रह</p>
                  <p className="text-3xl font-black text-slate-900">{userStats.vocabLearned}</p>
                </div>
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MenuCard title="सराव चाचणी" icon={BrainCircuit} targetMode={Mode.QUIZ} color="bg-indigo-500 shadow-indigo-200" />
                <MenuCard title="शब्दसंग्रह" icon={BookOpen} targetMode={Mode.VOCAB} color="bg-emerald-500 shadow-emerald-200" />
                <MenuCard title="मागील वर्षांचे प्रश्न" icon={History} targetMode={Mode.PYQ} color="bg-orange-500 shadow-orange-200" />
                <MenuCard title="चालू घडामोडी" icon={Star} targetMode={Mode.CURRENT_AFFAIRS} color="bg-pink-500 shadow-pink-200" />
                <MenuCard title="माझी लायब्ररी" icon={BookCheck} targetMode={Mode.BOOKMARKS} color="bg-blue-500 shadow-blue-200" />
                <MenuCard title="प्रोफाईल" icon={User} targetMode={Mode.HOME} color="bg-slate-800 shadow-slate-200" />
              </div>
            </div>
          )}

          {/* Conditional Rendering of Modes */}
          {mode === Mode.QUIZ && <QuizMode onBack={() => setMode(Mode.HOME)} />}
          {mode === Mode.VOCAB && <VocabMode onBack={() => setMode(Mode.HOME)} />}
          {mode === Mode.PYQ && <PYQMode onBack={() => setMode(Mode.HOME)} />}
          
          {(mode === Mode.CURRENT_AFFAIRS || mode === Mode.BOOKMARKS) && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-slate-400">लवकरच उपलब्ध होत आहे...</h2>
              <button onClick={() => setMode(Mode.HOME)} className="mt-4 text-indigo-600 font-bold">मागे जा</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

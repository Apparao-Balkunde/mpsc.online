import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Mode } from './types';
import { QuestionView } from './components/QuestionView';
import { VocabMode } from './components/VocabMode';
import { History, BookOpen, BrainCircuit, LayoutDashboard, Languages } from 'lucide-react';

// १. NavItem घटक (हा App च्या वर किंवा खाली असणे आवश्यक आहे)
const NavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
      active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'
    }`}
  >
    {icon} {label}
  </button>
);

// २. MenuCard घटक
const MenuCard = ({ title, icon: Icon, color, onSelect, targetMode }: any) => (
  <button 
    onClick={() => onSelect(targetMode)} 
    className={`${color} p-8 rounded-[2.5rem] text-white text-left shadow-lg shadow-indigo-100 hover:scale-[1.02] transition-transform`}
  >
    <Icon size={32} className="mb-6 opacity-80" />
    <h3 className="text-2xl font-black mb-1">{title}</h3>
    <p className="text-sm opacity-70 font-bold uppercase tracking-widest">सुरू करा →</p>
  </button>
);

function App() {
  const [mode, setMode] = useState<Mode>(Mode.HOME);
  const [questionsCount, setQuestionsCount] = useState(0);

  useEffect(() => {
    async function getCount() {
      const { count, error } = await supabase
        .from('mpsc_questions')
        .select('*', { count: 'exact', head: true });
      if (!error && count !== null) setQuestionsCount(count);
    }
    getCount();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><BookOpen size={24} /></div>
          <span className="text-xl font-black tracking-tighter">MPSC सारथी</span>
        </div>
        <div className="space-y-2">
          <NavItem icon={<LayoutDashboard size={20}/>} label="डॅशबोर्ड" active={mode === Mode.HOME} onClick={() => setMode(Mode.HOME)} />
          <NavItem icon={<History size={20}/>} label="पूर्व परीक्षा" active={mode === Mode.PRELIMS} onClick={() => setMode(Mode.PRELIMS)} />
          <NavItem icon={<BookOpen size={20}/>} label="मुख्य परीक्षा" active={mode === Mode.MAINS} onClick={() => setMode(Mode.MAINS)} />
          <NavItem icon={<Languages size={20}/>} label="शब्दसंग्रह" active={mode === Mode.VOCAB} onClick={() => setMode(Mode.VOCAB)} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 lg:p-12">
        {mode === Mode.HOME && (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-black text-slate-900 mb-2">नमस्कार! 👋</h1>
            <p className="text-slate-500 mb-10 font-medium">डेटाबेसमध्ये सध्या {questionsCount} प्रश्न उपलब्ध आहेत.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MenuCard title="पूर्व परीक्षा" icon={History} targetMode={Mode.PRELIMS} color="bg-blue-600" onSelect={setMode} />
              <MenuCard title="मुख्य परीक्षा" icon={BookOpen} targetMode={Mode.MAINS} color="bg-emerald-600" onSelect={setMode} />
              <MenuCard title="शब्दसंग्रह" icon={Languages} targetMode={Mode.VOCAB} color="bg-purple-600" onSelect={setMode} />
            </div>
          </div>
        )}

        {mode === Mode.PRELIMS && <QuestionView type={Mode.PRELIMS} onBack={() => setMode(Mode.HOME)} />}
        {mode === Mode.MAINS && <QuestionView type={Mode.MAINS} onBack={() => setMode(Mode.HOME)} />}
        {mode === Mode.VOCAB && <VocabMode onBack={() => setMode(Mode.HOME)} />}
      </main>
    </div>
  );
}

export default App;

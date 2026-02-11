import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Mode } from './types';
import { QuestionView } from './components/QuestionView';
import { VocabMode } from './components/VocabMode';
import { LiteratureMode } from './components/LiteratureMode';
import { History, BookOpen, LayoutDashboard, Languages, GraduationCap } from 'lucide-react';

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}>
    {icon} {label}
  </button>
);

const MenuCard = ({ title, icon: Icon, color, onSelect, targetMode }: any) => (
  <button onClick={() => onSelect(targetMode)} className={`${color} p-8 rounded-[2.5rem] text-white text-left shadow-lg hover:scale-[1.02] transition-transform w-full`}>
    <Icon size={32} className="mb-6 opacity-80" />
    <h3 className="text-2xl font-black mb-1">{title}</h3>
    <p className="text-sm opacity-70 font-bold uppercase tracking-widest">सुरू करा →</p>
  </button>
);

function App() {
  // १. रिफ्रेश झाल्यावर जुना मोड वाचण्यासाठी 'lazy initialization' वापरले आहे
  const [mode, setMode] = useState<Mode>(() => {
    const savedMode = localStorage.getItem('mpsc_current_mode');
    return (savedMode as Mode) || Mode.HOME;
  });
  
  const [count, setCount] = useState(0);

  // २. जेव्हा जेव्हा मोड बदलेल, तेव्हा तो localStorage मध्ये सेव्ह करा
  useEffect(() => {
    localStorage.setItem('mpsc_current_mode', mode);
  }, [mode]);

  useEffect(() => {
    async function getCount() {
      const { count: p } = await supabase.from('prelims_questions').select('*', { count: 'exact', head: true });
      const { count: m } = await supabase.from('mains_questions').select('*', { count: 'exact', head: true });
      setCount((p || 0) + (m || 0));
    }
    getCount();
  }, []);

  // ३. होमवर जाण्यासाठी फंक्शन (जे localStorage सुद्धा अपडेट करेल)
  const handleGoHome = () => {
    setMode(Mode.HOME);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={handleGoHome}>
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><BookOpen size={24} /></div>
          <span className="text-xl font-black text-slate-800">MPSC सारथी</span>
        </div>
        <div className="space-y-2">
          <NavItem icon={<LayoutDashboard size={20}/>} label="डॅशबोर्ड" active={mode === Mode.HOME} onClick={handleGoHome} />
          <NavItem icon={<History size={20}/>} label="पूर्व परीक्षा" active={mode === Mode.PRELIMS} onClick={() => setMode(Mode.PRELIMS)} />
          <NavItem icon={<BookOpen size={20}/>} label="मुख्य परीक्षा" active={mode === Mode.MAINS} onClick={() => setMode(Mode.MAINS)} />
          <NavItem icon={<Languages size={20}/>} label="शब्दसंग्रह" active={mode === Mode.VOCAB} onClick={() => setMode(Mode.VOCAB)} />
          <NavItem icon={<GraduationCap size={20}/>} label="साहित्य" active={mode === Mode.LITERATURE} onClick={() => setMode(Mode.LITERATURE)} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {mode === Mode.HOME && (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-black text-slate-900 mb-2">नमस्कार! 👋</h1>
            <p className="text-slate-500 mb-10 font-medium">एकूण उपलब्ध प्रश्न: <span className="text-indigo-600 font-bold">{count}</span></p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MenuCard title="पूर्व परीक्षा" icon={History} targetMode={Mode.PRELIMS} color="bg-blue-600" onSelect={setMode} />
              <MenuCard title="मुख्य परीक्षा" icon={BookOpen} targetMode={Mode.MAINS} color="bg-emerald-600" onSelect={setMode} />
              <MenuCard title="शब्दसंग्रह" icon={Languages} targetMode={Mode.VOCAB} color="bg-purple-600" onSelect={setMode} />
              <MenuCard title="साहित्य" icon={GraduationCap} targetMode={Mode.LITERATURE} color="bg-orange-600" onSelect={setMode} />
            </div>
          </div>
        )}

        {/* View Switching with Back Navigation */}
        {mode === Mode.PRELIMS && <QuestionView type={Mode.PRELIMS} tableName="prelims_questions" onBack={handleGoHome} />}
        {mode === Mode.MAINS && <QuestionView type={Mode.MAINS} tableName="mains_questions" onBack={handleGoHome} />}
        {mode === Mode.VOCAB && <VocabMode onBack={handleGoHome} />}
        {mode === Mode.LITERATURE && <LiteratureMode onBack={handleGoHome} />}
      </main>
    </div>
  );
}

export default App;

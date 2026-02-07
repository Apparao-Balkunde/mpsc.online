import React, { useState } from 'react';
import { Mode } from './types';
import { QuestionView } from './components/QuestionView';
import { VocabMode } from './components/VocabMode';
import { History, BookOpen, BrainCircuit, LayoutDashboard, Languages } from 'lucide-react';

function App() {
  const [mode, setMode] = useState<Mode>(Mode.HOME);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      {/* Sidebar - Desktop Only */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><BookOpen size={24} /></div>
          <span className="text-xl font-black tracking-tighter">MPSC सारथी</span>
        </div>
        <div className="space-y-2">
          <NavItem icon={<LayoutDashboard size={20}/>} label="डॅशबोर्ड" active={mode === Mode.HOME} onClick={() => setMode(Mode.HOME)} />
          <NavItem icon={<History size={20}/>} label="पूर्व परीक्षा (PYQ)" active={mode === Mode.PRELIMS} onClick={() => setMode(Mode.PRELIMS)} />
          <NavItem icon={<BookOpen size={20}/>} label="मुख्य परीक्षा (PYQ)" active={mode === Mode.MAINS} onClick={() => setMode(Mode.MAINS)} />
          <NavItem icon={<Languages size={20}/>} label="शब्दसंग्रह" active={mode === Mode.VOCAB} onClick={() => setMode(Mode.VOCAB)} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 lg:p-12">
        {mode === Mode.HOME && (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-black text-slate-900 mb-2">नमस्कार, विद्यार्थी मित्र! 👋</h1>
            <p className="text-slate-500 mb-10 font-medium">तुमच्या स्पर्धा परीक्षेच्या तयारीला आजपासून गती द्या.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MenuCard title="पूर्व परीक्षा" icon={History} targetMode={Mode.PRELIMS} color="bg-blue-600" onSelect={setMode} />
              <MenuCard title="मुख्य परीक्षा" icon={BookOpen} targetMode={Mode.MAINS} color="bg-emerald-600" onSelect={setMode} />
              <MenuCard title="सराव परीक्षा" icon={BrainCircuit} targetMode={Mode.MOCK} color="bg-purple-600" onSelect={setMode} />
            </div>
          </div>
        )}

        {mode === Mode.PRELIMS && <QuestionView type="PRELIMS" onBack={() => setMode(Mode.HOME)} />}
        {mode === Mode.MAINS && <QuestionView type="MAINS" onBack={() => setMode(Mode.HOME)} />}
        {mode === Mode.MOCK && <QuestionView type="MOCK" onBack={() => setMode(Mode.HOME)} />}
        {mode === Mode.VOCAB && <VocabMode onBack={() => setMode(Mode.HOME)} />}
      </main>
    </div>
  );
}

// Sub-components
const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}>
    {icon} {label}
  </button>
);

const MenuCard = ({ title, icon: Icon, color, onSelect, targetMode }: any) => (
  <button onClick={() => onSelect(targetMode)} className={`${color} p-8 rounded-[2.5rem] text-white text-left shadow-lg shadow-indigo-100 hover:scale-[1.02] transition-transform`}>
    <Icon size={32} className="mb-6 opacity-80" />
    <h3 className="text-2xl font-black mb-1">{title}</h3>
    <p className="text-sm opacity-70 font-bold uppercase tracking-widest">सुरू करा →</p>
  </button>
);

export default App;

import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Mode } from './types';
import { QuestionView } from './components/QuestionView';
import { VocabMode } from './components/VocabMode';
import { History, BookOpen, LayoutDashboard, Languages, Trophy, Newspaper, BookmarkCheck } from 'lucide-react';

function App() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('mpsc_current_mode') as Mode) || Mode.HOME);
  const [count, setCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('mpsc_current_mode', mode);
    window.scrollTo(0, 0);
  }, [mode]);

  useEffect(() => {
    async function getCount() {
      const tables = ['prelims_questions', 'mains_questions', 'mock_questions', 'current_affairs', 'optional_questions'];
      const results = await Promise.all(tables.map(t => supabase.from(t).select('*', { count: 'exact', head: true })));
      setCount(results.reduce((acc, curr) => acc + (curr.count || 0), 0));
    }
    getCount();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setMode(Mode.HOME)}>
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><BookOpen size={24} /></div>
          <span className="text-xl font-black text-slate-800 tracking-tighter">MPSC सारथी</span>
        </div>
        <div className="space-y-2">
          <NavItem icon={<LayoutDashboard size={20}/>} label="डॅशबोर्ड" active={mode === Mode.HOME} onClick={() => setMode(Mode.HOME)} />
          <NavItem icon={<History size={20}/>} label="पूर्व परीक्षा" active={mode === Mode.PRELIMS} onClick={() => setMode(Mode.PRELIMS)} />
          <NavItem icon={<BookOpen size={20}/>} label="मुख्य परीक्षा" active={mode === Mode.MAINS} onClick={() => setMode(Mode.MAINS)} />
          <NavItem icon={<BookmarkCheck size={20}/>} label="वैकल्पिक (Optional)" active={mode === Mode.OPTIONAL} onClick={() => setMode(Mode.OPTIONAL)} />
          <NavItem icon={<Trophy size={20}/>} label="सराव परीक्षा" active={mode === Mode.MOCK_TEST} onClick={() => setMode(Mode.MOCK_TEST)} />
          <NavItem icon={<Languages size={20}/>} label="शब्दसंग्रह" active={mode === Mode.VOCAB} onClick={() => setMode(Mode.VOCAB)} />
        </div>
      </nav>

      {/* Main UI Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {mode === Mode.HOME ? (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-black text-slate-900 mb-2">नमस्कार! 👋</h1>
            <div className="mb-8 inline-block bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl font-black shadow-sm">
              एकूण उपलब्ध प्रश्न: {count.toLocaleString()}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <MenuCard title="पूर्व परीक्षा" icon={History} targetMode={Mode.PRELIMS} color="bg-blue-600" onSelect={setMode} />
              <MenuCard title="मुख्य परीक्षा" icon={BookOpen} targetMode={Mode.MAINS} color="bg-emerald-600" onSelect={setMode} />
              <MenuCard title="Optional विषय" icon={BookmarkCheck} targetMode={Mode.OPTIONAL} color="bg-indigo-600" onSelect={setMode} />
              <MenuCard title="चालू घडामोडी" icon={Newspaper} targetMode={Mode.CURRENT_AFFAIRS} color="bg-orange-500" onSelect={setMode} />
              <MenuCard title="सराव परीक्षा" icon={Trophy} targetMode={Mode.MOCK_TEST} color="bg-rose-500" onSelect={setMode} />
              <MenuCard title="शब्दसंग्रह" icon={Languages} targetMode={Mode.VOCAB} color="bg-purple-600" onSelect={setMode} />
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {mode === Mode.PRELIMS && <QuestionView type={Mode.PRELIMS} tableName="prelims_questions" onBack={() => setMode(Mode.HOME)} />}
            {mode === Mode.MAINS && <QuestionView type={Mode.MAINS} tableName="mains_questions" onBack={() => setMode(Mode.HOME)} />}
            {mode === Mode.OPTIONAL && <QuestionView type="OPTIONAL" tableName="optional_questions" onBack={() => setMode(Mode.HOME)} />}
            {mode === Mode.CURRENT_AFFAIRS && <QuestionView type="CURRENT_AFFAIRS" tableName="current_affairs" onBack={() => setMode(Mode.HOME)} />}
            {mode === Mode.MOCK_TEST && <QuestionView type="MOCK_TEST" tableName="mock_questions" onBack={() => setMode(Mode.HOME)} />}
            {mode === Mode.VOCAB && <VocabMode onBack={() => setMode(Mode.HOME)} />}
          </div>
        )}
      </main>
    </div>
  );
}

// Helpers
const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${active ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>
    {icon} {label}
  </button>
);

const MenuCard = ({ title, icon: Icon, color, onSelect, targetMode }: any) => (
  <button onClick={() => onSelect(targetMode)} className={`${color} p-8 rounded-[2.5rem] text-white text-left shadow-lg hover:scale-[1.02] transition-all w-full group`}>
    <div className="bg-white/20 w-fit p-3 rounded-2xl mb-6 group-hover:rotate-12 transition-transform"><Icon size={32} /></div>
    <h3 className="text-2xl font-black mb-1">{title}</h3>
    <p className="text-sm opacity-70 font-bold uppercase tracking-widest">सुरू करा →</p>
  </button>
);

// ERROR टाळण्यासाठी ही ओळ सर्वात महत्त्वाची आहे!
export default App;

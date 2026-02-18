import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Mode } from './types';
import { QuestionView } from './components/QuestionView';
import { MockTestMode } from './components/MockTestMode';
import { 
  History, BookOpen, LayoutDashboard, Languages, 
  Trophy, Newspaper, ShieldCheck, Zap, BookMarked
} from 'lucide-react';

function App() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('mpsc_current_mode') as Mode) || Mode.HOME);
  const [count, setCount] = useState(0);

  const isExamMode = mode === Mode.MOCK_TEST;

  useEffect(() => {
    localStorage.setItem('mpsc_current_mode', mode);
    window.scrollTo(0, 0);
  }, [mode]);

  useEffect(() => {
    async function getCount() {
      const tables = ['prelims_questions', 'mains_questions', 'mock_questions', 'current_affairs'];
      try {
        const results = await Promise.all(
          tables.map(t => supabase.from(t).select('*', { count: 'exact', head: true }))
        );
        const total = results.reduce((acc, curr) => acc + (curr.count || 0), 0);
        setCount(total);
      } catch (err) {
        console.error("Count fetch error:", err);
      }
    }
    getCount();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      {!isExamMode && (
        <nav className="hidden md:flex flex-col w-64 bg-white border-r p-6 sticky top-0 h-screen transition-all">
          <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setMode(Mode.HOME)}>
            <div className="bg-indigo-600 p-2 rounded-xl text-white"><BookOpen size={24} /></div>
            <span className="text-xl font-black text-slate-800 tracking-tighter">MPSC सारथी</span>
          </div>
          <div className="space-y-2">
            <NavItem icon={<LayoutDashboard size={20}/>} label="डॅशबोर्ड" active={mode === Mode.HOME} onClick={() => setMode(Mode.HOME)} />
            <NavItem icon={<History size={20}/>} label="पूर्व परीक्षा (PYQ)" active={mode === Mode.PRELIMS} onClick={() => setMode(Mode.PRELIMS)} />
            <NavItem icon={<BookMarked size={20}/>} label="मुख्य परीक्षा (PYQ)" active={mode === Mode.MAINS} onClick={() => setMode(Mode.MAINS)} />
            <NavItem icon={<ShieldCheck size={20}/>} label="सरळसेवा भरती" active={mode === ('SARALSEVA' as Mode)} onClick={() => setMode('SARALSEVA' as Mode)} />
            <NavItem icon={<Trophy size={20}/>} label="State Board Mock" active={mode === Mode.MOCK} onClick={() => setMode(Mode.MOCK)} />
            <NavItem icon={<Zap size={20}/>} label="Mock Test (100 Q)" active={mode === Mode.MOCK_TEST} onClick={() => setMode(Mode.MOCK_TEST)} />
          </div>
        </nav>
      )}

      {/* Main Area */}
      <main className={`flex-1 overflow-y-auto ${isExamMode ? 'p-0' : 'p-6 md:p-12'}`}>
        {mode === Mode.HOME ? (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-black text-slate-900 mb-2">अभ्यासाला सुरुवात करूया! 👋</h1>
            <div className="mb-8 inline-block bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl font-black shadow-sm">
               एकूण उपलब्ध प्रश्न: {count.toLocaleString()}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* १. पूर्व परीक्षा */}
              <MenuCard 
                title="पूर्व परीक्षा" 
                desc="राज्यसेवा & संयुक्त PYQ"
                icon={History} 
                targetMode={Mode.PRELIMS} 
                color="bg-blue-600" 
                onSelect={setMode} 
              />

              {/* २. मुख्य परीक्षा */}
              <MenuCard 
                title="मुख्य परीक्षा" 
                desc="GS Papers & Language"
                icon={BookMarked} 
                targetMode={Mode.MAINS} 
                color="bg-emerald-600" 
                onSelect={setMode} 
              />

              {/* ३. सरळसेवा */}
              <MenuCard 
                title="सरळसेवा भरती" 
                desc="TCS/IBPS पॅटर्न"
                icon={ShieldCheck} 
                targetMode={'SARALSEVA'} 
                color="bg-cyan-600" 
                onSelect={setMode} 
              />

              {/* ४. स्टेट बोर्ड मॉक (State Board Questions) */}
              <MenuCard 
                title="State Board Mock" 
                desc="शालेय पाठ्यपुस्तकावर आधारित"
                icon={Trophy} 
                targetMode={Mode.MOCK} 
                color="bg-amber-500" 
                onSelect={setMode} 
              />

              {/* ५. १०० प्रश्नांची टेस्ट */}
              <MenuCard 
                title="Mock Test (100 Q)" 
                desc="फुल लेंथ सराव परीक्षा"
                icon={Zap} 
                targetMode={Mode.MOCK_TEST} 
                color="bg-rose-600" 
                onSelect={setMode} 
              />

              {/* ६. चालू घडामोडी */}
              <MenuCard 
                title="चालू घडामोडी" 
                desc="Daily Current Affairs"
                icon={Newspaper} 
                targetMode={Mode.CURRENT_AFFAIRS} 
                color="bg-orange-500" 
                onSelect={setMode} 
              />
            </div>
          </div>
        ) : (
          <div className={`${isExamMode ? 'w-full' : 'max-w-5xl mx-auto'}`}>
            {mode === Mode.PRELIMS && <QuestionView type={Mode.PRELIMS} tableName="prelims_questions" onBack={() => setMode(Mode.HOME)} />}
            {mode === Mode.MAINS && <QuestionView type={Mode.MAINS} tableName="mains_questions" onBack={() => setMode(Mode.HOME)} />}
            {mode === ('SARALSEVA' as Mode) && <QuestionView type={'SARALSEVA' as any} tableName="prelims_questions" onBack={() => setMode(Mode.HOME)} />}
            {mode === Mode.MOCK && <QuestionView type={Mode.MOCK} tableName="mock_questions" onBack={() => setMode(Mode.HOME)} />}
            {mode === Mode.MOCK_TEST && <MockTestMode onBack={() => setMode(Mode.HOME)} />}
            {mode === Mode.CURRENT_AFFAIRS && <QuestionView type="CURRENT_AFFAIRS" tableName="current_affairs" onBack={() => setMode(Mode.HOME)} />}
          </div>
        )}
      </main>
    </div>
  );
}

// Components
const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${active ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>
    {icon} {label}
  </button>
);

const MenuCard = ({ title, desc, icon: Icon, color, onSelect, targetMode }: any) => (
  <button onClick={() => onSelect(targetMode)} className={`${color} p-8 rounded-[2.5rem] text-white text-left shadow-lg hover:scale-[1.02] active:scale-95 transition-all w-full group relative overflow-hidden`}>
    <div className="bg-white/20 w-fit p-3 rounded-2xl mb-6 group-hover:rotate-12 transition-transform"><Icon size={32} /></div>
    <h3 className="text-2xl font-black mb-1">{title}</h3>
    <p className="text-white/70 text-sm font-bold mb-4">{desc}</p>
    <p className="text-[10px] bg-white/20 w-fit px-3 py-1 rounded-full font-black uppercase tracking-widest">सुरू करा →</p>
  </button>
);

export default App;

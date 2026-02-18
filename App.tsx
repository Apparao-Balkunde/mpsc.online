import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Mode } from './types';
import { QuestionView } from './components/QuestionView';
import { MockTestMode } from './components/MockTestMode';
import { 
  History, BookOpen, LayoutDashboard, 
  Trophy, Newspaper, ShieldCheck, Zap, BookMarked, Menu, X
} from 'lucide-react';

function App() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('mpsc_current_mode') as Mode) || Mode.HOME);
  const [count, setCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isExamMode = mode === Mode.MOCK_TEST;

  // मोड बदलला की टॉपला स्क्रोल करणे आणि लोकल स्टोरेज अपडेट करणे
  useEffect(() => {
    localStorage.setItem('mpsc_current_mode', mode);
    window.scrollTo(0, 0);
    setIsSidebarOpen(false); // मोबाईलवर मेनू ऑटो-क्लोज करण्यासाठी
  }, [mode]);

  // एकूण प्रश्नांची संख्या मोजणे
  useEffect(() => {
    async function getCount() {
      const tables = ['prelims_questions', 'mains_questions', 'mock_questions', 'current_affairs'];
      try {
        const results = await Promise.all(
          tables.map(t => supabase.from(t).select('*', { count: 'exact', head: true }))
        );
        const total = results.reduce((acc, curr) => acc + (curr.count || 0), 0);
        setCount(total);
      } catch (err) { console.error("Error fetching counts:", err); }
    }
    getCount();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header (जेव्हा एक्झाम मोड नसेल तेव्हाच दिसेल) */}
      {!isExamMode && (
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><BookOpen size={20} /></div>
            <span className="font-black text-slate-800 tracking-tighter text-lg">MPSC सारथी</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      {!isExamMode && (
        <nav className={`
          fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
          w-64 bg-white border-r p-6 z-40 h-full md:sticky md:top-0 md:h-screen flex flex-col
        `}>
          <div className="hidden md:flex items-center gap-3 mb-10 px-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <BookOpen size={24} />
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tighter">MPSC सारथी</span>
          </div>

          <div className="space-y-2 flex-1">
            <NavItem icon={<LayoutDashboard size={20}/>} label="डॅशबोर्ड" active={mode === Mode.HOME} onClick={() => setMode(Mode.HOME)} />
            <div className="pt-4 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">अभ्यास विभाग</div>
            <NavItem icon={<History size={20}/>} label="पूर्व परीक्षा (PYQ)" active={mode === Mode.PRELIMS} onClick={() => setMode(Mode.PRELIMS)} />
            <NavItem icon={<BookMarked size={20}/>} label="मुख्य परीक्षा (PYQ)" active={mode === Mode.MAINS} onClick={() => setMode(Mode.MAINS)} />
            <NavItem icon={<ShieldCheck size={20}/>} label="सरळसेवा भरती" active={mode === ('SARALSEVA' as Mode)} onClick={() => setMode('SARALSEVA' as Mode)} />
            
            <div className="pt-4 pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">सराव आणि टेस्ट</div>
            <NavItem icon={<Trophy size={20}/>} label="State Board Mock" active={mode === Mode.MOCK} onClick={() => setMode(Mode.MOCK)} />
            <NavItem icon={<Zap size={20}/>} label="Mock Test (100 Q)" active={mode === Mode.MOCK_TEST} onClick={() => setMode(Mode.MOCK_TEST)} />
            <NavItem icon={<Newspaper size={20}/>} label="चालू घडामोडी" active={mode === Mode.CURRENT_AFFAIRS} onClick={() => setMode(Mode.CURRENT_AFFAIRS)} />
          </div>

          <div className="mt-auto p-4 bg-indigo-50 rounded-2xl">
            <p className="text-[10px] font-black text-indigo-400 uppercase">तुमची प्रगती</p>
            <p className="text-xs font-bold text-indigo-900 mt-1">लवकरच येत आहे...</p>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${isExamMode ? 'p-0' : 'p-6 md:p-12'}`}>
        {mode === Mode.HOME ? (
          <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
            <header className="mb-10">
              <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">नमस्कार, यश जवळ आहे! 👋</h1>
              <p className="text-slate-500 font-medium">आज कोणता विषय पक्का करायचा आहे?</p>
              <div className="mt-6 inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-black shadow-xl shadow-indigo-100">
                 <Zap size={18} fill="currentColor" />
                 एकूण उपलब्ध प्रश्न: {count.toLocaleString()}
              </div>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <MenuCard title="पूर्व परीक्षा" desc="राज्यसेवा & संयुक्त PYQ संच" icon={History} targetMode={Mode.PRELIMS} color="bg-blue-600" onSelect={setMode} />
              <MenuCard title="मुख्य परीक्षा" desc="GS आणि भाषा विषयांचे PYQ" icon={BookMarked} targetMode={Mode.MAINS} color="bg-emerald-600" onSelect={setMode} />
              <MenuCard title="सरळसेवा भरती" desc="TCS/IBPS पॅटर्न सराव" icon={ShieldCheck} targetMode={'SARALSEVA'} color="bg-cyan-600" onSelect={setMode} />
              <MenuCard title="State Board Mock" desc="शालेय पाठ्यपुस्तकांवर आधारित" icon={Trophy} targetMode={Mode.MOCK} color="bg-amber-500" onSelect={setMode} />
              <MenuCard title="Mock Test (100 Q)" desc="वेळेनुसार फुल लेंथ टेस्ट" icon={Zap} targetMode={Mode.MOCK_TEST} color="bg-rose-600" onSelect={setMode} />
              <MenuCard title="चालू घडामोडी" desc="दैनंदिन चालू घडामोडी संच" icon={Newspaper} targetMode={Mode.CURRENT_AFFAIRS} color="bg-orange-500" onSelect={setMode} />
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

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}

// Sidebar Item Component
const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`
    w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-200
    ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}
  `}>
    <span className={`${active ? "text-white" : "text-slate-400"}`}>{icon}</span>
    <span className="text-sm">{label}</span>
  </button>
);

// Menu Card Component
const MenuCard = ({ title, desc, icon: Icon, color, onSelect, targetMode }: any) => (
  <button 
    onClick={() => onSelect(targetMode)} 
    className={`${color} p-8 rounded-[2.5rem] text-white text-left shadow-lg hover:translate-y-[-5px] transition-all duration-300 w-full group relative overflow-hidden`}
  >
    {/* Background Decorative Circle */}
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
    
    <div className="bg-white/20 w-fit p-3 rounded-2xl mb-6 relative z-10">
      <Icon size={28} />
    </div>
    
    <div className="relative z-10">
      <h3 className="text-2xl font-black mb-1 tracking-tight">{title}</h3>
      <p className="text-white/80 text-xs font-bold mb-6 leading-relaxed">{desc}</p>
      <div className="flex items-center gap-2 text-[10px] bg-black/10 w-fit px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-white/20">
        सुरू करा <Zap size={10} fill="currentColor" />
      </div>
    </div>
  </button>
);

export default App;

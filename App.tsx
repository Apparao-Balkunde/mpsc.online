import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Mode } from './types';
import { QuestionView } from './components/QuestionView';
import { VocabMode } from './components/VocabMode';
import { LiteratureMode } from './components/LiteratureMode';
// LayoutDashboard आयकॉन सराव परीक्षेसाठी वापरला आहे
import { History, BookOpen, LayoutDashboard, Languages, GraduationCap, Menu, X, Trophy } from 'lucide-react';

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
      active ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'
    }`}
  >
    {icon} {label}
  </button>
);

const MenuCard = ({ title, icon: Icon, color, onSelect, targetMode }: any) => (
  <button 
    onClick={() => onSelect(targetMode)} 
    className={`${color} p-8 rounded-[2.5rem] text-white text-left shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all w-full group`}
  >
    <div className="bg-white/20 w-fit p-3 rounded-2xl mb-6 group-hover:rotate-12 transition-transform">
      <Icon size={32} className="opacity-100" />
    </div>
    <h3 className="text-2xl font-black mb-1">{title}</h3>
    <p className="text-sm opacity-70 font-bold uppercase tracking-widest">सुरू करा →</p>
  </button>
);

function App() {
  const [mode, setMode] = useState<Mode>(() => {
    const savedMode = localStorage.getItem('mpsc_current_mode');
    return (savedMode as Mode) || Mode.HOME;
  });
  
  const [count, setCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('mpsc_current_mode', mode);
    setIsMobileMenuOpen(false);
  }, [mode]);

  useEffect(() => {
    async function getCount() {
      try {
        const { count: p } = await supabase.from('prelims_questions').select('*', { count: 'exact', head: true });
        const { count: m } = await supabase.from('mains_questions').select('*', { count: 'exact', head: true });
        // जर सराव परीक्षेचे वेगळे टेबल असेल तर तेही इथे प्लस करू शकतोस
        setCount((p || 0) + (m || 0));
      } catch (err) {
        console.error("Count fetch error:", err);
      }
    }
    getCount();
  }, []);

  const handleGoHome = () => setMode(Mode.HOME);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-2" onClick={handleGoHome}>
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><BookOpen size={20} /></div>
          <span className="font-black text-slate-800">MPSC सारथी</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className={`
        ${isMobileMenuOpen ? 'flex' : 'hidden'} 
        md:flex flex-col w-full md:w-64 bg-white border-r border-slate-100 p-6 fixed md:sticky top-0 h-screen z-40
      `}>
        <div className="hidden md:flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={handleGoHome}>
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><BookOpen size={24} /></div>
          <span className="text-xl font-black text-slate-800">MPSC सारथी</span>
        </div>
        
        <div className="space-y-2 mt-16 md:mt-0">
          <NavItem icon={<LayoutDashboard size={20}/>} label="डॅशबोर्ड" active={mode === Mode.HOME} onClick={handleGoHome} />
          <NavItem icon={<History size={20}/>} label="पूर्व परीक्षा" active={mode === Mode.PRELIMS} onClick={() => setMode(Mode.PRELIMS)} />
          <NavItem icon={<BookOpen size={20}/>} label="मुख्य परीक्षा" active={mode === Mode.MAINS} onClick={() => setMode(Mode.MAINS)} />
          {/* सराव परीक्षा नेव्हिगेशन लिंक */}
          <NavItem icon={<Trophy size={20}/>} label="सराव परीक्षा" active={mode === Mode.MOCK} onClick={() => setMode(Mode.MOCK)} />
          <NavItem icon={<Languages size={20}/>} label="शब्दसंग्रह" active={mode === Mode.VOCAB} onClick={() => setMode(Mode.VOCAB)} />
          <NavItem icon={<GraduationCap size={20}/>} label="साहित्य" active={mode === Mode.LITERATURE} onClick={() => setMode(Mode.LITERATURE)} />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {mode === Mode.HOME && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-10">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">नमस्कार! 👋</h1>
              <div className="flex items-center gap-2 bg-indigo-50 w-fit px-4 py-2 rounded-2xl border border-indigo-100">
                <span className="text-slate-600 font-bold">एकूण उपलब्ध प्रश्न:</span>
                <span className="text-indigo-600 font-black text-lg">{count.toLocaleString()}</span>
              </div>
            </header>

            {/* डॅशबोर्ड कार्ड्स - आता ५ कार्ड्स दिसतील */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <MenuCard title="पूर्व परीक्षा" icon={History} targetMode={Mode.PRELIMS} color="bg-blue-600" onSelect={setMode} />
              <MenuCard title="मुख्य परीक्षा" icon={BookOpen} targetMode={Mode.MAINS} color="bg-emerald-600" onSelect={setMode} />
              {/* नवीन सराव परीक्षा कार्ड */}
              <MenuCard title="सराव परीक्षा" icon={Trophy} targetMode={Mode.MOCK} color="bg-rose-500" onSelect={setMode} />
              <MenuCard title="शब्दसंग्रह" icon={Languages} targetMode={Mode.VOCAB} color="bg-purple-600" onSelect={setMode} />
              <MenuCard title="साहित्य" icon={GraduationCap} targetMode={Mode.LITERATURE} color="bg-orange-600" onSelect={setMode} />
            </div>

            <div className="mt-12 p-8 bg-slate-900 rounded-[3rem] text-white overflow-hidden relative">
               <div className="relative z-10">
                 <h4 className="text-xl font-bold mb-2">यशाचा मंत्र 💡</h4>
                 <p className="text-slate-400 font-medium max-w-md">नियमित सराव आणि सातत्य हेच यशाचे गमक आहे. आजची टेस्ट सोडवून प्रगती तपासा!</p>
               </div>
               <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12">
                 <Trophy size={160} />
               </div>
            </div>
          </div>
        )}

        {/* Content Renderers */}
        <div className="max-w-5xl mx-auto">
          {mode === Mode.PRELIMS && <QuestionView type={Mode.PRELIMS} tableName="prelims_questions" onBack={handleGoHome} />}
          {mode === Mode.MAINS && <QuestionView type={Mode.MAINS} tableName="mains_questions" onBack={handleGoHome} />}
          {/* सराव परीक्षेसाठी रेंडरर (येथे आपण मुख्य परीक्षेचेच टेबल वापरू शकतो किंवा सराव साठी वेगळे असल्यास ते बदला) */}
          {mode === Mode.MOCK && <QuestionView type={Mode.MOCK} tableName="mains_questions" onBack={handleGoHome} />}
          {mode === Mode.VOCAB && <VocabMode onBack={handleGoHome} />}
          {mode === Mode.LITERATURE && <LiteratureMode onBack={handleGoHome} />}
        </div>
      </main>
    </div>
  );
}

export default App;

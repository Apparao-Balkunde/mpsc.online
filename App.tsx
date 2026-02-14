import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Mode } from './types';
import { QuestionView } from './components/QuestionView';
import { VocabMode } from './components/VocabMode';
import { 
  History, 
  BookOpen, 
  LayoutDashboard, 
  Languages, 
  Menu, 
  X, 
  Trophy, 
  Newspaper, 
  BookmarkCheck 
} from 'lucide-react';

// Sidebar Nav Item Component
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

// Dashboard Menu Card Component
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

  // Mode बदलल्यावर LocalStorage मध्ये सेव्ह करणे
  useEffect(() => {
    localStorage.setItem('mpsc_current_mode', mode);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0); // स्क्रीन वर नेण्यासाठी
  }, [mode]);

  // सर्व टेबलमधील प्रश्नांची एकूण संख्या मोजणे
  useEffect(() => {
    async function getCount() {
      try {
        const tables = [
          'prelims_questions', 
          'mains_questions', 
          'mock_questions', 
          'current_affairs', 
          'optional_questions',
          'vocab_questions'
        ];

        const counts = await Promise.all(
          tables.map(table => 
            supabase.from(table).select('*', { count: 'exact', head: true })
          )
        );

        const total = counts.reduce((acc, curr) => acc + (curr.count || 0), 0);
        setCount(total);
      } catch (err) {
        console.error("प्रश्नांची संख्या मिळवताना त्रुटी:", err);
      }
    }
    getCount();
  }, []);

  const handleGoHome = () => setMode(Mode.HOME);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleGoHome}>
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
        md:flex flex-col w-full md:w-72 bg-white border-r border-slate-100 p-6 fixed md:sticky top-0 h-screen z-40
      `}>
        <div className="hidden md:flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={handleGoHome}>
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><BookOpen size={24} /></div>
          <span className="text-xl font-black text-slate-800 tracking-tighter">MPSC सारथी</span>
        </div>
        
        <div className="space-y-1 mt-16 md:mt-0">
          <NavItem icon={<LayoutDashboard size={20}/>} label="डॅशबोर्ड" active={mode === Mode.HOME} onClick={handleGoHome} />
          <div className="h-px bg-slate-50 my-4" />
          <NavItem icon={<Newspaper size={20}/>} label="चालू घडामोडी" active={mode === Mode.CURRENT_AFFAIRS} onClick={() => setMode(Mode.CURRENT_AFFAIRS)} />
          <NavItem icon={<History size={20}/>} label="पूर्व परीक्षा" active={mode === Mode.PRELIMS} onClick={() => setMode(Mode.PRELIMS)} />
          <NavItem icon={<BookOpen size={20}/>} label="मुख्य परीक्षा" active={mode === Mode.MAINS} onClick={() => setMode(Mode.MAINS)} />
          <NavItem icon={<Trophy size={20}/>} label="सराव परीक्षा" active={mode === Mode.MOCK_TEST} onClick={() => setMode(Mode.MOCK_TEST)} />
          <NavItem icon={<BookmarkCheck size={20}/>} label="Optional विषय" active={mode === Mode.OPTIONAL} onClick={() => setMode(Mode.OPTIONAL)} />
          <NavItem icon={<Languages size={20}/>} label="शब्दसंग्रह" active={mode === Mode.VOCAB} onClick={() => setMode(Mode.VOCAB)} />
        </div>

        {/* Footer in Sidebar */}
        <div className="mt-auto p-4 bg-slate-50 rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Version 2.0</p>
          <p className="text-xs font-bold text-slate-600">MPSC यशाचा सोबती</p>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-12">
        {mode === Mode.HOME && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-12">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">नमस्कार! 👋</h1>
              <div className="flex items-center gap-3 bg-white w-fit px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-600 font-bold">एकूण उपलब्ध प्रश्न:</span>
                <span className="text-indigo-600 font-black text-xl">{count.toLocaleString()}</span>
              </div>
            </header>

            {/* Dashboard Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <MenuCard title="चालू घडामोडी" icon={Newspaper} targetMode={Mode.CURRENT_AFFAIRS} color="bg-orange-500" onSelect={setMode} />
              <MenuCard title="पूर्व परीक्षा" icon={History} targetMode={Mode.PRELIMS} color="bg-blue-600" onSelect={setMode} />
              <MenuCard title="मुख्य परीक्षा" icon={BookOpen} targetMode={Mode.MAINS} color="bg-emerald-600" onSelect={setMode} />
              <MenuCard title="सराव परीक्षा" icon={Trophy} targetMode={Mode.MOCK_TEST} color="bg-rose-500" onSelect={setMode} />
              <MenuCard title="Optional विषय" icon={BookmarkCheck} targetMode={Mode.OPTIONAL} color="bg-indigo-600" onSelect={setMode} />
              <MenuCard title="शब्दसंग्रह" icon={Languages} targetMode={Mode.VOCAB} color="bg-purple-600" onSelect={setMode} />
            </div>

            {/* Motivation Section */}
            <div className="mt-12 p-10 bg-slate-900 rounded-[3.5rem] text-white overflow-hidden relative shadow-2xl">
               <div className="relative z-10">
                 <span className="bg-indigo-500/20 text-indigo-300 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">Pro Tip</span>
                 <h4 className="text-2xl font-black mb-3">यशाचा मंत्र 💡</h4>
                 <p className="text-slate-400 font-medium max-w-md leading-relaxed">
                   नियमित सराव आणि सातत्य हेच यशाचे गमक आहे. <br/>आजची सराव परीक्षा सोडवून आपली प्रगती तपासा!
                 </p>
               </div>
               <div className="absolute right-[-30px] bottom-[-30px] opacity-10 rotate-12">
                 <Trophy size={200} />
               </div>
            </div>
          </div>
        )}

        {/* Content Renderers */}
        <div className="max-w-5xl mx-auto">
          {mode === Mode.CURRENT_AFFAIRS && <QuestionView type="CURRENT_AFFAIRS" tableName="current_affairs" onBack={handleGoHome} />}
          {mode === Mode.PRELIMS && <QuestionView type={Mode.PRELIMS} tableName="prelims_questions" onBack={handleGoHome} />}
          {mode === Mode.MAINS && <QuestionView type={Mode.MAINS} tableName="mains_questions" onBack={handleGoHome} />}
          {mode === Mode.MOCK_TEST && <QuestionView type="MOCK_TEST" tableName="mock_questions" onBack={handleGoHome} />}
          {mode === Mode.OPTIONAL && <QuestionView type="OPTIONAL" tableName="optional_questions" onBack={handleGoHome} />}
          {mode === Mode.VOCAB && <VocabMode onBack={handleGoHome} />}
        </div>
      </main>
    </div>
  );
}

export default App;

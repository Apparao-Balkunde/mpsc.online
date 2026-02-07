import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase'; // खात्री करा की पाथ बरोबर आहे
import { Mode } from './types';
import { QuestionView } from './components/QuestionView';
import { VocabMode } from './components/VocabMode';
import { History, BookOpen, BrainCircuit, LayoutDashboard, Languages } from 'lucide-react';

function App() {
  const [mode, setMode] = useState<Mode>(Mode.HOME);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // डेटाबेस मधून प्रश्न लोड करण्यासाठी useEffect
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data, error } = await supabase
        .from('mpsc_questions') // तुमच्या टेबलचे नाव
        .select('*');
      
      if (!error && data) {
        setQuestions(data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      {/* Sidebar - डेस्कटॉपसाठी */}
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
        {loading ? (
          <div className="flex items-center justify-center h-full">डेटा लोड होत आहे...</div>
        ) : (
          <>
            {mode === Mode.HOME && (
              <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-black text-slate-900 mb-2">नमस्कार! 👋</h1>
                <p className="text-slate-500 mb-10">तुमच्याकडे सध्या {questions.length} प्रश्न उपलब्ध आहेत.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MenuCard title="पूर्व परीक्षा" icon={History} targetMode={Mode.PRELIMS} color="bg-blue-600" onSelect={setMode} />
                  <MenuCard title="मुख्य परीक्षा" icon={BookOpen} targetMode={Mode.MAINS} color="bg-emerald-600" onSelect={setMode} />
                  <MenuCard title="सराव परीक्षा" icon={BrainCircuit} targetMode={Mode.MOCK} color="bg-purple-600" onSelect={setMode} />
                </div>
              </div>
            )}

            {/* QuestionView ला डेटा पास करा */}
            {mode === Mode.PRELIMS && <QuestionView questions={questions.filter(q => q.category === 'PRELIMS')} onBack={() => setMode(Mode.HOME)} />}
            {/* याच प्रकारे इतर मोडसाठी डेटा फिल्टर करा */}
          </>
        )}
      </main>
    </div>
  );
}

// ... NavItem आणि MenuCard कंपोनंट्स तसेच राहतील
export default App;

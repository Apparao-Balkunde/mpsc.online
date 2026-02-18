import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase'; // तुमचा सुपाबेस क्लायंट
import { LoadingState, QuizQuestion } from '../types';
import { 
  ShieldCheck, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, 
  Loader2, Send, Clock, ListFilter, BookOpen, GraduationCap, 
  BrainCircuit, LayoutGrid, Zap, Timer 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// नवीन Exam Categories
type ExamCategory = 'RAJYASEVA' | 'COMBINED_B' | 'COMBINED_C' | 'SARALSEVA';

interface MockTestModeProps {
  onBack: () => void;
}

export function MockTestMode({ onBack }: MockTestModeProps) {
  const [examCategory, setExamCategory] = useState<ExamCategory>('RAJYASEVA');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  
  const timerRef = useRef<any>(null);

  // परीक्षेनुसार वेळ ठरवणे (सेकंदांत)
  const getExamDuration = (category: ExamCategory, qCount: number) => {
    switch(category) {
      case 'RAJYASEVA': return qCount * 120; // २ मिनिटे प्रति प्रश्न
      case 'COMBINED_B': return qCount * 60;  // १ मिनिट प्रति प्रश्न
      case 'COMBINED_C': return qCount * 60;
      case 'SARALSEVA': return qCount * 54;   // ५४ सेकंद प्रति प्रश्न
      default: return qCount * 60;
    }
  };

  const startTest = async () => {
    setStatus('loading');
    setErrorMsg('');
    
    try {
      // Supabase वरून डेटा फेच करणे
      const { data, error } = await supabase
        .from('questions') // तुमच्या टेबलचे नाव तपासा
        .select('*')
        .eq('exam_category', examCategory)
        .order('id', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("निवडलेल्या परीक्षेसाठी प्रश्न उपलब्ध नाहीत.");

      // Supabase मधील डेटा QuizQuestion फॉरमॅटमध्ये मॅप करणे
      const formattedQuestions: QuizQuestion[] = data.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options, // हे सुपाबेसमध्ये JSONB फॉरमॅटमध्ये असावे
        correctAnswerIndex: q.correct_answer_index,
        explanation: q.explanation,
        subCategory: q.sub_category || 'General',
        mnemonic: q.mnemonic
      }));

      setQuestions(formattedQuestions);
      setUserAnswers(new Array(formattedQuestions.length).fill(-1));
      setTimeLeft(getExamDuration(examCategory, formattedQuestions.length));
      setStatus('success');
      setIsFinished(false);
      setCurrentIdx(0);
      startTimer();
    } catch (e: any) {
      setErrorMsg("डेटा लोड करताना त्रुटी: " + e.message);
      setStatus('error');
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { finishTest(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const finishTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getScore = () => {
    return userAnswers.reduce((acc, ans, idx) => 
      (ans === questions[idx]?.correctAnswerIndex ? acc + 1 : acc), 0);
  };

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    questions.forEach(q => { if (q.subCategory) types.add(q.subCategory); });
    return Array.from(types).sort();
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    if (selectedTypeFilter === 'ALL') return questions;
    return questions.filter(q => q.subCategory === selectedTypeFilter);
  }, [questions, selectedTypeFilter]);

  // Main UI
  if (status === 'idle') {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 font-bold transition-colors">
            <ArrowLeft size={18} className="mr-2" /> डॅशबोर्डवर परत जा
        </button>
        
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-12 bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white text-center">
                <ShieldCheck size={64} className="mx-auto mb-6 text-yellow-400" />
                <h2 className="text-4xl font-black mb-2 tracking-tight">MPSC परीक्षा सराव</h2>
                <p className="text-indigo-100 italic">"दर्जेदार प्रश्न आणि अचूक विश्लेषण"</p>
            </div>

            <div className="p-10 space-y-8">
                <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { id: 'RAJYASEVA', name: 'राज्यसेवा', sub: 'State Services' },
                      { id: 'COMBINED_B', name: 'संयुक्त गट-ब', sub: 'PSI / STI / ASO' },
                      { id: 'COMBINED_C', name: 'संयुक्त गट-क', sub: 'Group C Services' },
                      { id: 'SARALSEVA', name: 'सरळसेवा भरती', sub: 'Direct Recruitment' }
                    ].map((exam) => (
                      <button 
                        key={exam.id}
                        onClick={() => setExamCategory(exam.id as ExamCategory)} 
                        className={`p-6 rounded-3xl border-4 text-left transition-all ${examCategory === exam.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-50 bg-slate-50 opacity-70'}`}
                      >
                        <h3 className="font-black text-2xl mb-1 text-indigo-950">{exam.name}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{exam.sub}</p>
                      </button>
                    ))}
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center gap-3">
                  <Info className="text-blue-500 shrink-0" />
                  <p className="text-sm text-blue-700 font-medium italic">
                    सूचना: निवडलेल्या परीक्षेच्या काठिण्य पातळीनुसार प्रश्न सुपाबेसवरून लोड केले जातील.
                  </p>
                </div>

                <button onClick={startTest} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-2xl hover:bg-black shadow-2xl transition-all active:scale-95 uppercase tracking-wider">
                  चाचणी सुरू करा
                </button>
            </div>
        </div>
      </div>
    );
  }

  // Loading, Result आणि Quiz UI तुझे आधीचेच वापरता येतील...
  // फक्त Timer आणि Header मध्ये `examCategory` दाखवणे सोपे जाईल.
  
  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-20 text-center">
        <Loader2 className="animate-spin h-16 w-16 text-indigo-600 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-800 italic">Supabase वरून प्रश्नपत्रिका लोड होत आहे...</h2>
      </div>
    );
  }

  // ... (बाकीचा रिझल्ट आणि क्विझ इंटरफेस तुझ्या मूळ कोडप्रमाणेच राहील)
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 animate-in fade-in">
        {/* जसा तुझा मूळ कोड होता तसाच पुढे चालू ठेवावा */}
        {/* फक्त Header मध्ये `examCategory` दाखवावे */}
        <div className="flex-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden sticky top-24 z-30">
                <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-yellow-500 text-black rounded-lg text-[10px] font-black uppercase tracking-widest">{examCategory}</span>
                        <h3 className="font-bold">{isFinished ? 'निकाल आणि विश्लेषण' : 'सराव सुरू आहे'}</h3>
                    </div>
                    {!isFinished && (
                        <div className="font-mono font-black text-xl bg-slate-800 px-5 py-2 rounded-xl text-yellow-400 flex items-center gap-2 border border-slate-700">
                            <Clock size={20} /> {formatTime(timeLeft)}
                        </div>
                    )}
                </div>
            </div>
            {/* ... पुढे तुझा Question Render लॉजिक ... */}
        </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle2, Trophy, BookOpen, ChevronDown, HelpCircle, Filter, XCircle, RefreshCcw } from 'lucide-react';
import { Mode } from '../types';

interface Props {
  type: Mode.PRELIMS | Mode.MAINS | Mode.MOCK | 'VOCAB' | 'MOCK_TEST' | 'CURRENT_AFFAIRS' | 'SARALSEVA'; 
  onBack: () => void;
  tableName: string; 
}

export const QuestionView: React.FC<Props> = ({ type, onBack, tableName }) => {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  
  // फिल्टर्स
  const [selExam, setSelExam] = useState(type === 'SARALSEVA' ? 'TCS' : 'Rajyaseva'); 
  const [selYear, setSelYear] = useState('All');
  const [selSubject, setSelSubject] = useState('All');

  const getSubjects = () => {
    if (type === Mode.PRELIMS || type === 'MOCK_TEST') {
        return ['History', 'Geography', 'Polity', 'Economics', 'Science', 'Environment', 'Current Affairs', 'Maths & Reasoning'];
    }
    if (type === Mode.MAINS) {
        return selExam === 'Rajyaseva' 
            ? ['Marathi', 'English', 'GS Paper 1', 'GS Paper 2', 'GS Paper 3', 'GS Paper 4'] 
            : ['Paper 1 (Language)', 'Paper 2 (General Ability)'];
    }
    if (type === Mode.MOCK) {
        return ['State Board History', 'State Board Geography', 'State Board Science', 'State Board Polity'];
    }
    if (type === 'SARALSEVA') {
        return ['मराठी व्याकरण', 'English Grammar', 'सामान्य ज्ञान (GK)', 'बुद्धिमत्ता व गणित', 'सामान्य विज्ञान', 'भूगोल', 'राज्यघटना', 'अर्थशास्त्र', 'मज्जासंस्था', 'वनस्पतीशास्त्र'];
    }
    return [];
  };

  const getExamOptions = () => {
    if (type === 'SARALSEVA') return ['TCS', 'IBPS', 'ZP', 'Talathi', 'Police Bharti', 'MPSC'];
    return ['Rajyaseva', 'Combined Group B', 'Combined Group C'];
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from(tableName).select('*');
        
        if (type !== 'CURRENT_AFFAIRS') {
            query = query.eq('exam_name', selExam);
        }
        if (selSubject !== 'All') {
            query = query.eq('subject', selSubject);
        }
        if (selYear !== 'All') {
            query = query.eq('year', parseInt(selYear));
        }

        const { data, error } = await query.order('id', { ascending: false });
        if (error) throw error;
        
        setDataList(data || []);
        setSelectedAnswers({}); 
        setScore(0);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selExam, selYear, selSubject, tableName, type]);

  const handleAnswerClick = (questionId: number, optionIdx: number, correctIdx: number) => {
    if (selectedAnswers[questionId] !== undefined) return; // आधीच उत्तर दिले असेल तर थांबवा
    
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
    if (optionIdx === correctIdx) {
      setScore(prev => prev + 1);
    }
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setScore(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">{type}</h2>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest italic">Mission 20,000 Questions</p>
            </div>
        </div>
        
        {/* Score Display */}
        {Object.keys(selectedAnswers).length > 0 && (
          <div className="flex gap-2">
            <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-100 flex items-center gap-2">
              <Trophy size={14} /> {score} / {Object.keys(selectedAnswers).length}
            </div>
            <button onClick={resetQuiz} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all">
              <RefreshCcw size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <FilterSelect 
            label={type === 'SARALSEVA' ? "पॅटर्न / विभाग" : "परीक्षा निवडा"} 
            options={getExamOptions()} 
            value={selExam} 
            onChange={setSelExam} 
        />
        <FilterSelect 
            label="विषय निवडा" 
            options={getSubjects()} 
            value={selSubject} 
            onChange={setSelSubject} 
        />
        <FilterSelect 
            label="वर्ष निवडा" 
            options={['2026', '2025', '2024', '2023', '2022', '2021']} 
            value={selYear} 
            onChange={setSelYear} 
        />
      </div>

      {/* Question List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="font-black text-slate-400 italic">डाटा लोड होत आहे...</p>
          </div>
        ) : dataList.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="font-bold text-slate-500">या फिल्टरसाठी सध्या प्रश्न उपलब्ध नाहीत.</p>
          </div>
        ) : (
          dataList.map((item, idx) => (
            <div key={item.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm mb-6 transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-2">
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">{item.exam_name}</span>
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">{item.subject}</span>
                    <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">{item.category}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-300">ID: #{item.id}</span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">
                  <span className="text-indigo-600 mr-2">प्र. {idx + 1}</span>
                  {item.question}
                </h3>

                <div className="grid gap-3 mb-8">
                  {item.options?.map((opt: string, i: number) => {
                    const isSelected = selectedAnswers[item.id] === i;
                    const isCorrect = i === item.correct_answer_index;
                    const hasAnswered = selectedAnswers[item.id] !== undefined;

                    return (
                      <button 
                        key={i} 
                        onClick={() => handleAnswerClick(item.id, i, item.correct_answer_index)} 
                        className={`p-5 rounded-2xl border-2 text-left font-bold transition-all flex items-center gap-4
                          ${!hasAnswered 
                            ? 'border-slate-50 hover:border-slate-200 text-slate-600 hover:bg-slate-50' 
                            : isCorrect 
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100' 
                              : isSelected 
                                ? 'border-rose-500 bg-rose-50 text-rose-700' 
                                : 'border-slate-50 opacity-40 text-slate-400'
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0
                          ${!hasAnswered 
                            ? 'bg-slate-100 text-slate-400' 
                            : isCorrect 
                              ? 'bg-emerald-500 text-white' 
                              : isSelected 
                                ? 'bg-rose-500 text-white' 
                                : 'bg-slate-100 text-slate-300'}`}>
                          {i + 1}
                        </div>
                        <span className="flex-grow">{opt}</span>
                        {hasAnswered && isCorrect && <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />}
                        {hasAnswered && isSelected && !isCorrect && <XCircle size={20} className="text-rose-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {selectedAnswers[item.id] !== undefined && (
                  <div className="p-6 bg-slate-900 rounded-[2rem] text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                     <div className="flex items-center gap-2 mb-3 text-indigo-400 font-black uppercase tracking-widest text-[10px]">
                         <BookOpen size={14} /> स्पष्टीकरण आणि विश्लेषण
                     </div>
                     <p className="text-slate-300 leading-relaxed font-medium">
                         {item.explanation || 'या प्रश्नाचे स्पष्टीकरण उपलब्ध नाही.'}
                     </p>
                  </div>
                )}
            </div>
          ))
        )}
      </div>
      
      {/* Scroll to top button if reached end */}
      {!loading && dataList.length > 0 && (
        <div className="mt-12 text-center">
          <p className="text-slate-400 font-bold italic mb-4">सर्व प्रश्न संपले आहेत!</p>
          <button onClick={resetQuiz} className="bg-indigo-600 text-white px-8 py-4 rounded-3xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all">
            पुन्हा सराव करा
          </button>
        </div>
      )}
    </div>
  );
};

const FilterSelect = ({ label, options, value, onChange }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-700"
      >
        <option value="All">सर्व (All)</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
    </div>
  </div>
);

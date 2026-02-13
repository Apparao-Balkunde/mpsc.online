import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle2, Filter, Trophy, Newspaper, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { Mode } from '../types';

interface Props {
  type: Mode.PRELIMS | Mode.MAINS | Mode.MOCK | 'VOCAB' | 'LITERATURE' | 'MOCK_TEST' | 'CURRENT_AFFAIRS'; 
  onBack: () => void;
  tableName: string; 
}

export const QuestionView: React.FC<Props> = ({ type, onBack, tableName }) => {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [selExam, setSelExam] = useState(type === 'MOCK_TEST' ? 'Rajyaseva' : 'Combined Group B'); 
  const [selYear, setSelYear] = useState('All');

  const yearsList = Array.from({ length: new Date().getFullYear() - 2018 + 1 }, (_, i) => (2018 + i).toString()).reverse();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from(tableName).select('*');

        if (selExam !== 'All') query = query.eq('exam_name', selExam);
        
        // सराव परीक्षा नसेल तरच वर्षानुसार फिल्टर करा
        if (type !== 'MOCK_TEST' && selYear !== 'All') {
            query = query.eq('year', parseInt(selYear));
        }

        const { data, error } = await query.order('id', { ascending: false });
        if (error) throw error;
        setDataList(data || []);
      } catch (err: any) {
        console.error("Error fetching data:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tableName, type, selExam, selYear]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            {type === 'CURRENT_AFFAIRS' ? "चालू घडामोडी" : type === 'MOCK_TEST' ? "सराव परीक्षा" : "प्रश्न संच"}
          </h2>
          <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
            {type === 'CURRENT_AFFAIRS' ? <Newspaper size={16} /> : <Trophy size={16} />} {selExam} विशेष
          </p>
        </div>
      </div>

      {/* Filters - MOCK_TEST असेल तर फक्त १ कॉलम दिसेल */}
      <div className={`bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10 grid gap-4 ${type === 'MOCK_TEST' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        <FilterSelect 
            label="परीक्षा निवडा" 
            options={['Rajyaseva', 'Combined Group B', 'Combined Group C']} 
            value={selExam} 
            onChange={setSelExam} 
        />
        
        {/* 'सराव परीक्षा' साठी वर्ष फिल्टर लपवले आहे */}
        {type !== 'MOCK_TEST' && (
          <FilterSelect 
              label="वर्ष" 
              options={yearsList} 
              value={selYear} 
              onChange={setSelYear} 
          />
        )}
      </div>

      {/* Content List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20 font-bold text-slate-400 italic animate-pulse">डेटा लोड होत आहे...</div>
        ) : dataList.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold">
                माहिती उपलब्ध नाही.
            </div>
        ) : type === 'CURRENT_AFFAIRS' ? (
          dataList.map((item) => (
            <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all">
              <button 
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="w-full p-6 md:p-8 flex items-center justify-between text-left hover:bg-slate-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge text={item.category || 'सामान्य'} color="bg-orange-50 text-orange-600" />
                    <span className="text-slate-400 text-[10px] font-black flex items-center gap-1 uppercase">
                      <Calendar size={12} /> {item.important_date || item.year}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">{item.title}</h3> 
                </div>
                <div className="ml-4 p-2 bg-slate-100 rounded-full text-slate-400">
                  {expandedId === item.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </button>
              {expandedId === item.id && (
                <div className="px-8 pb-8 animate-in slide-in-from-top-2">
                  <div className="h-px bg-slate-100 mb-6" />
                  <p className="text-slate-600 leading-relaxed font-medium text-lg whitespace-pre-line">
                    {item.details}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          dataList.map((q, idx) => (
            <div key={q.id} className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge text={q.exam_name} color="bg-indigo-50 text-indigo-600" />
                <Badge text={q.subject} color="bg-purple-50 text-purple-600" />
                {q.year && <Badge text={`${q.year}`} color="bg-slate-100 text-slate-500" />}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">
                <span className="text-indigo-600 mr-2">Q.{idx + 1}</span> {q.question}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {q.options?.map((opt: string, i: number) => {
                  const answered = selectedAnswers[q.id] !== undefined;
                  const isCorrect = q.correct_answer_index === i;
                  const isSelected = selectedAnswers[q.id] === i;
                  return (
                    <button 
                      key={i} 
                      disabled={answered}
                      onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: i }))}
                      className={`p-5 rounded-3xl border-2 text-left font-bold transition-all flex items-center justify-between ${
                        answered ? (isCorrect ? "border-emerald-500 bg-emerald-50" : isSelected ? "border-rose-500 bg-rose-50" : "opacity-40 border-slate-50") : "border-slate-100 hover:border-indigo-200"
                      }`}
                    >
                      <span className="flex-1">{opt}</span>
                      {answered && isCorrect && <CheckCircle2 className="text-emerald-600" size={22} />}
                    </button>
                  );
                })}
                {selectedAnswers[q.id] !== undefined && (
                  <div className="mt-4 p-6 bg-indigo-50 rounded-3xl border-l-8 border-indigo-600 animate-in fade-in">
                    <p className="text-slate-700 font-medium"><strong className="text-indigo-700">स्पष्टीकरण:</strong> {q.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Badge = ({ text, color }: { text: string; color: string }) => (
  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${color}`}>
    {text}
  </span>
);

const FilterSelect = ({ label, options, value, onChange }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
      >
        <option value="All">सर्व</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
    </div>
  </div>
);

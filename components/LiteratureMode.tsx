import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, BookOpen, ChevronDown, Eye, EyeOff,
  GraduationCap, Search, HelpCircle
} from 'lucide-react';

interface LitQuestion {
  id: number;
  question: string;
  model_answer: string;
  topic: string;
  author?: string;
  work?: string;
  difficulty?: string;
  exam_name?: string;
  subject?: string;
  year?: number;
}

const LIT_TOPICS = [
  'कवी परिचय',
  'लेखक परिचय',
  'कादंबरी',
  'नाटक',
  'कविता',
  'दलित साहित्य',
  'स्त्रीवादी साहित्य',
  'व्याकरण',
];

const EXAMS = ['Rajyaseva Mains', 'NET/SET', 'PhD Entrance', 'MPSC Combined'];

export const LiteratureMode: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [questions, setQuestions] = useState<LitQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selTopic, setSelTopic] = useState('All');
  const [selExam, setSelExam] = useState('All');
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from('literature_questions').select('*');
        if (selTopic !== 'All') query = query.eq('topic', selTopic);
        if (selExam !== 'All') query = query.eq('exam_name', selExam);
        const { data, error } = await query.order('id', { ascending: false });
        if (error) throw error;
        setQuestions(data || []);
        setRevealed({});
      } catch (err: any) {
        console.error('Literature लोड करताना चूक:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selTopic, selExam]);

  const filtered = questions.filter(
    q =>
      q.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.work?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleReveal = (id: number) =>
    setRevealed(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">मराठी साहित्य</h2>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-0.5">
              Mains & NET/SET साठी सखोल अभ्यास
            </p>
          </div>
        </div>
        <div className="bg-orange-50 p-3 rounded-2xl">
          <GraduationCap className="text-orange-400" size={28} />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="लेखक, कृती किंवा विषय शोधा..."
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-slate-100 outline-none focus:border-orange-400 font-medium transition-all"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <SelectFilter
          label="साहित्य प्रकार"
          value={selTopic}
          onChange={setSelTopic}
          options={LIT_TOPICS}
          allLabel="सर्व प्रकार"
          accentColor="orange"
        />
        <SelectFilter
          label="परीक्षा"
          value={selExam}
          onChange={setSelExam}
          options={EXAMS}
          allLabel="सर्व परीक्षा"
          accentColor="orange"
        />
      </div>

      {/* Quick Topic Chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['All', ...LIT_TOPICS].slice(0, 6).map(t => (
          <button
            key={t}
            onClick={() => setSelTopic(t)}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
              selTopic === t
                ? 'bg-orange-600 text-white shadow-md shadow-orange-100'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-orange-400'
            }`}
          >
            {t === 'All' ? 'सर्व' : t}
          </button>
        ))}
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-slate-400 font-bold mb-4 px-1">
          {filtered.length} प्रश्न / विषय सापडले
        </p>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
            <p className="font-black text-slate-400 animate-pulse">साहित्य डाटा लोड होत आहे...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="font-bold text-slate-400">या निवडीसाठी सध्या प्रश्न उपलब्ध नाहीत.</p>
            <p className="text-xs text-slate-300 mt-1">वेगळा प्रकार किंवा परीक्षा निवडा</p>
          </div>
        ) : (
          filtered.map((q, idx) => {
            const isRevealed = revealed[q.id];
            return (
              <div
                key={q.id}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Card Top Strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 to-amber-400" />

                <div className="p-8">
                  {/* Metadata badges */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {q.topic && (
                      <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">
                        {q.topic}
                      </span>
                    )}
                    {q.exam_name && (
                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">
                        {q.exam_name}
                      </span>
                    )}
                    {q.author && (
                      <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">
                        ✍️ {q.author}
                      </span>
                    )}
                    {q.work && (
                      <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">
                        📖 {q.work}
                      </span>
                    )}
                    {q.year && (
                      <span className="bg-indigo-50 text-indigo-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">
                        {q.year}
                      </span>
                    )}
                  </div>

                  {/* Question */}
                  <h3 className="text-xl font-bold text-slate-800 leading-relaxed mb-6">
                    <span className="text-orange-500 mr-2 font-black">प्र. {idx + 1}</span>
                    {q.question}
                  </h3>

                  {/* Toggle Button */}
                  <button
                    onClick={() => toggleReveal(q.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      isRevealed
                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        : 'bg-orange-600 text-white shadow-lg shadow-orange-100 hover:scale-[1.02]'
                    }`}
                  >
                    {isRevealed ? (
                      <><EyeOff size={14} /> उत्तर लपवा</>
                    ) : (
                      <><Eye size={14} /> आदर्श उत्तर पहा</>
                    )}
                  </button>

                  {/* Model Answer */}
                  {isRevealed && (
                    <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="bg-slate-900 rounded-[1.5rem] p-6">
                        <div className="flex items-center gap-2 mb-4 text-orange-400 font-black uppercase tracking-widest text-[10px]">
                          <BookOpen size={14} />
                          संशोधन आधारित आदर्श उत्तर
                        </div>
                        <p className="text-slate-200 leading-relaxed font-medium whitespace-pre-line text-sm">
                          {q.model_answer || 'उत्तर लवकरच उपलब्ध केले जाईल.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const SelectFilter = ({
  label,
  value,
  onChange,
  options,
  allLabel,
  accentColor,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allLabel: string;
  accentColor: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full p-4 bg-white rounded-2xl font-bold outline-none border-2 border-transparent focus:border-${accentColor}-500 transition-all appearance-none cursor-pointer text-slate-700 shadow-sm`}
      >
        <option value="All">{allLabel}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
    </div>
  </div>
);

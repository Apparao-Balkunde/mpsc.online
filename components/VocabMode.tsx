import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, BookOpen, Search, Filter, Languages } from 'lucide-react';

export const VocabMode: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [vocab, setVocab] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // नवीन फिल्टर्स
  const [selLang, setSelLang] = useState('All'); // Marathi / English
  const [selType, setSelType] = useState('All'); // Synonyms / Antonyms / etc.

  const vocabTypes = [
    'Synonyms', 
    'Antonyms', 
    'One Word Substitution', 
    'Idioms & Phrases', 
    'Grammar Question'
  ];

  useEffect(() => {
    const fetchVocab = async () => {
      setLoading(true);
      try {
        let query = supabase.from('vocab_questions').select('*');
        
        if (selLang !== 'All') query = query.eq('language', selLang);
        if (selType !== 'All') query = query.eq('category', selType);

        const { data, error } = await query;
        if (error) throw error;
        setVocab(data || []);
      } catch (err) {
        console.error("Error fetching vocab:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVocab();
  }, [selLang, selType]);

  const filteredVocab = vocab.filter(item => 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.explanation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900">शब्दसंग्रह (Vocab)</h2>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Marathi & English Master</p>
          </div>
        </div>
        <Languages className="text-indigo-200" size={40} />
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="कोणताही शब्द किंवा अर्थ शोधा..." 
            className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] border-none shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <select 
            value={selLang} 
            onChange={(e) => setSelLang(e.target.value)}
            className="p-4 bg-white border-none rounded-2xl font-bold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">सर्व भाषा</option>
            <option value="Marathi">Marathi (मराठी)</option>
            <option value="English">English (इंग्रजी)</option>
          </select>

          <select 
            value={selType} 
            onChange={(e) => setSelType(e.target.value)}
            className="p-4 bg-white border-none rounded-2xl font-bold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">सर्व प्रकार</option>
            {vocabTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </div>

      {/* Content List */}
      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-20 font-bold text-slate-400 animate-pulse">शब्द शोधत आहोत...</div>
        ) : filteredVocab.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <p className="font-bold text-slate-400">या प्रकारात सध्या शब्द उपलब्ध नाहीत.</p>
          </div>
        ) : (
          filteredVocab.map((item) => (
            <div key={item.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider w-fit ${
                    item.language === 'Marathi' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {item.language}
                  </span>
                  <h3 className="text-2xl font-black text-slate-800 mt-2">{item.question}</h3>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase">
                  {item.category}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                  <p className="text-slate-700 font-bold leading-relaxed">{item.explanation}</p>
                </div>

                {item.options && (
                   <div className="bg-indigo-50/50 p-5 rounded-[1.5rem] border border-indigo-100/50">
                    <div className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Correct Answer / Usage</div>
                    <p className="text-indigo-900 font-black text-lg">
                      {item.options[item.correct_answer_index]}
                    </p>
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

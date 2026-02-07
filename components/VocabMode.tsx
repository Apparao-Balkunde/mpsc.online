import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { VocabWord } from '../types';
import { ArrowLeft, BookOpen, Volume2, Search } from 'lucide-react';

export const VocabMode: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [vocab, setVocab] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchVocab = async () => {
      const { data } = await supabase.from('vocab_questions').select('*');
      if (data) setVocab(data);
      setLoading(false);
    };
    fetchVocab();
  }, []);

  const filteredVocab = vocab.filter(item => 
    item.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-xl transition-all">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-slate-900">इंग्रजी शब्दसंग्रह (Vocab)</h2>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="शब्द शोधा..." 
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-6">
        {loading ? <p>लोड होत आहे...</p> : filteredVocab.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-indigo-600">{item.question.split("'")[1]}</h3>
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold uppercase">
                {item.category || "Vocabulary"}
              </span>
            </div>
            <p className="text-slate-700 font-medium mb-4">{item.explanation}</p>
            <div className="bg-indigo-50/50 p-4 rounded-2xl text-sm text-indigo-800">
              <strong>लक्षात ठेवा:</strong> {item.options[item.correct_answer_index]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

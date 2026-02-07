import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, History, Filter } from 'lucide-react';

export const PYQMode: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [year, setYear] = useState<string>("ALL");

  useEffect(() => {
    const fetchPYQs = async () => {
      let query = supabase.from('mpsc_questions').select('*').eq('is_pyq', true);
      if (year !== "ALL") query = query.eq('year', parseInt(year));
      
      const { data } = await query;
      if (data) setPyqs(data);
    };
    fetchPYQs();
  }, [year]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-xl"><ArrowLeft /></button>
          <h2 className="text-2xl font-black text-slate-900">PYQ संच</h2>
        </div>
        <select 
          onChange={(e) => setYear(e.target.value)}
          className="bg-white border border-slate-200 p-2 rounded-lg font-bold"
        >
          <option value="ALL">सर्व वर्षे</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>
      </div>

      <div className="space-y-4">
        {pyqs.map(q => (
          <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-100">
            <div className="flex gap-2 mb-2">
              <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded uppercase">
                MPSC {q.year}
              </span>
            </div>
            <p className="font-bold text-slate-800">{q.question}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

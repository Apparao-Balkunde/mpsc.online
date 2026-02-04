
import React, { useState, useEffect } from 'react';
import { CurrentAffairItem, LoadingState } from '../types';
import { generateCurrentAffairs } from '../services/gemini';
import { Newspaper, Loader2, ArrowLeft, RefreshCw, Calendar, Tag, AlertCircle, TrendingUp, Languages, Database } from 'lucide-react';

interface CurrentAffairsModeProps {
  onBack: () => void;
}

const CATEGORIES = ["Maharashtra Special", "National News", "International Relations", "Sports", "Economy & Budget"];

export const CurrentAffairsMode: React.FC<CurrentAffairsModeProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<string>("Maharashtra Special");
  const [language, setLanguage] = useState<'Marathi' | 'English'>('Marathi');
  const [news, setNews] = useState<CurrentAffairItem[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [status, setStatus] = useState<LoadingState>('idle');

  useEffect(() => { fetchNews(activeCategory, language); }, [activeCategory, language]);

  const fetchNews = async (category: string, lang: 'Marathi' | 'English') => {
    setStatus('loading');
    try {
      const result = await generateCurrentAffairs(category, lang);
      setNews(result.data);
      setFromCache(result.fromCache);
      setStatus('success');
    } catch (e) { setStatus('error'); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-72 bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden shrink-0 sticky top-24">
          <div className="p-4 bg-indigo-900 text-white font-bold flex items-center gap-2">
            <Newspaper size={20} className="text-yellow-400" /> Topics
          </div>
          <div className="p-4 border-b border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setLanguage('Marathi')} className={`py-2 px-3 rounded-lg text-sm font-bold ${language === 'Marathi' ? 'bg-orange-100 text-orange-700' : 'bg-slate-50'}`}>Marathi</button>
                  <button onClick={() => setLanguage('English')} className={`py-2 px-3 rounded-lg text-sm font-bold ${language === 'English' ? 'bg-blue-100 text-blue-700' : 'bg-slate-50'}`}>English</button>
              </div>
          </div>
          <div className="p-2 space-y-1">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeCategory === cat ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}>{cat}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">{activeCategory}</h1>
                   <div className="flex items-center gap-2 mt-1">
                      <p className="text-slate-500 text-sm">Serving latest exam-relevent news.</p>
                      {fromCache && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-black shadow-sm"><Database size={10}/> OFFLINE DATA SOURCE</span>}
                   </div>
                </div>
                <button onClick={() => fetchNews(activeCategory, language)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"><RefreshCw size={20} className={status === 'loading' ? 'animate-spin' : ''} /></button>
             </div>

             {status === 'loading' && <div className="text-center py-24"><Loader2 className="animate-spin h-10 w-10 text-indigo-600 mx-auto" /><p className="text-slate-500 font-medium mt-2">Accessing Local News Archives...</p></div>}

             {status === 'success' && (
                <div className="grid gap-6">
                   {news.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group">
                         <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700">{item.headline}</h3>
                            <span className="shrink-0 px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded flex items-center gap-1"><Calendar size={12} /> {item.date}</span>
                         </div>
                         <p className="text-slate-600 mb-4 leading-relaxed">{item.description}</p>
                         <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <h4 className="text-[10px] font-black text-amber-800 uppercase mb-1 flex items-center gap-1"><Tag size={12} /> Exam Relevance</h4>
                            <p className="text-sm text-slate-700">{item.examRelevance}</p>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

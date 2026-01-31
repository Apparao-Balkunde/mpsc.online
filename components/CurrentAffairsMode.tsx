import React, { useState, useEffect } from 'react';
import { CurrentAffairItem, LoadingState } from '../types';
import { generateCurrentAffairs } from '../services/gemini';
import { Newspaper, Loader2, ArrowLeft, RefreshCw, Calendar, Tag, AlertCircle, TrendingUp, MapPin, Languages } from 'lucide-react';

interface CurrentAffairsModeProps {
  onBack: () => void;
}

const CATEGORIES = [
  "Maharashtra Special",
  "National News",
  "International Relations",
  "Awards & Honours",
  "Sports",
  "Science & Technology",
  "Economy & Budget",
  "Government Schemes"
];

export const CurrentAffairsMode: React.FC<CurrentAffairsModeProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<string>("Maharashtra Special");
  const [language, setLanguage] = useState<'Marathi' | 'English'>('Marathi');
  const [news, setNews] = useState<CurrentAffairItem[]>([]);
  const [status, setStatus] = useState<LoadingState>('idle');

  // Load news when category or language changes
  useEffect(() => {
    fetchNews(activeCategory, language);
  }, [activeCategory, language]);

  const fetchNews = async (category: string, lang: 'Marathi' | 'English') => {
    setStatus('loading');
    setNews([]);
    try {
      const data = await generateCurrentAffairs(category, lang);
      setNews(data);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-72 bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden shrink-0 sticky top-24">
          <div className="p-4 bg-indigo-900 text-white">
            <h2 className="font-bold flex items-center gap-2">
              <Newspaper size={20} className="text-yellow-400" />
              Topics & Language
            </h2>
          </div>

          <div className="p-4 border-b border-slate-100">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                 <Languages size={12} /> Language
             </label>
              <div className="grid grid-cols-2 gap-2">
                  <button 
                      onClick={() => setLanguage('Marathi')}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${language === 'Marathi' ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                      Marathi
                  </button>
                  <button 
                        onClick={() => setLanguage('English')}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${language === 'English' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                      English
                  </button>
              </div>
          </div>

          <div className="p-2 space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  activeCategory === cat
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                {cat}
                {activeCategory === cat && <TrendingUp size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
             <div className="flex justify-between items-center mb-4">
                <div>
                   <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                       {activeCategory}
                       <span className="text-sm font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                           {language}
                       </span>
                   </h1>
                   <p className="text-slate-500 text-sm">Curated from last 6 months for MPSC Rajyaseva & Combined Exams.</p>
                </div>
                <button 
                  onClick={() => fetchNews(activeCategory, language)}
                  disabled={status === 'loading'}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  title="Refresh News"
                >
                  <RefreshCw size={20} className={status === 'loading' ? 'animate-spin' : ''} />
                </button>
             </div>

             {status === 'loading' && (
                <div className="text-center py-24">
                  <Loader2 className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium animate-pulse">Scanning latest sources for {activeCategory}...</p>
                  <p className="text-slate-400 text-sm mt-1">Language: {language}</p>
                </div>
             )}

             {status === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg flex items-center gap-3">
                  <AlertCircle size={24} />
                  <div>
                    <h4 className="font-bold">Update Failed</h4>
                    <p className="text-sm">Unable to fetch current affairs at the moment. Please try refreshing.</p>
                  </div>
                </div>
             )}

             {status === 'success' && (
                <div className="grid gap-6">
                   {news.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                         <div className="p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                               <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors">
                                  {item.headline}
                               </h3>
                               <span className="shrink-0 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md flex items-center gap-1">
                                  <Calendar size={12} /> {item.date}
                               </span>
                            </div>
                            
                            <p className="text-slate-600 mb-4 leading-relaxed">
                               {item.description}
                            </p>

                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                               <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                                  <Tag size={12} /> Exam Relevance
                               </h4>
                               <p className="text-sm text-slate-700">
                                  {item.examRelevance}
                               </p>
                            </div>
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
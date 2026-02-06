import React, { useState, useEffect } from 'react';
import { CurrentAffairItem, LoadingState } from '../types';
// तुमची JSON फाईल इम्पोर्ट करा (पाथ तुमच्या प्रोजेक्टनुसार तपासा)
import currentAffairsData from '../data/current_affairs.json'; 
import { Newspaper, Loader2, ArrowLeft, RefreshCw, Calendar, Tag, Database, Search } from 'lucide-react';

interface CurrentAffairsModeProps {
  onBack: () => void;
}

// Categories तुमच्या JSON मधील Keys शी जुळल्या पाहिजेत
const CATEGORIES = ["Maharashtra Special", "National News", "International Relations", "Sports", "Economy & Budget"];

export const CurrentAffairsMode: React.FC<CurrentAffairsModeProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<string>("Maharashtra Special");
  const [news, setNews] = useState<CurrentAffairItem[]>([]);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadStaticNews();
  }, [activeCategory]);

  const loadStaticNews = () => {
    setStatus('loading');
    
    // थोडा वेळ (Delay) देऊन डेटा लोड करणे जेणेकरून स्मूथ वाटेल
    setTimeout(() => {
      try {
        // JSON मधून डेटा काढणे
        const data = (currentAffairsData as any)[activeCategory] || [];
        setNews(data);
        setStatus('success');
      } catch (error) {
        console.error("Data loading error:", error);
        setStatus('error');
      }
    }, 500);
  };

  // सर्च फिल्टर (बातम्यांमध्ये शोधण्यासाठी)
  const filteredNews = news.filter(item => 
    item.headline.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 font-bold transition-colors">
          <ArrowLeft size={18} className="mr-2" /> मागे फिरा
        </button>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="बातम्या शोधा..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar: Topic Selection */}
        <div className="w-full md:w-72 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0 sticky top-6">
          <div className="p-4 bg-indigo-900 text-white font-black flex items-center gap-2">
            <Newspaper size={20} className="text-yellow-400" /> विषय सूची
          </div>
          <div className="p-2 space-y-1">
            {CATEGORIES.map((cat) => (
              <button 
                key={cat} 
                onClick={() => {setActiveCategory(cat); setSearchTerm("");}} 
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeCategory === cat ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {cat === "Maharashtra Special" ? "महाराष्ट्र विशेष" : 
                 cat === "National News" ? "राष्ट्रीय घडामोडी" : 
                 cat === "International Relations" ? "आंतरराष्ट्रीय" : 
                 cat === "Sports" ? "क्रीडा" : "अर्थव्यवस्था"}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h1 className="text-2xl font-black text-slate-900">{activeCategory}</h1>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 font-black">
                        <Database size={10}/> अधिकृत संग्रह
                      </span>
                   </div>
                </div>
                <button onClick={loadStaticNews} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100 shadow-sm">
                  <RefreshCw size={20} className={status === 'loading' ? 'animate-spin' : ''} />
                </button>
             </div>

             {status === 'loading' && (
                <div className="text-center py-20">
                  <Loader2 className="animate-spin h-10 w-10 text-indigo-600 mx-auto" />
                  <p className="text-slate-500 font-bold mt-4">संग्रहातून माहिती शोधत आहे...</p>
                </div>
             )}

             {status === 'success' && filteredNews.length > 0 ? (
                <div className="grid gap-6">
                   {filteredNews.map((item, idx) => (
                      <div key={idx} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 hover:border-indigo-300 hover:bg-white transition-all group shadow-sm">
                         <div className="flex justify-between items-start mb-3 gap-4">
                            <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-700">{item.headline}</h3>
                            <span className="shrink-0 px-2 py-1 bg-white text-slate-500 text-[10px] font-bold rounded-lg border border-slate-200 flex items-center gap-1">
                              <Calendar size={12} /> {item.date}
                            </span>
                         </div>
                         <p className="text-slate-600 mb-4 leading-relaxed font-medium">{item.description}</p>
                         <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <h4 className="text-[10px] font-black text-indigo-800 uppercase mb-1 flex items-center gap-1">
                              <Tag size={12} /> परीक्षेसाठी महत्त्व
                            </h4>
                            <p className="text-sm text-slate-700 font-semibold">{item.examRelevance}</p>
                         </div>
                      </div>
                   ))}
                </div>
             ) : status === 'success' && (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Newspaper className="mx-auto text-slate-300 mb-3" size={48} />
                  <p className="text-slate-500 font-bold">माहिती उपलब्ध नाही किंवा शोधलेली बातमी सापडली नाही.</p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

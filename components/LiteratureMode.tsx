
import React, { useState } from 'react';
import { DescriptiveQA, LoadingState } from '../types';
import { generateDescriptiveQA } from '../services/gemini';
import { ArrowLeft, BookOpen, PenTool, Loader2, Sparkles, Eye, CheckCircle2, Copy, FileText, GraduationCap, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface LiteratureModeProps { onBack: () => void; }

const LIT_TOPICS = ["दलित साहित्यातील विद्रोहाचे स्वरूप", "स्त्रीवादी जाणिवांचा तौलनिक अभ्यास", "कोसला कादंबरी: अस्तित्ववाद", "मर्ढेकरांच्या कवितेतील विसंवाद"];

export const LiteratureMode: React.FC<LiteratureModeProps> = ({ onBack }) => {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [qaData, setQaData] = useState<DescriptiveQA | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setStatus('loading');
    try {
      const result = await generateDescriptiveQA(topic);
      setQaData(result.data);
      setFromCache(result.fromCache);
      setStatus('success');
    } catch (e) { setStatus('error'); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors"><ArrowLeft size={16} className="mr-1" /> Back to Dashboard</button>
      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
          <h2 className="text-2xl font-bold text-orange-900 mb-2 flex items-center"><GraduationCap className="mr-3 text-orange-700 h-8 w-8" /> Literature Practice (PhD Level)</h2>
          <p className="text-orange-800 text-sm">Critical analysis and model answers for Mains and PhD aspirants.</p>
        </div>
        <div className="p-6">
            <div className="grid grid-cols-2 gap-3 mb-4">
               {LIT_TOPICS.map((t) => (
                 <button key={t} onClick={() => setTopic(t)} className={`text-left p-4 rounded-lg border transition-all ${topic === t ? 'bg-orange-50 border-orange-400 text-orange-900 font-bold shadow-sm' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{t}</button>
               ))}
            </div>
            <div className="flex gap-2">
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Type specific thesis topic..." className="flex-1 border rounded-lg p-3 outline-none" />
                <button onClick={handleGenerate} className="bg-orange-700 text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2">{status === 'loading' ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} Analysis</button>
            </div>
        </div>
      </div>

      {status === 'loading' && <div className="text-center py-20"><Loader2 className="animate-spin h-12 w-12 text-orange-600 mx-auto mb-4" /><p className="text-slate-800 font-bold">Scanning Professional Archives...</p></div>}

      {status === 'success' && qaData && (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-orange-600 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Academic Question</span>
                        {fromCache && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-black shadow-sm"><Database size={10}/> SAVED LOCALLY</span>}
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(qaData.question)} className="text-slate-400 hover:text-orange-600"><Copy size={18} /></button>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 leading-relaxed font-serif">{qaData.question}</h3>
            </div>
            <div className="flex flex-col gap-4">
                <button onClick={() => setShowModelAnswer(!showModelAnswer)} className="self-center bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-xl flex items-center gap-3">{showModelAnswer ? 'Hide Analysis' : 'Show Expert Model Answer'}</button>
                {showModelAnswer && (
                    <div className="bg-white rounded-xl shadow-2xl border border-indigo-100 overflow-hidden mb-10">
                        <div className="bg-indigo-900 text-white p-5 flex justify-between items-center"><h4 className="font-bold flex items-center gap-2"><FileText size={20} className="text-yellow-400"/> Model Research Answer</h4></div>
                        <div className="p-8 prose max-w-none font-serif text-lg leading-loose"><ReactMarkdown>{qaData.modelAnswer}</ReactMarkdown></div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

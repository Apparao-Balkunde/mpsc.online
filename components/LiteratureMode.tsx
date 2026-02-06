import React, { useState } from 'react';
import { DescriptiveQA, LoadingState } from '../types';
// AI ऐवजी तुमची Local Data सेवा वापरा
import { getLiteratureAnalysis } from '../services/localData'; 
import { ArrowLeft, Loader2, Eye, EyeOff, Copy, FileText, GraduationCap, Database, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface LiteratureModeProps { onBack: () => void; }

// मराठी साहित्यातील महत्त्वाचे संशोधनाचे विषय
const LIT_TOPICS = [
  "दलित साहित्यातील विद्रोहाचे स्वरूप", 
  "स्त्रीवादी जाणिवांचा तौलनिक अभ्यास", 
  "कोसला कादंबरी: अस्तित्ववाद", 
  "मर्ढेकरांच्या कवितेतील विसंवाद"
];

export const LiteratureMode: React.FC<LiteratureModeProps> = ({ onBack }) => {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [qaData, setQaData] = useState<DescriptiveQA | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  const handleFetchAnalysis = async () => {
    if (!topic) return;
    setStatus('loading');
    
    // थोडा वेळ देऊन डेटा लोड करणे जेणेकरून तो नैसर्गिक वाटेल
    setTimeout(() => {
      try {
        const result = getLiteratureAnalysis(topic);
        if (result) {
          setQaData(result);
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (e) { 
        setStatus('error'); 
      }
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors font-bold">
        <ArrowLeft size={18} className="mr-2" /> डॅशबोर्डवर परत जा
      </button>

      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
          <h2 className="text-2xl font-black text-orange-900 mb-2 flex items-center">
            <GraduationCap className="mr-3 text-orange-700 h-8 w-8" /> 
            साहित्य समीक्षा (MPSC/PhD)
          </h2>
          <p className="text-orange-800 text-sm font-medium italic">मुख्य परीक्षा आणि संशोधकांसाठी सखोल विश्लेषण आणि आदर्श उत्तरे.</p>
        </div>
        
        <div className="p-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">महत्त्वाचे विषय निवडा:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
               {LIT_TOPICS.map((t) => (
                 <button 
                   key={t} 
                   onClick={() => setTopic(t)} 
                   className={`text-left p-4 rounded-xl border-2 transition-all ${topic === t ? 'bg-orange-50 border-orange-500 text-orange-900 font-bold shadow-sm' : 'border-slate-100 text-slate-700 hover:border-orange-200 hover:bg-slate-50'}`}
                 >
                   {t}
                 </button>
               ))}
            </div>
            
            <div className="flex flex-col md:flex-row gap-3">
                <input 
                  type="text" 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  placeholder="इतर कोणताही साहित्य विषय टाइप करा..." 
                  className="flex-1 border-2 border-slate-100 rounded-xl p-4 outline-none focus:border-orange-400 transition-all font-medium" 
                />
                <button 
                  onClick={handleFetchAnalysis} 
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-black shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {status === 'loading' ? <Loader2 className="animate-spin" /> : <BookOpen size={20} />} 
                  विश्लेषण पहा
                </button>
            </div>
        </div>
      </div>

      {/* Loading State */}
      {status === 'loading' && (
        <div className="text-center py-20">
          <Loader2 className="animate-spin h-12 w-12 text-orange-600 mx-auto mb-4" />
          <p className="text-slate-800 font-black">साहित्यिक पुरावे आणि संदर्भ शोधत आहे...</p>
        </div>
      )}

      {/* Result Section */}
      {status === 'success' && qaData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-l-8 border-orange-600 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <span className="bg-orange-100 text-orange-900 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1">
                      <FileText size={12}/> संदर्भीय प्रश्न
                    </span>
                    <button onClick={() => navigator.clipboard.writeText(qaData.question)} className="text-slate-300 hover:text-orange-600 transition-colors">
                      <Copy size={20} />
                    </button>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 leading-relaxed font-serif">{qaData.question}</h3>
            </div>

            <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setShowModelAnswer(!showModelAnswer)} 
                  className={`self-center px-10 py-4 rounded-full font-black shadow-xl flex items-center gap-3 transition-all ${showModelAnswer ? 'bg-slate-800 text-white' : 'bg-orange-600 text-white hover:bg-orange-700 animate-bounce-subtle'}`}
                >
                  {showModelAnswer ? <EyeOff size={20} /> : <Eye size={20} />} 
                  {showModelAnswer ? 'विश्लेषण लपवा' : 'तज्ञांचे आदर्श उत्तर पहा'}
                </button>

                {showModelAnswer && (
                    <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden mb-10 animate-in zoom-in-95 duration-300">
                        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                          <h4 className="font-bold flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-emerald-400"/> 
                            संशोधन आधारित उत्तर (Model Research Answer)
                          </h4>
                          <span className="text-[10px] font-black bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                            <Database size={12}/> अधिकृत स्रोत
                          </span>
                        </div>
                        <div className="p-8 md:p-12 prose max-w-none font-serif text-lg leading-loose text-slate-800 bg-orange-50/20">
                          <ReactMarkdown>{qaData.modelAnswer}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="text-center py-20 bg-red-50 rounded-2xl border-2 border-dashed border-red-200">
          <p className="text-red-600 font-bold text-lg">क्षमस्व! या विषयावर सध्या माहिती उपलब्ध नाही.</p>
          <p className="text-red-500 text-sm mt-1">कृपया वरीलपैकी एक विषय निवडा.</p>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { PERMANENT_MASTER_DATA } from '../services/localData';
// AI services काढून आता फक्त डेटा फेचिंगवर लक्ष केंद्रित केले आहे
import { ArrowLeft, Database, Eye, GraduationCap, UploadCloud, RefreshCw, Loader2, MessageSquareCode, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface GlobalLibraryProps {
  onBack: () => void;
}

export const GlobalLibrary: React.FC<GlobalLibraryProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'NOTES' | 'QUESTIONS' | 'CONTRIBUTE'>('NOTES');
  const [revealedIdx, setRevealedIdx] = useState<number | null>(null);
  const [communityContent, setCommunityContent] = useState({ questions: [], notes: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    setIsLoading(true);
    try {
        // येथे भविष्यात तुम्ही Supabase किंवा स्वतःचा API कॉल करू शकता
        // सध्या आपण फक्त Local Master Data वर लक्ष केंद्रित करू
        setCommunityContent({ questions: [], notes: [] });
    } catch (e) {
        console.error("माहिती लोड करण्यात अडचण आली.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleContribute = async () => {
    const text = prompt("तुमची नोट किंवा प्रश्न (JSON फॉरमॅटमध्ये) येथे पेस्ट करा:");
    if (!text) return;

    setSubmitStatus('loading');
    try {
        // कॉन्ट्रिब्यूशन लॉजिक (Backend आवश्यक)
        setTimeout(() => {
            setSubmitStatus('success');
            setTimeout(() => setSubmitStatus('idle'), 3000);
        }, 1500);
    } catch (e) {
        alert("माहिती चुकीच्या फॉरमॅटमध्ये आहे.");
        setSubmitStatus('idle');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 font-bold transition-colors">
            <ArrowLeft size={18} className="mr-2" /> मागे फिरा
        </button>
        <button onClick={loadCommunityData} className="p-2 text-slate-400 hover:text-indigo-600 transition-all bg-white rounded-full shadow-sm border border-slate-100">
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-6">
        <div className="p-8 bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Database size={120} fill="currentColor" />
          </div>
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <Database className="text-emerald-400" />
            MPSC डिजिटल लायब्ररी
          </h2>
          <p className="text-slate-400 font-medium font-devanagari">राज्यातील विद्यार्थ्यांसाठी सामायिक केलेला अभ्यासक्रम आणि नोट्स.</p>
        </div>
        
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => setActiveTab('NOTES')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'NOTES' ? 'border-emerald-500 text-emerald-700 bg-white' : 'border-transparent text-slate-400'}`}
          >
            अभ्यास नोट्स ({PERMANENT_MASTER_DATA.notes.length + communityContent.notes.length})
          </button>
          <button
            onClick={() => setActiveTab('QUESTIONS')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'QUESTIONS' ? 'border-emerald-500 text-emerald-700 bg-white' : 'border-transparent text-slate-400'}`}
          >
            प्रश्न संच ({PERMANENT_MASTER_DATA.questions.length + communityContent.questions.length})
          </button>
          <button
            onClick={() => setActiveTab('CONTRIBUTE')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'CONTRIBUTE' ? 'border-indigo-500 text-indigo-700 bg-white' : 'border-transparent text-slate-400'}`}
          >
            <span className="flex items-center justify-center gap-2"><UploadCloud size={14} /> योगदान</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'NOTES' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {[...PERMANENT_MASTER_DATA.notes, ...communityContent.notes].map((note, idx) => (
              <div key={idx} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-6 bg-emerald-50/50 border-b border-emerald-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600 text-white rounded-xl"><GraduationCap size={20}/></div>
                        <div>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{note.subject}</span>
                            <h4 className="font-black text-lg text-slate-900">{note.topic}</h4>
                        </div>
                    </div>
                    {idx >= PERMANENT_MASTER_DATA.notes.length && <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-1 rounded uppercase">Community</span>}
                </div>
                <div className="p-10 prose prose-slate max-w-none prose-strong:text-emerald-900 font-medium">
                  <ReactMarkdown>{note.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'QUESTIONS' && (
           <div className="space-y-6 animate-in fade-in duration-500">
              {[...PERMANENT_MASTER_DATA.questions, ...communityContent.questions].map((q, idx) => (
                <div key={idx} className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 group relative">
                   <div className="flex gap-4 mb-6">
                      <span className="bg-emerald-50 text-emerald-600 w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0">{idx + 1}</span>
                      <h4 className="text-xl font-bold text-slate-900 leading-relaxed">{q.question}</h4>
                   </div>
                   <div className="ml-12 grid md:grid-cols-2 gap-3 mb-6">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`p-4 rounded-2xl border-2 text-sm font-bold ${oIdx === q.correctAnswerIndex ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-slate-50 text-slate-400'}`}>
                          <span className="opacity-30 mr-2">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                        </div>
                      ))}
                   </div>
                   <div className="ml-12">
                      <button onClick={() => setRevealedIdx(revealedIdx === idx ? null : idx)} className="text-emerald-600 font-bold text-sm flex items-center gap-2 hover:underline">
                        <Eye size={16} /> {revealedIdx === idx ? 'स्पष्टीकरण लपवा' : 'स्पष्टीकरण पहा'}
                      </button>
                      {revealedIdx === idx && (
                        <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2">
                          <div className="prose prose-sm text-slate-700 font-medium">
                            <ReactMarkdown>{q.explanation}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                   </div>
                </div>
              ))}
           </div>
        )}

        {activeTab === 'CONTRIBUTE' && (
          <div className="bg-white rounded-3xl shadow-xl border border-indigo-100 p-10 text-center animate-in zoom-in-95">
             <div className="max-w-2xl mx-auto space-y-6">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <MessageSquareCode size={40} />
                </div>
                <h3 className="text-3xl font-black text-slate-900">तुमच्या नोट्स शेअर करा</h3>
                <p className="text-slate-600 font-bold font-devanagari">
                  इतर विद्यार्थ्यांना मदत करण्यासाठी तुमच्याकडील दर्जेदार नोट्स किंवा प्रश्न येथे सबमिट करा.
                </p>
                
                <button 
                    onClick={handleContribute}
                    disabled={submitStatus === 'loading'}
                    className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3 ${submitStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                    {submitStatus === 'loading' ? <Loader2 className="animate-spin" /> : submitStatus === 'success' ? <CheckCircle /> : <UploadCloud />}
                    {submitStatus === 'success' ? 'पाठवले गेले!' : 'लायब्ररीमध्ये सबमिट करा'}
                </button>

                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-10">तुमच्या योगदानाची पडताळणी प्रशासकांकडून केली जाईल</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

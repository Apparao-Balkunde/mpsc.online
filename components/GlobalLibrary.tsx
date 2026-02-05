import React, { useState } from 'react';
import { PERMANENT_MASTER_DATA } from '../services/localData';
import { ArrowLeft, Book, Database, Eye, GraduationCap, FileText, Bookmark, Clock, Share2, Copy, Check, MessageSquareCode } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface GlobalLibraryProps {
  onBack: () => void;
}

export const GlobalLibrary: React.FC<GlobalLibraryProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'NOTES' | 'QUESTIONS' | 'CONTRIBUTE'>('NOTES');
  const [revealedIdx, setRevealedIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-6">
        <div className="p-8 bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Database size={120} fill="currentColor" />
          </div>
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <Database className="text-emerald-400" />
            Permanent Master Library
          </h2>
          <p className="text-slate-400 font-medium">हे सर्व विद्यार्थ्यांसाठी मोफत आणि कायमस्वरूपी उपलब्ध असणारे साहित्य आहे.</p>
        </div>
        
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => setActiveTab('NOTES')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'NOTES' ? 'border-emerald-500 text-emerald-700 bg-white' : 'border-transparent text-slate-400'}`}
          >
            Verified Notes ({PERMANENT_MASTER_DATA.notes.length})
          </button>
          <button
            onClick={() => setActiveTab('QUESTIONS')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'QUESTIONS' ? 'border-emerald-500 text-emerald-700 bg-white' : 'border-transparent text-slate-400'}`}
          >
            Master PYQ Bank ({PERMANENT_MASTER_DATA.questions.length})
          </button>
          <button
            onClick={() => setActiveTab('CONTRIBUTE')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'CONTRIBUTE' ? 'border-indigo-500 text-indigo-700 bg-white' : 'border-transparent text-slate-400'}`}
          >
            <span className="flex items-center justify-center gap-2"><Share2 size={12} /> Contribute</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'NOTES' && (
          PERMANENT_MASTER_DATA.notes.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
               <p className="text-slate-400 font-bold italic">No notes published yet.</p>
            </div>
          ) : (
            PERMANENT_MASTER_DATA.notes.map((note, idx) => (
              <div key={idx} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-6 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600 text-white rounded-xl"><GraduationCap size={20}/></div>
                        <div>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{note.subject}</span>
                            <h4 className="font-black text-lg text-slate-900">{note.topic}</h4>
                        </div>
                    </div>
                </div>
                <div className="p-10 prose prose-slate max-w-none prose-strong:text-emerald-900">
                  <ReactMarkdown>{note.content}</ReactMarkdown>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'QUESTIONS' && (
          PERMANENT_MASTER_DATA.questions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
               <p className="text-slate-400 font-bold italic">No questions published yet.</p>
            </div>
          ) : (
            PERMANENT_MASTER_DATA.questions.map((q, idx) => (
              <div key={idx} className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 group relative">
                 <div className="flex gap-4 mb-6">
                    <span className="bg-emerald-50 text-emerald-600 w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0">{idx + 1}</span>
                    <h4 className="text-xl font-bold text-slate-900 leading-relaxed">{q.question}</h4>
                 </div>
                 <div className="ml-12 grid md:grid-cols-2 gap-3 mb-6">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className={`p-4 rounded-2xl border-2 text-sm font-medium ${oIdx === q.correctAnswerIndex ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-slate-50 text-slate-400'}`}>
                        {opt}
                      </div>
                    ))}
                 </div>
                 <div className="ml-12">
                    <button onClick={() => setRevealedIdx(revealedIdx === idx ? null : idx)} className="text-emerald-600 font-bold text-sm flex items-center gap-2">
                      <Eye size={16} /> {revealedIdx === idx ? 'Hide Solution' : 'View Master Solution'}
                    </button>
                    {revealedIdx === idx && (
                      <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2">
                        {/* Fixed: Wrapped ReactMarkdown in a div as it doesn't support className directly in some versions */}
                        <div className="prose prose-sm text-slate-700">
                          <ReactMarkdown>{q.explanation}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
            ))
          )
        )}

        {activeTab === 'CONTRIBUTE' && (
          <div className="bg-white rounded-3xl shadow-xl border border-indigo-100 p-10 animate-in fade-in zoom-in-95">
             <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <MessageSquareCode size={40} />
                </div>
                <h3 className="text-3xl font-black text-slate-900">Add Your Permanent Content</h3>
                <p className="text-slate-600 font-medium">
                  तुम्हाला जर तुमच्या नोट्स सर्व मुलांसाठी मोफत आणि कायमस्वरूपी उपलब्ध करून द्यायच्या असतील, तर खालील स्टेप्स फॉलो करा:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="font-black text-indigo-600 mb-1">Step 1</div>
                      <p className="text-xs font-bold text-slate-500">तुमची माहिती 'Saved' सेक्शन मध्ये 'Backup' करा.</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="font-black text-indigo-600 mb-1">Step 2</div>
                      <p className="text-xs font-bold text-slate-500">ती बॅकअप फाईल ओपन करून त्यातील डेटा कॉपी करा.</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="font-black text-indigo-600 mb-1">Step 3</div>
                      <p className="text-xs font-bold text-slate-500">तो डेटा मला द्या, मी तो कायमस्वरूपी वेबसाईटवर ॲड करेन.</p>
                   </div>
                </div>
                
                <div className="pt-6 border-t border-slate-100">
                   <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4">Zero Cost Permanent Storage</p>
                   <div className="bg-slate-900 p-6 rounded-2xl text-left overflow-hidden relative group">
                      <div className="absolute top-4 right-4 text-indigo-400 opacity-20 group-hover:opacity-100 transition-opacity">
                         <Database size={40} />
                      </div>
                      <p className="text-indigo-300 text-[10px] font-black uppercase mb-2">Technical Info</p>
                      <p className="text-white text-sm font-medium leading-relaxed">
                        ही वेबसाईट 'Static' आहे, त्यामुळे आपण डेटाबेसला पैसे न देता थेट कोडमध्ये माहिती साठवून ती आयुष्यभर मोफत ठेवू शकतो.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

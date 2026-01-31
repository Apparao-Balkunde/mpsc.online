import React, { useState } from 'react';
import { DescriptiveQA, LoadingState } from '../types';
import { generateDescriptiveQA } from '../services/gemini';
import { ArrowLeft, BookOpen, PenTool, Loader2, Sparkles, Eye, CheckCircle2, Copy, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface LiteratureModeProps {
  onBack: () => void;
}

const LIT_TOPICS = [
  "संत साहित्य (Sant Sahitya) - ज्ञानेश्वर, तुकाराम, नामदेव",
  "महानुभाव पंथ (Mahanubhav Panth)",
  "दलित साहित्य (Dalit Sahitya)",
  "ग्रामीण साहित्य (Gramin Sahitya)",
  "मराठी कथा व कादंबरी (Katha & Kadambari)",
  "मराठी नाटक (Marathi Natak)",
  "आधुनिक कविता (Modern Poetry)",
  "साहित्य विचार (Literary Criticism)"
];

export const LiteratureMode: React.FC<LiteratureModeProps> = ({ onBack }) => {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [qaData, setQaData] = useState<DescriptiveQA | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setStatus('loading');
    setQaData(null);
    setUserAnswer('');
    setShowModelAnswer(false);

    try {
      const result = await generateDescriptiveQA(topic);
      setQaData(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
          <h2 className="text-2xl font-bold text-orange-900 mb-2 flex items-center">
            <BookOpen className="mr-2 text-orange-700" />
            Marathi Literature Practice (मराठी साहित्य)
          </h2>
          <p className="text-orange-800 text-sm">Prepare for MPSC Mains Descriptive Paper. Generate questions and compare your answers with AI model answers.</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Topic Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Choose a Literature Topic</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {LIT_TOPICS.map((t) => (
                 <button
                   key={t}
                   onClick={() => setTopic(t)}
                   className={`text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                     topic === t 
                     ? 'bg-orange-50 border-orange-400 text-orange-900 ring-1 ring-orange-400' 
                     : 'border-slate-200 hover:border-orange-300 text-slate-700 hover:bg-slate-50'
                   }`}
                 >
                   <span className="text-sm font-medium">{t}</span>
                   {topic === t && <CheckCircle2 size={16} className="text-orange-600"/>}
                 </button>
               ))}
            </div>
            
            <div className="mt-4 flex gap-2">
                 <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Or type a custom topic (e.g. Kusumagraj, Vinda Karandikar)..."
                    className="flex-1 border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none"
                 />
                 <button
                    onClick={handleGenerate}
                    disabled={!topic || status === 'loading'}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                 >
                    {status === 'loading' ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                    Generate Question
                 </button>
            </div>
          </div>
        </div>
      </div>

      {status === 'loading' && (
        <div className="text-center py-16">
          <Loader2 className="animate-spin h-12 w-12 text-orange-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Formulating a descriptive question based on MPSC pattern...</p>
        </div>
      )}

      {status === 'success' && qaData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Question Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
                <div className="flex justify-between items-start mb-4">
                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Descriptive Question</span>
                    <button onClick={() => copyToClipboard(qaData.question)} className="text-slate-400 hover:text-orange-600" title="Copy Question">
                        <Copy size={16} />
                    </button>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed font-serif">
                    {qaData.question}
                </h3>
            </div>

            {/* Answer Writing Area */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <label className="flex items-center gap-2 font-bold text-slate-700 mb-4">
                    <PenTool size={18} />
                    Your Answer Draft
                </label>
                <textarea 
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Start typing your answer here (for practice)... Focus on Introduction, Body, and Conclusion."
                    className="w-full h-48 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-y font-serif text-lg leading-relaxed text-slate-800"
                />
                <div className="mt-2 text-right text-xs text-slate-400">
                    {userAnswer.trim().split(/\s+/).filter(w => w.length > 0).length} words
                </div>
            </div>

            {/* Model Answer Section */}
            <div className="flex flex-col gap-4">
                <button 
                    onClick={() => setShowModelAnswer(!showModelAnswer)}
                    className="self-center bg-slate-800 text-white px-6 py-3 rounded-full font-bold hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg"
                >
                    <Eye size={18} />
                    {showModelAnswer ? 'Hide Model Answer' : 'Show AI Model Answer'}
                </button>

                {showModelAnswer && (
                    <div className="bg-white rounded-xl shadow-xl border border-indigo-100 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-center">
                            <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                                <FileText size={18} /> Model Answer Structure
                            </h4>
                            <span className="text-xs text-indigo-500 font-mono">Generated by Gemini AI</span>
                        </div>
                        
                        {/* Key Points Summary */}
                        <div className="bg-yellow-50 p-4 border-b border-yellow-100">
                            <h5 className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-2">Key Points to Cover</h5>
                            <ul className="list-disc list-inside space-y-1">
                                {qaData.keyPoints.map((kp, idx) => (
                                    <li key={idx} className="text-sm text-yellow-900">{kp}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-8 prose prose-slate max-w-none prose-headings:text-indigo-800 prose-p:text-slate-700 prose-p:leading-relaxed prose-p:font-serif">
                            <ReactMarkdown>{qaData.modelAnswer}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
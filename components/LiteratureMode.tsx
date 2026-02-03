import React, { useState } from 'react';
import { DescriptiveQA, LoadingState } from '../types';
import { generateDescriptiveQA } from '../services/gemini';
import { ArrowLeft, BookOpen, PenTool, Loader2, Sparkles, Eye, CheckCircle2, Copy, FileText, GraduationCap, Lightbulb, Scale, BookMarked } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface LiteratureModeProps {
  onBack: () => void;
}

const LIT_TOPICS = [
  "दलित साहित्यातील विद्रोहाचे स्वरूप आणि आंबेडकरी विचारधारेचा प्रभाव (Revolt in Dalit Lit & Ambedkarite Ideology)",
  "गौरी देशपांडे आणि सानिया यांच्या साहित्यातील स्त्रीवादी जाणिवांचा तौलनिक अभ्यास (Comparative Feminist Consciousness: Gauri Deshpande & Saniya)",
  "'कोसला' कादंबरी: मराठी कादंबरीतील स्थित्यंतर आणि अस्तित्ववाद ('Kosla': Existentialism & Paradigm Shift)",
  "मर्ढेकरांच्या कवितेतील विसंवाद आणि सौंदर्यशास्त्रीय भूमिका (Alienation & Aesthetics in Mardhekar's Poetry)",
  "ग्रामीण साहित्याचे स्वरूप: 'बनगरवाडी' आणि 'पाचोळा'चा विशेष संदर्भ (Nature of Rural Lit: Ref 'Bangarwadi' & 'Pachola')",
  "संत तुकारामांच्या अभंगांमधील समाजप्रबोधन आणि भक्तीचे स्वरूप (Social Reform & Devotion in Sant Tukaram's Abhangs)",
  "विजय तेंडुलकर आणि महेश एलकुंचवार यांच्या नाटकांची सामाजिक-राजकीय चिकित्सा (Socio-Political Analysis of Tendulkar & Elkunchwar's Plays)",
  "भालचंद्र नेमाडे यांचा 'देशीवाद' आणि जागतिकीकरणाचा साहित्यावरील परिणाम (Nemade's 'Deshivad' & Impact of Globalization)",
  "आधुनिक मराठी नाटकातील स्त्रियांचे चित्रण: समस्या आणि स्वरूप (Role of Women in Modern Marathi Drama: Issues & Nature)",
  "मराठी कादंबरीकारांवर पाश्चात्य साहित्य प्रवाहांचा (उदा. अस्तित्ववाद) प्रभाव (Influence of Western Literary Movements like Existentialism on Marathi Novelists)",
  "पु.ल. देशपांडे आणि व.पु. काळे यांच्या कथनशैलीचा तौलनिक अभ्यास (Comparative Narrative Styles: P.L. Deshpande & V.P. Kale)",
  "'सिंहासन' कादंबरीतील सामाजिक-राजकीय वास्तवाचे चित्रण (Socio-Political Commentary in 'Sinhasan' Novel)"
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
            <GraduationCap className="mr-3 text-orange-700 h-8 w-8" />
            <div>
                <div>University & PhD Level</div>
                <div className="text-lg font-normal opacity-80">Marathi Literature Analysis (मराठी साहित्य समीक्षा)</div>
            </div>
          </h2>
          <p className="text-orange-800 text-sm mt-2">Generate advanced research questions, critical analysis, and academic model answers suitable for MA/PhD and MPSC Mains.</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Topic Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Select Research Topic</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {LIT_TOPICS.map((t) => (
                 <button
                   key={t}
                   onClick={() => setTopic(t)}
                   className={`text-left p-4 rounded-lg border transition-all flex items-center justify-between group ${
                     topic === t 
                     ? 'bg-orange-50 border-orange-400 text-orange-900 ring-1 ring-orange-400 shadow-sm' 
                     : 'border-slate-200 hover:border-orange-300 text-slate-700 hover:bg-slate-50'
                   }`}
                 >
                   <span className="text-sm font-semibold">{t}</span>
                   {topic === t && <CheckCircle2 size={18} className="text-orange-600 shrink-0"/>}
                 </button>
               ))}
            </div>
            
            <div className="mt-4 flex gap-2">
                 <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Or type a specific thesis topic (e.g. Bhalchandra Nemade's Kosla)..."
                    className="flex-1 border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
                 />
                 <button
                    onClick={handleGenerate}
                    disabled={!topic || status === 'loading'}
                    className="bg-orange-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md transition-all"
                 >
                    {status === 'loading' ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                    <span className="hidden md:inline">Generate Analysis</span>
                    <span className="md:hidden">Go</span>
                 </button>
            </div>
          </div>
        </div>
      </div>

      {/* Study Tips Section - Visible when idle */}
      {!qaData && status !== 'loading' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="flex items-center gap-2 mb-2 px-1">
              <BookMarked className="text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-800">MPSC Mains Literature Strategy (अभ्यास पद्धती)</h3>
           </div>
           
           <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-blue-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                    <PenTool size={16} /> Answer Structure (रचना)
                  </h4>
                  <ul className="text-sm text-blue-900/80 space-y-2 list-disc list-outside pl-4">
                      <li><strong>Introduction (प्रस्तावना):</strong> Briefly contextualize the author, their era (कालखंड), and the literary movement.</li>
                      <li><strong>Body (गाभा):</strong> Focus on the core demand of the question. Use logical flow, not just story summary.</li>
                      <li><strong>Conclusion (निष्कर्ष):</strong> Provide your own analytical synthesis or assessment, don't just summarize.</li>
                  </ul>
              </div>
              
              <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-purple-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                    <Scale size={16} /> Critical Analysis (समीक्षा)
                  </h4>
                   <ul className="text-sm text-purple-900/80 space-y-2 list-disc list-outside pl-4">
                      <li>Move beyond simple description. Use literary terms like 'सौंदर्यशास्त्र' (Aesthetics) or 'अस्तित्ववाद' (Existentialism).</li>
                      <li><strong>Comparative Study (तौलनिक अभ्यास):</strong> Compare the work with contemporary pieces (e.g., Rural life in 'Bangarwadi' vs 'Pachola').</li>
                      <li>Quote renowned critics (e.g., Nemade, Hatkananglekar) to substantiate your points.</li>
                  </ul>
              </div>
              
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-emerald-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                    <FileText size={16} /> Using Model Answers
                  </h4>
                   <ul className="text-sm text-emerald-900/80 space-y-2 list-disc list-outside pl-4">
                      <li><strong>Analyze Structure:</strong> Don't memorize. Observe how the AI links paragraphs and arguments.</li>
                      <li><strong>Vocabulary Mining:</strong> Note down specific critical terms (Paribhashik Shabda) used in the model answer.</li>
                      <li><strong>Self-Correction:</strong> Write your answer first, then compare with the model to identify missing dimensions.</li>
                  </ul>
              </div>
           </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
          <Loader2 className="animate-spin h-12 w-12 text-orange-600 mx-auto mb-4" />
          <p className="text-slate-800 font-bold text-lg">Consulting Academic Archives...</p>
          <p className="text-slate-500 text-sm mt-1">Formulating critical analysis and reviewing literary criticism...</p>
        </div>
      )}

      {status === 'success' && qaData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Question Section */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-l-4 border-orange-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <BookOpen size={100} />
                </div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <span className="bg-orange-100 text-orange-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-orange-200">PhD Level Question</span>
                    <button onClick={() => copyToClipboard(qaData.question)} className="text-slate-400 hover:text-orange-600 transition-colors" title="Copy Question">
                        <Copy size={18} />
                    </button>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed font-serif relative z-10">
                    {qaData.question}
                </h3>
            </div>

            {/* Answer Writing Area */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <label className="flex items-center gap-2 font-bold text-slate-700 mb-4">
                    <PenTool size={18} className="text-slate-400" />
                    Draft Your Thesis / Answer
                </label>
                <textarea 
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Structure your critical analysis here. Include references to critics, historical context, and your own synthesis..."
                    className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-y font-serif text-lg leading-relaxed text-slate-800 placeholder:text-slate-300 placeholder:font-sans"
                />
                <div className="mt-2 text-right text-xs text-slate-400 font-mono">
                    {userAnswer.trim().split(/\s+/).filter(w => w.length > 0).length} words
                </div>
            </div>

            {/* Model Answer Section */}
            <div className="flex flex-col gap-4">
                <button 
                    onClick={() => setShowModelAnswer(!showModelAnswer)}
                    className="self-center bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-black transition-all flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95"
                >
                    <Eye size={20} />
                    {showModelAnswer ? 'Hide Academic Model Answer' : 'Reveal Academic Model Answer'}
                </button>

                {showModelAnswer && (
                    <div className="bg-white rounded-xl shadow-2xl border border-indigo-100 overflow-hidden animate-in zoom-in-95 duration-300 mb-10">
                        <div className="bg-indigo-900 text-white p-5 border-b border-indigo-800 flex justify-between items-center">
                            <h4 className="font-bold flex items-center gap-2 text-lg">
                                <FileText size={20} className="text-yellow-400"/> Model Research Answer
                            </h4>
                            <span className="text-xs text-indigo-300 font-mono bg-indigo-950 px-2 py-1 rounded">AI Professor</span>
                        </div>
                        
                        {/* Key Points Summary */}
                        <div className="bg-yellow-50 p-5 border-b border-yellow-100">
                            <h5 className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Sparkles size={12} /> Critical Concepts (समीक्षा संज्ञा)
                            </h5>
                            <div className="flex flex-wrap gap-2">
                                {qaData.keyPoints.map((kp, idx) => (
                                    <span key={idx} className="text-sm font-medium text-yellow-900 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200">
                                        {kp}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 prose prose-slate max-w-none prose-headings:text-indigo-900 prose-headings:font-bold prose-p:text-slate-700 prose-p:leading-loose prose-p:font-serif prose-p:text-lg prose-strong:text-indigo-800 prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-orange-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic">
                            <ReactMarkdown>{qaData.modelAnswer}</ReactMarkdown>
                        </div>
                        
                        <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
                            Generated based on literary criticism archives. Verify specific citations with standard reference books.
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

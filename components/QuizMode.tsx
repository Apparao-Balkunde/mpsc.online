import React, { useState, useEffect } from 'react';
import { Subject, LoadingState, QuizQuestion } from '../types';
import { HelpCircle, CheckCircle2, XCircle, Loader2, ArrowLeft, Database, BookOpen, AlertCircle, RefreshCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QuizModeProps {
  initialSubject?: Subject;
  initialTopic?: string;
  onBack: () => void;
  // App.tsx कडून येणारा लाईव्ह डेटा (Supabase मधून)
  questionsFromDB?: any[]; 
}

export const QuizMode: React.FC<QuizModeProps> = ({ 
  initialSubject = Subject.MARATHI, 
  initialTopic = '', 
  onBack,
  questionsFromDB = [] 
}) => {
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [topic, setTopic] = useState(initialTopic);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  // १. डेटा फिल्टर करण्याचे लॉजिक
  const startQuizFromDB = (e?: React.FormEvent) => {
    e?.preventDefault();
    setStatus('loading');

    // फिल्टरिंग: विषय किंवा उप-वर्गाशी जुळणारे प्रश्न निवडा
    const filtered = questionsFromDB.filter(q => 
      q.subject === subject && 
      (topic === '' || q.subCategory?.toLowerCase().includes(topic.toLowerCase()))
    );

    // जर प्रश्न मिळाले नाहीत तर एरर स्टेट दाखवा
    if (filtered.length === 0) {
      setTimeout(() => setStatus('error'), 800);
      return;
    }

    // प्रश्नांचा क्रम दरवेळी बदलण्यासाठी (Shuffle)
    const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, 10);

    setQuestions(shuffled);
    setUserAnswers(new Array(shuffled.length).fill(-1));
    setShowResults(false);
    setStatus('success');
  };

  const handleOptionSelect = (qIdx: number, oIdx: number) => {
    if (showResults) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const calculateScore = () => {
    return userAnswers.reduce((score, ans, idx) => {
      return ans === questions[idx].correctAnswerIndex ? score + 1 : score;
    }, 0);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 font-bold transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
      </button>

      {/* IDLE STATE: विषय निवडणे */}
      {status === 'idle' && (
        <div className="bg-white rounded-[2rem] shadow-2xl p-8 md:p-12 border border-slate-100 animate-in fade-in zoom-in duration-500">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-emerald-100 p-3 rounded-2xl">
              <Database className="text-emerald-600 h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800">Live Question Bank</h2>
              <p className="text-slate-500 font-medium">Practicing from Supabase Verified Database</p>
            </div>
          </div>
           
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {Object.values(Subject).map(s => (
              <button 
                key={s} 
                onClick={() => setSubject(s)} 
                className={`p-6 rounded-2xl border-2 font-black transition-all ${
                  subject === s 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg scale-105' 
                  : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={startQuizFromDB} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-widest">Search Sub-Topic (Optional)</label>
              <input 
                type="text" 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
                placeholder="e.g. संधी, राज्यपाल, Fundamental Rights..." 
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold" 
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 transition-all active:scale-95">
              GENERATE QUIZ FROM DB
            </button>
          </form>
        </div>
      )}

      {/* LOADING STATE */}
      {status === 'loading' && (
        <div className="text-center py-20">
          <Loader2 className="animate-spin h-16 w-16 text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500 font-black uppercase tracking-widest">Fetching Questions from Supabase...</p>
        </div>
      )}

      {/* ERROR STATE: प्रश्न न सापडल्यास */}
      {status === 'error' && (
        <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
          <AlertCircle className="h-16 w-16 text-rose-500 mx-auto mb-4" />
          <h3 className="text-2xl font-black text-slate-800 mb-2">No Questions Found!</h3>
          <p className="text-slate-500 mb-8 font-medium">डेटाबेसमध्ये या विषयाचे प्रश्न सध्या उपलब्ध नाहीत. कृपया दुसरा विषय निवडा.</p>
          <button onClick={() => setStatus('idle')} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 mx-auto">
            <RefreshCcw size={18} /> Try Another Subject
          </button>
        </div>
      )}

      {/* SUCCESS STATE: क्विझ सुरू */}
      {status === 'success' && (
        <div className="space-y-8 pb-20 animate-in slide-in-from-bottom-10 duration-700">
          {/* Progress Header */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center sticky top-4 z-10">
            <span className="font-black text-indigo-600 uppercase tracking-tighter">Live Exam: {subject}</span>
            {showResults && (
              <div className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full font-black">
                SCORE: {calculateScore()} / {questions.length}
              </div>
            )}
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 border border-slate-100 overflow-hidden relative">
              <div className="flex items-start gap-4 mb-8">
                <span className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0">{qIdx + 1}</span>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-snug">{q.question}</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mb-8">
                {q.options.map((opt, oIdx) => {
                  const isSelected = userAnswers[qIdx] === oIdx;
                  const isCorrect = q.correctAnswerIndex === oIdx;
                  let cardStyle = "border-slate-100 hover:border-indigo-200";
                  
                  if (showResults) {
                    if (isCorrect) cardStyle = "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500";
                    else if (isSelected && !isCorrect) cardStyle = "border-rose-500 bg-rose-50";
                    else cardStyle = "opacity-50 border-slate-100";
                  } else if (isSelected) {
                    cardStyle = "border-indigo-600 bg-indigo-50 shadow-md scale-[1.02]";
                  }

                  return (
                    <button 
                      key={oIdx} 
                      disabled={showResults}
                      onClick={() => handleOptionSelect(qIdx, oIdx)}
                      className={`group flex items-center justify-between p-6 rounded-2xl border-2 transition-all text-left font-bold text-lg ${cardStyle}`}
                    >
                      <span>{opt}</span>
                      {showResults && isCorrect && <CheckCircle2 className="text-emerald-500 shrink-0" />}
                      {showResults && isSelected && !isCorrect && <XCircle className="text-rose-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanations with Markdown */}
              {showResults && (
                <div className="mt-8 animate-in slide-in-from-top-4 duration-500">
                  <div className="bg-slate-950 p-8 md:p-10 rounded-[2rem] text-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <BookOpen size={80} />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-8 w-1 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-black uppercase tracking-widest text-yellow-500">Detailed Analysis</span>
                    </div>
                    <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed font-medium">
                      <ReactMarkdown>{q.explanation}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!showResults && (
            <button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setShowResults(true);
              }} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-200 transition-all active:scale-95 mb-20"
            >
              FINISH & VIEW SOLUTIONS
            </button>
          )}
        </div>
      )}
    </div>
  );
};

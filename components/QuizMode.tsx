import React, { useState, useEffect } from 'react';
import { Subject, LoadingState, QuizQuestion, DifficultyLevel, GSSubCategory } from '../types';
// १. Supabase मधून डेटा आणण्यासाठी (Optional: जर तुम्ही App.tsx मधून पाठवला नसेल तर)
// import { supabase } from '../lib/supabase'; 
import { HelpCircle, CheckCircle2, XCircle, Loader2, ArrowLeft, Play, Zap, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QuizModeProps {
  initialSubject?: Subject;
  initialTopic?: string;
  onBack: () => void;
  // २. App.tsx कडून येणारा लाईव्ह डेटा
  questionsFromDB?: any[]; 
}

const SUGGESTED_TOPICS: Record<Subject, string[]> = {
  [Subject.MARATHI]: ["संधी", "समास", "प्रयोग"],
  [Subject.ENGLISH]: ["Articles", "Tenses", "Voice"],
  [Subject.GS]: ["Polity", "Geography", "History", "Science", "Current Affairs"]
};

export const QuizMode: React.FC<QuizModeProps> = ({ 
  initialSubject = Subject.MARATHI, 
  initialTopic = '', 
  onBack,
  questionsFromDB = [] // App.tsx कडून आलेले प्रश्न
}) => {
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [topic, setTopic] = useState(initialTopic);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  // ३. क्विझ सुरू करण्याचे नवीन लॉजिक (Supabase डेटा फिल्टर करणे)
  const startQuizFromDB = (e?: React.FormEvent) => {
    e?.preventDefault();
    setStatus('loading');

    // तुमच्या डेटाबेसमधून योग्य विषयाचे प्रश्न फिल्टर करा
    const filteredQuestions = questionsFromDB.filter(q => 
      q.subCategory.toLowerCase() === topic.toLowerCase() || 
      q.subCategory.toLowerCase() === subject.toLowerCase()
    );

    if (filteredQuestions.length === 0) {
      // जर डेटाबेसमध्ये प्रश्न नसतील, तर जुन्या AI कडे वळा (Fallback)
      console.warn("डेटाबेसमध्ये प्रश्न नाहीत, AI वापरत आहे...");
      // जुने generateQuiz इथे कॉल करू शकता
    }

    setQuestions(filteredQuestions);
    setUserAnswers(new Array(filteredQuestions.length).fill(-1));
    setShowResults(false);
    setStatus('success');
  };

  const handleOptionSelect = (qIdx: number, oIdx: number) => {
    if (showResults) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = oIdx;
    setUserAnswers(newAnswers);
  };

  const submitQuiz = () => {
    setShowResults(true);
    // निकाल जतन करणे...
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      {status === 'idle' && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
           <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center">
             <Database className="mr-3 text-emerald-600 h-8 w-8" /> Live Questions
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
             {/* Subject Selection Buttons */}
             <div className="space-y-2">
                {Object.values(Subject).map(s => (
                  <button key={s} onClick={() => setSubject(s)} className={`w-full p-4 rounded-xl border-2 ${subject === s ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}>
                    {s}
                  </button>
                ))}
             </div>
           </div>

           <form onSubmit={startQuizFromDB}>
              <label className="block text-xs font-black text-slate-400 uppercase mb-3">Select Category From Database</label>
              <div className="flex flex-col md:flex-row gap-2">
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Polity, Geography, Science..." className="flex-1 p-4 border rounded-xl" />
                <button type="submit" className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-black">LOAD QUESTIONS</button>
              </div>
           </form>
        </div>
      )}

      {status === 'success' && questions.length > 0 && (
        <div className="space-y-6">
          {/* Question Display Logic */}
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
              <h3 className="text-xl font-bold mb-6">{qIdx + 1}. {q.question}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {q.options.map((opt, oIdx) => (
                  <button 
                    key={oIdx} 
                    onClick={() => handleOptionSelect(qIdx, oIdx)}
                    className={`p-4 rounded-2xl border-2 ${userAnswers[qIdx] === oIdx ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* सविस्तर स्पष्टीकरण (हेच तुम्ही 150 शब्दांचे लिहिले आहे) */}
              {showResults && (
                <div className="bg-slate-950 p-6 rounded-2xl text-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="text-yellow-500" />
                    <span className="text-xs font-bold uppercase">Expert Explanation</span>
                  </div>
                  <ReactMarkdown className="leading-relaxed">{q.explanation}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
          {!showResults && <button onClick={submitQuiz} className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black">SUBMIT</button>}
        </div>
      )}
    </div>
  );
};

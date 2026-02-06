import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // तुमची सुपाबेस फाईल
import { QuizQuestion, Subject } from '../types';
import { 
  CheckCircle2, XCircle, ChevronRight, 
  RotateCcw, ArrowLeft, Loader2, BookOpen 
} from 'lucide-react';

interface QuizModeProps {
  questions?: QuizQuestion[]; // सुरुवातीचे प्रश्न (Optional)
  onBack: () => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({ onBack }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizComplete, setQuizComplete] = useState(false);

  // १. Supabase मधून प्रश्न लोड करणे
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('mpsc_questions')
          .select('*')
          .order('id', { ascending: false })
          .limit(10); // १० प्रश्नांचा संच

        if (error) throw error;
        if (data) setQuestions(data as QuizQuestion[]);
      } catch (err) {
        console.error("Error fetching quiz:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    
    if (index === questions[currentIndex].correct_answer_index) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizComplete(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold">डेटाबेसमधून प्रश्न लोड होत आहेत...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 mx-4">
        <p className="text-slate-500 mb-6">डेटाबेसमध्ये सध्या प्रश्न उपलब्ध नाहीत.</p>
        <button onClick={onBack} className="text-indigo-600 font-bold flex items-center gap-2 mx-auto">
          <ArrowLeft size={20} /> मागे जा
        </button>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">निकाल</h2>
        <p className="text-slate-500 mb-8 font-medium">तुमचा सराव पूर्ण झाला आहे!</p>
        
        <div className="bg-slate-50 p-8 rounded-3xl mb-8">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Score</p>
          <p className="text-6xl font-black text-indigo-600">{score} / {questions.length}</p>
        </div>

        <div className="flex gap-4">
          <button onClick={resetQuiz} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
            <RotateCcw size={20} /> पुन्हा प्रयत्न करा
          </button>
          <button onClick={onBack} className="flex-1 border border-slate-200 py-4 rounded-2xl font-bold hover:bg-slate-50">
            होम स्क्रीन
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top Navigation */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400">
          <ArrowLeft size={24} />
        </button>
        <div className="px-5 py-2 bg-white rounded-full border border-slate-200 text-sm font-bold text-slate-600">
          प्रश्न {currentIndex + 1} / {questions.length}
        </div>
        <div className="w-10"></div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-3 mb-6">
           <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-wider">
             {currentQ.subject}
           </span>
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed mb-10">
          {currentQ.question}
        </h3>

        <div className="grid gap-4">
          {currentQ.options.map((option, idx) => {
            const isCorrect = idx === currentQ.correct_answer_index;
            const isSelected = idx === selectedAnswer;
            
            let btnClass = "w-full p-5 rounded-2xl border-2 text-left font-bold transition-all flex justify-between items-center ";
            
            if (selectedAnswer === null) {
              btnClass += "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 text-slate-700";
            } else if (isCorrect) {
              btnClass += "border-emerald-500 bg-emerald-50 text-emerald-700";
            } else if (isSelected && !isCorrect) {
              btnClass += "border-red-500 bg-red-50 text-red-700";
            } else {
              btnClass += "border-slate-50 text-slate-400 opacity-50";
            }

            return (
              <button key={idx} onClick={() => handleAnswerSelect(idx)} disabled={selectedAnswer !== null} className={btnClass}>
                <span>{option}</span>
                {selectedAnswer !== null && isCorrect && <CheckCircle2 size={20} />}
                {selectedAnswer !== null && isSelected && !isCorrect && <XCircle size={20} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation Box */}
      {showExplanation && (
        <div className="bg-white rounded-[2rem] p-8 border-l-8 border-indigo-500 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-4 text-indigo-600">
            <BookOpen size={20} />
            <h4 className="font-black uppercase text-xs tracking-widest">स्पष्टीकरण</h4>
          </div>
          <p className="text-slate-700 leading-relaxed font-medium">
            {currentQ.explanation || "या प्रश्नाचे स्पष्टीकरण उपलब्ध नाही."}
          </p>
          <button onClick={nextQuestion} className="mt-8 w-full bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
            पुढील प्रश्न <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

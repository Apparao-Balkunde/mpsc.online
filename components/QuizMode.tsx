import React, { useState } from 'react';
import { Subject, LoadingState, QuizQuestion } from '../types';
import { generateQuiz } from '../services/gemini';
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, Loader2, ArrowLeft, RefreshCcw } from 'lucide-react';

interface QuizModeProps {
  initialSubject?: Subject;
  onBack: () => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({ initialSubject = Subject.MARATHI, onBack }) => {
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]); // stores index of selected option
  const [showResults, setShowResults] = useState(false);

  const startQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setStatus('loading');
    setQuestions([]);
    setUserAnswers([]);
    setShowResults(false);

    try {
      const q = await generateQuiz(subject, topic);
      setQuestions(q);
      setUserAnswers(new Array(q.length).fill(-1));
      setStatus('success');
    } catch (error) {
      setStatus('error');
    }
  };

  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    if (showResults) return; // Prevent changing after submission
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswerIndex) score++;
    });
    return score;
  };

  const resetQuiz = () => {
    setStatus('idle');
    setQuestions([]);
    setTopic('');
    setUserAnswers([]);
    setShowResults(false);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      {status === 'idle' && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
           <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <HelpCircle className="mr-2 text-indigo-600" />
            Start Quiz
          </h2>
          <form onSubmit={startQuiz} className="space-y-6">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Subject</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setSubject(Subject.MARATHI)}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${subject === Subject.MARATHI ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-300'}`}
                >
                    <span className="text-lg font-bold">मराठी</span>
                </button>
                 <button
                    type="button"
                    onClick={() => setSubject(Subject.ENGLISH)}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${subject === Subject.ENGLISH ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-300'}`}
                >
                    <span className="text-lg font-bold">English</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Topic (Optional but Recommended)</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Synonyms, Grammar Rules, History of Maharashtra"
                className="w-full rounded-lg border-slate-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={!topic.trim()}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Quiz
            </button>
          </form>
        </div>
      )}

      {status === 'loading' && (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800">Preparing your questions...</h3>
          <p className="text-slate-500">Getting ready to challenge you!</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 text-center">
            <p className="mb-4">Oops! Failed to generate the quiz.</p>
            <button onClick={() => setStatus('idle')} className="underline">Try Again</button>
        </div>
      )}

      {status === 'success' && questions.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
             <h2 className="font-bold text-lg">{topic || subject} Quiz</h2>
             {!showResults && <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">{userAnswers.filter(a => a !== -1).length}/{questions.length} Answered</span>}
             {showResults && <span className="text-lg font-bold text-green-600">Score: {calculateScore()}/{questions.length}</span>}
          </div>

          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                <h3 className="text-lg font-medium text-slate-900 mb-4">{qIdx + 1}. {q.question}</h3>
                <div className="space-y-3">
                  {q.options.map((opt, oIdx) => {
                     let optionClass = "border-slate-200 hover:bg-slate-50";
                     if (showResults) {
                         if (oIdx === q.correctAnswerIndex) optionClass = "border-green-500 bg-green-50 text-green-900";
                         else if (userAnswers[qIdx] === oIdx) optionClass = "border-red-500 bg-red-50 text-red-900";
                         else optionClass = "border-slate-200 opacity-60";
                     } else {
                         if (userAnswers[qIdx] === oIdx) optionClass = "border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-500";
                     }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleOptionSelect(qIdx, oIdx)}
                        disabled={showResults}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center justify-between ${optionClass}`}
                      >
                        <span>{opt}</span>
                        {showResults && oIdx === q.correctAnswerIndex && <CheckCircle2 size={20} className="text-green-600"/>}
                        {showResults && userAnswers[qIdx] === oIdx && userAnswers[qIdx] !== q.correctAnswerIndex && <XCircle size={20} className="text-red-600"/>}
                      </button>
                    )
                  })}
                </div>
                
                {showResults && (
                    <div className="mt-4 p-4 bg-yellow-50 text-yellow-900 rounded-lg text-sm border border-yellow-200">
                        <strong>Explanation:</strong> {q.explanation}
                    </div>
                )}
              </div>
            ))}
          </div>

          {!showResults ? (
              <button
                onClick={() => setShowResults(true)}
                disabled={userAnswers.includes(-1)}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
              >
                  Submit Quiz
              </button>
          ) : (
              <div className="flex gap-4">
                  <button
                    onClick={resetQuiz}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2"
                  >
                      <RefreshCcw size={20}/> Take Another Quiz
                  </button>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

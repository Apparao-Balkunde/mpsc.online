import React, { useState } from 'react';
import { Subject, LoadingState, QuizQuestion } from '../types';
import { generatePYQs } from '../services/gemini';
import { History, Search, Loader2, ArrowLeft, ChevronRight, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

interface PYQModeProps {
  onBack: () => void;
}

const YEARS = Array.from({ length: 15 }, (_, i) => (2024 - i).toString());

export const PYQMode: React.FC<PYQModeProps> = ({ onBack }) => {
  const [selectedYear, setSelectedYear] = useState<string>('2023');
  const [subject, setSubject] = useState<Subject>(Subject.MARATHI);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);

  const fetchQuestions = async () => {
    setStatus('loading');
    setQuestions([]);
    setRevealedAnswers([]);
    try {
      const data = await generatePYQs(subject, selectedYear);
      setQuestions(data);
      setStatus('success');
    } catch (e) {
      setStatus('error');
    }
  };

  const toggleReveal = (index: number) => {
    if (revealedAnswers.includes(index)) {
      setRevealedAnswers(revealedAnswers.filter(i => i !== index));
    } else {
      setRevealedAnswers([...revealedAnswers, index]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        <div className="p-6 bg-indigo-50 border-b border-indigo-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center">
            <History className="mr-2 text-indigo-600" />
            Previous Year Questions (PYQs)
          </h2>
          <p className="text-slate-600">Review authentic MPSC questions from 2010 to current exams.</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Year</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-lg border-slate-300 border p-3 focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Subject</label>
            <select 
              value={subject}
              onChange={(e) => setSubject(e.target.value as Subject)}
              className="w-full rounded-lg border-slate-300 border p-3 focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value={Subject.MARATHI}>Marathi (मराठी)</option>
              <option value={Subject.ENGLISH}>English</option>
              <option value={Subject.GS}>General Studies</option>
            </select>
          </div>

          <div className="flex items-end">
            <button 
              onClick={fetchQuestions}
              disabled={status === 'loading'}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition font-semibold shadow flex items-center justify-center gap-2"
            >
              {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              Show Questions
            </button>
          </div>
        </div>
      </div>

      {status === 'loading' && (
        <div className="text-center py-20">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Scanning MPSC database for {selectedYear} {subject} questions...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex items-center gap-4">
          <AlertCircle size={32} />
          <div>
            <h4 className="font-bold">Retrieval Failed</h4>
            <p className="text-sm">We couldn't fetch questions for this specific year. Please try a different year or subject.</p>
          </div>
        </div>
      )}

      {status === 'success' && questions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-indigo-800 font-semibold px-2">
            <CheckCircle2 size={18} />
            Found {questions.length} questions for {selectedYear}
          </div>
          
          {questions.map((q, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-lg text-slate-900 font-medium leading-relaxed">{q.question}</p>
                </div>

                <div className="ml-11 grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="p-3 border border-slate-200 rounded-lg text-slate-700 text-sm bg-slate-50/50">
                      <span className="font-bold mr-2 text-slate-400">({String.fromCharCode(65 + oIdx)})</span>
                      {opt}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => toggleReveal(idx)}
                  className={`ml-11 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    revealedAnswers.includes(idx)
                    ? 'bg-slate-800 text-white'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <Eye size={16} />
                  {revealedAnswers.includes(idx) ? 'Hide Answer' : 'Show Answer & Explanation'}
                </button>

                {revealedAnswers.includes(idx) && (
                  <div className="ml-11 mt-4 animate-in slide-in-from-top-2">
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-3">
                      <p className="text-green-800 font-bold mb-1">Correct Answer: {String.fromCharCode(65 + q.correctAnswerIndex)}</p>
                      <p className="text-green-700 text-sm">{q.options[q.correctAnswerIndex]}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h5 className="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wide">Explanation:</h5>
                      <p className="text-slate-600 text-sm leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'success' && questions.length === 0 && (
         <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">No specific questions found for this selection. Try another year.</p>
         </div>
      )}
    </div>
  );
};
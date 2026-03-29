import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { QuizQuestion, Subject } from '../types';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, ArrowLeft, Loader2, BookOpen } from 'lucide-react';

interface QuizModeProps {
  questions?: QuizQuestion[];
  onBack: () => void;
  onComplete: (score: number) => void; // हे नवीन ॲड करा
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes qm-fade { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes qm-spin { to{transform:rotate(360deg)} }
  @keyframes qm-pop  { 0%{transform:scale(1)}45%{transform:scale(1.03)}100%{transform:scale(1)} }
  @keyframes qm-in   { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
  .qm-opt:hover:not([disabled]) { transform:translateX(4px) !important; box-shadow:0 4px 16px rgba(232,103,26,0.12) !important; }
  .qm-next:hover { transform:translateY(-2px) !important; box-shadow:0 10px 28px rgba(232,103,26,0.4) !important; }
`;

export const QuizMode: React.FC<QuizModeProps> = ({ onBack }) => {
  const [questions, setQuestions]   = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [quizComplete, setQuizComplete] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('mpsc_questions').select('*')
          .order('id', { ascending: false }).limit(10);
        if (error) throw error;
        if (data) setQuestions(data as QuizQuestion[]);
      } catch (err) { console.error("Error fetching quiz:", err); }
      finally { setLoading(false); }
    };
    fetchQuestions();
  }, []);

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (index === questions[currentIndex].correct_answer_index) setScore(prev => prev + 1);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else { setQuizComplete(true); }
  };

  const resetQuiz = () => {
    setCurrentIndex(0); setSelectedAnswer(null);
    setShowExplanation(false); setScore(0); setQuizComplete(false);
  };

  const base: React.CSSProperties = {
    minHeight: '100vh', background: '#FDF6EC',
    fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", color: '#1C2B2B',
    padding: '0 0 80px',
  };

  if (loading) return (
    <div style={{ ...base, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <style>{CSS}</style>
      <div style={{ width: 52, height: 52, border: '4px solid rgba(232,103,26,0.2)', borderTopColor: '#E8671A', borderRadius: '50%', animation: 'qm-spin 0.8s linear infinite', marginBottom: 20 }} />
      <div style={{ fontWeight: 800, fontSize: 15, color: '#4A6060' }}>डेटाबेसमधून प्रश्न लोड होत आहेत...</div>
    </div>
  );

  if (questions.length === 0) return (
    <div style={{ ...base, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <style>{CSS}</style>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 32px', textAlign: 'center', boxShadow: '0 4px 24px rgba(28,43,43,0.08)', border: '1px solid rgba(28,43,43,0.07)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#1C2B2B', marginBottom: 8 }}>डेटाबेसमध्ये सध्या प्रश्न उपलब्ध नाहीत.</div>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(232,103,26,0.1)', border: '1px solid rgba(232,103,26,0.25)', borderRadius: 12, padding: '10px 20px', color: '#E8671A', fontWeight: 800, fontSize: 14, cursor: 'pointer', margin: '16px auto 0' }}>
          <ArrowLeft size={18} /> मागे जा
        </button>
      </div>
    </div>
  );

  // RESULT
  if (quizComplete) {
    const pct = Math.round((score / questions.length) * 100);
    const rank = pct >= 80 ? { t: 'उत्तम! 🏆', c: '#D97706' } : pct >= 60 ? { t: 'चांगले! 💪', c: '#0D6B6E' } : { t: 'अजून सराव करा 📚', c: '#E8671A' };
    return (
      <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <style>{CSS}</style>
        <div style={{ background: '#fff', borderRadius: 28, padding: '40px 28px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 12px 48px rgba(28,43,43,0.1)', border: '1px solid rgba(28,43,43,0.07)', animation: 'qm-fade 0.4s ease' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,#E8671A,#F5C842)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, boxShadow: '0 8px 28px rgba(232,103,26,0.35)', margin: '0 auto' }}>🏆</div>
          </div>
          <div style={{ fontWeight: 900, fontSize: 13, color: rank.c, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>{rank.t}</div>
          <div style={{ fontWeight: 900, fontSize: '4rem', letterSpacing: '-0.05em', lineHeight: 1, background: 'linear-gradient(135deg,#E8671A,#0D6B6E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {score}<span style={{ fontSize: '0.4em', WebkitTextFillColor: '#7A9090', fontWeight: 700 }}>/{questions.length}</span>
          </div>
          <div style={{ fontSize: 14, color: '#4A6060', fontWeight: 700, marginTop: 8, marginBottom: 28 }}>{pct}% अचूकता</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={resetQuiz} style={{ flex: 1, background: 'linear-gradient(135deg,#1C2B2B,#0D6B6E)', color: '#fff', border: 'none', borderRadius: 16, padding: '14px', fontWeight: 900, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(13,107,110,0.3)' }}>
              <RotateCcw size={18} /> पुन्हा प्रयत्न
            </button>
            <button onClick={onBack} style={{ flex: 1, background: '#FDF6EC', border: '1.5px solid rgba(13,107,110,0.2)', borderRadius: 16, padding: '14px', color: '#0D6B6E', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>
              होम स्क्रीन
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div style={base}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1C2B2B,#0D6B6E)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 4px 20px rgba(13,107,110,0.3)' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 14px', color: '#FDF6EC', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
          <ArrowLeft size={14} /> मागे
        </button>

        {/* Progress */}
        <div style={{ flex: 1, maxWidth: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>प्रश्न {currentIndex + 1} / {questions.length}</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#F5C842' }}>गुण: {score}</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#F5C842,#E8671A)', borderRadius: 99, width: `${progress}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        <div style={{ background: 'rgba(245,200,66,0.2)', border: '1px solid rgba(245,200,66,0.4)', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 900, color: '#F5C842' }}>
          {currentIndex + 1}/{questions.length}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>

        {/* Question Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '28px 24px', boxShadow: '0 4px 24px rgba(28,43,43,0.08)', border: '1px solid rgba(28,43,43,0.07)', marginBottom: 16, animation: 'qm-fade 0.3s ease' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius: 99, marginBottom: 20 }} />

          {currentQ.subject && (
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(232,103,26,0.1)', border: '1px solid rgba(232,103,26,0.2)', borderRadius: 99, padding: '4px 12px', color: '#C4510E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{currentQ.subject}</span>
            </div>
          )}

          <h3 style={{ fontWeight: 800, fontSize: 'clamp(1rem,3vw,1.2rem)', color: '#1C2B2B', lineHeight: 1.65, marginBottom: 24 }}>
            <span style={{ color: '#E8671A', fontWeight: 900 }}>Q.{currentIndex + 1} </span>{currentQ.question}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentQ.options.map((option, idx) => {
              const isCorrect  = idx === currentQ.correct_answer_index;
              const isSelected = idx === selectedAnswer;
              let bg = '#FDF6EC', border = 'rgba(28,43,43,0.08)', color = '#1C2B2B', shadow = 'none';

              if (selectedAnswer !== null) {
                if (isCorrect)            { bg = 'rgba(5,150,105,0.08)'; border = 'rgba(5,150,105,0.35)'; color = '#065F46'; }
                else if (isSelected)      { bg = 'rgba(220,38,38,0.07)'; border = 'rgba(220,38,38,0.3)';  color = '#991B1B'; }
                else                      { color = '#9BBFC6'; bg = '#F9F7F4'; }
              }

              return (
                <button key={idx} className="qm-opt"
                  onClick={() => handleAnswerSelect(idx)}
                  disabled={selectedAnswer !== null}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: `2px solid ${border}`, background: bg, color, fontWeight: 600, fontSize: 14, textAlign: 'left', cursor: selectedAnswer !== null ? 'default' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.18s ease', boxShadow: shadow, animation: isSelected ? 'qm-pop 0.22s ease' : 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 9, background: selectedAnswer !== null ? (isCorrect ? '#059669' : isSelected ? '#DC2626' : 'rgba(28,43,43,0.06)') : 'rgba(28,43,43,0.06)', color: selectedAnswer !== null ? (isCorrect || isSelected ? '#fff' : '#4A6060') : '#4A6060', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0, transition: 'all 0.15s' }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </span>
                  {selectedAnswer !== null && isCorrect  && <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />}
                  {selectedAnswer !== null && isSelected && !isCorrect && <XCircle size={18} style={{ color: '#DC2626', flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div style={{ background: '#fff', borderRadius: 20, borderLeft: '4px solid #E8671A', padding: '20px 24px', boxShadow: '0 4px 20px rgba(28,43,43,0.07)', animation: 'qm-in 0.3s ease', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#C4510E', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <BookOpen size={16} /> स्पष्टीकरण
            </div>
            <p style={{ color: '#4A6060', lineHeight: 1.7, fontWeight: 500, fontSize: 14, margin: 0 }}>
              {currentQ.explanation || "या प्रश्नाचे स्पष्टीकरण उपलब्ध नाही."}
            </p>
            <button onClick={nextQuestion} className="qm-next"
              style={{ marginTop: 20, width: '100%', background: 'linear-gradient(135deg,#E8671A,#C4510E)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 900, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(232,103,26,0.3)', transition: 'all 0.2s ease' }}>
              {currentIndex < questions.length - 1 ? 'पुढील प्रश्न' : 'निकाल बघा'} <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

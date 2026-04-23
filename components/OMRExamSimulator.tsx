/**
 * OMRExamSimulator.tsx  –  MPSC Online
 * Real OMR bubble-sheet experience with negative marking & timer pressure.
 * Drop this file into /components/ and wire it up in App.tsx (see bottom comments).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { LoadingState, QuizQuestion } from '../types';
import {
  ArrowLeft, Clock, Send, AlertCircle, CheckCircle2,
  XCircle, MinusCircle, BookOpen, Zap,
  ChevronLeft, ChevronRight, RotateCcw, Eye, Pencil,
  Flag, Info
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OMRExamSimulatorProps { onBack: () => void; }
type ExamPhase = 'setup' | 'loading' | 'exam' | 'result' | 'error';
type MarkStatus = 'unattempted' | 'answered' | 'review' | 'answered-review';

interface OMRConfig {
  examType: string;
  questionCount: number;
  durationMins: number;
  negativeMarking: number; // 0 | 0.25 | 0.33 | 0.5
  marksPerCorrect: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EXAM_CONFIGS: { id: string; label: string; marathi: string; questions: number; mins: number; negative: number; correct: number; color: string; emoji: string }[] = [
  { id: 'Rajyaseva',        label: 'राज्यसेवा पूर्व',   marathi: 'MPSC Rajyaseva',    questions: 100, mins: 120, negative: 0.25, correct: 2,  color: '#E8671A', emoji: '🏛️' },
  { id: 'Combined Group B', label: 'Combined Group B', marathi: 'Group B Prelims',   questions: 100, mins: 120, negative: 0.25, correct: 2,  color: '#0D6B6E', emoji: '📋' },
  { id: 'Combined Group C', label: 'Combined Group C', marathi: 'Group C Prelims',   questions: 100, mins: 120, negative: 0.25, correct: 1,  color: '#7C3AED', emoji: '📝' },
  { id: 'Saralseva',        label: 'सरळसेवा',          marathi: 'Direct Service',    questions: 120, mins: 120, negative: 0,    correct: 1,  color: '#D97706', emoji: '⚡' },
];

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = ['#2563EB', '#DC2626', '#16A34A', '#9333EA'];

// ─── Animations CSS ───────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');

  * { box-sizing: border-box; }

  @keyframes omr-fade     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes omr-scale    { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
  @keyframes omr-spin     { to{transform:rotate(360deg)} }
  @keyframes omr-pulse    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
  @keyframes omr-warn     { 0%,100%{background:rgba(220,38,38,0.12)} 50%{background:rgba(220,38,38,0.22)} }
  @keyframes omr-bubble   { 0%{transform:scale(0.3);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
  @keyframes omr-confetti { 0%{transform:translateY(0) rotate(0)} 100%{transform:translateY(-80px) rotate(360deg);opacity:0} }
  @keyframes omr-shimmer  { 0%{background-position:-300% center} 100%{background-position:300% center} }
  @keyframes omr-trophy   { 0%{transform:rotate(-12deg) scale(0.6);opacity:0} 60%{transform:rotate(8deg) scale(1.18)} 100%{transform:rotate(0) scale(1);opacity:1} }

  .omr-bubble-btn {
    position: relative;
    width: 38px; height: 38px;
    border-radius: 50%;
    border: 2.5px solid rgba(28,43,43,0.18);
    background: #FFF8F2;
    cursor: pointer;
    transition: all 0.13s cubic-bezier(.34,1.56,.64,1);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Space Mono', monospace;
    font-weight: 700; font-size: 12px;
    color: #7A9090;
    flex-shrink: 0;
    user-select: none;
  }
  .omr-bubble-btn:hover:not(.omr-filled):not(.omr-review-fill) {
    border-color: rgba(232,103,26,0.5);
    background: rgba(232,103,26,0.07);
    transform: scale(1.1);
  }
  .omr-bubble-btn.omr-filled {
    background: #1C2B2B;
    border-color: #1C2B2B;
    color: #FDF6EC;
    animation: omr-bubble 0.18s cubic-bezier(.34,1.56,.64,1);
    box-shadow: 0 3px 10px rgba(28,43,43,0.25);
  }

  /* Small OMR sheet bubbles */
  .omr-mini-bubble {
    width: 18px; height: 18px;
    border-radius: 50%;
    border: 1.5px solid rgba(28,43,43,0.2);
    background: #FFF8F2;
    cursor: pointer;
    transition: all 0.12s ease;
    display: flex; align-items: center; justify-content: center;
    font-size: 7px; font-weight: 800;
    color: transparent;
    flex-shrink: 0;
  }
  .omr-mini-bubble:hover:not(.filled) {
    border-color: rgba(232,103,26,0.6);
    background: rgba(232,103,26,0.08);
  }
  .omr-mini-bubble.filled {
    background: #1C2B2B;
    border-color: #1C2B2B;
    box-shadow: 0 1px 4px rgba(28,43,43,0.3);
  }
  .omr-mini-bubble.result-correct { background: #059669 !important; border-color: #059669 !important; }
  .omr-mini-bubble.result-wrong   { background: #DC2626 !important; border-color: #DC2626 !important; }
  .omr-mini-bubble.result-skipped { background: rgba(28,43,43,0.12) !important; }

  .omr-row-active { background: rgba(232,103,26,0.06) !important; }
  .omr-row-done   { background: rgba(5,150,105,0.04) !important; }
  .omr-row-review { background: rgba(245,200,66,0.08) !important; }

  .omr-nav-q:hover { background: rgba(13,107,110,0.1) !important; }
  .omr-q-dot { width:30px; height:30px; border-radius:8px; font-size:9px; font-weight:800; cursor:pointer; border:none; transition:all 0.14s; display:flex; align-items:center; justify-content:center; }
  .omr-q-dot:hover { transform:scale(1.12); }

  .omr-option-row:hover:not(.locked) { background: rgba(232,103,26,0.05) !important; }

  .omr-submit-btn:hover { transform:translateY(-2px) !important; box-shadow:0 18px 40px rgba(13,107,110,0.4) !important; }
  .omr-start-btn:hover  { transform:translateY(-2px) !important; box-shadow:0 18px 40px rgba(232,103,26,0.45) !important; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// ─── Component ────────────────────────────────────────────────────────────────
export function OMRExamSimulator({ onBack }: OMRExamSimulatorProps) {
  const [phase, setPhase]           = useState<ExamPhase>('setup');
  const [config, setConfig]         = useState<OMRConfig>({
    examType: 'Rajyaseva', questionCount: 100, durationMins: 120,
    negativeMarking: 0.25, marksPerCorrect: 2,
  });
  const [questions, setQuestions]   = useState<QuizQuestion[]>([]);
  const [answers, setAnswers]       = useState<number[]>([]);   // -1 = unattempted
  const [markFlags, setMarkFlags]   = useState<MarkStatus[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft]     = useState(7200);
  const [showOMR, setShowOMR]       = useState(false); // mobile toggle
  const [showInstructions, setShowInstructions] = useState(false);
  const timerRef      = useRef<any>(null);
  const submitExamRef = useRef<() => void>(() => {});

  // ── Setup helpers ──────────────────────────────────────────────────────────
  const selectExam = (id: string) => {
    const ec = EXAM_CONFIGS.find(e => e.id === id)!;
    setConfig({ examType: id, questionCount: ec.questions, durationMins: ec.mins, negativeMarking: ec.negative, marksPerCorrect: ec.correct });
  };

  // ── Start exam ─────────────────────────────────────────────────────────────
  const startExam = async () => {
    setPhase('loading');
    try {
      const { data, error } = await supabase.rpc('get_random_mock_questions', {
        exam_filter: config.examType, row_limit: config.questionCount,
      });
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No questions');
      const qs: QuizQuestion[] = data.map((q: any) => ({
        id: q.id, question: q.question || 'प्रश्न उपलब्ध नाही',
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswerIndex: q.correct_answer_index ?? 0,
        explanation: q.explanation || 'स्पष्टीकरण उपलब्ध नाही.',
        subCategory: q.subject || 'General',
      }));
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(-1));
      setMarkFlags(new Array(qs.length).fill('unattempted'));
      setCurrentIdx(0);
      setTimeLeft(config.durationMins * 60);
      setPhase('exam');
      timerRef.current = setInterval(() => {
        setTimeLeft(p => {
          if (p <= 1) { submitExamRef.current(); return 0; }
          return p - 1;
        });
      }, 1000);
    } catch (e) {
      console.error(e);
      setPhase('error');
    }
  };

  // ── Answer ─────────────────────────────────────────────────────────────────
  const selectAnswer = useCallback((qIdx: number, optIdx: number) => {
    setAnswers(prev => {
      const n = [...prev];
      const prevAns = n[qIdx];
      const toggled = prevAns === optIdx ? -1 : optIdx;
      n[qIdx] = toggled;

      // Update markFlags immediately using the fresh prevAns — no stale closure
      setMarkFlags(mPrev => {
        const m = [...mPrev];
        const isReview = m[qIdx] === 'review' || m[qIdx] === 'answered-review';
        m[qIdx] = toggled === -1
          ? (isReview ? 'review' : 'unattempted')
          : (isReview ? 'answered-review' : 'answered');
        return m;
      });

      return n;
    });
  }, []);

  const toggleReview = useCallback((qIdx: number) => {
    setMarkFlags(prev => {
      const n = [...prev];
      const cur = n[qIdx];
      if (cur === 'unattempted') n[qIdx] = 'review';
      else if (cur === 'answered') n[qIdx] = 'answered-review';
      else if (cur === 'answered-review') n[qIdx] = 'answered';
      else n[qIdx] = 'unattempted';
      return n;
    });
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submitExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Keep ref always pointing at latest submitExam (avoids stale closure in timer)
  submitExamRef.current = submitExam;

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ─── PHASE: SETUP ──────────────────────────────────────────────────────────
  if (phase === 'setup') {
    const selectedEC = EXAM_CONFIGS.find(e => e.id === config.examType)!;
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FDF6EC 0%,#EEF7F7 100%)', fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", color: '#1C2B2B' }}>
        <style>{CSS}</style>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1C2B2B,#0D6B6E)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 24px rgba(13,107,110,0.3)' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, padding: '8px 13px', color: '#FDF6EC', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            <ArrowLeft size={13} /> परत
          </button>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: '#F5C842', letterSpacing: '-0.02em' }}>📋 OMR परीक्षा सिम्युलेटर</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Real OMR Bubble Sheet Experience</div>
          </div>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px 80px' }}>

          {/* OMR Paper preview */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 22, border: '2px solid rgba(232,103,26,0.12)', boxShadow: '0 6px 28px rgba(232,103,26,0.08)', animation: 'omr-fade 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#E8671A,#F5C842)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14, color: '#1C2B2B' }}>OMR Answer Sheet Preview</div>
                <div style={{ fontSize: 10, color: '#7A9090', fontWeight: 600 }}>प्रत्यक्ष परीक्षेसारखा अनुभव</div>
              </div>
            </div>
            {/* Mini OMR demo */}
            <div style={{ background: '#FFFDF8', border: '1px solid rgba(28,43,43,0.08)', borderRadius: 12, padding: '12px', overflow: 'hidden' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, textAlign: 'center' }}>MAHARASHTRA PUBLIC SERVICE COMMISSION</div>
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ width: 22, fontSize: 9, fontWeight: 800, color: '#4A6060', fontFamily: "'Space Mono',monospace", flexShrink: 0 }}>{n}.</span>
                  {OPTION_LABELS.map((l, i) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${i === (n % 4) && n !== 3 ? '#1C2B2B' : 'rgba(28,43,43,0.2)'}`, background: i === (n % 4) && n !== 3 ? '#1C2B2B' : 'transparent', transition: 'all 0.2s' }} />
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#9AB0B0', fontFamily: "'Space Mono',monospace" }}>{l}</span>
                    </div>
                  ))}
                  <div style={{ flex: 1, height: 1, background: 'rgba(28,43,43,0.05)' }} />
                </div>
              ))}
              <div style={{ textAlign: 'center', fontSize: 8, color: '#B0C4C4', fontWeight: 600, marginTop: 6, letterSpacing: '0.05em' }}>...{config.questionCount} प्रश्न</div>
            </div>
          </div>

          {/* Exam type selection */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#4A6060', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>परीक्षा प्रकार निवडा</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {EXAM_CONFIGS.map(ec => {
                const sel = config.examType === ec.id;
                return (
                  <button key={ec.id} onClick={() => selectExam(ec.id)}
                    style={{ padding: '16px 14px', borderRadius: 16, border: `2px solid ${sel ? ec.color : 'rgba(28,43,43,0.08)'}`, background: sel ? `${ec.color}12` : '#fff', textAlign: 'left', cursor: 'pointer', transition: 'all 0.18s', boxShadow: sel ? `0 6px 20px ${ec.color}22` : '0 2px 8px rgba(28,43,43,0.05)', position: 'relative' }}>
                    {sel && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: ec.color, borderRadius: '14px 14px 0 0' }} />}
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{ec.emoji}</div>
                    <div style={{ fontWeight: 900, fontSize: 13, color: sel ? '#1C2B2B' : '#4A6060', marginBottom: 2, lineHeight: 1.2 }}>{ec.label}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: sel ? ec.color : '#7A9090' }}>{ec.questions} प्र. · {ec.mins} मि.</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: sel ? ec.color : '#9AB0B0', marginTop: 2 }}>
                      {ec.negative > 0 ? `−${ec.negative} Negative` : 'No Negative'}
                    </div>
                    {sel && <CheckCircle2 size={15} style={{ color: ec.color, position: 'absolute', top: 12, right: 12 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Config info card */}
          <div style={{ background: '#fff', border: '1px solid rgba(13,107,110,0.14)', borderRadius: 16, padding: '16px', marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { l: 'प्रश्न', v: `${config.questionCount}`, c: '#0D6B6E' },
              { l: 'वेळ', v: `${config.durationMins} मि.`, c: '#D97706' },
              { l: 'Negative', v: config.negativeMarking > 0 ? `-${config.negativeMarking}` : 'नाही', c: config.negativeMarking > 0 ? '#DC2626' : '#059669' },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ textAlign: 'center', padding: '10px 6px', background: `${c}0a`, borderRadius: 10, border: `1px solid ${c}22` }}>
                <div style={{ fontWeight: 900, fontSize: 18, color: c, fontFamily: "'Space Mono',monospace" }}>{v}</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Instructions toggle */}
          <button onClick={() => setShowInstructions(p => !p)}
            style={{ width: '100%', background: 'rgba(13,107,110,0.06)', border: '1px solid rgba(13,107,110,0.14)', borderRadius: 12, padding: '11px', color: '#0D6B6E', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: showInstructions ? 10 : 16 }}>
            <Info size={13} /> सूचना {showInstructions ? '▲' : '▼'}
          </button>
          {showInstructions && (
            <div style={{ background: '#fff', border: '1px solid rgba(13,107,110,0.12)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 12, color: '#4A6060', lineHeight: 1.7, fontWeight: 600, animation: 'omr-fade 0.2s ease' }}>
              <div style={{ fontWeight: 900, color: '#1C2B2B', marginBottom: 8 }}>📌 महत्त्वाच्या सूचना:</div>
              <div>• प्रत्येक योग्य उत्तराला <b style={{ color: '#059669' }}>+{selectedEC.correct}</b> गुण मिळतात</div>
              {config.negativeMarking > 0 && <div>• प्रत्येक चुकीच्या उत्तराला <b style={{ color: '#DC2626' }}>−{config.negativeMarking}</b> गुण कापले जातात</div>}
              <div>• न सोडवलेल्या प्रश्नांसाठी <b>0</b> गुण</div>
              <div>• OMR शीटवर bubble भरा — एकदा भरलेला bubble पुन्हा click करून मिटवता येतो</div>
              <div>• 🚩 Flag बटण वापरून "Review साठी" mark करा</div>
              <div>• वेळ संपल्यावर exam आपोआप submit होते</div>
            </div>
          )}

          <button onClick={startExam} className="omr-start-btn"
            style={{ width: '100%', background: 'linear-gradient(135deg,#E8671A,#C4510E)', border: 'none', borderRadius: 16, padding: '17px', color: '#fff', fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 10px 32px rgba(232,103,26,0.35)', letterSpacing: '-0.02em', transition: 'all 0.2s', fontFamily: "'Baloo 2',sans-serif" }}>
            <Pencil size={17} /> OMR परीक्षा सुरू करा
          </button>
        </div>
      </div>
    );
  }

  // ─── PHASE: LOADING ────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div style={{ minHeight: '100vh', background: '#FDF6EC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, fontFamily: "'Baloo 2',sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ width: 56, height: 56, border: '4px solid rgba(232,103,26,0.18)', borderTopColor: '#E8671A', borderRadius: '50%', animation: 'omr-spin 0.8s linear infinite' }} />
      <div style={{ fontWeight: 900, fontSize: 15, color: '#1C2B2B' }}>OMR शीट तयार होत आहे...</div>
      <div style={{ fontSize: 12, color: '#7A9090', fontWeight: 600 }}>{config.questionCount} प्रश्न · {config.examType}</div>
    </div>
  );

  // ─── PHASE: ERROR ──────────────────────────────────────────────────────────
  if (phase === 'error') return (
    <div style={{ minHeight: '100vh', background: '#FDF6EC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, fontFamily: "'Baloo 2',sans-serif" }}>
      <style>{CSS}</style>
      <AlertCircle size={48} style={{ color: '#DC2626' }} />
      <div style={{ fontWeight: 900, fontSize: 18, color: '#1C2B2B' }}>प्रश्न लोड होऊ शकले नाहीत</div>
      <button onClick={() => setPhase('setup')} style={{ background: 'rgba(232,103,26,0.1)', border: '1px solid rgba(232,103,26,0.25)', borderRadius: 12, padding: '10px 24px', color: '#E8671A', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
        परत जा
      </button>
    </div>
  );

  // ─── PHASE: RESULT ─────────────────────────────────────────────────────────
  if (phase === 'result' && questions.length > 0) {
    const correct   = answers.filter((a, i) => a !== -1 && a === questions[i]?.correctAnswerIndex).length;
    const wrong     = answers.filter((a, i) => a !== -1 && a !== questions[i]?.correctAnswerIndex).length;
    const skipped   = answers.filter(a => a === -1).length;
    const rawScore  = correct * config.marksPerCorrect - wrong * config.negativeMarking;
    const maxScore  = questions.length * config.marksPerCorrect;
    const pct       = Math.round((rawScore / maxScore) * 100);
    const grade     = rawScore >= maxScore * 0.7 ? { l: 'उत्तम! 🏆', c: '#D97706' } : rawScore >= maxScore * 0.5 ? { l: 'चांगले! 💪', c: '#0D6B6E' } : { l: 'अजून सराव हवा 📚', c: '#E8671A' };

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FDF6EC,#EEF7F7)', fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", color: '#1C2B2B', paddingBottom: 60 }}>
        <style>{CSS}</style>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1C2B2B,#0D6B6E)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, padding: '8px 13px', color: '#FDF6EC', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            <ArrowLeft size={13} /> डॅशबोर्ड
          </button>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#F5C842' }}>📋 OMR परीक्षा निकाल</div>
        </div>

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

          {/* Score card */}
          <div style={{ background: '#fff', borderRadius: 24, padding: '30px 24px', marginBottom: 20, textAlign: 'center', boxShadow: '0 12px 48px rgba(232,103,26,0.1)', border: '1px solid rgba(232,103,26,0.12)', position: 'relative', overflow: 'hidden', animation: 'omr-scale 0.5s cubic-bezier(.34,1.56,.64,1)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#E8671A,#F5C842,#0D6B6E)', backgroundSize: '200%', animation: 'omr-shimmer 3s infinite' }} />
            <div style={{ fontSize: 64, marginBottom: 4, animation: 'omr-trophy 0.7s cubic-bezier(.34,1.56,.64,1) 0.2s both', display: 'inline-block' }}>🏆</div>
            <div style={{ fontWeight: 900, fontSize: 11, color: grade.c, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>{grade.l}</div>
            <div style={{ fontWeight: 900, fontSize: 'clamp(2.8rem,9vw,4.2rem)', letterSpacing: '-0.04em', lineHeight: 1, background: 'linear-gradient(135deg,#E8671A,#0D6B6E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Space Mono',monospace" }}>
              {rawScore.toFixed(2)}
              <span style={{ fontSize: '0.35em', WebkitTextFillColor: '#9AB0B0', fontWeight: 700 }}>/{maxScore}</span>
            </div>
            <div style={{ fontSize: 13, color: '#7A9090', fontWeight: 700, marginTop: 4 }}>{pct}% अचूकता</div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginTop: 22 }}>
              {[
                { l: 'बरोबर',    v: correct, c: '#059669', bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.2)',  icon: '✓' },
                { l: 'चुकीचे',   v: wrong,   c: '#DC2626', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.2)',  icon: '✗' },
                { l: 'सोडलेले',  v: skipped, c: '#D97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.2)',  icon: '—' },
                { l: 'Negative', v: (wrong * config.negativeMarking).toFixed(2), c: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)', icon: '−' },
              ].map(({ l, v, c, bg, border, icon }) => (
                <div key={l} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, marginBottom: 3 }}>{icon}</div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: c, fontFamily: "'Space Mono',monospace", lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#9AB0B0', textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Retry btn */}
            <button onClick={() => { setPhase('setup'); setQuestions([]); setAnswers([]); setMarkFlags([]); }}
              style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(232,103,26,0.08)', border: '1px solid rgba(232,103,26,0.2)', borderRadius: 12, padding: '10px 22px', color: '#E8671A', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
              <RotateCcw size={14} /> पुन्हा परीक्षा द्या
            </button>
          </div>

          {/* OMR Answer Sheet Review */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(28,43,43,0.08)', boxShadow: '0 4px 20px rgba(28,43,43,0.06)', overflow: 'hidden' }}>
            <div style={{ background: '#1C2B2B', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 13, color: '#F5C842', letterSpacing: '0.04em' }}>MAHARASHTRA PUBLIC SERVICE COMMISSION</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 2 }}>OMR Answer Sheet — Evaluated Copy</div>
              </div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                {config.examType}
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 14, padding: '10px 18px', background: 'rgba(28,43,43,0.03)', borderBottom: '1px solid rgba(28,43,43,0.06)', flexWrap: 'wrap' }}>
              {[
                { c: '#059669', l: 'बरोबर' },
                { c: '#DC2626', l: 'चुकीचे' },
                { c: '#1C2B2B', l: 'Unattempted fill' },
                { c: 'rgba(28,43,43,0.12)', l: 'सोडलेले' },
              ].map(({ c, l }) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: c, border: `1.5px solid ${c}` }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#7A9090' }}>{l}</span>
                </div>
              ))}
            </div>

            {/* OMR Grid */}
            <div style={{ padding: '14px 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 3 }}>
              {questions.map((q, i) => {
                const userAns = answers[i];
                const correct_i = q.correctAnswerIndex;
                const isCorrect = userAns !== -1 && userAns === correct_i;
                const isWrong = userAns !== -1 && userAns !== correct_i;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, background: isCorrect ? 'rgba(5,150,105,0.05)' : isWrong ? 'rgba(220,38,38,0.05)' : 'transparent' }}>
                    <span style={{ width: 22, fontSize: 9, fontWeight: 800, color: '#7A9090', fontFamily: "'Space Mono',monospace", flexShrink: 0 }}>{i + 1}.</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {OPTION_LABELS.map((l, oi) => {
                        let cls = '';
                        if (oi === correct_i) cls = 'result-correct';
                        else if (oi === userAns && isWrong) cls = 'result-wrong';
                        const filled = oi === userAns || oi === correct_i;
                        return (
                          <div key={l}
                            className={`omr-mini-bubble${filled ? ' filled' : ''}${cls ? ' ' + cls : ''}`}
                            title={`${l}: ${q.options[oi] || ''}`}
                          />
                        );
                      })}
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 700, marginLeft: 2 }}>
                      {isCorrect ? <span style={{ color: '#059669' }}>+{config.marksPerCorrect}</span> : isWrong ? <span style={{ color: '#DC2626' }}>−{config.negativeMarking}</span> : <span style={{ color: '#9AB0B0' }}>0</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question-wise review */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#4A6060', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, padding: '0 4px' }}>प्रश्नवार Review</div>
            {questions.map((q, i) => {
              const userAns = answers[i];
              const isCorrect = userAns !== -1 && userAns === q.correctAnswerIndex;
              const isWrong = userAns !== -1 && userAns !== q.correctAnswerIndex;
              if (userAns === -1 && i > 9) return null; // show only first 10 skipped
              return (
                <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 10, border: `1px solid ${isCorrect ? 'rgba(5,150,105,0.2)' : isWrong ? 'rgba(220,38,38,0.2)' : 'rgba(28,43,43,0.08)'}`, boxShadow: '0 2px 8px rgba(28,43,43,0.04)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: isCorrect ? 'rgba(5,150,105,0.1)' : isWrong ? 'rgba(220,38,38,0.1)' : 'rgba(28,43,43,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isCorrect ? <CheckCircle2 size={14} style={{ color: '#059669' }} /> : isWrong ? <XCircle size={14} style={{ color: '#DC2626' }} /> : <MinusCircle size={14} style={{ color: '#9AB0B0' }} />}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1C2B2B', lineHeight: 1.6, margin: 0, flex: 1 }}>
                      <span style={{ color: '#E8671A', fontWeight: 900 }}>Q.{i + 1} </span>{q.question}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                    {q.options.map((opt, oi) => {
                      const isUser = oi === userAns;
                      const isAns = oi === q.correctAnswerIndex;
                      let bg = 'rgba(28,43,43,0.03)'; let border = 'rgba(28,43,43,0.07)'; let color = '#4A6060';
                      if (isAns) { bg = 'rgba(5,150,105,0.08)'; border = 'rgba(5,150,105,0.25)'; color = '#059669'; }
                      if (isUser && !isAns) { bg = 'rgba(220,38,38,0.07)'; border = 'rgba(220,38,38,0.2)'; color = '#DC2626'; }
                      return (
                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 10, background: bg, border: `1px solid ${border}` }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: isAns ? '#059669' : isUser ? '#DC2626' : 'rgba(28,43,43,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: isAns || isUser ? '#fff' : '#9AB0B0', fontFamily: "'Space Mono',monospace", flexShrink: 0 }}>
                            {OPTION_LABELS[oi]}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: isAns ? 700 : 500, color, flex: 1 }}>{opt}</span>
                          {isUser && <span style={{ fontSize: 9, fontWeight: 800, color, flexShrink: 0 }}>तुमचे</span>}
                          {isAns && <span style={{ fontSize: 9, fontWeight: 800, color: '#059669', flexShrink: 0 }}>✓ बरोबर</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background: 'rgba(232,103,26,0.06)', border: '1px solid rgba(232,103,26,0.14)', borderRadius: 10, padding: '8px 12px' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#C4510E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BookOpen size={9} /> स्पष्टीकरण
                    </div>
                    <p style={{ fontSize: 11, color: '#4A6060', lineHeight: 1.6, fontWeight: 500, fontStyle: 'italic', margin: 0 }}>{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── PHASE: EXAM ───────────────────────────────────────────────────────────
  if (phase === 'exam' && questions.length > 0) {
    const q = questions[currentIdx];
    const totalAttempted = answers.filter(a => a !== -1).length;
    const warn = timeLeft < 300;
    const isReviewed = markFlags[currentIdx] === 'review' || markFlags[currentIdx] === 'answered-review';

    // Quick score estimation
    const quickCorrect = answers.filter((a, i) => a !== -1 && a === questions[i]?.correctAnswerIndex).length;
    const quickWrong   = answers.filter((a, i) => a !== -1 && a !== questions[i]?.correctAnswerIndex).length;
    const liveScore    = quickCorrect * config.marksPerCorrect - quickWrong * config.negativeMarking;

    const dotColor = (i: number) => {
      if (i === currentIdx) return { bg: 'linear-gradient(135deg,#E8671A,#C4510E)', color: '#fff' };
      const s = markFlags[i];
      if (s === 'answered') return { bg: 'rgba(5,150,105,0.15)', color: '#059669' };
      if (s === 'review' || s === 'answered-review') return { bg: 'rgba(245,200,66,0.25)', color: '#B45309' };
      return { bg: 'rgba(28,43,43,0.07)', color: '#7A9090' };
    };

    return (
      <div style={{ minHeight: '100vh', background: '#F5EDD8', fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", color: '#1C2B2B' }}>
        <style>{CSS}</style>

        {/* ── Top Bar ── */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(28,43,43,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

          <button className="omr-nav-q" onClick={() => window.confirm('बाहेर पडायचे? Progress जाईल.') && onBack()}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, padding: '7px 11px', color: '#FDF6EC', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
            <ArrowLeft size={12} /> Exit
          </button>

          {/* Progress bar */}
          <div style={{ flex: 1, minWidth: 80, background: 'rgba(255,255,255,0.1)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius: 99, width: `${(totalAttempted / questions.length) * 100}%`, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', fontFamily: "'Space Mono',monospace" }}>{totalAttempted}/{questions.length}</span>

          {/* Live score */}
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '5px 11px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Zap size={11} style={{ color: '#F5C842' }} />
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, fontWeight: 700, color: liveScore >= 0 ? '#4ADE80' : '#F87171' }}>{liveScore >= 0 ? '+' : ''}{liveScore.toFixed(1)}</span>
          </div>

          {/* Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: warn ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${warn ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 9, padding: '6px 11px', animation: warn ? 'omr-warn 0.8s infinite' : 'none' }}>
            <Clock size={12} style={{ color: warn ? '#F87171' : '#9AB0B0' }} />
            <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 900, fontSize: 14, color: warn ? '#F87171' : '#FDF6EC' }}>{fmtTime(timeLeft)}</span>
          </div>

          {/* Mobile OMR toggle */}
          <button onClick={() => setShowOMR(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: showOMR ? 'rgba(232,103,26,0.3)' : 'rgba(255,255,255,0.08)', border: `1px solid ${showOMR ? 'rgba(232,103,26,0.5)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 9, padding: '7px 11px', color: '#FDF6EC', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
            <Eye size={12} /> OMR
          </button>

          <button onClick={() => window.confirm('सबमिट करायची का?') && submitExam()} className="omr-submit-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#0D6B6E,#094D50)', border: 'none', borderRadius: 9, padding: '8px 14px', color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,107,110,0.4)', transition: 'all 0.18s' }}>
            <Send size={11} /> सबमिट
          </button>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 12px 80px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>

          {/* ── Question Panel ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* OMR Sheet panel (mobile toggle / always on desktop) */}
            {showOMR && (
              <div style={{ background: '#FFFDF5', border: '2px solid rgba(28,43,43,0.1)', borderRadius: 20, padding: '14px', marginBottom: 14, animation: 'omr-fade 0.2s ease' }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, textAlign: 'center' }}>
                  MAHARASHTRA PUBLIC SERVICE COMMISSION — OMR ANSWER SHEET
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 2 }}>
                  {questions.map((_, i) => {
                    const isActive = i === currentIdx;
                    const userAns  = answers[i];
                    const flag     = markFlags[i];
                    return (
                      <div key={i}
                        onClick={() => setCurrentIdx(i)}
                        className={`${isActive ? 'omr-row-active' : userAns !== -1 ? 'omr-row-done' : flag === 'review' ? 'omr-row-review' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 7px', borderRadius: 7, cursor: 'pointer', border: isActive ? '1px solid rgba(232,103,26,0.3)' : '1px solid transparent', transition: 'all 0.12s' }}>
                        <span style={{ width: 18, fontSize: 8, fontWeight: 800, color: isActive ? '#E8671A' : '#7A9090', fontFamily: "'Space Mono',monospace", flexShrink: 0 }}>{i + 1}.</span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {OPTION_LABELS.map((_, oi) => (
                            <div key={oi}
                              onClick={(e) => { e.stopPropagation(); selectAnswer(i, oi); }}
                              className={`omr-mini-bubble${answers[i] === oi ? ' filled' : ''}`} />
                          ))}
                        </div>
                        {(flag === 'review' || flag === 'answered-review') && <Flag size={8} style={{ color: '#D97706', flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Question Card */}
            <div style={{ background: '#FFFDF5', border: '2px solid rgba(28,43,43,0.08)', borderRadius: 22, padding: '22px 20px', boxShadow: '0 6px 28px rgba(28,43,43,0.08)', animation: 'omr-fade 0.18s ease' }}>
              {/* Question header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: 'linear-gradient(135deg,#E8671A,#C4510E)', borderRadius: 10, padding: '4px 12px', fontFamily: "'Space Mono',monospace", fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
                    Q. {currentIdx + 1}
                  </div>
                  <span style={{ background: 'rgba(13,107,110,0.08)', border: '1px solid rgba(13,107,110,0.15)', borderRadius: 99, padding: '3px 10px', fontSize: 9, fontWeight: 800, color: '#0D6B6E', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {q?.subCategory}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#9AB0B0', fontFamily: "'Space Mono',monospace" }}>{currentIdx + 1}/{questions.length}</span>
                  {/* Flag for review */}
                  <button onClick={() => toggleReview(currentIdx)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: isReviewed ? 'rgba(245,200,66,0.15)' : 'rgba(28,43,43,0.06)', border: `1px solid ${isReviewed ? 'rgba(217,119,6,0.35)' : 'rgba(28,43,43,0.1)'}`, borderRadius: 8, padding: '5px 10px', fontSize: 10, fontWeight: 800, color: isReviewed ? '#B45309' : '#7A9090', cursor: 'pointer' }}>
                    <Flag size={11} fill={isReviewed ? '#B45309' : 'transparent'} /> {isReviewed ? 'Flagged' : 'Flag'}
                  </button>
                </div>
              </div>

              {/* Question text */}
              <p style={{ fontWeight: 700, fontSize: 'clamp(0.95rem,2.5vw,1.1rem)', lineHeight: 1.75, color: '#1C2B2B', marginBottom: 20 }}>{q?.question}</p>

              {/* OMR Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(q?.options || []).map((opt: string, oi: number) => {
                  const filled = answers[currentIdx] === oi;
                  return (
                    <div key={oi}
                      className={`omr-option-row${filled ? ' locked' : ''}`}
                      onClick={() => selectAnswer(currentIdx, oi)}
                      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', borderRadius: 14, border: `2px solid ${filled ? '#1C2B2B' : 'rgba(28,43,43,0.08)'}`, background: filled ? 'rgba(28,43,43,0.04)' : '#FFFDF5', cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: filled ? '0 4px 14px rgba(28,43,43,0.1)' : 'none' }}>

                      {/* The OMR bubble — THE HERO */}
                      <button
                        onClick={(e) => { e.stopPropagation(); selectAnswer(currentIdx, oi); }}
                        className={`omr-bubble-btn${filled ? ' omr-filled' : ''}`}
                        style={{ flexShrink: 0 }}>
                        {OPTION_LABELS[oi]}
                      </button>

                      <span style={{ flex: 1, fontSize: 14, fontWeight: filled ? 700 : 500, color: filled ? '#1C2B2B' : '#4A6060', lineHeight: 1.5 }}>{opt}</span>

                      {filled && (
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#1C2B2B,#0D2B2B)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CheckCircle2 size={13} style={{ color: '#FDF6EC' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Erase hint */}
              {answers[currentIdx] !== -1 && (
                <div style={{ marginTop: 10, textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#9AB0B0', fontStyle: 'italic' }}>
                  💡 Bubble पुन्हा click करा — उत्तर मिटेल (OMR खाडाखोड)
                </div>
              )}

              {/* Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(28,43,43,0.07)' }}>
                <button disabled={currentIdx === 0} className="omr-nav-q"
                  onClick={() => setCurrentIdx(p => p - 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(13,107,110,0.07)', border: '1px solid rgba(13,107,110,0.14)', borderRadius: 11, padding: '9px 16px', color: '#0D6B6E', fontWeight: 800, fontSize: 12, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentIdx === 0 ? 0.3 : 1, transition: 'all 0.15s' }}>
                  <ChevronLeft size={14} /> मागे
                </button>

                <div style={{ fontSize: 11, fontWeight: 700, color: '#9AB0B0', fontFamily: "'Space Mono',monospace" }}>
                  {totalAttempted}/{questions.length} answered
                </div>

                <button
                  onClick={() => currentIdx === questions.length - 1
                    ? window.confirm('सबमिट करायची का?') && submitExam()
                    : setCurrentIdx(p => p + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#E8671A,#C4510E)', border: 'none', borderRadius: 11, padding: '10px 20px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 5px 16px rgba(232,103,26,0.3)' }}>
                  {currentIdx === questions.length - 1 ? <><Send size={13} /> निकाल पहा</> : <>पुढे <ChevronRight size={14} /></>}
                </button>
              </div>
            </div>
          </div>

          {/* ── Sidebar: Full OMR Sheet (Desktop) ── */}
          <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Full OMR panel */}
            <div style={{ background: '#FFFDF5', border: '2px solid rgba(28,43,43,0.1)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 18px rgba(28,43,43,0.08)', position: 'sticky', top: 68 }}>
              {/* OMR Header */}
              <div style={{ background: '#1C2B2B', padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 7, fontWeight: 800, color: '#F5C842', textTransform: 'uppercase', letterSpacing: '0.14em' }}>MPSC — OMR Answer Sheet</div>
                <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Roll No: _______ | Set: A</div>
              </div>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 4, padding: '7px 10px 3px', borderBottom: '1px solid rgba(28,43,43,0.07)' }}>
                <div />
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  {OPTION_LABELS.map((l, i) => (
                    <span key={l} style={{ fontSize: 8, fontWeight: 900, color: OPTION_COLORS[i], fontFamily: "'Space Mono',monospace", width: 18, textAlign: 'center' }}>{l}</span>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '4px 8px 8px' }}>
                {questions.map((_, i) => {
                  const isActive = i === currentIdx;
                  const flag     = markFlags[i];
                  const hasAns   = answers[i] !== -1;
                  const isReview = flag === 'review' || flag === 'answered-review';
                  return (
                    <div key={i}
                      onClick={() => setCurrentIdx(i)}
                      className={`${isActive ? 'omr-row-active' : hasAns ? 'omr-row-done' : isReview ? 'omr-row-review' : ''}`}
                      style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', alignItems: 'center', gap: 4, padding: '3px 4px', borderRadius: 6, cursor: 'pointer', border: isActive ? '1.5px solid rgba(232,103,26,0.4)' : '1.5px solid transparent', marginBottom: 1, transition: 'all 0.12s' }}>

                      <span style={{ fontSize: 8, fontWeight: 800, color: isActive ? '#E8671A' : '#7A9090', fontFamily: "'Space Mono',monospace", textAlign: 'right', paddingRight: 4 }}>{i + 1}</span>

                      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                        {OPTION_LABELS.map((_, oi) => (
                          <div key={oi}
                            onClick={(e) => { e.stopPropagation(); selectAnswer(i, oi); }}
                            className={`omr-mini-bubble${answers[i] === oi ? ' filled' : ''}`} />
                        ))}
                      </div>

                      <div style={{ width: 10 }}>
                        {isReview && <Flag size={8} style={{ color: '#D97706' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(28,43,43,0.07)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { c: 'rgba(232,103,26,0.15)', b: 'rgba(232,103,26,0.4)', l: 'सध्याचा प्रश्न' },
                  { c: 'rgba(5,150,105,0.07)',  b: 'transparent', l: 'उत्तर दिले' },
                  { c: 'rgba(245,200,66,0.1)',  b: 'transparent', l: 'Review साठी mark' },
                ].map(({ c, b, l }) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 14, height: 8, borderRadius: 3, background: c, border: `1px solid ${b || 'transparent'}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 8, fontWeight: 700, color: '#7A9090' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Negative marking warning */}
            {config.negativeMarking > 0 && (
              <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 14, padding: '12px', fontSize: 11 }}>
                <div style={{ fontWeight: 900, color: '#DC2626', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertCircle size={12} /> Negative Marking
                </div>
                <div style={{ color: '#4A6060', fontWeight: 600, lineHeight: 1.5 }}>
                  बरोबर: <b style={{ color: '#059669' }}>+{config.marksPerCorrect}</b><br />
                  चुकीचे: <b style={{ color: '#DC2626' }}>−{config.negativeMarking}</b><br />
                  सोडलेले: <b>0</b>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/*
──────────────────────────────────────────────────────────────
  App.tsx Integration Instructions
──────────────────────────────────────────────────────────────

1. types.ts मध्ये नवीन Mode add करा:
   OMR_EXAM = 'OMR_EXAM',

2. App.tsx मध्ये import करा:
   import { OMRExamSimulator } from './components/OMRExamSimulator';

3. App.tsx routing मध्ये add करा (line ~330 च्या जवळ):
   {mode === 'OMR_EXAM' && <OMRExamSimulator onBack={back} />}

4. Home cards मध्ये button add करा:
   <div onClick={() => go('OMR_EXAM')} className="card-hover"
     style={{ ... }}>
     <div style={{ fontSize: 28 }}>📋</div>
     <div style={{ fontWeight: 900, fontSize: 13, color: '#1C2B2B' }}>OMR Simulator</div>
     <div style={{ fontSize: 10, color: '#7A9090' }}>Real Bubble Sheet Experience</div>
     <span style={{ ... }}>NEW</span>
   </div>

──────────────────────────────────────────────────────────────
*/

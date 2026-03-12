import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { LoadingState, QuizQuestion } from '../types';
import {
  Trophy, CheckCircle2, ArrowLeft, LayoutDashboard,
  Check, X, Target, BookOpen, Heart, Coffee, Zap, Clock,
  ChevronRight, ChevronLeft, Send, AlertCircle
} from 'lucide-react';

interface MockTestModeProps { onBack: () => void; }

const SupportModule = ({ title }: { title: string }) => {
  const [amt, setAmt] = useState('');
  const [hasPaid, setHasPaid] = useState(false);
  const currentAmt = amt && parseFloat(amt) > 0 ? amt : '0';
  const upiLink = `upi://pay?pa=apparaobalkunde901@oksbi&pn=Apparao%20Balkunde&am=${currentAmt}&cu=INR`;

  if (hasPaid) return (
    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 24, padding: '20px 24px', textAlign: 'center', marginBottom: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
        <Check size={22} color="#fff" />
      </div>
      <div style={{ fontWeight: 900, color: '#10B981', fontSize: 15, marginBottom: 4 }}>धन्यवाद!</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Rs.{amt} च्या सपोर्टबद्दल आभारी आहोत!</div>
      <button onClick={() => { setHasPaid(false); setAmt(''); }}
        style={{ marginTop: 12, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        पुन्हा सपोर्ट करा
      </button>
    </div>
  );

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '20px 24px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Heart size={14} fill="#F43F5E" color="#F43F5E" />
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
      </div>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, fontStyle: 'italic', marginBottom: 14, lineHeight: 1.5 }}>"तुमचा सपोर्ट, माझं मोटिव्हेशन!"</p>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 14 }}>Rs.</span>
        <input type="number" inputMode="decimal" value={amt} placeholder="रक्कम टाका"
          onChange={e => setAmt(e.target.value)}
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, color: '#fff', fontWeight: 700, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </div>
      {parseFloat(currentAmt) > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a href={upiLink} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#6366F1,#4F46E5)', borderRadius: 12, padding: '11px', color: '#fff', fontWeight: 900, fontSize: 12, textDecoration: 'none', letterSpacing: '0.05em' }}>
            <Coffee size={15} /> GPay / PhonePe
          </a>
          <button onClick={() => setHasPaid(true)}
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '9px', color: '#10B981', fontWeight: 900, fontSize: 11, cursor: 'pointer' }}>
            मी पेमेंट केले
          </button>
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>रक्कम टाका</p>
        </div>
      )}
    </div>
  );
};

const CSS = `
  @keyframes mt-fade { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
  @keyframes mt-scale { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes mt-spin { to{transform:rotate(360deg)} }
  @keyframes mt-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes mt-trophy { 0%{transform:rotate(-15deg) scale(0.7);opacity:0}60%{transform:rotate(10deg) scale(1.15)}100%{transform:rotate(0) scale(1);opacity:1} }
  @keyframes mt-glow { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,0.35)}50%{box-shadow:0 0 0 10px rgba(249,115,22,0)} }
  @keyframes mt-warn { 0%,100%{color:#EF4444}50%{color:#FF8080} }
  @keyframes mt-pop { 0%{transform:scale(1)}45%{transform:scale(1.05)}100%{transform:scale(1)} }
  .mt-opt:hover:not([data-selected="true"]){background:rgba(255,255,255,0.06)!important;border-color:rgba(255,255,255,0.18)!important;transform:translateX(3px)}
  .mt-start:hover{transform:translateY(-2px);box-shadow:0 18px 48px rgba(249,115,22,0.45)!important}
  .mt-back:hover{background:rgba(255,255,255,0.1)!important;}
`;

export function MockTestMode({ onBack }: MockTestModeProps) {
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(7200);
  const [isFinished, setIsFinished] = useState(false);
  const [testType, setTestType] = useState('Rajyaseva');
  const timerRef = useRef<any>(null);

  const startTest = async () => {
    setStatus('loading');
    try {
      const limit = testType === 'Saralseva' ? 120 : 100;
      const { data, error } = await supabase.rpc('get_random_mock_questions', { exam_filter: testType, row_limit: limit });
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No questions');
      const formatted = data.map((q: any) => ({
        id: q.id,
        question: q.question || 'प्रश्न उपलब्ध नाही',
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswerIndex: q.correct_answer_index ?? 0,
        explanation: q.explanation || 'स्पष्टीकरण उपलब्ध नाही.',
        subCategory: q.subject || 'General',
      }));
      setQuestions(formatted);
      setUserAnswers(new Array(formatted.length).fill(-1));
      setTimeLeft(7200);
      setCurrentIdx(0);
      setStatus('success');
      timerRef.current = setInterval(() => {
        setTimeLeft(p => { if (p <= 1) { finishTest(); return 0; } return p - 1; });
      }, 1000);
    } catch (e) { console.error(e); setStatus('error'); }
  };

  const finishTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
  };

  const base: React.CSSProperties = {
    minHeight: '100vh', background: '#0B0F1A',
    fontFamily: "'Poppins','Noto Sans Devanagari',sans-serif", color: '#fff',
  };

  // RESULT
  if (isFinished && questions.length > 0) {
    const score = userAnswers.filter((a, i) => questions[i] && a === questions[i].correctAnswerIndex).length;
    const attempted = userAnswers.filter(a => a !== -1).length;
    const pct = Math.round((score / questions.length) * 100);
    const rank = pct >= 70 ? { t: 'उत्तम! 🏆', c: '#FFD700' } : pct >= 50 ? { t: 'चांगले! 💪', c: '#10B981' } : { t: 'अजून सराव करा 📚', c: '#F97316' };

    return (
      <div style={{ ...base, padding: '24px 16px 80px' }}>
        <style>{CSS}</style>
        <div style={{ maxWidth: 660, margin: '0 auto 28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 32, padding: '40px 28px', textAlign: 'center', animation: 'mt-scale 0.5s cubic-bezier(.34,1.56,.64,1)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#F97316,#FFD700,#F97316)', backgroundSize: '200%', animation: 'mt-shimmer 2.5s infinite' }} />
          <div style={{ fontSize: 68, marginBottom: 8, animation: 'mt-trophy 0.7s cubic-bezier(.34,1.56,.64,1) 0.2s both', display: 'inline-block' }}>🏆</div>
          <div style={{ fontWeight: 900, fontSize: 12, color: rank.c, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>{rank.t}</div>
          <div style={{ fontWeight: 900, fontSize: 'clamp(2.5rem,8vw,4rem)', letterSpacing: '-0.05em', lineHeight: 1 }}>
            {score}<span style={{ fontSize: '0.42em', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>/{questions.length}</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 6 }}>{pct}% अचूकता</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, margin: '28px 0' }}>
            {[
              { l: 'बरोबर', v: score, c: '#10B981', bg: 'rgba(16,185,129,0.1)' },
              { l: 'चुकीचे', v: attempted - score, c: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
              { l: 'सोडलेले', v: questions.length - attempted, c: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
            ].map(({ l, v, c, bg }) => (
              <div key={l} style={{ background: bg, border: `1px solid ${c}22`, borderRadius: 18, padding: '16px 8px' }}>
                <div style={{ fontWeight: 900, fontSize: 'clamp(1.3rem,4vw,2rem)', color: c, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={onBack}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#F97316,#EF4444)', border: 'none', borderRadius: 14, padding: '14px 28px', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 28px rgba(249,115,22,0.3)' }}>
              <LayoutDashboard size={17} /> डॅशबोर्डवर जा
            </button>
            <button onClick={() => { setIsFinished(false); setStatus('idle'); setQuestions([]); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '14px 22px', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>
              पुन्हा द्या
            </button>
          </div>
        </div>
        <div style={{ maxWidth: 660, margin: '0 auto 28px' }}>
          <SupportModule title="ही चाचणी आवडली का? सपोर्ट करा" />
        </div>
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 18, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} style={{ color: '#F97316' }} /> सर्व प्रश्नांचे विश्लेषण
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {questions.map((q, idx) => {
              const ua = userAnswers[idx];
              const isCorrect = ua === q.correctAnswerIndex;
              const isSkipped = ua === -1;
              const sc = isSkipped ? '#64748B' : isCorrect ? '#10B981' : '#EF4444';
              return (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, overflow: 'hidden' }}>
                  <div style={{ height: 3, background: sc, opacity: 0.8 }} />
                  <div style={{ padding: '18px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '3px 11px', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>प्रश्न {idx + 1}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: sc, background: `${sc}18`, border: `1px solid ${sc}30`, borderRadius: 99, padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {isSkipped ? '- सोडला' : isCorrect ? <><Check size={11} /> बरोबर</> : <><X size={11} /> चुकीचे</>}
                      </span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', marginBottom: 14 }}>{q.question}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
                      {(q.options || []).map((opt, oi) => {
                        const correct = q.correctAnswerIndex === oi;
                        const selected = ua === oi;
                        return (
                          <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderRadius: 11, background: correct ? 'rgba(16,185,129,0.11)' : selected && !correct ? 'rgba(239,68,68,0.09)' : 'rgba(255,255,255,0.03)', border: `1px solid ${correct ? 'rgba(16,185,129,0.3)' : selected && !correct ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.05)'}` }}>
                            <span style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, background: correct ? '#10B981' : selected && !correct ? '#EF4444' : 'rgba(255,255,255,0.06)', color: correct || (selected && !correct) ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: correct ? '#10B981' : selected && !correct ? '#EF4444' : 'rgba(255,255,255,0.55)', flex: 1 }}>{opt}</span>
                            {correct && <CheckCircle2 size={14} color="#10B981" />}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.18)', borderRadius: 14, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <BookOpen size={11} /> स्पष्टीकरण
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, fontWeight: 500, fontStyle: 'italic' }}>{q.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE TEST
  if (status === 'success' && questions.length > 0) {
    const done = userAnswers.filter(a => a !== -1).length;
    const warn = timeLeft < 300;
    const q = questions[currentIdx];

    return (
      <div style={{ ...base }}>
        <style>{CSS}</style>
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(11,15,26,0.93)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => window.confirm('बाहेर पडायचे? Progress जाईल.') && onBack()}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '7px 13px', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            <ArrowLeft size={13} /> डॅशबोर्ड
          </button>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#F97316,#FBBF24)', borderRadius: 99, width: `${(done / questions.length) * 100}%`, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{done}/{questions.length}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: warn ? 'rgba(239,68,68,0.14)' : 'rgba(255,255,255,0.06)', border: `1px solid ${warn ? 'rgba(239,68,68,0.38)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '7px 13px', animation: warn ? 'mt-glow 1s infinite' : 'none' }}>
            <Clock size={13} style={{ color: warn ? '#EF4444' : '#F97316' }} />
            <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 15, color: warn ? '#EF4444' : '#fff', animation: warn ? 'mt-warn 0.7s infinite' : 'none' }}>{fmt(timeLeft)}</span>
          </div>
          <button onClick={() => window.confirm('सबमिट करायची का?') && finishTest()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
            <Send size={12} /> सबमिट
          </button>
        </div>

        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '22px 14px 80px', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 270 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 26, padding: '28px 24px', display: 'flex', flexDirection: 'column', minHeight: 460, animation: 'mt-fade 0.22s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <span style={{ background: 'rgba(249,115,22,0.14)', border: '1px solid rgba(249,115,22,0.28)', borderRadius: 99, padding: '4px 13px', fontSize: 10, fontWeight: 800, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {q?.subCategory}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.28)' }}>{currentIdx + 1} / {questions.length}</span>
              </div>
              <p style={{ fontWeight: 700, fontSize: 'clamp(0.95rem,2.5vw,1.15rem)', lineHeight: 1.65, color: '#fff', flex: 1, marginBottom: 24 }}>
                <span style={{ color: '#F97316', fontWeight: 900 }}>Q.{currentIdx + 1} </span>{q?.question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {(q?.options || []).map((opt: string, i: number) => {
                  const sel = userAnswers[currentIdx] === i;
                  return (
                    <button key={i} className="mt-opt" data-selected={sel ? 'true' : 'false'}
                      onClick={() => { const n = [...userAnswers]; n[currentIdx] = i; setUserAnswers(n); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', borderRadius: 13, border: `1.5px solid ${sel ? 'rgba(249,115,22,0.55)' : 'rgba(255,255,255,0.07)'}`, background: sel ? 'rgba(249,115,22,0.11)' : 'rgba(255,255,255,0.03)', color: sel ? '#fff' : 'rgba(255,255,255,0.62)', fontWeight: 700, fontSize: 13, textAlign: 'left', cursor: 'pointer', transition: 'all 0.16s ease', animation: sel ? 'mt-pop 0.22s ease' : 'none' }}>
                      <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, background: sel ? '#F97316' : 'rgba(255,255,255,0.07)', color: sel ? '#fff' : 'rgba(255,255,255,0.38)', transition: 'all 0.16s' }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span style={{ flex: 1 }}>{opt}</span>
                      {sel && <CheckCircle2 size={15} style={{ color: '#F97316', flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(p => p - 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 11, padding: '9px 16px', color: 'rgba(255,255,255,0.38)', fontWeight: 800, fontSize: 12, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentIdx === 0 ? 0.3 : 1 }}>
                  <ChevronLeft size={15} /> मागे
                </button>
                <button onClick={() => currentIdx === questions.length - 1 ? (window.confirm('सबमिट करायची का?') && finishTest()) : setCurrentIdx(p => p + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#F97316,#EF4444)', border: 'none', borderRadius: 11, padding: '11px 22px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 5px 18px rgba(249,115,22,0.22)' }}>
                  {currentIdx === questions.length - 1 ? <><Send size={14} /> निकाल पहा</> : <>पुढे <ChevronRight size={15} /></>}
                </button>
              </div>
            </div>
          </div>

          <div style={{ width: 250, flexShrink: 0 }}>
            <SupportModule title="आम्हाला सपोर्ट करा" />
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, padding: '18px 14px', position: 'sticky', top: 74 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>प्रश्नावली · {testType}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5, maxHeight: '52vh', overflowY: 'auto' }}>
                {questions.map((_, i) => {
                  const isDone = userAnswers[i] !== -1;
                  const isActive = i === currentIdx;
                  return (
                    <button key={i} onClick={() => setCurrentIdx(i)}
                      style={{ height: 34, borderRadius: 9, fontSize: 10, fontWeight: 800, cursor: 'pointer', border: 'none', transition: 'all 0.14s', background: isActive ? '#F97316' : isDone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', color: isActive ? '#fff' : isDone ? '#10B981' : 'rgba(255,255,255,0.22)', transform: isActive ? 'scale(1.12)' : 'none', boxShadow: isActive ? '0 4px 12px rgba(249,115,22,0.32)' : 'none' }}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[{ c: '#F97316', l: 'सध्याचा' }, { c: '#10B981', l: 'उत्तर दिले' }, { c: 'rgba(255,255,255,0.1)', l: 'बाकी' }].map(({ c, l }) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 9, height: 9, borderRadius: 3, background: c, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SELECTION
  if (status === 'idle') {
    const TYPES = [
      { id: 'Rajyaseva',        l: 'राज्यसेवा',        s: '100 प्रश्न · 2 तास', c: '#3B82F6' },
      { id: 'Combined Group B', l: 'Combined Group B', s: '100 प्रश्न · 2 तास', c: '#10B981' },
      { id: 'Combined Group C', l: 'Combined Group C', s: '100 प्रश्न · 2 तास', c: '#06B6D4' },
      { id: 'Saralseva',        l: 'सरळसेवा',          s: '120 प्रश्न · 2 तास', c: '#F97316' },
    ];
    return (
      <div style={{ ...base, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <style>{CSS}</style>
        <div style={{ width: '100%', maxWidth: 620, animation: 'mt-scale 0.4s cubic-bezier(.34,1.56,.64,1)' }}>

          {/* Back to Dashboard */}
          <button onClick={onBack} className="mt-back"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '9px 16px', color: 'rgba(255,255,255,0.55)', fontWeight: 800, fontSize: 12, cursor: 'pointer', marginBottom: 24, transition: 'all 0.15s' }}>
            <ArrowLeft size={13} /> डॅशबोर्ड
          </button>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(249,115,22,0.14)', border: '1px solid rgba(249,115,22,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', animation: 'mt-glow 2s infinite' }}>
              <Target size={30} style={{ color: '#F97316' }} />
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.5rem,5vw,2.1rem)', letterSpacing: '-0.04em', margin: '0 0 7px' }}>सराव परीक्षा निवडा</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', fontWeight: 600 }}>परीक्षा प्रकार निवडा आणि सुरू करा</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
            {TYPES.map(({ id, l, s, c }) => {
              const sel = testType === id;
              return (
                <button key={id} onClick={() => setTestType(id)}
                  style={{ padding: '18px 16px', borderRadius: 18, border: `1.5px solid ${sel ? c + '55' : 'rgba(255,255,255,0.07)'}`, background: sel ? `${c}12` : 'rgba(255,255,255,0.03)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.18s', position: 'relative', overflow: 'hidden' }}>
                  {sel && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c }} />}
                  <div style={{ fontWeight: 900, fontSize: 14, color: sel ? '#fff' : 'rgba(255,255,255,0.55)', marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: sel ? c : 'rgba(255,255,255,0.22)' }}>{s}</div>
                  {sel && <CheckCircle2 size={16} style={{ color: c, position: 'absolute', top: 12, right: 12 }} />}
                </button>
              );
            })}
          </div>
          <SupportModule title="तुम्ही सपोर्ट करू इच्छिता?" />
          <button onClick={startTest} className="mt-start"
            style={{ width: '100%', background: 'linear-gradient(135deg,#F97316,#EF4444)', border: 'none', borderRadius: 16, padding: '17px', color: '#fff', fontWeight: 900, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 10px 36px rgba(249,115,22,0.32)', letterSpacing: '-0.02em', transition: 'all 0.2s ease' }}>
            <Zap size={19} fill="currentColor" /> चाचणी सुरू करा
          </button>
        </div>
      </div>
    );
  }

  // LOADING
  if (status === 'loading') return (
    <div style={{ ...base, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      <style>{CSS}</style>
      <div style={{ width: 52, height: 52, border: '3px solid rgba(249,115,22,0.18)', borderTopColor: '#F97316', borderRadius: '50%', animation: 'mt-spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>प्रश्न तयार होत आहेत...</div>
    </div>
  );

  // ERROR
  if (status === 'error') return (
    <div style={{ ...base, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 }}>
      <style>{CSS}</style>
      <AlertCircle size={44} style={{ color: '#EF4444' }} />
      <div style={{ fontWeight: 900, fontSize: 17 }}>डेटा लोड होऊ शकला नाही!</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setStatus('idle')}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 11, padding: '9px 22px', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
          परत जा
        </button>
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 11, padding: '9px 22px', color: '#F97316', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
          <ArrowLeft size={13} /> डॅशबोर्ड
        </button>
      </div>
    </div>
  );

  return null;
}

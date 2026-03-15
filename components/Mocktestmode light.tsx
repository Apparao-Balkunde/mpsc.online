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
    <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.05))', border:'1px solid rgba(16,185,129,0.3)', borderRadius:20, padding:'20px 24px', textAlign:'center', marginBottom:16 }}>
      <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#10B981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', boxShadow:'0 4px 16px rgba(16,185,129,0.4)' }}>
        <Check size={22} color="#fff" />
      </div>
      <div style={{ fontWeight:900, color:'#059669', fontSize:15, marginBottom:4 }}>धन्यवाद! ❤️</div>
      <div style={{ fontSize:12, color:'#0D6B6E', fontWeight:600 }}>Rs.{amt} च्या सपोर्टबद्दल आभारी आहोत!</div>
      <button onClick={() => { setHasPaid(false); setAmt(''); }}
        style={{ marginTop:12, fontSize:11, fontWeight:800, color:'#0D6B6E', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
        पुन्हा सपोर्ट करा
      </button>
    </div>
  );

  return (
    <div style={{ background:'linear-gradient(135deg,#fff,#FDF6EC)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:20, padding:'20px 24px', marginBottom:16, boxShadow:'0 4px 20px rgba(232,103,26,0.08)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <Heart size={14} fill="#F43F5E" color="#F43F5E" />
        <span style={{ fontSize:11, fontWeight:800, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.1em' }}>{title}</span>
      </div>
      <p style={{ fontSize:11, color:'#7A9090', fontWeight:600, fontStyle:'italic', marginBottom:14, lineHeight:1.5 }}>"तुमचा सपोर्ट, माझं मोटिव्हेशन!"</p>
      <div style={{ position:'relative', marginBottom:12 }}>
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#0D6B6E', fontWeight:700, fontSize:14 }}>Rs.</span>
        <input type="number" inputMode="decimal" value={amt} placeholder="रक्कम टाका"
          onChange={e => setAmt(e.target.value)}
          style={{ width:'100%', background:'#FDF6EC', border:'1px solid rgba(232,103,26,0.2)', borderRadius:12, paddingLeft:36, paddingRight:12, paddingTop:10, paddingBottom:10, color:'#1C2B2B', fontWeight:700, fontSize:14, outline:'none', boxSizing:'border-box' }} />
      </div>
      {parseFloat(currentAmt) > 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <a href={upiLink} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg,#E8671A,#C4510E)', borderRadius:12, padding:'11px', color:'#fff', fontWeight:900, fontSize:12, textDecoration:'none', boxShadow:'0 4px 14px rgba(232,103,26,0.35)' }}>
            <Coffee size={15} /> GPay / PhonePe
          </a>
          <button onClick={() => setHasPaid(true)}
            style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:12, padding:'9px', color:'#059669', fontWeight:900, fontSize:11, cursor:'pointer' }}>
            मी पेमेंट केले ✅
          </button>
        </div>
      ) : (
        <div style={{ background:'#FDF6EC', border:'1px dashed rgba(232,103,26,0.2)', borderRadius:12, padding:'12px', textAlign:'center' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.1em' }}>रक्कम टाका</p>
        </div>
      )}
    </div>
  );
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes mt-fade { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
  @keyframes mt-scale { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes mt-spin { to{transform:rotate(360deg)} }
  @keyframes mt-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes mt-trophy { 0%{transform:rotate(-15deg) scale(0.7);opacity:0}60%{transform:rotate(10deg) scale(1.15)}100%{transform:rotate(0) scale(1);opacity:1} }
  @keyframes mt-glow { 0%,100%{box-shadow:0 0 0 0 rgba(232,103,26,0.3)}50%{box-shadow:0 0 0 8px rgba(232,103,26,0)} }
  @keyframes mt-warn { 0%,100%{color:#EF4444}50%{color:#FF8080} }
  @keyframes mt-pop { 0%{transform:scale(1)}45%{transform:scale(1.03)}100%{transform:scale(1)} }
  @keyframes mt-pulse { 0%,100%{opacity:1}50%{opacity:0.6} }
  .mt-opt { transition: all 0.2s ease !important; }
  .mt-opt:hover:not([data-selected="true"]) { background:#FDF6EC !important; border-color:rgba(232,103,26,0.3) !important; transform:translateX(4px) !important; box-shadow:0 4px 16px rgba(232,103,26,0.12) !important; }
  .mt-start:hover { transform:translateY(-3px) !important; box-shadow:0 20px 48px rgba(232,103,26,0.4) !important; }
  .mt-back:hover { background:rgba(13,107,110,0.08) !important; }
  .mt-type-card:hover { transform:translateY(-3px) !important; box-shadow:0 12px 32px rgba(232,103,26,0.2) !important; }
  .mt-nav-btn:hover { background:rgba(13,107,110,0.1) !important; }
`;

export function MockTestMode({ onBack }: MockTestModeProps) {
  const [status, setStatus]         = useState<LoadingState>('idle');
  const [questions, setQuestions]   = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft]     = useState(7200);
  const [isFinished, setIsFinished] = useState(false);
  const [testType, setTestType]     = useState('Rajyaseva');
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
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const fmt = (s: number) => {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
  };

  const base: React.CSSProperties = {
    minHeight:'100vh',
    background:'#FDF6EC',
    fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",
    color:'#1C2B2B',
  };

  // IDLE — Test Selection
  if (status === 'idle' || status === 'error') {
    const types = [
      { id:'Rajyaseva', label:'राज्यसेवा', sub:'100 प्रश्न · 2 तास', emoji:'🏛️', color:'#E8671A', bg:'linear-gradient(135deg,rgba(232,103,26,0.1),rgba(232,103,26,0.05))' },
      { id:'Combined Group B', label:'Combined Group B', sub:'100 प्रश्न · 2 तास', emoji:'📋', color:'#0D6B6E', bg:'linear-gradient(135deg,rgba(13,107,110,0.1),rgba(13,107,110,0.05))' },
      { id:'Combined Group C', label:'Combined Group C', sub:'100 प्रश्न · 2 तास', emoji:'📝', color:'#7C3AED', bg:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(124,58,237,0.05))' },
      { id:'Saralseva', label:'सरळसेवा', sub:'120 प्रश्न · 2 तास', emoji:'⚡', color:'#D97706', bg:'linear-gradient(135deg,rgba(217,119,6,0.1),rgba(217,119,6,0.05))' },
    ];

    return (
      <div style={{ ...base, padding:'0 0 80px' }}>
        <style>{CSS}</style>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1C2B2B,#0D6B6E)', padding:'20px 24px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 4px 20px rgba(13,107,110,0.3)' }}>
          <button onClick={onBack} className="mt-back"
            style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 14px', color:'#FDF6EC', fontSize:12, fontWeight:800, cursor:'pointer' }}>
            <ArrowLeft size={14} /> डॅशबोर्ड
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:16, color:'#F5C842', letterSpacing:'-0.02em' }}>Full Mock Test</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>परीक्षा प्रकार निवडा आणि सुरू करा</div>
          </div>
        </div>

        <div style={{ maxWidth:640, margin:'0 auto', padding:'32px 20px' }}>

          {/* Hero */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#E8671A,#F5C842)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 32px rgba(232,103,26,0.35)', fontSize:32 }}>
              🎯
            </div>
            <h2 style={{ fontWeight:900, fontSize:'clamp(1.6rem,4vw,2.2rem)', letterSpacing:'-0.04em', color:'#1C2B2B', marginBottom:8, lineHeight:1.1 }}>
              सराव परीक्षा निवडा
            </h2>
            <p style={{ fontSize:13, color:'#4A6060', fontWeight:600 }}>परीक्षा प्रकार निवडा आणि सुरू करा</p>
          </div>

          {/* Type Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:28 }}>
            {types.map(t => (
              <div key={t.id} className="mt-type-card"
                onClick={() => setTestType(t.id)}
                style={{ background: testType === t.id ? `linear-gradient(135deg,${t.color},${t.color}DD)` : t.bg, border:`2px solid ${testType === t.id ? t.color : 'rgba(28,43,43,0.1)'}`, borderRadius:20, padding:'20px 16px', cursor:'pointer', transition:'all 0.2s ease', position:'relative', overflow:'hidden', boxShadow: testType === t.id ? `0 8px 24px ${t.color}40` : 'none' }}>
                {testType === t.id && (
                  <div style={{ position:'absolute', top:10, right:10, width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Check size={13} color="#fff" />
                  </div>
                )}
                <div style={{ fontSize:28, marginBottom:10 }}>{t.emoji}</div>
                <div style={{ fontWeight:900, fontSize:14, color: testType === t.id ? '#fff' : '#1C2B2B', marginBottom:4, lineHeight:1.2 }}>{t.label}</div>
                <div style={{ fontSize:11, fontWeight:700, color: testType === t.id ? 'rgba(255,255,255,0.8)' : '#7A9090' }}>{t.sub}</div>
              </div>
            ))}
          </div>

          {/* Support */}
          <SupportModule title="आम्हाला सपोर्ट करा" />

          {/* Start Button */}
          {status === 'error' && (
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:14, padding:'12px 16px', marginBottom:16, display:'flex', gap:10, alignItems:'center' }}>
              <AlertCircle size={16} color="#EF4444" />
              <span style={{ fontSize:12, fontWeight:700, color:'#DC2626' }}>प्रश्न लोड झाले नाहीत. पुन्हा प्रयत्न करा.</span>
            </div>
          )}
          <button onClick={startTest} className="mt-start"
            style={{ width:'100%', background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:18, padding:'18px', color:'#fff', fontWeight:900, fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow:'0 10px 36px rgba(232,103,26,0.35)', letterSpacing:'-0.02em', transition:'all 0.2s ease' }}>
            <Zap size={18} fill="currentColor" />
            चाचणी सुरू करा
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // LOADING
  if (status === 'loading') {
    return (
      <div style={{ ...base, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <style>{CSS}</style>
        <div style={{ width:56, height:56, border:'4px solid rgba(232,103,26,0.2)', borderTopColor:'#E8671A', borderRadius:'50%', animation:'mt-spin 0.8s linear infinite', marginBottom:20 }} />
        <div style={{ fontWeight:900, fontSize:16, color:'#1C2B2B', marginBottom:6 }}>प्रश्न लोड होत आहेत...</div>
        <div style={{ fontSize:12, color:'#7A9090', fontWeight:600 }}>{testType} · कृपया थांबा</div>
      </div>
    );
  }

  // RESULT
  if (isFinished && questions.length > 0) {
    const score    = userAnswers.filter((a,i) => questions[i] && a === questions[i].correctAnswerIndex).length;
    const attempted = userAnswers.filter(a => a !== -1).length;
    const pct      = Math.round((score/questions.length)*100);
    const rank     = pct >= 70 ? { t:'उत्तम! 🏆', c:'#D97706', bg:'linear-gradient(135deg,rgba(217,119,6,0.12),rgba(217,119,6,0.05))' }
                   : pct >= 50 ? { t:'चांगले! 💪', c:'#0D6B6E', bg:'linear-gradient(135deg,rgba(13,107,110,0.12),rgba(13,107,110,0.05))' }
                   :             { t:'अजून सराव करा 📚', c:'#E8671A', bg:'linear-gradient(135deg,rgba(232,103,26,0.12),rgba(232,103,26,0.05))' };

    return (
      <div style={{ ...base, padding:'24px 16px 80px' }}>
        <style>{CSS}</style>

        {/* Result Card */}
        <div style={{ maxWidth:660, margin:'0 auto 28px', background:'#fff', border:'1px solid rgba(232,103,26,0.15)', borderRadius:28, padding:'36px 28px', textAlign:'center', animation:'mt-scale 0.5s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 12px 48px rgba(232,103,26,0.12)' }}>
          <div style={{ position:'relative', display:'inline-block', marginBottom:16 }}>
            <div style={{ width:100, height:100, borderRadius:'50%', background:'linear-gradient(135deg,#E8671A,#F5C842)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44, boxShadow:'0 8px 32px rgba(232,103,26,0.4)', animation:'mt-trophy 0.7s cubic-bezier(.34,1.56,.64,1) 0.2s both' }}>
              🏆
            </div>
          </div>
          <div style={{ fontWeight:900, fontSize:13, color:rank.c, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>{rank.t}</div>
          <div style={{ fontWeight:900, fontSize:'clamp(3rem,10vw,5rem)', letterSpacing:'-0.05em', lineHeight:1, background:'linear-gradient(135deg,#E8671A,#0D6B6E)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            {score}<span style={{ fontSize:'0.38em', color:'#7A9090', WebkitTextFillColor:'#7A9090', fontWeight:700 }}>/{questions.length}</span>
          </div>
          <div style={{ fontSize:14, color:'#4A6060', fontWeight:700, marginTop:8, marginBottom:28 }}>{pct}% अचूकता</div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:28 }}>
            {[
              { l:'बरोबर',   v:score,                      c:'#059669', border:'rgba(5,150,105,0.25)' },
              { l:'चुकीचे',  v:attempted-score,            c:'#DC2626', border:'rgba(220,38,38,0.25)' },
              { l:'सोडलेले', v:questions.length-attempted, c:'#D97706', border:'rgba(217,119,6,0.25)' },
            ].map(({ l,v,c,border }) => (
              <div key={l} style={{ background:'#FDF6EC', border:`1.5px solid ${border}`, borderRadius:16, padding:'16px 8px' }}>
                <div style={{ fontWeight:900, fontSize:'clamp(1.5rem,4vw,2.2rem)', color:c, lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:10, fontWeight:800, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={onBack}
              style={{ display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'14px 28px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer', boxShadow:'0 8px 24px rgba(232,103,26,0.35)' }}>
              <LayoutDashboard size={17} /> डॅशबोर्ड
            </button>
            <button onClick={() => { setIsFinished(false); setStatus('idle'); setQuestions([]); }}
              style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#FDF6EC', border:'1.5px solid rgba(13,107,110,0.2)', borderRadius:14, padding:'14px 22px', color:'#0D6B6E', fontWeight:900, fontSize:14, cursor:'pointer' }}>
              पुन्हा द्या
            </button>
          </div>
        </div>

        <div style={{ maxWidth:660, margin:'0 auto 28px' }}>
          <SupportModule title="ही चाचणी आवडली का? सपोर्ट करा" />
        </div>

        {/* Analysis */}
        <div style={{ maxWidth:660, margin:'0 auto' }}>
          <div style={{ fontWeight:900, fontSize:18, marginBottom:18, letterSpacing:'-0.03em', display:'flex', alignItems:'center', gap:8, color:'#1C2B2B' }}>
            <BookOpen size={18} style={{ color:'#E8671A' }} /> सर्व प्रश्नांचे विश्लेषण
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {questions.map((q, idx) => {
              const ua = userAnswers[idx];
              const isCorrect = ua === q.correctAnswerIndex;
              const isSkipped = ua === -1;
              const sc = isSkipped ? '#94A3B8' : isCorrect ? '#059669' : '#DC2626';
              return (
                <div key={idx} style={{ background:'#fff', border:'1px solid rgba(28,43,43,0.08)', borderRadius:20, overflow:'hidden', boxShadow:'0 2px 12px rgba(28,43,43,0.06)' }}>
                  <div style={{ height:3, background:sc }} />
                  <div style={{ padding:'18px 22px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <span style={{ background:'#FDF6EC', borderRadius:8, padding:'3px 11px', fontSize:10, fontWeight:800, color:'#E8671A', letterSpacing:'0.08em' }}>प्रश्न {idx+1}</span>
                      <span style={{ fontSize:11, fontWeight:800, color:sc, background:`${sc}15`, border:`1px solid ${sc}30`, borderRadius:99, padding:'3px 10px', display:'inline-flex', alignItems:'center', gap:4 }}>
                        {isSkipped ? '- सोडला' : isCorrect ? <><Check size={11} /> बरोबर</> : <><X size={11} /> चुकीचे</>}
                      </span>
                    </div>
                    <p style={{ fontWeight:700, fontSize:13, lineHeight:1.6, color:'#1C2B2B', marginBottom:14 }}>{q.question}</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:14 }}>
                      {(q.options||[]).map((opt,oi) => {
                        const correct  = q.correctAnswerIndex === oi;
                        const selected = ua === oi;
                        return (
                          <div key={oi} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', borderRadius:11, background:correct?'rgba(5,150,105,0.08)':selected&&!correct?'rgba(220,38,38,0.07)':'#FDF6EC', border:`1px solid ${correct?'rgba(5,150,105,0.3)':selected&&!correct?'rgba(220,38,38,0.25)':'rgba(28,43,43,0.08)'}` }}>
                            <span style={{ width:26, height:26, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, background:correct?'#059669':selected&&!correct?'#DC2626':'#FDF6EC', color:correct||(selected&&!correct)?'#fff':'#4A6060', border:correct||selected?'none':'1px solid rgba(28,43,43,0.15)' }}>
                              {String.fromCharCode(65+oi)}
                            </span>
                            <span style={{ fontSize:12, fontWeight:600, color:correct?'#059669':selected&&!correct?'#DC2626':'#1C2B2B', flex:1 }}>{opt}</span>
                            {correct && <CheckCircle2 size={14} color="#059669" />}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:14, padding:'12px 14px' }}>
                      <div style={{ fontSize:10, fontWeight:800, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5, display:'flex', alignItems:'center', gap:5 }}>
                        <BookOpen size={11} /> स्पष्टीकरण
                      </div>
                      <p style={{ fontSize:12, color:'#4A6060', lineHeight:1.65, fontWeight:500, fontStyle:'italic' }}>{q.explanation}</p>
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
    const q    = questions[currentIdx];

    return (
      <div style={{ ...base }}>
        <style>{CSS}</style>

        {/* Sticky Header */}
        <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(253,246,236,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(232,103,26,0.12)', padding:'12px 18px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 16px rgba(232,103,26,0.08)' }}>
          <button onClick={() => window.confirm('बाहेर पडायचे? Progress जाईल.') && onBack()}
            className="mt-back"
            style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(13,107,110,0.08)', border:'1px solid rgba(13,107,110,0.15)', borderRadius:10, padding:'7px 13px', color:'#0D6B6E', fontSize:12, fontWeight:800, cursor:'pointer' }}>
            <ArrowLeft size={13} /> डॅशबोर्ड
          </button>

          {/* Progress bar */}
          <div style={{ flex:1, background:'rgba(232,103,26,0.12)', borderRadius:99, height:6, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:99, width:`${(done/questions.length)*100}%`, transition:'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize:11, fontWeight:800, color:'#7A9090', whiteSpace:'nowrap' }}>{done}/{questions.length}</span>

          {/* Timer */}
          <div style={{ display:'flex', alignItems:'center', gap:6, background:warn?'rgba(239,68,68,0.1)':'rgba(13,107,110,0.08)', border:`1px solid ${warn?'rgba(239,68,68,0.3)':'rgba(13,107,110,0.15)'}`, borderRadius:10, padding:'7px 13px', animation:warn?'mt-glow 1s infinite':'none' }}>
            <Clock size={13} style={{ color:warn?'#DC2626':'#0D6B6E' }} />
            <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:15, color:warn?'#DC2626':'#1C2B2B', animation:warn?'mt-warn 0.7s infinite':'none' }}>{fmt(timeLeft)}</span>
          </div>

          <button onClick={() => window.confirm('सबमिट करायची का?') && finishTest()}
            style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#0D6B6E,#094D50)', border:'none', borderRadius:10, padding:'8px 16px', color:'#fff', fontSize:12, fontWeight:900, cursor:'pointer', boxShadow:'0 4px 14px rgba(13,107,110,0.3)' }}>
            <Send size={12} /> सबमिट
          </button>
        </div>

        <div style={{ maxWidth:1080, margin:'0 auto', padding:'24px 16px 80px', display:'flex', gap:20, flexWrap:'wrap' }}>

          {/* Question Panel */}
          <div style={{ flex:1, minWidth:280 }}>
            <div style={{ background:'#fff', border:'1px solid rgba(28,43,43,0.08)', borderRadius:24, padding:'28px 24px', display:'flex', flexDirection:'column', minHeight:460, animation:'mt-fade 0.22s ease', boxShadow:'0 4px 24px rgba(28,43,43,0.08)' }}>

              {/* Question header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <span style={{ background:'linear-gradient(135deg,rgba(232,103,26,0.12),rgba(232,103,26,0.06))', border:'1px solid rgba(232,103,26,0.2)', borderRadius:99, padding:'5px 14px', fontSize:10, fontWeight:800, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                  {q?.subCategory}
                </span>
                <span style={{ fontSize:12, fontWeight:700, color:'#7A9090' }}>{currentIdx+1} / {questions.length}</span>
              </div>

              {/* Question text */}
              <p style={{ fontWeight:700, fontSize:'clamp(0.95rem,2.5vw,1.15rem)', lineHeight:1.7, color:'#1C2B2B', flex:1, marginBottom:24 }}>
                <span style={{ color:'#E8671A', fontWeight:900 }}>Q.{currentIdx+1} </span>{q?.question}
              </p>

              {/* Options */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {(q?.options||[]).map((opt:string, i:number) => {
                  const sel = userAnswers[currentIdx] === i;
                  return (
                    <button key={i} className="mt-opt" data-selected={sel?'true':'false'}
                      onClick={() => { const n=[...userAnswers]; n[currentIdx]=i; setUserAnswers(n); }}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, border:`2px solid ${sel?'#E8671A':'rgba(28,43,43,0.08)'}`, background:sel?'linear-gradient(135deg,rgba(232,103,26,0.08),rgba(232,103,26,0.04))':'#FDF6EC', color:'#1C2B2B', fontWeight:600, fontSize:13, textAlign:'left', cursor:'pointer', transition:'all 0.18s ease', animation:sel?'mt-pop 0.22s ease':'none', boxShadow:sel?'0 4px 16px rgba(232,103,26,0.15)':'none' }}>
                      <span style={{ width:30, height:30, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:sel?'#E8671A':'#fff', color:sel?'#fff':'#4A6060', border:sel?'none':'1.5px solid rgba(28,43,43,0.12)', transition:'all 0.16s', boxShadow:sel?'0 2px 8px rgba(232,103,26,0.3)':'none' }}>
                        {String.fromCharCode(65+i)}
                      </span>
                      <span style={{ flex:1, color:'#1C2B2B' }}>{opt}</span>
                      {sel && <CheckCircle2 size={16} style={{ color:'#E8671A', flexShrink:0 }} />}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:24, paddingTop:18, borderTop:'1px solid rgba(28,43,43,0.06)' }}>
                <button disabled={currentIdx===0} onClick={() => setCurrentIdx(p => p-1)}
                  className="mt-nav-btn"
                  style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(13,107,110,0.06)', border:'1px solid rgba(13,107,110,0.12)', borderRadius:11, padding:'9px 16px', color:'#0D6B6E', fontWeight:800, fontSize:12, cursor:currentIdx===0?'not-allowed':'pointer', opacity:currentIdx===0?0.4:1 }}>
                  <ChevronLeft size={15} /> मागे
                </button>
                <span style={{ fontSize:11, color:'#7A9090', fontWeight:700 }}>{done} उत्तरे दिली</span>
                <button disabled={currentIdx===questions.length-1} onClick={() => setCurrentIdx(p => p+1)}
                  style={{ display:'flex', alignItems:'center', gap:5, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:11, padding:'9px 16px', color:'#fff', fontWeight:900, fontSize:12, cursor:currentIdx===questions.length-1?'not-allowed':'pointer', opacity:currentIdx===questions.length-1?0.5:1, boxShadow:'0 4px 14px rgba(232,103,26,0.3)' }}>
                  पुढे <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div style={{ width:200, flexShrink:0 }}>
            <div style={{ background:'#fff', border:'1px solid rgba(28,43,43,0.08)', borderRadius:20, padding:'18px 14px', position:'sticky', top:74, boxShadow:'0 2px 12px rgba(28,43,43,0.06)' }}>
              <div style={{ fontSize:10, fontWeight:800, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14, textAlign:'center' }}>
                प्रश्नावली · {testType.toUpperCase()}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:5, marginBottom:16 }}>
                {questions.map((_,i) => {
                  const isActive = i === currentIdx;
                  const isDone   = userAnswers[i] !== -1;
                  return (
                    <button key={i} onClick={() => setCurrentIdx(i)}
                      style={{ height:32, borderRadius:8, fontSize:10, fontWeight:800, cursor:'pointer', border:'none', transition:'all 0.14s', background:isActive?'linear-gradient(135deg,#E8671A,#C4510E)':isDone?'rgba(13,107,110,0.15)':'rgba(28,43,43,0.06)', color:isActive?'#fff':isDone?'#0D6B6E':'#7A9090', transform:isActive?'scale(1.1)':'none', boxShadow:isActive?'0 4px 12px rgba(232,103,26,0.35)':'none' }}>
                      {i+1}
                    </button>
                  );
                })}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[{c:'#E8671A',l:'सध्याचा'},{c:'#0D6B6E',l:'उत्तर दिले'},{c:'rgba(28,43,43,0.15)',l:'बाकी'}].map(({c,l}) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:7, fontSize:10, color:'#7A9090', fontWeight:700 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:c, flexShrink:0 }} />{l}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return null;
}

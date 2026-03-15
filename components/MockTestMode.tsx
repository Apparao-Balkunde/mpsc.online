import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { LoadingState, QuizQuestion } from '../types';
import {
  Trophy, CheckCircle2, ArrowLeft, LayoutDashboard,
  Check, X, BookOpen, Heart, Coffee, Zap, Clock,
  ChevronRight, ChevronLeft, Send, AlertCircle
} from 'lucide-react';

interface MockTestModeProps { onBack: () => void; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes mt-fade   { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
  @keyframes mt-scale  { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes mt-spin   { to{transform:rotate(360deg)} }
  @keyframes mt-shimmer{ 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes mt-trophy { 0%{transform:rotate(-15deg) scale(0.7);opacity:0}60%{transform:rotate(10deg) scale(1.15)}100%{transform:rotate(0) scale(1);opacity:1} }
  @keyframes mt-glow   { 0%,100%{box-shadow:0 0 0 0 rgba(232,103,26,0.3)}50%{box-shadow:0 0 0 10px rgba(232,103,26,0)} }
  @keyframes mt-warn   { 0%,100%{color:#DC2626}50%{color:#EF4444} }
  @keyframes mt-pop    { 0%{transform:scale(1)}45%{transform:scale(1.04)}100%{transform:scale(1)} }
  .mt-opt:hover:not([data-selected="true"]) { background:#FDF6EC !important; border-color:rgba(232,103,26,0.3) !important; transform:translateX(4px) !important; box-shadow:0 4px 14px rgba(232,103,26,0.1) !important; }
  .mt-start:hover { transform:translateY(-3px) !important; box-shadow:0 20px 48px rgba(232,103,26,0.4) !important; }
  .mt-type:hover  { transform:translateY(-2px) !important; box-shadow:0 8px 24px rgba(28,43,43,0.12) !important; }
  .mt-nav:hover   { background:rgba(13,107,110,0.08) !important; }
`;

const SupportModule = ({ title }: { title: string }) => {
  const [amt, setAmt]         = useState('');
  const [hasPaid, setHasPaid] = useState(false);
  const currentAmt = amt && parseFloat(amt) > 0 ? amt : '0';
  const upiLink = `upi://pay?pa=apparaobalkunde901@oksbi&pn=Apparao%20Balkunde&am=${currentAmt}&cu=INR`;

  if (hasPaid) return (
    <div style={{ background:'rgba(5,150,105,0.08)', border:'1px solid rgba(5,150,105,0.25)', borderRadius:18, padding:'18px 20px', textAlign:'center', marginBottom:14 }}>
      <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#10B981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', boxShadow:'0 4px 14px rgba(16,185,129,0.35)' }}>
        <Check size={20} color="#fff" />
      </div>
      <div style={{ fontWeight:900, color:'#059669', fontSize:14, marginBottom:3 }}>धन्यवाद! ❤️</div>
      <div style={{ fontSize:11, color:'#4A6060', fontWeight:600 }}>₹{amt} च्या सपोर्टबद्दल आभारी!</div>
      <button onClick={() => { setHasPaid(false); setAmt(''); }} style={{ marginTop:10, fontSize:11, fontWeight:800, color:'#7A9090', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>पुन्हा सपोर्ट करा</button>
    </div>
  );

  return (
    <div style={{ background:'#fff', border:'1px solid rgba(232,103,26,0.15)', borderRadius:18, padding:'18px 20px', marginBottom:14, boxShadow:'0 2px 12px rgba(232,103,26,0.06)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
        <Heart size={13} fill="#F43F5E" color="#F43F5E" />
        <span style={{ fontSize:10, fontWeight:800, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.1em' }}>{title}</span>
      </div>
      <p style={{ fontSize:11, color:'#7A9090', fontWeight:600, fontStyle:'italic', marginBottom:12, lineHeight:1.5 }}>"तुमचा सपोर्ट, माझं मोटिव्हेशन!"</p>
      <div style={{ position:'relative', marginBottom:10 }}>
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#7A9090', fontWeight:700, fontSize:13 }}>₹</span>
        <input type="number" inputMode="decimal" value={amt} placeholder="रक्कम टाका"
          onChange={e => setAmt(e.target.value)}
          style={{ width:'100%', background:'#FDF6EC', border:'1px solid rgba(232,103,26,0.2)', borderRadius:10, paddingLeft:26, paddingRight:10, paddingTop:9, paddingBottom:9, color:'#1C2B2B', fontWeight:700, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:"'Baloo 2',sans-serif" }} />
      </div>
      {parseFloat(currentAmt) > 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          <a href={upiLink} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, background:'linear-gradient(135deg,#E8671A,#C4510E)', borderRadius:10, padding:'10px', color:'#fff', fontWeight:900, fontSize:12, textDecoration:'none', boxShadow:'0 4px 12px rgba(232,103,26,0.3)' }}>
            <Coffee size={14} /> GPay / PhonePe
          </a>
          <button onClick={() => setHasPaid(true)} style={{ background:'rgba(5,150,105,0.08)', border:'1px solid rgba(5,150,105,0.25)', borderRadius:10, padding:'8px', color:'#059669', fontWeight:900, fontSize:11, cursor:'pointer' }}>
            मी पेमेंट केले ✅
          </button>
        </div>
      ) : (
        <div style={{ background:'#FDF6EC', border:'1px dashed rgba(232,103,26,0.2)', borderRadius:10, padding:'10px', textAlign:'center' }}>
          <p style={{ fontSize:10, fontWeight:700, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>रक्कम टाका</p>
        </div>
      )}
    </div>
  );
};

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
        id: q.id, question: q.question || 'प्रश्न उपलब्ध नाही',
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswerIndex: q.correct_answer_index ?? 0,
        explanation: q.explanation || 'स्पष्टीकरण उपलब्ध नाही.',
        subCategory: q.subject || 'General',
      }));
      setQuestions(formatted);
      setUserAnswers(new Array(formatted.length).fill(-1));
      setTimeLeft(7200); setCurrentIdx(0); setStatus('success');
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
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
  };

  const base: React.CSSProperties = {
    minHeight:'100vh', background:'#FDF6EC',
    fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#1C2B2B',
  };

  // ── RESULT ──────────────────────────────────────────────────────────
  if (isFinished && questions.length > 0) {
    const score    = userAnswers.filter((a,i) => questions[i] && a === questions[i].correctAnswerIndex).length;
    const attempted = userAnswers.filter(a => a !== -1).length;
    const pct      = Math.round((score / questions.length) * 100);
    const rank     = pct>=70 ? {t:'उत्तम! 🏆',c:'#D97706'} : pct>=50 ? {t:'चांगले! 💪',c:'#0D6B6E'} : {t:'अजून सराव करा 📚',c:'#E8671A'};
    return (
      <div style={{ ...base, padding:'24px 16px 80px' }}>
        <style>{CSS}</style>
        {/* Result card */}
        <div style={{ maxWidth:660, margin:'0 auto 24px', background:'#fff', border:'1px solid rgba(232,103,26,0.15)', borderRadius:28, padding:'36px 24px', textAlign:'center', animation:'mt-scale 0.5s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 12px 48px rgba(232,103,26,0.1)' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#E8671A,#F5C842,#E8671A)', backgroundSize:'200%', animation:'mt-shimmer 2.5s infinite', borderRadius:'28px 28px 0 0' }} />
          <div style={{ fontSize:68, marginBottom:8, animation:'mt-trophy 0.7s cubic-bezier(.34,1.56,.64,1) 0.2s both', display:'inline-block' }}>🏆</div>
          <div style={{ fontWeight:900, fontSize:12, color:rank.c, letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:6 }}>{rank.t}</div>
          <div style={{ fontWeight:900, fontSize:'clamp(2.5rem,8vw,4rem)', letterSpacing:'-0.05em', lineHeight:1, background:'linear-gradient(135deg,#E8671A,#0D6B6E)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            {score}<span style={{ fontSize:'0.42em', WebkitTextFillColor:'#7A9090', fontWeight:700 }}>/{questions.length}</span>
          </div>
          <div style={{ fontSize:13, color:'#7A9090', fontWeight:700, marginTop:6 }}>{pct}% अचूकता</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, margin:'24px 0' }}>
            {[
              {l:'बरोबर',   v:score,                    c:'#059669', bg:'rgba(5,150,105,0.08)',   border:'rgba(5,150,105,0.2)'},
              {l:'चुकीचे',  v:attempted-score,          c:'#DC2626', bg:'rgba(220,38,38,0.08)',   border:'rgba(220,38,38,0.2)'},
              {l:'सोडलेले', v:questions.length-attempted,c:'#D97706', bg:'rgba(217,119,6,0.08)',   border:'rgba(217,119,6,0.2)'},
            ].map(({l,v,c,bg,border}) => (
              <div key={l} style={{ background:bg, border:`1px solid ${border}`, borderRadius:16, padding:'14px 6px' }}>
                <div style={{ fontWeight:900, fontSize:'clamp(1.3rem,4vw,2rem)', color:c, lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:9, fontWeight:800, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={onBack} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'13px 26px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer', boxShadow:'0 8px 24px rgba(232,103,26,0.3)' }}>
              <LayoutDashboard size={16} /> डॅशबोर्ड
            </button>
            <button onClick={() => { setIsFinished(false); setStatus('idle'); setQuestions([]); }} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#FDF6EC', border:'1.5px solid rgba(13,107,110,0.2)', borderRadius:14, padding:'13px 20px', color:'#0D6B6E', fontWeight:900, fontSize:14, cursor:'pointer' }}>
              पुन्हा द्या
            </button>
          </div>
        </div>
        {/* Support */}
        <div style={{ maxWidth:660, margin:'0 auto 24px' }}>
          <SupportModule title="ही चाचणी आवडली का? सपोर्ट करा" />
        </div>
        {/* Analysis */}
        <div style={{ maxWidth:660, margin:'0 auto' }}>
          <div style={{ fontWeight:900, fontSize:17, marginBottom:16, display:'flex', alignItems:'center', gap:8, color:'#1C2B2B' }}>
            <BookOpen size={17} style={{ color:'#E8671A' }} /> सर्व प्रश्नांचे विश्लेषण
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {questions.map((q, idx) => {
              const ua = userAnswers[idx];
              const isCorrect = ua === q.correctAnswerIndex;
              const isSkipped = ua === -1;
              const sc = isSkipped ? '#94A3B8' : isCorrect ? '#059669' : '#DC2626';
              return (
                <div key={idx} style={{ background:'#fff', border:'1px solid rgba(28,43,43,0.07)', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 8px rgba(28,43,43,0.05)' }}>
                  <div style={{ height:3, background:sc }} />
                  <div style={{ padding:'16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ background:'#FDF6EC', borderRadius:7, padding:'3px 10px', fontSize:10, fontWeight:800, color:'#E8671A' }}>प्रश्न {idx+1}</span>
                      <span style={{ fontSize:10, fontWeight:800, color:sc, background:`${sc}12`, border:`1px solid ${sc}25`, borderRadius:99, padding:'3px 9px', display:'inline-flex', alignItems:'center', gap:3 }}>
                        {isSkipped ? '— सोडला' : isCorrect ? <><Check size={10}/> बरोबर</> : <><X size={10}/> चुकीचे</>}
                      </span>
                    </div>
                    <p style={{ fontWeight:700, fontSize:13, lineHeight:1.6, color:'#1C2B2B', marginBottom:12 }}>{q.question}</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
                      {(q.options||[]).map((opt,oi) => {
                        const correct = q.correctAnswerIndex === oi;
                        const selected = ua === oi;
                        return (
                          <div key={oi} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderRadius:10, background:correct?'rgba(5,150,105,0.07)':selected&&!correct?'rgba(220,38,38,0.06)':'#FDF6EC', border:`1px solid ${correct?'rgba(5,150,105,0.25)':selected&&!correct?'rgba(220,38,38,0.2)':'rgba(28,43,43,0.07)'}` }}>
                            <span style={{ width:22, height:22, borderRadius:6, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, background:correct?'#059669':selected&&!correct?'#DC2626':'rgba(28,43,43,0.06)', color:correct||(selected&&!correct)?'#fff':'#4A6060' }}>
                              {String.fromCharCode(65+oi)}
                            </span>
                            <span style={{ fontSize:12, fontWeight:600, color:correct?'#065F46':selected&&!correct?'#991B1B':'#1C2B2B', flex:1 }}>{opt}</span>
                            {correct && <CheckCircle2 size={13} color="#059669" />}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:12, padding:'10px 13px' }}>
                      <div style={{ fontSize:9, fontWeight:800, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
                        <BookOpen size={10} /> स्पष्टीकरण
                      </div>
                      <p style={{ fontSize:12, color:'#4A6060', lineHeight:1.65, fontWeight:500, fontStyle:'italic', margin:0 }}>{q.explanation}</p>
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

  // ── ACTIVE TEST ──────────────────────────────────────────────────────
  if (status === 'success' && questions.length > 0) {
    const done = userAnswers.filter(a => a !== -1).length;
    const warn = timeLeft < 300;
    const q    = questions[currentIdx];
    return (
      <div style={base}>
        <style>{CSS}</style>
        {/* Sticky top bar */}
        <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(253,246,236,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(232,103,26,0.12)', padding:'11px 18px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 14px rgba(232,103,26,0.08)' }}>
          <button className="mt-nav" onClick={() => window.confirm('बाहेर पडायचे? Progress जाईल.') && onBack()}
            style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(13,107,110,0.07)', border:'1px solid rgba(13,107,110,0.14)', borderRadius:10, padding:'7px 12px', color:'#0D6B6E', fontSize:12, fontWeight:800, cursor:'pointer' }}>
            <ArrowLeft size={13} /> Exit
          </button>
          <div style={{ flex:1, background:'rgba(232,103,26,0.1)', borderRadius:99, height:6, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:99, width:`${(done/questions.length)*100}%`, transition:'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize:11, fontWeight:800, color:'#7A9090', whiteSpace:'nowrap' }}>{done}/{questions.length}</span>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:warn?'rgba(220,38,38,0.08)':'rgba(13,107,110,0.07)', border:`1px solid ${warn?'rgba(220,38,38,0.25)':'rgba(13,107,110,0.14)'}`, borderRadius:10, padding:'7px 12px', animation:warn?'mt-glow 1s infinite':'none' }}>
            <Clock size={13} style={{ color:warn?'#DC2626':'#0D6B6E' }} />
            <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:15, color:warn?'#DC2626':'#1C2B2B', animation:warn?'mt-warn 0.7s infinite':'none' }}>{fmt(timeLeft)}</span>
          </div>
          <button onClick={() => window.confirm('सबमिट करायची का?') && finishTest()}
            style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#0D6B6E,#094D50)', border:'none', borderRadius:10, padding:'8px 14px', color:'#fff', fontSize:12, fontWeight:900, cursor:'pointer', boxShadow:'0 4px 12px rgba(13,107,110,0.3)' }}>
            <Send size={12} /> सबमिट
          </button>
        </div>

        <div style={{ maxWidth:1080, margin:'0 auto', padding:'20px 14px 80px', display:'flex', gap:18, flexWrap:'wrap' }}>
          {/* Question panel */}
          <div style={{ flex:1, minWidth:270 }}>
            <div style={{ background:'#fff', border:'1px solid rgba(28,43,43,0.07)', borderRadius:24, padding:'24px 22px', display:'flex', flexDirection:'column', minHeight:460, animation:'mt-fade 0.22s ease', boxShadow:'0 4px 20px rgba(28,43,43,0.07)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <span style={{ background:'rgba(232,103,26,0.1)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:99, padding:'4px 13px', fontSize:10, fontWeight:800, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.08em' }}>{q?.subCategory}</span>
                <span style={{ fontSize:11, fontWeight:700, color:'#7A9090' }}>{currentIdx+1} / {questions.length}</span>
              </div>
              <p style={{ fontWeight:700, fontSize:'clamp(0.95rem,2.5vw,1.1rem)', lineHeight:1.7, color:'#1C2B2B', flex:1, marginBottom:22 }}>
                <span style={{ color:'#E8671A', fontWeight:900 }}>Q.{currentIdx+1} </span>{q?.question}
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                {(q?.options||[]).map((opt:string, i:number) => {
                  const sel = userAnswers[currentIdx] === i;
                  return (
                    <button key={i} className="mt-opt" data-selected={sel?'true':'false'}
                      onClick={() => { const n=[...userAnswers]; n[currentIdx]=i; setUserAnswers(n); }}
                      style={{ display:'flex', alignItems:'center', gap:11, padding:'13px 15px', borderRadius:13, border:`1.5px solid ${sel?'#E8671A':'rgba(28,43,43,0.08)'}`, background:sel?'rgba(232,103,26,0.07)':'#FDF6EC', color:'#1C2B2B', fontWeight:600, fontSize:13, textAlign:'left', cursor:'pointer', transition:'all 0.16s ease', animation:sel?'mt-pop 0.22s ease':'none', boxShadow:sel?'0 4px 14px rgba(232,103,26,0.15)':'none' }}>
                      <span style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:sel?'#E8671A':'#fff', color:sel?'#fff':'#4A6060', border:sel?'none':'1.5px solid rgba(28,43,43,0.1)', transition:'all 0.16s', boxShadow:sel?'0 2px 8px rgba(232,103,26,0.3)':'none' }}>
                        {String.fromCharCode(65+i)}
                      </span>
                      <span style={{ flex:1 }}>{opt}</span>
                      {sel && <CheckCircle2 size={15} style={{ color:'#E8671A', flexShrink:0 }} />}
                    </button>
                  );
                })}
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:22, paddingTop:16, borderTop:'1px solid rgba(28,43,43,0.06)' }}>
                <button disabled={currentIdx===0} className="mt-nav" onClick={() => setCurrentIdx(p=>p-1)}
                  style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(13,107,110,0.06)', border:'1px solid rgba(13,107,110,0.12)', borderRadius:11, padding:'9px 15px', color:'#0D6B6E', fontWeight:800, fontSize:12, cursor:currentIdx===0?'not-allowed':'pointer', opacity:currentIdx===0?.3:1 }}>
                  <ChevronLeft size={14} /> मागे
                </button>
                <button onClick={() => currentIdx===questions.length-1 ? (window.confirm('सबमिट करायची का?')&&finishTest()) : setCurrentIdx(p=>p+1)}
                  style={{ display:'flex', alignItems:'center', gap:7, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:11, padding:'10px 20px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer', boxShadow:'0 5px 16px rgba(232,103,26,0.3)' }}>
                  {currentIdx===questions.length-1 ? <><Send size={13}/> निकाल पहा</> : <>पुढे <ChevronRight size={14}/></>}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ width:220, flexShrink:0 }}>
            <SupportModule title="आम्हाला सपोर्ट करा" />
            <div style={{ background:'#fff', border:'1px solid rgba(28,43,43,0.07)', borderRadius:20, padding:'16px 13px', position:'sticky', top:74, boxShadow:'0 2px 10px rgba(28,43,43,0.06)' }}>
              <div style={{ fontSize:9, fontWeight:800, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12, textAlign:'center' }}>प्रश्नावली · {testType}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:5, maxHeight:'50vh', overflowY:'auto', marginBottom:12 }}>
                {questions.map((_,i) => {
                  const isDone   = userAnswers[i] !== -1;
                  const isActive = i === currentIdx;
                  return (
                    <button key={i} onClick={() => setCurrentIdx(i)}
                      style={{ height:32, borderRadius:8, fontSize:10, fontWeight:800, cursor:'pointer', border:'none', transition:'all 0.14s', background:isActive?'linear-gradient(135deg,#E8671A,#C4510E)':isDone?'rgba(5,150,105,0.12)':'rgba(28,43,43,0.05)', color:isActive?'#fff':isDone?'#059669':'#7A9090', transform:isActive?'scale(1.1)':'none', boxShadow:isActive?'0 4px 10px rgba(232,103,26,0.35)':'none' }}>
                      {i+1}
                    </button>
                  );
                })}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {[{c:'#E8671A',l:'सध्याचा'},{c:'#059669',l:'उत्तर दिले'},{c:'rgba(28,43,43,0.1)',l:'बाकी'}].map(({c,l}) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:9, height:9, borderRadius:3, background:c, flexShrink:0 }} />
                    <span style={{ fontSize:10, fontWeight:700, color:'#7A9090' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SELECTION ────────────────────────────────────────────────────────
  if (status === 'idle') {
    const TYPES = [
      {id:'Rajyaseva',        l:'राज्यसेवा',        s:'100 प्रश्न · 2 तास', emoji:'🏛️', c:'#E8671A'},
      {id:'Combined Group B', l:'Combined Group B', s:'100 प्रश्न · 2 तास', emoji:'📋', c:'#0D6B6E'},
      {id:'Combined Group C', l:'Combined Group C', s:'100 प्रश्न · 2 तास', emoji:'📝', c:'#7C3AED'},
      {id:'Saralseva',        l:'सरळसेवा',          s:'120 प्रश्न · 2 तास', emoji:'⚡', c:'#D97706'},
    ];
    return (
      <div style={{ ...base, padding:'0 0 80px' }}>
        <style>{CSS}</style>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1C2B2B,#0D6B6E)', padding:'18px 24px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 4px 20px rgba(13,107,110,0.3)' }}>
          <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 14px', color:'#FDF6EC', fontWeight:800, fontSize:12, cursor:'pointer' }}>
            <ArrowLeft size={14} /> डॅशबोर्ड
          </button>
          <div>
            <div style={{ fontWeight:900, fontSize:17, color:'#F5C842', letterSpacing:'-0.02em' }}>Full Mock Test</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600, marginTop:1 }}>परीक्षा प्रकार निवडा आणि सुरू करा</div>
          </div>
        </div>

        <div style={{ maxWidth:620, margin:'0 auto', padding:'32px 16px' }}>
          {/* Hero */}
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#E8671A,#F5C842)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 8px 28px rgba(232,103,26,0.35)', fontSize:32 }}>🎯</div>
            <h2 style={{ fontWeight:900, fontSize:'clamp(1.5rem,4vw,2rem)', letterSpacing:'-0.04em', color:'#1C2B2B', margin:'0 0 6px', lineHeight:1.1 }}>सराव परीक्षा निवडा</h2>
            <p style={{ fontSize:13, color:'#7A9090', fontWeight:600 }}>परीक्षा प्रकार निवडा आणि सुरू करा</p>
          </div>

          {/* Type cards */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:22 }}>
            {TYPES.map(({id,l,s,emoji,c}) => {
              const sel = testType === id;
              return (
                <button key={id} className="mt-type" onClick={() => setTestType(id)}
                  style={{ padding:'18px 14px', borderRadius:18, border:`2px solid ${sel?c:'rgba(28,43,43,0.08)'}`, background:sel?`${c}10`:'#fff', textAlign:'left', cursor:'pointer', transition:'all 0.2s ease', position:'relative', boxShadow:sel?`0 6px 20px ${c}25`:'0 2px 8px rgba(28,43,43,0.05)' }}>
                  {sel && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:c, borderRadius:'18px 18px 0 0' }} />}
                  <div style={{ fontSize:28, marginBottom:8 }}>{emoji}</div>
                  <div style={{ fontWeight:900, fontSize:13, color:sel?'#1C2B2B':'#4A6060', marginBottom:3, lineHeight:1.2 }}>{l}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:sel?c:'#7A9090' }}>{s}</div>
                  {sel && <CheckCircle2 size={16} style={{ color:c, position:'absolute', top:12, right:12 }} />}
                </button>
              );
            })}
          </div>

          <SupportModule title="तुम्ही सपोर्ट करू इच्छिता?" />

          <button onClick={startTest} className="mt-start"
            style={{ width:'100%', background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:16, padding:'17px', color:'#fff', fontWeight:900, fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:9, boxShadow:'0 10px 32px rgba(232,103,26,0.35)', letterSpacing:'-0.02em', transition:'all 0.2s ease', fontFamily:"'Baloo 2',sans-serif" }}>
            <Zap size={18} fill="currentColor" /> चाचणी सुरू करा
          </button>
        </div>
      </div>
    );
  }

  // ── LOADING ──────────────────────────────────────────────────────────
  if (status === 'loading') return (
    <div style={{ ...base, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <style>{CSS}</style>
      <div style={{ width:52, height:52, border:'4px solid rgba(232,103,26,0.2)', borderTopColor:'#E8671A', borderRadius:'50%', animation:'mt-spin 0.8s linear infinite' }} />
      <div style={{ fontSize:13, fontWeight:800, color:'#4A6060' }}>प्रश्न तयार होत आहेत...</div>
      <div style={{ fontSize:11, color:'#7A9090', fontWeight:600 }}>{testType}</div>
    </div>
  );

  // ── ERROR ────────────────────────────────────────────────────────────
  if (status === 'error') return (
    <div style={{ ...base, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:32 }}>
      <style>{CSS}</style>
      <AlertCircle size={44} style={{ color:'#DC2626' }} />
      <div style={{ fontWeight:900, fontSize:17, color:'#1C2B2B' }}>डेटा लोड होऊ शकला नाही!</div>
      <button onClick={() => setStatus('idle')} style={{ background:'rgba(232,103,26,0.1)', border:'1px solid rgba(232,103,26,0.25)', borderRadius:11, padding:'9px 22px', color:'#E8671A', fontWeight:800, fontSize:13, cursor:'pointer' }}>
        परत जा
      </button>
    </div>
  );

  return null;
}

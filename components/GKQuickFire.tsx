import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Flame, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }
interface Q { id:number; question:string; options:string[]; correct_answer_index:number; explanation:string; subject:string; }

const TIME_PER_Q = 8; // 8 seconds per question — harder than SpeedDrill

const CSS = `
@keyframes gk-spin{to{transform:rotate(360deg)}}
@keyframes gk-pop{0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes gk-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes gk-correct{0%{background:rgba(5,150,105,0.4)}100%{background:rgba(5,150,105,0)}}
@keyframes gk-wrong{0%{background:rgba(220,38,38,0.4)}100%{background:rgba(220,38,38,0)}}
@keyframes gk-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.97)}}
@keyframes gk-fire{0%,100%{transform:scale(1) rotate(-3deg)}50%{transform:scale(1.1) rotate(3deg)}}
`;

export const GKQuickFire: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]     = useState<'intro'|'quiz'|'result'>('intro');
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx]         = useState(0);
  const [answered, setAnswered] = useState<number|null>(null);
  const [score, setScore]     = useState(0);
  const [combo, setCombo]     = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [loading, setLoading] = useState(false);
  const [bgFlash, setBgFlash] = useState<'correct'|'wrong'|null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const timerRef = useRef<any>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter: 'Rajyaseva', row_limit: 15 });
    setQuestions(data || []); setLoading(false);
  };

  const start = async () => {
    await load();
    setIdx(0); setScore(0); setCombo(0); setMaxCombo(0);
    setAnswered(null); setResults([]); setTimeLeft(TIME_PER_Q);
    setPhase('quiz');
  };

  useEffect(() => {
    if (phase !== 'quiz' || answered !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); autoNext(false); return TIME_PER_Q; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, idx, answered]);

  const autoNext = (correct: boolean) => {
    clearInterval(timerRef.current);
    setAnswered(correct ? -2 : -1); // sentinel
    setBgFlash(correct ? 'correct' : 'wrong');
    const newCombo = correct ? combo + 1 : 0;
    if (correct) setScore(s => s + 1 + (newCombo >= 3 ? 1 : 0));
    setCombo(newCombo);
    setMaxCombo(m => Math.max(m, newCombo));
    setResults(r => [...r, correct]);
    updateProgress(1, correct ? 1 : 0);
    addXP(correct ? (newCombo >= 3 ? 7 : 4) : 1);
    setTimeout(() => {
      setBgFlash(null); setAnswered(null);
      if (idx + 1 >= questions.length) setPhase('result');
      else { setIdx(i => i + 1); setTimeLeft(TIME_PER_Q); }
    }, 600);
  };

  const handle = (i: number) => {
    if (answered !== null) return;
    clearInterval(timerRef.current);
    setAnswered(i);
    autoNext(i === questions[idx]?.correct_answer_index);
  };

  const q   = questions[idx];
  const pct = timeLeft / TIME_PER_Q;
  const timerColor = pct > 0.5 ? '#10B981' : pct > 0.25 ? '#F59E0B' : '#EF4444';
  const acc = results.length > 0 ? Math.round((score / results.length) * 100) : 0;

  // ── INTRO ──
  if (phase === 'intro') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#1A0827)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{CSS}</style>
      <button onClick={onBack} style={{ position:'absolute', top:16, left:16, background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'rgba(255,255,255,0.6)', display:'flex' }}><ArrowLeft size={14}/></button>
      <div style={{ fontSize:72, marginBottom:12, animation:'gk-fire 1.5s ease infinite' }}>🔥</div>
      <h1 style={{ fontWeight:900, fontSize:32, letterSpacing:'-0.04em', marginBottom:8, textAlign:'center', background:'linear-gradient(135deg,#F97316,#EF4444)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>GK Quick Fire</h1>
      <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:600, textAlign:'center', marginBottom:32, lineHeight:1.6 }}>15 questions · 8 seconds each<br/>Combo streak = Extra XP 🔥</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, width:'100%', maxWidth:380, marginBottom:32 }}>
        {[['🎯','15 Questions','Fast format'],['⏱️','8 sec/Q','Harder than Speed Drill'],['🔥','Combo Bonus','+2 XP for 3x streak']].map(([e,t,s])=>(
          <div key={t} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'14px 10px', textAlign:'center' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{e}</div>
            <div style={{ fontWeight:900, fontSize:11, color:'#F97316' }}>{t}</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{s}</div>
          </div>
        ))}
      </div>
      <button onClick={start} disabled={loading} style={{ background:'linear-gradient(135deg,#F97316,#EF4444)', border:'none', borderRadius:18, padding:'18px 56px', color:'#fff', fontWeight:900, fontSize:18, cursor:'pointer', boxShadow:'0 8px 32px rgba(249,115,22,0.4)', display:'flex', alignItems:'center', gap:10 }}>
        {loading ? <div style={{ width:22, height:22, border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'gk-spin 0.8s linear infinite' }}/> : <><Flame size={20} fill="#fff" />आग लावा!</>}
      </button>
    </div>
  );

  // ── RESULT ──
  if (phase === 'result') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#1A0827)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{CSS}</style>
      <div style={{ fontSize:60, marginBottom:12, animation:'gk-pop 0.5s ease' }}>{acc>=80?'🏆':acc>=60?'⭐':'💪'}</div>
      <div style={{ fontWeight:900, fontSize:36, letterSpacing:'-0.05em', marginBottom:4 }}>{score}/{questions.length}</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>{acc}% accuracy</div>
      {maxCombo >= 3 && <div style={{ fontSize:12, fontWeight:800, color:'#F97316', marginBottom:6 }}>🔥 Max Combo: {maxCombo}x</div>}
      <div style={{ fontSize:13, fontWeight:800, color:'#A78BFA', marginBottom:24 }}>+{score*4+questions.length} ⚡ XP!</div>
      {/* Dot grid */}
      <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap', justifyContent:'center', maxWidth:300 }}>
        {results.map((r,i) => <div key={i} style={{ width:30, height:30, borderRadius:9, background:r?'rgba(16,185,129,0.3)':'rgba(220,38,38,0.3)', border:`1px solid ${r?'#10B981':'#EF4444'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>{r?'✓':'✗'}</div>)}
      </div>
      <div style={{ display:'flex', gap:8, width:'100%', maxWidth:380 }}>
        <button onClick={() => { const t=`🔥 MPSC GK Quick Fire!\n\n${score}/${questions.length} · ${acc}%\nMax Combo: ${maxCombo}x 🔥\n\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank'); }}
          style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤 Share</button>
        <button onClick={start} style={{ flex:1, background:'linear-gradient(135deg,#F97316,#EF4444)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🔁 पुन्हा</button>
        <button onClick={onBack} style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:14, padding:'13px', color:'#fff', fontWeight:800, cursor:'pointer' }}>Home</button>
      </div>
    </div>
  );

  // ── QUIZ ──
  return (
    <div style={{ minHeight:'100vh', background:bgFlash?`rgba(${bgFlash==='correct'?'5,150,105':'220,38,38'},0.15)`:'#080C18', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', paddingBottom:40, transition:'background 0.3s' }}>
      <style>{CSS}</style>
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => { clearInterval(timerRef.current); onBack(); }} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'7px 9px', cursor:'pointer', color:'rgba(255,255,255,0.5)', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, background:'rgba(255,255,255,0.08)', borderRadius:99, height:5, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#F97316,#EF4444)', borderRadius:99, width:`${((idx)/questions.length)*100}%`, transition:'width 0.4s' }}/>
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.5)' }}>{idx+1}/{questions.length}</span>
        {combo >= 3 && <div style={{ background:'rgba(249,115,22,0.2)', border:'1px solid rgba(249,115,22,0.4)', borderRadius:99, padding:'4px 10px', fontSize:11, fontWeight:900, color:'#FB923C', animation:'gk-pulse 0.8s ease infinite' }}>🔥{combo}x COMBO!</div>}
        <div style={{ fontWeight:900, fontSize:13, color:'#10B981', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:99, padding:'4px 10px' }}>{score}✓</div>
      </div>

      {/* Timer bar */}
      <div style={{ height:5, background:'rgba(255,255,255,0.08)' }}>
        <div style={{ height:'100%', background:timerColor, width:`${pct*100}%`, transition:'width 1s linear, background 0.5s', borderRadius:'0 3px 3px 0' }}/>
      </div>
      <div style={{ textAlign:'center', fontSize:22, fontWeight:900, color:timerColor, padding:'6px 0 10px', fontVariantNumeric:'tabular-nums', animation:timeLeft<=3?'gk-pulse 0.5s ease infinite':'' }}>
        {timeLeft}s
      </div>

      <div style={{ maxWidth:520, margin:'0 auto', padding:'0 16px' }}>
        {q && (
          <>
            <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'20px 18px', marginBottom:12, animation:'gk-pop 0.25s ease', minHeight:110 }}>
              <div style={{ fontSize:9, fontWeight:800, color:'rgba(249,115,22,0.8)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>{q.subject}</div>
              <p style={{ fontWeight:700, fontSize:'clamp(0.9rem,4vw,1.1rem)', lineHeight:1.7, color:'#fff', margin:0 }}>{q.question}</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
              {q.options?.map((opt, i) => {
                const isSel = answered === i, isAns = i === q.correct_answer_index;
                let bg='rgba(255,255,255,0.05)', border='rgba(255,255,255,0.1)', color='#fff';
                if (answered !== null && isAns)           { bg='rgba(5,150,105,0.25)'; border='rgba(5,150,105,0.5)'; }
                if (answered !== null && isSel && !isAns) { bg='rgba(220,38,38,0.25)'; border='rgba(220,38,38,0.5)'; }
                if (answered !== null && !isSel && !isAns){ color='rgba(255,255,255,0.3)'; }
                return (
                  <button key={i} disabled={answered !== null} onClick={() => handle(i)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'13px 12px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:12, textAlign:'left', cursor:answered!==null?'default':'pointer', transition:'all 0.15s' }}>
                    <span style={{ width:22, height:22, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, background:'rgba(255,255,255,0.08)' }}>
                      {answered!==null&&isAns?'✓':answered!==null&&isSel&&!isAns?'✗':String.fromCharCode(65+i)}
                    </span>
                    <span style={{ flex:1, lineHeight:1.4 }}>{opt}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

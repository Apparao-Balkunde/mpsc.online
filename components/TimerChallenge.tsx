import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Zap, Timer, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }
interface Q { id:number; question:string; options:string[]; correct_answer_index:number; subject:string; }

const DURATIONS = [{ label:'2 मिनिट', sec:120 }, { label:'5 मिनिट', sec:300 }, { label:'10 मिनिट', sec:600 }];

const CSS = `
@keyframes tc-spin{to{transform:rotate(360deg)}}
@keyframes tc-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes tc-pop{0%{transform:scale(0.85)}60%{transform:scale(1.05)}100%{transform:scale(1)}}
@keyframes tc-tick{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
`;

export const TimerChallenge: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]       = useState<'setup'|'playing'|'done'>('setup');
  const [duration, setDuration] = useState(300);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx]           = useState(0);
  const [answered, setAnswered] = useState<number|null>(null);
  const [score, setScore]       = useState(0);
  const [total, setTotal]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading]   = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setPhase('done'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const start = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter:'Rajyaseva', row_limit:50 });
      setQuestions(data || []);
      setIdx(0); setScore(0); setTotal(0); setAnswered(null);
      setTimeLeft(duration);
      setPhase('playing');
    } catch { alert('Questions लोड होऊ शकले नाहीत!'); }
    setLoading(false);
  };

  const handle = (i: number) => {
    if (answered !== null) return;
    setAnswered(i);
    const correct = i === questions[idx]?.correct_answer_index;
    if (correct) setScore(s => s + 1);
    setTotal(t => t + 1);
    updateProgress(1, correct ? 1 : 0);
    addXP(correct ? 3 : 1);
    setTimeout(() => {
      setAnswered(null);
      if (idx + 1 >= questions.length) setPhase('done');
      else setIdx(p => p + 1);
    }, 600);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const pct  = timeLeft / duration;
  const timerColor = pct > 0.5 ? '#10B981' : pct > 0.25 ? '#F59E0B' : '#EF4444';
  const q = questions[idx];

  // ── SETUP ──
  if (phase === 'setup') return (
    <div style={{ minHeight:'100vh', background:'#080C18', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{CSS}</style>
      <button onClick={onBack} style={{ position:'absolute', top:16, left:16, background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={14}/></button>
      <div style={{ fontSize:64, marginBottom:12, animation:'tc-pop 0.5s ease' }}>⏱️</div>
      <h1 style={{ fontWeight:900, fontSize:28, letterSpacing:'-0.04em', marginBottom:8, textAlign:'center', background:'linear-gradient(135deg,#F59E0B,#EF4444)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Timer Challenge</h1>
      <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:600, textAlign:'center', marginBottom:32 }}>वेळ संपण्यापूर्वी जास्तीत जास्त प्रश्न सोडवा!</p>
      <div style={{ width:'100%', maxWidth:380, marginBottom:28 }}>
        <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10, textAlign:'center' }}>वेळ निवडा</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {DURATIONS.map(d => (
            <button key={d.sec} onClick={() => setDuration(d.sec)}
              style={{ padding:'16px 10px', borderRadius:16, border:`2px solid ${duration===d.sec?'#F59E0B':'rgba(255,255,255,0.1)'}`, background:duration===d.sec?'rgba(245,158,11,0.15)':'rgba(255,255,255,0.04)', color:duration===d.sec?'#F5C842':'rgba(255,255,255,0.6)', fontWeight:900, fontSize:13, cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>⏱️</div>
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <button onClick={start} disabled={loading} style={{ background:'linear-gradient(135deg,#F59E0B,#EF4444)', border:'none', borderRadius:18, padding:'18px 56px', color:'#fff', fontWeight:900, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', gap:10, boxShadow:'0 8px 32px rgba(245,158,11,0.4)' }}>
        {loading ? <div style={{ width:22, height:22, border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'tc-spin 0.8s linear infinite' }}/> : <><Zap size={20} fill="#fff"/>सुरू करा</>}
      </button>
    </div>
  );

  // ── DONE ──
  if (phase === 'done') {
    const acc = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div style={{ minHeight:'100vh', background:'#080C18', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <style>{CSS}</style>
        <div style={{ fontSize:60, marginBottom:12, animation:'tc-pop 0.5s ease' }}>{acc >= 80 ? '🏆' : acc >= 60 ? '⭐' : '💪'}</div>
        <div style={{ fontWeight:900, fontSize:36, letterSpacing:'-0.04em', marginBottom:4 }}>{score}/{total}</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:24 }}>प्रश्न सोडवले · {acc}% accuracy</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', maxWidth:360, marginBottom:28 }}>
          {[['🎯','Accuracy',`${acc}%`,'#10B981'],['⚡','XP',`+${score*3+total}`,'#F59E0B'],['⏱️','वेळ',`${duration/60} min`,'#3B82F6'],['✅','बरोबर',score,'#EC4899']].map(([e,l,v,c])=>(
            <div key={String(l)} style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${c}30`, borderRadius:14, padding:'14px', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{e}</div>
              <div style={{ fontWeight:900, fontSize:18, color:c as string }}>{v}</div>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, width:'100%', maxWidth:360 }}>
          <button onClick={() => { const t=`⏱️ MPSC Timer Challenge!\n\n${score}/${total} · ${acc}% accuracy\n${duration/60} मिनिटात!\n\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank'); }}
            style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤 Share</button>
          <button onClick={start} style={{ flex:1, background:'linear-gradient(135deg,#F59E0B,#EF4444)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🔁 पुन्हा</button>
          <button onClick={onBack} style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:14, padding:'13px', color:'#fff', fontWeight:800, cursor:'pointer' }}>Home</button>
        </div>
      </div>
    );
  }

  // ── PLAYING ──
  return (
    <div style={{ minHeight:'100vh', background:'#080C18', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', paddingBottom:40 }}>
      <style>{CSS}</style>
      {/* Header */}
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => { clearInterval(timerRef.current); onBack(); }} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'7px 9px', cursor:'pointer', color:'rgba(255,255,255,0.6)', display:'flex' }}><ArrowLeft size={14}/></button>
        {/* Timer */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <div style={{ fontWeight:900, fontSize:28, color:timerColor, letterSpacing:'-0.04em', animation:timeLeft <= 10 ? 'tc-tick 1s ease infinite' : 'none', fontVariantNumeric:'tabular-nums' }}>
            {mins}:{String(secs).padStart(2,'0')}
          </div>
        </div>
        <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:99, padding:'5px 12px', fontSize:13, fontWeight:900, color:'#34D399' }}>
          {score} ✓
        </div>
      </div>
      {/* Timer bar */}
      <div style={{ height:4, background:'rgba(255,255,255,0.08)', margin:'0 0 8px' }}>
        <div style={{ height:'100%', background:timerColor, width:`${pct*100}%`, transition:'width 1s linear, background 0.5s', borderRadius:'0 2px 2px 0' }}/>
      </div>
      {/* Progress */}
      <div style={{ textAlign:'center', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', marginBottom:12 }}>
        Q.{idx+1} · {total} solved
      </div>

      <div style={{ maxWidth:520, margin:'0 auto', padding:'0 16px' }}>
        {q && (
          <>
            <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'20px 18px', marginBottom:12, animation:'tc-fade 0.2s ease', minHeight:110 }}>
              <div style={{ fontSize:9, fontWeight:800, color:'rgba(245,158,11,0.8)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>{q.subject}</div>
              <p style={{ fontWeight:700, fontSize:'clamp(0.9rem,3.5vw,1.05rem)', lineHeight:1.7, color:'#fff', margin:0 }}>{q.question}</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {q.options?.map((opt, i) => {
                const isSel = answered === i, isAns = i === q.correct_answer_index;
                let bg = 'rgba(255,255,255,0.05)', border = 'rgba(255,255,255,0.1)', color = '#fff';
                if (answered !== null && isAns)           { bg='rgba(5,150,105,0.25)'; border='rgba(5,150,105,0.5)'; }
                if (answered !== null && isSel && !isAns) { bg='rgba(220,38,38,0.25)'; border='rgba(220,38,38,0.5)'; }
                if (answered !== null && !isSel && !isAns){ color='rgba(255,255,255,0.3)'; }
                return (
                  <button key={i} disabled={answered !== null} onClick={() => handle(i)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'12px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:12, textAlign:'left', cursor:answered!==null?'default':'pointer', transition:'all 0.15s' }}>
                    <span style={{ width:22, height:22, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, background:'rgba(255,255,255,0.1)' }}>
                      {answered!==null && isAns ? '✓' : answered!==null && isSel && !isAns ? '✗' : String.fromCharCode(65+i)}
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

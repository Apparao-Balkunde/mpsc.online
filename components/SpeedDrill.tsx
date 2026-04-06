import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Zap, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';

interface Props { onBack: () => void; }
interface Q { id:number; question:string; options:string[]; correct_answer_index:number; subject:string; }

const TIME_PER_Q = 6;
const TOTAL_Q    = 10;

const CSS = `
  @keyframes sd-spin { to{transform:rotate(360deg)} }
  @keyframes sd-pop  { 0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.05)}100%{transform:scale(1);opacity:1} }
  @keyframes sd-shake{ 0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)} }
  @keyframes sd-correct{ 0%{background:rgba(5,150,105,0.3)}100%{background:rgba(5,150,105,0.05)} }
  @keyframes sd-wrong  { 0%{background:rgba(220,38,38,0.4)}100%{background:rgba(220,38,38,0.05)} }
  @keyframes sd-shrink { from{width:100%}to{width:0%} }
`;

export const SpeedDrill: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]   = useState<'intro'|'quiz'|'result'>('intro');
  const [qs, setQs]         = useState<Q[]>([]);
  const [idx, setIdx]       = useState(0);
  const [score, setScore]   = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft]   = useState(TIME_PER_Q);
  const [flash, setFlash]   = useState<'correct'|'wrong'|null>(null);
  const [answered, setAnswered]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [results, setResults]     = useState<boolean[]>([]);
  const timerRef = useRef<any>(null);
  const [combo, setCombo]   = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter:'Rajyaseva', row_limit: TOTAL_Q });
      setQs(data || []);
    } catch {}
    setLoading(false);
  };

  const startDrill = async () => {
    await load();
    setPhase('quiz'); setIdx(0); setScore(0); setStreak(0); setMaxStreak(0);
    setTimeLeft(TIME_PER_Q); setResults([]); setCombo(0); setAnswered(false);
  };

  useEffect(() => {
    if (phase !== 'quiz' || answered) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { autoNext(false); return TIME_PER_Q; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, idx, answered]);

  const autoNext = (correct: boolean) => {
    clearInterval(timerRef.current);
    setAnswered(true);
    setFlash(correct ? 'correct' : 'wrong');
    const newStreak = correct ? streak + 1 : 0;
    const newScore  = correct ? score + 1 + (newStreak >= 3 ? 1 : 0) : score; // bonus for streak
    setStreak(newStreak);
    setMaxStreak(s => Math.max(s, newStreak));
    setScore(newScore);
    setResults(r => [...r, correct]);
    if (correct) setCombo(c => c + 1); else setCombo(0);
    updateProgress(1, correct ? 1 : 0);
    setTimeout(() => {
      setFlash(null); setAnswered(false);
      if (idx + 1 >= TOTAL_Q) { setPhase('result'); }
      else { setIdx(i => i + 1); setTimeLeft(TIME_PER_Q); }
    }, 500);
  };

  const handleAnswer = (i: number) => {
    if (answered) return;
    const correct = i === qs[idx]?.correct_answer_index;
    autoNext(correct);
  };

  const q = qs[idx];
  const timerPct = (timeLeft / TIME_PER_Q) * 100;
  const timerColor = timeLeft > 3 ? '#10B981' : timeLeft > 1 ? '#F59E0B' : '#EF4444';

  if (phase === 'intro') return (
    <div style={{minHeight:'100vh',background:'#080C18',fontFamily:"'Baloo 2',sans-serif",color:'#fff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
      <style>{CSS}</style>
      <button onClick={onBack} style={{position:'absolute',top:16,left:16,background:'rgba(255,255,255,0.08)',border:'none',borderRadius:9,padding:'8px 10px',cursor:'pointer',color:'#fff',display:'flex'}}><ArrowLeft size={14}/></button>
      <div style={{fontSize:72,marginBottom:16,animation:'sd-pop 0.5s ease'}}>⚡</div>
      <h1 style={{fontWeight:900,fontSize:32,letterSpacing:'-0.04em',marginBottom:8,background:'linear-gradient(135deg,#F59E0B,#F97316)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Speed Drill</h1>
      <p style={{fontSize:15,color:'rgba(255,255,255,0.5)',fontWeight:600,textAlign:'center',marginBottom:32,lineHeight:1.6}}>
        10 questions · 6 seconds each<br/>जितक्या जास्त बरोबर तितके जास्त points!
      </p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:32,width:'100%',maxWidth:400}}>
        {[['⏱️','6 sec/Q','Ultra fast'],['🔥','Combo','Streak bonus'],['🏆','Score','Best wins']].map(([e,t,s])=>(
          <div key={t} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'14px 10px',textAlign:'center'}}>
            <div style={{fontSize:24,marginBottom:4}}>{e}</div>
            <div style={{fontWeight:900,fontSize:13,color:'#F59E0B'}}>{t}</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:2}}>{s}</div>
          </div>
        ))}
      </div>
      <button onClick={startDrill} disabled={loading}
        style={{background:'linear-gradient(135deg,#F59E0B,#F97316)',border:'none',borderRadius:18,padding:'18px 56px',color:'#fff',fontWeight:900,fontSize:18,cursor:'pointer',boxShadow:'0 8px 32px rgba(245,158,11,0.4)',display:'flex',alignItems:'center',gap:10}}>
        {loading?<div style={{width:22,height:22,border:'2.5px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'sd-spin 0.8s linear infinite'}}/>:<><Zap size={20} fill="#fff"/>सुरू करा</>}
      </button>
    </div>
  );

  if (phase === 'result') {
    const pct = Math.round((score / TOTAL_Q) * 100);
    return (
      <div style={{minHeight:'100vh',background:'#080C18',fontFamily:"'Baloo 2',sans-serif",color:'#fff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
        <style>{CSS}</style>
        <div style={{fontSize:64,marginBottom:12,animation:'sd-pop 0.5s ease'}}>{score>=9?'👑':score>=7?'🏆':score>=5?'⭐':'💪'}</div>
        <div style={{fontWeight:900,fontSize:48,letterSpacing:'-0.06em',marginBottom:4,color:'#F59E0B'}}>{score}<span style={{fontSize:28,color:'rgba(255,255,255,0.4)'}}>/{TOTAL_Q}</span></div>
        <div style={{fontSize:14,color:'rgba(255,255,255,0.5)',marginBottom:28}}>Speed Drill Complete!</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,width:'100%',maxWidth:360,marginBottom:28}}>
          {[['🎯','Accuracy',`${pct}%`,'#10B981'],['🔥','Max Streak',`${maxStreak}x`,'#F97316'],['⚡','Speed','6 sec/Q','#3B82F6'],['📊','Correct',`${score}/10`,'#8B5CF6']].map(([e,l,v,c])=>(
            <div key={l} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${c}30`,borderRadius:14,padding:'14px',textAlign:'center'}}>
              <div style={{fontSize:22,marginBottom:4}}>{e}</div>
              <div style={{fontWeight:900,fontSize:20,color:c}}>{v}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
        {/* Result dots */}
        <div style={{display:'flex',gap:6,marginBottom:28}}>
          {results.map((r,i)=><div key={i} style={{width:28,height:28,borderRadius:8,background:r?'rgba(16,185,129,0.4)':'rgba(220,38,38,0.4)',border:`1px solid ${r?'#10B981':'#EF4444'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>{r?'✓':'✗'}</div>)}
        </div>
        <div style={{display:'flex',gap:10,width:'100%',maxWidth:360}}>
          <button onClick={startDrill} style={{flex:2,background:'linear-gradient(135deg,#F59E0B,#F97316)',border:'none',borderRadius:14,padding:'14px',color:'#fff',fontWeight:900,fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><Zap size={16} fill="#fff"/>पुन्हा खेळा</button>
          <button onClick={onBack} style={{flex:1,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:14,padding:'14px',color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer'}}>Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:flash?`rgba(${flash==='correct'?'5,150,105':'220,38,38'},0.12)`:'#080C18',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",color:'#fff',paddingBottom:40,transition:'background 0.2s'}}>
      <style>{CSS}</style>
      {/* Header */}
      <div style={{padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>{clearInterval(timerRef.current);onBack();}} style={{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:9,padding:'8px 10px',cursor:'pointer',color:'rgba(255,255,255,0.6)',display:'flex'}}><ArrowLeft size={14}/></button>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:99,height:6,overflow:'hidden'}}>
          <div style={{height:'100%',background:'linear-gradient(90deg,#F59E0B,#F97316)',borderRadius:99,width:`${((idx)/TOTAL_Q)*100}%`,transition:'width 0.3s'}}/>
        </div>
        <span style={{fontSize:13,fontWeight:900,color:'rgba(255,255,255,0.7)',minWidth:40,textAlign:'right'}}>{idx+1}/{TOTAL_Q}</span>
        <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(245,158,11,0.15)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:99,padding:'5px 12px'}}>
          <Zap size={12} style={{color:'#F59E0B'}}/>
          <span style={{fontSize:14,fontWeight:900,color:'#F59E0B'}}>{score}</span>
        </div>
      </div>

      {/* Timer bar */}
      <div style={{height:5,background:'rgba(255,255,255,0.08)',margin:'0 0 4px'}}>
        <div style={{height:'100%',background:timerColor,width:`${timerPct}%`,transition:'width 1s linear, background 0.5s',borderRadius:'0 3px 3px 0'}}/>
      </div>
      <div style={{textAlign:'center',fontSize:11,fontWeight:800,color:timerColor,marginBottom:12,letterSpacing:'0.05em'}}>{timeLeft}s</div>

      {/* Combo streak */}
      {combo >= 2 && (
        <div style={{textAlign:'center',marginBottom:8,animation:'sd-pop 0.3s ease'}}>
          <span style={{background:'linear-gradient(135deg,#F59E0B,#F97316)',borderRadius:99,padding:'4px 16px',fontSize:12,fontWeight:900,color:'#fff'}}>🔥 {combo}x COMBO!</span>
        </div>
      )}

      <div style={{maxWidth:520,margin:'0 auto',padding:'0 16px'}}>
        {/* Question */}
        {q && (
          <div key={idx} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'22px 18px',marginBottom:14,animation:'sd-pop 0.25s ease',minHeight:120}}>
            <div style={{fontSize:10,fontWeight:800,color:'rgba(245,158,11,0.8)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:8}}>Q.{idx+1} · {q.subject}</div>
            <p style={{fontWeight:700,fontSize:'clamp(0.95rem,4vw,1.1rem)',lineHeight:1.7,color:'#fff',margin:0}}>{q.question}</p>
          </div>
        )}

        {/* Options — 2x2 grid for speed */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {q?.options?.map((opt,i)=>{
            const isAns = i === q.correct_answer_index;
            let bg='rgba(255,255,255,0.05)', border='rgba(255,255,255,0.1)', color='#fff';
            if (answered && isAns) { bg='rgba(16,185,129,0.2)'; border='rgba(16,185,129,0.5)'; }
            if (answered && !isAns){ color='rgba(255,255,255,0.3)'; }
            return (
              <button key={i} disabled={answered} onClick={()=>handleAnswer(i)}
                style={{padding:'14px 12px',borderRadius:14,border:`1.5px solid ${border}`,background:bg,color,fontWeight:700,fontSize:12,textAlign:'left',cursor:answered?'default':'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:22,height:22,borderRadius:7,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,background:'rgba(255,255,255,0.1)'}}>{answered&&isAns?'✓':String.fromCharCode(65+i)}</span>
                <span style={{flex:1,lineHeight:1.4}}>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

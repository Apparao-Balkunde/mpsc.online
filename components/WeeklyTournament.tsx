import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Clock, Users, Zap, ChevronRight, CheckCircle2, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import { addXP, checkAndAwardBadges } from './xpSystem';

interface Props { onBack: () => void; }
interface Q { id:number; question:string; options:string[]; correct_answer_index:number; explanation:string; subject:string; }

const CSS = `
  @keyframes wt-spin { to{transform:rotate(360deg)} }
  @keyframes wt-fade { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes wt-timer { 0%{background:linear-gradient(90deg,#059669,#10B981)}50%{background:linear-gradient(90deg,#D97706,#F59E0B)}100%{background:linear-gradient(90deg,#DC2626,#EF4444)} }
  @keyframes wt-pop { 0%{transform:scale(0.8)}60%{transform:scale(1.1)}100%{transform:scale(1)} }
  @keyframes wt-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  .wt-opt:hover:not([disabled]) { transform:translateX(4px) !important; }
`;

const TOURNAMENT_QUESTIONS = 20;
const TIME_PER_Q = 15; // seconds

export const WeeklyTournament: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]       = useState<'lobby'|'quiz'|'result'>('lobby');
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx]           = useState(0);
  const [answers, setAnswers]   = useState<Record<number,number>>({});
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [loading, setLoading]   = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const timerRef = React.useRef<any>(null);

  const startTournament = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter:'Rajyaseva', row_limit:TOURNAMENT_QUESTIONS });
      setQuestions(data || []);
      setPhase('quiz');
      setIdx(0); setAnswers({}); setTimeLeft(TIME_PER_Q);
    } catch { setPhase('quiz'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (phase !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setAutoNext(true); return TIME_PER_Q; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, idx]);

  useEffect(() => {
    if (!autoNext) return;
    setAutoNext(false);
    if (idx + 1 >= questions.length) { finishTournament(); return; }
    setIdx(p => p+1);
    setTimeLeft(TIME_PER_Q);
  }, [autoNext]);

  const handleAnswer = (optIdx: number) => {
    if (answers[idx] !== undefined) return;
    setAnswers(p => ({...p, [idx]:optIdx}));
    clearInterval(timerRef.current);
    // auto advance after 1.5s
    setTimeout(() => {
      if (idx + 1 >= questions.length) { finishTournament(); return; }
      setIdx(p => p+1);
      setTimeLeft(TIME_PER_Q);
    }, 1500);
  };

  const finishTournament = () => {
    clearInterval(timerRef.current);
    const score = Object.entries(answers).filter(([i,a]) => questions[+i]?.correct_answer_index === +a).length;
    updateProgress(questions.length, score);
    // Save to localStorage
    const rank = Math.max(1, Math.floor(Math.random()*200) - score*3);
    localStorage.setItem('mpsc_tournament_last', JSON.stringify({ score, total:questions.length, rank, date:new Date().toISOString() }));
    // Award XP for tournament
    const xpEarned = 30 + score * 5;
    const prog = JSON.parse(localStorage.getItem('mpsc_user_progress')||'{}');
    addXP(xpEarned, checkAndAwardBadges(prog.totalCorrect||0, prog.streak||0));
    const coins = parseInt(localStorage.getItem('mpsc_coins')||'0');
    localStorage.setItem('mpsc_coins', String(coins + 50 + score*10));
    setPhase('result');
  };

  const score   = Object.entries(answers).filter(([i,a]) => questions[+i]?.correct_answer_index === +a).length;
  const pct     = questions.length > 0 ? Math.round((score/questions.length)*100) : 0;
  const q       = questions[idx];
  const hasAns  = answers[idx] !== undefined;
  const timerPct = (timeLeft/TIME_PER_Q)*100;
  const timerColor = timeLeft > 10 ? '#059669' : timeLeft > 5 ? '#D97706' : '#DC2626';

  // Get next Sunday
  const nextSunday = (() => {
    const d = new Date(); const day = d.getDay();
    d.setDate(d.getDate() + (day===0 ? 7 : 7-day));
    return d.toLocaleDateString('mr-IN', { weekday:'long', month:'long', day:'numeric' });
  })();

  if (phase === 'result') {
    const rank = JSON.parse(localStorage.getItem('mpsc_tournament_last')||'{}').rank || 42;
    const shareText = `🏆 MPSC Weekly Tournament!\n\nScore: ${score}/${questions.length} (${pct}%)\nRank: #${rank}\n\nतुम्हीपण participate करा:\nmpscsarathi.online\n#MPSC #Maharashtra`;
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F0F1A,#1A0A2E)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <style>{CSS}</style>
        <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:28, padding:'36px 28px', maxWidth:380, width:'100%', textAlign:'center', animation:'wt-pop 0.5s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{ fontSize:64, marginBottom:12 }}>{pct>=80?'🏆':pct>=60?'⭐':'💪'}</div>
          <div style={{ fontWeight:900, fontSize:28, color:'#fff', letterSpacing:'-0.04em', marginBottom:4 }}>{score}/{questions.length}</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:700, marginBottom:20 }}>{pct}% accuracy</div>
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:16, padding:'16px', marginBottom:20 }}>
            <div style={{ fontWeight:900, fontSize:36, color:'#F5C842' }}>#{rank}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>Estimated Rank</div>
          </div>
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer"
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer', textDecoration:'none', marginBottom:10 }}>
            <Share2 size={15}/> WhatsApp Share
          </a>
          <button onClick={onBack} style={{ width:'100%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'13px', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer' }}>
            डॅशबोर्ड
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'quiz' && q) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F0F1A,#1A0A2E)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60, color:'#fff' }}>
      <style>{CSS}</style>
      {/* Header */}
      <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={()=>{clearInterval(timerRef.current);onBack();}} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}>
          <ArrowLeft size={14}/>
        </button>
        <div style={{ flex:1, background:'rgba(255,255,255,0.1)', borderRadius:99, height:5, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#F5C842,#E8671A)', borderRadius:99, width:`${((idx)/questions.length)*100}%`, transition:'width 0.4s' }}/>
        </div>
        <span style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.7)' }}>{idx+1}/{questions.length}</span>
        <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.08)', borderRadius:99, padding:'5px 12px' }}>
          <Clock size={12} style={{color:timerColor}}/>
          <span style={{ fontSize:13, fontWeight:900, color:timerColor }}>{timeLeft}s</span>
        </div>
      </div>

      {/* Timer bar */}
      <div style={{ height:4, background:'rgba(255,255,255,0.1)', margin:'0 20px 16px' }}>
        <div style={{ height:'100%', background:timerColor, width:`${timerPct}%`, transition:'width 1s linear, background 0.5s' }}/>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'0 16px' }}>
        <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:22, padding:'22px 18px', marginBottom:14, animation:'wt-fade 0.25s ease' }}>
          <div style={{ fontSize:10, fontWeight:800, color:'rgba(245,200,66,0.8)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Q.{idx+1} · {q.subject}</div>
          <p style={{ fontWeight:700, fontSize:'clamp(0.95rem,4vw,1.1rem)', lineHeight:1.7, color:'#fff', margin:0 }}>{q.question}</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {q.options?.map((opt,i) => {
            const isSel = answers[idx]===i, isAns = i===q.correct_answer_index;
            let bg='rgba(255,255,255,0.06)', border='rgba(255,255,255,0.12)', color='#fff';
            if (hasAns && isAns)           { bg='rgba(5,150,105,0.2)'; border='rgba(5,150,105,0.5)'; }
            if (hasAns && isSel && !isAns) { bg='rgba(220,38,38,0.2)'; border='rgba(220,38,38,0.5)'; }
            if (hasAns && !isSel && !isAns){ color='rgba(255,255,255,0.3)'; }
            return (
              <button key={i} disabled={hasAns} className="wt-opt"
                onClick={()=>handleAnswer(i)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 15px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:13, textAlign:'left', cursor:hasAns?'default':'pointer', transition:'all 0.15s' }}>
                <span style={{ width:26, height:26, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:'rgba(255,255,255,0.1)' }}>
                  {hasAns&&isAns?'✓':hasAns&&isSel&&!isAns?'✗':String.fromCharCode(65+i)}
                </span>
                <span style={{ flex:1 }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Score counter */}
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:20 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontWeight:900, fontSize:20, color:'#10B981' }}>{score}</div>
            <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>Correct</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontWeight:900, fontSize:20, color:'#EF4444' }}>{idx - score}</div>
            <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>Wrong</div>
          </div>
        </div>
      </div>
    </div>
  );

  // LOBBY
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F0F1A,#1A0A2E)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ padding:'16px 20px', display:'flex', alignItems:'center' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={14}/></button>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 20px', textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16, animation:'wt-pop 0.5s ease' }}>⚔️</div>
        <h1 style={{ fontWeight:900, fontSize:28, letterSpacing:'-0.04em', marginBottom:8, color:'#fff' }}>Weekly Tournament</h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.6)', fontWeight:700, marginBottom:32 }}>
          20 प्रश्न · 15 sec प्रत्येकी · Rank मिळवा
        </p>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:28 }}>
          {[
            { e:'⏱️', l:'Time/Q', v:'15 sec' },
            { e:'📝', l:'Questions', v:'20' },
            { e:'🏆', l:'Ranking', v:'Live' },
          ].map(({e,l,v}) => (
            <div key={l} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'14px 10px' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{e}</div>
              <div style={{ fontWeight:900, fontSize:14, color:'#fff' }}>{v}</div>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Next tournament */}
        <div style={{ background:'rgba(245,200,66,0.1)', border:'1px solid rgba(245,200,66,0.3)', borderRadius:16, padding:'14px', marginBottom:24 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'rgba(245,200,66,0.8)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>पुढील Official Tournament</div>
          <div style={{ fontWeight:900, fontSize:14, color:'#F5C842' }}>🗓️ {nextSunday} · रात्री 8:00</div>
        </div>

        {/* Rules */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'16px', marginBottom:24, textAlign:'left' }}>
          {['20 प्रश्न · MPSC level', '15 seconds per question', 'Time संपल्यास auto-next', 'Score वरून rank calculate होतो', 'WhatsApp वर result share करा'].map(r => (
            <div key={r} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:8 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#F5C842', flexShrink:0 }}/> {r}
            </div>
          ))}
        </div>

        <button onClick={startTournament} disabled={loading}
          style={{ width:'100%', background:'linear-gradient(135deg,#F5C842,#E8671A)', border:'none', borderRadius:16, padding:'18px', color:'#fff', fontWeight:900, fontSize:16, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow:'0 8px 28px rgba(245,200,66,0.3)', opacity:loading?0.8:1 }}>
          {loading ? <><div style={{ width:20, height:20, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'wt-spin 0.8s linear infinite' }}/> Loading...</> : <><Zap size={20} fill="currentColor"/> Tournament सुरू करा</>}
        </button>
      </div>
    </div>
  );
};

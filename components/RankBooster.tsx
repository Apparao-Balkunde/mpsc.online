import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Target, ChevronRight, Zap, BarChart2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }
interface Q { id:number; question:string; options:string[]; correct_answer_index:number; explanation:string; subject:string; difficulty?:string; }

const SESSIONS = [
  { label:'Quick Boost',  emoji:'⚡', qs:10, time:'5 min',  color:'#F59E0B', desc:'Daily rank boost — fast 10 questions' },
  { label:'Power Hour',   emoji:'💪', qs:25, time:'15 min', color:'#E8671A', desc:'25 mixed questions — serious prep' },
  { label:'Rank Push',    emoji:'🚀', qs:50, time:'30 min', color:'#DC2626', desc:'50 questions — mock test feel' },
];

const RANK_TABLE = [
  { score:[90,100], rank:'Top 100',  badge:'🥇', color:'#F5C842' },
  { score:[75,89],  rank:'Top 500',  badge:'🥈', color:'#C0C0C0' },
  { score:[60,74],  rank:'Top 2000', badge:'🥉', color:'#CD7F32' },
  { score:[45,59],  rank:'Top 5000', badge:'📊', color:'#7C3AED' },
  { score:[0,44],   rank:'Top 10000',badge:'📚', color:'#2563EB' },
];

const CSS = `
@keyframes rb-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes rb-pop{0%{transform:scale(0.85)}60%{transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes rb-bar{from{width:0}to{width:var(--w)}}
@keyframes rb-spin{to{transform:rotate(360deg)}}
`;

export const RankBooster: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]     = useState<'pick'|'quiz'|'result'>('pick');
  const [session, setSession] = useState<typeof SESSIONS[0]|null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx]         = useState(0);
  const [answered, setAnswered] = useState<number|null>(null);
  const [score, setScore]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak]   = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);

  const start = async (sess: typeof SESSIONS[0]) => {
    setLoading(true); setSession(sess);
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter:'Rajyaseva', row_limit: sess.qs });
      setQuestions(data || []);
    } catch { alert('Questions लोड होऊ शकले नाहीत!'); setLoading(false); return; }
    setIdx(0); setAnswered(null); setScore(0); setStreak(0); setMaxStreak(0);
    setStartTime(Date.now()); setPhase('quiz');
    setLoading(false);
  };

  const handle = (i: number) => {
    if (answered !== null) return;
    setAnswered(i);
    const correct = i === questions[idx]?.correct_answer_index;
    if (correct) {
      setScore(s => s+1);
      const ns = streak + 1;
      setStreak(ns);
      setMaxStreak(m => Math.max(m, ns));
    } else setStreak(0);
    updateProgress(1, correct ? 1 : 0);
    addXP(correct ? (streak >= 3 ? 7 : 5) : 1); // combo bonus
    setTimeout(() => {
      setAnswered(null);
      if (idx + 1 >= questions.length) {
        setTimeTaken(Math.round((Date.now() - startTime) / 1000));
        setPhase('result');
      } else setIdx(p => p+1);
    }, 700);
  };

  const acc  = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const rank = RANK_TABLE.find(r => acc >= r.score[0] && acc <= r.score[1]) || RANK_TABLE[4];
  const q    = questions[idx];

  // Save history
  useEffect(() => {
    if (phase === 'result' && session) {
      try {
        const hist = JSON.parse(localStorage.getItem('mpsc_rank_history') || '[]');
        hist.unshift({ date: new Date().toLocaleDateString('mr-IN'), score, total: questions.length, acc, session: session.label, rank: rank.rank });
        localStorage.setItem('mpsc_rank_history', JSON.stringify(hist.slice(0, 30)));
      } catch {}
    }
  }, [phase]);

  // ── PICK ──
  if (phase === 'pick') {
    const hist = (() => { try { return JSON.parse(localStorage.getItem('mpsc_rank_history') || '[]'); } catch { return []; } })();
    return (
      <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
        <style>{CSS}</style>
        <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
          <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
            <TrendingUp size={16} style={{color:'#E8671A'}}/> Rank Booster
          </div>
        </div>
        <div style={{ maxWidth:520, margin:'0 auto', padding:'20px 16px' }}>
          {/* Last session result */}
          {hist.length > 0 && (
            <div style={{ background:'linear-gradient(135deg,#1E3A5F,#1E40AF)', borderRadius:18, padding:'16px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ fontSize:28 }}>📊</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>शेवटचा score</div>
                <div style={{ fontWeight:900, fontSize:16, color:'#fff' }}>{hist[0].score}/{hist[0].total} · {hist[0].acc}% · {hist[0].rank}</div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)' }}>{hist[0].date}</div>
            </div>
          )}
          <div style={{ fontWeight:700, fontSize:13, color:'#7A9090', marginBottom:14, textAlign:'center' }}>Session निवडा</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
            {SESSIONS.map(sess => (
              <button key={sess.label} onClick={() => start(sess)} disabled={loading}
                style={{ background:'#fff', border:`2px solid ${sess.color}20`, borderRadius:20, padding:'18px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, boxShadow:`0 3px 14px ${sess.color}10`, textAlign:'left', animation:'rb-fade 0.3s ease' }}>
                <div style={{ width:52, height:52, borderRadius:14, background:`${sess.color}15`, border:`2px solid ${sess.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>
                  {loading && session?.label === sess.label
                    ? <div style={{ width:22, height:22, border:`3px solid ${sess.color}40`, borderTopColor:sess.color, borderRadius:'50%', animation:'rb-spin 0.8s linear infinite' }}/>
                    : sess.emoji}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:2 }}>{sess.label}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#7A9090' }}>{sess.desc}</div>
                  <div style={{ display:'flex', gap:8, marginTop:6 }}>
                    <span style={{ fontSize:10, fontWeight:800, color:sess.color, background:`${sess.color}12`, borderRadius:99, padding:'2px 8px' }}>{sess.qs}Q</span>
                    <span style={{ fontSize:10, fontWeight:800, color:'#7A9090', background:'rgba(0,0,0,0.05)', borderRadius:99, padding:'2px 8px' }}>~{sess.time}</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color:'#D1D5DB' }}/>
              </button>
            ))}
          </div>
          {/* Rank reference */}
          <div style={{ background:'#fff', borderRadius:18, padding:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}><BarChart2 size={13}/>Expected Rank (Prelims)</div>
            {RANK_TABLE.map(r => (
              <div key={r.rank} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize:18 }}>{r.badge}</span>
                <div style={{ flex:1, background:'rgba(0,0,0,0.04)', borderRadius:99, height:6, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:r.color, borderRadius:99, width:`${r.score[1]}%` }}/>
                </div>
                <div style={{ fontWeight:800, fontSize:11, color:'#1C2B2B', minWidth:70, textAlign:'right' }}>{r.score[0]}-{r.score[1]}% → {r.rank}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const mins = Math.floor(timeTaken/60), secs = timeTaken%60;
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#1A0A2E)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', paddingBottom:40 }}>
        <style>{CSS}</style>
        <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => setPhase('pick')} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={14}/></button>
          <span style={{ fontWeight:900, fontSize:15 }}>🚀 Result</span>
        </div>
        <div style={{ maxWidth:440, margin:'0 auto', padding:'10px 20px 20px' }}>
          {/* Main score */}
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <div style={{ fontSize:64, marginBottom:8, animation:'rb-pop 0.5s ease' }}>{rank.badge}</div>
            <div style={{ fontWeight:900, fontSize:40, letterSpacing:'-0.05em', marginBottom:4 }}>{score}/{questions.length}</div>
            <div style={{ fontSize:18, fontWeight:900, color:rank.color }}>{rank.rank}</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:4 }}>{acc}% accuracy · {mins}m {secs}s</div>
          </div>
          {/* Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
            {[['🎯','Accuracy',`${acc}%`,rank.color],['🔥','Max Combo',`${maxStreak}x`,'#F97316'],['⚡','XP',`+${score*5+questions.length}`,'#A78BFA']].map(([e,l,v,c])=>(
              <div key={String(l)} style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${c}30`, borderRadius:14, padding:'13px 8px', textAlign:'center' }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{e}</div>
                <div style={{ fontWeight:900, fontSize:16, color:c as string }}>{v}</div>
                <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.35)', textTransform:'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
          {/* Rank bar */}
          <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:16, padding:'16px', marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Rank Estimate</div>
            <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:99, height:10, overflow:'hidden', marginBottom:8 }}>
              <div style={{ height:'100%', background:`linear-gradient(90deg,${rank.color},${rank.color}80)`, borderRadius:99, width:`${acc}%`, transition:'width 1s ease' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700 }}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          {/* Buttons */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { const t=`🚀 MPSC Rank Booster!\n\n${score}/${questions.length} · ${acc}%\nEstimated: ${rank.rank}\n\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank'); }}
              style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤</button>
            <button onClick={() => start(session!)}
              style={{ flex:1, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🔁</button>
            <button onClick={() => setPhase('pick')}
              style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:14, padding:'13px', color:'#fff', fontWeight:800, cursor:'pointer' }}>Home</button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ ──
  return (
    <div style={{ minHeight:'100vh', background:'#080C18', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', paddingBottom:40 }}>
      <style>{CSS}</style>
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => { if (confirm('Quiz quit करायचे?')) { setPhase('pick'); } }} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'7px 9px', cursor:'pointer', color:'rgba(255,255,255,0.6)', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, background:'rgba(255,255,255,0.1)', borderRadius:99, height:5, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:99, width:`${((idx)/questions.length)*100}%`, transition:'width 0.4s' }}/>
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.5)' }}>{idx+1}/{questions.length}</span>
        {streak >= 3 && <div style={{ background:'rgba(249,115,22,0.2)', border:'1px solid rgba(249,115,22,0.4)', borderRadius:99, padding:'4px 10px', fontSize:11, fontWeight:900, color:'#FB923C' }}>🔥{streak}x</div>}
        <div style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:99, padding:'4px 10px', fontSize:12, fontWeight:900, color:'#34D399' }}>{score}✓</div>
      </div>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'8px 16px' }}>
        {q && (
          <>
            <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'20px 18px', marginBottom:12, animation:'rb-fade 0.25s ease', minHeight:120 }}>
              <div style={{ fontSize:9, fontWeight:800, color:'rgba(245,158,11,0.8)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>
                {q.subject} {q.difficulty ? `· ${q.difficulty}` : ''}
              </div>
              <p style={{ fontWeight:700, fontSize:'clamp(0.9rem,3.5vw,1.05rem)', lineHeight:1.75, color:'#fff', margin:0 }}>{q.question}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {q.options?.map((opt, i) => {
                const isSel = answered === i, isAns = i === q.correct_answer_index;
                let bg='rgba(255,255,255,0.05)', border='rgba(255,255,255,0.1)', color='#fff';
                if (answered!==null&&isAns)           { bg='rgba(5,150,105,0.2)'; border='rgba(5,150,105,0.5)'; }
                if (answered!==null&&isSel&&!isAns)   { bg='rgba(220,38,38,0.2)'; border='rgba(220,38,38,0.5)'; }
                if (answered!==null&&!isSel&&!isAns)  { color='rgba(255,255,255,0.3)'; }
                return (
                  <button key={i} disabled={answered!==null} onClick={() => handle(i)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 15px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:13, textAlign:'left', cursor:answered!==null?'default':'pointer', transition:'all 0.15s' }}>
                    <span style={{ width:26, height:26, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, background:'rgba(255,255,255,0.08)' }}>
                      {answered!==null&&isAns?'✓':answered!==null&&isSel&&!isAns?'✗':String.fromCharCode(65+i)}
                    </span>
                    <span style={{ flex:1 }}>{opt}</span>
                  </button>
                );
              })}
            </div>
            {answered!==null&&q.explanation&&(
              <div style={{ background:'rgba(232,103,26,0.08)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:14, padding:'11px 14px', marginTop:10, fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', lineHeight:1.65 }}>
                💡 {q.explanation}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

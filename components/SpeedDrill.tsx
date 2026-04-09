import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Zap, TrendingUp, Target, Brain } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import { addXP, checkAndAwardBadges } from './xpSystem';

interface Props { onBack: () => void; }
interface Q { id:number; question:string; options:string[]; correct_answer_index:number; subject:string; }

// ✨ ADAPTIVE: difficulty levels
const DIFFICULTY_CONFIG = {
  easy:   { timePerQ:9,  label:'Easy',   emoji:'🟢', color:'#10B981', description:'9 sec — शिकणाऱ्यांसाठी' },
  medium: { timePerQ:6,  label:'Medium', emoji:'🟡', color:'#F59E0B', description:'6 sec — standard' },
  hard:   { timePerQ:4,  label:'Hard',   emoji:'🔴', color:'#EF4444', description:'4 sec — MPSC टोपर' },
  adaptive:{ timePerQ:6, label:'Adaptive', emoji:'🤖', color:'#8B5CF6', description:'AI तुमच्यानुसार adjust करतो' },
};

const PERF_KEY  = 'mpsc_speeddrill_perf';
const TOTAL_Q   = 10;

function loadPerf(): Record<string,{attempted:number;correct:number;avgTime:number}> {
  try { return JSON.parse(localStorage.getItem(PERF_KEY) || '{}'); } catch { return {}; }
}
function savePerf(data: Record<string,{attempted:number;correct:number;avgTime:number}>) {
  try { localStorage.setItem(PERF_KEY, JSON.stringify(data)); } catch {}
}

// ✨ ADAPTIVE: Suggest difficulty based on past performance
function getSuggestedDifficulty(): 'easy'|'medium'|'hard' {
  const perf = loadPerf();
  const total = Object.values(perf).reduce((a,b) => ({ attempted:a.attempted+b.attempted, correct:a.correct+b.correct, avgTime:0 }), { attempted:0, correct:0, avgTime:0 });
  if (total.attempted < 10) return 'medium';
  const accuracy = total.correct / total.attempted;
  if (accuracy > 0.8) return 'hard';
  if (accuracy < 0.5) return 'easy';
  return 'medium';
}

const CSS = `
  @keyframes sd-spin    { to{transform:rotate(360deg)} }
  @keyframes sd-pop     { 0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.05)}100%{transform:scale(1);opacity:1} }
  @keyframes sd-shake   { 0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)} }
  @keyframes sd-correct { 0%{background:rgba(5,150,105,0.3)}100%{background:rgba(5,150,105,0.05)} }
  @keyframes sd-wrong   { 0%{background:rgba(220,38,38,0.4)}100%{background:rgba(220,38,38,0.05)} }
  @keyframes sd-shrink  { from{width:100%}to{width:0%} }
  @keyframes sd-fade    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sd-pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
`;

export const SpeedDrill: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]       = useState<'intro'|'quiz'|'result'>('intro');
  const [qs, setQs]             = useState<Q[]>([]);
  const [idx, setIdx]           = useState(0);
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(6);
  const [flash, setFlash]       = useState<'correct'|'wrong'|null>(null);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [results, setResults]   = useState<boolean[]>([]);
  const [combo, setCombo]       = useState(0);
  const [difficulty, setDifficulty] = useState<keyof typeof DIFFICULTY_CONFIG>('adaptive');
  const [currentTimePerQ, setCurrentTimePerQ] = useState(6);
  const [subjectPerf, setSubjectPerf] = useState<Record<string,{correct:number;total:number}>>({});
  const [qStartTime, setQStartTime] = useState<number>(0);
  const timerRef = useRef<any>(null);
  const suggested = getSuggestedDifficulty();

  const load = async (diff: keyof typeof DIFFICULTY_CONFIG) => {
    setLoading(true);
    const perf = loadPerf();
    try {
      let data: Q[] = [];
      // ✨ ADAPTIVE: weak subjects मधून जास्त questions
      if (diff === 'adaptive' && Object.keys(perf).length > 0) {
        const weakSubject = Object.entries(perf)
          .filter(([,d]) => d.attempted >= 3)
          .sort(([,a],[,b]) => (a.correct/a.attempted) - (b.correct/b.attempted))[0]?.[0];
        
        if (weakSubject) {
          const { data: weakQs } = await supabase.from('prelims_questions').select('*').eq('subject', weakSubject).limit(4).order('RANDOM()' as any);
          const { data: normalQs } = await supabase.rpc('get_random_mock_questions', { exam_filter:'Rajyaseva', row_limit: 6 });
          if (weakQs && weakQs.length >= 3) {
            data = [...weakQs.slice(0,4), ...(normalQs||[]).slice(0,6)];
          }
        }
      }
      
      if (data.length < TOTAL_Q) {
        const { data: qs } = await supabase.rpc('get_random_mock_questions', { exam_filter:'Rajyaseva', row_limit: TOTAL_Q });
        data = qs || [];
      }
      setQs(data);
    } catch {}
    setLoading(false);
  };

  const startDrill = async (diff: keyof typeof DIFFICULTY_CONFIG) => {
    setDifficulty(diff);
    const tpq = diff === 'adaptive' ? 6 : DIFFICULTY_CONFIG[diff].timePerQ;
    setCurrentTimePerQ(tpq);
    await load(diff);
    setPhase('quiz'); setIdx(0); setScore(0); setStreak(0); setMaxStreak(0);
    setTimeLeft(tpq); setResults([]); setCombo(0); setAnswered(false);
    setQStartTime(Date.now());
  };

  // ✨ ADAPTIVE: adjust time mid-session based on accuracy
  useEffect(() => {
    if (difficulty === 'adaptive' && results.length >= 3) {
      const recent = results.slice(-3);
      const recentAcc = recent.filter(Boolean).length / 3;
      if (recentAcc >= 1.0 && currentTimePerQ > 4) {
        setCurrentTimePerQ(t => Math.max(4, t - 1)); // faster
      } else if (recentAcc <= 0.33 && currentTimePerQ < 9) {
        setCurrentTimePerQ(t => Math.min(9, t + 1)); // slower
      }
    }
  }, [results]);

  useEffect(() => {
    if (phase !== 'quiz' || answered) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { autoNext(false); return currentTimePerQ; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, idx, answered, currentTimePerQ]);

  const autoNext = (correct: boolean) => {
    clearInterval(timerRef.current);
    setAnswered(true);
    setFlash(correct ? 'correct' : 'wrong');
    const timeTaken = (Date.now() - qStartTime) / 1000;
    
    const newStreak = correct ? streak + 1 : 0;
    const comboBonus = newStreak >= 3 ? 1 : 0;
    const newScore = correct ? score + 1 + comboBonus : score;
    setStreak(newStreak);
    setMaxStreak(s => Math.max(s, newStreak));
    setScore(newScore);
    setResults(r => [...r, correct]);
    if (correct) setCombo(c => c+1); else setCombo(0);
    updateProgress(1, correct ? 1 : 0);
    
    // ✨ Track subject performance
    const q = qs[idx];
    if (q?.subject) {
      setSubjectPerf(prev => {
        const s = prev[q.subject] || { correct:0, total:0 };
        return { ...prev, [q.subject]: { correct: s.correct + (correct?1:0), total: s.total+1 } };
      });
      const perf = loadPerf();
      if (!perf[q.subject]) perf[q.subject] = { attempted:0, correct:0, avgTime:0 };
      perf[q.subject].attempted += 1;
      if (correct) perf[q.subject].correct += 1;
      perf[q.subject].avgTime = (perf[q.subject].avgTime + timeTaken) / 2;
      savePerf(perf);
    }
    
    setTimeout(() => {
      setFlash(null); setAnswered(false);
      if (idx+1 >= TOTAL_Q) { setPhase('result'); }
      else { setIdx(i => i+1); setTimeLeft(currentTimePerQ); setQStartTime(Date.now()); }
    }, 500);
  };

  const handleAnswer = (i: number) => {
    if (answered) return;
    autoNext(i === qs[idx]?.correct_answer_index);
  };

  const q = qs[idx];
  const timerPct = (timeLeft / currentTimePerQ) * 100;
  const timerColor = timeLeft > (currentTimePerQ*0.5) ? '#10B981' : timeLeft > 2 ? '#F59E0B' : '#EF4444';
  const diffConfig = DIFFICULTY_CONFIG[difficulty];

  if (phase === 'intro') return (
    <div style={{ minHeight:'100vh', background:'#080C18', fontFamily:"'Baloo 2',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{CSS}</style>
      <button onClick={onBack} style={{ position:'absolute', top:16, left:16, background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={14}/></button>
      <div style={{ fontSize:64, marginBottom:12, animation:'sd-pop 0.5s ease' }}>⚡</div>
      <h1 style={{ fontWeight:900, fontSize:28, letterSpacing:'-0.04em', marginBottom:6, background:'linear-gradient(135deg,#F59E0B,#F97316)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Speed Drill</h1>
      <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontWeight:600, textAlign:'center', marginBottom:24, lineHeight:1.6 }}>10 questions · Timer · Adaptive AI</p>

      {/* ✨ UNIQUE: Difficulty selector with AI suggestion */}
      <div style={{ width:'100%', maxWidth:380, marginBottom:24 }}>
        <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10, textAlign:'center' }}>Difficulty निवडा</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {(Object.entries(DIFFICULTY_CONFIG) as [keyof typeof DIFFICULTY_CONFIG, typeof DIFFICULTY_CONFIG[keyof typeof DIFFICULTY_CONFIG]][]).map(([key, cfg]) => (
            <button key={key} onClick={() => startDrill(key)} disabled={loading}
              style={{ background:'rgba(255,255,255,0.05)', border:`1.5px solid ${difficulty===key ? cfg.color+'80' : 'rgba(255,255,255,0.08)'}`, borderRadius:16, padding:'14px 12px', textAlign:'left', cursor:'pointer', position:'relative', transition:'all 0.15s' }}>
              {key === 'adaptive' && <div style={{ position:'absolute', top:6, right:8, fontSize:8, fontWeight:800, color:'#8B5CF6', background:'rgba(139,92,246,0.15)', borderRadius:6, padding:'1px 6px' }}>AI</div>}
              {key === suggested && key !== 'adaptive' && <div style={{ position:'absolute', top:6, right:8, fontSize:8, fontWeight:800, color:'#F59E0B', background:'rgba(245,158,11,0.15)', borderRadius:6, padding:'1px 6px' }}>Suggested</div>}
              <div style={{ fontSize:20, marginBottom:6 }}>{cfg.emoji}</div>
              <div style={{ fontWeight:900, fontSize:13, color:cfg.color, marginBottom:2 }}>{cfg.label}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:600 }}>{cfg.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ✨ Past performance summary */}
      {Object.keys(loadPerf()).length > 0 && (() => {
        const perf = loadPerf();
        const total = Object.values(perf).reduce((a,b) => ({ attempted:a.attempted+b.attempted, correct:a.correct+b.correct, avgTime:0 }), {attempted:0,correct:0,avgTime:0});
        const weakest = Object.entries(perf).filter(([,d])=>d.attempted>=3).sort(([,a],[,b])=>(a.correct/a.attempted)-(b.correct/b.attempted))[0];
        return (
          <div style={{ width:'100%', maxWidth:380, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>📊 तुमची Past Performance</div>
            <div style={{ display:'flex', gap:16 }}>
              <div><div style={{ fontWeight:900, fontSize:20, color:'#F59E0B' }}>{total.attempted}</div><div style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>Total Q</div></div>
              <div><div style={{ fontWeight:900, fontSize:20, color:'#10B981' }}>{total.attempted>0?Math.round((total.correct/total.attempted)*100):0}%</div><div style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>Accuracy</div></div>
              {weakest && <div style={{ flex:1 }}><div style={{ fontWeight:800, fontSize:11, color:'#EF4444' }}>🎯 Focus: {weakest[0]}</div><div style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>Weakest subject</div></div>}
            </div>
          </div>
        );
      })()}

      {loading && <div style={{ marginTop:20, display:'flex', alignItems:'center', gap:10, color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:700 }}>
        <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'#F59E0B', borderRadius:'50%', animation:'sd-spin 0.8s linear infinite' }}/>
        {difficulty === 'adaptive' ? 'Weak topics detect करत आहे...' : 'Questions load होत आहेत...'}
      </div>}
    </div>
  );

  if (phase === 'result') {
    const pct = Math.round((score / TOTAL_Q) * 100);
    const weakInSession = Object.entries(subjectPerf)
      .filter(([,d]) => d.total >= 2 && (d.correct/d.total) < 0.5)
      .map(([s]) => s);

    return (
      <div style={{ minHeight:'100vh', background:'#080C18', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <style>{CSS}</style>
        <div style={{ fontSize:56, marginBottom:10, animation:'sd-pop 0.5s ease' }}>{score>=9?'👑':score>=7?'🏆':score>=5?'⭐':'💪'}</div>
        <div style={{ fontWeight:900, fontSize:44, letterSpacing:'-0.06em', marginBottom:4, color:'#F59E0B' }}>{score}<span style={{ fontSize:24, color:'rgba(255,255,255,0.4)' }}>/{TOTAL_Q}</span></div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Speed Drill Complete! · {diffConfig.label}</div>
        
        {/* Adaptive time indicator */}
        {difficulty === 'adaptive' && currentTimePerQ !== 6 && (
          <div style={{ fontSize:11, fontWeight:700, color: currentTimePerQ < 6 ? '#10B981' : '#F59E0B', background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'4px 12px', marginBottom:16 }}>
            {currentTimePerQ < 6 ? `⚡ AI ने difficulty वाढवली! (${currentTimePerQ}s)` : `🤖 AI ने difficulty कमी केली (${currentTimePerQ}s)`}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', maxWidth:360, marginBottom:16 }}>
          {[['🎯','Accuracy',`${pct}%`,'#10B981'],['🔥','Max Streak',`${maxStreak}x`,'#F97316'],['⚡','Time/Q',`${currentTimePerQ}s`,'#3B82F6'],['📊','Correct',`${score}/10`,'#8B5CF6']].map(([e,l,v,c])=>(
            <div key={l as string} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${c as string}30`, borderRadius:14, padding:'14px', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{e as string}</div>
              <div style={{ fontWeight:900, fontSize:20, color:c as string }}>{v as string}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginTop:2 }}>{l as string}</div>
            </div>
          ))}
        </div>

        {/* Result dots */}
        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          {results.map((r,i)=><div key={i} style={{ width:28, height:28, borderRadius:8, background:r?'rgba(16,185,129,0.4)':'rgba(220,38,38,0.4)', border:`1px solid ${r?'#10B981':'#EF4444'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>{r?'✓':'✗'}</div>)}
        </div>

        {/* ✨ UNIQUE: Subject analysis */}
        {Object.keys(subjectPerf).length > 0 && (
          <div style={{ width:'100%', maxWidth:360, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'14px', marginBottom:16 }}>
            <div style={{ fontWeight:800, fontSize:11, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>📊 Subject Analysis</div>
            {Object.entries(subjectPerf).map(([subj, d]) => {
              const acc = Math.round((d.correct/d.total)*100);
              return (
                <div key={subj} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ flex:1, fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>{subj}</span>
                  <span style={{ fontSize:11, fontWeight:900, color: acc>=70?'#10B981':acc>=50?'#F59E0B':'#EF4444' }}>{acc}%</span>
                  <div style={{ width:80, height:4, background:'rgba(255,255,255,0.1)', borderRadius:2 }}>
                    <div style={{ height:'100%', width:`${acc}%`, background: acc>=70?'#10B981':acc>=50?'#F59E0B':'#EF4444', borderRadius:2 }}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {weakInSession.length > 0 && (
          <div style={{ width:'100%', maxWidth:360, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:14, padding:'12px 14px', marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#FCA5A5' }}>⚠️ Focus subjects: {weakInSession.join(', ')}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:3 }}>उद्याच्या Adaptive session मध्ये हे automatically येतील</div>
          </div>
        )}

        <div style={{ display:'flex', gap:8, width:'100%', maxWidth:360, flexWrap:'wrap' }}>
          <button onClick={()=>{ const txt=`⚡ MPSC Speed Drill!\n\n${score}/${qs.length} · ${pct}% accuracy\nMax Combo: ${maxStreak}x 🔥\n\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank'); }}
            style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer' }}>📤 Share</button>
          <button onClick={() => startDrill(difficulty)}
            style={{ flex:2, background:'linear-gradient(135deg,#F59E0B,#F97316)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><Zap size={16} fill="#fff"/>पुन्हा</button>
          <button onClick={onBack} style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:14, padding:'12px', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer' }}>Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:flash?`rgba(${flash==='correct'?'5,150,105':'220,38,38'},0.12)`:'#080C18', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', paddingBottom:40, transition:'background 0.2s' }}>
      <style>{CSS}</style>
      <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={()=>{clearInterval(timerRef.current);onBack();}} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'rgba(255,255,255,0.6)', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, background:'rgba(255,255,255,0.08)', borderRadius:99, height:6, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#F59E0B,#F97316)', borderRadius:99, width:`${(idx/TOTAL_Q)*100}%`, transition:'width 0.3s' }}/>
        </div>
        <span style={{ fontSize:12, fontWeight:900, color:'rgba(255,255,255,0.7)', minWidth:36, textAlign:'right' }}>{idx+1}/{TOTAL_Q}</span>
        <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:99, padding:'4px 10px' }}>
          <Zap size={11} style={{ color:'#F59E0B' }}/><span style={{ fontSize:13, fontWeight:900, color:'#F59E0B' }}>{score}</span>
        </div>
        {/* ✨ Adaptive time indicator */}
        {difficulty === 'adaptive' && (
          <div style={{ fontSize:10, fontWeight:800, color: diffConfig.color, background:`${diffConfig.color}15`, borderRadius:8, padding:'3px 8px' }}>
            🤖 {currentTimePerQ}s
          </div>
        )}
      </div>

      <div style={{ height:5, background:'rgba(255,255,255,0.08)', margin:'0 0 4px' }}>
        <div style={{ height:'100%', background:timerColor, width:`${timerPct}%`, transition:'width 1s linear, background 0.5s', borderRadius:'0 3px 3px 0' }}/>
      </div>
      <div style={{ textAlign:'center', fontSize:11, fontWeight:800, color:timerColor, marginBottom:12, letterSpacing:'0.05em' }}>{timeLeft}s</div>

      {combo >= 2 && <div style={{ textAlign:'center', marginBottom:8, animation:'sd-pop 0.3s ease' }}><span style={{ background:'linear-gradient(135deg,#F59E0B,#F97316)', borderRadius:99, padding:'4px 16px', fontSize:12, fontWeight:900, color:'#fff' }}>🔥 {combo}x COMBO!</span></div>}

      <div style={{ maxWidth:520, margin:'0 auto', padding:'0 16px' }}>
        {q && (
          <div key={idx} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'22px 18px', marginBottom:14, animation:'sd-pop 0.25s ease', minHeight:120 }}>
            <div style={{ fontSize:10, fontWeight:800, color:'rgba(245,158,11,0.8)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Q.{idx+1} · {q.subject}</div>
            <p style={{ fontWeight:700, fontSize:'clamp(0.95rem,4vw,1.1rem)', lineHeight:1.7, color:'#fff', margin:0 }}>{q.question}</p>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {q?.options?.map((opt,i)=>{
            const isAns = i === q.correct_answer_index;
            let bg='rgba(255,255,255,0.05)', border='rgba(255,255,255,0.1)', color='#fff';
            if (answered && isAns) { bg='rgba(16,185,129,0.2)'; border='rgba(16,185,129,0.5)'; }
            if (answered && !isAns){ color='rgba(255,255,255,0.3)'; }
            return (
              <button key={i} disabled={answered} onClick={()=>handleAnswer(i)}
                style={{ padding:'14px 12px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:12, textAlign:'left', cursor:answered?'default':'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:22, height:22, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, background:'rgba(255,255,255,0.1)' }}>{answered&&isAns?'✓':String.fromCharCode(65+i)}</span>
                <span style={{ flex:1, lineHeight:1.4 }}>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

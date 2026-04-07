import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import { addXP, checkAndAwardBadges } from './xpSystem';
import { ArrowLeft, CheckCircle2, X, Check, Flame, Calendar, Star, Trophy, ChevronRight } from 'lucide-react';

interface Question {
  id: number; question: string; options: string[];
  correct_answer_index: number; explanation: string; subject: string;
}

const TODAY = new Date().toDateString();
const STORAGE_KEY = 'mpsc_daily_challenge';

function getStoredData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function saveData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes dc-fade { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes dc-pop { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
  @keyframes dc-spin { to{transform:rotate(360deg)} }
  @keyframes dc-correct { 0%{box-shadow:0 0 0 0 rgba(5,150,105,0.4)} 100%{box-shadow:0 0 0 16px rgba(5,150,105,0)} }
  @keyframes dc-wrong { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
  @keyframes dc-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes dc-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  .dc-opt:hover:not([disabled]) { background:#FDF6EC !important; border-color:rgba(232,103,26,0.35) !important; transform:translateX(4px) !important; }
`;

interface Props { onBack: () => void; }

export const DailyChallenge: React.FC<Props> = ({ onBack }) => {
  const [questions, setQuestions]   = useState<Question[]>([]);
  const [qIdx, setQIdx]             = useState(0);
  const [answers, setAnswers]       = useState<Record<number,number>>({});
  const [phase, setPhase]           = useState<'loading'|'quiz'|'done'|'already'>('loading');
  const [showExp, setShowExp]       = useState(false);
  const stored = getStoredData();

  useEffect(() => {
    // Already done today?
    if (stored.date === TODAY && stored.done) { setPhase('already'); return; }
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter: 'Rajyaseva', row_limit: 5 });
      if (data && data.length > 0) {
        setQuestions(data);
        setPhase('quiz');
      }
    } catch { setPhase('quiz'); }
  };

  const handleAnswer = (optIdx: number) => {
    if (answers[qIdx] !== undefined) return;
    setAnswers(p => ({ ...p, [qIdx]: optIdx }));
    setShowExp(true);
  };

  const nextQ = () => {
    setShowExp(false);
    if (qIdx + 1 >= questions.length) {
      const score = Object.entries(answers).filter(([i, a]) => questions[+i]?.correct_answer_index === a).length
        + (answers[qIdx] === questions[qIdx]?.correct_answer_index ? 1 : 0);
      const finalScore = Object.keys({...answers, [qIdx]: answers[qIdx]}).length > 0 ? score : 0;
      updateProgress(questions.length, finalScore);
      const newData = { date: TODAY, done: true, score: finalScore, total: questions.length, history: [...(stored.history||[]), { date: TODAY, score: finalScore }] };
      // Award XP + Coins for daily challenge
      const xpEarned = 20 + (finalScore * 5); // base 20 + 5 per correct
      const prog = JSON.parse(localStorage.getItem('mpsc_user_progress')||'{}');
      const badges = checkAndAwardBadges(prog.totalCorrect||0, prog.streak||0, finalScore);
      addXP(xpEarned, badges);
      // Award coins
      const coins = parseInt(localStorage.getItem('mpsc_coins')||'0');
      localStorage.setItem('mpsc_coins', String(coins + 20 + finalScore*2));
      saveData(newData);
      setPhase('done');
    } else {
      setQIdx(p => p + 1);
    }
  };

  const q = questions[qIdx];
  const stored2 = getStoredData();
  const score = phase === 'done' ? (stored2.score || 0) : 0;
  const history: {date:string;score:number}[] = stored2.history || [];

  // Calendar — last 7 days
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toDateString();
    const entry = history.find(h => h.date === ds);
    return { label: d.toLocaleDateString('mr-IN', { weekday:'short' }), date: ds, entry, isToday: ds === TODAY };
  });

  // Streak calculation
  const streak = (() => {
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (history.find(h => h.date === d.toDateString())) s++;
      else break;
    }
    return s;
  })();

  if (phase === 'loading') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Baloo 2',sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ width:48, height:48, border:'3px solid rgba(232,103,26,0.2)', borderTopColor:'#E8671A', borderRadius:'50%', animation:'dc-spin 0.8s linear infinite' }} />
    </div>
  );

  if (phase === 'already' || phase === 'done') {
    const todayEntry = history.find(h => h.date === TODAY);
    const todayScore = todayEntry?.score ?? score;
    const pct = Math.round((todayScore / 5) * 100);
    return (
      <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", padding:'0 0 60px' }}>
        <style>{CSS}</style>
        {/* Header */}
        <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'16px 20px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', position:'sticky', top:0, zIndex:50 }}>
          <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(232,103,26,0.08)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:10, padding:'7px 14px', color:'#E8671A', fontWeight:800, fontSize:12, cursor:'pointer' }}>
            <ArrowLeft size={14} /> परत
          </button>
          <div style={{ fontWeight:900, fontSize:16, color:'#1C2B2B' }}>📅 Daily Challenge</div>
        </div>

        <div style={{ maxWidth:560, margin:'0 auto', padding:'24px 16px' }}>
          {/* Result card */}
          <div style={{ background:'#fff', borderRadius:24, padding:'32px 24px', textAlign:'center', marginBottom:20, boxShadow:'0 4px 20px rgba(0,0,0,0.08)', animation:'dc-pop 0.5s cubic-bezier(.34,1.56,.64,1)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(90deg,#E8671A,#F5C842,#10B981)', backgroundSize:'200%', animation:'dc-shimmer 3s linear infinite' }} />
            <div style={{ fontSize:64, animation:'dc-float 3s ease infinite', display:'inline-block', marginBottom:12 }}>
              {pct === 100 ? '🏆' : pct >= 80 ? '⭐' : pct >= 60 ? '💪' : '📚'}
            </div>
            <div style={{ fontWeight:900, fontSize:28, color:'#1C2B2B', letterSpacing:'-0.04em', marginBottom:4 }}>
              {todayScore}/{5}
            </div>
            <div style={{ fontSize:13, color:'#7A9090', fontWeight:700, marginBottom:20 }}>
              {phase === 'already' ? 'आजचे challenge आधीच पूर्ण झाले!' : 'आजचे challenge पूर्ण! 🎉'}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20 }}>
              {[
                { l:'बरोबर', v:todayScore, c:'#059669', bg:'rgba(5,150,105,0.08)', border:'rgba(5,150,105,0.2)' },
                { l:'चुकीचे', v:5-todayScore, c:'#DC2626', bg:'rgba(220,38,38,0.08)', border:'rgba(220,38,38,0.2)' },
                { l:'Streak', v:`${streak}🔥`, c:'#E8671A', bg:'rgba(232,103,26,0.08)', border:'rgba(232,103,26,0.2)' },
              ].map(({ l,v,c,bg,border }) => (
                <div key={l} style={{ background:bg, border:`1px solid ${border}`, borderRadius:14, padding:'12px 8px', textAlign:'center' }}>
                  <div style={{ fontWeight:900, fontSize:20, color:c }}>{v}</div>
                  <div style={{ fontSize:9, fontWeight:800, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:12, color:'#7A9090', fontWeight:700 }}>
              उद्या सकाळी नवीन challenge येईल! ⏰
            </div>
          </div>

          {/* Calendar */}
          <div style={{ background:'#fff', borderRadius:20, padding:'20px', marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <Calendar size={16} style={{ color:'#E8671A' }} /> गेल्या 7 दिवसांचा अभ्यास
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8 }}>
              {days.map(({ label, entry, isToday }) => (
                <div key={label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'#7A9090', marginBottom:6 }}>{label}</div>
                  <div style={{ width:36, height:36, borderRadius:10, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, background: isToday ? 'rgba(232,103,26,0.12)' : entry ? 'rgba(5,150,105,0.1)' : 'rgba(0,0,0,0.04)', border: isToday ? '2px solid #E8671A' : entry ? '1px solid rgba(5,150,105,0.3)' : '1px solid rgba(0,0,0,0.07)' }}>
                    {entry ? (entry.score >= 4 ? '🌟' : entry.score >= 3 ? '✓' : '📖') : isToday && phase === 'done' ? '✓' : '-'}
                  </div>
                  {entry && <div style={{ fontSize:8, fontWeight:800, color:'#059669', marginTop:3 }}>{entry.score}/5</div>}
                </div>
              ))}
            </div>
          </div>

          {/* XP + Coins earned */}
          {phase === 'done' && (
            <div style={{ background:'linear-gradient(135deg,rgba(245,200,66,0.15),rgba(232,103,26,0.1))', border:'1px solid rgba(245,200,66,0.3)', borderRadius:16, padding:'14px 18px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontWeight:800, fontSize:13, color:'#92400E' }}>🎉 आज मिळाले:</div>
              <div style={{ display:'flex', gap:12 }}>
                <div style={{ fontWeight:900, fontSize:14, color:'#7C3AED' }}>+{20 + (stored2.score||0)*5} ⚡ XP</div>
                <div style={{ fontWeight:900, fontSize:14, color:'#D97706' }}>+{20 + (stored2.score||0)*2} 🪙</div>
              </div>
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>{
              const txt = `📅 MPSC सारथी Daily Challenge\n\n${stored2.score||0}/5 बरोबर! Streak: ${streak}🔥\n\nतुम्हीही try करा: mpscsarathi.online\n#MPSC #Maharashtra`;
              window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank');
            }} style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
              📤 Share
            </button>
            <button onClick={onBack}
              style={{ flex:2, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, fontSize:15, cursor:'pointer', boxShadow:'0 6px 20px rgba(232,103,26,0.3)' }}>
              अभ्यास सुरू करा 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QUIZ
  const hasAnswered = answers[qIdx] !== undefined;
  const isCorrect   = hasAnswered && answers[qIdx] === q?.correct_answer_index;

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:560, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}>
            <ArrowLeft size={14} />
          </button>
          <div style={{ flex:1, background:'rgba(0,0,0,0.08)', borderRadius:99, height:6, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:99, width:`${((qIdx)/5)*100}%`, transition:'width 0.4s ease' }} />
          </div>
          <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B' }}>{qIdx+1}/5</div>
          {streak > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(232,103,26,0.1)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:99, padding:'4px 10px' }}>
              <Flame size={12} style={{ color:'#E8671A' }} />
              <span style={{ fontSize:11, fontWeight:800, color:'#E8671A' }}>{streak}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'24px 16px' }}>
        {/* Subject badge */}
        <div style={{ marginBottom:14 }}>
          <span style={{ background:'rgba(232,103,26,0.1)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:99, padding:'5px 14px', fontSize:11, fontWeight:800, color:'#C4510E' }}>
            📅 Daily Challenge · {q?.subject}
          </span>
        </div>

        {/* Question */}
        <div style={{ background:'#fff', borderRadius:22, padding:'24px 20px', marginBottom:14, boxShadow:'0 4px 20px rgba(0,0,0,0.08)', animation:'dc-fade 0.3s ease', border:`1.5px solid ${hasAnswered ? (isCorrect ? 'rgba(5,150,105,0.3)' : 'rgba(220,38,38,0.25)') : 'rgba(0,0,0,0.07)'}`, transition:'border 0.3s' }}>
          <p style={{ fontWeight:700, fontSize:'clamp(1rem,4vw,1.15rem)', lineHeight:1.65, color:'#1C2B2B', margin:0 }}>
            {q?.question}
          </p>
        </div>

        {/* Options */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
          {q?.options?.map((opt, i) => {
            const isSel = answers[qIdx] === i;
            const isAns = i === q.correct_answer_index;
            let bg = '#fff', border = 'rgba(0,0,0,0.08)', color = '#1C2B2B', bdgBg = 'rgba(0,0,0,0.06)', bdgCol = '#4A6060';
            let anim = '';
            if (hasAnswered && isAns)           { bg='rgba(5,150,105,0.08)'; border='rgba(5,150,105,0.4)'; color='#065F46'; bdgBg='#059669'; bdgCol='#fff'; anim='dc-correct 0.5s ease'; }
            if (hasAnswered && isSel && !isAns) { bg='rgba(220,38,38,0.07)'; border='rgba(220,38,38,0.35)'; color='#991B1B'; bdgBg='#DC2626'; bdgCol='#fff'; anim='dc-wrong 0.3s ease'; }
            if (hasAnswered && !isSel && !isAns){ color='#A8A29E'; }
            return (
              <button key={i} disabled={hasAnswered} className="dc-opt"
                onClick={() => handleAnswer(i)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 15px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:13, textAlign:'left', cursor:hasAnswered?'default':'pointer', transition:'all 0.18s ease', animation:anim, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ width:28, height:28, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:bdgBg, color:bdgCol, transition:'all 0.18s' }}>
                  {hasAnswered && isAns ? '✓' : hasAnswered && isSel && !isAns ? '✗' : String.fromCharCode(65+i)}
                </span>
                <span style={{ flex:1 }}>{opt}</span>
                {hasAnswered && isAns && <CheckCircle2 size={15} style={{ color:'#059669', flexShrink:0 }} />}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExp && q?.explanation && (
          <div style={{ background:'#FFF7ED', border:'1px solid rgba(232,103,26,0.2)', borderRadius:14, padding:'14px 16px', marginBottom:14, animation:'dc-fade 0.25s ease' }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>💡 स्पष्टीकरण</div>
            <p style={{ fontSize:12, color:'#4A6060', lineHeight:1.65, fontWeight:600, margin:0 }}>{q.explanation}</p>
          </div>
        )}

        {hasAnswered && (
          <button onClick={nextQ}
            style={{ width:'100%', background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'15px', color:'#fff', fontWeight:900, fontSize:15, cursor:'pointer', boxShadow:'0 6px 20px rgba(232,103,26,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8, animation:'dc-fade 0.3s ease' }}>
            {qIdx+1 >= 5 ? <><Trophy size={17} /> निकाल पहा</> : <>पुढे <ChevronRight size={16} /></>}
          </button>
        )}
      </div>
    </div>
  );
};

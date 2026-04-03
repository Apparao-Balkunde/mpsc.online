import React, { useState, useEffect } from 'react';
import { X, Target, Zap, TrendingUp, AlertTriangle, CheckCircle, Sparkles, Loader } from 'lucide-react';

interface Props { onClose: () => void; }
const CSS = `@keyframes ers-fade{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}} @keyframes ers-spin{to{transform:rotate(360deg)}} @keyframes ers-shimmer{0%{background-position:-200% center}100%{background-position:200% center}} @keyframes ers-fill{from{width:0}to{width:var(--w)}}`;

export const ExamReadinessScore: React.FC<Props> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [score, setScore]     = useState<number|null>(null);
  const [analysis, setAnalysis] = useState('');
  const [breakdown, setBreakdown] = useState<{label:string;score:number;color:string}[]>([]);

  const stats = (() => {
    try {
      const p = JSON.parse(localStorage.getItem('mpsc_user_progress')||'{}');
      const h = JSON.parse(localStorage.getItem('mpsc_history')||'[]');
      const badges = JSON.parse(localStorage.getItem('mpsc_earned_achievements')||'[]');
      const daily  = JSON.parse(localStorage.getItem('mpsc_daily_challenge')||'{}');
      const plan   = JSON.parse(localStorage.getItem('mpsc_study_planner')||'[]');
      return { attempted:p.totalAttempted||0, correct:p.totalCorrect||0, streak:p.streak||0, activeDays:h.filter((d:any)=>d.attempted>0).length, badgeCount:badges.length, dailyDone:daily.date===new Date().toDateString()&&daily.done, planProgress:plan.length };
    } catch { return { attempted:0, correct:0, streak:0, activeDays:0, badgeCount:0, dailyDone:false, planProgress:0 }; }
  })();

  const calculate = async () => {
    setLoading(true);
    const acc = stats.attempted > 0 ? Math.round((stats.correct/stats.attempted)*100) : 0;

    // Local calculation
    const scores = [
      { label:'Accuracy', score:Math.min(acc, 100), color:'#059669' },
      { label:'Consistency', score:Math.min(stats.streak*5, 100), color:'#2563EB' },
      { label:'Volume', score:Math.min(stats.attempted/5, 100), color:'#E8671A' },
      { label:'Engagement', score:Math.min(stats.activeDays*3, 100), color:'#7C3AED' },
      { label:'Achievements', score:Math.min(stats.badgeCount*10, 100), color:'#D97706' },
    ];
    setBreakdown(scores);
    const overall = Math.round(scores.reduce((a,s)=>a+s.score,0)/scores.length);
    setScore(overall);

    // AI analysis
    try {
      const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        system:'तू MPSC exam readiness expert आहेस.',
        messages:[{role:'user', content:`Student चा exam readiness score: ${overall}/100\n\nStats:\n- Accuracy: ${acc}%\n- Streak: ${stats.streak} days\n- Questions attempted: ${stats.attempted}\n- Active days: ${stats.activeDays}\n- Badges: ${stats.badgeCount}\n\n3-4 lines मध्ये मराठी मध्ये:\n1. Current level assessment\n2. Top 2 improvement areas\n3. Motivational closing line`}],
        max_tokens:200 }) });
      const data = await res.json();
      setAnalysis(data?.text?.trim() || '');
    } catch {}
    setLoading(false);
  };

  useEffect(() => { calculate(); }, []);

  const getGrade = (s:number) => s>=85?{g:'A+',c:'#059669',l:'Exam Ready! 🏆'}:s>=70?{g:'A',c:'#2563EB',l:'जवळजवळ Ready 💪'}:s>=55?{g:'B',c:'#D97706',l:'चांगली प्रगती 📈'}:s>=40?{g:'C',c:'#E8671A',l:'सुधारणा हवी 📚'}:{g:'D',c:'#DC2626',l:'जास्त मेहनत हवी ⚠️'};
  const grade = score !== null ? getGrade(score) : null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:420, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'ers-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:`linear-gradient(90deg,${grade?.c||'#E8671A'},#F5C842)`, backgroundSize:'200%', animation:'ers-shimmer 3s linear infinite', flexShrink:0 }}/>
        <div style={{ padding:'18px 20px', flexShrink:0, borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontWeight:900, fontSize:16, color:'#1C2B2B', display:'flex', alignItems:'center', gap:8 }}><Target size={18} style={{color:'#E8671A'}}/> Exam Readiness</div>
          <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}><X size={15}/></button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 24px' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <div style={{ width:48, height:48, border:'3px solid rgba(232,103,26,0.2)', borderTopColor:'#E8671A', borderRadius:'50%', animation:'ers-spin 0.8s linear infinite', margin:'0 auto 14px' }}/>
              <div style={{ fontSize:13, fontWeight:700, color:'#7A9090' }}>Analyzing तुमची performance...</div>
            </div>
          ) : score !== null && grade ? (
            <>
              {/* Score circle */}
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ width:120, height:120, borderRadius:'50%', background:`${grade.c}15`, border:`4px solid ${grade.c}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                  <div style={{ fontWeight:900, fontSize:36, color:grade.c, letterSpacing:'-0.05em' }}>{score}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:grade.c }}>/100</div>
                </div>
                <div style={{ fontWeight:900, fontSize:22, color:grade.c, marginBottom:4 }}>Grade: {grade.g}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#4A6060' }}>{grade.l}</div>
              </div>

              {/* Breakdown bars */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontWeight:800, fontSize:11, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Score Breakdown</div>
                {breakdown.map(b => (
                  <div key={b.label} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'#4A6060' }}>{b.label}</span>
                      <span style={{ fontSize:12, fontWeight:900, color:b.color }}>{b.score}%</span>
                    </div>
                    <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:7, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:b.color, borderRadius:99, width:`${b.score}%`, transition:'width 1s ease' }}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Analysis */}
              {analysis && (
                <div style={{ background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:14, padding:'14px', marginBottom:14 }}>
                  <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                    <Sparkles size={14} style={{color:'#7C3AED', flexShrink:0, marginTop:2}}/>
                    <div style={{ fontWeight:800, fontSize:11, color:'#7C3AED', textTransform:'uppercase', letterSpacing:'0.08em' }}>AI Assessment</div>
                  </div>
                  <p style={{ fontSize:12, fontWeight:600, color:'#4A6060', lineHeight:1.7, margin:0 }}>{analysis}</p>
                </div>
              )}

              <button onClick={calculate} style={{ width:'100%', background:'rgba(232,103,26,0.08)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:12, padding:'12px', color:'#E8671A', fontWeight:800, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <Zap size={14}/> पुन्हा Calculate करा
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

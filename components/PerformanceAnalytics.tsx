import React, { useEffect, useState } from 'react';
import { X, TrendingUp, Target, Award, Flame, Calendar, BarChart2 } from 'lucide-react';

interface Props { onClose: () => void; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes pa-fade { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes pa-bar { from{height:0}to{height:var(--h)} }
  @keyframes pa-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
`;

interface DayData { date:string; attempted:number; correct:number; }

export const PerformanceAnalytics: React.FC<Props> = ({ onClose }) => {
  const [history, setHistory]   = useState<DayData[]>([]);
  const [progress, setProgress] = useState({ totalAttempted:0, totalCorrect:0, streak:0 });

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem('mpsc_history') || '[]');
      setHistory(h.slice(-30));
      const p = JSON.parse(localStorage.getItem('mpsc_user_progress') || '{}');
      setProgress({ totalAttempted:p.totalAttempted||0, totalCorrect:p.totalCorrect||0, streak:p.streak||0 });
    } catch {}
  }, []);

  const last7  = history.slice(-7);
  const maxAtt = Math.max(...last7.map(d => d.attempted), 1);
  const accuracy = progress.totalAttempted > 0 ? Math.round((progress.totalCorrect/progress.totalAttempted)*100) : 0;

  const days7Att  = last7.reduce((a,d) => a+d.attempted, 0);
  const days7Cor  = last7.reduce((a,d) => a+d.correct, 0);
  const days7Acc  = days7Att > 0 ? Math.round((days7Cor/days7Att)*100) : 0;

  const activeDays = history.filter(d => d.attempted > 0).length;

  const getDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('mr-IN', { weekday:'short' });
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:440, maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'pa-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#E8671A,#F5C842,#10B981)', backgroundSize:'200%', animation:'pa-shimmer 3s linear infinite', flexShrink:0 }} />

        {/* Header */}
        <div style={{ padding:'18px 20px 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:12, background:'rgba(232,103,26,0.1)', border:'1.5px solid rgba(232,103,26,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <BarChart2 size={18} style={{ color:'#E8671A' }} />
              </div>
              <div>
                <div style={{ fontWeight:900, fontSize:16, color:'#1C2B2B' }}>Performance</div>
                <div style={{ fontSize:11, color:'#7A9090', fontWeight:600 }}>तुमची प्रगती</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'0 20px 24px' }}>

          {/* Overall stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
            {[
              { l:'एकूण सोडवलेले', v:progress.totalAttempted, c:'#2563EB', bg:'rgba(37,99,235,0.08)', icon:'📝' },
              { l:'एकूण बरोबर',    v:progress.totalCorrect,   c:'#059669', bg:'rgba(5,150,105,0.08)', icon:'✅' },
              { l:'अचूकता',        v:`${accuracy}%`,          c:'#E8671A', bg:'rgba(232,103,26,0.08)', icon:'🎯' },
              { l:'Streak',        v:`${progress.streak} days`, c:'#DC2626', bg:'rgba(220,38,38,0.08)', icon:'🔥' },
            ].map(({ l,v,c,bg,icon }) => (
              <div key={l} style={{ background:bg, borderRadius:14, padding:'14px 12px', textAlign:'center' }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                <div style={{ fontWeight:900, fontSize:18, color:c, lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:9, fontWeight:700, color:'#7A9090', textTransform:'uppercase', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* 7-day bar chart */}
          {last7.length > 0 && (
            <div style={{ background:'#F8F5F0', borderRadius:18, padding:'16px', marginBottom:16 }}>
              <div style={{ fontWeight:800, fontSize:12, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
                <Calendar size={13} style={{ color:'#E8671A' }} /> गेले 7 दिवस
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:90 }}>
                {last7.map((d, i) => {
                  const h = maxAtt > 0 ? Math.max((d.attempted/maxAtt)*80, d.attempted>0?8:0) : 0;
                  const acc = d.attempted > 0 ? Math.round((d.correct/d.attempted)*100) : 0;
                  const barColor = acc >= 75 ? '#059669' : acc >= 50 ? '#D97706' : acc > 0 ? '#DC2626' : '#E5E7EB';
                  return (
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ fontSize:8, fontWeight:700, color:'#7A9090' }}>{d.attempted>0?d.attempted:''}</div>
                      <div style={{ width:'100%', background:'rgba(0,0,0,0.06)', borderRadius:6, height:80, display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
                        <div style={{ width:'100%', height:`${h}px`, background:barColor, borderRadius:6, transition:'height 0.8s ease' }} />
                      </div>
                      <div style={{ fontSize:8, fontWeight:700, color:'#A8A29E' }}>{getDay(d.date)}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display:'flex', gap:10, marginTop:10, justifyContent:'center' }}>
                {[{c:'#059669',l:'75%+'},{c:'#D97706',l:'50-75%'},{c:'#DC2626',l:'<50%'}].map(({c,l}) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:c }} />
                    <span style={{ fontSize:9, fontWeight:700, color:'#7A9090' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* This week summary */}
          <div style={{ background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:16, padding:'16px', marginBottom:16 }}>
            <div style={{ fontWeight:800, fontSize:12, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>📈 या आठवड्याचा सारांश</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              {[
                { l:'सोडवलेले', v:days7Att, c:'#2563EB' },
                { l:'बरोबर',    v:days7Cor, c:'#059669' },
                { l:'अचूकता',  v:`${days7Acc}%`, c:'#E8671A' },
              ].map(({ l,v,c }) => (
                <div key={l} style={{ textAlign:'center' }}>
                  <div style={{ fontWeight:900, fontSize:20, color:c }}>{v}</div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#7A9090', textTransform:'uppercase', marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active days */}
          <div style={{ background:'rgba(5,150,105,0.06)', border:'1px solid rgba(5,150,105,0.15)', borderRadius:16, padding:'16px' }}>
            <div style={{ fontWeight:800, fontSize:12, color:'#047857', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>🌟 Consistency</div>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ fontWeight:900, fontSize:32, color:'#059669' }}>{activeDays}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:'#1C2B2B' }}>Active Days</div>
                <div style={{ fontSize:11, color:'#7A9090', fontWeight:600 }}>गेल्या {history.length} दिवसांपैकी</div>
              </div>
            </div>
          </div>

          {history.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'#7A9090' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
              <div style={{ fontWeight:800, fontSize:14, marginBottom:6 }}>अजून data नाही!</div>
              <div style={{ fontSize:12, fontWeight:600 }}>Quiz सोडवा — इथे graph दिसेल</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

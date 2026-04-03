import React, { useEffect, useState } from 'react';
import { X, Calendar, Flame, TrendingUp } from 'lucide-react';

interface Props { onClose: () => void; }
const CSS = `@keyframes hm-fade{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}} @keyframes hm-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}`;

export const HeatmapCalendar: React.FC<Props> = ({ onClose }) => {
  const [data, setData] = useState<Record<string,{attempted:number;correct:number}>>({});
  const [streak, setStreak] = useState(0);
  const [maxAtt, setMaxAtt] = useState(1);

  useEffect(() => {
    try {
      const hist = JSON.parse(localStorage.getItem('mpsc_history')||'[]');
      const map: Record<string,{attempted:number;correct:number}> = {};
      hist.forEach((d:any) => { map[d.date] = { attempted:d.attempted, correct:d.correct }; });
      setData(map);
      setMaxAtt(Math.max(...hist.map((d:any)=>d.attempted), 1));
      const p = JSON.parse(localStorage.getItem('mpsc_user_progress')||'{}');
      setStreak(p.streak||0);
    } catch {}
  }, []);

  // Generate last 84 days (12 weeks)
  const days = [...Array(84)].map((_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (83-i));
    return { date:d.toDateString(), day:d.getDay(), label:d.toLocaleDateString('mr-IN',{month:'short',day:'numeric'}) };
  });

  const getColor = (date: string) => {
    const d = data[date];
    if (!d || d.attempted === 0) return 'rgba(255,255,255,0.06)';
    const intensity = d.attempted / maxAtt;
    if (intensity > 0.75) return '#E8671A';
    if (intensity > 0.5)  return '#F97316';
    if (intensity > 0.25) return '#FED7AA';
    return '#FEF3C7';
  };

  const weeks = [];
  for (let i=0; i<84; i+=7) weeks.push(days.slice(i, i+7));
  const DAYS = ['S','M','T','W','T','F','S'];
  const totalActive = Object.keys(data).filter(k=>data[k]?.attempted>0).length;
  const totalQ      = Object.values(data).reduce((a,d)=>a+d.attempted,0);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#1C2B2B', borderRadius:28, width:'100%', maxWidth:460, overflow:'hidden', animation:'hm-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', color:'#fff' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#E8671A,#F5C842)', backgroundSize:'200%', animation:'hm-shimmer 3s linear infinite' }}/>
        <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontWeight:900, fontSize:15, display:'flex', alignItems:'center', gap:8 }}><Calendar size={16} style={{color:'#E8671A'}}/> Activity Heatmap</div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.6)' }}><X size={14}/></button>
        </div>

        <div style={{ padding:'16px 20px 20px' }}>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:18 }}>
            {[
              { l:'Active Days', v:totalActive, c:'#E8671A', e:'📅' },
              { l:'Questions', v:totalQ.toLocaleString(), c:'#2563EB', e:'📝' },
              { l:'Streak', v:`${streak}🔥`, c:'#DC2626', e:'🔥' },
            ].map(({l,v,c,e}) => (
              <div key={l} style={{ background:'rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 8px', textAlign:'center' }}>
                <div style={{ fontSize:18, marginBottom:3 }}>{e}</div>
                <div style={{ fontWeight:900, fontSize:16, color:c }}>{v}</div>
                <div style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Day labels */}
          <div style={{ display:'flex', gap:4, marginBottom:4, paddingLeft:28 }}>
            {DAYS.map((d,i) => <div key={i} style={{ width:20, textAlign:'center', fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.3)', flex:1 }}>{d}</div>)}
          </div>

          {/* Heatmap */}
          <div style={{ display:'flex', gap:3 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display:'flex', flexDirection:'column', gap:3 }}>
                {week.map((day, di) => {
                  const d = data[day.date];
                  return (
                    <div key={di} title={`${day.label}: ${d?.attempted||0} questions`}
                      style={{ width:20, height:20, borderRadius:4, background:getColor(day.date), cursor:'pointer', transition:'transform 0.15s', flexShrink:0 }}
                      onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.3)')}
                      onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}/>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:14, justifyContent:'flex-end' }}>
            <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)' }}>कमी</span>
            {['rgba(255,255,255,0.06)','#FEF3C7','#FED7AA','#F97316','#E8671A'].map((c,i) => (
              <div key={i} style={{ width:14, height:14, borderRadius:3, background:c }}/>
            ))}
            <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)' }}>जास्त</span>
          </div>
        </div>
      </div>
    </div>
  );
};

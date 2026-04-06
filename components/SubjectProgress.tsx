import React, { useState, useEffect } from 'react';
import { X, BarChart2, TrendingUp, ChevronRight } from 'lucide-react';

interface Props { onClose: () => void; }

const SUBJECTS = [
  {name:'राज्यघटना', emoji:'⚖️', color:'#2563EB', totalQ:500},
  {name:'मराठी इतिहास', emoji:'📜', color:'#D97706', totalQ:600},
  {name:'भूगोल', emoji:'🗺️', color:'#059669', totalQ:400},
  {name:'अर्थशास्त्र', emoji:'💹', color:'#7C3AED', totalQ:350},
  {name:'विज्ञान', emoji:'🔬', color:'#0891B2', totalQ:300},
  {name:'मराठी भाषा', emoji:'📝', color:'#E8671A', totalQ:250},
  {name:'English', emoji:'🔤', color:'#8B5CF6', totalQ:200},
  {name:'गणित', emoji:'🔢', color:'#DC2626', totalQ:300},
  {name:'चालू घडामोडी', emoji:'📰', color:'#EC4899', totalQ:200},
];

const CSS = `@keyframes sp-fade{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}} @keyframes sp-shimmer{0%{background-position:-200% center}100%{background-position:200% center}} @keyframes sp-fill{from{width:0}to{width:var(--w)}}`;

export const SubjectProgress: React.FC<Props> = ({ onClose }) => {
  const [data, setData]   = useState<Record<string,{attempted:number;correct:number}>>({});
  const [sorted, setSorted] = useState<'accuracy'|'attempted'>('accuracy');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mpsc_subject_stats')||'{}');
      // Simulate some data if empty
      const out: Record<string,{attempted:number;correct:number}> = {};
      SUBJECTS.forEach(s => {
        if (saved[s.name]) { out[s.name] = saved[s.name]; }
        else { out[s.name] = { attempted: Math.floor(Math.random()*80), correct: Math.floor(Math.random()*60) }; }
      });
      setData(out);
    } catch {}
  }, []);

  const getAcc = (s: string) => {
    const d = data[s]; if (!d || d.attempted===0) return 0;
    return Math.round((d.correct/d.attempted)*100);
  };

  const sortedSubjects = [...SUBJECTS].sort((a,b) => {
    if (sorted==='accuracy') return getAcc(b.name)-getAcc(a.name);
    return (data[b.name]?.attempted||0)-(data[a.name]?.attempted||0);
  });

  const totalAttempted = Object.values(data).reduce((a,d)=>a+d.attempted,0);
  const totalCorrect   = Object.values(data).reduce((a,d)=>a+d.correct,0);
  const overallAcc     = totalAttempted>0 ? Math.round((totalCorrect/totalAttempted)*100) : 0;

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(28,43,43,0.55)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16,fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <style>{CSS}</style>
      <div style={{background:'#fff',borderRadius:28,width:'100%',maxWidth:440,maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column',animation:'sp-fade 0.35s cubic-bezier(.34,1.56,.64,1)',boxShadow:'0 20px 60px rgba(28,43,43,0.15)'}}>
        <div style={{height:4,background:'linear-gradient(90deg,#E8671A,#2563EB)',backgroundSize:'200%',animation:'sp-shimmer 3s linear infinite',flexShrink:0}}/>
        <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(0,0,0,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{fontWeight:900,fontSize:15,color:'#1C2B2B',display:'flex',alignItems:'center',gap:8}}><BarChart2 size={16} style={{color:'#E8671A'}}/> Subject Progress</div>
          <button onClick={onClose} style={{background:'#F8F5F0',border:'none',borderRadius:9,width:30,height:30,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#7A9090'}}><X size={14}/></button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'14px 18px 20px'}}>
          {/* Overall */}
          <div style={{background:'linear-gradient(135deg,#FFF7ED,#FEF3C7)',border:'1px solid rgba(232,103,26,0.15)',borderRadius:16,padding:'14px 16px',marginBottom:16,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,textAlign:'center'}}>
            {[{l:'एकूण',v:totalAttempted,c:'#2563EB'},{l:'अचूकता',v:`${overallAcc}%`,c:'#059669'},{l:'बरोबर',v:totalCorrect,c:'#E8671A'}].map(({l,v,c})=>(
              <div key={l}>
                <div style={{fontWeight:900,fontSize:20,color:c}}>{v}</div>
                <div style={{fontSize:9,fontWeight:700,color:'#7A9090',textTransform:'uppercase'}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Sort tabs */}
          <div style={{display:'flex',background:'#F8F5F0',borderRadius:12,padding:3,marginBottom:14,gap:3}}>
            {[['accuracy','Accuracy'],['attempted','Attempted']].map(([k,l])=>(
              <button key={k} onClick={()=>setSorted(k as any)}
                style={{flex:1,padding:'7px',borderRadius:10,fontWeight:800,fontSize:11,cursor:'pointer',border:'none',background:sorted===k?'linear-gradient(135deg,#E8671A,#C4510E)':'transparent',color:sorted===k?'#fff':'#7A9090',transition:'all 0.2s'}}>
                {l} ↓
              </button>
            ))}
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {sortedSubjects.map((s,i)=>{
              const d = data[s.name]||{attempted:0,correct:0};
              const acc = getAcc(s.name);
              const pct = Math.min((d.attempted/s.totalQ)*100,100);
              return (
                <div key={s.name} style={{background:'#F8F5F0',borderRadius:14,padding:'13px 14px',borderLeft:`4px solid ${s.color}`}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:20}}>{s.emoji}</span>
                      <div>
                        <div style={{fontWeight:900,fontSize:13,color:'#1C2B2B'}}>{s.name}</div>
                        <div style={{fontSize:9,fontWeight:700,color:'#7A9090'}}>{d.attempted}/{s.totalQ} attempted</div>
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:900,fontSize:16,color:acc>=75?'#059669':acc>=50?'#D97706':'#DC2626'}}>{acc}%</div>
                      <div style={{fontSize:9,fontWeight:700,color:'#7A9090'}}>accuracy</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:9,fontWeight:700,color:'#7A9090'}}>Coverage</span>
                      <span style={{fontSize:9,fontWeight:800,color:s.color}}>{Math.round(pct)}%</span>
                    </div>
                    <div style={{background:'rgba(0,0,0,0.08)',borderRadius:99,height:6,overflow:'hidden'}}>
                      <div style={{height:'100%',background:s.color,borderRadius:99,width:`${pct}%`,transition:'width 0.8s ease'}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

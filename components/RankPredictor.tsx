import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Award, Target, ChevronRight } from 'lucide-react';

interface Props { onClose: () => void; }
const CSS = `@keyframes rp-fade{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}} @keyframes rp-shimmer{0%{background-position:-200% center}100%{background-position:200% center}} @keyframes rp-count{from{opacity:0}to{opacity:1}}`;

const VACANCIES = [
  { exam:'राज्यसेवा',   total:200,  avgCutoff:85 },
  { exam:'PSI/STI',    total:800,  avgCutoff:75 },
  { exam:'Group B',    total:1500, avgCutoff:70 },
  { exam:'Group C',    total:3000, avgCutoff:65 },
  { exam:'तलाठी',      total:5000, avgCutoff:60 },
];

export const RankPredictor: React.FC<Props> = ({ onClose }) => {
  const [acc, setAcc]     = useState(0);
  const [exam, setExam]   = useState(VACANCIES[0]);
  const [predicted, setPredicted] = useState<{rank:number;status:string;chance:string;color:string}|null>(null);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('mpsc_user_progress')||'{}');
      const a = p.totalAttempted>0 ? Math.round((p.totalCorrect/p.totalAttempted)*100) : 0;
      setAcc(a);
    } catch {}
  }, []);

  const predict = () => {
    // Simplified prediction model
    const percentile = acc >= exam.avgCutoff+10 ? 95 : acc >= exam.avgCutoff+5 ? 85 : acc >= exam.avgCutoff ? 70 : acc >= exam.avgCutoff-5 ? 50 : 30;
    const totalApplicants = exam.total * 15; // ~15x applicants per vacancy
    const rank = Math.round(totalApplicants * (1 - percentile/100)) + 1;
    const chance = percentile >= 85 ? 'High' : percentile >= 65 ? 'Medium' : 'Low';
    const color = chance === 'High' ? '#059669' : chance === 'Medium' ? '#D97706' : '#DC2626';
    const status = rank <= exam.total ? '✅ Selection Zone मध्ये!' : rank <= exam.total*2 ? '⚠️ Border Zone' : '❌ खूप दूर आहे';
    setPredicted({ rank, status, chance, color });
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:400, overflow:'hidden', animation:'rp-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#059669,#2563EB,#7C3AED)', backgroundSize:'200%', animation:'rp-shimmer 3s linear infinite' }}/>
        <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:8 }}><TrendingUp size={16} style={{color:'#2563EB'}}/> Rank Predictor</div>
          <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}><X size={14}/></button>
        </div>

        <div style={{ padding:'18px 20px 22px' }}>
          {/* Accuracy display */}
          <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:14, padding:'12px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#4A6060' }}>तुमची Accuracy</div>
            <div style={{ fontWeight:900, fontSize:22, color:'#2563EB' }}>{acc}%</div>
          </div>

          {/* Exam selector */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Exam निवडा</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {VACANCIES.map(v => (
                <button key={v.exam} onClick={()=>{setExam(v);setPredicted(null);}}
                  style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderRadius:12, border:`1.5px solid ${exam.exam===v.exam?'#2563EB':'rgba(0,0,0,0.08)'}`, background:exam.exam===v.exam?'rgba(37,99,235,0.08)':'#F8F5F0', cursor:'pointer' }}>
                  <span style={{ fontSize:12, fontWeight:800, color:exam.exam===v.exam?'#2563EB':'#1C2B2B' }}>{v.exam}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:'#7A9090' }}>{v.total} vacancies · Cutoff ~{v.avgCutoff}%</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={predict}
            style={{ width:'100%', background:'linear-gradient(135deg,#2563EB,#1D4ED8)', border:'none', borderRadius:12, padding:'13px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer', marginBottom: predicted?14:0 }}>
            🎯 Rank Predict करा
          </button>

          {predicted && (
            <div style={{ background:`${predicted.color}08`, border:`1.5px solid ${predicted.color}25`, borderRadius:16, padding:'18px', animation:'rp-count 0.4s ease' }}>
              <div style={{ textAlign:'center', marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:800, color:'#7A9090', textTransform:'uppercase', marginBottom:4 }}>Predicted Rank</div>
                <div style={{ fontWeight:900, fontSize:40, color:predicted.color, letterSpacing:'-0.05em' }}>#{predicted.rank.toLocaleString()}</div>
                <div style={{ fontSize:13, fontWeight:800, color:predicted.color, marginTop:4 }}>{predicted.status}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div style={{ background:'rgba(0,0,0,0.04)', borderRadius:10, padding:'10px', textAlign:'center' }}>
                  <div style={{ fontWeight:900, fontSize:15, color:predicted.color }}>{predicted.chance}</div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#7A9090', textTransform:'uppercase' }}>Chance</div>
                </div>
                <div style={{ background:'rgba(0,0,0,0.04)', borderRadius:10, padding:'10px', textAlign:'center' }}>
                  <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B' }}>{exam.total}</div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#7A9090', textTransform:'uppercase' }}>Vacancies</div>
                </div>
              </div>
              <div style={{ marginTop:10, fontSize:10, fontWeight:600, color:'#A8A29E', textAlign:'center' }}>
                * हे एक approximate estimate आहे. Official results वेगळे असू शकतात.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

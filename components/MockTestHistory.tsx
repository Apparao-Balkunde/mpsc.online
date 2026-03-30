import React, { useState, useEffect } from 'react';
import { X, Trophy, Clock, Target, TrendingUp, Trash2, BarChart2 } from 'lucide-react';

interface TestResult { id:string; date:string; score:number; total:number; time:number; subject:string; }
interface Props { onClose: () => void; }

const KEY = 'mpsc_mock_history';

export function saveMockResult(score:number, total:number, timeSeconds:number, subject='Mock Test') {
  try {
    const hist: TestResult[] = JSON.parse(localStorage.getItem(KEY)||'[]');
    hist.unshift({ id:Date.now().toString(), date:new Date().toLocaleDateString('mr-IN'), score, total, time:timeSeconds, subject });
    localStorage.setItem(KEY, JSON.stringify(hist.slice(0,50)));
  } catch {}
}

const CSS = `
  @keyframes mh-fade { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes mh-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
`;

export const MockTestHistory: React.FC<Props> = ({ onClose }) => {
  const [history, setHistory] = useState<TestResult[]>([]);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem(KEY)||'[]')); } catch {}
  }, []);

  const del = (id:string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem(KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    if (!window.confirm('सर्व history delete करायची?')) return;
    setHistory([]); localStorage.removeItem(KEY);
  };

  const avgScore  = history.length ? Math.round(history.reduce((a,h) => a+(h.score/h.total*100), 0)/history.length) : 0;
  const bestScore = history.length ? Math.max(...history.map(h => Math.round(h.score/h.total*100))) : 0;

  const formatTime = (s:number) => s >= 3600 ? `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m` : `${Math.floor(s/60)}m ${s%60}s`;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:440, maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'mh-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#E8671A,#F5C842,#E8671A)', backgroundSize:'200%', animation:'mh-shimmer 3s linear infinite', flexShrink:0 }} />

        <div style={{ padding:'18px 20px', flexShrink:0, borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:12, background:'rgba(232,103,26,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Trophy size={18} style={{ color:'#E8671A' }} />
            </div>
            <div>
              <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B' }}>Mock Test History</div>
              <div style={{ fontSize:10, color:'#7A9090', fontWeight:600 }}>{history.length} tests</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {history.length > 0 && <button onClick={clearAll} style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:9, padding:'6px 10px', cursor:'pointer', color:'#DC2626', fontSize:11, fontWeight:700 }}>Clear</button>}
            <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}><X size={15} /></button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
          {history.length === 0 ? (
            <div style={{ textAlign:'center', padding:'50px 20px' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📝</div>
              <div style={{ fontWeight:800, fontSize:14, color:'#1C2B2B', marginBottom:6 }}>अजून कोणताही test नाही!</div>
              <div style={{ fontSize:12, color:'#7A9090', fontWeight:600 }}>Mock Test सोडवा — results इथे दिसतील</div>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
                {[
                  { l:'Tests', v:history.length, c:'#2563EB', bg:'rgba(37,99,235,0.08)' },
                  { l:'Best', v:`${bestScore}%`, c:'#059669', bg:'rgba(5,150,105,0.08)' },
                  { l:'Average', v:`${avgScore}%`, c:'#E8671A', bg:'rgba(232,103,26,0.08)' },
                ].map(({ l,v,c,bg }) => (
                  <div key={l} style={{ background:bg, borderRadius:12, padding:'12px 8px', textAlign:'center' }}>
                    <div style={{ fontWeight:900, fontSize:18, color:c }}>{v}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#7A9090', textTransform:'uppercase', marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {history.map((h, i) => {
                  const pct  = Math.round((h.score/h.total)*100);
                  const color = pct>=75?'#059669':pct>=50?'#D97706':'#DC2626';
                  return (
                    <div key={h.id} style={{ background:'#F8F5F0', borderRadius:14, padding:'14px', display:'flex', alignItems:'center', gap:12, border:`1px solid ${color}20` }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:`${color}15`, border:`1.5px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontWeight:900, fontSize:13, color }}>{pct}%</span>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:12, color:'#1C2B2B', marginBottom:3 }}>{h.subject}</div>
                        <div style={{ fontSize:10, fontWeight:700, color:'#7A9090', display:'flex', gap:10 }}>
                          <span>📝 {h.score}/{h.total}</span>
                          <span>⏱️ {formatTime(h.time)}</span>
                          <span>📅 {h.date}</span>
                        </div>
                        <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:4, marginTop:6, overflow:'hidden' }}>
                          <div style={{ height:'100%', background:color, width:`${pct}%`, transition:'width 0.6s ease' }} />
                        </div>
                      </div>
                      <button onClick={() => del(h.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#A8A29E', padding:4 }}><Trash2 size={13} /></button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

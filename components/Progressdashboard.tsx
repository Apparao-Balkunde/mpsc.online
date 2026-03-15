import React, { useState, useEffect } from 'react';
import { ChevronRight, X } from 'lucide-react';

interface ProgressData {
  totalAttempted: number;
  totalCorrect: number;
  streak: number;
  lastActiveDate: string;
}
interface DayData { date: string; attempted: number; correct: number; }

const PROGRESS_KEY = 'mpsc_user_progress';
const HISTORY_KEY  = 'mpsc_history';

function loadProgress(): ProgressData {
  try { const r = localStorage.getItem(PROGRESS_KEY); if (r) return JSON.parse(r); } catch (_) {}
  return { totalAttempted:0, totalCorrect:0, streak:0, lastActiveDate:'' };
}
function loadHistory(): DayData[] {
  try { const r = localStorage.getItem(HISTORY_KEY); if (r) return JSON.parse(r); } catch (_) {}
  return [];
}

const BADGES = [
  { id:'first',    label:'पहिली चूक',   emoji:'🎯', desc:'पहिला प्रश्न सोडवला',    req:(p: ProgressData) => p.totalAttempted >= 1   },
  { id:'ten',      label:'दशक',          emoji:'🔟', desc:'10 प्रश्न सोडवले',       req:(p: ProgressData) => p.totalAttempted >= 10  },
  { id:'fifty',    label:'अर्धशतक',     emoji:'🏏', desc:'50 प्रश्न सोडवले',       req:(p: ProgressData) => p.totalAttempted >= 50  },
  { id:'century',  label:'शतक',          emoji:'💯', desc:'100 प्रश्न सोडवले',      req:(p: ProgressData) => p.totalAttempted >= 100 },
  { id:'fivehun',  label:'पंचशतक',      emoji:'🌟', desc:'500 प्रश्न सोडवले',      req:(p: ProgressData) => p.totalAttempted >= 500 },
  { id:'thousand', label:'सहस्रक',      emoji:'👑', desc:'1000 प्रश्न सोडवले',     req:(p: ProgressData) => p.totalAttempted >= 1000},
  { id:'streak3',  label:'हॅटट्रिक',    emoji:'🔥', desc:'3 दिवस streak',           req:(p: ProgressData) => p.streak >= 3          },
  { id:'streak7',  label:'आठवडा',        emoji:'📅', desc:'7 दिवस streak',           req:(p: ProgressData) => p.streak >= 7          },
  { id:'streak30', label:'महिना',        emoji:'🏆', desc:'30 दिवस streak',          req:(p: ProgressData) => p.streak >= 30         },
  { id:'acc70',    label:'अचूक निशाना', emoji:'🎖️', desc:'70%+ accuracy मिळवली',   req:(p: ProgressData) => p.totalAttempted >= 20 && (p.totalCorrect/p.totalAttempted) >= 0.7 },
  { id:'acc90',    label:'तज्ज्ञ',      emoji:'⭐', desc:'90%+ accuracy मिळवली',   req:(p: ProgressData) => p.totalAttempted >= 20 && (p.totalCorrect/p.totalAttempted) >= 0.9 },
  { id:'spardha',  label:'योद्धा',       emoji:'⚔️', desc:'SpardhaYodha खेळला',    req:(p: ProgressData) => !!localStorage.getItem('sy_played') },
];

function WeekChart({ history }: { history: DayData[] }) {
  const last7  = [...history].slice(-7);
  const maxVal = Math.max(...last7.map(d => d.attempted), 1);
  const days   = ['र','सो','म','बु','गु','शु','श'];
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:60, padding:'0 4px' }}>
      {last7.length === 0 ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#B0CCCC', fontSize:12, fontWeight:700 }}>
          अजून डेटा नाही — सराव सुरू करा!
        </div>
      ) : last7.map((d, i) => {
        const acc  = d.attempted > 0 ? d.correct / d.attempted : 0;
        const barH = Math.max((d.attempted / maxVal) * 100, 4);
        const color = acc >= 0.7 ? '#10B981' : acc >= 0.5 ? '#F59E0B' : acc > 0 ? '#EF4444' : 'rgba(28,43,43,0.1)';
        const date = new Date(d.date);
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ width:'100%', background:'rgba(28,43,43,0.06)', borderRadius:6, height:48, display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
              <div style={{ width:'100%', height:`${barH}%`, background:color, borderRadius:'4px 4px 0 0', transition:'height 0.8s cubic-bezier(.4,0,.2,1)', minHeight:d.attempted>0?4:0 }} />
            </div>
            <span style={{ fontSize:8, fontWeight:700, color:'#7A9090' }}>{days[date.getDay()]}</span>
          </div>
        );
      })}
    </div>
  );
}

function Donut({ correct, total }: { correct: number; total: number }) {
  const pct    = total > 0 ? correct / total : 0;
  const r      = 36, stroke = 8;
  const circ   = 2 * Math.PI * r;
  const offset = circ - pct * circ;
  const color  = pct >= 0.7 ? '#059669' : pct >= 0.5 ? '#D97706' : '#DC2626';
  return (
    <div style={{ position:'relative', width:88, height:88, flexShrink:0 }}>
      <svg width={88} height={88} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(28,43,43,0.08)" strokeWidth={stroke} />
        <circle cx={44} cy={44} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontWeight:900, fontSize:18, color, lineHeight:1 }}>{Math.round(pct * 100)}%</span>
        <span style={{ fontSize:8, fontWeight:700, color:'#7A9090', letterSpacing:'0.05em' }}>अचूक</span>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes pd-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pd-pop  { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }
  .pd-tab:hover { opacity:0.85; }
  .pd-badge:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(28,43,43,0.1); }
`;

interface Props { onClose: () => void; }

export const ProgressDashboard: React.FC<Props> = ({ onClose }) => {
  const [progress, setProgress] = useState<ProgressData>(loadProgress());
  const [history,  setHistory]  = useState<DayData[]>(loadHistory());
  const [tab, setTab]           = useState<'overview'|'badges'|'history'>('overview');

  useEffect(() => { setProgress(loadProgress()); setHistory(loadHistory()); }, []);

  const accuracy     = progress.totalAttempted > 0 ? Math.round((progress.totalCorrect / progress.totalAttempted) * 100) : 0;
  const earnedBadges = BADGES.filter(b => b.req(progress));
  const nextBadge    = BADGES.find(b => !b.req(progress));

  const accColor = accuracy >= 70 ? '#059669' : accuracy >= 50 ? '#D97706' : '#DC2626';

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(28,43,43,0.6)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div style={{ background:'#FDF6EC', borderRadius:28, width:'100%', maxWidth:500, maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'pd-fade 0.35s cubic-bezier(.34,1.56,.64,1)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#1C2B2B', boxShadow:'0 20px 60px rgba(28,43,43,0.2)' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1C2B2B,#0D6B6E)', padding:'20px 22px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:900, fontSize:17, color:'#F5C842', letterSpacing:'-0.03em' }}>माझी प्रगती</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700, marginTop:1 }}>
              {earnedBadges.length}/{BADGES.length} badges · streak {progress.streak} 🔥
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'7px', cursor:'pointer', color:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, padding:'10px 16px 0', background:'#fff', borderBottom:'1px solid rgba(28,43,43,0.07)' }}>
          {(['overview','badges','history'] as const).map(t => (
            <button key={t} className="pd-tab" onClick={() => setTab(t)}
              style={{ padding:'8px 16px', borderRadius:'10px 10px 0 0', fontSize:11, fontWeight:800, cursor:'pointer', border:'none', background: tab===t ? '#FDF6EC' : 'transparent', color: tab===t ? '#E8671A' : '#7A9090', borderBottom: tab===t ? '2px solid #E8671A' : '2px solid transparent', transition:'all 0.15s', fontFamily:"'Baloo 2',sans-serif" }}>
              {t==='overview' ? 'Overview' : t==='badges' ? `Badges (${earnedBadges.length})` : 'History'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 24px', background:'#FDF6EC' }}>

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Stats row */}
              <div style={{ display:'flex', gap:12, alignItems:'center', background:'#fff', borderRadius:18, padding:'16px', boxShadow:'0 2px 12px rgba(28,43,43,0.06)', border:'1px solid rgba(28,43,43,0.07)' }}>
                <Donut correct={progress.totalCorrect} total={progress.totalAttempted} />
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:9 }}>
                  {[
                    { l:'एकूण प्रयत्न', v:progress.totalAttempted.toLocaleString(), c:'#0D6B6E' },
                    { l:'बरोबर उत्तरे', v:progress.totalCorrect.toLocaleString(),   c:'#059669' },
                    { l:'Streak',        v:`${progress.streak} दिवस 🔥`,             c:'#E8671A' },
                  ].map(({ l, v, c }) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#FDF6EC', border:`1px solid ${c}20`, borderRadius:10, padding:'7px 12px' }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'#7A9090' }}>{l}</span>
                      <span style={{ fontSize:13, fontWeight:900, color:c }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accuracy bar */}
              <div style={{ background:'#fff', border:'1px solid rgba(28,43,43,0.07)', borderRadius:16, padding:'14px 16px', boxShadow:'0 2px 8px rgba(28,43,43,0.05)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:800, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.1em' }}>एकूण अचूकता</span>
                  <span style={{ fontSize:13, fontWeight:900, color:accColor }}>{accuracy}%</span>
                </div>
                <div style={{ background:'rgba(28,43,43,0.08)', borderRadius:99, height:10, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:`linear-gradient(90deg,${accColor},${accuracy>=70?'#34D399':accuracy>=50?'#FCD34D':'#F87171'})`, width:`${accuracy}%`, borderRadius:99, transition:'width 1.2s cubic-bezier(.4,0,.2,1)' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                  <span style={{ fontSize:9, fontWeight:700, color:'#B0CCCC' }}>0%</span>
                  <span style={{ fontSize:9, fontWeight:700, color:'#B0CCCC' }}>100%</span>
                </div>
              </div>

              {/* Next badge */}
              {nextBadge && (
                <div style={{ background:'#fff', border:'1px solid rgba(232,103,26,0.2)', borderRadius:16, padding:'13px 15px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 2px 8px rgba(232,103,26,0.08)' }}>
                  <div style={{ fontSize:28, filter:'grayscale(0.5)', opacity:0.75 }}>{nextBadge.emoji}</div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:800, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>पुढील Badge</div>
                    <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B' }}>{nextBadge.label}</div>
                    <div style={{ fontSize:11, color:'#7A9090', fontWeight:600, marginTop:1 }}>{nextBadge.desc}</div>
                  </div>
                  <ChevronRight size={16} style={{ color:'rgba(232,103,26,0.5)', marginLeft:'auto' }} />
                </div>
              )}

              {progress.totalAttempted === 0 && (
                <div style={{ textAlign:'center', padding:'28px', background:'#fff', border:'1px dashed rgba(28,43,43,0.1)', borderRadius:18 }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>📚</div>
                  <div style={{ fontWeight:800, fontSize:14, color:'#1C2B2B', marginBottom:4 }}>अजून सराव नाही!</div>
                  <div style={{ fontSize:12, color:'#7A9090', fontWeight:600 }}>कोणताही विभाग निवडून सराव सुरू करा</div>
                </div>
              )}
            </div>
          )}

          {/* BADGES */}
          {tab === 'badges' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {BADGES.map(b => {
                const earned = b.req(progress);
                return (
                  <div key={b.id} className="pd-badge"
                    style={{ background: earned ? '#fff' : 'rgba(28,43,43,0.04)', border:`1.5px solid ${earned ? 'rgba(232,103,26,0.25)' : 'rgba(28,43,43,0.07)'}`, borderRadius:16, padding:'14px 12px', textAlign:'center', transition:'all 0.2s ease', opacity: earned ? 1 : 0.5, boxShadow: earned ? '0 2px 10px rgba(232,103,26,0.1)' : 'none', animation: earned ? 'pd-pop 0.3s ease' : 'none' }}>
                    <div style={{ fontSize:32, marginBottom:6, filter: earned ? 'none' : 'grayscale(1)' }}>{b.emoji}</div>
                    <div style={{ fontWeight:900, fontSize:12, color: earned ? '#1C2B2B' : '#7A9090', marginBottom:2 }}>{b.label}</div>
                    <div style={{ fontSize:10, color:'#B0CCCC', fontWeight:600, lineHeight:1.4 }}>{b.desc}</div>
                    {earned && <div style={{ marginTop:6, fontSize:9, fontWeight:800, color:'#059669', textTransform:'uppercase', letterSpacing:'0.08em' }}>✓ Earned</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* HISTORY */}
          {tab === 'history' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'#fff', border:'1px solid rgba(28,43,43,0.07)', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(28,43,43,0.05)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                  <span style={{ fontSize:10, fontWeight:800, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.1em' }}>आठवड्याचा सराव</span>
                  <div style={{ display:'flex', gap:8 }}>
                    {[{c:'#10B981',l:'70%+'},{c:'#F59E0B',l:'50-70%'},{c:'#EF4444',l:'<50%'}].map(({c,l}) => (
                      <span key={l} style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, color:'#7A9090' }}>
                        <div style={{ width:6, height:6, borderRadius:2, background:c }} />{l}
                      </span>
                    ))}
                  </div>
                </div>
                <WeekChart history={history} />
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {history.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'24px', color:'#B0CCCC', fontSize:13, fontWeight:700 }}>अजून इतिहास नाही</div>
                ) : [...history].reverse().slice(0, 14).map((d, i) => {
                  const acc    = d.attempted > 0 ? Math.round((d.correct / d.attempted) * 100) : 0;
                  const color  = acc >= 70 ? '#059669' : acc >= 50 ? '#D97706' : '#DC2626';
                  const dateStr = new Date(d.date).toLocaleDateString('mr-IN', { day:'numeric', month:'short', weekday:'short' });
                  return (
                    <div key={i} style={{ background:'#fff', border:'1px solid rgba(28,43,43,0.07)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 1px 6px rgba(28,43,43,0.04)' }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:`${color}12`, border:`1.5px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:11, color, flexShrink:0 }}>
                        {acc}%
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#1C2B2B' }}>{dateStr}</div>
                        <div style={{ fontSize:10, color:'#7A9090', fontWeight:600 }}>{d.attempted} प्रश्न · {d.correct} बरोबर</div>
                      </div>
                      <div style={{ width:`${Math.min(acc,100)}%`, maxWidth:60, height:5, background:color, borderRadius:99, minWidth:4 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

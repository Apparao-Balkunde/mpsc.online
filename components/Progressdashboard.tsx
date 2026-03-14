import React, { useState, useEffect } from 'react';
import {
  Target, TrendingUp, Award, Flame, Calendar,
  ChevronRight, BookOpen, Zap, Trophy, Star, X
} from 'lucide-react';

interface ProgressData {
  totalAttempted: number;
  totalCorrect: number;
  streak: number;
  lastActiveDate: string;
  dailyHistory?: DayData[];
  subjectStats?: Record<string, { attempted: number; correct: number }>;
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
  { id:'first',    label:'पहिली चूक',  emoji:'🎯', desc:'पहिला प्रश्न सोडवला',              req:(p: ProgressData) => p.totalAttempted >= 1     },
  { id:'ten',      label:'दशक',        emoji:'🔟', desc:'10 प्रश्न सोडवले',                 req:(p: ProgressData) => p.totalAttempted >= 10    },
  { id:'fifty',    label:'अर्धशतक',   emoji:'🏏', desc:'50 प्रश्न सोडवले',                 req:(p: ProgressData) => p.totalAttempted >= 50    },
  { id:'century',  label:'शतक',        emoji:'💯', desc:'100 प्रश्न सोडवले',                req:(p: ProgressData) => p.totalAttempted >= 100   },
  { id:'fivehun',  label:'पंचशतक',    emoji:'🌟', desc:'500 प्रश्न सोडवले',                req:(p: ProgressData) => p.totalAttempted >= 500   },
  { id:'thousand', label:'सहस्रक',    emoji:'👑', desc:'1000 प्रश्न सोडवले',               req:(p: ProgressData) => p.totalAttempted >= 1000  },
  { id:'streak3',  label:'हॅटट्रिक',  emoji:'🔥', desc:'3 दिवस streak',                    req:(p: ProgressData) => p.streak >= 3             },
  { id:'streak7',  label:'आठवडा',      emoji:'📅', desc:'7 दिवस streak',                    req:(p: ProgressData) => p.streak >= 7             },
  { id:'streak30', label:'महिना',      emoji:'🏆', desc:'30 दिवस streak',                   req:(p: ProgressData) => p.streak >= 30            },
  { id:'acc70',    label:'अचूक निशाना', emoji:'🎖️', desc:'70%+ accuracy मिळवली',           req:(p: ProgressData) => p.totalAttempted >= 20 && (p.totalCorrect/p.totalAttempted) >= 0.7 },
  { id:'acc90',    label:'तज्ज्ञ',    emoji:'⭐', desc:'90%+ accuracy मिळवली',             req:(p: ProgressData) => p.totalAttempted >= 20 && (p.totalCorrect/p.totalAttempted) >= 0.9 },
  { id:'spardha',  label:'योद्धा',     emoji:'⚔️', desc:'SpardhaYodha खेळला',              req:(p: ProgressData) => !!localStorage.getItem('sy_played') },
];

// Mini bar chart for 7-day history
function WeekChart({ history }: { history: DayData[] }) {
  const last7 = [...history].slice(-7);
  const maxVal = Math.max(...last7.map(d => d.attempted), 1);
  const days = ['र','सो','म','बु','गु','शु','श'];

  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:60, padding:'0 4px' }}>
      {last7.length === 0 ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.2)', fontSize:12, fontWeight:700 }}>
          अजून डेटा नाही — सराव सुरू करा!
        </div>
      ) : last7.map((d, i) => {
        const acc = d.attempted > 0 ? d.correct / d.attempted : 0;
        const barH = Math.max((d.attempted / maxVal) * 100, 4);
        const color = acc >= 0.7 ? '#10B981' : acc >= 0.5 ? '#F59E0B' : acc > 0 ? '#EF4444' : 'rgba(255,255,255,0.08)';
        const date = new Date(d.date);
        const dayLabel = days[date.getDay()];
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ width:'100%', background:'rgba(255,255,255,0.04)', borderRadius:6, height:48, display:'flex', alignItems:'flex-end', overflow:'hidden' }}>
              <div style={{ width:'100%', height:`${barH}%`, background:color, borderRadius:'4px 4px 0 0', transition:'height 0.8s cubic-bezier(.4,0,.2,1)', minHeight:d.attempted>0?4:0 }} />
            </div>
            <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.3)' }}>{dayLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

// Donut chart
function Donut({ correct, total }: { correct: number; total: number }) {
  const pct = total > 0 ? correct / total : 0;
  const r = 36, stroke = 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - pct * circ;
  const color = pct >= 0.7 ? '#10B981' : pct >= 0.5 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ position:'relative', width:88, height:88, flexShrink:0 }}>
      <svg width={88} height={88} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={44} cy={44} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontWeight:900, fontSize:18, color, lineHeight:1 }}>{Math.round(pct * 100)}%</span>
        <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.05em' }}>अचूक</span>
      </div>
    </div>
  );
}

interface Props { onClose: () => void; }

export const ProgressDashboard: React.FC<Props> = ({ onClose }) => {
  const [progress, setProgress] = useState<ProgressData>(loadProgress());
  const [history, setHistory]   = useState<DayData[]>(loadHistory());
  const [tab, setTab]           = useState<'overview' | 'badges' | 'history'>('overview');

  useEffect(() => {
    setProgress(loadProgress());
    setHistory(loadHistory());
  }, []);

  const accuracy = progress.totalAttempted > 0
    ? Math.round((progress.totalCorrect / progress.totalAttempted) * 100)
    : 0;

  const earnedBadges = BADGES.filter(b => b.req(progress));
  const nextBadge = BADGES.find(b => !b.req(progress));

  const CSS = `
    @keyframes pd-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pd-bar { from{height:0} to{height:var(--h)} }
    @keyframes pd-pop { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }
  `;

  const base: React.CSSProperties = {
    position:'fixed', inset:0, zIndex:100,
    background:'rgba(30,20,80,0.78)', backdropFilter:'blur(8px)',
    display:'flex', alignItems:'center', justifyContent:'center', padding:'16px',
  };

  const card: React.CSSProperties = {
    background:'#0F1623', border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:28, width:'100%', maxWidth:500, maxHeight:'88vh',
    overflow:'hidden', display:'flex', flexDirection:'column',
    animation:'pd-fade 0.35s cubic-bezier(.34,1.56,.64,1)',
    fontFamily:"'Poppins','Noto Sans Devanagari',sans-serif", color:'#fff',
  };

  return (
    <div style={base} onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={card}>

        {/* Header */}
        <div style={{ padding:'20px 22px 0', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.07)', paddingBottom:16 }}>
          <div>
            <div style={{ fontWeight:900, fontSize:17, letterSpacing:'-0.03em' }}>माझी प्रगती</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:700, marginTop:1 }}>
              {earnedBadges.length}/{BADGES.length} badges · streak {progress.streak} 🔥
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'7px', cursor:'pointer', color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, padding:'12px 22px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          {(['overview', 'badges', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:'7px 16px', borderRadius:10, fontSize:11, fontWeight:800, cursor:'pointer', border:'none', background: tab===t ? 'rgba(249,115,22,0.15)' : 'transparent', color: tab===t ? '#F97316' : 'rgba(255,255,255,0.35)', borderBottom: tab===t ? '2px solid #F97316' : '2px solid transparent', transition:'all 0.15s' }}>
              {t === 'overview' ? 'Overview' : t === 'badges' ? `Badges (${earnedBadges.length})` : 'History'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 22px 24px' }}>

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Big stats row */}
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <Donut correct={progress.totalCorrect} total={progress.totalAttempted} />
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { l:'एकूण प्रयत्न', v:progress.totalAttempted.toLocaleString(), c:'#3B82F6' },
                    { l:'बरोबर उत्तरे', v:progress.totalCorrect.toLocaleString(), c:'#10B981' },
                    { l:'Streak',        v:`${progress.streak} दिवस 🔥`, c:'#F97316' },
                  ].map(({ l, v, c }) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.03)', border:`1px solid ${c}18`, borderRadius:10, padding:'8px 12px' }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.45)' }}>{l}</span>
                      <span style={{ fontSize:13, fontWeight:900, color:c }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accuracy bar */}
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em' }}>एकूण अचूकता</span>
                  <span style={{ fontSize:13, fontWeight:900, color: accuracy >= 70 ? '#10B981' : accuracy >= 50 ? '#F59E0B' : '#EF4444' }}>{accuracy}%</span>
                </div>
                <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:99, height:8, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:`linear-gradient(90deg, ${accuracy >= 70 ? '#10B981' : accuracy >= 50 ? '#F59E0B' : '#EF4444'}, ${accuracy >= 70 ? '#34D399' : accuracy >= 50 ? '#FCD34D' : '#F87171'})`, width:`${accuracy}%`, borderRadius:99, transition:'width 1.2s cubic-bezier(.4,0,.2,1)' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                  <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.2)' }}>0%</span>
                  <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.2)' }}>100%</span>
                </div>
              </div>

              {/* Next badge */}
              {nextBadge && (
                <div style={{ background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:16, padding:'13px 15px', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ fontSize:28, filter:'grayscale(0.6)', opacity:0.7 }}>{nextBadge.emoji}</div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>पुढील Badge</div>
                    <div style={{ fontWeight:900, fontSize:13, color:'rgba(255,255,255,0.8)' }}>{nextBadge.label}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:600, marginTop:1 }}>{nextBadge.desc}</div>
                  </div>
                  <ChevronRight size={16} style={{ color:'rgba(249,115,22,0.5)', marginLeft:'auto' }} />
                </div>
              )}

              {/* No data nudge */}
              {progress.totalAttempted === 0 && (
                <div style={{ textAlign:'center', padding:'24px', background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(255,255,255,0.07)', borderRadius:16 }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>📚</div>
                  <div style={{ fontWeight:800, fontSize:14, marginBottom:4 }}>अजून सराव नाही!</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', fontWeight:600 }}>कोणताही विभाग निवडून सराव सुरू करा</div>
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
                  <div key={b.id}
                    style={{ background: earned ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', border:`1px solid ${earned ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius:16, padding:'14px 12px', textAlign:'center', animation: earned ? 'pd-pop 0.3s ease' : 'none', opacity: earned ? 1 : 0.45 }}>
                    <div style={{ fontSize:32, marginBottom:6, filter: earned ? 'none' : 'grayscale(1)' }}>{b.emoji}</div>
                    <div style={{ fontWeight:900, fontSize:12, color: earned ? '#fff' : 'rgba(255,255,255,0.4)', marginBottom:2 }}>{b.label}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontWeight:600, lineHeight:1.4 }}>{b.desc}</div>
                    {earned && <div style={{ marginTop:6, fontSize:9, fontWeight:800, color:'#10B981', textTransform:'uppercase', letterSpacing:'0.08em' }}>✓ Earned</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* HISTORY */}
          {tab === 'history' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Week chart */}
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'16px' }}>
                <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12, display:'flex', justifyContent:'space-between' }}>
                  <span>आठवड्याचा सराव</span>
                  <div style={{ display:'flex', gap:8 }}>
                    {[{ c:'#10B981', l:'70%+' },{ c:'#F59E0B', l:'50-70%' },{ c:'#EF4444', l:'<50%' }].map(({ c, l }) => (
                      <span key={l} style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, color:'rgba(255,255,255,0.3)' }}>
                        <div style={{ width:6, height:6, borderRadius:2, background:c }} />{l}
                      </span>
                    ))}
                  </div>
                </div>
                <WeekChart history={history} />
              </div>

              {/* Recent days list */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {history.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'24px', color:'rgba(255,255,255,0.25)', fontSize:13, fontWeight:700 }}>
                    अजून इतिहास नाही
                  </div>
                ) : [...history].reverse().slice(0, 14).map((d, i) => {
                  const acc = d.attempted > 0 ? Math.round((d.correct / d.attempted) * 100) : 0;
                  const color = acc >= 70 ? '#10B981' : acc >= 50 ? '#F59E0B' : '#EF4444';
                  const dateStr = new Date(d.date).toLocaleDateString('mr-IN', { day:'numeric', month:'short', weekday:'short' });
                  return (
                    <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:9, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:11, color, flexShrink:0 }}>
                        {acc}%
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>{dateStr}</div>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:600 }}>{d.attempted} प्रश्न · {d.correct} बरोबर</div>
                      </div>
                      <div style={{ width:`${Math.min(acc, 100)}%`, maxWidth:60, height:4, background:color, borderRadius:99, minWidth:4 }} />
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

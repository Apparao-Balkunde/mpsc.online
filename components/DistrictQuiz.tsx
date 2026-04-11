import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock } from 'lucide-react';

interface Props { onClose: () => void; }

const EXAMS = [
  { id:'rajyaseva', name:'राज्यसेवा पूर्व',   color:'#2563EB', emoji:'🏛️', date:'2025-08-15' },
  { id:'psi',       name:'PSI / STI / ASO',    color:'#7C3AED', emoji:'⚖️', date:'2025-09-20' },
  { id:'groupb',    name:'Combined Group B',   color:'#059669', emoji:'📋', date:'2025-10-10' },
  { id:'groupc',    name:'Combined Group C',   color:'#D97706', emoji:'📝', date:'2025-11-05' },
  { id:'talathi',   name:'तलाठी भरती',          color:'#DC2626', emoji:'🌾', date:'2025-12-01' },
];

const STORAGE_KEY = 'mpsc_exam_dates';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');

  @keyframes ec-fade  { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
  @keyframes ec-shimmer { 0%{background-position:0% center} 100%{background-position:200% center} }
  @keyframes ec-flip-in  { from{opacity:0;transform:translateY(-8px) scaleY(0.7)} to{opacity:1;transform:translateY(0) scaleY(1)} }
  @keyframes ec-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
  @keyframes ec-ring  { 0%{transform:scale(1)} 30%{transform:scale(1.18)} 60%{transform:scale(0.95)} 100%{transform:scale(1)} }
  @keyframes ec-urgent-bg { 0%,100%{background:rgba(220,38,38,0.07)} 50%{background:rgba(220,38,38,0.15)} }

  .ec-digit {
    display:inline-block;
    animation: ec-flip-in 0.28s cubic-bezier(.34,1.56,.64,1);
  }
  .ec-card { transition: box-shadow 0.2s, transform 0.2s; }
  .ec-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.08); transform: translateY(-1px); }
  .ec-date-btn:hover { background:rgba(0,0,0,0.09)!important; }
`;

function getCountdown(dateStr: string) {
  const target = new Date(dateStr).getTime();
  const now    = Date.now();
  const diff   = target - now;
  if (diff <= 0) return null;
  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000)  / 60000);
  const seconds = Math.floor((diff % 60000)    / 1000);
  return { days, hours, minutes, seconds, diff };
}

function getUrgency(days: number | null) {
  if (days === null)  return { label:'परीक्षा झाली', color:'#94A3B8', urgent:false };
  if (days <= 30)     return { label:'लवकरच!',       color:'#DC2626', urgent:true  };
  if (days <= 90)     return { label:'तयारी करा',    color:'#D97706', urgent:false };
  return               { label:'वेळ आहे',             color:'#059669', urgent:false };
}

// Animated single digit block
const Digit: React.FC<{ value: string; color: string }> = ({ value, color }) => {
  const [display, setDisplay] = useState(value);
  const [key, setKey]         = useState(0);

  useEffect(() => {
    if (value !== display) {
      setDisplay(value);
      setKey(k => k + 1);
    }
  }, [value]);

  return (
    <span key={key} className="ec-digit"
      style={{ fontVariantNumeric:'tabular-nums', color, fontWeight:900, fontSize:22, lineHeight:1, letterSpacing:'-0.04em' }}>
      {display}
    </span>
  );
};

// HH:MM:SS live ticker
const LiveTicker: React.FC<{ hours: number; minutes: number; seconds: number; color: string }> = ({ hours, minutes, seconds, color }) => {
  const fmt = (n: number) => String(n).padStart(2, '0');
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2, fontFamily:"'Baloo 2',monospace" }}>
      <Digit value={fmt(hours)[0]}   color={color} /><Digit value={fmt(hours)[1]}   color={color} />
      <span style={{ color:'rgba(0,0,0,0.25)', fontWeight:900, fontSize:18, animation:'ec-pulse 1s step-start infinite', marginBottom:2 }}>:</span>
      <Digit value={fmt(minutes)[0]} color={color} /><Digit value={fmt(minutes)[1]} color={color} />
      <span style={{ color:'rgba(0,0,0,0.25)', fontWeight:900, fontSize:18, animation:'ec-pulse 1s step-start infinite', marginBottom:2 }}>:</span>
      <Digit value={fmt(seconds)[0]} color={color} /><Digit value={fmt(seconds)[1]} color={color} />
    </div>
  );
};

export const ExamCountdown: React.FC<Props> = ({ onClose }) => {
  const [customDates, setCustomDates] = useState<Record<string,string>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [tick, setTick]       = useState(0);

  // 1-second global tick
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const saveDate = (id: string, date: string) => {
    const updated = { ...customDates, [id]: date };
    setCustomDates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setEditing(null);
  };

  const getDateStr = (id: string, def: string) => customDates[id] || def;

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(15,17,23,0.65)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:430, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'ec-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 24px 64px rgba(15,17,23,0.22)' }}>

        {/* shimmer top bar */}
        <div style={{ height:4, background:'linear-gradient(90deg,#2563EB,#7C3AED,#DC2626,#D97706,#059669)', backgroundSize:'300%', animation:'ec-shimmer 4s linear infinite', flexShrink:0 }} />

        {/* Header */}
        <div style={{ padding:'18px 20px 12px', flexShrink:0, borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:'rgba(37,99,235,0.1)', border:'1.5px solid rgba(37,99,235,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Clock size={18} style={{ color:'#2563EB' }} />
              </div>
              <div>
                <div style={{ fontWeight:900, fontSize:16, color:'#1C2B2B' }}>Exam Countdown</div>
                <div style={{ fontSize:11, color:'#7A9090', fontWeight:600 }}>Live countdown · दर सेकंदाला अपडेट</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'#F1F5F9', border:'none', borderRadius:9, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Exam cards */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
          {EXAMS.map(exam => {
            const dateStr  = getDateStr(exam.id, exam.date);
            const countdown = getCountdown(dateStr);
            const urgency  = getUrgency(countdown ? countdown.days : null);
            const isEdit   = editing === exam.id;
            const pct      = countdown ? Math.max(0, Math.min(100, 100 - (countdown.diff / (365 * 86400000)) * 100)) : 100;

            return (
              <div key={exam.id} className="ec-card"
                style={{
                  background: urgency.urgent ? undefined : '#FAFBFF',
                  animation: urgency.urgent ? 'ec-urgent-bg 2s ease infinite' : undefined,
                  border: `1.5px solid ${exam.color}30`,
                  borderRadius: 18,
                  padding: '14px 16px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>

                {/* left color accent */}
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:exam.color, borderRadius:'18px 0 0 18px' }} />

                <div style={{ marginLeft:8 }}>
                  {/* Top row: name + days big */}
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <span style={{ fontSize:22, lineHeight:1, animation: urgency.urgent ? 'ec-ring 1.5s ease infinite' : undefined, display:'inline-block' }}>{exam.emoji}</span>
                      <div>
                        <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B', lineHeight:1.2 }}>{exam.name}</div>
                        <div style={{ fontSize:10, fontWeight:700, color:urgency.color, marginTop:2 }}>{urgency.label}</div>
                      </div>
                    </div>

                    {/* Big days number */}
                    {countdown ? (
                      <div style={{ textAlign:'right' }}>
                        <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                          <span style={{ fontWeight:900, fontSize:36, color:exam.color, letterSpacing:'-0.06em', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
                            {String(countdown.days).split('').map((d, i) => (
                              <span key={`${countdown.days}-${i}`} className="ec-digit">{d}</span>
                            ))}
                          </span>
                          <span style={{ fontSize:11, fontWeight:800, color:'#94A3B8', marginBottom:2 }}>दिवस</span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize:22 }}>✅</span>
                    )}
                  </div>

                  {/* Live HH:MM:SS ticker */}
                  {countdown && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                      <div style={{ background:`${exam.color}12`, border:`1px solid ${exam.color}25`, borderRadius:10, padding:'5px 10px', display:'flex', alignItems:'center', gap:8 }}>
                        <LiveTicker hours={countdown.hours} minutes={countdown.minutes} seconds={countdown.seconds} color={exam.color} />
                        <span style={{ fontSize:9, fontWeight:700, color:'#94A3B8', letterSpacing:'0.05em' }}>HH MM SS</span>
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  {countdown && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:5, overflow:'hidden' }}>
                        <div style={{ height:'100%', background:`linear-gradient(90deg,${exam.color}80,${exam.color})`, borderRadius:99, width:`${pct}%`, transition:'width 1s linear' }} />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
                        <span style={{ fontSize:9, fontWeight:700, color:'#94A3B8' }}>सुरुवात</span>
                        <span style={{ fontSize:9, fontWeight:700, color:exam.color }}>{Math.round(pct)}% वेळ निघाला</span>
                        <span style={{ fontSize:9, fontWeight:700, color:'#94A3B8' }}>परीक्षा</span>
                      </div>
                    </div>
                  )}

                  {/* Date edit */}
                  {isEdit ? (
                    <div style={{ display:'flex', gap:8 }}>
                      <input type="date"
                        defaultValue={dateStr}
                        onChange={e => e.target.value && saveDate(exam.id, e.target.value)}
                        style={{ flex:1, background:'#fff', border:`1.5px solid ${exam.color}60`, borderRadius:10, padding:'7px 12px', fontSize:13, fontWeight:700, color:'#1C2B2B', outline:'none', fontFamily:'inherit' }} />
                      <button onClick={() => setEditing(null)}
                        style={{ background:'rgba(0,0,0,0.06)', border:'none', borderRadius:10, padding:'7px 12px', cursor:'pointer', fontSize:12, fontWeight:800, color:'#7A9090', fontFamily:'inherit' }}>
                        रद्द
                      </button>
                    </div>
                  ) : (
                    <button className="ec-date-btn" onClick={() => setEditing(exam.id)}
                      style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'6px 11px', fontSize:11, fontWeight:700, color:'#7A9090', cursor:'pointer', fontFamily:'inherit' }}>
                      <Calendar size={11} />
                      {dateStr} · तारीख बदला
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Tip */}
          <div style={{ background:'rgba(37,99,235,0.04)', border:'1px solid rgba(37,99,235,0.12)', borderRadius:14, padding:'11px 15px', marginTop:2 }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#2563EB', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>💡 टीप</div>
            <p style={{ fontSize:11, color:'#4A6060', fontWeight:600, lineHeight:1.6, margin:0 }}>
              Official तारीख जाहीर झाल्यावर "तारीख बदला" वर tap करा. Countdown live चालू राहतो.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

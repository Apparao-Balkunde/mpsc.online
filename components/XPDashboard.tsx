import React, { useState } from 'react';
import { X, Star, Trophy, Zap, ChevronRight } from 'lucide-react';
import { getXPData, getLevel, getNextLevel, getXPProgress, BADGES } from '../services/xpSystem';

interface Props { onClose: () => void; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes xp-fade { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes xp-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes xp-pop { 0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1} }
  @keyframes xp-float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
`;

export const XPDashboard: React.FC<Props> = ({ onClose }) => {
  const data     = getXPData();
  const level    = getLevel(data.xp);
  const next     = getNextLevel(data.xp);
  const progress = getXPProgress(data.xp);

  const allBadges = BADGES.map(b => ({ ...b, earned: data.badges.includes(b.id) }));
  const earnedCount = allBadges.filter(b => b.earned).length;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:440, maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'xp-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>

        {/* Top shimmer bar */}
        <div style={{ height:4, background:`linear-gradient(90deg,${level.color},#F5C842,${level.color})`, backgroundSize:'200%', animation:'xp-shimmer 2s linear infinite', flexShrink:0 }} />

        {/* Header */}
        <div style={{ padding:'20px 20px 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:`${level.color}20`, border:`1.5px solid ${level.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                {level.emoji}
              </div>
              <div>
                <div style={{ fontWeight:900, fontSize:16, color:'#1C2B2B', letterSpacing:'-0.03em' }}>XP & Levels</div>
                <div style={{ fontSize:11, color:'#7A9090', fontWeight:600 }}>तुमची प्रगती</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}>
              <X size={15} />
            </button>
          </div>

          {/* Level card */}
          <div style={{ background:`linear-gradient(135deg,${level.color}15,${level.color}08)`, border:`1.5px solid ${level.color}30`, borderRadius:20, padding:'20px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:level.color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>Level {level.level}</div>
                <div style={{ fontSize:22, fontWeight:900, color:'#1C2B2B', letterSpacing:'-0.04em', display:'flex', alignItems:'center', gap:8 }}>
                  {level.emoji} {level.name}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontWeight:900, fontSize:28, color:level.color, letterSpacing:'-0.04em', animation:'xp-pop 0.5s cubic-bezier(.34,1.56,.64,1)' }}>{data.xp}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'#7A9090' }}>Total XP</div>
              </div>
            </div>

            {/* XP Progress bar */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:10, fontWeight:700, color:'#7A9090' }}>Progress</span>
                <span style={{ fontSize:10, fontWeight:800, color:level.color }}>
                  {next ? `${next.minXP - data.xp} XP → Level ${next.level}` : '🏆 MAX LEVEL!'}
                </span>
              </div>
              <div style={{ background:'rgba(0,0,0,0.08)', borderRadius:99, height:10, overflow:'hidden' }}>
                <div style={{ height:'100%', background:`linear-gradient(90deg,${level.color},${level.color}99)`, borderRadius:99, width:`${progress}%`, transition:'width 1s ease', boxShadow:`0 0 8px ${level.color}50` }} />
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:'#7A9090', marginTop:5, textAlign:'center' }}>{progress}% पूर्ण</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            {[
              { l:'Badges मिळवले', v:`${earnedCount}/${BADGES.length}`, c:'#D97706', bg:'rgba(217,119,6,0.08)', border:'rgba(217,119,6,0.2)' },
              { l:'Next Level', v:next ? `${next.emoji} ${next.name}` : '👑 Max!', c:'#7C3AED', bg:'rgba(124,58,237,0.08)', border:'rgba(124,58,237,0.2)' },
            ].map(({ l,v,c,bg,border }) => (
              <div key={l} style={{ background:bg, border:`1px solid ${border}`, borderRadius:14, padding:'12px 14px' }}>
                <div style={{ fontWeight:900, fontSize:15, color:c, marginBottom:2 }}>{v}</div>
                <div style={{ fontSize:9, fontWeight:700, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 20px 20px' }}>
          <div style={{ fontSize:12, fontWeight:800, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>
            🏅 Badges ({earnedCount}/{BADGES.length})
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {allBadges.map(b => (
              <div key={b.id} style={{ background: b.earned ? 'rgba(232,103,26,0.06)' : '#F8F5F0', border:`1px solid ${b.earned ? 'rgba(232,103,26,0.2)' : 'rgba(0,0,0,0.06)'}`, borderRadius:14, padding:'12px 12px', display:'flex', alignItems:'center', gap:10, opacity: b.earned ? 1 : 0.5 }}>
                <div style={{ fontSize:24, flexShrink:0, filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.emoji}</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:11, color: b.earned ? '#1C2B2B' : '#7A9090', lineHeight:1.2 }}>{b.name}</div>
                  <div style={{ fontSize:9, color:'#A8A29E', fontWeight:600, marginTop:2, lineHeight:1.3 }}>{b.desc}</div>
                  <div style={{ fontSize:9, fontWeight:800, color: b.earned ? '#E8671A' : '#A8A29E', marginTop:2 }}>+{b.xp} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

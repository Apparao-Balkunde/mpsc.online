import React from 'react';
import { Home, Calendar, Layers, BarChart2, Grid } from 'lucide-react';

interface Props {
  active: string;
  onNav: (tab: string) => void;
  dailyDone?: boolean;
}

const CSS = `
  @keyframes bn-pop { 0%{transform:scale(0.8)}60%{transform:scale(1.15)}100%{transform:scale(1)} }
  .bn-tab:active { transform: scale(0.92); }
`;

export const BottomNav: React.FC<Props> = ({ active, onNav, dailyDone }) => {
  const tabs = [
    { id:'HOME',      icon:Home,    label:'Home',    emoji:'' },
    { id:'DAILY',     icon:Calendar,label:'Daily',   emoji: dailyDone ? '✅' : '📅' },
    { id:'FLASHCARD', icon:Layers,  label:'Cards',   emoji:'🎴' },
    { id:'PROGRESS',  icon:BarChart2,label:'प्रगती', emoji:'' },
    { id:'MORE',      icon:Grid,    label:'More',    emoji:'' },
  ];

  return (
    <>
      <style>{CSS}</style>
      {/* Spacer to prevent content hiding behind nav */}
      <div style={{ height:72 }} />
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:100,
        background:'rgba(255,255,255,0.97)', backdropFilter:'blur(16px)',
        borderTop:'1px solid rgba(0,0,0,0.08)',
        boxShadow:'0 -4px 24px rgba(0,0,0,0.08)',
        display:'flex', alignItems:'center',
        padding:'8px 0 max(8px, env(safe-area-inset-bottom))',
        fontFamily:"'Baloo 2',sans-serif",
      }}>
        {tabs.map(({ id, icon:Icon, label, emoji }) => {
          const isActive = active === id;
          return (
            <button key={id} className="bn-tab"
              onClick={() => onNav(id)}
              style={{
                flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                background:'none', border:'none', cursor:'pointer', padding:'6px 4px',
                transition:'all 0.15s ease',
              }}>
              <div style={{
                width:40, height:40, borderRadius:12,
                background: isActive ? 'rgba(232,103,26,0.12)' : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 0.2s ease',
                animation: isActive ? 'bn-pop 0.3s ease' : 'none',
                position:'relative',
              }}>
                {emoji ? (
                  <span style={{ fontSize:20 }}>{emoji}</span>
                ) : (
                  <Icon size={20} style={{ color: isActive ? '#E8671A' : '#94A3B8' }} />
                )}
                {id === 'DAILY' && !dailyDone && (
                  <div style={{ position:'absolute', top:4, right:4, width:7, height:7, borderRadius:'50%', background:'#DC2626', border:'1.5px solid #fff' }} />
                )}
              </div>
              <span style={{ fontSize:9, fontWeight: isActive ? 900 : 600, color: isActive ? '#E8671A' : '#94A3B8', letterSpacing:'0.02em' }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

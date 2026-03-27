import React from 'react';
import { X, Brain, Clock, Trophy, Layers, Heart, Users, BarChart2, Bookmark, LogIn, LogOut } from 'lucide-react';

interface Props {
  onClose: () => void;
  onNav: (mode: string) => void;
  onShowSupport: () => void;
  onShowLeaderboard: () => void;
  onShowProgress: () => void;
  onLogin: () => void;
  onLogout: () => void;
  user: any;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes mm-slide { from{transform:translateY(100%)}to{transform:translateY(0)} }
  .mm-item:active { background:rgba(0,0,0,0.05) !important; }
`;

export const MoreMenu: React.FC<Props> = ({ onClose, onNav, onShowSupport, onShowLeaderboard, onShowProgress, onLogin, onLogout, user }) => {
  const items = [
    { emoji:'🎯', label:'Smart Revision',    sub:'चुकलेले प्रश्न',     onClick:() => { onNav('REVISION');  onClose(); } },
    { emoji:'📊', label:'Exam Countdown',    sub:'परीक्षेचे दिवस',     onClick:() => { onNav('COUNTDOWN'); onClose(); } },
    { emoji:'🏆', label:'Friend Challenge',  sub:'मित्राला challenge',  onClick:() => { onNav('CHALLENGE'); onClose(); } },
    { emoji:'📅', label:'Daily Challenge',   sub:'रोजचे 5 प्रश्न',     onClick:() => { onNav('DAILY');     onClose(); } },
    { emoji:'🔖', label:'Bookmarks',         sub:'जतन केलेले',         onClick:() => { onNav('BOOKMARKS'); onClose(); } },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.4)', backdropFilter:'blur(4px)', zIndex:200 }}
        onClick={onClose} />
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:201,
        background:'#fff', borderRadius:'24px 24px 0 0',
        padding:'12px 20px max(20px, env(safe-area-inset-bottom))',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.12)',
        animation:'mm-slide 0.3s cubic-bezier(.34,1.2,.64,1)',
        fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",
        maxHeight:'80vh', overflowY:'auto',
      }}>
        {/* Handle */}
        <div style={{ width:40, height:4, borderRadius:99, background:'rgba(0,0,0,0.12)', margin:'0 auto 16px' }} />

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ fontWeight:900, fontSize:16, color:'#1C2B2B' }}>More</div>
          <button onClick={onClose} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}>
            <X size={15} />
          </button>
        </div>

        {/* User section */}
        <div style={{ background:'#FDF6EC', border:'1px solid rgba(232,103,26,0.15)', borderRadius:16, padding:'14px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {user ? (
            <>
              <div>
                <div style={{ fontWeight:800, fontSize:13, color:'#1C2B2B' }}>{user.email?.split('@')[0]}</div>
                <div style={{ fontSize:10, fontWeight:600, color:'#7A9090' }}>Cloud Sync ON ✅</div>
              </div>
              <button onClick={() => { onLogout(); onClose(); }}
                style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(0,0,0,0.06)', border:'none', borderRadius:10, padding:'8px 12px', color:'#7A9090', fontWeight:800, fontSize:11, cursor:'pointer' }}>
                <LogOut size={13} /> Logout
              </button>
            </>
          ) : (
            <>
              <div>
                <div style={{ fontWeight:800, fontSize:13, color:'#1C2B2B' }}>Login करा</div>
                <div style={{ fontSize:10, fontWeight:600, color:'#7A9090' }}>Progress save होईल</div>
              </div>
              <button onClick={() => { onLogin(); onClose(); }}
                style={{ display:'flex', alignItems:'center', gap:5, background:'linear-gradient(135deg,#3B82F6,#2563EB)', border:'none', borderRadius:10, padding:'9px 14px', color:'#fff', fontWeight:900, fontSize:11, cursor:'pointer' }}>
                <LogIn size={13} /> Login
              </button>
            </>
          )}
        </div>

        {/* Menu items */}
        <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:16 }}>
          {items.map(({ emoji, label, sub, onClick }) => (
            <button key={label} className="mm-item" onClick={onClick}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:14, background:'#F8F5F0', border:'none', cursor:'pointer', textAlign:'left', transition:'all 0.15s', width:'100%' }}>
              <span style={{ fontSize:22, flexShrink:0 }}>{emoji}</span>
              <div>
                <div style={{ fontWeight:800, fontSize:13, color:'#1C2B2B' }}>{label}</div>
                <div style={{ fontSize:10, fontWeight:600, color:'#7A9090' }}>{sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
          <button onClick={() => { onShowProgress(); onClose(); }}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'rgba(232,103,26,0.08)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:14, padding:'12px', color:'#C4510E', fontWeight:800, fontSize:12, cursor:'pointer' }}>
            <BarChart2 size={15} /> प्रगती
          </button>
          <button onClick={() => { onShowLeaderboard(); onClose(); }}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'rgba(217,119,6,0.08)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:14, padding:'12px', color:'#B45309', fontWeight:800, fontSize:12, cursor:'pointer' }}>
            <Users size={15} /> Leaderboard
          </button>
        </div>

        {/* Support */}
        <button onClick={() => { onShowSupport(); onClose(); }}
          style={{ width:'100%', background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 20px rgba(232,103,26,0.3)' }}>
          <Heart size={15} fill="#fff" /> सपोर्ट करा — ₹29 पासून
        </button>
      </div>
    </>
  );
};

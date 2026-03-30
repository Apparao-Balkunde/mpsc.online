import React, { useState } from 'react';
import { X, Share2, Check, Copy, Trophy } from 'lucide-react';

interface Props {
  onClose: () => void;
  score?: number;
  total?: number;
  mode?: string;
}

const CSS = `
  @keyframes ws-fade { from{opacity:0;transform:scale(0.93) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes ws-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  .ws-btn:hover { transform: translateY(-2px) !important; }
`;

export const WhatsAppShare: React.FC<Props> = ({ onClose, score=0, total=10, mode='Quiz' }) => {
  const [copied, setCopied] = useState(false);
  const pct = Math.round((score/total)*100);
  const emoji = pct===100?'🏆':pct>=80?'⭐':pct>=60?'💪':'📚';

  const progress = JSON.parse(localStorage.getItem('mpsc_user_progress')||'{}');
  const acc = progress.totalAttempted>0 ? Math.round((progress.totalCorrect/progress.totalAttempted)*100) : pct;
  const streak = progress.streak || 0;

  const shareText = `${emoji} *MPSC सारथी* वर आज ${mode} मध्ये ${score}/${total} score मिळवला!

📊 अचूकता: *${acc}%*
🔥 Streak: *${streak} दिवस*
${pct>=80 ? '🏆 उत्कृष्ट कामगिरी!' : pct>=60 ? '💪 चांगली प्रगती!' : '📚 सराव चालू आहे!'}

तुम्हीपण free मध्ये practice करा 👇
🌐 *mpscsarathi.online*

#MPSC #Maharashtra #मराठी`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const copy = () => {
    navigator.clipboard.writeText(shareText).catch(()=>{});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:380, overflow:'hidden', animation:'ws-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#25D366,#128C7E)', backgroundSize:'200%', animation:'ws-shimmer 3s linear infinite' }}/>
        <div style={{ padding:'24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:8 }}>
              <Share2 size={16} style={{color:'#25D366'}}/> Score Share करा
            </div>
            <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}><X size={14}/></button>
          </div>

          {/* Score badge */}
          <div style={{ background:'linear-gradient(135deg,#F0FDF4,#DCFCE7)', border:'1.5px solid rgba(37,211,102,0.3)', borderRadius:18, padding:'20px', textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:40, marginBottom:6 }}>{emoji}</div>
            <div style={{ fontWeight:900, fontSize:28, color:'#059669', letterSpacing:'-0.04em' }}>{score}/{total}</div>
            <div style={{ fontSize:13, color:'#7A9090', fontWeight:700 }}>{pct}% अचूकता · {mode}</div>
          </div>

          {/* Message preview */}
          <div style={{ background:'#F8F5F0', borderRadius:14, padding:'14px', marginBottom:16, fontSize:12, color:'#4A6060', fontWeight:600, lineHeight:1.7, whiteSpace:'pre-wrap', maxHeight:120, overflowY:'auto' }}>
            {shareText}
          </div>

          {/* Buttons */}
          <a href={waLink} target="_blank" rel="noreferrer" className="ws-btn"
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer', textDecoration:'none', marginBottom:10, boxShadow:'0 6px 20px rgba(37,211,102,0.3)', transition:'all 0.2s' }}>
            📤 WhatsApp वर Share करा
          </a>
          <button onClick={copy} className="ws-btn"
            style={{ width:'100%', background:copied?'rgba(5,150,105,0.08)':'#F8F5F0', border:`1px solid ${copied?'rgba(5,150,105,0.3)':'rgba(0,0,0,0.1)'}`, borderRadius:14, padding:'12px', color:copied?'#059669':'#7A9090', fontWeight:800, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, transition:'all 0.2s' }}>
            {copied ? <><Check size={14}/> Copied!</> : <><Copy size={14}/> Message Copy करा</>}
          </button>
        </div>
      </div>
    </div>
  );
};

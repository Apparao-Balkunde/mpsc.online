import React, { useState } from 'react';
import { X, Heart, Coffee, Check, Zap, Star, Gift } from 'lucide-react';

interface Props { onClose: () => void; }

const AMOUNTS = [
  { value: 29,  label: '₹29',  tag: 'चहा ☕',       color: '#E8671A', bg: '#FFF7ED', border: '#FDBA74' },
  { value: 49,  label: '₹49',  tag: 'सपोर्ट 💪',    color: '#0D6B6E', bg: '#F0FDFA', border: '#99F6E4' },
  { value: 99,  label: '₹99',  tag: 'Hero 🦁',       color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD' },
  { value: 199, label: '₹199', tag: 'Legend 👑',      color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
];

const PERKS = [
  { e: '🚀', t: 'Server costs cover होतात' },
  { e: '📚', t: 'नवीन questions add होतात' },
  { e: '🤖', t: 'AI features improve होतात' },
  { e: '❤️', t: 'तुमचं नाव Supporters list मध्ये' },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes sp-fade { from{opacity:0;transform:scale(0.93) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes sp-spin { to{transform:rotate(360deg)} }
  @keyframes sp-heart { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
  @keyframes sp-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes sp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  .sp-amt:hover { transform:translateY(-3px) !important; }
  .sp-paid:hover { transform:translateY(-2px) !important; }
  .sp-custom:focus { border-color:#E8671A !important; box-shadow:0 0 0 3px rgba(232,103,26,0.12) !important; outline:none; }
`;

export function SupportModal({ onClose }: Props) {
  const [selected, setSelected] = useState<number>(49);
  const [custom, setCustom]     = useState('');
  const [paid, setPaid]         = useState(false);
  const [name, setName]         = useState('');

  const finalAmt = custom && parseFloat(custom) > 0 ? parseFloat(custom) : selected;
  const upiLink  = `upi://pay?pa=apparaobalkunde901@oksbi&pn=MPSC%20Sarathi&am=${finalAmt}&cu=INR&tn=MPSC+Sarathi+Support`;

  if (paid) return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20, fontFamily:"'Baloo 2',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, padding:'40px 28px', width:'100%', maxWidth:360, textAlign:'center', animation:'sp-fade 0.4s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ fontSize:64, animation:'sp-heart 1s ease infinite', display:'inline-block', marginBottom:16 }}>❤️</div>
        <h2 style={{ fontWeight:900, fontSize:22, color:'#1C2B2B', margin:'0 0 8px' }}>धन्यवाद! 🙏</h2>
        <p style={{ fontSize:13, color:'#7A9090', fontWeight:600, lineHeight:1.6, marginBottom:20 }}>
          ₹{finalAmt} च्या सपोर्टबद्दल मनापासून आभारी आहोत!<br />
          {name && <span>— <strong style={{ color:'#E8671A' }}>{name}</strong></span>}
        </p>
        <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:16, padding:'14px', marginBottom:20 }}>
          <p style={{ fontSize:12, color:'#166534', fontWeight:700, margin:0 }}>
            तुमचा support MPSC aspirants साठी खूप महत्त्वाचा आहे! 💪
          </p>
        </div>
        <button onClick={onClose}
          style={{ width:'100%', background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:15, cursor:'pointer', boxShadow:'0 6px 20px rgba(232,103,26,0.3)' }}>
          अभ्यास सुरू करा 🚀
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20, fontFamily:"'Baloo 2',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:400, animation:'sp-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)', overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }}>

        {/* Top gradient bar */}
        <div style={{ height:4, background:'linear-gradient(90deg,#E8671A,#F5C842,#0D6B6E,#7C3AED)', backgroundSize:'200%', animation:'sp-shimmer 3s linear infinite' }} />

        <div style={{ padding:'24px 24px 28px' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <div style={{ width:36, height:36, borderRadius:12, background:'linear-gradient(135deg,#E8671A,#C4510E)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(232,103,26,0.3)', animation:'sp-float 3s ease infinite' }}>
                  <Heart size={18} fill="#fff" color="#fff" />
                </div>
                <h2 style={{ fontWeight:900, fontSize:18, color:'#1C2B2B', margin:0, letterSpacing:'-0.03em' }}>
                  सपोर्ट करा
                </h2>
              </div>
              <p style={{ fontSize:11, color:'#7A9090', fontWeight:600, margin:0 }}>
                तुमचा सपोर्ट = माझं मोटिव्हेशन!
              </p>
            </div>
            <button onClick={onClose}
              style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:32, height:32, color:'#7A9090', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <X size={15} />
            </button>
          </div>

          {/* Perks */}
          <div style={{ background:'#FDF6EC', border:'1px solid rgba(232,103,26,0.15)', borderRadius:16, padding:'14px 16px', marginBottom:20 }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>तुमच्या सपोर्टमुळे</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {PERKS.map(({ e, t }) => (
                <div key={t} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:16 }}>{e}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:'#4A6060', lineHeight:1.3 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Amount selection */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>रक्कम निवडा</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              {AMOUNTS.map(({ value, label, tag, color, bg, border }) => {
                const isSel = selected === value && !custom;
                return (
                  <button key={value} onClick={() => { setSelected(value); setCustom(''); }} className="sp-amt"
                    style={{ padding:'12px 10px', borderRadius:14, border:`1.5px solid ${isSel ? color : 'rgba(28,43,43,0.1)'}`, background:isSel ? bg : '#fff', cursor:'pointer', textAlign:'center', transition:'all 0.18s', boxShadow:isSel ? `0 4px 16px ${color}20` : '0 2px 8px rgba(0,0,0,0.04)', position:'relative', overflow:'hidden' }}>
                    {isSel && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:color }} />}
                    <div style={{ fontWeight:900, fontSize:18, color:isSel ? color : '#1C2B2B', lineHeight:1 }}>{label}</div>
                    <div style={{ fontSize:10, fontWeight:700, color:isSel ? color : '#7A9090', marginTop:3 }}>{tag}</div>
                    {isSel && <Check size={12} style={{ color, position:'absolute', top:8, right:8 }} />}
                  </button>
                );
              })}
            </div>

            {/* Custom amount */}
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontWeight:800, fontSize:15, color:'#7A9090' }}>₹</span>
              <input type="number" placeholder="इतर रक्कम टाका..." value={custom}
                onChange={e => { setCustom(e.target.value); }}
                className="sp-custom"
                style={{ width:'100%', background:custom ? '#FDF6EC' : '#F8F5F0', border:`1.5px solid ${custom ? '#E8671A' : 'rgba(28,43,43,0.1)'}`, borderRadius:12, paddingLeft:36, paddingRight:14, paddingTop:12, paddingBottom:12, color:'#1C2B2B', fontSize:14, fontWeight:700, boxSizing:'border-box', fontFamily:"'Baloo 2',sans-serif", transition:'all 0.2s' }} />
            </div>
          </div>

          {/* Name input */}
          <input placeholder="तुमचं नाव (optional)" value={name}
            onChange={e => setName(e.target.value)}
            style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(28,43,43,0.1)', borderRadius:12, padding:'11px 14px', color:'#1C2B2B', fontSize:13, fontWeight:600, boxSizing:'border-box', marginBottom:16, fontFamily:"'Baloo 2',sans-serif", outline:'none' }} />

          {/* Amount display */}
          <div style={{ background:'linear-gradient(135deg,rgba(232,103,26,0.08),rgba(245,200,66,0.08))', border:'1px solid rgba(232,103,26,0.2)', borderRadius:14, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#4A6060' }}>एकूण रक्कम:</span>
            <span style={{ fontSize:22, fontWeight:900, color:'#E8671A' }}>₹{finalAmt}</span>
          </div>

          {/* Pay button */}
          <a href={upiLink}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'linear-gradient(135deg,#E8671A,#C4510E)', borderRadius:16, padding:'16px', color:'#fff', fontWeight:900, fontSize:15, textDecoration:'none', boxShadow:'0 8px 24px rgba(232,103,26,0.35)', marginBottom:10, letterSpacing:'-0.02em' }}>
            <Coffee size={18} /> GPay / PhonePe / UPI वर पाठवा
          </a>

          <button onClick={() => setPaid(true)} className="sp-paid"
            style={{ width:'100%', background:'rgba(5,150,105,0.08)', border:'1.5px solid rgba(5,150,105,0.25)', borderRadius:14, padding:'13px', color:'#059669', fontWeight:900, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.18s' }}>
            <Check size={15} /> मी पेमेंट केले ✅
          </button>

          {/* UPI ID */}
          <div style={{ marginTop:14, textAlign:'center', padding:'10px', background:'#F8F5F0', borderRadius:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#7A9090', marginBottom:4 }}>UPI ID</div>
            <div style={{ fontSize:13, fontWeight:900, color:'#1C2B2B', letterSpacing:'0.02em' }}>apparaobalkunde901@oksbi</div>
          </div>
        </div>
      </div>
    </div>
  );
}

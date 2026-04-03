import React, { useState, useEffect } from 'react';
import { X, Gift, Copy, Check, Users, Coins } from 'lucide-react';

interface Props { onClose: () => void; user?: any; }
const CSS = `@keyframes ref-fade{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}} @keyframes ref-shimmer{0%{background-position:-200% center}100%{background-position:200% center}} @keyframes ref-pop{0%{transform:scale(0.8)}60%{transform:scale(1.1)}100%{transform:scale(1)}}`;

export const ReferralSystem: React.FC<Props> = ({ onClose, user }) => {
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<string[]>([]);
  const [coins, setCoins] = useState(0);
  const [claimed, setClaimed] = useState(false);

  const refCode = user ? `MPSC${(user.email||'USER').replace('@','').replace('.','').slice(0,6).toUpperCase()}` : 'MPSCGUEST';
  const refLink = `${window.location.origin}?ref=${refCode}`;

  useEffect(() => {
    try {
      const refs = JSON.parse(localStorage.getItem(`referrals_${refCode}`)||'[]');
      setReferrals(refs);
      setCoins(parseInt(localStorage.getItem('mpsc_coins')||'0'));
      // Check if someone used ref code on this device
      const usedRef = localStorage.getItem('mpsc_used_ref');
      if (usedRef && usedRef !== refCode) {
        // Award coins to referrer (local simulation)
        const allRefs = JSON.parse(localStorage.getItem(`referrals_${usedRef}`)||'[]');
        if (!allRefs.includes(refCode)) {
          allRefs.push(refCode);
          localStorage.setItem(`referrals_${usedRef}`, JSON.stringify(allRefs));
        }
      }
    } catch {}
    // Check URL for ref code
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref !== refCode) localStorage.setItem('mpsc_used_ref', ref);
  }, []);

  const copy = () => { navigator.clipboard.writeText(refLink).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const whatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`🎓 MPSC सारथी — Maharashtra's #1 Free MPSC App!\n\nमाझ्या referral link वरून join करा आणि free मध्ये practice करा:\n${refLink}\n\n#MPSC #Maharashtra`)}`, '_blank');
  const claimCoins = () => {
    if (referrals.length === 0 || claimed) return;
    const bonus = referrals.length * 50;
    const newCoins = coins + bonus;
    setCoins(newCoins);
    localStorage.setItem('mpsc_coins', String(newCoins));
    setClaimed(true);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:400, overflow:'hidden', animation:'ref-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#F5C842,#E8671A,#7C3AED)', backgroundSize:'200%', animation:'ref-shimmer 3s linear infinite' }}/>
        <div style={{ padding:'20px 20px 0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:8 }}><Gift size={17} style={{color:'#E8671A'}}/> Referral System</div>
            <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}><X size={14}/></button>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
            {[
              { l:'Referrals', v:referrals.length, c:'#7C3AED', e:'👥' },
              { l:'Earned', v:`${referrals.length*50}🪙`, c:'#D97706', e:'🪙' },
              { l:'Total Coins', v:coins, c:'#E8671A', e:'💰' },
            ].map(({l,v,c,e}) => (
              <div key={l} style={{ background:`${c}10`, border:`1px solid ${c}20`, borderRadius:12, padding:'12px 8px', textAlign:'center' }}>
                <div style={{ fontSize:18, marginBottom:2 }}>{e}</div>
                <div style={{ fontWeight:900, fontSize:15, color:c }}>{v}</div>
                <div style={{ fontSize:8, fontWeight:700, color:'#7A9090', textTransform:'uppercase', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Ref code */}
          <div style={{ background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:14, padding:'14px', marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>तुमचा Referral Code</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontWeight:900, fontSize:20, color:'#E8671A', letterSpacing:'0.1em' }}>{refCode}</div>
              <button onClick={copy} style={{ display:'flex', alignItems:'center', gap:5, background:copied?'rgba(5,150,105,0.1)':'rgba(0,0,0,0.06)', border:'none', borderRadius:9, padding:'6px 12px', cursor:'pointer', fontSize:11, fontWeight:800, color:copied?'#059669':'#7A9090' }}>
                {copied?<><Check size={11}/>Copied!</>:<><Copy size={11}/>Copy Link</>}
              </button>
            </div>
          </div>

          {/* Rewards info */}
          <div style={{ background:'rgba(245,200,66,0.08)', border:'1px solid rgba(245,200,66,0.25)', borderRadius:12, padding:'12px 14px', marginBottom:14, fontSize:12, fontWeight:700, color:'#92400E', lineHeight:1.6 }}>
            🎁 प्रत्येक referral = <strong style={{color:'#D97706'}}>50 coins</strong> तुम्हाला + <strong style={{color:'#D97706'}}>20 coins</strong> मित्राला!
          </div>

          <button onClick={whatsapp}
            style={{ width:'100%', background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:8 }}>
            📤 WhatsApp वर Share करा
          </button>

          {referrals.length > 0 && !claimed && (
            <button onClick={claimCoins}
              style={{ width:'100%', background:'linear-gradient(135deg,#F5C842,#D97706)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer', animation:'ref-pop 0.3s ease', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
              🪙 {referrals.length*50} Coins Claim करा!
            </button>
          )}
          {claimed && <div style={{ textAlign:'center', fontSize:13, fontWeight:800, color:'#059669', padding:'8px' }}>✅ Coins Claimed!</div>}
        </div>
        <div style={{ padding:'0 20px 20px' }}/>
      </div>
    </div>
  );
};

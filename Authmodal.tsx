import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mail, ArrowRight, Shield, Loader, X, Check } from 'lucide-react';

interface Props { onClose: () => void; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes am-fade { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes am-spin { to{transform:rotate(360deg)} }
  @keyframes am-shake { 0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)} }
  .am-input:focus { border-color:#E8671A !important; box-shadow:0 0 0 3px rgba(232,103,26,0.12) !important; outline:none; }
  .am-btn-primary:hover  { transform:translateY(-2px) !important; box-shadow:0 10px 28px rgba(232,103,26,0.4) !important; }
  .am-btn-verify:hover   { transform:translateY(-2px) !important; box-shadow:0 10px 28px rgba(13,107,110,0.4) !important; }
  .am-btn-back:hover     { color:#E8671A !important; }
`;

export function AuthModal({ onClose }: Props) {
  const { sendOTP, verifyOTP } = useAuth();
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [step, setStep]       = useState<'email'|'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [shake, setShake]     = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) { setError('Valid email टाका'); triggerShake(); return; }
    setLoading(true); setError('');
    try { await sendOTP(email); setStep('otp'); }
    catch (e: any) { setError(e.message || 'OTP पाठवता आले नाही'); triggerShake(); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) { setError('6 digit OTP टाका'); triggerShake(); return; }
    setLoading(true); setError('');
    try { await verifyOTP(email, otp); onClose(); }
    catch (e: any) { setError('OTP चुकीचा आहे, पुन्हा प्रयत्न करा'); triggerShake(); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.6)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div style={{ background:'#fff', borderRadius:28, padding:'36px 28px', width:'100%', maxWidth:380, position:'relative', animation:'am-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.2)', border:'1px solid rgba(28,43,43,0.07)', animationFillMode: shake ? 'am-shake 0.4s ease' : 'none' }}>

        {/* Close button */}
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'#FDF6EC', border:'1px solid rgba(28,43,43,0.1)', borderRadius:9, width:32, height:32, color:'#7A9090', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X size={15} />
        </button>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background: step==='email' ? 'linear-gradient(135deg,rgba(232,103,26,0.15),rgba(232,103,26,0.08))' : 'linear-gradient(135deg,rgba(13,107,110,0.15),rgba(13,107,110,0.08))', border:`1.5px solid ${step==='email' ? 'rgba(232,103,26,0.3)' : 'rgba(13,107,110,0.3)'}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:`0 4px 16px ${step==='email' ? 'rgba(232,103,26,0.15)' : 'rgba(13,107,110,0.15)'}` }}>
            {step==='email' ? <Mail size={26} style={{ color:'#E8671A' }} /> : <Shield size={26} style={{ color:'#0D6B6E' }} />}
          </div>
          <h2 style={{ fontWeight:900, fontSize:20, margin:'0 0 6px', color:'#1C2B2B', letterSpacing:'-0.03em' }}>
            {step==='email' ? 'लॉगिन करा' : 'OTP verify करा'}
          </h2>
          <p style={{ fontSize:12, color:'#7A9090', fontWeight:600, margin:0, lineHeight:1.5 }}>
            {step==='email' ? 'Email वर OTP येईल — password नको!' : `${email} वर 6-digit OTP पाठवला`}
          </p>
        </div>

        {/* Email step */}
        {step==='email' && (
          <>
            <input type="email" placeholder="तुमचा Gmail टाका" className="am-input"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleSendOTP()}
              style={{ width:'100%', background:'#FDF6EC', border:'1.5px solid rgba(28,43,43,0.1)', borderRadius:12, padding:'13px 16px', color:'#1C2B2B', fontSize:14, fontWeight:600, boxSizing:'border-box', marginBottom:12, fontFamily:"'Baloo 2',sans-serif", transition:'all 0.2s' }}
              autoFocus />
            <button onClick={handleSendOTP} disabled={loading} className="am-btn-primary"
              style={{ width:'100%', background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:12, padding:'14px', color:'#fff', fontWeight:900, fontSize:14, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:loading?.7:1, boxShadow:'0 6px 20px rgba(232,103,26,0.3)', transition:'all 0.2s ease', fontFamily:"'Baloo 2',sans-serif" }}>
              {loading ? <Loader size={16} style={{ animation:'am-spin 1s linear infinite' }} /> : <><ArrowRight size={16} /> OTP पाठवा</>}
            </button>
          </>
        )}

        {/* OTP step */}
        {step==='otp' && (
          <>
            <div style={{ background:'rgba(13,107,110,0.06)', border:'1px solid rgba(13,107,110,0.15)', borderRadius:12, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <Mail size={14} style={{ color:'#0D6B6E', flexShrink:0 }} />
              <span style={{ fontSize:12, fontWeight:700, color:'#0D6B6E' }}>{email}</span>
            </div>
            <input type="text" inputMode="numeric" placeholder="6-digit OTP" className="am-input"
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
              onKeyDown={e => e.key==='Enter' && handleVerifyOTP()}
              style={{ width:'100%', background:'#FDF6EC', border:'1.5px solid rgba(28,43,43,0.1)', borderRadius:12, padding:'13px 16px', color:'#1C2B2B', fontSize:28, fontWeight:900, boxSizing:'border-box', marginBottom:12, textAlign:'center', letterSpacing:'0.4em', fontFamily:'monospace', transition:'all 0.2s', animation:shake?'am-shake 0.4s ease':'' }}
              autoFocus maxLength={6} />

            {/* OTP dots indicator */}
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:16 }}>
              {[...Array(6)].map((_,i) => (
                <div key={i} style={{ width:10, height:10, borderRadius:'50%', background: i < otp.length ? '#0D6B6E' : 'rgba(28,43,43,0.1)', transition:'background 0.2s', transform: i < otp.length ? 'scale(1.2)' : 'scale(1)' }} />
              ))}
            </div>

            <button onClick={handleVerifyOTP} disabled={loading} className="am-btn-verify"
              style={{ width:'100%', background:'linear-gradient(135deg,#0D6B6E,#094D50)', border:'none', borderRadius:12, padding:'14px', color:'#fff', fontWeight:900, fontSize:14, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:10, opacity:loading?.7:1, boxShadow:'0 6px 20px rgba(13,107,110,0.3)', transition:'all 0.2s ease', fontFamily:"'Baloo 2',sans-serif" }}>
              {loading ? <Loader size={16} style={{ animation:'am-spin 1s linear infinite' }} /> : <><Check size={16} /> Verify करा</>}
            </button>
            <button onClick={() => { setStep('email'); setOtp(''); setError(''); }} className="am-btn-back"
              style={{ width:'100%', background:'none', border:'none', color:'#7A9090', fontSize:12, fontWeight:700, cursor:'pointer', padding:'6px', transition:'color 0.15s', fontFamily:"'Baloo 2',sans-serif" }}>
              ← Email बदला / पुन्हा पाठवा
            </button>
          </>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop:12, background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#DC2626', fontWeight:700, textAlign:'center', animation:'am-shake 0.4s ease' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Benefits */}
        {step==='email' && (
          <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:8, padding:'16px', background:'#FDF6EC', borderRadius:14, border:'1px solid rgba(28,43,43,0.07)' }}>
            {[
              { t:'Progress cloud मध्ये save होईल', c:'#059669' },
              { t:'Leaderboard मध्ये दिसाल',        c:'#E8671A' },
              { t:'सर्व devices वर sync',            c:'#0D6B6E' },
            ].map(({ t, c }) => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#4A6060', fontWeight:600 }}>
                <span style={{ width:20, height:20, borderRadius:'50%', background:`${c}15`, border:`1px solid ${c}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Check size={11} style={{ color:c }} />
                </span>
                {t}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

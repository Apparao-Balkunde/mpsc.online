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
  .am-btn-google:hover   { transform:translateY(-2px) !important; background:#FDF6EC !important; border-color:#E8671A !important; }
  .am-btn-verify:hover   { transform:translateY(-2px) !important; box-shadow:0 10px 28px rgba(13,107,110,0.4) !important; }
  .am-btn-back:hover     { color:#E8671A !important; }
`;

export function AuthModal({ onClose }: Props) {
  // useAuth मधून signInWithGoogle पण काढून घे
  const { sendOTP, verifyOTP, signInWithGoogle } = useAuth();
  const [email, setEmail]     = useState('');
  const [otp, setOtp]           = useState('');
  const [step, setStep]       = useState<'email'|'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError]       = useState('');
  const [shake, setShake]       = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // Google redirect करेल, त्यामुळे onClose ची गरज नाही, पण सेफ्टीसाठी:
    } catch (e: any) {
      setError('Google लॉगिन यशस्वी झाले नाही');
      triggerShake();
    } finally {
      setLoading(false);
    }
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

        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'#FDF6EC', border:'1px solid rgba(28,43,43,0.1)', borderRadius:9, width:32, height:32, color:'#7A9090', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X size={15} />
        </button>

        <div style={{ textAlign:'center', marginBottom:24 }}>
          <h2 style={{ fontWeight:900, fontSize:22, margin:'0 0 6px', color:'#1C2B2B', letterSpacing:'-0.03em' }}>
            {step==='email' ? 'स्वागत आहे!' : 'OTP verify करा'}
          </h2>
          <p style={{ fontSize:13, color:'#7A9090', fontWeight:600, margin:0 }}>
            {step==='email' ? 'एक क्लिकवर लॉगिन करा' : `${email} वर OTP पाठवला`}
          </p>
        </div>

        {step==='email' && (
          <>
            {/* Google Direct Login Button */}
            <button 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="am-btn-google"
              style={{ width:'100%', background:'#fff', border:'2px solid rgba(28,43,43,0.1)', borderRadius:14, padding:'14px', color:'#1C2B2B', fontWeight:800, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all 0.2s ease', marginBottom:18 }}
            >
              <img src="https://www.google.com/favicon.ico" style={{ width:18 }} alt="G" />
              Google ने थेट लॉगिन करा
            </button>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <div style={{ flex:1, height:1, background:'rgba(28,43,43,0.08)' }}></div>
              <span style={{ fontSize:11, fontWeight:800, color:'#7A9090', textTransform:'uppercase' }}>किंवा</span>
              <div style={{ flex:1, height:1, background:'rgba(28,43,43,0.08)' }}></div>
            </div>

            {/* Email OTP Section */}
            <input type="email" placeholder="तुमचा Email टाका" className="am-input"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleSendOTP()}
              style={{ width:'100%', background:'#FDF6EC', border:'1.5px solid rgba(28,43,43,0.1)', borderRadius:12, padding:'13px 16px', color:'#1C2B2B', fontSize:14, fontWeight:600, marginBottom:12, fontFamily:"'Baloo 2',sans-serif" }}
            />
            <button onClick={handleSendOTP} disabled={loading} className="am-btn-primary"
              style={{ width:'100%', background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:12, padding:'14px', color:'#fff', fontWeight:900, fontSize:14, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 20px rgba(232,103,26,0.3)', transition:'all 0.2s ease' }}>
              {loading ? <Loader size={16} style={{ animation:'am-spin 1s linear infinite' }} /> : 'OTP पाठवा'}
            </button>
          </>
        )}

        {step==='otp' && (
          <>
            <input type="text" inputMode="numeric" placeholder="6-digit OTP" className="am-input"
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
              onKeyDown={e => e.key==='Enter' && handleVerifyOTP()}
              style={{ width:'100%', background:'#FDF6EC', border:'1.5px solid rgba(28,43,43,0.1)', borderRadius:12, padding:'13px 16px', color:'#1C2B2B', fontSize:28, fontWeight:900, marginBottom:16, textAlign:'center', letterSpacing:'0.4em', fontFamily:'monospace' }}
              autoFocus />
            <button onClick={handleVerifyOTP} disabled={loading} className="am-btn-verify"
              style={{ width:'100%', background:'linear-gradient(135deg,#0D6B6E,#094D50)', border:'none', borderRadius:12, padding:'14px', color:'#fff', fontWeight:900, fontSize:14, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:10 }}>
              {loading ? <Loader size={16} style={{ animation:'am-spin 1s linear infinite' }} /> : 'Verify करा'}
            </button>
            <button onClick={() => setStep('email')} className="am-btn-back" style={{ width:'100%', background:'none', border:'none', color:'#7A9090', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              ← मागे जा
            </button>
          </>
        )}

        {error && (
          <div style={{ marginTop:12, background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:10, padding:'10px', fontSize:12, color:'#DC2626', fontWeight:700, textAlign:'center' }}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
}

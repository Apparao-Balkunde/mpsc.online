import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mail, ArrowRight, Shield, Loader } from 'lucide-react';

interface Props { onClose: () => void; }

export function AuthModal({ onClose }: Props) {
  const { sendOTP, verifyOTP } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) { setError('Valid email टाका'); return; }
    setLoading(true); setError('');
    try {
      await sendOTP(email);
      setStep('otp');
    } catch (e: any) {
      setError(e.message || 'OTP पाठवता आले नाही');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) { setError('6 digit OTP टाका'); return; }
    setLoading(true); setError('');
    try {
      await verifyOTP(email, otp);
      onClose();
    } catch (e: any) {
      setError('OTP चुकीचा आहे, पुन्हा प्रयत्न करा');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: '#0F1420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '36px 28px', width: '100%', maxWidth: 380, position: 'relative' }}>

        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            {step === 'email' ? <Mail size={24} color="#818CF8" /> : <Shield size={24} color="#818CF8" />}
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 20, margin: '0 0 6px', fontFamily: "'Poppins',sans-serif" }}>
            {step === 'email' ? 'लॉगिन करा' : 'OTP verify करा'}
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, margin: 0 }}>
            {step === 'email' ? 'Email वर OTP येईल — password नको!' : `${email} वर 6-digit OTP पाठवला`}
          </p>
        </div>

        {step === 'email' ? (
          <>
            <input
              type="email" placeholder="तुमचा Gmail टाका"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box', marginBottom: 12, fontFamily: "'Poppins',sans-serif" }}
              autoFocus
            />
            <button onClick={handleSendOTP} disabled={loading}
              style={{ width: '100%', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><ArrowRight size={16} /> OTP पाठवा</>}
            </button>
          </>
        ) : (
          <>
            <input
              type="text" inputMode="numeric" placeholder="6-digit OTP"
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 22, fontWeight: 900, outline: 'none', boxSizing: 'border-box', marginBottom: 12, textAlign: 'center', letterSpacing: '0.3em', fontFamily: 'monospace' }}
              autoFocus
            />
            <button onClick={handleVerifyOTP} disabled={loading}
              style={{ width: '100%', background: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10, opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Shield size={16} /> Verify करा</>}
            </button>
            <button onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '6px' }}>
              Email बदला / पुन्हा पाठवा
            </button>
          </>
        )}

        {error && (
          <div style={{ marginTop: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#FCA5A5', fontWeight: 600, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Benefits */}
        {step === 'email' && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Progress cloud मध्ये save होईल', 'Leaderboard मध्ये दिसाल', 'सर्व devices वर sync'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                <span style={{ color: '#10B981', fontSize: 14 }}>✓</span> {t}
              </div>
            ))}
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

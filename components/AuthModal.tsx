import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader, X } from 'lucide-react';

interface Props { onClose: () => void; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes am-fade { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
  @keyframes am-spin { to{transform:rotate(360deg)} }
  @keyframes am-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
  @keyframes am-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }

  .am-google-btn {
    width: 100%;
    background: #fff;
    border: 2px solid rgba(28,43,43,0.12);
    border-radius: 16px;
    padding: 16px 20px;
    color: #1C2B2B;
    font-weight: 800;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    transition: all 0.2s ease;
    font-family: 'Baloo 2', sans-serif;
    position: relative;
    overflow: hidden;
  }
  .am-google-btn:hover:not(:disabled) {
    background: #FDF6EC !important;
    border-color: #E8671A !important;
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(232,103,26,0.2);
  }
  .am-google-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .am-shake { animation: am-shake 0.4s ease !important; }
`;

// Google logo SVG (official colors)
const GoogleLogo = () => (
  <svg width="22" height="22" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export function AuthModal({ onClose }: Props) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [shake, setShake]     = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // Google OAuth redirect होईल — page दुसऱ्या ठिकाणी जाईल
      // onClose ची गरज नाही
    } catch (e: any) {
      setError('Google लॉगिन होऊ शकले नाही. पुन्हा प्रयत्न करा.');
      triggerShake();
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(28,43,43,0.65)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 20,
        fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif",
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <style>{CSS}</style>

      <div
        className={shake ? 'am-shake' : ''}
        style={{
          background: '#fff',
          borderRadius: 28,
          padding: '40px 28px 32px',
          width: '100%', maxWidth: 360,
          position: 'relative',
          animation: 'am-fade 0.35s cubic-bezier(.34,1.56,.64,1)',
          boxShadow: '0 24px 64px rgba(28,43,43,0.22)',
          border: '1px solid rgba(28,43,43,0.07)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: '#F5F0E8', border: '1px solid rgba(28,43,43,0.08)',
            borderRadius: 10, width: 32, height: 32,
            color: '#7A9090', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <X size={15} />
        </button>

        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg,#E8671A,#C4510E)',
            borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(232,103,26,0.3)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', lineHeight: 1.2, textAlign: 'center' }}>
              MPSC<br/>सारथी
            </span>
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 22, margin: '0 0 6px', color: '#1C2B2B', letterSpacing: '-0.03em' }}>
            स्वागत आहे! 🎯
          </h2>
          <p style={{ fontSize: 13, color: '#7A9090', fontWeight: 600, margin: 0 }}>
            तुमच्या Google account ने login करा
          </p>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="am-google-btn"
        >
          {loading ? (
            <>
              <Loader size={20} style={{ animation: 'am-spin 0.8s linear infinite', color: '#E8671A' }} />
              <span style={{ color: '#7A9090' }}>Redirecting to Google...</span>
            </>
          ) : (
            <>
              <GoogleLogo />
              <span>Google ने Login करा</span>
            </>
          )}
        </button>

        {/* Benefits */}
        <div style={{
          marginTop: 20,
          background: '#F5F0E8',
          borderRadius: 14,
          padding: '12px 16px',
        }}>
          {[
            '✅ Progress cloud मध्ये save होतो',
            '✅ Leaderboard मध्ये rank दिसतो',
            '✅ सर्व devices वर sync',
          ].map(text => (
            <div key={text} style={{ fontSize: 12, fontWeight: 700, color: '#5A7070', marginBottom: 4 }}>
              {text}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 14,
            background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 10, padding: '10px 14px',
            fontSize: 12, color: '#DC2626', fontWeight: 700, textAlign: 'center',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Skip */}
        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 14,
            background: 'none', border: 'none',
            color: '#B0C0C0', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', padding: '6px',
          }}
        >
          आत्ता नको — Guest म्हणून सुरू ठेवा
        </button>
      </div>
    </div>
  );
}

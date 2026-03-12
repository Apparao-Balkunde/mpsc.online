import React, { useState } from 'react';
import { X, LogIn, Loader2, Shield, Cloud, Trophy, Sparkles } from 'lucide-react';
import { signInWithGoogle } from '../hooks/useAuth';

const CSS = `
  @keyframes am-fade { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes am-spin  { to{transform:rotate(360deg)} }
  @keyframes am-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
  .am-google:hover:not([disabled]) { transform:translateY(-2px)!important; box-shadow:0 12px 40px rgba(66,133,244,0.35)!important; }
  .am-close:hover { background:rgba(255,255,255,0.12)!important; }
`;

const BENEFITS = [
  { icon: Cloud,    label: 'Progress Cloud Sync', desc: 'कोणत्याही device वर data safe' },
  { icon: Trophy,   label: 'Public Leaderboard',  desc: 'Top scorers मध्ये नाव या'     },
  { icon: Sparkles, label: 'AI Features',          desc: 'AI स्पष्टीकरण unlimited'      },
  { icon: Shield,   label: '100% Free',            desc: 'कोणताही charge नाही'          },
];

interface Props { onClose: () => void; }

export const AuthModal: React.FC<Props> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      await signInWithGoogle();
      // redirect happens automatically
    } catch (e: any) {
      setError('Login failed. पुन्हा प्रयत्न करा.');
      setLoading(false);
    }
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    fontFamily: "'Poppins','Noto Sans Devanagari',sans-serif",
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background: '#0F1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '32px 28px', width: '100%', maxWidth: 400, animation: 'am-fade 0.4s cubic-bezier(.34,1.56,.64,1)', color: '#fff', position: 'relative' }}>

        {/* Close */}
        <button className="am-close" onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
          <X size={15} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🎓</div>
          <h2 style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
            MPSC सारथी मध्ये Login करा
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, margin: 0 }}>
            तुमची प्रगती save करा, Leaderboard वर या
          </p>
        </div>

        {/* Benefits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {BENEFITS.map(({ icon: Icon, label, desc }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} style={{ color: '#F97316' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 12, color: '#fff' }}>{label}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', fontWeight: 600, marginTop: 1 }}>{desc}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 14 }}>✓</div>
            </div>
          ))}
        </div>

        {/* Google Login Button */}
        <button className="am-google" disabled={loading} onClick={handleGoogle}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#fff', border: 'none', borderRadius: 14, padding: '14px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 900, fontSize: 14, color: '#1a1a1a', transition: 'all 0.2s ease', boxShadow: '0 4px 20px rgba(66,133,244,0.2)', opacity: loading ? 0.7 : 1 }}>
          {loading ? (
            <Loader2 size={20} style={{ animation: 'am-spin 0.8s linear infinite', color: '#4285F4' }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Login होत आहे...' : 'Google ने Login करा'}
        </button>

        {error && (
          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 11, color: '#EF4444', fontWeight: 700 }}>{error}</div>
        )}

        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 600, lineHeight: 1.6 }}>
          Login केल्याने तुम्ही आमच्या Privacy Policy ला सहमत आहात.<br />
          तुमचा data कधीही विकला जाणार नाही.
        </p>
      </div>
    </div>
  );
};

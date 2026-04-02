import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Check, Loader, Shield } from 'lucide-react';

interface Props { onClose: () => void; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes am-fade { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes am-spin { to{transform:rotate(360deg)} }
  .am-google:hover { transform:translateY(-2px) !important; box-shadow:0 8px 24px rgba(0,0,0,0.15) !important; }
`;

export function AuthModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const signInWithGoogle = async () => {
    setLoading(true); setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { access_type: 'offline', prompt: 'consent' }
        }
      });
      if (error) throw error;
      // Google popup उघडेल — redirect होईल
    } catch (e: any) {
      setError(e.message || 'Login होऊ शकले नाही');
      setLoading(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.6)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div style={{ background:'#fff', borderRadius:28, padding:'36px 28px', width:'100%', maxWidth:360, position:'relative', animation:'am-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.2)' }}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'#F8F5F0', border:'none', borderRadius:9, width:32, height:32, color:'#7A9090', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X size={15}/>
        </button>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:48, marginBottom:10 }}>📚</div>
          <h2 style={{ fontWeight:900, fontSize:22, margin:'0 0 6px', color:'#1C2B2B', letterSpacing:'-0.03em' }}>
            MPSC सारथी
          </h2>
          <p style={{ fontSize:13, color:'#7A9090', fontWeight:600, margin:0 }}>
            Login करा — Progress save होईल
          </p>
        </div>

        {/* Google Button */}
        <button onClick={signInWithGoogle} disabled={loading} className="am-google"
          style={{ width:'100%', background:'#fff', border:'2px solid rgba(0,0,0,0.12)', borderRadius:14, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'center', gap:12, cursor:loading?'not-allowed':'pointer', transition:'all 0.2s ease', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:16, opacity:loading?0.7:1 }}>
          {loading ? (
            <div style={{ width:20, height:20, border:'2px solid rgba(0,0,0,0.2)', borderTopColor:'#4285F4', borderRadius:'50%', animation:'am-spin 0.8s linear infinite' }}/>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span style={{ fontWeight:900, fontSize:15, color:'#1C2B2B' }}>
            {loading ? 'Redirecting...' : 'Google ने Login करा'}
          </span>
        </button>

        {error && (
          <div style={{ background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:12, padding:'10px 14px', fontSize:12, color:'#DC2626', fontWeight:700, textAlign:'center', marginBottom:14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Benefits */}
        <div style={{ background:'#FDF6EC', borderRadius:14, padding:'14px 16px', border:'1px solid rgba(232,103,26,0.1)' }}>
          {[
            '✅ Progress cloud मध्ये save होईल',
            '🏆 Leaderboard मध्ये दिसाल',
            '📱 सर्व devices वर sync',
          ].map(t => (
            <div key={t} style={{ fontSize:12, color:'#4A6060', fontWeight:600, marginBottom:6, lastChild:{marginBottom:0} }}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

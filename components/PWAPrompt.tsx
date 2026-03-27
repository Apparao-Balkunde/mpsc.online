import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

const CSS = `
  @keyframes pwa-slide { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes pwa-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
`;

export const PWAPrompt: React.FC = () => {
  const [show, setShow]           = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS]         = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('pwa_dismissed')) return;

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 3000); // Show after 3 seconds
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS — show after delay
    if (ios) {
      setTimeout(() => setShow(true), 5000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
    }
    setShow(false);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('pwa_dismissed', '1');
  };

  if (!show || installed) return null;

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        position:'fixed', bottom:80, left:12, right:12, zIndex:999,
        background:'#fff', borderRadius:22, padding:'18px 18px',
        boxShadow:'0 8px 40px rgba(0,0,0,0.15)', border:'1px solid rgba(232,103,26,0.2)',
        animation:'pwa-slide 0.4s cubic-bezier(.34,1.56,.64,1)',
        fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",
      }}>
        {/* Top shimmer */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#E8671A,#F5C842,#E8671A)', backgroundSize:'200%', animation:'pwa-shimmer 2s linear infinite', borderRadius:'22px 22px 0 0' }} />

        <button onClick={dismiss} style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.05)', border:'none', borderRadius:7, width:26, height:26, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8' }}>
          <X size={13} />
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#E8671A,#C4510E)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(232,103,26,0.3)', flexShrink:0 }}>
            <Smartphone size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:2 }}>MPSC सारथी Install करा!</div>
            <div style={{ fontSize:11, color:'#7A9090', fontWeight:600 }}>App सारखा अनुभव — Offline पण चालेल</div>
          </div>
        </div>

        {isIOS ? (
          <div style={{ background:'#FDF6EC', border:'1px solid rgba(232,103,26,0.15)', borderRadius:14, padding:'12px 14px', marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#4A6060', lineHeight:1.65 }}>
              Safari मध्ये खालून <strong style={{ color:'#E8671A' }}>Share</strong> button दाबा → <strong style={{ color:'#E8671A' }}>"Add to Home Screen"</strong> निवडा
            </div>
          </div>
        ) : (
          <button onClick={handleInstall}
            style={{ width:'100%', background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 20px rgba(232,103,26,0.3)', marginBottom:8 }}>
            <Download size={16} /> Install करा — Free!
          </button>
        )}

        <button onClick={dismiss} style={{ width:'100%', background:'none', border:'none', fontSize:11, fontWeight:700, color:'#94A3B8', cursor:'pointer', padding:'4px' }}>
          नको, browser मध्येच वापरतो
        </button>
      </div>
    </>
  );
};

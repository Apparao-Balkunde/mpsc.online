import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';

const CSS = `
  @keyframes pn-fade { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes pn-slide { from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1} }
`;

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'; // placeholder

export const PushNotifications: React.FC = () => {
  const [supported, setSupported]   = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const sup = 'Notification' in window && 'serviceWorker' in navigator;
    setSupported(sup);
    if (sup) {
      // Check if already subscribed
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub);
        });
      }).catch(()=>{});
      // Show banner after 30 seconds if not subscribed
      const t = setTimeout(() => {
        if (Notification.permission === 'default') setShowBanner(true);
      }, 30000);
      return () => clearTimeout(t);
    }
  }, []);

  const subscribe = async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setShowBanner(false); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });

      // Save to server
      await fetch('/api/push/subscribe', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ subscription: sub.toJSON(), userId: localStorage.getItem('mpsc_user_id') || 'anon' })
      }).catch(()=>{});

      setSubscribed(true);
      setShowBanner(false);
      localStorage.setItem('mpsc_push_enabled', 'true');
    } catch(e) { console.error('Push subscribe failed:', e); }
    finally { setLoading(false); }
  };

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      setSubscribed(false);
      localStorage.removeItem('mpsc_push_enabled');
    } catch {}
  };

  if (!supported) return null;

  return (
    <>
      <style>{CSS}</style>
      {/* Banner */}
      {showBanner && !subscribed && (
        <div style={{ position:'fixed', bottom:80, left:12, right:12, zIndex:998, background:'#fff', borderRadius:20, padding:'16px 18px', boxShadow:'0 8px 32px rgba(0,0,0,0.12)', border:'1px solid rgba(232,103,26,0.2)', animation:'pn-slide 0.4s cubic-bezier(.34,1.56,.64,1)', fontFamily:"'Baloo 2',sans-serif", display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#E8671A,#C4510E)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Bell size={18} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B', marginBottom:2 }}>Daily Reminder चालू करा! 📚</div>
            <div style={{ fontSize:11, fontWeight:600, color:'#7A9090' }}>रोज अभ्यासाची reminder मिळेल</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={subscribe} disabled={loading}
              style={{ background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:10, padding:'8px 14px', color:'#fff', fontWeight:900, fontSize:11, cursor:'pointer' }}>
              {loading ? '...' : 'हो'}
            </button>
            <button onClick={()=>setShowBanner(false)}
              style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:10, padding:'8px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}>
              <X size={13}/>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Notification toggle button — use in settings/more menu
export const NotificationToggle: React.FC = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [supported] = useState('Notification' in window);

  useEffect(() => {
    setSubscribed(localStorage.getItem('mpsc_push_enabled') === 'true');
  }, []);

  if (!supported) return null;

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:subscribed?'rgba(5,150,105,0.06)':'rgba(0,0,0,0.04)', borderRadius:12, cursor:'pointer' }}
      onClick={() => subscribed ? setSubscribed(false) : Notification.requestPermission().then(p => { if(p==='granted') { setSubscribed(true); localStorage.setItem('mpsc_push_enabled','true'); } })}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {subscribed ? <Bell size={15} style={{color:'#059669'}}/> : <BellOff size={15} style={{color:'#7A9090'}}/>}
        <span style={{ fontSize:12, fontWeight:700, color: subscribed?'#059669':'#7A9090' }}>
          {subscribed ? 'Notifications ON ✓' : 'Notifications OFF'}
        </span>
      </div>
      <div style={{ width:36, height:20, borderRadius:99, background:subscribed?'#059669':'rgba(0,0,0,0.15)', position:'relative', transition:'background 0.3s' }}>
        <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left:subscribed?18:2, transition:'left 0.3s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
      </div>
    </div>
  );
};

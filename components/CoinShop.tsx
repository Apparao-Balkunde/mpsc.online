import React, { useState, useEffect } from 'react';
import { X, Coins, Star, Check, Lock, Zap, Gift } from 'lucide-react';

interface Props { onClose: () => void; }

const COIN_KEY = 'mpsc_coins';
const OWNED_KEY = 'mpsc_owned_themes';
const ACTIVE_KEY = 'mpsc_active_theme';

const THEMES = [
  { id:'default',  name:'Classic Cream',  price:0,    preview:'#F5F0E8', emoji:'🍦', desc:'Default light theme' },
  { id:'midnight', name:'Midnight Dark',  price:100,  preview:'#0F0F1A', emoji:'🌙', desc:'Dark mode, easy on eyes' },
  { id:'forest',   name:'Forest Green',   price:150,  preview:'#064E3B', emoji:'🌿', desc:'Calm green theme' },
  { id:'sunset',   name:'Sunset Orange',  price:200,  preview:'#7C2D12', emoji:'🌅', desc:'Warm sunset colors' },
  { id:'ocean',    name:'Ocean Blue',     price:250,  preview:'#0C4A6E', emoji:'🌊', desc:'Deep blue theme' },
  { id:'royal',    name:'Royal Purple',   price:500,  preview:'#3B0764', emoji:'👑', desc:'Premium royal theme' },
];

// Earn coins: 1 correct = 2 coins, daily challenge = 20 coins
export function addCoins(amount: number) {
  const cur = parseInt(localStorage.getItem(COIN_KEY)||'0');
  localStorage.setItem(COIN_KEY, String(cur+amount));
}

const CSS = `
  @keyframes cs-fade { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes cs-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes cs-pop { 0%{transform:scale(0.8)}60%{transform:scale(1.1)}100%{transform:scale(1)} }
  .cs-card:hover { transform:translateY(-3px) !important; }
`;

export const CoinShop: React.FC<Props> = ({ onClose }) => {
  const [coins, setCoins]       = useState(0);
  const [owned, setOwned]       = useState<string[]>(['default']);
  const [active, setActive]     = useState('default');
  const [bought, setBought]     = useState<string|null>(null);

  useEffect(() => {
    setCoins(parseInt(localStorage.getItem(COIN_KEY)||'0'));
    setOwned(JSON.parse(localStorage.getItem(OWNED_KEY)||'["default"]'));
    setActive(localStorage.getItem(ACTIVE_KEY)||'default');
  }, []);

  const buy = (theme: typeof THEMES[0]) => {
    if (coins < theme.price || owned.includes(theme.id)) return;
    const newCoins = coins - theme.price;
    const newOwned = [...owned, theme.id];
    setCoins(newCoins);
    setOwned(newOwned);
    localStorage.setItem(COIN_KEY, String(newCoins));
    localStorage.setItem(OWNED_KEY, JSON.stringify(newOwned));
    setBought(theme.id);
    setTimeout(() => setBought(null), 2000);
  };

  const activate = (id: string) => {
    setActive(id);
    localStorage.setItem(ACTIVE_KEY, id);
    // Apply theme (could be used in App.tsx)
    document.documentElement.setAttribute('data-theme', id);
  };

  const howToEarn = [
    { a:'✅ Quiz बरोबर', c:'+2 coins/प्रश्न' },
    { a:'📅 Daily Challenge', c:'+20 coins' },
    { a:'🔥 7-day streak', c:'+50 coins' },
    { a:'🏆 Tournament', c:'+100 coins' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:440, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'cs-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#F5C842,#E8671A,#7C3AED)', backgroundSize:'200%', animation:'cs-shimmer 3s linear infinite', flexShrink:0 }}/>

        <div style={{ padding:'18px 20px', flexShrink:0, borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:12, background:'linear-gradient(135deg,#F5C842,#D97706)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:18 }}>🪙</span>
            </div>
            <div>
              <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B' }}>Coin Shop</div>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ fontSize:18 }}>🪙</span>
                <span style={{ fontWeight:900, fontSize:16, color:'#D97706' }}>{coins}</span>
                <span style={{ fontSize:10, fontWeight:600, color:'#7A9090' }}>coins</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}><X size={15}/></button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
          {/* How to earn */}
          <div style={{ background:'rgba(245,200,66,0.08)', border:'1px solid rgba(245,200,66,0.25)', borderRadius:14, padding:'12px', marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#92400E', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>🪙 Coins कसे मिळतात?</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {howToEarn.map(({a,c}) => (
                <div key={a} style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:700 }}>
                  <span style={{ color:'#4A6060' }}>{a}</span>
                  <span style={{ color:'#D97706' }}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Themes */}
          <div style={{ fontWeight:800, fontSize:12, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>🎨 Themes</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {THEMES.map(theme => {
              const isOwned  = owned.includes(theme.id);
              const isActive = active === theme.id;
              const canBuy   = coins >= theme.price && !isOwned;
              return (
                <div key={theme.id} className="cs-card"
                  style={{ borderRadius:18, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.08)', border:`2px solid ${isActive?'#E8671A':'rgba(0,0,0,0.08)'}`, transition:'all 0.2s', animation:bought===theme.id?'cs-pop 0.4s ease':'none' }}>
                  {/* Preview */}
                  <div style={{ height:60, background:theme.preview, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
                    {theme.emoji}
                  </div>
                  <div style={{ padding:'12px', background:'#fff' }}>
                    <div style={{ fontWeight:900, fontSize:12, color:'#1C2B2B', marginBottom:2 }}>{theme.name}</div>
                    <div style={{ fontSize:9, color:'#7A9090', fontWeight:600, marginBottom:8 }}>{theme.desc}</div>
                    {isActive ? (
                      <div style={{ background:'rgba(232,103,26,0.1)', border:'1px solid rgba(232,103,26,0.3)', borderRadius:8, padding:'5px', textAlign:'center', fontSize:10, fontWeight:800, color:'#E8671A' }}>✓ Active</div>
                    ) : isOwned ? (
                      <button onClick={()=>activate(theme.id)}
                        style={{ width:'100%', background:'rgba(5,150,105,0.1)', border:'1px solid rgba(5,150,105,0.3)', borderRadius:8, padding:'6px', fontSize:10, fontWeight:800, color:'#059669', cursor:'pointer' }}>
                        Use करा
                      </button>
                    ) : (
                      <button onClick={()=>buy(theme)} disabled={!canBuy}
                        style={{ width:'100%', background:canBuy?'linear-gradient(135deg,#F5C842,#D97706)':'rgba(0,0,0,0.05)', border:'none', borderRadius:8, padding:'6px', fontSize:10, fontWeight:900, color:canBuy?'#fff':'#A8A29E', cursor:canBuy?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                        {canBuy ? <><span>🪙</span>{theme.price}</> : <><Lock size={10}/>{theme.price} coins</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {bought && (
            <div style={{ background:'rgba(5,150,105,0.1)', border:'1px solid rgba(5,150,105,0.3)', borderRadius:12, padding:'12px', marginTop:12, textAlign:'center', fontSize:13, fontWeight:800, color:'#059669', animation:'cs-pop 0.3s ease' }}>
              🎉 Theme unlock झाला!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

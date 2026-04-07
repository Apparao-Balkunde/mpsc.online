import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Check, X, Shuffle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Card { id:number; front:string; back:string; subject:string; hint?:string; }

const FALLBACK: Card[] = [
  { id:1,  front:'महाराष्ट्राची राजधानी?',         back:'मुंबई (उन्हाळी) / नागपूर (हिवाळी)',   subject:'भूगोल' },
  { id:2,  front:'SYNONYM of ABANDON',              back:'Forsake, Desert, Relinquish',           subject:'English' },
  { id:3,  front:'कलम ३२ — मूलभूत हक्क?',         back:'घटनात्मक उपाययोजनेचा हक्क',            subject:'राज्यघटना' },
  { id:4,  front:'\'अमृत\' चा समानार्थी शब्द?',    back:'सुधा, पीयूष, मदिरा',                   subject:'मराठी' },
  { id:5,  front:'पहिले पंतप्रधान कोण?',            back:'जवाहरलाल नेहरू (1947–1964)',            subject:'इतिहास' },
  { id:6,  front:'महाराष्ट्रात किती जिल्हे?',       back:'३६ जिल्हे',                             subject:'भूगोल' },
  { id:7,  front:'ANTONYM of ANCIENT',              back:'Modern, Contemporary, New',             subject:'English' },
  { id:8,  front:'सह्याद्री पर्वत कोणत्या दिशेला?', back:'महाराष्ट्राच्या पश्चिमेला',            subject:'भूगोल' },
  { id:9,  front:'\'शेतकऱ्यांचा असूड\' — लेखक?',  back:'महात्मा जोतिराव फुले (1883)',           subject:'इतिहास' },
  { id:10, front:'भारतीय संविधान कधी लागू झाले?',  back:'२६ जानेवारी १९५०',                      subject:'राज्यघटना' },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes fc-in { from{opacity:0;transform:translateY(20px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes fc-flip { 0%{transform:rotateY(0deg)}50%{transform:rotateY(90deg)}100%{transform:rotateY(0deg)} }
  @keyframes fc-swipe-left  { to{transform:translateX(-120%) rotate(-15deg);opacity:0} }
  @keyframes fc-swipe-right { to{transform:translateX(120%) rotate(15deg);opacity:0} }
  @keyframes fc-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes fc-spin { to{transform:rotate(360deg)} }
  .fc-card { transition: box-shadow 0.2s ease; user-select:none; }
  .fc-card:active { transform: scale(0.98); }
`;

interface Props { onBack: () => void; }

export const FlashcardMode: React.FC<Props> = ({ onBack }) => {
  const [cards, setCards]     = useState<Card[]>(FALLBACK);
  const [idx, setIdx]         = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown]     = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [animDir, setAnimDir] = useState<'left'|'right'|null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all'|'unknown'>('all');
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{x:number;y:number}|null>(null);

  useEffect(() => {
    supabase.from('vocab_questions').select('id,question,options,explanation,subject').limit(30)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCards(data.map((q:any) => ({
            id: q.id,
            front: q.question,
            back: Array.isArray(q.options) ? q.options[0] : q.explanation || '',
            subject: q.subject || 'शब्दसंग्रह',
            hint: q.explanation,
          })));
        }
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const visibleCards = filter === 'unknown' ? cards.filter(c => unknown.has(c.id) || !known.has(c.id)) : cards;
  const card = visibleCards[idx];
  const total = visibleCards.length;

  const swipe = (dir: 'left'|'right') => {
    setAnimDir(dir);
    setTimeout(() => {
      if (dir === 'right') { setKnown(p => new Set([...p, card.id])); updateProgress(1, 1); }
      else                 { setUnknown(p => new Set([...p, card.id])); updateProgress(1, 0); }
      setAnimDir(null);
      setFlipped(false);
      setIdx(p => (p + 1) % total);
    }, 320);
  };

  const shuffle = () => {
    setCards(c => [...c].sort(() => Math.random() - 0.5));
    setIdx(0); setFlipped(false); setKnown(new Set()); setUnknown(new Set());
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
    if (Math.abs(dx) > 60 && dy < 80) {
      swipe(dx > 0 ? 'right' : 'left');
    }
    touchStart.current = null;
  };

  const knownCount   = known.size;
  const unknownCount = unknown.size;
  const pct          = total > 0 ? Math.round((knownCount / total) * 100) : 0;

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{CSS}</style>
      <div style={{ width:44, height:44, border:'3px solid rgba(232,103,26,0.2)', borderTopColor:'#E8671A', borderRadius:'50%', animation:'fc-spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", display:'flex', flexDirection:'column' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', flexShrink:0 }}>
        <div style={{ maxWidth:560, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}>
            <ArrowLeft size={14} />
          </button>
          <div style={{ flex:1, background:'rgba(0,0,0,0.08)', borderRadius:99, height:6, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:99, width:`${pct}%`, transition:'width 0.4s' }} />
          </div>
          <div style={{ fontWeight:900, fontSize:12, color:'#1C2B2B', whiteSpace:'nowrap' }}>{knownCount}/{total}</div>
          <button onClick={shuffle} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 9px', cursor:'pointer', color:'#7A9090', display:'flex' }}>
            <Shuffle size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 16px', maxWidth:560, margin:'0 auto', width:'100%' }}>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:20, alignSelf:'stretch' }}>
          {(['all','unknown'] as const).map(f => (
            <button key={f} onClick={() => { setFilter(f); setIdx(0); setFlipped(false); }}
              style={{ flex:1, padding:'8px', borderRadius:12, fontWeight:800, fontSize:11, cursor:'pointer', border:`1.5px solid ${filter===f ? '#E8671A' : 'rgba(0,0,0,0.1)'}`, background:filter===f ? 'rgba(232,103,26,0.08)' : '#fff', color:filter===f ? '#C4510E' : '#7A9090', transition:'all 0.15s' }}>
              {f === 'all' ? `सर्व (${total})` : `न कळलेले (${unknownCount})`}
            </button>
          ))}
        </div>

        {/* Subject badge */}
        <div style={{ marginBottom:14 }}>
          <span style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:99, padding:'5px 14px', fontSize:11, fontWeight:800, color:'#7C3AED' }}>
            {card?.subject} · {idx+1}/{total}
          </span>
        </div>

        {/* Card */}
        <div ref={cardRef} className="fc-card"
          onClick={() => setFlipped(f => !f)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ width:'100%', minHeight:240, background:'#fff', borderRadius:28, padding:'32px 24px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 8px 40px rgba(0,0,0,0.1)', border:`2px solid ${flipped ? 'rgba(5,150,105,0.3)' : 'rgba(232,103,26,0.2)'}`, animation: animDir === 'left' ? 'fc-swipe-left 0.32s ease forwards' : animDir === 'right' ? 'fc-swipe-right 0.32s ease forwards' : 'fc-in 0.35s ease', position:'relative', overflow:'hidden', marginBottom:20, transition:'border-color 0.3s' }}>

          {/* Top bar */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: flipped ? 'linear-gradient(90deg,#059669,#10B981)' : 'linear-gradient(90deg,#E8671A,#F5C842)', backgroundSize:'200%', animation:'fc-shimmer 3s linear infinite' }} />

          <div style={{ fontSize:10, fontWeight:800, color: flipped ? '#059669' : '#E8671A', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:16 }}>
            {flipped ? '✓ उत्तर' : '? प्रश्न — tap करा'}
          </div>

          <p style={{ fontWeight:800, fontSize:'clamp(1rem,4vw,1.3rem)', lineHeight:1.65, color:'#1C2B2B', textAlign:'center', margin:0 }}>
            {flipped ? card?.back : card?.front}
          </p>

          {flipped && card?.hint && card.hint !== card.back && (
            <div style={{ marginTop:14, background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:12, padding:'10px 14px', width:'100%' }}>
              <p style={{ fontSize:11, color:'#7A9090', fontWeight:600, fontStyle:'italic', margin:0, textAlign:'center' }}>{card.hint}</p>
            </div>
          )}
        </div>

        {/* Swipe hint */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#DC2626' }}>← नाही</div>
          <div style={{ fontSize:10, fontWeight:600, color:'#A8A29E' }}>swipe करा</div>
          <div style={{ fontSize:11, fontWeight:700, color:'#059669' }}>हो →</div>
        </div>

        {/* Buttons */}
        <div style={{ display:'flex', gap:14, width:'100%', maxWidth:320 }}>
          <button onClick={() => swipe('left')}
            style={{ flex:1, background:'rgba(220,38,38,0.08)', border:'2px solid rgba(220,38,38,0.25)', borderRadius:18, padding:'16px', display:'flex', alignItems:'center', justifyContent:'center', gap:7, cursor:'pointer', fontWeight:900, fontSize:14, color:'#DC2626', transition:'all 0.15s' }}>
            <X size={20} /> नाही
          </button>
          <button onClick={() => swipe('right')}
            style={{ flex:1, background:'rgba(5,150,105,0.08)', border:'2px solid rgba(5,150,105,0.25)', borderRadius:18, padding:'16px', display:'flex', alignItems:'center', justifyContent:'center', gap:7, cursor:'pointer', fontWeight:900, fontSize:14, color:'#059669', transition:'all 0.15s' }}>
            <Check size={20} /> हो
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:12, marginTop:20 }}>
          {[
            { l:'माहीत',   v:knownCount,   c:'#059669', bg:'rgba(5,150,105,0.08)' },
            { l:'बाकी',    v:unknownCount, c:'#DC2626', bg:'rgba(220,38,38,0.08)' },
            { l:'शिल्लक', v:total-knownCount-unknownCount, c:'#7A9090', bg:'rgba(0,0,0,0.05)' },
          ].map(({ l,v,c,bg }) => (
            <div key={l} style={{ background:bg, borderRadius:12, padding:'8px 14px', textAlign:'center' }}>
              <div style={{ fontWeight:900, fontSize:18, color:c }}>{v}</div>
              <div style={{ fontSize:9, fontWeight:700, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Brain, TrendingUp, Calendar, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Card {
  id: number; front: string; back: string; subject: string; hint?: string;
  // ✨ SM-2 Spaced Repetition fields
  easiness: number;    // EF factor (1.3 - 2.5), default 2.5
  interval: number;    // days until next review
  repetitions: number; // successful reviews
  nextReview: string;  // ISO date
  lastRating?: number; // 0-5
}

const SM2_KEY = 'mpsc_flashcard_sm2';
const FALLBACK_CARDS: Omit<Card, 'easiness'|'interval'|'repetitions'|'nextReview'>[] = [
  { id:1,  front:'महाराष्ट्राची राजधानी?', back:'मुंबई (उन्हाळी) / नागपूर (हिवाळी)', subject:'भूगोल' },
  { id:2,  front:'SYNONYM of ABANDON', back:'Forsake, Desert, Relinquish', subject:'English' },
  { id:3,  front:'कलम ३२ — मूलभूत हक्क?', back:'घटनात्मक उपाययोजनेचा हक्क', subject:'राज्यघटना' },
  { id:4,  front:'\'अमृत\' चा समानार्थी शब्द?', back:'सुधा, पीयूष, मदिरा', subject:'मराठी' },
  { id:5,  front:'पहिले पंतप्रधान कोण?', back:'जवाहरलाल नेहरू (1947–1964)', subject:'इतिहास' },
  { id:6,  front:'महाराष्ट्रात किती जिल्हे?', back:'३६ जिल्हे', subject:'भूगोल' },
  { id:7,  front:'ANTONYM of ANCIENT', back:'Modern, Contemporary, New', subject:'English' },
  { id:8,  front:'सह्याद्री पर्वत कोणत्या दिशेला?', back:'महाराष्ट्राच्या पश्चिमेला', subject:'भूगोल' },
  { id:9,  front:'\'शेतकऱ्यांचा असूड\' — लेखक?', back:'महात्मा जोतिराव फुले (1883)', subject:'इतिहास' },
  { id:10, front:'भारतीय संविधान कधी लागू झाले?', back:'२६ जानेवारी १९५०', subject:'राज्यघटना' },
  { id:11, front:'पंचायती राज — कोणते कलम?', back:'कलम २४३ — ७३वी घटनादुरुस्ती (1992)', subject:'राज्यघटना' },
  { id:12, front:'RBI चे मुख्यालय कोठे?', back:'मुंबई, महाराष्ट्र (स्थापना: 1935)', subject:'अर्थशास्त्र' },
  { id:13, front:'SYNONYM of BENEVOLENT', back:'Kind, Generous, Philanthropic', subject:'English' },
  { id:14, front:'गोदावरी नदीचे उगमस्थान?', back:'त्र्यंबकेश्वर, नाशिक जिल्हा', subject:'भूगोल' },
  { id:15, front:'भारत स्वतंत्र कधी झाला?', back:'१५ ऑगस्ट १९४७', subject:'इतिहास' },
];

// ✨ SM-2 Algorithm — SuperMemo 2
function sm2Update(card: Card, rating: number): Card {
  // rating: 0=Again, 1=Hard, 3=Good, 5=Easy
  const n = card.repetitions;
  let ef = card.easiness;
  let interval = card.interval;
  let reps = n;

  if (rating < 3) {
    // Fail — reset
    reps = 0;
    interval = 1;
  } else {
    if (n === 0) interval = 1;
    else if (n === 1) interval = 6;
    else interval = Math.round(interval * ef);
    reps = n + 1;
    // Update EF
    ef = Math.max(1.3, ef + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { ...card, easiness: ef, interval, repetitions: reps, nextReview: nextReview.toISOString(), lastRating: rating };
}

function loadSM2Data(): Record<number, Partial<Card>> {
  try { return JSON.parse(localStorage.getItem(SM2_KEY) || '{}'); } catch { return {}; }
}

function saveSM2Data(data: Record<number, Partial<Card>>) {
  try { localStorage.setItem(SM2_KEY, JSON.stringify(data)); } catch {}
}

function initCard(base: typeof FALLBACK_CARDS[0]): Card {
  const saved = loadSM2Data()[base.id];
  return {
    ...base,
    easiness: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    ...saved,
  };
}

// Cards due for review today
function getDueCards(cards: Card[]): Card[] {
  const today = new Date();
  today.setHours(23,59,59,999);
  return cards.filter(c => new Date(c.nextReview) <= today);
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes fc-in     { from{opacity:0;transform:translateY(20px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes fc-flip-f { 0%{transform:rotateY(0deg)} 100%{transform:rotateY(90deg)} }
  @keyframes fc-flip-b { 0%{transform:rotateY(-90deg)} 100%{transform:rotateY(0deg)} }
  @keyframes fc-swipe-left  { to{transform:translateX(-120%) rotate(-15deg);opacity:0} }
  @keyframes fc-swipe-right { to{transform:translateX(120%) rotate(15deg);opacity:0} }
  @keyframes fc-pop    { 0%{transform:scale(0.9);opacity:0}70%{transform:scale(1.04)}100%{transform:scale(1);opacity:1} }
  @keyframes fc-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes fc-spin   { to{transform:rotate(360deg)} }
  @keyframes fc-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  .fc-card { user-select:none; }
  .fc-card:active { transform: scale(0.98); }
  .fc-rate-btn { transition: all 0.15s ease; }
  .fc-rate-btn:hover { transform: translateY(-3px) scale(1.05); }
`;

interface Props { onBack: () => void; }

export const FlashcardMode: React.FC<Props> = ({ onBack }) => {
  const [allCards]   = useState<Card[]>(() => FALLBACK_CARDS.map(initCard));
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [idx, setIdx]           = useState(0);
  const [flipped, setFlipped]   = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [swipe, setSwipe]       = useState<'left'|'right'|null>(null);
  const [phase, setPhase]       = useState<'menu'|'review'|'done'>('menu');
  const [sessionStats, setSessionStats] = useState({ again:0, hard:0, good:0, easy:0 });
  const [filter, setFilter]     = useState('Due Today');
  const [loading, setLoading]   = useState(false);
  const sm2Data = loadSM2Data();

  const FILTERS = ['Due Today', 'All Cards', 'New Only', 'Hard Cards'];
  
  const getFilteredCards = (f: string): Card[] => {
    const today = new Date(); today.setHours(23,59,59,999);
    if (f === 'Due Today') return allCards.filter(c => new Date(c.nextReview) <= today);
    if (f === 'New Only')  return allCards.filter(c => c.repetitions === 0);
    if (f === 'Hard Cards') return allCards.filter(c => (c.lastRating || 5) <= 2);
    return allCards;
  };

  const startSession = () => {
    const filtered = getFilteredCards(filter);
    setDueCards(filtered.length > 0 ? filtered : allCards.slice(0,10));
    setIdx(0); setFlipped(false); setSessionStats({ again:0, hard:0, good:0, easy:0 });
    setPhase('review');
  };

  const handleFlip = () => {
    if (flipping) return;
    setFlipping(true);
    setTimeout(() => { setFlipped(f => !f); setFlipping(false); }, 150);
  };

  // ✨ SM-2 Rating
  const rateCard = (rating: number, ratingLabel: 'again'|'hard'|'good'|'easy') => {
    const card = dueCards[idx];
    const updated = sm2Update(card, rating);
    
    // Save SM-2 data
    const data = loadSM2Data();
    data[card.id] = { easiness: updated.easiness, interval: updated.interval, repetitions: updated.repetitions, nextReview: updated.nextReview, lastRating: updated.lastRating };
    saveSM2Data(data);

    setSessionStats(s => ({ ...s, [ratingLabel]: s[ratingLabel as keyof typeof s] + 1 }));
    updateProgress(1, rating >= 3 ? 1 : 0);
    
    // Animate swipe
    setSwipe(rating >= 3 ? 'right' : 'left');
    setTimeout(() => {
      setSwipe(null); setFlipped(false);
      if (idx + 1 >= dueCards.length) {
        addXP(10 + sessionStats.easy * 3, []);
        setPhase('done');
      } else {
        setIdx(i => i + 1);
      }
    }, 350);
  };

  // Due counts
  const dueCount  = allCards.filter(c => { const t = new Date(); t.setHours(23,59,59,999); return new Date(c.nextReview) <= t; }).length;
  const newCount  = allCards.filter(c => c.repetitions === 0).length;
  const hardCount = allCards.filter(c => (c.lastRating || 5) <= 2 && c.repetitions > 0).length;
  const masteredCount = allCards.filter(c => c.repetitions >= 3 && (c.lastRating || 0) >= 4).length;

  const card = dueCards[idx];
  const daysUntilNext = card ? Math.max(0, Math.round((new Date(card.nextReview).getTime() - Date.now()) / 86400000)) : 0;

  if (phase === 'menu') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ background:'linear-gradient(135deg,#059669,#065F46)', padding:'14px 16px', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:50 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:36, height:36, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><ArrowLeft size={18}/></button>
        <div style={{ flex:1 }}>
          <div style={{ color:'#fff', fontWeight:900, fontSize:16 }}>🎴 Flashcards</div>
          <div style={{ color:'rgba(255,255,255,0.75)', fontSize:11, fontWeight:600 }}>SM-2 Spaced Repetition</div>
        </div>
        {dueCount > 0 && <div style={{ background:'#EF4444', borderRadius:99, padding:'4px 10px', fontSize:11, fontWeight:900, color:'#fff' }}>{dueCount} due</div>}
      </div>

      <div style={{ padding:'16px', maxWidth:480, margin:'0 auto' }}>
        
        {/* ✨ SM-2 Stats overview */}
        <div style={{ background:'#fff', borderRadius:20, padding:'20px', marginBottom:16, boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <Brain size={16} style={{ color:'#059669' }}/> तुमची Flashcard Progress
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
            {[
              { label:'Due Today', value:dueCount, color:'#EF4444', bg:'rgba(239,68,68,0.08)' },
              { label:'New Cards', value:newCount, color:'#3B82F6', bg:'rgba(59,130,246,0.08)' },
              { label:'Hard', value:hardCount, color:'#F59E0B', bg:'rgba(245,158,11,0.08)' },
              { label:'Mastered', value:masteredCount, color:'#059669', bg:'rgba(5,150,105,0.08)' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background:bg, borderRadius:12, padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontWeight:900, fontSize:22, color }}>{value}</div>
                <div style={{ fontSize:9, fontWeight:700, color:'#7A9090', textTransform:'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* ✨ UNIQUE: SM-2 explanation */}
          <div style={{ background:'rgba(5,150,105,0.05)', borderRadius:12, padding:'10px 14px', border:'1px solid rgba(5,150,105,0.12)' }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#059669', marginBottom:4 }}>🧠 Spaced Repetition (SM-2) म्हणजे काय?</div>
            <p style={{ fontSize:11, fontWeight:600, color:'#374151', margin:0, lineHeight:1.5 }}>
              तुम्ही Easy म्हणाल्यावर card जास्त दिवसांनंतर येतो. Again म्हणाल्यावर उद्याच येतो. हे algorithm memory science वर आधारित आहे — जास्तीत जास्त retention कमीत कमी वेळात.
            </p>
          </div>
        </div>

        {/* Filter */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontWeight:800, fontSize:12, color:'#7A9090', marginBottom:8 }}>Session type निवडा:</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {FILTERS.map(f => {
              const count = getFilteredCards(f).length;
              const active = filter === f;
              return (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding:'12px 14px', borderRadius:14, border:`2px solid ${active ? '#059669' : 'rgba(28,43,43,0.1)'}`, background: active ? 'rgba(5,150,105,0.08)' : '#fff', cursor:'pointer', textAlign:'left' }}>
                  <div style={{ fontWeight:800, fontSize:13, color: active ? '#059669' : '#1C2B2B' }}>{f}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#7A9090', marginTop:2 }}>{count} cards</div>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={startSession} disabled={getFilteredCards(filter).length === 0}
          style={{ width:'100%', background: getFilteredCards(filter).length > 0 ? 'linear-gradient(135deg,#059669,#065F46)' : '#E5E7EB', border:'none', borderRadius:16, padding:'16px', color:'#fff', fontWeight:900, fontSize:16, cursor: getFilteredCards(filter).length > 0 ? 'pointer' : 'not-allowed', boxShadow: getFilteredCards(filter).length > 0 ? '0 8px 28px rgba(5,150,105,0.3)' : 'none', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <Zap size={18} fill="#fff"/> Review सुरू करा ({getFilteredCards(filter).length} cards)
        </button>

        {dueCount === 0 && (
          <div style={{ marginTop:14, background:'rgba(5,150,105,0.06)', borderRadius:14, padding:'14px', textAlign:'center', border:'1px solid rgba(5,150,105,0.15)' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>🎉</div>
            <div style={{ fontWeight:800, fontSize:13, color:'#059669' }}>आज सर्व cards review झाले!</div>
            <div style={{ fontSize:11, fontWeight:600, color:'#7A9090', marginTop:4 }}>पुढील review उद्या scheduled आहे.</div>
          </div>
        )}
      </div>
    </div>
  );

  if (phase === 'done') {
    const total = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;
    const recalled = sessionStats.good + sessionStats.easy;
    return (
      <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}>
        <style>{CSS}</style>
        <div style={{ background:'linear-gradient(135deg,#059669,#065F46)', padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:36, height:36, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><ArrowLeft size={18}/></button>
          <div style={{ color:'#fff', fontWeight:900, fontSize:16 }}>Session Complete!</div>
        </div>
        <div style={{ padding:'24px 16px', maxWidth:480, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:12, animation:'fc-bounce 2s ease infinite' }}>{recalled >= total * 0.8 ? '🎓' : recalled >= total * 0.5 ? '⭐' : '💪'}</div>
          <h2 style={{ fontWeight:900, fontSize:24, color:'#1C2B2B', margin:'0 0 4px' }}>{recalled}/{total} recalled</h2>
          <p style={{ color:'#7A9090', fontWeight:700, fontSize:13, margin:'0 0 24px' }}>{Math.round((recalled/total)*100)}% retention rate</p>
          
          <div style={{ background:'#fff', borderRadius:18, padding:'18px', marginBottom:16, boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight:800, fontSize:13, color:'#1C2B2B', marginBottom:12 }}>Session Breakdown</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              {[
                { l:'Again', v:sessionStats.again, c:'#EF4444', emoji:'🔴' },
                { l:'Hard', v:sessionStats.hard, c:'#F59E0B', emoji:'🟡' },
                { l:'Good', v:sessionStats.good, c:'#3B82F6', emoji:'🔵' },
                { l:'Easy', v:sessionStats.easy, c:'#059669', emoji:'🟢' },
              ].map(({ l,v,c,emoji }) => (
                <div key={l} style={{ background:`${c}10`, borderRadius:12, padding:'10px 6px', textAlign:'center' }}>
                  <div style={{ fontSize:18, marginBottom:2 }}>{emoji}</div>
                  <div style={{ fontWeight:900, fontSize:18, color:c }}>{v}</div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#7A9090' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ✨ Next review schedule */}
          <div style={{ background:'rgba(5,150,105,0.06)', borderRadius:14, padding:'12px 16px', marginBottom:20, border:'1px solid rgba(5,150,105,0.15)', textAlign:'left' }}>
            <div style={{ fontWeight:800, fontSize:12, color:'#059669', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
              <Calendar size={13}/> Next Review Schedule
            </div>
            <p style={{ fontSize:11, fontWeight:600, color:'#374151', margin:0, lineHeight:1.5 }}>
              SM-2 algorithm ने प्रत्येक card साठी optimal review date calculate केली. पुढील session मध्ये फक्त due cards येतील — unnecessarily repeat होणार नाहीत.
            </p>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setIdx(0); setFlipped(false); setPhase('menu'); }}
              style={{ flex:1, background:'#F5F0E8', border:'none', borderRadius:14, padding:'13px', color:'#7A9090', fontWeight:800, fontSize:13, cursor:'pointer' }}>← Menu</button>
            <button onClick={startSession}
              style={{ flex:2, background:'linear-gradient(135deg,#059669,#065F46)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer' }}>
              पुन्हा करा 🔄
            </button>
          </div>
        </div>
      </div>
    );
  }

  // REVIEW phase
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ background:'linear-gradient(135deg,#059669,#065F46)', padding:'14px 16px', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:50 }}>
        <button onClick={() => setPhase('menu')} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:36, height:36, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><ArrowLeft size={18}/></button>
        <div style={{ flex:1, background:'rgba(255,255,255,0.2)', borderRadius:99, height:5, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'rgba(255,255,255,0.9)', width:`${(idx/dueCards.length)*100}%`, transition:'width 0.3s', borderRadius:99 }}/>
        </div>
        <span style={{ fontSize:12, fontWeight:900, color:'rgba(255,255,255,0.85)' }}>{idx+1}/{dueCards.length}</span>
      </div>

      <div style={{ padding:'16px', maxWidth:480, margin:'0 auto' }}>
        {/* ✨ SM-2 card info */}
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
          <span style={{ fontSize:10, fontWeight:800, color:'#7A9090', background:'#fff', borderRadius:8, padding:'4px 10px' }}>{card?.subject}</span>
          <span style={{ fontSize:10, fontWeight:700, color: (card?.lastRating||5) <= 2 ? '#EF4444' : '#059669', background:'#fff', borderRadius:8, padding:'4px 10px' }}>
            {card?.repetitions === 0 ? '🆕 New' : (card?.lastRating||5) <= 2 ? '🔴 Hard' : card?.interval > 7 ? `📅 Every ${card?.interval}d` : `📅 ${card?.interval}d`}
          </span>
        </div>

        {/* Card */}
        <div className="fc-card" onClick={handleFlip}
          style={{ background:'#fff', borderRadius:24, minHeight:220, padding:'28px 24px', marginBottom:16, boxShadow:'0 8px 32px rgba(0,0,0,0.1)', cursor:'pointer', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', border:'2px solid rgba(5,150,105,0.1)', animation: swipe === 'right' ? 'fc-swipe-right 0.35s ease forwards' : swipe === 'left' ? 'fc-swipe-left 0.35s ease forwards' : 'fc-in 0.3s ease' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background: flipped ? 'linear-gradient(90deg,#059669,#34D399)' : 'linear-gradient(90deg,#E8671A,#F59E0B)' }}/>
          
          {!flipped ? (
            <>
              <div style={{ fontSize:12, fontWeight:800, color:'rgba(232,103,26,0.6)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:16 }}>QUESTION</div>
              <p style={{ fontWeight:800, fontSize:'clamp(1rem,4vw,1.2rem)', color:'#1C2B2B', lineHeight:1.6, margin:0 }}>{card?.front}</p>
              <div style={{ marginTop:20, fontSize:11, fontWeight:700, color:'#B0C0C0' }}>👆 tap करा — उत्तर पहा</div>
            </>
          ) : (
            <>
              <div style={{ fontSize:12, fontWeight:800, color:'rgba(5,150,105,0.7)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:16 }}>ANSWER</div>
              <p style={{ fontWeight:800, fontSize:'clamp(1rem,4vw,1.15rem)', color:'#059669', lineHeight:1.6, margin:0, animation:'fc-pop 0.3s ease' }}>{card?.back}</p>
            </>
          )}
        </div>

        {/* ✨ SM-2 Rating buttons — only after flip */}
        {flipped ? (
          <div>
            <div style={{ textAlign:'center', fontSize:11, fontWeight:800, color:'#7A9090', marginBottom:10 }}>किती सहज आठवले?</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              {[
                { label:'Again', sublabel:'भूललो', rating:0, ratingKey:'again' as const, color:'#EF4444', bg:'rgba(239,68,68,0.1)', emoji:'🔴', nextDay:'उद्या' },
                { label:'Hard', sublabel:'कठीण', rating:2, ratingKey:'hard' as const, color:'#F59E0B', bg:'rgba(245,158,11,0.1)', emoji:'🟡', nextDay:`${Math.max(1,card?.interval||1)}d` },
                { label:'Good', sublabel:'ठीक', rating:3, ratingKey:'good' as const, color:'#3B82F6', bg:'rgba(59,130,246,0.1)', emoji:'🔵', nextDay:`${Math.round((card?.interval||1)*card?.easiness||2.5)}d` },
                { label:'Easy', sublabel:'सहज!', rating:5, ratingKey:'easy' as const, color:'#059669', bg:'rgba(5,150,105,0.1)', emoji:'🟢', nextDay:`${Math.round((card?.interval||1)*card?.easiness*1.3||3.25)}d+` },
              ].map(({ label, sublabel, rating, ratingKey, color, bg, emoji, nextDay }) => (
                <button key={label} onClick={() => rateCard(rating, ratingKey)} className="fc-rate-btn"
                  style={{ background:bg, border:`2px solid ${color}30`, borderRadius:14, padding:'12px 6px', cursor:'pointer', textAlign:'center' }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{emoji}</div>
                  <div style={{ fontWeight:900, fontSize:12, color, marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#7A9090' }}>{sublabel}</div>
                  <div style={{ fontSize:8, fontWeight:700, color, marginTop:3, background:`${color}15`, borderRadius:6, padding:'1px 4px' }}>{nextDay}</div>
                </button>
              ))}
            </div>
            <p style={{ fontSize:10, fontWeight:600, color:'#B0C0C0', textAlign:'center', marginTop:8 }}>SM-2: तुमच्या rating नुसार next review date automatically set होईल</p>
          </div>
        ) : (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#B0C0C0', marginBottom:12 }}>Card tap करा → उत्तर पहा → rate करा</div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              {dueCards.slice(0, Math.min(8, dueCards.length)).map((_, i) => (
                <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i < idx ? '#059669' : i === idx ? '#E8671A' : 'rgba(0,0,0,0.12)' }}/>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

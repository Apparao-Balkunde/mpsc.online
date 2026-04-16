import React, { useState } from 'react';
import { ArrowLeft, Star, ChevronRight } from 'lucide-react';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }

const CATEGORIES = [
  {
    id: 'central', title: 'केंद्र सरकार योजना', emoji: '🇮🇳', color: '#FF9933',
    qs: [
      { q:'PM-KISAN योजनेत शेतकऱ्यांना वार्षिक किती मिळतात?', opts:['₹4,000','₹6,000','₹8,000','₹10,000'], a:1, exp:'PM-KISAN: ₹6,000 प्रतिवर्ष — 3 हप्त्यांत — 2019 पासून सुरू' },
      { q:'आयुष्मान भारत योजनेत किती आरोग्य विमा मिळतो?', opts:['₹2 लाख','₹3 लाख','₹5 लाख','₹10 लाख'], a:2, exp:'आयुष्मान भारत (PMJAY): ₹5 लाख प्रति कुटुंब — जगातील सर्वात मोठी आरोग्य विमा योजना' },
      { q:'जल जीवन मिशनचे उद्दिष्ट?', opts:['नदी जोड','शेती सिंचन','प्रत्येक घरात नळ पाणी','भूजल संरक्षण'], a:2, exp:'जल जीवन मिशन: 2024 पर्यंत प्रत्येक ग्रामीण घरात नळ जोडणी — 100% coverage' },
      { q:'Make in India initiative कधी सुरू झाले?', opts:['2013','2014','2015','2016'], a:1, exp:'Make in India: 25 सप्टेंबर 2014 — PM मोदींनी सुरू केले — Manufacturing hub बनवणे' },
      { q:'MGNREGA योजनेत किती दिवस रोजगाराची हमी?', opts:['50 दिवस','75 दिवस','100 दिवस','150 दिवस'], a:2, exp:'MGNREGA 2005: 100 दिवस रोजगाराची हमी ग्रामीण कुटुंबांना — UPA सरकारने सुरू केले' },
      { q:'PM Ujjwala Yojana कशासाठी?', opts:['सौर ऊर्जा','LPG कनेक्शन','पाणी','शौचालय'], a:1, exp:'PM Ujjwala: BPL महिलांना मोफत LPG गॅस कनेक्शन — Clean cooking fuel' },
    ]
  },
  {
    id: 'maharashtra', title: 'महाराष्ट्र सरकार योजना', emoji: '🏛️', color: '#2563EB',
    qs: [
      { q:'मागेल त्याला सौर कृषी पंप योजना कोणासाठी?', opts:['शहरी नागरिक','शेतकरी','विद्यार्थी','महिला'], a:1, exp:'मुख्यमंत्री सौर कृषी पंप योजना — शेतकऱ्यांना 3 HP/5 HP सौर पंप — 1 लाख शेतकरी लक्ष्य' },
      { q:'लेक लाडकी योजनेत मुलींना किती मिळते?', opts:['₹25,000','₹50,000','₹75,000','₹1,00,000'], a:3, exp:'लेक लाडकी योजना 2023: मुलगी जन्माला ₹5,000 ते 18 वर्षे ₹75,000 असे एकूण ₹1,01,000' },
      { q:'महाराष्ट्र शासनाची "नमो शेतकरी महासन्मान" किती देते?', opts:['₹2,000','₹4,000','₹6,000','₹12,000'], a:2, exp:'नमो शेतकरी योजना + PM-KISAN = एकूण ₹12,000 प्रतिवर्ष — Maharashtra state top-up ₹6,000' },
      { q:'मुख्यमंत्री माझी लाडकी बहीण योजनेत महिलांना किती?', opts:['₹1,000','₹1,500','₹2,100','₹2,500'], a:1, exp:'माझी लाडकी बहीण: ₹1,500 प्रतिमाह — 21-60 वयोगटातील महिला — 2024' },
      { q:'महाराष्ट्र शिष्यवृत्ती परीक्षा कोण घेते?', opts:['MPSC','MSCE','MHRD','ZP'], a:1, exp:'Maharashtra State Council of Examinations (MSCE) — इयत्ता 5 वी आणि 8 वी शिष्यवृत्ती' },
      { q:'अण्णासाहेब पाटील आर्थिक मागास विकास महामंडळ कोणासाठी?', opts:['OBC','EWS मराठा','SC/ST','NT'], a:1, exp:'EWS Maratha: कर्ज, व्याज परतावा — मराठा आर्थिक विकासासाठी' },
    ]
  },
  {
    id: 'education', title: 'शिक्षण योजना', emoji: '📚', color: '#7C3AED',
    qs: [
      { q:'RTE Act 2009 नुसार शिक्षणाचा हक्क किती वयापर्यंत?', opts:['6-12','6-14','6-18','5-14'], a:1, exp:'RTE Act 2009: 6-14 वयोगटातील मुलांना मोफत आणि सक्तीचे शिक्षण — कलम 21A अंतर्गत' },
      { q:'PM Scholarship Scheme कोणासाठी?', opts:['सर्व विद्यार्थी','माजी सैनिकांच्या मुलांसाठी','BPL','SC/ST'], a:1, exp:'PM Scholarship: माजी सैनिक, निमलष्करी दलातील कर्मचाऱ्यांच्या मुलांसाठी' },
      { q:'राष्ट्रीय शिक्षण धोरण (NEP) 2020 मध्ये 5+3+3+4 काय आहे?', opts:['वय गट','वर्ग','परीक्षा स्तर','विषय'], a:0, exp:'NEP 2020: Foundation(3-8), Preparatory(8-11), Middle(11-14), Secondary(14-18) — 4 stages' },
      { q:'SWAYAM platform कशासाठी?', opts:['नोकरी','Online Free Education','Scholarship','Exam'], a:1, exp:'SWAYAM: Study Webs of Active Learning — MOOCs platform — मोफत ऑनलाइन courses' },
      { q:'Eklavya Model Residential Schools कोणासाठी?', opts:['OBC','Tribal/ST','BPL','Minority'], a:1, exp:'EMRS: Tribal/ST विद्यार्थ्यांसाठी residential schools — 100% scholarship + boarding' },
    ]
  },
  {
    id: 'women', title: 'महिला योजना', emoji: '👩', color: '#EC4899',
    qs: [
      { q:'बेटी बचाओ बेटी पढाओ योजना कधी सुरू?', opts:['2013','2014','2015','2016'], a:2, exp:'BBBP: 22 जानेवारी 2015 — Panipat, Haryana — घटता sex ratio सुधारण्यासाठी' },
      { q:'Pradhan Mantri Matru Vandana Yojana किती देते?', opts:['₹3,000','₹5,000','₹6,000','₹10,000'], a:1, exp:'PMMVY: ₹5,000 तीन हप्त्यांत — पहिल्या जिवंत मुलासाठी — मातृत्व लाभ' },
      { q:'Sukanya Samriddhi Account किती वयापर्यंत उघडता येतो?', opts:['5 वर्षांपर्यंत','8 वर्षांपर्यंत','10 वर्षांपर्यंत','12 वर्षांपर्यंत'], a:2, exp:'SSA: 10 वर्षांपर्यंत मुलींसाठी उघडता येतो — 21 वर्षे maturity — बचत योजना' },
      { q:'स्वाधार गृह योजना कोणासाठी?', opts:['गरीब महिला','महिला कैदी','पीडित महिला','वृद्ध महिला'], a:2, exp:'Swadhar Greh: संकटात सापडलेल्या, पीडित महिलांसाठी निवारा व पुनर्वसन' },
      { q:'महाराष्ट्र "Majhi Ladki Bahin" साठी वयोमर्यादा?', opts:['18-45','21-60','25-65','18-60'], a:1, exp:'माझी लाडकी बहीण: 21 ते 60 वयोगटातील विवाहित/घटस्फोटित/विधवा महिला — ₹1,500/month' },
    ]
  },
];

const CSS = `
@keyframes sm-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes sm-pop{0%{transform:scale(0.85)}60%{transform:scale(1.06)}100%{transform:scale(1)}}
`;

export const SchemesMCQ: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]     = useState<'menu'|'quiz'|'result'>('menu');
  const [cat, setCat]         = useState<typeof CATEGORIES[0]|null>(null);
  const [idx, setIdx]         = useState(0);
  const [answers, setAnswers] = useState<Record<number,number>>({});

  const start = (c: typeof CATEGORIES[0]) => {
    setCat(c); setIdx(0); setAnswers({}); setPhase('quiz');
  };

  const handle = (optIdx: number) => {
    if (answers[idx] !== undefined) return;
    const correct = optIdx === cat!.qs[idx].a;
    setAnswers(p => ({ ...p, [idx]: optIdx }));
    updateProgress(1, correct ? 1 : 0);
    addXP(correct ? 5 : 1);
  };

  const qs    = cat?.qs || [];
  const score = Object.entries(answers).filter(([i,a]) => qs[+i]?.a === +a).length;
  const acc   = qs.length > 0 ? Math.round((score / qs.length) * 100) : 0;

  // ── MENU ──
  if (phase === 'menu') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
          <Star size={16} style={{color:'#FF9933'}}/> सरकारी योजना MCQ
        </div>
      </div>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ fontWeight:700, fontSize:13, color:'#7A9090', marginBottom:16, textAlign:'center' }}>Category निवडा — MPSC परीक्षेत नेहमी येतात!</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => start(c)}
              style={{ background:'#fff', border:`1.5px solid ${c.color}20`, borderRadius:18, padding:'18px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, boxShadow:`0 2px 12px ${c.color}10`, textAlign:'left', animation:'sm-fade 0.3s ease' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:`${c.color}15`, border:`1.5px solid ${c.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{c.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:3 }}>{c.title}</div>
                <div style={{ fontSize:11, fontWeight:600, color:'#7A9090' }}>{c.qs.length} MCQ · Prelims + Mains</div>
              </div>
              <ChevronRight size={18} style={{ color:'#D1D5DB', flexShrink:0 }}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── RESULT ──
  if (phase === 'result') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#0D1929)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{CSS}</style>
      <div style={{ fontSize:56, marginBottom:12, animation:'sm-pop 0.5s ease' }}>{acc>=80?'🏆':acc>=60?'⭐':'📚'}</div>
      <div style={{ fontWeight:900, fontSize:36, letterSpacing:'-0.04em', marginBottom:4 }}>{score}/{qs.length}</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>{acc}% accuracy</div>
      <div style={{ fontSize:12, fontWeight:700, color:cat?.color, marginBottom:24 }}>{cat?.emoji} {cat?.title}</div>
      <div style={{ display:'flex', gap:8, width:'100%', maxWidth:360 }}>
        <button onClick={() => { const t=`⭐ सरकारी योजना MCQ!\n${cat?.title}\n\n${score}/${qs.length} · ${acc}%\n\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank'); }}
          style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤</button>
        <button onClick={() => start(cat!)}
          style={{ flex:1, background:`linear-gradient(135deg,${cat?.color},${cat?.color}CC)`, border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🔁</button>
        <button onClick={() => setPhase('menu')}
          style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'13px', color:'#fff', fontWeight:800, cursor:'pointer' }}>Menu</button>
      </div>
    </div>
  );

  // ── QUIZ ──
  const q = qs[idx];
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => setPhase('menu')} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:900, fontSize:12, color:'#1C2B2B' }}>{cat?.emoji} {cat?.title}</div>
          <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:4, marginTop:5, overflow:'hidden' }}>
            <div style={{ height:'100%', background:`linear-gradient(90deg,${cat?.color},${cat?.color}80)`, borderRadius:99, width:`${((idx+1)/qs.length)*100}%`, transition:'width 0.4s' }}/>
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:'#7A9090' }}>{idx+1}/{qs.length}</span>
        <span style={{ fontWeight:900, fontSize:12, color:'#10B981', background:'rgba(16,185,129,0.1)', borderRadius:99, padding:'3px 9px' }}>{score}✓</span>
      </div>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'16px' }}>
        {q && (
          <>
            <div style={{ background:'#fff', borderRadius:20, padding:'20px 18px', marginBottom:12, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', animation:'sm-fade 0.25s ease' }}>
              <div style={{ fontSize:9, fontWeight:800, color:cat?.color, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>सरकारी योजना</div>
              <p style={{ fontWeight:700, fontSize:'clamp(0.9rem,3.5vw,1.05rem)', lineHeight:1.75, color:'#1C2B2B', margin:0 }}>{q.q}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:14 }}>
              {q.opts.map((opt, i) => {
                const isAns = i === q.a, isSel = answers[idx] === i, isAnswered = answers[idx] !== undefined;
                let bg = '#fff', border = 'rgba(0,0,0,0.08)', color = '#1C2B2B';
                if (isAnswered && isAns)           { bg='rgba(5,150,105,0.08)';  border='rgba(5,150,105,0.4)';  color='#065F46'; }
                if (isAnswered && isSel && !isAns) { bg='rgba(220,38,38,0.06)'; border='rgba(220,38,38,0.3)';  color='#991B1B'; }
                if (isAnswered && !isSel && !isAns){ color='#9CA3AF'; }
                return (
                  <button key={i} disabled={isAnswered} onClick={() => handle(i)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:13, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:13, textAlign:'left', cursor:isAnswered?'default':'pointer', transition:'all 0.15s' }}>
                    <span style={{ width:24, height:24, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, background:isAnswered&&isAns?'#059669':isAnswered&&isSel&&!isAns?'#DC2626':'rgba(0,0,0,0.06)', color:isAnswered&&(isAns||(isSel&&!isAns))?'#fff':'#7A9090' }}>
                      {isAnswered&&isAns?'✓':isAnswered&&isSel&&!isAns?'✗':String.fromCharCode(65+i)}
                    </span>
                    <span style={{ flex:1 }}>{opt}</span>
                  </button>
                );
              })}
            </div>
            {answers[idx] !== undefined && (
              <div style={{ background:`${cat?.color}0D`, border:`1px solid ${cat?.color}25`, borderRadius:14, padding:'12px 14px', marginBottom:14, fontSize:12, fontWeight:600, color:'#374151', lineHeight:1.7, animation:'sm-fade 0.2s ease' }}>
                📋 {q.exp}
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              {idx > 0 && <button onClick={() => setIdx(p=>p-1)} style={{ flex:1, background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'12px', color:'#7A9090', fontWeight:800, cursor:'pointer' }}>← मागे</button>}
              {idx+1 < qs.length
                ? <button onClick={() => setIdx(p=>p+1)} disabled={answers[idx]===undefined}
                    style={{ flex:2, background:answers[idx]!==undefined?`linear-gradient(135deg,${cat?.color},${cat?.color}CC)`:'rgba(0,0,0,0.1)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, cursor:answers[idx]!==undefined?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>पुढे →</button>
                : <button onClick={() => setPhase('result')} style={{ flex:2, background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🏆 Result</button>
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
};

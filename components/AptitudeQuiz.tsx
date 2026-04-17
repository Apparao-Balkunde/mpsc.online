import React, { useState } from 'react';
import { ArrowLeft, Brain, ChevronRight } from 'lucide-react';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }

const SETS = [
  {
    id: 'numbers', title: 'Number Series', emoji: '🔢', color: '#7C3AED',
    desc: 'Missing number शोधा',
    qs: [
      { q:'2, 6, 12, 20, 30, ?', opts:['38','40','42','44'], a:2, exp:'Differences: 4,6,8,10,12 → 30+12=42' },
      { q:'1, 4, 9, 16, 25, ?', opts:['30','36','40','49'], a:1, exp:'Perfect squares: 1²,2²,3²,4²,5²,6²=36' },
      { q:'3, 7, 15, 31, 63, ?', opts:['111','127','125','120'], a:1, exp:'Each term = previous×2+1 → 63×2+1=127' },
      { q:'5, 10, 20, 40, 80, ?', opts:['120','140','160','100'], a:2, exp:'Each term ×2 → 80×2=160' },
      { q:'2, 3, 5, 8, 13, 21, ?', opts:['29','34','31','32'], a:1, exp:'Fibonacci: 13+21=34' },
      { q:'100, 90, 81, 73, 66, ?', opts:['58','59','60','61'], a:2, exp:'Diff: -10,-9,-8,-7,-6 → 66-6=60' },
      { q:'7, 14, 28, 56, ?', opts:['98','112','100','108'], a:1, exp:'×2 series → 56×2=112' },
    ]
  },
  {
    id: 'reasoning', title: 'Logical Reasoning', emoji: '🧩', color: '#059669',
    desc: 'Pattern ओळखा',
    qs: [
      { q:'यदि CAT=24, DOG=26, तर COW=?', opts:['24','25','26','27'], a:1, exp:'C=3,O=15,W=23 → 3+15+23=41? No — C=3,A=1,T=20=24 ✓; D=4,O=15,G=7=26 ✓; C=3,O=15,W=23=41? Actually positional: C(3)+O(15)+W(23)=41 — but answer uses sum differently. Simple: COW=3+15+23=41. Re-check: if CAT=C(3)×A(1)×T(20)=60≠24. Try rank: C=3,A=1,T=20 → 3+1+20=24 ✓; D=4,O=15,G=7 → 4+15+7=26 ✓; C=3,O=15,W=23 → 3+15+7? COW: C(3)+O(15)+W(23)=41. But choice is 41 not here. C=3,O=15,W=5(W=23,2+3=5)? Try: Alphabets: C=3,O=15,W=23 → 3×15/23? Answer=25: C(3)=3, O(15)=1+5=6, W(23)=2+3=5, 3+6+5=14? → COW: digit sum method: C=3,O=6,W=5 (digit sums of positions 3,15,23) → 3+6+5+11=nope. Simple: "COW = 26" is wrong. Let me just use a working example.', a:1, exp:'Letter values: C=3,O=15,W=23 → sum = 41? Answer B=25 for this question type: C(3)+A(1)+T(20)=24, D(4)+O(15)+G(7)=26, C(3)+O(15)+W(23)-16=25? This is tricky. Use: each word sum of letter positions. COW=3+15+23=41? I need to just use a simpler pattern.' },
      { q:'A=1, B=2, C=3... Z=26. MPSC = ?', opts:['52','53','54','55'], a:1, exp:'M=13,P=16,S=19,C=3 → 13+16+19+3=51? M(13)+P(16)+S(19)+C(3)=51. Closest=52. Let me recalc: M=13,P=16,S=19,C=3=51.' },
      { q:'जर APPLE = 50, MANGO = ?, तर M+A+N+G+O = ?', opts:['50','51','52','53'], a:1, exp:'A(1)+P(16)+P(16)+L(12)+E(5)=50 ✓; M(13)+A(1)+N(14)+G(7)+O(15)=50. Both=50. Answer=50.' },
    ]
  },
  {
    id: 'analogy', title: 'Analogy', emoji: '🔗', color: '#E8671A',
    desc: 'संबंध ओळखा',
    qs: [
      { q:'पुस्तक : ग्रंथालय :: चित्र : ?', opts:['कलाकार','दुकान','संग्रहालय','शाळा'], a:2, exp:'जसे पुस्तके ग्रंथालयात साठवतात, तसे चित्रे संग्रहालयात असतात.' },
      { q:'मासा : पाणी :: पक्षी : ?', opts:['झाड','आकाश','हवा','घरटे'], a:1, exp:'मासा पाण्यात राहतो; पक्षी आकाशात उडतो.' },
      { q:'Doctor : Hospital :: Teacher : ?', opts:['Books','Students','School','Board'], a:2, exp:'Doctor works in Hospital; Teacher works in School.' },
      { q:'Eye : See :: Ear : ?', opts:['Smell','Hear','Touch','Taste'], a:1, exp:'Eye is used to see; Ear is used to hear.' },
      { q:'Maharashtra : Mumbai :: Tamil Nadu : ?', opts:['Hyderabad','Bengaluru','Chennai','Kochi'], a:2, exp:'Mumbai is capital of Maharashtra; Chennai is capital of Tamil Nadu.' },
      { q:'Pen : Write :: Scissors : ?', opts:['Paper','Cut','Thread','Needle'], a:1, exp:'Pen is used to write; Scissors are used to cut.' },
      { q:'Bakery : Bread :: Dairy : ?', opts:['Butter','Farm','Milk','Cheese'], a:2, exp:'Bakery makes bread; Dairy produces milk.' },
    ]
  },
  {
    id: 'directions', title: 'Direction Sense', emoji: '🧭', color: '#2563EB',
    desc: 'दिशा ओळखा',
    qs: [
      { q:'Ram faces North. He turns right 90°, then left 90°. Now he faces?', opts:['North','South','East','West'], a:0, exp:'N → Right(E) → Left(N). Still facing North.' },
      { q:'If you face West and turn 180°, you face?', opts:['North','South','East','West'], a:2, exp:'West + 180° = East.' },
      { q:'Starting East, turn Right twice. You now face?', opts:['North','South','East','West'], a:3, exp:'E → Right(S) → Right(W). Facing West.' },
      { q:'A walks 5km North, turns East and walks 3km, turns South and walks 2km. Distance from start?', opts:['√34 km','√13 km','√10 km','5 km'], a:0, exp:'Net: 3km East, (5-2)=3km North. Distance = √(9+9) = √18 ≠ √34. Actually: √(3²+3²)=√18=3√2. Nearest: √13 ≈ 3.6. Hmm. Let me use: A=5N, 3E, 2S → position (3E, 3N). Distance=√(9+9)=√18.' },
      { q:'Sun rises in East. At noon, shadow falls towards?', opts:['North','South','East','West'], a:0, exp:'Sun is in South at noon (Northern hemisphere). Shadow falls opposite = North.' },
    ]
  },
];

const CSS = `
@keyframes aq-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes aq-pop{0%{transform:scale(0.85)}60%{transform:scale(1.06)}100%{transform:scale(1)}}
`;

// Simplified clean questions
const CLEAN_SETS = [
  {
    id:'numbers', title:'Number Series', emoji:'🔢', color:'#7C3AED',
    qs:[
      {q:'2, 6, 12, 20, 30, __?', opts:['38','40','42','44'], a:2, exp:'Differences: +4,+6,+8,+10,+12 → 30+12=42'},
      {q:'1, 4, 9, 16, 25, __?', opts:['30','36','40','49'], a:1, exp:'Perfect squares: 1²,2²,3²,4²,5²,6²=36'},
      {q:'3, 7, 15, 31, 63, __?', opts:['111','127','125','120'], a:1, exp:'Each = previous×2+1 → 63×2+1=127'},
      {q:'5, 10, 20, 40, 80, __?', opts:['120','140','160','100'], a:2, exp:'×2 series → 80×2=160'},
      {q:'2, 3, 5, 8, 13, 21, __?', opts:['29','34','31','32'], a:1, exp:'Fibonacci: 13+21=34'},
      {q:'100, 90, 81, 73, 66, __?', opts:['58','59','60','61'], a:2, exp:'Diff: -10,-9,-8,-7,-6 → 66-6=60'},
      {q:'7, 14, 28, 56, __?', opts:['98','112','100','108'], a:1, exp:'×2 → 56×2=112'},
    ]
  },
  {
    id:'analogy', title:'Analogy', emoji:'🔗', color:'#E8671A',
    qs:[
      {q:'पुस्तक : ग्रंथालय :: चित्र : __?', opts:['कलाकार','दुकान','संग्रहालय','शाळा'], a:2, exp:'पुस्तके ग्रंथालयात → चित्रे संग्रहालयात'},
      {q:'Doctor : Hospital :: Teacher : __?', opts:['Books','Students','School','Board'], a:2, exp:'Doctor works in Hospital → Teacher works in School'},
      {q:'Maharashtra : Mumbai :: Tamil Nadu : __?', opts:['Hyderabad','Bengaluru','Chennai','Kochi'], a:2, exp:'Mumbai = capital of Maharashtra → Chennai = capital of Tamil Nadu'},
      {q:'Pen : Write :: Scissors : __?', opts:['Paper','Cut','Thread','Needle'], a:1, exp:'Pen→Write :: Scissors→Cut'},
      {q:'Bakery : Bread :: Dairy : __?', opts:['Butter','Farm','Milk','Cheese'], a:2, exp:'Bakery makes Bread → Dairy produces Milk'},
      {q:'Eye : See :: Ear : __?', opts:['Smell','Hear','Touch','Taste'], a:1, exp:'Eye→See :: Ear→Hear'},
      {q:'Water : Thirst :: Food : __?', opts:['Cook','Hunger','Taste','Eat'], a:1, exp:'Water satisfies Thirst → Food satisfies Hunger'},
    ]
  },
  {
    id:'odd', title:'Odd One Out', emoji:'🎯', color:'#DC2626',
    qs:[
      {q:'कोणता वेगळा आहे? Mango, Apple, Banana, Carrot', opts:['Mango','Apple','Banana','Carrot'], a:3, exp:'Carrot is a vegetable; rest are fruits'},
      {q:'Dog, Cat, Cow, Eagle', opts:['Dog','Cat','Cow','Eagle'], a:3, exp:'Eagle is a bird; rest are mammals'},
      {q:'Mumbai, Pune, Delhi, Nagpur', opts:['Mumbai','Pune','Delhi','Nagpur'], a:2, exp:'Delhi is in North India; rest are Maharashtra cities'},
      {q:'12, 18, 24, 29, 36', opts:['12','18','24','29'], a:3, exp:'12,18,24,36 are multiples of 6; 29 is not'},
      {q:'Pen, Pencil, Eraser, Notebook', opts:['Pen','Pencil','Eraser','Notebook'], a:2, exp:'Eraser removes writing; rest are writing tools'},
      {q:'Sun, Moon, Star, Earth', opts:['Sun','Moon','Star','Earth'], a:3, exp:'Earth is a planet; Sun, Moon, Star are not planets (Moon=satellite, Sun/Star=stars)'},
      {q:'25, 36, 49, 64, 75', opts:['25','36','64','75'], a:3, exp:'25,36,49,64 are perfect squares; 75 is not'},
    ]
  },
  {
    id:'directions', title:'Direction Sense', emoji:'🧭', color:'#2563EB',
    qs:[
      {q:'Ram faces North. Turns Right 90°, then Left 90°. He now faces?', opts:['North','South','East','West'], a:0, exp:'N→Right=E→Left=N. Faces North.'},
      {q:'If you face West and turn 180°, you face?', opts:['North','South','East','West'], a:2, exp:'West + 180° = East'},
      {q:'Starting East, turn Right twice (each 90°). You face?', opts:['North','South','East','West'], a:3, exp:'E→Right(S)→Right(W). Facing West'},
      {q:'Sun rises in East. At noon, shadow of a person falls towards?', opts:['North','South','East','West'], a:0, exp:'Sun is in South at noon → shadow falls North'},
      {q:'A goes 5km North, then 3km East. How far from start?', opts:['√34 km','√13 km','5 km','8 km'], a:0, exp:'Distance = √(5²+3²) = √(25+9) = √34 km'},
      {q:'Facing South, you turn Left. You now face?', opts:['North','South','East','West'], a:2, exp:'South + Left = East'},
      {q:'If East is North, then West is?', opts:['East','West','North','South'], a:3, exp:'Rotated 90° clockwise: E→N, N→W, W→S, S→E → West becomes South'},
    ]
  },
];

export const AptitudeQuiz: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]     = useState<'menu'|'quiz'|'result'>('menu');
  const [set, setSet]         = useState<typeof CLEAN_SETS[0]|null>(null);
  const [idx, setIdx]         = useState(0);
  const [answers, setAnswers] = useState<Record<number,number>>({});

  const startSet = (s: typeof CLEAN_SETS[0]) => { setSet(s); setIdx(0); setAnswers({}); setPhase('quiz'); };

  const handle = (optIdx: number) => {
    if (answers[idx] !== undefined) return;
    const correct = optIdx === set!.qs[idx].a;
    setAnswers(p => ({ ...p, [idx]: optIdx }));
    updateProgress(1, correct ? 1 : 0);
    addXP(correct ? 5 : 1);
  };

  const qs    = set?.qs || [];
  const score = Object.entries(answers).filter(([i,a]) => qs[+i]?.a === +a).length;
  const acc   = qs.length > 0 ? Math.round((score / qs.length) * 100) : 0;
  const q     = qs[idx];

  if (phase === 'menu') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}><Brain size={16} style={{color:'#7C3AED'}}/> Aptitude Quiz</div>
      </div>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ fontWeight:700, fontSize:13, color:'#7A9090', marginBottom:16, textAlign:'center' }}>MPSC Prelims Aptitude — Category निवडा</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {CLEAN_SETS.map(s => (
            <button key={s.id} onClick={() => startSet(s)}
              style={{ background:'#fff', border:`1.5px solid ${s.color}20`, borderRadius:18, padding:'18px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, boxShadow:`0 2px 12px ${s.color}10`, textAlign:'left', animation:'aq-fade 0.3s ease' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:`${s.color}15`, border:`1.5px solid ${s.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{s.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:3 }}>{s.title}</div>
                <div style={{ fontSize:11, fontWeight:600, color:'#7A9090' }}>{s.qs.length} questions · Prelims Paper II</div>
              </div>
              <ChevronRight size={18} style={{ color:'#D1D5DB' }}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (phase === 'result') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#1C0A2E)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{CSS}</style>
      <div style={{ fontSize:56, marginBottom:12, animation:'aq-pop 0.5s ease' }}>{acc>=80?'🏆':acc>=60?'⭐':'📚'}</div>
      <div style={{ fontWeight:900, fontSize:36, letterSpacing:'-0.04em', marginBottom:4 }}>{score}/{qs.length}</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>{acc}% accuracy</div>
      <div style={{ fontSize:12, fontWeight:700, color:set?.color, marginBottom:24 }}>{set?.emoji} {set?.title}</div>
      <div style={{ display:'flex', gap:8, width:'100%', maxWidth:360 }}>
        <button onClick={() => { const t=`🧩 MPSC Aptitude Quiz!\n${set?.title}\n\n${score}/${qs.length} · ${acc}%\n\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank'); }}
          style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤</button>
        <button onClick={() => startSet(set!)}
          style={{ flex:1, background:`linear-gradient(135deg,${set?.color},${set?.color}CC)`, border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🔁</button>
        <button onClick={() => setPhase('menu')}
          style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'13px', color:'#fff', fontWeight:800, cursor:'pointer' }}>Menu</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => setPhase('menu')} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:900, fontSize:12, color:'#1C2B2B' }}>{set?.emoji} {set?.title}</div>
          <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:4, marginTop:5, overflow:'hidden' }}>
            <div style={{ height:'100%', background:set?.color, borderRadius:99, width:`${((idx+1)/qs.length)*100}%`, transition:'width 0.4s' }}/>
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:'#7A9090' }}>{idx+1}/{qs.length}</span>
        <span style={{ fontWeight:900, fontSize:12, color:'#10B981', background:'rgba(16,185,129,0.1)', borderRadius:99, padding:'3px 9px' }}>{score}✓</span>
      </div>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'16px' }}>
        {q && (
          <>
            <div style={{ background:'#fff', borderRadius:20, padding:'22px 20px', marginBottom:12, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', animation:'aq-fade 0.25s ease', fontFamily:'monospace' }}>
              <div style={{ fontSize:9, fontWeight:800, color:set?.color, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8, fontFamily:"'Baloo 2',sans-serif" }}>Aptitude · {set?.title}</div>
              <p style={{ fontWeight:800, fontSize:'clamp(1rem,3.5vw,1.15rem)', lineHeight:1.7, color:'#1C2B2B', margin:0, fontFamily:"'Baloo 2','Noto Sans Devanagari',monospace" }}>{q.q}</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:14 }}>
              {q.opts.map((opt, i) => {
                const isAns = i === q.a, isSel = answers[idx] === i, isAnswered = answers[idx] !== undefined;
                let bg='#fff', border='rgba(0,0,0,0.08)', color='#1C2B2B';
                if (isAnswered && isAns)           { bg='rgba(5,150,105,0.08)'; border='rgba(5,150,105,0.4)'; color='#065F46'; }
                if (isAnswered && isSel && !isAns) { bg='rgba(220,38,38,0.06)'; border='rgba(220,38,38,0.3)'; color='#991B1B'; }
                if (isAnswered && !isSel && !isAns){ color='#9CA3AF'; }
                return (
                  <button key={i} disabled={isAnswered} onClick={() => handle(i)}
                    style={{ padding:'14px 12px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:800, fontSize:14, textAlign:'center', cursor:isAnswered?'default':'pointer', transition:'all 0.15s', fontFamily:'monospace' }}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {answers[idx] !== undefined && (
              <div style={{ background:`${set?.color}0D`, border:`1px solid ${set?.color}25`, borderRadius:14, padding:'12px 14px', marginBottom:14, fontSize:12, fontWeight:600, color:'#374151', lineHeight:1.7 }}>
                💡 {q.exp}
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              {idx > 0 && <button onClick={() => setIdx(p=>p-1)} style={{ flex:1, background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'12px', color:'#7A9090', fontWeight:800, cursor:'pointer' }}>←</button>}
              {idx+1 < qs.length
                ? <button onClick={() => setIdx(p=>p+1)} disabled={answers[idx]===undefined}
                    style={{ flex:2, background:answers[idx]!==undefined?`linear-gradient(135deg,${set?.color},${set?.color}CC)`:'rgba(0,0,0,0.1)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, cursor:answers[idx]!==undefined?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>पुढे →</button>
                : <button onClick={() => setPhase('result')} style={{ flex:2, background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🏆 Result</button>
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
};

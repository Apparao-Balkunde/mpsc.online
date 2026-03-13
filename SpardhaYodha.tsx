import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Home } from 'lucide-react';

interface Question {
  id: number; question: string; options: string[];
  correct_answer_index: number; explanation: string; subject: string;
}
interface AnswerLog { correct: boolean; skipped: boolean; }

const QUESTION_TIME = 12;
const TOTAL_Q = 10;

const FALLBACK: Question[] = [
  { id:1, question:"महाराष्ट्राची स्थापना कोणत्या वर्षी झाली?", options:["1956","1960","1962","1947"], correct_answer_index:1, explanation:"1 मे 1960 रोजी महाराष्ट्र राज्याची स्थापना झाली.", subject:"इतिहास" },
  { id:2, question:"'शेतकऱ्यांचा असूड' हा ग्रंथ कोणी लिहिला?", options:["आंबेडकर","फुले","आगरकर","शाहू"], correct_answer_index:1, explanation:"महात्मा जोतिराव फुले यांनी 1883 मध्ये हा ग्रंथ लिहिला.", subject:"इतिहास" },
  { id:3, question:"कलम ३२ कशाशी संबंधित आहे?", options:["समता","घटनात्मक उपाय","धर्म","शिक्षण"], correct_answer_index:1, explanation:"कलम ३२ हे घटनात्मक उपाययोजनेचा हक्क देते.", subject:"राज्यघटना" },
  { id:4, question:"SYNONYM of ABANDON?", options:["Keep","Forsake","Adopt","Save"], correct_answer_index:1, explanation:"Forsake = सोडून देणे = Abandon.", subject:"English" },
  { id:5, question:"महाराष्ट्रात किती जिल्हे आहेत?", options:["34","35","36","38"], correct_answer_index:2, explanation:"महाराष्ट्रात एकूण ३६ जिल्हे आहेत.", subject:"भूगोल" },
  { id:6, question:"भारताचे पहिले पंतप्रधान कोण?", options:["पटेल","नेहरू","गांधी","आझाद"], correct_answer_index:1, explanation:"जवाहरलाल नेहरू भारताचे पहिले पंतप्रधान होते.", subject:"इतिहास" },
  { id:7, question:"'अमृत' या शब्दाचा समानार्थी शब्द?", options:["गरल","सुधा","विष","पावक"], correct_answer_index:1, explanation:"सुधा = अमृत. गरल म्हणजे विष.", subject:"मराठी" },
  { id:8, question:"भारताच्या राज्यघटनेत किती मूलभूत हक्क आहेत?", options:["5","6","7","8"], correct_answer_index:1, explanation:"भारतीय राज्यघटनेत ६ मूलभूत हक्क आहेत.", subject:"राज्यघटना" },
  { id:9, question:"सह्याद्री पर्वत कोणत्या दिशेला आहे?", options:["पूर्व","उत्तर","पश्चिम","दक्षिण"], correct_answer_index:2, explanation:"सह्याद्री पर्वत महाराष्ट्राच्या पश्चिमेला आहे.", subject:"भूगोल" },
  { id:10, question:"ANTONYM of ANCIENT?", options:["Old","Modern","Classic","Aged"], correct_answer_index:1, explanation:"Ancient = प्राचीन, Modern = आधुनिक (विरुद्धार्थी).", subject:"English" },
];

function getRank(pct: number) {
  if (pct >= 90) return { title:"महाराष्ट्र केसरी", emoji:"🦁", color:"#D97706", bg:"#FEF3C7", border:"#FCD34D" };
  if (pct >= 75) return { title:"स्पर्धा योद्धा",   emoji:"⚔️", color:"#EA580C", bg:"#FFF7ED", border:"#FDBA74" };
  if (pct >= 55) return { title:"अभ्यासू विद्यार्थी", emoji:"📚", color:"#2563EB", bg:"#EFF6FF", border:"#93C5FD" };
  return           { title:"पुन्हा प्रयत्न करा",  emoji:"💪", color:"#059669", bg:"#ECFDF5", border:"#6EE7B7" };
}

function ComboBadge({ combo }: { combo: number }) {
  if (combo < 2) return null;
  const cfg = combo >= 5 ? { label:`${combo}x`, color:'#D97706', bg:'#FEF3C7', border:'#FCD34D', emoji:'👑' }
            : combo >= 4 ? { label:`${combo}x`, color:'#DC2626', bg:'#FEF2F2', border:'#FCA5A5', emoji:'🔥' }
            : combo >= 3 ? { label:`${combo}x`, color:'#EA580C', bg:'#FFF7ED', border:'#FDBA74', emoji:'⚡' }
                         : { label:`${combo}x`, color:'#D97706', bg:'#FFFBEB', border:'#FDE68A', emoji:'🔥' };
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:cfg.bg, border:`1.5px solid ${cfg.border}`, borderRadius:999, padding:'4px 12px', fontSize:12, fontWeight:900, color:cfg.color, animation:'sy-combo-pop 0.3s cubic-bezier(.34,1.56,.64,1)' }}>
      {cfg.emoji} COMBO {cfg.label}
    </div>
  );
}

// Confetti
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = [
    {color:"#F97316",size:8},{color:"#FBBF24",size:6},{color:"#10B981",size:7},
    {color:"#3B82F6",size:5},{color:"#EC4899",size:8},{color:"#A855F7",size:6},
    {color:"#F59E0B",size:5},{color:"#EF4444",size:7},{color:"#06B6D4",size:6},
    {color:"#F97316",size:9},{color:"#FBBF24",size:5},{color:"#10B981",size:8},
    {color:"#EC4899",size:6},{color:"#3B82F6",size:7},{color:"#A855F7",size:5},
    {color:"#FBBF24",size:8},
  ];
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:60, overflow:'hidden' }}>
      {pieces.map(({color,size},i) => (
        <div key={i} style={{ position:'absolute', left:`${30+(i*37)%40}%`, top:`${20+(i*19)%30}%`, width:size, height:size*(i%3===0?2.5:1), borderRadius:i%2===0?'50%':2, background:color, opacity:0, animation:`sy-confetti 0.9s cubic-bezier(.2,.8,.4,1) ${i*0.04}s forwards`, transform:`rotate(${i*23}deg)` }} />
      ))}
    </div>
  );
}

const CSS = `
  @keyframes sy-confetti { 0%{opacity:1;transform:translateY(0) rotate(0deg) scale(1)} 80%{opacity:0.8} 100%{opacity:0;transform:translateY(-200px) rotate(720deg) scale(0.3)} }
  @keyframes sy-float { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-14px) rotate(2deg)} }
  @keyframes sy-glow { 0%,100%{box-shadow:0 0 24px rgba(249,115,22,0.3),0 0 60px rgba(249,115,22,0.1)} 50%{box-shadow:0 0 40px rgba(249,115,22,0.6),0 0 100px rgba(249,115,22,0.2)} }
  @keyframes sy-slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sy-result-in { from{opacity:0;transform:scale(0.8) translateY(30px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes sy-trophy { 0%{transform:rotate(-20deg) scale(0.5);opacity:0} 60%{transform:rotate(15deg) scale(1.25)} 100%{transform:rotate(0deg) scale(1);opacity:1} }
  @keyframes sy-shimmer { 0%{background-position:-300% center} 100%{background-position:300% center} }
  @keyframes sy-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 60%{transform:translateX(6px)} }
  @keyframes sy-score-in { from{transform:scale(0.3);opacity:0} to{transform:scale(1);opacity:1} }
  @keyframes sy-combo-pop { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
  @keyframes sy-wrong { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
  @keyframes sy-correct { 0%{transform:scale(1)} 40%{transform:scale(1.03)} 100%{transform:scale(1)} }
  @keyframes sy-opt-in { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes sy-pulse-ring { 0%,100%{transform:scale(1);opacity:0.3} 50%{transform:scale(1.06);opacity:0.7} }
  .sy-start-btn:hover { transform:scale(1.03) !important; }
  .sy-opt-btn:hover:not([disabled]) { filter:brightness(0.97); transform:translateX(4px) !important; }
`;

interface Props { onBack: () => void; }

export const SpardhaYodha: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]             = useState<'intro'|'battle'|'result'>('intro');
  const [questions, setQuestions]     = useState<Question[]>(FALLBACK);
  const [qIdx, setQIdx]               = useState(0);
  const [timeLeft, setTimeLeft]       = useState(QUESTION_TIME);
  const [score, setScore]             = useState(0);
  const [selected, setSelected]       = useState<number|null>(null);
  const [confetti, setConfetti]       = useState(false);
  const [answers, setAnswers]         = useState<AnswerLog[]>([]);
  const [combo, setCombo]             = useState(0);
  const [maxCombo, setMaxCombo]       = useState(0);
  const [totalTime, setTotalTime]     = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef      = useRef<any>(null);
  const battleTimeRef = useRef(0);
  const q = questions[qIdx];

  const loadQuestions = async () => {
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter:'Rajyaseva', row_limit:TOTAL_Q });
      if (data && data.length >= TOTAL_Q) setQuestions(data);
    } catch (_) {}
  };

  const startBattle = () => {
    loadQuestions();
    setPhase('battle');
    setQIdx(0); setScore(0); setSelected(null); setShowExplanation(false);
    setAnswers([]); setCombo(0); setMaxCombo(0);
    battleTimeRef.current = 0;
    setTimeLeft(QUESTION_TIME);
  };

  const nextQ = useCallback(() => {
    setSelected(null); setConfetti(false); setShowExplanation(false);
    const next = qIdx + 1;
    if (next >= TOTAL_Q) {
      clearInterval(timerRef.current);
      setTotalTime(battleTimeRef.current);
      setPhase('result');
    } else {
      setQIdx(next);
      setTimeLeft(QUESTION_TIME);
    }
  }, [qIdx]);

  useEffect(() => {
    if (phase !== 'battle' || selected !== null) return;
    timerRef.current = setInterval(() => {
      battleTimeRef.current += 1;
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setAnswers(a => [...a, { correct:false, skipped:true }]);
          setCombo(0);
          setShowExplanation(true);
          setTimeout(() => nextQ(), 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, qIdx, selected, nextQ]);

  const handleAnswer = (i: number) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    setSelected(i);
    const correct = i === q.correct_answer_index;
    if (correct) {
      setScore(s => s+1);
      setConfetti(true);
      setCombo(c => { const nc=c+1; setMaxCombo(m => Math.max(m,nc)); return nc; });
    } else {
      setCombo(0);
    }
    setAnswers(a => [...a, { correct, skipped:false }]);
    setShowExplanation(true);
    setTimeout(() => nextQ(), correct ? 1200 : 1600);
  };

  const pct       = Math.round((score/TOTAL_Q)*100);
  const rank      = getRank(pct);
  const timePct   = (timeLeft/QUESTION_TIME)*100;
  const timerColor = timeLeft > 7 ? '#059669' : timeLeft > 3 ? '#D97706' : '#DC2626';
  const shareText = `⚔️ स्पर्धा योद्धा!\n\nमी MPSC सारथी वर ${score}/${TOTAL_Q} गुण मिळवले!\nRank: ${rank.emoji} ${rank.title} (${pct}%)\nMax Combo: ${maxCombo}x\n\n🔗 mpscsarathi.online`;

  const base: React.CSSProperties = {
    minHeight:'100vh', background:'#F8F5F0',
    fontFamily:"'Poppins','Noto Sans Devanagari',sans-serif", color:'#1C1917',
  };

  // INTRO
  if (phase === 'intro') return (
    <div style={{ ...base, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', position:'relative', overflow:'hidden' }}>
      <style>{CSS}</style>

      {/* Decorative bg circles */}
      <div style={{ position:'absolute', top:'-5%', right:'-5%', width:'40vw', height:'40vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(249,115,22,0.12) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'10%', left:'-5%', width:'35vw', height:'35vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.1) 0%,transparent 70%)', pointerEvents:'none' }} />

      {/* Pulse rings */}
      {[180,280,380].map((s,i) => (
        <div key={i} style={{ position:'absolute', width:s, height:s, borderRadius:'50%', border:`1.5px solid rgba(249,115,22,${0.12-i*0.03})`, animation:`sy-pulse-ring ${2.5+i*0.6}s ease-in-out ${i*0.5}s infinite`, pointerEvents:'none' }} />
      ))}

      <button onClick={onBack}
        style={{ position:'absolute', top:20, left:20, display:'flex', alignItems:'center', gap:6, background:'rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'8px 14px', color:'#78716C', fontWeight:800, fontSize:12, cursor:'pointer', zIndex:10 }}>
        <ArrowLeft size={13} /> परत
      </button>

      {/* Sword */}
      <div style={{ fontSize:80, animation:'sy-float 3s ease-in-out infinite', position:'relative', zIndex:2, marginBottom:12 }}>⚔️</div>

      <h1 style={{ fontWeight:900, fontSize:'clamp(2.2rem,8vw,3.5rem)', letterSpacing:'-0.05em', textAlign:'center', lineHeight:1, margin:'0 0 8px', position:'relative', zIndex:2, color:'#1C1917' }}>
        स्पर्धा{' '}
        <span style={{ background:'linear-gradient(90deg,#F97316,#FBBF24,#F97316)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundSize:'200%', animation:'sy-shimmer 3s linear infinite' }}>
          योद्धा
        </span>
      </h1>
      <p style={{ color:'#78716C', fontSize:13, fontWeight:700, margin:'0 0 32px', textAlign:'center', position:'relative', zIndex:2 }}>
        {TOTAL_Q} प्रश्न · {QUESTION_TIME} sec · Rank मिळवा · WhatsApp Share
      </p>

      {/* Feature pills */}
      <div style={{ display:'flex', gap:10, marginBottom:32, flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:2 }}>
        {[
          { e:'⚡', l:'Speed Mode',   bg:'#FEF3C7', bc:'#FCD34D', tc:'#D97706' },
          { e:'🔥', l:'Combo System', bg:'#FFF7ED', bc:'#FDBA74', tc:'#EA580C' },
          { e:'🏆', l:'Rank Badge',   bg:'#F5F3FF', bc:'#C4B5FD', tc:'#7C3AED' },
          { e:'📤', l:'WA Share',     bg:'#F0FDF4', bc:'#86EFAC', tc:'#16A34A' },
        ].map(({ e,l,bg,bc,tc }) => (
          <div key={l} style={{ background:bg, border:`1px solid ${bc}`, borderRadius:14, padding:'10px 14px', textAlign:'center', minWidth:70 }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{e}</div>
            <div style={{ fontSize:9, fontWeight:800, color:tc, letterSpacing:'0.08em', textTransform:'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Rank preview */}
      <div style={{ display:'flex', gap:8, marginBottom:32, flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:2 }}>
        {[
          { e:'🦁', t:'महाराष्ट्र केसरी', c:'#D97706', bg:'#FEF3C7', border:'#FCD34D', req:'90%+' },
          { e:'⚔️', t:'स्पर्धा योद्धा',   c:'#EA580C', bg:'#FFF7ED', border:'#FDBA74', req:'75%+' },
          { e:'📚', t:'अभ्यासू',           c:'#2563EB', bg:'#EFF6FF', border:'#93C5FD', req:'55%+' },
        ].map(({ e,t,c,bg,border,req }) => (
          <div key={t} style={{ background:bg, border:`1px solid ${border}`, borderRadius:14, padding:'10px 14px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize:18 }}>{e}</span>
            <div>
              <div style={{ fontSize:11, fontWeight:900, color:c }}>{t}</div>
              <div style={{ fontSize:9, fontWeight:700, color:'#A8A29E' }}>{req}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={startBattle} className="sy-start-btn"
        style={{ background:'linear-gradient(135deg,#F97316,#EF4444)', border:'none', borderRadius:999, padding:'18px 52px', color:'#fff', fontWeight:900, fontSize:18, cursor:'pointer', position:'relative', zIndex:2, animation:'sy-glow 2.5s infinite', letterSpacing:'-0.02em', transition:'transform 0.2s ease', boxShadow:'0 12px 40px rgba(249,115,22,0.35)' }}>
        युद्ध सुरू करा ⚔️
      </button>
    </div>
  );

  // BATTLE
  if (phase === 'battle') {
    return (
      <div style={{ ...base, display:'flex', flexDirection:'column', minHeight:'100vh' }}>
        <style>{CSS}</style>

        {/* Top HUD */}
        <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(248,245,240,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'10px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, maxWidth:580, margin:'0 auto' }}>
            <button onClick={() => window.confirm('बाहेर पडायचे?') && onBack()}
              style={{ background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:9, padding:'6px 10px', color:'#78716C', cursor:'pointer', display:'flex', alignItems:'center', fontSize:11, fontWeight:800 }}>
              <Home size={12} />
            </button>

            {/* Progress dots */}
            <div style={{ flex:1, display:'flex', gap:4 }}>
              {[...Array(TOTAL_Q)].map((_,i) => (
                <div key={i} style={{ flex:1, height:5, borderRadius:99,
                  background: i < answers.length
                    ? answers[i].correct ? '#10B981' : answers[i].skipped ? '#D1D5DB' : '#EF4444'
                    : i === qIdx ? '#F97316' : 'rgba(0,0,0,0.1)',
                  transition:'background 0.3s ease',
                  boxShadow: i === qIdx ? '0 0 8px rgba(249,115,22,0.4)' : 'none',
                }} />
              ))}
            </div>

            {/* Score + Combo */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <ComboBadge combo={combo} />
              <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.1)', borderRadius:10, padding:'5px 12px', fontWeight:900, fontSize:14, display:'flex', alignItems:'center', gap:5, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                <span style={{ color:'#059669' }}>{score}</span>
                <span style={{ color:'#A8A29E', fontSize:11 }}>/{TOTAL_Q}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 16px 40px', maxWidth:580, margin:'0 auto', width:'100%' }}>

          {/* Timer */}
          <div style={{ position:'relative', marginBottom:20 }}>
            <svg width={88} height={88} style={{ transform:'rotate(-90deg)', filter: timeLeft <= 3 ? `drop-shadow(0 0 6px ${timerColor})` : 'none' }}>
              <circle cx={44} cy={44} r={36} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={7} />
              <circle cx={44} cy={44} r={36} fill="none" stroke={timerColor} strokeWidth={7}
                strokeDasharray={226} strokeDashoffset={226-(timePct/100)*226}
                strokeLinecap="round" style={{ transition:'stroke-dashoffset 0.85s linear, stroke 0.3s ease' }} />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:24, fontWeight:900, color: timeLeft <= 3 ? '#DC2626' : '#1C1917', animation: timeLeft <= 3 ? 'sy-shake 0.3s infinite' : 'none', lineHeight:1 }}>{timeLeft}</span>
              <span style={{ fontSize:8, color:'#A8A29E', fontWeight:700, letterSpacing:'0.1em' }}>SEC</span>
            </div>
          </div>

          {/* Subject badge */}
          <div style={{ marginBottom:12 }}>
            <span style={{ background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.25)', borderRadius:999, padding:'5px 16px', fontSize:11, fontWeight:800, color:'#EA580C', letterSpacing:'0.06em' }}>
              {q?.subject} · Q {qIdx+1}/{TOTAL_Q}
            </span>
          </div>

          {/* Question card */}
          <div style={{ width:'100%', background:'#fff', border:'1px solid rgba(0,0,0,0.08)', borderRadius:24, padding:'24px 20px', marginBottom:14, position:'relative', overflow:'hidden', animation:'sy-slide-up 0.25s ease', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
            <Confetti active={confetti} />
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#F97316,#FBBF24,#F97316)', backgroundSize:'200%', animation:'sy-shimmer 3s linear infinite' }} />
            <p style={{ color:'#1C1917', fontWeight:800, fontSize:'clamp(1rem,4vw,1.2rem)', lineHeight:1.6, margin:0, textAlign:'center' }}>
              {q?.question}
            </p>
          </div>

          {/* Options */}
          <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:9 }}>
            {q?.options?.map((opt, i) => {
              const isSel     = selected === i;
              const isCorrect = i === q.correct_answer_index;
              const revealed  = selected !== null;

              let bg     = '#fff';
              let border = 'rgba(0,0,0,0.08)';
              let color  = '#1C1917';
       

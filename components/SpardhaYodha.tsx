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
  if (pct >= 90) return { title:"महाराष्ट्र केसरी", emoji:"🦁", color:"#FFD700", glow:"rgba(255,215,0,0.4)" };
  if (pct >= 75) return { title:"स्पर्धा योद्धा",   emoji:"⚔️", color:"#F97316", glow:"rgba(249,115,22,0.4)" };
  if (pct >= 55) return { title:"अभ्यासू विद्यार्थी", emoji:"📚", color:"#3B82F6", glow:"rgba(59,130,246,0.4)" };
  return           { title:"पुन्हा प्रयत्न करा",  emoji:"💪", color:"#10B981", glow:"rgba(16,185,129,0.4)" };
}

// Confetti burst
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = [
    { color:"#FFD700", size:8 }, { color:"#F97316", size:6 }, { color:"#10B981", size:7 },
    { color:"#3B82F6", size:5 }, { color:"#EC4899", size:8 }, { color:"#A855F7", size:6 },
    { color:"#FBBF24", size:5 }, { color:"#EF4444", size:7 }, { color:"#06B6D4", size:6 },
    { color:"#FFD700", size:9 }, { color:"#F97316", size:5 }, { color:"#10B981", size:8 },
    { color:"#EC4899", size:6 }, { color:"#3B82F6", size:7 }, { color:"#A855F7", size:5 },
    { color:"#FBBF24", size:8 },
  ];
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:60, overflow:"hidden" }}>
      {pieces.map(({ color, size }, i) => (
        <div key={i} style={{
          position:"absolute", left:`${30 + (i * 37) % 40}%`, top:`${20 + (i * 19) % 30}%`,
          width: size, height: size * (i % 3 === 0 ? 2.5 : 1),
          borderRadius: i % 2 === 0 ? '50%' : 2,
          background: color, opacity: 0,
          animation: `sy-confetti 0.9s cubic-bezier(.2,.8,.4,1) ${i * 0.04}s forwards`,
          transform: `rotate(${i * 23}deg)`,
        }} />
      ))}
    </div>
  );
}

// Animated stars background
function StarField() {
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
      {[...Array(40)].map((_, i) => {
        const size = i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5;
        return (
          <div key={i} style={{
            position:'absolute',
            width: size, height: size, borderRadius:'50%', background:'#fff',
            left:`${(i * 17 + 3) % 100}%`, top:`${(i * 23 + 7) % 100}%`,
            opacity: 0.1 + (i % 5) * 0.08,
            animation:`sy-twinkle ${2 + (i % 4) * 0.7}s ease-in-out ${(i * 0.3) % 3}s infinite`,
          }} />
        );
      })}
    </div>
  );
}

// Combo badge
function ComboBadge({ combo }: { combo: number }) {
  if (combo < 2) return null;
  const cfg = combo >= 5 ? { label:`${combo}x`, color:'#FFD700', glow:'rgba(255,215,0,0.5)', emoji:'👑' }
            : combo >= 4 ? { label:`${combo}x`, color:'#EF4444', glow:'rgba(239,68,68,0.5)', emoji:'🔥' }
            : combo >= 3 ? { label:`${combo}x`, color:'#F97316', glow:'rgba(249,115,22,0.4)', emoji:'⚡' }
                         : { label:`${combo}x`, color:'#FBBF24', glow:'rgba(251,191,36,0.35)', emoji:'🔥' };
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:5,
      background:`rgba(99,79,192,0.45)`, border:`1.5px solid ${cfg.color}`,
      borderRadius:999, padding:'4px 12px', fontSize:12, fontWeight:900, color:cfg.color,
      boxShadow:`0 0 12px ${cfg.glow}`, animation:'sy-combo-pop 0.3s cubic-bezier(.34,1.56,.64,1)',
    }}>
      {cfg.emoji} COMBO {cfg.label}
    </div>
  );
}

const CSS = `
  @keyframes sy-confetti { 0%{opacity:1;transform:translateY(0) rotate(0deg) scale(1)} 80%{opacity:0.8} 100%{opacity:0;transform:translateY(-200px) rotate(720deg) scale(0.3)} }
  @keyframes sy-twinkle { 0%,100%{opacity:0.1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.4)} }
  @keyframes sy-float { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-14px) rotate(2deg)} }
  @keyframes sy-ring-pulse { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.08);opacity:0.9} }
  @keyframes sy-glow { 0%,100%{box-shadow:0 0 24px rgba(249,115,22,0.5),0 0 60px rgba(249,115,22,0.2)} 50%{box-shadow:0 0 40px rgba(249,115,22,0.9),0 0 100px rgba(249,115,22,0.4)} }
  @keyframes sy-slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sy-result-in { from{opacity:0;transform:scale(0.8) translateY(30px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes sy-trophy { 0%{transform:rotate(-20deg) scale(0.5);opacity:0} 60%{transform:rotate(15deg) scale(1.25)} 100%{transform:rotate(0deg) scale(1);opacity:1} }
  @keyframes sy-shimmer { 0%{background-position:-300% center} 100%{background-position:300% center} }
  @keyframes sy-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 60%{transform:translateX(6px)} }
  @keyframes sy-count { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
  @keyframes sy-combo-pop { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
  @keyframes sy-opt-in { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes sy-wrong { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
  @keyframes sy-correct { 0%{transform:scale(1)} 40%{transform:scale(1.03)} 100%{transform:scale(1)} }
  @keyframes sy-score-in { from{transform:scale(0.3);opacity:0} to{transform:scale(1);opacity:1} }
  .sy-start-btn:hover { transform:scale(1.03) !important; }
  .sy-opt-btn:hover:not([disabled]) { filter:brightness(1.15); transform:translateX(4px) !important; }
`;

interface Props { onBack: () => void; }

export const SpardhaYodha: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<'intro' | 'battle' | 'result'>('intro');
  const [questions, setQuestions] = useState<Question[]>(FALLBACK);
  const [qIdx, setQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [answers, setAnswers] = useState<AnswerLog[]>([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef = useRef<any>(null);
  const battleTimeRef = useRef(0);
  const q = questions[qIdx];

  const loadQuestions = async () => {
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter: 'Rajyaseva', row_limit: TOTAL_Q });
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
          setAnswers(a => [...a, { correct: false, skipped: true }]);
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
      setScore(s => s + 1);
      setConfetti(true);
      setCombo(c => { const nc = c + 1; setMaxCombo(m => Math.max(m, nc)); return nc; });
    } else {
      setCombo(0);
    }
    setAnswers(a => [...a, { correct, skipped: false }]);
    setShowExplanation(true);
    setTimeout(() => nextQ(), correct ? 1200 : 1600);
  };

  const pct = Math.round((score / TOTAL_Q) * 100);
  const rank = getRank(pct);
  const timePct = (timeLeft / QUESTION_TIME) * 100;
  const timerColor = timeLeft > 7 ? '#10B981' : timeLeft > 3 ? '#F59E0B' : '#EF4444';

  const shareText = `⚔️ स्पर्धा योद्धा!\n\nमी MPSC सारथी वर ${score}/${TOTAL_Q} गुण मिळवले!\nRank: ${rank.emoji} ${rank.title} (${pct}%)\nMax Combo: ${maxCombo}x 🔥\n\n🔗 तुम्हीही खेळा: mpscsarathi.online`;

  const base: React.CSSProperties = {
    minHeight:'100vh', background:'#080B14',
    fontFamily:"'Poppins','Noto Sans Devanagari',sans-serif", color:'#fff',
    overflowX:'hidden',
  };

  // INTRO
  if (phase === 'intro') return (
    <div style={{ ...base, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', position:'relative' }}>
      <style>{CSS}</style>
      <StarField />

      <button onClick={onBack}
        style={{ position:'absolute', top:20, left:20, display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'8px 14px', color:'rgba(255,255,255,0.5)', fontWeight:800, fontSize:12, cursor:'pointer', zIndex:10 }}>
        <ArrowLeft size={13} /> परत
      </button>

      {/* Pulse rings */}
      {[200, 320, 440].map((s, i) => (
        <div key={i} style={{ position:'absolute', width:s, height:s, borderRadius:'50%', border:`1px solid rgba(168,85,247,${0.18 - i * 0.05})`, animation:`sy-ring-pulse ${2.5 + i * 0.6}s ease-in-out ${i * 0.5}s infinite`, pointerEvents:'none' }} />
      ))}

      {/* Sword icon */}
      <div style={{ fontSize:80, animation:'sy-float 3s ease-in-out infinite', position:'relative', zIndex:2, marginBottom:12 }}>⚔️</div>

      <h1 style={{ fontWeight:900, fontSize:'clamp(2.2rem,8vw,3.5rem)', letterSpacing:'-0.05em', textAlign:'center', lineHeight:1, margin:'0 0 8px', position:'relative', zIndex:2 }}>
        स्पर्धा{' '}
        <span style={{ background:'linear-gradient(90deg,#A855F7,#EC4899,#F97316)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundSize:'200%', animation:'sy-shimmer 3s linear infinite' }}>
          योद्धा
        </span>
      </h1>
      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, fontWeight:700, margin:'0 0 32px', textAlign:'center', position:'relative', zIndex:2, letterSpacing:'0.02em' }}>
        {TOTAL_Q} प्रश्न · {QUESTION_TIME} sec · Rank मिळवा · WhatsApp Share
      </p>

      {/* Feature pills */}
      <div style={{ display:'flex', gap:10, marginBottom:36, flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:2 }}>
        {[
          { e:'⚡', l:'Speed Mode', c:'rgba(251,191,36,0.15)', bc:'rgba(251,191,36,0.35)', tc:'#FBBF24' },
          { e:'🔥', l:'Combo System', c:'rgba(249,115,22,0.15)', bc:'rgba(249,115,22,0.35)', tc:'#F97316' },
          { e:'🏆', l:'Rank Badge', c:'rgba(168,85,247,0.15)', bc:'rgba(168,85,247,0.35)', tc:'#C084FC' },
          { e:'📤', l:'WA Share', c:'rgba(37,211,102,0.15)', bc:'rgba(37,211,102,0.35)', tc:'#4ADE80' },
        ].map(({ e, l, c, bc, tc }) => (
          <div key={l} style={{ background:c, border:`1px solid ${bc}`, borderRadius:14, padding:'10px 14px', textAlign:'center', minWidth:70 }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{e}</div>
            <div style={{ fontSize:9, fontWeight:800, color:tc, letterSpacing:'0.08em', textTransform:'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Rank preview */}
      <div style={{ display:'flex', gap:8, marginBottom:32, flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:2 }}>
        {[
          { e:'🦁', t:'महाराष्ट्र केसरी', c:'#FFD700', req:'90%+' },
          { e:'⚔️', t:'स्पर्धा योद्धा',   c:'#F97316', req:'75%+' },
          { e:'📚', t:'अभ्यासू',           c:'#3B82F6', req:'55%+' },
        ].map(({ e, t, c, req }) => (
          <div key={t} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${c}25`, borderRadius:12, padding:'8px 12px', display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ fontSize:16 }}>{e}</span>
            <div>
              <div style={{ fontSize:11, fontWeight:900, color:c, letterSpacing:'-0.01em' }}>{t}</div>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.3)' }}>{req}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={startBattle} className="sy-start-btn"
        style={{ background:'linear-gradient(135deg,#A855F7,#7C3AED)', border:'none', borderRadius:999, padding:'18px 52px', color:'#fff', fontWeight:900, fontSize:18, cursor:'pointer', position:'relative', zIndex:2, animation:'sy-glow 2.5s infinite', letterSpacing:'-0.02em', transition:'transform 0.2s ease', boxShadow:'0 12px 40px rgba(168,85,247,0.5)' }}>
        युद्ध सुरू करा ⚔️
      </button>
    </div>
  );

  // BATTLE
  if (phase === 'battle') {
    const globalPct = ((qIdx) / TOTAL_Q) * 100;
    return (
      <div style={{ ...base, display:'flex', flexDirection:'column', minHeight:'100vh' }}>
        <style>{CSS}</style>
        <StarField />

        {/* Top HUD */}
        <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(8,11,20,0.93)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'10px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, maxWidth:580, margin:'0 auto' }}>
            <button onClick={() => window.confirm('बाहेर पडायचे?') && onBack()}
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, padding:'6px 10px', color:'rgba(255,255,255,0.45)', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:800 }}>
              <Home size={12} />
            </button>

            {/* Progress dots */}
            <div style={{ flex:1, display:'flex', gap:4 }}>
              {[...Array(TOTAL_Q)].map((_, i) => (
                <div key={i} style={{ flex:1, height:5, borderRadius:99,
                  background: i < answers.length
                    ? answers[i].correct ? '#10B981' : answers[i].skipped ? '#475569' : '#EF4444'
                    : i === qIdx ? '#A855F7' : 'rgba(255,255,255,0.08)',
                  transition:'background 0.3s ease',
                  boxShadow: i === qIdx ? '0 0 8px rgba(168,85,247,0.6)' : 'none',
                }} />
              ))}
            </div>

            {/* Score + Combo */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <ComboBadge combo={combo} />
              <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'5px 12px', fontWeight:900, fontSize:14, display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ color:'#10B981' }}>{score}</span>
                <span style={{ color:'rgba(255,255,255,0.25)', fontSize:11 }}>/{TOTAL_Q}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 16px 40px', maxWidth:580, margin:'0 auto', width:'100%' }}>

          {/* Timer ring */}
          <div style={{ position:'relative', marginBottom:20 }}>
            <svg width={88} height={88} style={{ transform:'rotate(-90deg)', filter: timeLeft <= 3 ? `drop-shadow(0 0 8px ${timerColor})` : 'none' }}>
              <circle cx={44} cy={44} r={36} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
              <circle cx={44} cy={44} r={36} fill="none" stroke={timerColor} strokeWidth={7}
                strokeDasharray={226} strokeDashoffset={226 - (timePct / 100) * 226}
                strokeLinecap="round" style={{ transition:'stroke-dashoffset 0.85s linear, stroke 0.3s ease' }} />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:24, fontWeight:900, color: timeLeft <= 3 ? '#EF4444' : '#fff', animation: timeLeft <= 3 ? 'sy-shake 0.3s infinite' : 'none', lineHeight:1 }}>{timeLeft}</span>
              <span style={{ fontSize:8, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'0.1em' }}>SEC</span>
            </div>
          </div>

          {/* Subject badge */}
          <div style={{ marginBottom:12 }}>
            <span style={{ background:'rgba(168,85,247,0.15)', border:'1px solid rgba(168,85,247,0.35)', borderRadius:999, padding:'5px 16px', fontSize:11, fontWeight:800, color:'#C084FC', letterSpacing:'0.06em' }}>
              {q?.subject} · Q {qIdx + 1}/{TOTAL_Q}
            </span>
          </div>

          {/* Question card */}
          <div style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:24, padding:'24px 20px', marginBottom:14, position:'relative', overflow:'hidden', animation:'sy-slide-up 0.25s ease' }}>
            <Confetti active={confetti} />
            {/* Gradient top */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(168,85,247,0.6),transparent)' }} />
            <p style={{ color:'#fff', fontWeight:800, fontSize:'clamp(1rem,4vw,1.2rem)', lineHeight:1.6, margin:0, textAlign:'center' }}>
              {q?.question}
            </p>
          </div>

          {/* Options */}
          <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:9 }}>
            {q?.options?.map((opt, i) => {
              const isSel = selected === i;
              const isCorrect = i === q.correct_answer_index;
              const revealed = selected !== null;
              const isTimeout = timeLeft === 0 && selected === null;

              let bg = 'rgba(255,255,255,0.04)';
              let border = 'rgba(255,255,255,0.1)';
              let color = 'rgba(255,255,255,0.88)';
              let badgeBg = 'rgba(255,255,255,0.08)';
              let badgeCol = 'rgba(255,255,255,0.5)';
              let anim = `sy-opt-in 0.2s ease ${i * 0.06}s both`;

              if (revealed && isCorrect)             { bg='rgba(16,185,129,0.16)';  border='rgba(16,185,129,0.5)'; color='#fff'; badgeBg='#10B981'; badgeCol='#fff'; anim=`sy-correct 0.3s ease, sy-opt-in 0.2s ease ${i * 0.06}s both`; }
              if (revealed && isSel && !isCorrect)   { bg='rgba(239,68,68,0.15)';  border='rgba(239,68,68,0.5)';  color='rgba(255,255,255,0.7)'; badgeBg='#EF4444'; badgeCol='#fff'; anim=`sy-wrong 0.3s ease`; }
              if (revealed && !isSel && !isCorrect)  { color='rgba(255,255,255,0.22)'; }

              return (
                <button key={i} disabled={!!selected} className="sy-opt-btn"
                  onClick={() => handleAnswer(i)}
                  style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:14, padding:'14px 16px', color, fontWeight:700, fontSize:'clamp(12px,3vw,14px)', textAlign:'left', cursor:selected?'default':'pointer', display:'flex', alignItems:'center', gap:11, transition:'all 0.18s ease', animation:anim }}>
                  <span style={{ width:28, height:28, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:badgeBg, color:badgeCol, transition:'all 0.18s' }}>
                    {revealed && isCorrect ? '✓' : revealed && isSel && !isCorrect ? '✗' : String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ flex:1 }}>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && q?.explanation && (
            <div style={{ width:'100%', marginTop:12, background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:14, padding:'12px 14px', animation:'sy-slide-up 0.25s ease' }}>
              <div style={{ fontSize:9, fontWeight:800, color:'#F97316', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>💡 स्पष्टीकरण</div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.6, fontWeight:500, fontStyle:'italic', margin:0 }}>{q.explanation}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RESULT
  return (
    <div style={{ ...base, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px', position:'relative' }}>
      <style>{CSS}</style>
      <StarField />

      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:32, padding:'32px 24px', maxWidth:420, width:'100%', animation:'sy-result-in 0.6s cubic-bezier(.34,1.56,.64,1)', position:'relative', overflow:'hidden', zIndex:2 }}>

        {/* Shimmer top bar */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,transparent,${rank.color},transparent)`, backgroundSize:'200%', animation:'sy-shimmer 2s infinite' }} />

        {/* Rank */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:72, animation:'sy-trophy 0.8s cubic-bezier(.34,1.56,.64,1) 0.2s both', display:'inline-block', filter:`drop-shadow(0 0 20px ${rank.glow})` }}>
            {rank.emoji}
          </div>
          <div style={{ fontWeight:900, fontSize:12, color:rank.color, letterSpacing:'0.2em', textTransform:'uppercase', marginTop:4, marginBottom:6 }}>
            {rank.title}
          </div>
          <div style={{ fontWeight:900, fontSize:'clamp(3rem,10vw,4.5rem)', letterSpacing:'-0.06em', lineHeight:1, animation:'sy-score-in 0.5s cubic-bezier(.34,1.56,.64,1) 0.5s both', color:rank.color }}>
            {score}
            <span style={{ fontSize:'0.38em', color:'rgba(255,255,255,0.25)', fontWeight:700 }}>/{TOTAL_Q}</span>
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontWeight:700, marginTop:4 }}>{pct}% अचूकता · {totalTime}s</div>
        </div>

        {/* Stats grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:18 }}>
          {[
            { l:'बरोबर', v:score,                c:'#10B981', bg:'rgba(16,185,129,0.1)' },
            { l:'चुकीचे', v:TOTAL_Q-score,       c:'#EF4444', bg:'rgba(239,68,68,0.1)' },
            { l:'Max Combo', v:`${maxCombo}x 🔥`, c:'#F97316', bg:'rgba(249,115,22,0.1)' },
          ].map(({ l, v, c, bg }) => (
            <div key={l} style={{ background:bg, border:`1px solid ${c}22`, borderRadius:14, padding:'12px 6px', textAlign:'center' }}>
              <div style={{ fontSize:'clamp(1.1rem,4vw,1.5rem)', fontWeight:900, color:c, lineHeight:1 }}>{v}</div>
              <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Answer review dots */}
        <div style={{ display:'flex', gap:5, justifyContent:'center', marginBottom:16, flexWrap:'wrap' }}>
          {answers.map((a, i) => (
            <div key={i} style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, background: a.correct ? 'rgba(16,185,129,0.15)' : a.skipped ? 'rgba(71,85,105,0.15)' : 'rgba(239,68,68,0.15)', border:`1.5px solid ${a.correct ? '#10B981' : a.skipped ? '#475569' : '#EF4444'}` }}>
              {a.correct ? '✓' : a.skipped ? '—' : '✗'}
            </div>
          ))}
        </div>

        {/* WhatsApp preview */}
        <div style={{ background:'rgba(37,211,102,0.07)', border:'1px solid rgba(37,211,102,0.2)', borderRadius:14, padding:'12px 14px', marginBottom:14, fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:600, lineHeight:1.65, textAlign:'center' }}>
          {rank.emoji} {rank.title} · {score}/{TOTAL_Q} · {pct}%<br />
          MaxCombo {maxCombo}x 🔥 · mpscsarathi.online
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')}
            style={{ flex:2, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:'0 6px 20px rgba(37,211,102,0.3)' }}>
            📤 WhatsApp Share
          </button>
          <button onClick={startBattle}
            style={{ flex:1, background:'linear-gradient(135deg,#A855F7,#7C3AED)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer', boxShadow:'0 6px 20px rgba(168,85,247,0.3)' }}>
            🔄 पुन्हा
          </button>
          <button onClick={onBack}
            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:'14px 14px', color:'rgba(255,255,255,0.5)', fontWeight:900, fontSize:13, cursor:'pointer' }}>
            <Home size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

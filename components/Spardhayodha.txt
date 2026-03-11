import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
  subject: string;
}

interface AnswerLog {
  correct: boolean;
  skipped: boolean;
}

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
  if (pct >= 90) return { title: "महाराष्ट्र केसरी", emoji: "🦁", color: "#FFD700" };
  if (pct >= 75) return { title: "स्पर्धा योद्धा",  emoji: "⚔️", color: "#F97316" };
  if (pct >= 55) return { title: "अभ्यासू विद्यार्थी", emoji: "📚", color: "#3B82F6" };
  return           { title: "पुन्हा प्रयत्न करा",    emoji: "💪", color: "#10B981" };
}

function Burst({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ["#FFD700","#F97316","#10B981","#3B82F6","#EC4899"];
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:50, overflow:"hidden" }}>
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position:"absolute", left:"50%", top:"50%",
          width:8, height:8, borderRadius:"50%",
          background: colors[i % colors.length],
          animation: `burst 0.6s ease-out ${i * 0.03}s forwards`,
          transform: `rotate(${i * 30}deg) translateY(-60px)`,
          opacity:0,
        }} />
      ))}
    </div>
  );
}

interface Props { onBack: () => void; }

export const SpardhaYodha: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<'intro' | 'battle' | 'result'>('intro');
  const [questions, setQuestions] = useState<Question[]>(FALLBACK);
  const [qIdx, setQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [burst, setBurst] = useState(false);
  const [answers, setAnswers] = useState<AnswerLog[]>([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef<any>(null);
  const battleTimeRef = useRef(0);

  const q = questions[qIdx];

  // Load random questions from Supabase
  const loadQuestions = async () => {
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter: 'Rajyaseva', row_limit: TOTAL_Q });
      if (data && data.length >= TOTAL_Q) setQuestions(data);
    } catch (_) {}
  };

  const startBattle = () => {
    loadQuestions();
    setPhase('battle');
    setQIdx(0); setScore(0); setSelected(null);
    setAnswers([]); setCombo(0); setMaxCombo(0);
    battleTimeRef.current = 0;
    setTimeLeft(QUESTION_TIME);
  };

  const nextQ = useCallback((wasCorrect: boolean) => {
    setSelected(null);
    setBurst(false);
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
          setTimeout(() => nextQ(false), 400);
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
      setBurst(true);
      setCombo(c => { const nc = c + 1; setMaxCombo(m => Math.max(m, nc)); return nc; });
    } else {
      setCombo(0);
    }
    setAnswers(a => [...a, { correct, skipped: false }]);
    setTimeout(() => nextQ(correct), 1000);
  };

  const pct = Math.round((score / TOTAL_Q) * 100);
  const rank = getRank(pct);
  const timePct = (timeLeft / QUESTION_TIME) * 100;
  const timerColor = timeLeft > 7 ? '#10B981' : timeLeft > 3 ? '#F59E0B' : '#EF4444';

  const css = `
    @keyframes burst{0%{opacity:1;transform:rotate(var(--r,0deg)) translateY(-60px) scale(1)}100%{opacity:0;transform:rotate(var(--r,0deg)) translateY(-120px) scale(0)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
    @keyframes ring-pulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.06);opacity:1}}
    @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(249,115,22,0.4)}50%{box-shadow:0 0 60px rgba(249,115,22,0.8)}}
    @keyframes result-in{from{opacity:0;transform:scale(0.85) translateY(24px)}to{opacity:1;transform:scale(1) translateY(0)}}
    @keyframes trophy{0%{transform:rotate(-15deg) scale(0.7)}60%{transform:rotate(12deg) scale(1.2)}100%{transform:rotate(0deg) scale(1)}}
    @keyframes slide-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  `;

  const base: React.CSSProperties = {
    minHeight: '100vh', background: '#0A0A0F',
    fontFamily: "'Poppins','Noto Sans Devanagari',sans-serif", color: '#fff',
  };

  // INTRO
  if (phase === 'intro') return (
    <div style={{ ...base, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      <style>{css}</style>
      <button onClick={onBack} style={{ position:'absolute', top:20, left:20, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'8px 14px', color:'rgba(255,255,255,0.6)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontWeight:700, fontSize:13 }}>
        <ArrowLeft size={15} /> परत
      </button>

      {[180,300,440].map((s,i) => (
        <div key={i} style={{ position:'absolute', borderRadius:'50%', border:`1px solid rgba(249,115,22,${0.12-i*0.03})`, width:s, height:s, animation:`ring-pulse 3s ease-in-out ${i*0.8}s infinite` }} />
      ))}

      <div style={{ fontSize:72, animation:'float 3s ease-in-out infinite', position:'relative', zIndex:1 }}>⚔️</div>
      <h1 style={{ fontWeight:900, fontSize:'clamp(2rem,7vw,3rem)', letterSpacing:'-0.04em', margin:'8px 0 4px', textAlign:'center', position:'relative', zIndex:1 }}>
        स्पर्धा{' '}
        <span style={{ background:'linear-gradient(90deg,#F97316,#FFD700)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          योद्धा
        </span>
      </h1>
      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, fontWeight:700, margin:'0 0 32px', textAlign:'center', position:'relative', zIndex:1 }}>
        {TOTAL_Q} प्रश्न · {QUESTION_TIME} सेकंद · Rank मिळवा · Share करा
      </p>

      <div style={{ display:'flex', gap:12, marginBottom:36, position:'relative', zIndex:1 }}>
        {[['⚡','Speed Mode'],['🏆','Rank System'],['📤','WA Share']].map(([e,l]) => (
          <div key={l as string} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontSize:22 }}>{e}</div>
            <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.4)', marginTop:4 }}>{l}</div>
          </div>
        ))}
      </div>

      <button onClick={startBattle} style={{ background:'linear-gradient(135deg,#F97316,#EF4444)', border:'none', borderRadius:999, padding:'18px 48px', color:'#fff', fontWeight:900, fontSize:17, cursor:'pointer', position:'relative', zIndex:1, animation:'glow 2s infinite', letterSpacing:'-0.02em' }}>
        युद्ध सुरू करा ⚔️
      </button>
    </div>
  );

  // BATTLE
  if (phase === 'battle') return (
    <div style={{ ...base, display:'flex', flexDirection:'column', padding:'16px 16px 32px', maxWidth:560, margin:'0 auto' }}>
      <style>{css}</style>

      {/* Progress + score */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ display:'flex', gap:5 }}>
          {questions.slice(0, TOTAL_Q).map((_, i) => (
            <div key={i} style={{ width: Math.floor(260/TOTAL_Q), height:6, borderRadius:99,
              background: i < answers.length
                ? (answers[i].correct ? '#10B981' : answers[i].skipped ? '#64748B' : '#EF4444')
                : i === qIdx ? '#F97316' : 'rgba(255,255,255,0.1)'
            }} />
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {combo >= 2 && (
            <div style={{ background:'rgba(249,115,22,0.2)', border:'1px solid rgba(249,115,22,0.4)', borderRadius:999, padding:'3px 10px', fontSize:10, fontWeight:900, color:'#F97316' }}>
              {combo}x 🔥
            </div>
          )}
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:'6px 14px', fontWeight:900, fontSize:14 }}>
            {score}/{qIdx}
          </div>
        </div>
      </div>

      {/* Timer */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
        <div style={{ position:'relative' }}>
          <svg width={80} height={80} style={{ transform:'rotate(-90deg)' }}>
            <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
            <circle cx={40} cy={40} r={32} fill="none" stroke={timerColor} strokeWidth={6}
              strokeDasharray={201} strokeDashoffset={201-(timePct/100)*201} strokeLinecap="round"
              style={{ transition:'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }} />
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:20, fontWeight:900, color: timeLeft <= 3 ? '#EF4444' : '#fff', animation: timeLeft <= 3 ? 'shake 0.3s infinite' : 'none' }}>{timeLeft}</span>
            <span style={{ fontSize:8, color:'rgba(255,255,255,0.35)', fontWeight:700 }}>sec</span>
          </div>
        </div>
      </div>

      {/* Subject */}
      <div style={{ textAlign:'center', marginBottom:10 }}>
        <span style={{ background:'rgba(249,115,22,0.15)', border:'1px solid rgba(249,115,22,0.3)', borderRadius:999, padding:'4px 14px', fontSize:11, fontWeight:800, color:'#F97316' }}>
          {q?.subject} · प्र. {qIdx+1}/{TOTAL_Q}
        </span>
      </div>

      {/* Question */}
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:24, padding:'24px 20px', marginBottom:18, position:'relative', animation:'slide-up 0.3s ease', overflow:'hidden' }}>
        <Burst active={burst} />
        <p style={{ color:'#fff', fontWeight:800, fontSize:'clamp(1rem,4vw,1.2rem)', lineHeight:1.55, margin:0, textAlign:'center' }}>
          {q?.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display:'grid', gap:10 }}>
        {q?.options?.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === q.correct_answer_index;
          const revealed = selected !== null;
          let bg = 'rgba(255,255,255,0.04)';
          let borderColor = 'rgba(255,255,255,0.1)';
          let col = 'rgba(255,255,255,0.85)';
          if (revealed && isCorrect)             { bg = 'rgba(16,185,129,0.18)';  borderColor = '#10B981'; col = '#fff'; }
          if (revealed && isSelected && !isCorrect) { bg = 'rgba(239,68,68,0.18)';  borderColor = '#EF4444'; col = '#fff'; }
          if (revealed && !isSelected && !isCorrect) { col = 'rgba(255,255,255,0.25)'; }
          return (
            <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
              style={{ background:bg, border:`1.5px solid ${borderColor}`, borderRadius:16, padding:'14px 18px', color:col, fontWeight:800, fontSize:13, textAlign:'left', cursor:selected===null?'pointer':'default', display:'flex', alignItems:'center', gap:12, transition:'all 0.2s ease' }}>
              <span style={{ width:26, height:26, borderRadius:9, background: revealed&&isCorrect?'#10B981':revealed&&isSelected&&!isCorrect?'#EF4444':'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color: revealed&&(isCorrect||(isSelected&&!isCorrect))?'#fff':'rgba(255,255,255,0.5)', flexShrink:0 }}>
                {revealed&&isCorrect?'✓':revealed&&isSelected&&!isCorrect?'✗':String.fromCharCode(65+i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  // RESULT
  const shareText = `⚔️ स्पर्धा योद्धा Challenge!\n\nमी MPSC सारथी वर ${score}/${TOTAL_Q} गुण मिळवले!\nRank: ${rank.emoji} ${rank.title} (${pct}%)\nMax Combo: ${maxCombo}x 🔥\n\n🔗 तुम्हीही खेळा: mpscsarathi.online`;

  return (
    <div style={{ ...base, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      <style>{css}</style>
      <div style={{ background:'linear-gradient(145deg,#111118,#1a1a24)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:32, padding:'32px 24px', maxWidth:400, width:'100%', animation:'result-in 0.6s cubic-bezier(.34,1.56,.64,1)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, borderRadius:32, background:'linear-gradient(90deg,transparent,rgba(249,115,22,0.12),transparent)', backgroundSize:'200% 100%', animation:'shimmer 2.5s infinite', pointerEvents:'none' }} />

        <div style={{ textAlign:'center', marginBottom:20, position:'relative', zIndex:1 }}>
          <div style={{ fontSize:60, animation:'trophy 0.8s cubic-bezier(.34,1.56,.64,1) 0.3s both', display:'inline-block' }}>{rank.emoji}</div>
          <h2 style={{ color:rank.color, fontWeight:900, fontSize:20, margin:'8px 0 4px' }}>{rank.title}</h2>
          <div style={{ fontSize:52, fontWeight:900, letterSpacing:'-0.05em', lineHeight:1 }}>
            {score}<span style={{ fontSize:20, color:'rgba(255,255,255,0.3)' }}>/{TOTAL_Q}</span>
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontWeight:700, marginTop:4 }}>{pct}% अचूकता</div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20, position:'relative', zIndex:1 }}>
          {[{ l:'बरोबर', v:score, c:'#10B981' },{ l:'चुकीचे', v:TOTAL_Q-score, c:'#EF4444' },{ l:'Combo', v:`${maxCombo}x`, c:'#F97316' }].map(({l,v,c}) => (
            <div key={l} style={{ background:'rgba(255,255,255,0.05)', borderRadius:14, padding:'10px 8px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:900, color:c }}>{v}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:5, justifyContent:'center', marginBottom:20, position:'relative', zIndex:1, flexWrap:'wrap' }}>
          {answers.map((a,i) => (
            <div key={i} style={{ width:30, height:30, borderRadius:9, background:a.correct?'rgba(16,185,129,0.18)':a.skipped?'rgba(100,116,139,0.15)':'rgba(239,68,68,0.18)', border:`1.5px solid ${a.correct?'#10B981':a.skipped?'#64748B':'#EF4444'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
              {a.correct?'✓':a.skipped?'—':'✗'}
            </div>
          ))}
        </div>

        <div style={{ background:'rgba(37,211,102,0.08)', border:'1px solid rgba(37,211,102,0.2)', borderRadius:16, padding:'12px 14px', marginBottom:16, fontSize:12, color:'rgba(255,255,255,0.65)', fontWeight:700, lineHeight:1.65, textAlign:'center', position:'relative', zIndex:1 }}>
          {rank.emoji} मी MPSC सारथी वर {score}/{TOTAL_Q} गुण मिळवले!<br />
          Rank: {rank.title} · {pct}% accuracy<br />
          🔗 mpscsarathi.online
        </div>

        <div style={{ display:'flex', gap:10, position:'relative', zIndex:1 }}>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`,'_blank')}
            style={{ flex:1, background:'#25D366', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            📤 WhatsApp
          </button>
          <button onClick={startBattle}
            style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer' }}>
            🔄 पुन्हा
          </button>
          <button onClick={onBack}
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:'14px 16px', color:'rgba(255,255,255,0.5)', fontWeight:900, fontSize:13, cursor:'pointer' }}>
            🏠
          </button>
        </div>
      </div>
    </div>
  );
};

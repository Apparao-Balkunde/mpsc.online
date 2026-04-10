// components/WeeklyTournament.tsx — Full component (route होतं, component नव्हतं!)
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Zap, Clock, Target, Crown, Share2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }
interface Q { id:number; question:string; options:string[]; correct_answer_index:number; subject:string; explanation:string; }
interface Leader { name:string; score:number; time:number; rank:number; }

const TOTAL_Q   = 20;
const TIME_EACH = 30; // seconds per question

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;700;800;900&display=swap');
  @keyframes wt-fade  { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes wt-pop   { 0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)} }
  @keyframes wt-spin  { to{transform:rotate(360deg)} }
  @keyframes wt-glow  { 0%,100%{box-shadow:0 0 20px rgba(245,158,11,0.3)}50%{box-shadow:0 0 40px rgba(245,158,11,0.6)} }
  @keyframes wt-pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
  .wt-opt:hover:not(:disabled) { transform:translateX(5px); }
`;

const OFFLINE_QS: Q[] = [
  { id:1, question:'भारतीय राज्यघटनेत एकूण किती कलमे आहेत?', options:['395','448','450','452'], correct_answer_index:1, subject:'Polity', explanation:'सध्या 448 कलमे + 12 परिशिष्ट आहेत. मूळ घटनेत 395 कलमे होती.' },
  { id:2, question:'महाराष्ट्राची स्थापना कधी झाली?', options:['1 मे 1960','26 जानेवारी 1960','15 ऑगस्ट 1947','1 नोव्हेंबर 1956'], correct_answer_index:0, subject:'History', explanation:'1 मे 1960 रोजी महाराष्ट्र राज्याची स्थापना झाली. हा दिवस महाराष्ट्र दिन म्हणून साजरा केला जातो.' },
  { id:3, question:'RBI चे पूर्ण नाव काय आहे?', options:['Reserve Bank of India','Regional Bank of India','Regulated Bank of India','Royal Bank of India'], correct_answer_index:0, subject:'Economics', explanation:'RBI म्हणजे Reserve Bank of India — भारताची मध्यवर्ती बँक, 1935 मध्ये स्थापित.' },
  { id:4, question:'73 वी घटनादुरुस्ती कशाशी संबंधित आहे?', options:['नगरपालिका','पंचायतीराज','मूलभूत हक्क','राज्यसूची'], correct_answer_index:1, subject:'Polity', explanation:'1992 ची 73वी घटनादुरुस्ती पंचायतीराजशी संबंधित आहे — ग्रामीण स्वराज्य.' },
  { id:5, question:'सह्याद्री पर्वतरांगा कोणत्या दिशेने आहे?', options:['उत्तर-दक्षिण','पूर्व-पश्चिम','ईशान्य-नैऋत्य','वायव्य-आग्नेय'], correct_answer_index:0, subject:'Geography', explanation:'सह्याद्री (पश्चिम घाट) उत्तर-दक्षिण दिशेने पसरली आहे — महाराष्ट्राची जीवनरेषा.' },
  { id:6, question:'भारताचे पहिले पंतप्रधान कोण होते?', options:['सरदार पटेल','डॉ. आंबेडकर','पं. नेहरू','राजेंद्र प्रसाद'], correct_answer_index:2, subject:'History', explanation:'पं. जवाहरलाल नेहरू हे भारताचे पहिले पंतप्रधान (1947-1964) होते.' },
  { id:7, question:'महाराष्ट्रात एकूण किती जिल्हे आहेत?', options:['32','34','36','38'], correct_answer_index:2, subject:'Geography', explanation:'महाराष्ट्रात 36 जिल्हे आहेत, 6 महसूल विभागांमध्ये विभागलेले.' },
  { id:8, question:'कोणत्या अनुच्छेदात मूलभूत हक्क दिले आहेत?', options:['12-35','14-32','36-51','52-78'], correct_answer_index:0, subject:'Polity', explanation:'अनुच्छेद 12 ते 35 मध्ये 6 मूलभूत हक्क दिलेले आहेत.' },
  { id:9, question:'गोदावरी नदीची लांबी किती आहे?', options:['1465 km','1312 km','725 km','1560 km'], correct_answer_index:0, subject:'Geography', explanation:'गोदावरी — 1465 km लांब — महाराष्ट्रातील सर्वात लांब नदी, दक्षिण गंगा.' },
  { id:10, question:'MPSC म्हणजे काय?', options:['Maharashtra Public Service Commission','Maharashtra Police Service Committee','Maharashtra Provincial Service Council','Maharashtra Public Sector Commission'], correct_answer_index:0, subject:'General', explanation:'MPSC = Maharashtra Public Service Commission — राज्य सेवा आयोग.' },
];

export const WeeklyTournament: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]     = useState<'intro'|'quiz'|'result'>('intro');
  const [questions, setQs]    = useState<Q[]>([]);
  const [idx, setIdx]         = useState(0);
  const [score, setScore]     = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_EACH);
  const [answered, setAnswered] = useState<number|null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const timerRef = useRef<any>(null);
  const startRef = useRef(0);

  const loadQs = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter: 'Rajyaseva', row_limit: TOTAL_Q });
      setQs(data?.length >= 5 ? data : OFFLINE_QS);
    } catch { setQs(OFFLINE_QS); }
    setLoading(false);
  };

  const mockLeaders: Leader[] = [
    { name: 'Raj P.', score: 18, time: 245, rank: 1 },
    { name: 'Priya M.', score: 17, time: 280, rank: 2 },
    { name: 'Akash D.', score: 16, time: 310, rank: 3 },
    { name: 'तुम्ही', score, time: totalTime, rank: 4 },
  ];

  const startTournament = async () => {
    await loadQs();
    setPhase('quiz');
    setIdx(0); setScore(0); setResults([]); setAnswered(null);
    setTimeLeft(TIME_EACH);
    startRef.current = Date.now();
  };

  useEffect(() => {
    if (phase !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleAnswer(-1); return TIME_EACH; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, idx]);

  const handleAnswer = (optIdx: number) => {
    clearInterval(timerRef.current);
    const q = questions[idx];
    const correct = optIdx === q?.correct_answer_index;
    setAnswered(optIdx);
    if (correct) setScore(s => s + 1);
    setResults(r => [...r, correct]);
    updateProgress(1, correct ? 1 : 0);
    setTimeout(() => {
      setAnswered(null);
      setTimeLeft(TIME_EACH);
      if (idx + 1 >= Math.min(questions.length, TOTAL_Q)) {
        const elapsed = Math.round((Date.now() - startRef.current) / 1000);
        setTotalTime(elapsed);
        addXP(score * 5 + 10, 'tournament');
        setLeaders(mockLeaders);
        setPhase('result');
      } else {
        setIdx(i => i + 1);
      }
    }, 1200);
  };

  const q = questions[idx];
  const pct = Math.min(idx / Math.min(questions.length, TOTAL_Q), 1) * 100;
  const timerPct = (timeLeft / TIME_EACH) * 100;
  const timerColor = timeLeft <= 8 ? '#EF4444' : timeLeft <= 15 ? '#F59E0B' : '#10B981';
  const accuracy = results.length > 0 ? Math.round((score / results.length) * 100) : 0;

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#1A0533,#2D1060)', fontFamily:"'Baloo 2',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{CSS}</style>
      <button onClick={onBack} style={{ position:'absolute', top:16, left:16, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, padding:'8px 12px', color:'rgba(255,255,255,0.7)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontWeight:700, fontSize:12 }}>
        <ArrowLeft size={14}/> Back
      </button>

      <div style={{ fontSize:72, marginBottom:8, animation:'wt-glow 2s ease infinite' }}>⚔️</div>
      <div style={{ fontWeight:900, fontSize:28, marginBottom:4, textAlign:'center', background:'linear-gradient(135deg,#F5C842,#F97316)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
        Weekly Tournament
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:32, textAlign:'center' }}>
        20 questions · 30 seconds each · Top rankers win!
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:32, width:'100%', maxWidth:340 }}>
        {[
          { icon:'📝', val:'20', label:'Questions' },
          { icon:'⏱️', val:'30s', label:'Per Q' },
          { icon:'🏆', val:'XP', label:'Rewards' },
        ].map(({icon,val,label}) => (
          <div key={label} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, padding:'16px 12px', textAlign:'center' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{icon}</div>
            <div style={{ fontWeight:900, fontSize:18, color:'#F5C842' }}>{val}</div>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      <button onClick={startTournament} disabled={loading}
        style={{ background:'linear-gradient(135deg,#F5C842,#F97316)', border:'none', borderRadius:18, padding:'16px 48px', color:'#fff', fontWeight:900, fontSize:18, cursor:'pointer', boxShadow:'0 8px 32px rgba(245,200,66,0.4)', animation:'wt-glow 2s ease infinite', display:'flex', alignItems:'center', gap:10 }}>
        {loading ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'wt-spin 0.8s linear infinite' }}/> Loading...</> : <><Trophy size={20} fill="#fff"/> Tournament सुरू करा</>}
      </button>

      <div style={{ marginTop:24, fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', textAlign:'center' }}>
        🏅 Top 3 performers ला leaderboard वर place मिळेल
      </div>
    </div>
  );

  // ── QUIZ ──────────────────────────────────────────────────────────────────
  if (phase === 'quiz' && q) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#1A0533,#2D1060)', fontFamily:"'Baloo 2',sans-serif", color:'#fff', paddingBottom:40 }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10, background:'rgba(0,0,0,0.2)' }}>
        <button onClick={() => { clearInterval(timerRef.current); onBack(); }} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'7px 10px', color:'rgba(255,255,255,0.6)', cursor:'pointer', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, background:'rgba(255,255,255,0.1)', borderRadius:99, height:5, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#F5C842,#F97316)', width:`${pct}%`, transition:'width 0.4s', borderRadius:99 }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(245,200,66,0.15)', border:'1px solid rgba(245,200,66,0.3)', borderRadius:99, padding:'4px 10px' }}>
          <Trophy size={11} style={{ color:'#F5C842' }}/><span style={{ fontSize:13, fontWeight:900, color:'#F5C842' }}>{score}</span>
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.5)' }}>{idx+1}/{Math.min(questions.length, TOTAL_Q)}</span>
      </div>

      {/* Timer */}
      <div style={{ height:4, background:'rgba(255,255,255,0.08)' }}>
        <div style={{ height:'100%', width:`${timerPct}%`, background:timerColor, transition:'width 1s linear, background 0.5s', borderRadius:'0 3px 3px 0' }}/>
      </div>
      <div style={{ textAlign:'center', fontSize:18, fontWeight:900, color:timerColor, padding:'6px 0', letterSpacing:'0.05em' }}>{timeLeft}s</div>

      <div style={{ maxWidth:520, margin:'0 auto', padding:'0 16px' }}>
        {/* Subject tag */}
        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
          <span style={{ fontSize:9, fontWeight:800, background:'rgba(245,200,66,0.15)', border:'1px solid rgba(245,200,66,0.3)', borderRadius:99, padding:'3px 10px', color:'#F5C842', textTransform:'uppercase' }}>{q.subject}</span>
        </div>

        {/* Question */}
        <div key={idx} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, padding:'22px 18px', marginBottom:14, animation:'wt-fade 0.3s ease' }}>
          <p style={{ fontWeight:700, fontSize:'clamp(1rem,4vw,1.1rem)', lineHeight:1.7, margin:0 }}>{q.question}</p>
        </div>

        {/* Options */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {q.options.map((opt, i) => {
            const isSel = answered === i;
            const isAns = i === q.correct_answer_index;
            let bg='rgba(255,255,255,0.05)', border='rgba(255,255,255,0.12)', color='#fff';
            if (answered !== null && isAns)           { bg='rgba(16,185,129,0.2)'; border='rgba(16,185,129,0.5)'; }
            if (answered !== null && isSel && !isAns) { bg='rgba(220,38,38,0.2)'; border='rgba(220,38,38,0.4)'; }
            if (answered !== null && !isAns && !isSel){ color='rgba(255,255,255,0.3)'; }
            return (
              <button key={i} disabled={answered !== null} className="wt-opt" onClick={() => handleAnswer(i)}
                style={{ padding:'14px 16px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:13, textAlign:'left', cursor:answered!==null?'default':'pointer', display:'flex', alignItems:'center', gap:10, transition:'all 0.18s' }}>
                <span style={{ width:26, height:26, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:'rgba(255,255,255,0.08)' }}>
                  {answered!==null&&isAns?'✓':answered!==null&&isSel?'✗':String.fromCharCode(65+i)}
                </span>
                <span style={{ flex:1 }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {answered !== null && (
          <div style={{ marginTop:12, background:'rgba(245,200,66,0.08)', border:'1px solid rgba(245,200,66,0.2)', borderRadius:14, padding:'12px 14px', animation:'wt-fade 0.3s ease' }}>
            <div style={{ fontSize:9, fontWeight:800, color:'#F5C842', textTransform:'uppercase', marginBottom:4 }}>💡 Explanation</div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.7)', lineHeight:1.6, margin:0 }}>{q.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#1A0533,#2D1060)', fontFamily:"'Baloo 2',sans-serif", color:'#fff', padding:'24px 16px', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <style>{CSS}</style>
      <div style={{ fontSize:56, marginBottom:8 }}>{score >= 16 ? '🥇' : score >= 12 ? '🥈' : score >= 8 ? '🥉' : '🎯'}</div>
      <div style={{ fontWeight:900, fontSize:22, marginBottom:4 }}>Tournament संपला!</div>
      <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:24 }}>
        {score >= 16 ? 'अप्रतिम! 🔥' : score >= 12 ? 'खूप चांगले! 💪' : score >= 8 ? 'ठीक आहे! 📈' : 'सराव करा! 📚'}
      </div>

      {/* Score card */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:24, width:'100%', maxWidth:360 }}>
        {[
          { label:'Score', val:`${score}/${Math.min(questions.length,TOTAL_Q)}`, color:'#F5C842' },
          { label:'Accuracy', val:`${accuracy}%`, color: accuracy>=70?'#10B981':'#F59E0B' },
          { label:'Time', val:`${Math.floor(totalTime/60)}m ${totalTime%60}s`, color:'#8B5CF6' },
        ].map(({label,val,color}) => (
          <div key={label} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'14px 10px', textAlign:'center' }}>
            <div style={{ fontWeight:900, fontSize:20, color }}>{val}</div>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Result dots */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'center', marginBottom:20, maxWidth:360 }}>
        {results.map((r,i) => (
          <div key={i} style={{ width:24, height:24, borderRadius:7, background:r?'rgba(16,185,129,0.3)':'rgba(220,38,38,0.3)', border:`1px solid ${r?'#10B981':'#EF4444'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>
            {r?'✓':'✗'}
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={{ width:'100%', maxWidth:360, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:18, padding:'16px', marginBottom:20 }}>
        <div style={{ fontWeight:900, fontSize:12, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
          <Crown size={14} style={{ color:'#F5C842' }}/> Leaderboard
        </div>
        {mockLeaders.map((l,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom: i<3?'1px solid rgba(255,255,255,0.06)':undefined }}>
            <span style={{ fontSize:16 }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':'🎯'}</span>
            <span style={{ flex:1, fontWeight:l.name==='तुम्ही'?900:700, fontSize:13, color:l.name==='तुम्ही'?'#F5C842':'rgba(255,255,255,0.8)' }}>{l.name}</span>
            <span style={{ fontWeight:900, fontSize:13, color:'#F5C842' }}>{l.score}/20</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:700 }}>{Math.floor(l.time/60)}:{String(l.time%60).padStart(2,'0')}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, width:'100%', maxWidth:360 }}>
        <button onClick={() => { const t=`⚔️ Weekly Tournament!\n${score}/20 · ${accuracy}% accuracy!\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank'); }}
          style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
          <Share2 size={14}/> Share
        </button>
        <button onClick={startTournament}
          style={{ flex:2, background:'linear-gradient(135deg,#F5C842,#F97316)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
          <RefreshCw size={15}/> पुन्हा खेळा
        </button>
        <button onClick={onBack} style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:14, padding:'13px', color:'rgba(255,255,255,0.7)', fontWeight:800, fontSize:13, cursor:'pointer' }}>Home</button>
      </div>
    </div>
  );
};

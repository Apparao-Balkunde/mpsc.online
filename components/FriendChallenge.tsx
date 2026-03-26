import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Copy, CheckCircle2, X, Check, ChevronRight, Users, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';

interface Question { id:number; question:string; options:string[]; correct_answer_index:number; explanation:string; subject:string; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes fc2-fade { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes fc2-pop { 0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1} }
  @keyframes fc2-spin { to{transform:rotate(360deg)} }
  @keyframes fc2-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  .fc2-opt:hover:not([disabled]) { background:#FDF6EC !important; border-color:rgba(232,103,26,0.3) !important; transform:translateX(3px) !important; }
`;

const FALLBACK: Question[] = [
  { id:1, question:"महाराष्ट्राची स्थापना कोणत्या वर्षी झाली?", options:["1956","1960","1962","1947"], correct_answer_index:1, explanation:"1 मे 1960 रोजी महाराष्ट्र राज्याची स्थापना झाली.", subject:"इतिहास" },
  { id:2, question:"कलम ३२ कशाशी संबंधित आहे?", options:["समता","घटनात्मक उपाय","धर्म","शिक्षण"], correct_answer_index:1, explanation:"कलम ३२ हे घटनात्मक उपाययोजनेचा हक्क देते.", subject:"राज्यघटना" },
  { id:3, question:"SYNONYM of ABANDON?", options:["Keep","Forsake","Adopt","Save"], correct_answer_index:1, explanation:"Forsake = सोडून देणे", subject:"English" },
  { id:4, question:"महाराष्ट्रात किती जिल्हे आहेत?", options:["34","35","36","38"], correct_answer_index:2, explanation:"३६ जिल्हे", subject:"भूगोल" },
  { id:5, question:"भारताचे पहिले पंतप्रधान कोण?", options:["पटेल","नेहरू","गांधी","आझाद"], correct_answer_index:1, explanation:"जवाहरलाल नेहरू", subject:"इतिहास" },
];

interface Props { onBack: () => void; }

export const FriendChallenge: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]       = useState<'create'|'quiz'|'result'>('create');
  const [questions, setQuestions] = useState<Question[]>(FALLBACK);
  const [idx, setIdx]           = useState(0);
  const [answers, setAnswers]   = useState<Record<number,number>>({});
  const [showExp, setShowExp]   = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [copied, setCopied]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [yourName, setYourName] = useState('');

  useEffect(() => {
    // Check if opening a challenge link
    const params = new URLSearchParams(window.location.search);
    const cid = params.get('challenge');
    if (cid) {
      loadChallenge(cid);
    }
  }, []);

  const loadChallenge = async (cid: string) => {
    try {
      const stored = localStorage.getItem(`challenge_${cid}`);
      if (stored) {
        setQuestions(JSON.parse(stored));
        setChallengeId(cid);
        setPhase('quiz');
      }
    } catch {}
  };

  const createChallenge = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter:'Rajyaseva', row_limit:5 });
      const qs = data && data.length > 0 ? data : FALLBACK;
      const cid = Math.random().toString(36).slice(2,8).toUpperCase();
      localStorage.setItem(`challenge_${cid}`, JSON.stringify(qs));
      setQuestions(qs);
      setChallengeId(cid);
      setPhase('quiz');
    } catch {
      setQuestions(FALLBACK);
      const cid = Math.random().toString(36).slice(2,8).toUpperCase();
      setChallengeId(cid);
      localStorage.setItem(`challenge_${cid}`, JSON.stringify(FALLBACK));
      setPhase('quiz');
    } finally { setLoading(false); }
  };

  const shareLink = `${window.location.origin}?challenge=${challengeId}`;
  const shareText = `⚔️ MPSC Challenge!\n\nमी तुम्हाला challenge करतो! ${yourName ? `— ${yourName}` : ''}\n\nहे 5 प्रश्न सोडवा:\n${shareLink}\n\n#MPSCSarathi`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleAnswer = (optIdx: number) => {
    if (answers[idx] !== undefined) return;
    setAnswers(p => ({ ...p, [idx]: optIdx }));
    setShowExp(true);
  };

  const nextQ = () => {
    setShowExp(false);
    if (idx + 1 >= questions.length) {
      const score = Object.entries(answers).filter(([i,a]) => questions[+i]?.correct_answer_index === +a).length;
      const lastAnswer = answers[idx];
      const lastCorrect = lastAnswer === questions[idx]?.correct_answer_index ? 1 : 0;
      updateProgress(questions.length, score + (answers[idx] === undefined ? 0 : lastCorrect));
      setPhase('result');
    } else {
      setIdx(p => p + 1);
    }
  };

  const q          = questions[idx];
  const hasAnswered = answers[idx] !== undefined;
  const isCorrect   = hasAnswered && answers[idx] === q?.correct_answer_index;
  const score       = Object.entries(answers).filter(([i,a]) => questions[+i]?.correct_answer_index === +a).length;

  if (phase === 'create') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <style>{CSS}</style>
      <div style={{ maxWidth:400, width:'100%' }}>
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(0,0,0,0.06)', border:'none', borderRadius:11, padding:'8px 14px', color:'#7A9090', fontWeight:800, fontSize:12, cursor:'pointer', marginBottom:24 }}>
          <ArrowLeft size={13} /> परत
        </button>

        <div style={{ background:'#fff', borderRadius:28, padding:'32px 24px', boxShadow:'0 8px 40px rgba(0,0,0,0.1)', textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:14, animation:'fc2-pop 0.5s ease' }}>⚔️</div>
          <h2 style={{ fontWeight:900, fontSize:22, color:'#1C2B2B', letterSpacing:'-0.04em', margin:'0 0 8px' }}>Friend Challenge</h2>
          <p style={{ fontSize:12, color:'#7A9090', fontWeight:600, lineHeight:1.6, marginBottom:24 }}>
            5 प्रश्नांचा challenge तयार करा<br />मित्राला link share करा — कोण जास्त score मिळवतो?
          </p>

          <input placeholder="तुमचं नाव (optional)" value={yourName}
            onChange={e => setYourName(e.target.value)}
            style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'12px 16px', color:'#1C2B2B', fontSize:14, fontWeight:600, boxSizing:'border-box', marginBottom:16, fontFamily:"'Baloo 2',sans-serif", outline:'none' }} />

          <button onClick={createChallenge} disabled={loading}
            style={{ width:'100%', background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'16px', color:'#fff', fontWeight:900, fontSize:15, cursor:loading?'not-allowed':'pointer', boxShadow:'0 6px 20px rgba(232,103,26,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:loading?0.7:1 }}>
            {loading ? <div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'fc2-spin 0.8s linear infinite' }} /> : <><Zap size={17} fill="currentColor" /> Challenge तयार करा</>}
          </button>
        </div>
      </div>
    </div>
  );

  if (phase === 'result') {
    const pct = Math.round((score/questions.length)*100);
    return (
      <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <style>{CSS}</style>
        <div style={{ background:'#fff', borderRadius:28, padding:'36px 24px', maxWidth:380, width:'100%', textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,0.1)', animation:'fc2-pop 0.5s cubic-bezier(.34,1.56,.64,1)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(90deg,#E8671A,#F5C842,#E8671A)', backgroundSize:'200%', animation:'fc2-shimmer 2s linear infinite' }} />
          <div style={{ fontSize:64, marginBottom:12 }}>{pct === 100 ? '🏆' : pct >= 80 ? '⭐' : pct >= 60 ? '💪' : '📚'}</div>
          <div style={{ fontWeight:900, fontSize:28, color:'#1C2B2B', letterSpacing:'-0.04em', marginBottom:4 }}>{score}/{questions.length}</div>
          <div style={{ fontSize:13, color:'#7A9090', fontWeight:700, marginBottom:20 }}>{pct}% अचूकता</div>

          {/* Share result */}
          <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:14, padding:'12px', marginBottom:16 }}>
            <p style={{ fontSize:12, color:'#166534', fontWeight:700, margin:0 }}>
              मित्राला challenge करा — same प्रश्न द्या!
            </p>
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            <button onClick={whatsappShare}
              style={{ flex:2, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              📤 WhatsApp Share
            </button>
            <button onClick={copyLink}
              style={{ flex:1, background: copied ? 'rgba(5,150,105,0.1)' : '#F8F5F0', border:`1px solid ${copied ? 'rgba(5,150,105,0.3)' : 'rgba(0,0,0,0.1)'}`, borderRadius:14, padding:'13px', color: copied ? '#059669' : '#7A9090', fontWeight:800, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button onClick={onBack}
            style={{ width:'100%', background:'#F8F5F0', border:'1px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'12px', color:'#1C2B2B', fontWeight:800, fontSize:13, cursor:'pointer' }}>
            डॅशबोर्ड
          </button>
        </div>
      </div>
    );
  }

  // QUIZ
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:560, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => setPhase('create')} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}>
            <ArrowLeft size={14} />
          </button>
          <div style={{ flex:1, background:'rgba(0,0,0,0.08)', borderRadius:99, height:6, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:99, width:`${(idx/questions.length)*100}%`, transition:'width 0.4s' }} />
          </div>
          <span style={{ fontSize:12, fontWeight:800, color:'#1C2B2B' }}>{idx+1}/{questions.length}</span>
          <button onClick={whatsappShare}
            style={{ background:'rgba(37,211,102,0.1)', border:'1px solid rgba(37,211,102,0.3)', borderRadius:9, padding:'6px 10px', cursor:'pointer', color:'#059669', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', gap:4 }}>
            <Share2 size={11} /> Share
          </button>
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ marginBottom:12 }}>
          <span style={{ background:'rgba(232,103,26,0.1)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:99, padding:'5px 14px', fontSize:11, fontWeight:800, color:'#C4510E' }}>
            ⚔️ Challenge · {q?.subject}
          </span>
        </div>

        <div style={{ background:'#fff', borderRadius:22, padding:'24px 20px', marginBottom:14, boxShadow:'0 4px 20px rgba(0,0,0,0.08)', animation:'fc2-fade 0.3s ease', border:`1.5px solid ${hasAnswered ? (isCorrect ? 'rgba(5,150,105,0.3)' : 'rgba(220,38,38,0.25)') : 'rgba(232,103,26,0.15)'}`, transition:'border 0.3s' }}>
          <p style={{ fontWeight:700, fontSize:'clamp(1rem,4vw,1.15rem)', lineHeight:1.65, color:'#1C2B2B', margin:0 }}>{q?.question}</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
          {q?.options?.map((opt,i) => {
            const isSel = answers[idx] === i;
            const isAns = i === q.correct_answer_index;
            let bg = '#fff', border = 'rgba(0,0,0,0.08)', color = '#1C2B2B', bdgBg = 'rgba(0,0,0,0.06)', bdgCol = '#4A6060';
            let anim = '';
            if (hasAnswered && isAns)           { bg='rgba(5,150,105,0.08)'; border='rgba(5,150,105,0.4)'; color='#065F46'; bdgBg='#059669'; bdgCol='#fff'; }
            if (hasAnswered && isSel && !isAns) { bg='rgba(220,38,38,0.07)'; border='rgba(220,38,38,0.35)'; color='#991B1B'; bdgBg='#DC2626'; bdgCol='#fff'; }
            if (hasAnswered && !isSel && !isAns){ color='#A8A29E'; }
            return (
              <button key={i} disabled={hasAnswered} className="fc2-opt"
                onClick={() => handleAnswer(i)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 15px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:13, textAlign:'left', cursor:hasAnswered?'default':'pointer', transition:'all 0.18s ease', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ width:28, height:28, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:bdgBg, color:bdgCol }}>
                  {hasAnswered && isAns ? '✓' : hasAnswered && isSel && !isAns ? '✗' : String.fromCharCode(65+i)}
                </span>
                <span style={{ flex:1 }}>{opt}</span>
                {hasAnswered && isAns && <CheckCircle2 size={15} style={{ color:'#059669', flexShrink:0 }} />}
              </button>
            );
          })}
        </div>

        {showExp && q?.explanation && (
          <div style={{ background:'#FFF7ED', border:'1px solid rgba(232,103,26,0.2)', borderRadius:14, padding:'14px', marginBottom:14, animation:'fc2-fade 0.25s ease' }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>💡 स्पष्टीकरण</div>
            <p style={{ fontSize:12, color:'#4A6060', fontWeight:600, lineHeight:1.65, margin:0 }}>{q.explanation}</p>
          </div>
        )}

        {hasAnswered && (
          <button onClick={nextQ}
            style={{ width:'100%', background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'15px', color:'#fff', fontWeight:900, fontSize:15, cursor:'pointer', boxShadow:'0 6px 20px rgba(232,103,26,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8, animation:'fc2-fade 0.3s ease' }}>
            {idx+1 >= questions.length ? '🏆 निकाल पहा' : <>पुढे <ChevronRight size={16} /></>}
          </button>
        )}
      </div>
    </div>
  );
};

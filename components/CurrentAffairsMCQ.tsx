import React, { useState, useEffect } from 'react';
import { ArrowLeft, Newspaper, RefreshCw, Zap, Loader } from 'lucide-react';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }
interface Q { question: string; opts: string[]; answer: number; source: string; }

const TOPICS = [
  '🏆 महाराष्ट्र राजकारण', '📊 केंद्र सरकार योजना', '🌏 आंतरराष्ट्रीय घडामोडी',
  '💰 अर्थव्यवस्था', '🔬 विज्ञान आणि तंत्रज्ञान', '🏅 क्रीडा', '🌿 पर्यावरण',
];

const CSS = `
@keyframes ca-spin{to{transform:rotate(360deg)}}
@keyframes ca-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes ca-pop{0%{transform:scale(0.85)}60%{transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes ca-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
`;

export const CurrentAffairsMCQ: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]     = useState<'pick'|'loading'|'quiz'|'result'>('pick');
  const [topic, setTopic]     = useState('');
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx]         = useState(0);
  const [answers, setAnswers] = useState<Record<number,number>>({});
  const [error, setError]     = useState('');

  const generate = async (t: string) => {
    setTopic(t); setPhase('loading'); setError('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'तू MPSC current affairs expert आहेस. JSON format मध्येच उत्तर दे, बाकी काहीही नको.',
          messages: [{ role: 'user', content: `${t} या topic वर 5 MPSC current affairs MCQ बनव. 2024-2025 च्या recent events वर आधारित.\n\nJSON array format:\n[\n{"question":"प्रश्न?","opts":["A","B","C","D"],"answer":0,"source":"Source/Context"}\n]\n\nफक्त JSON array दे, इतर काहीही नको.` }],
          max_tokens: 800
        })
      });
      const data = await res.json();
      const text = data?.text || '';
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Invalid response');
      const qs: Q[] = JSON.parse(match[0]);
      if (!qs.length) throw new Error('No questions');
      setQuestions(qs); setIdx(0); setAnswers({}); setPhase('quiz');
    } catch (e) {
      setError('Questions generate होऊ शकले नाहीत. पुन्हा try करा.'); setPhase('pick');
    }
  };

  const handle = (optIdx: number) => {
    if (answers[idx] !== undefined) return;
    const correct = optIdx === questions[idx]?.answer;
    setAnswers(p => ({ ...p, [idx]: optIdx }));
    updateProgress(1, correct ? 1 : 0);
    addXP(correct ? 5 : 1);
  };

  const score = Object.entries(answers).filter(([i,a]) => questions[+i]?.answer === +a).length;
  const acc   = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const q     = questions[idx];

  // ── PICK ──
  if (phase === 'pick') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}><Newspaper size={16} style={{color:'#EC4899'}}/> AI Current Affairs MCQ</div>
      </div>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ background:'linear-gradient(135deg,rgba(236,72,153,0.08),rgba(139,92,246,0.06))', border:'1px solid rgba(236,72,153,0.15)', borderRadius:16, padding:'14px 16px', marginBottom:18, display:'flex', gap:10, alignItems:'center' }}>
          <Zap size={18} style={{color:'#EC4899', flexShrink:0}}/>
          <div style={{ fontSize:12, fontWeight:600, color:'#4A6060', lineHeight:1.6 }}>AI तुमच्यासाठी Latest Current Affairs वर 5 MCQ generate करेल — MPSC exam level!</div>
        </div>
        {error && <div style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:12, padding:'12px', marginBottom:14, fontSize:12, fontWeight:600, color:'#DC2626' }}>⚠️ {error}</div>}
        <div style={{ fontSize:11, fontWeight:800, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Topic निवडा</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {TOPICS.map(t => (
            <button key={t} onClick={() => generate(t)}
              style={{ background:'#fff', border:'1.5px solid rgba(236,72,153,0.15)', borderRadius:16, padding:'16px 12px', cursor:'pointer', textAlign:'left', fontWeight:800, fontSize:13, color:'#1C2B2B', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', lineHeight:1.4, animation:'ca-fade 0.3s ease' }}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── LOADING ──
  if (phase === 'loading') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{CSS}</style>
      <div style={{ width:60, height:60, border:'4px solid rgba(236,72,153,0.2)', borderTopColor:'#EC4899', borderRadius:'50%', animation:'ca-spin 0.8s linear infinite', marginBottom:20 }}/>
      <div style={{ fontWeight:800, fontSize:15, color:'#1C2B2B', marginBottom:6 }}>AI MCQ Generate होत आहे...</div>
      <div style={{ fontSize:12, color:'#7A9090', fontWeight:600 }}>{topic}</div>
    </div>
  );

  // ── RESULT ──
  if (phase === 'result') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#1C0A2E)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{CSS}</style>
      <div style={{ fontSize:56, marginBottom:12, animation:'ca-pop 0.5s ease' }}>{acc>=80?'🏆':acc>=60?'⭐':'📚'}</div>
      <div style={{ fontWeight:900, fontSize:36, letterSpacing:'-0.04em', marginBottom:4 }}>{score}/{questions.length}</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>{acc}% accuracy</div>
      <div style={{ fontSize:12, fontWeight:700, color:'#F9A8D4', marginBottom:24 }}>{topic}</div>
      <div style={{ display:'flex', gap:8, width:'100%', maxWidth:380 }}>
        <button onClick={() => { const t=`📰 MPSC Current Affairs MCQ!\n\n${topic}\n${score}/${questions.length} · ${acc}%\n\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank'); }}
          style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤</button>
        <button onClick={() => generate(topic)}
          style={{ flex:1, background:'linear-gradient(135deg,#EC4899,#BE185D)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
          <RefreshCw size={14}/> नवीन
        </button>
        <button onClick={() => setPhase('pick')}
          style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'13px', color:'#fff', fontWeight:800, cursor:'pointer' }}>Topics</button>
      </div>
    </div>
  );

  // ── QUIZ ──
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => setPhase('pick')} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:12, color:'#1C2B2B' }}>📰 {topic}</div>
          <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:4, marginTop:5, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#EC4899,#8B5CF6)', borderRadius:99, width:`${((idx+1)/questions.length)*100}%`, transition:'width 0.4s' }}/>
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:'#7A9090' }}>{idx+1}/{questions.length}</span>
        <span style={{ fontWeight:900, fontSize:12, color:'#10B981', background:'rgba(16,185,129,0.1)', borderRadius:99, padding:'3px 9px' }}>{score}✓</span>
      </div>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'16px' }}>
        {q && (
          <>
            <div style={{ background:'#fff', borderRadius:20, padding:'20px 18px', marginBottom:12, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', animation:'ca-fade 0.25s ease' }}>
              <div style={{ fontSize:9, fontWeight:800, color:'#EC4899', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Current Affairs MCQ</div>
              <p style={{ fontWeight:700, fontSize:'clamp(0.9rem,3.5vw,1.05rem)', lineHeight:1.75, color:'#1C2B2B', margin:0 }}>{q.question}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:14 }}>
              {q.opts.map((opt, i) => {
                const isAns = i === q.answer, isSel = answers[idx] === i, isAnswered = answers[idx] !== undefined;
                let bg = '#fff', border = 'rgba(0,0,0,0.08)', color = '#1C2B2B';
                if (isAnswered && isAns)           { bg='rgba(5,150,105,0.08)';  border='rgba(5,150,105,0.4)'; color='#065F46'; }
                if (isAnswered && isSel && !isAns) { bg='rgba(220,38,38,0.06)'; border='rgba(220,38,38,0.3)'; color='#991B1B'; }
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
            {answers[idx] !== undefined && q.source && (
              <div style={{ background:'rgba(236,72,153,0.06)', border:'1px solid rgba(236,72,153,0.15)', borderRadius:14, padding:'11px 14px', marginBottom:14, fontSize:12, fontWeight:600, color:'#831843', lineHeight:1.65 }}>
                📰 {q.source}
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              {idx > 0 && <button onClick={() => setIdx(p=>p-1)} style={{ flex:1, background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'12px', color:'#7A9090', fontWeight:800, cursor:'pointer' }}>← मागे</button>}
              {idx+1 < questions.length
                ? <button onClick={() => setIdx(p=>p+1)} disabled={answers[idx]===undefined}
                    style={{ flex:2, background:answers[idx]!==undefined?'linear-gradient(135deg,#EC4899,#BE185D)':'rgba(0,0,0,0.1)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, cursor:answers[idx]!==undefined?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>पुढे →</button>
                : <button onClick={() => setPhase('result')}
                    style={{ flex:2, background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🏆 Result</button>
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Loader, ChevronRight, Check, X, RefreshCcw } from 'lucide-react';
import { updateProgress } from '../App';

interface GeneratedQ { question:string; options:string[]; correct:number; explanation:string; }
interface Props { onBack: () => void; }

const TOPICS = [
  '१८५७ चा उठाव','महाराष्ट्रातील सामाजिक सुधारक','भारतीय राज्यघटना','महाराष्ट्राचा भूगोल',
  'चालू घडामोडी 2024','मराठी व्याकरण','English Grammar','गणित - टक्केवारी',
  'भारतीय अर्थव्यवस्था','पर्यावरण व विज्ञान',
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes aig-spin { to{transform:rotate(360deg)} }
  @keyframes aig-fade { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes aig-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  .aig-opt:hover:not([disabled]) { background:#FDF6EC !important; border-color:rgba(232,103,26,0.3) !important; }
  .aig-chip:hover { background:rgba(232,103,26,0.12) !important; }
`;

export const AIQuestionGenerator: React.FC<Props> = ({ onBack }) => {
  const [topic, setTopic]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [questions, setQuestions] = useState<GeneratedQ[]>([]);
  const [answers, setAnswers]     = useState<Record<number,number>>({});
  const [error, setError]         = useState('');
  const [phase, setPhase]         = useState<'input'|'quiz'|'result'>('input');

  const generate = async (t?: string) => {
    const topicToUse = t || topic;
    if (!topicToUse.trim()) { setError('Topic टाका!'); return; }
    setLoading(true); setError(''); setAnswers({});

    const prompt = `तू MPSC exam expert आहेस. "${topicToUse}" या topic वर 5 multiple choice questions तयार कर.

JSON format मध्ये दे — फक्त JSON, बाकी काही नाही:
[
  {
    "question": "प्रश्न इथे",
    "options": ["पर्याय १", "पर्याय २", "पर्याय ३", "पर्याय ४"],
    "correct": 0,
    "explanation": "स्पष्टीकरण इथे"
  }
]

Rules:
- questions मराठी किंवा English मध्ये असाव्यात
- MPSC level difficulty
- options realistic असाव्यात
- explanation 1-2 lines`;

    try {
      const res = await fetch('/api/ai', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ system:'You are an MPSC exam question generator. Always respond with valid JSON only.', messages:[{ role:'user', content:prompt }], max_tokens:800 }),
      });
      const data = await res.json();
      const text = data?.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('JSON नाही');
      const parsed: GeneratedQ[] = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid data');
      setQuestions(parsed);
      setPhase('quiz');
    } catch (e) {
      setError('AI questions generate करू शकला नाही. पुन्हा try करा!');
    } finally { setLoading(false); }
  };

  const handleAnswer = (qIdx: number, optIdx: number) => {
    if (answers[qIdx] !== undefined) return;
    setAnswers(p => ({ ...p, [qIdx]: optIdx }));
  };

  const finish = () => {
    const score = Object.entries(answers).filter(([i,a]) => questions[+i]?.correct === +a).length;
    updateProgress(questions.length, score);
    setPhase('result');
  };

  const score   = Object.entries(answers).filter(([i,a]) => questions[+i]?.correct === +a).length;
  const allDone = Object.keys(answers).length === questions.length;

  if (phase === 'result') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:24, padding:'32px 24px', maxWidth:380, width:'100%', textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,0.1)', animation:'aig-fade 0.4s ease' }}>
        <div style={{ fontSize:56, marginBottom:12 }}>{score === questions.length ? '🏆' : score >= 3 ? '⭐' : '💪'}</div>
        <div style={{ fontWeight:900, fontSize:26, color:'#1C2B2B', marginBottom:4 }}>{score}/{questions.length}</div>
        <div style={{ fontSize:13, color:'#7A9090', fontWeight:600, marginBottom:24 }}>AI Generated Questions · {topic}</div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => { setPhase('input'); setQuestions([]); setAnswers({}); setTopic(''); }}
            style={{ flex:1, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer' }}>
            नवीन Topic
          </button>
          <button onClick={() => { setAnswers({}); setPhase('quiz'); }}
            style={{ flex:1, background:'#F8F5F0', border:'1px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'14px', color:'#1C2B2B', fontWeight:900, fontSize:13, cursor:'pointer' }}>
            पुन्हा करा
          </button>
        </div>
      </div>
    </div>
  );

  if (phase === 'quiz') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:80 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => setPhase('input')} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14} /></button>
        <div style={{ flex:1, background:'rgba(0,0,0,0.08)', borderRadius:99, height:5, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:99, width:`${(Object.keys(answers).length/questions.length)*100}%`, transition:'width 0.4s' }} />
        </div>
        <span style={{ fontSize:12, fontWeight:800, color:'#1C2B2B' }}>{Object.keys(answers).length}/{questions.length}</span>
        <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:99, padding:'4px 10px' }}>
          <Sparkles size={11} style={{ color:'#7C3AED' }} />
          <span style={{ fontSize:10, fontWeight:800, color:'#7C3AED' }}>AI Generated</span>
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ marginBottom:14, fontSize:12, fontWeight:800, color:'#7A9090' }}>Topic: {topic}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {questions.map((q, qi) => {
            const answered = answers[qi] !== undefined;
            return (
              <div key={qi} style={{ background:'#fff', borderRadius:20, padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', animation:`aig-fade 0.3s ease ${qi*0.08}s both`, border:`1.5px solid ${answered?(answers[qi]===q.correct?'rgba(5,150,105,0.3)':'rgba(220,38,38,0.25)'):'rgba(0,0,0,0.07)'}`, transition:'border 0.3s' }}>
                <div style={{ fontSize:10, fontWeight:800, color:'#7C3AED', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Q.{qi+1}</div>
                <p style={{ fontWeight:700, fontSize:13, lineHeight:1.65, color:'#1C2B2B', marginBottom:14 }}>{q.question}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {q.options.map((opt,oi) => {
                    const isSel = answers[qi]===oi, isAns = oi===q.correct;
                    let bg='#F8F5F0', border='rgba(0,0,0,0.08)', color='#1C2B2B', bdgBg='rgba(0,0,0,0.06)', bdgCol='#4A6060';
                    if (answered && isAns)           { bg='rgba(5,150,105,0.08)'; border='rgba(5,150,105,0.4)'; color='#065F46'; bdgBg='#059669'; bdgCol='#fff'; }
                    if (answered && isSel && !isAns) { bg='rgba(220,38,38,0.07)'; border='rgba(220,38,38,0.35)'; color='#991B1B'; bdgBg='#DC2626'; bdgCol='#fff'; }
                    if (answered && !isSel && !isAns){ color='#A8A29E'; }
                    return (
                      <button key={oi} disabled={answered} className="aig-opt"
                        onClick={() => handleAnswer(qi, oi)}
                        style={{ display:'flex', alignItems:'center', gap:9, padding:'11px 13px', borderRadius:12, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:12, textAlign:'left', cursor:answered?'default':'pointer', transition:'all 0.15s' }}>
                        <span style={{ width:24, height:24, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, background:bdgBg, color:bdgCol }}>
                          {answered&&isAns?'✓':answered&&isSel&&!isAns?'✗':String.fromCharCode(65+oi)}
                        </span>
                        <span style={{ flex:1 }}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {answered && q.explanation && (
                  <div style={{ marginTop:12, background:'#FFF7ED', border:'1px solid rgba(232,103,26,0.15)', borderRadius:12, padding:'10px 14px', fontSize:11, color:'#4A6060', fontWeight:600, lineHeight:1.6 }}>
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {allDone && (
          <button onClick={finish}
            style={{ width:'100%', background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'16px', color:'#fff', fontWeight:900, fontSize:15, cursor:'pointer', boxShadow:'0 6px 20px rgba(232,103,26,0.3)', marginTop:16, animation:'aig-fade 0.3s ease', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            🏆 निकाल पहा
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'14px 20px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14} /></button>
        <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
          <Sparkles size={16} style={{ color:'#7C3AED' }} /> AI Question Generator
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'24px 16px' }}>
        <div style={{ background:'#fff', borderRadius:22, padding:'24px', marginBottom:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#7C3AED,#E8671A,#7C3AED)', backgroundSize:'200%', animation:'aig-shimmer 3s linear infinite' }} />
          <div style={{ fontSize:11, fontWeight:800, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Topic टाका</div>
          <input value={topic} onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key==='Enter' && generate()}
            placeholder="उदा: महाराष्ट्राचा इतिहास, मराठी व्याकरण..."
            style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'12px 14px', color:'#1C2B2B', fontSize:14, fontWeight:600, boxSizing:'border-box', marginBottom:14, fontFamily:"'Baloo 2',sans-serif", outline:'none' }} />
          <button onClick={() => generate()} disabled={loading}
            style={{ width:'100%', background:'linear-gradient(135deg,#7C3AED,#6D28D9)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:14, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 20px rgba(124,58,237,0.3)', opacity:loading?0.7:1 }}>
            {loading ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'aig-spin 0.8s linear infinite' }} /> Questions generate होत आहेत...</> : <><Sparkles size={16} /> 5 Questions Generate करा</>}
          </button>
          {error && <div style={{ marginTop:12, background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#DC2626', fontWeight:700 }}>⚠️ {error}</div>}
        </div>

        <div style={{ fontWeight:800, fontSize:12, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>किंवा topic निवडा</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {TOPICS.map(t => (
            <button key={t} className="aig-chip" onClick={() => { setTopic(t); generate(t); }}
              style={{ fontSize:11, fontWeight:700, padding:'7px 12px', borderRadius:99, background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', color:'#7C3AED', cursor:'pointer', transition:'all 0.15s' }}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

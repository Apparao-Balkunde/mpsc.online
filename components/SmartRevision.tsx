import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Brain, CheckCircle2, X, Check, RefreshCcw, ChevronRight, Trash2 } from 'lucide-react';
import { updateProgress } from '../App';

interface RevisionQuestion {
  id: number; question: string; options: string[];
  correct_answer_index: number; explanation: string; subject: string;
  wrongCount: number; lastAttempted: string; nextReview: string;
}

const STORAGE_KEY = 'mpsc_smart_revision';

function getRevisionData(): RevisionQuestion[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function saveWrongQuestion(q: any) {
  try {
    const data = getRevisionData();
    const existing = data.find(r => r.id === q.id);
    const today = new Date().toISOString();
    const nextReview = new Date(Date.now() + 24*60*60*1000).toISOString(); // Tomorrow
    if (existing) {
      existing.wrongCount += 1;
      existing.lastAttempted = today;
      existing.nextReview = nextReview;
    } else {
      data.push({ ...q, wrongCount:1, lastAttempted:today, nextReview });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.slice(-100))); // max 100
  } catch {}
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes sr-fade { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes sr-pop  { 0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1} }
  @keyframes sr-spin { to{transform:rotate(360deg)} }
  @keyframes sr-correct { 0%{box-shadow:0 0 0 0 rgba(5,150,105,0.4)}100%{box-shadow:0 0 0 12px rgba(5,150,105,0)} }
  @keyframes sr-wrong   { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
  .sr-opt:hover:not([disabled]) { background:#FDF6EC !important; border-color:rgba(232,103,26,0.3) !important; transform:translateX(3px) !important; }
`;

interface Props { onBack: () => void; }

export const SmartRevision: React.FC<Props> = ({ onBack }) => {
  const [questions, setQuestions] = useState<RevisionQuestion[]>([]);
  const [idx, setIdx]             = useState(0);
  const [answers, setAnswers]     = useState<Record<number,number>>({});
  const [showExp, setShowExp]     = useState(false);
  const [phase, setPhase]         = useState<'list'|'quiz'|'done'>('list');

  useEffect(() => {
    const data = getRevisionData();
    const due  = data.filter(q => new Date(q.nextReview) <= new Date()).sort((a,b) => b.wrongCount - a.wrongCount);
    setQuestions(due.length > 0 ? due : data.slice(0, 10));
  }, []);

  const q          = questions[idx];
  const hasAnswered = answers[idx] !== undefined;
  const isCorrect   = hasAnswered && answers[idx] === q?.correct_answer_index;

  const handleAnswer = (optIdx: number) => {
    if (hasAnswered) return;
    setAnswers(p => ({ ...p, [idx]: optIdx }));
    setShowExp(true);
    const correct = optIdx === q.correct_answer_index;
    updateProgress(1, correct ? 1 : 0);
    // Update next review based on performance
    if (correct) {
      const data = getRevisionData();
      const item = data.find(r => r.id === q.id);
      if (item) {
        // Spaced repetition: correct = review in 3 days
        item.nextReview = new Date(Date.now() + 3*24*60*60*1000).toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    }
  };

  const nextQ = () => {
    setShowExp(false);
    if (idx + 1 >= questions.length) setPhase('done');
    else setIdx(p => p + 1);
  };

  const clearAll = () => {
    if (window.confirm('सर्व revision questions delete करायचे?')) {
      localStorage.removeItem(STORAGE_KEY);
      setQuestions([]);
    }
  };

  const allData = getRevisionData();
  const score   = Object.entries(answers).filter(([i,a]) => questions[+i]?.correct_answer_index === a).length;

  if (phase === 'done') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, padding:'36px 28px', maxWidth:380, width:'100%', textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,0.1)', animation:'sr-pop 0.5s cubic-bezier(.34,1.56,.64,1)' }}>
        <div style={{ fontSize:64, marginBottom:12 }}>{score/questions.length >= 0.8 ? '🧠' : '💪'}</div>
        <div style={{ fontWeight:900, fontSize:22, color:'#1C2B2B', marginBottom:6 }}>{score}/{questions.length}</div>
        <div style={{ fontSize:13, color:'#7A9090', fontWeight:600, marginBottom:24 }}>Smart Revision पूर्ण!</div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => { setPhase('quiz'); setIdx(0); setAnswers({}); }}
            style={{ flex:1, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer' }}>
            पुन्हा करा
          </button>
          <button onClick={onBack}
            style={{ flex:1, background:'#F8F5F0', border:'1px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'14px', color:'#1C2B2B', fontWeight:900, fontSize:13, cursor:'pointer' }}>
            डॅशबोर्ड
          </button>
        </div>
      </div>
    </div>
  );

  if (phase === 'list') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'14px 20px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}>
            <ArrowLeft size={14} />
          </button>
          <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
            <Brain size={16} style={{ color:'#7C3AED' }} /> Smart Revision
          </div>
        </div>
        {allData.length > 0 && (
          <button onClick={clearAll} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700 }}>
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'24px 16px' }}>
        {allData.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:22, padding:'40px 24px', textAlign:'center', boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:56, marginBottom:14 }}>🧠</div>
            <div style={{ fontWeight:900, fontSize:17, color:'#1C2B2B', marginBottom:8 }}>अजून revision नाही!</div>
            <div style={{ fontSize:13, color:'#7A9090', fontWeight:600, lineHeight:1.6 }}>
              प्रश्न चुकल्यावर ते आपोआप इथे save होतात.<br />
              Quiz सोडवा आणि परत या!
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              {[
                { l:'Revision साठी', v:questions.length,           c:'#7C3AED', bg:'rgba(124,58,237,0.08)' },
                { l:'एकूण saved',    v:allData.length,             c:'#E8671A', bg:'rgba(232,103,26,0.08)' },
              ].map(({ l,v,c,bg }) => (
                <div key={l} style={{ background:bg, borderRadius:14, padding:'14px', textAlign:'center' }}>
                  <div style={{ fontWeight:900, fontSize:24, color:c }}>{v}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#7A9090', textTransform:'uppercase', marginTop:3 }}>{l}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setPhase('quiz')} disabled={questions.length === 0}
              style={{ width:'100%', background:'linear-gradient(135deg,#7C3AED,#6D28D9)', border:'none', borderRadius:16, padding:'16px', color:'#fff', fontWeight:900, fontSize:15, cursor: questions.length === 0 ? 'not-allowed' : 'pointer', boxShadow:'0 6px 20px rgba(124,58,237,0.3)', marginBottom:20, opacity: questions.length === 0 ? 0.5 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <Brain size={18} /> Revision सुरू करा ({questions.length} प्रश्न)
            </button>

            {/* Question list */}
            <div style={{ fontWeight:800, fontSize:12, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>
              Saved Questions ({allData.length})
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {allData.slice(0,10).map((q,i) => (
                <div key={q.id} style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:14, padding:'14px 16px', animation:`sr-fade 0.2s ease ${i*0.04}s both`, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:9, fontWeight:800, background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:99, padding:'3px 9px', color:'#7C3AED', textTransform:'uppercase' }}>{q.subject}</span>
                    <span style={{ fontSize:10, fontWeight:800, color:'#DC2626' }}>✗ {q.wrongCount}x</span>
                  </div>
                  <p style={{ fontSize:12, fontWeight:700, color:'#1C2B2B', margin:0, lineHeight:1.5 }}>{q.question.slice(0,80)}{q.question.length > 80 ? '...' : ''}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // QUIZ
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:560, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => setPhase('list')} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}>
            <ArrowLeft size={14} />
          </button>
          <div style={{ flex:1, background:'rgba(0,0,0,0.08)', borderRadius:99, height:6, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#7C3AED,#A855F7)', borderRadius:99, width:`${(idx/questions.length)*100}%`, transition:'width 0.4s' }} />
          </div>
          <span style={{ fontSize:12, fontWeight:800, color:'#1C2B2B' }}>{idx+1}/{questions.length}</span>
          <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:99, padding:'4px 10px' }}>
            <Brain size={11} style={{ color:'#7C3AED' }} />
            <span style={{ fontSize:10, fontWeight:800, color:'#7C3AED' }}>Revision</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ marginBottom:12 }}>
          <span style={{ background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:99, padding:'5px 14px', fontSize:11, fontWeight:800, color:'#DC2626' }}>
            ✗ {q?.wrongCount}x चुकला · {q?.subject}
          </span>
        </div>

        <div style={{ background:'#fff', borderRadius:22, padding:'24px 20px', marginBottom:14, boxShadow:'0 4px 20px rgba(0,0,0,0.08)', animation:'sr-fade 0.3s ease', border:`1.5px solid ${hasAnswered ? (isCorrect ? 'rgba(5,150,105,0.3)' : 'rgba(220,38,38,0.25)') : 'rgba(124,58,237,0.15)'}`, transition:'border 0.3s' }}>
          <p style={{ fontWeight:700, fontSize:'clamp(1rem,4vw,1.15rem)', lineHeight:1.65, color:'#1C2B2B', margin:0 }}>{q?.question}</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
          {q?.options?.map((opt, i) => {
            const isSel = answers[idx] === i;
            const isAns = i === q.correct_answer_index;
            let bg = '#fff', border = 'rgba(0,0,0,0.08)', color = '#1C2B2B', bdgBg = 'rgba(0,0,0,0.06)', bdgCol = '#4A6060';
            let anim = '';
            if (hasAnswered && isAns)           { bg='rgba(5,150,105,0.08)'; border='rgba(5,150,105,0.4)'; color='#065F46'; bdgBg='#059669'; bdgCol='#fff'; anim='sr-correct 0.5s ease'; }
            if (hasAnswered && isSel && !isAns) { bg='rgba(220,38,38,0.07)'; border='rgba(220,38,38,0.35)'; color='#991B1B'; bdgBg='#DC2626'; bdgCol='#fff'; anim='sr-wrong 0.3s ease'; }
            if (hasAnswered && !isSel && !isAns){ color='#A8A29E'; }
            return (
              <button key={i} disabled={hasAnswered} className="sr-opt"
                onClick={() => handleAnswer(i)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 15px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:13, textAlign:'left', cursor:hasAnswered?'default':'pointer', transition:'all 0.18s ease', animation:anim, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ width:28, height:28, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:bdgBg, color:bdgCol, transition:'all 0.18s' }}>
                  {hasAnswered && isAns ? '✓' : hasAnswered && isSel && !isAns ? '✗' : String.fromCharCode(65+i)}
                </span>
                <span style={{ flex:1 }}>{opt}</span>
                {hasAnswered && isAns && <CheckCircle2 size={15} style={{ color:'#059669', flexShrink:0 }} />}
              </button>
            );
          })}
        </div>

        {showExp && q?.explanation && (
          <div style={{ background:'#FFF7ED', border:'1px solid rgba(232,103,26,0.2)', borderRadius:14, padding:'14px', marginBottom:14, animation:'sr-fade 0.25s ease' }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>💡 स्पष्टीकरण</div>
            <p style={{ fontSize:12, color:'#4A6060', fontWeight:600, lineHeight:1.65, margin:0 }}>{q.explanation}</p>
          </div>
        )}

        {hasAnswered && (
          <button onClick={nextQ}
            style={{ width:'100%', background:'linear-gradient(135deg,#7C3AED,#6D28D9)', border:'none', borderRadius:14, padding:'15px', color:'#fff', fontWeight:900, fontSize:15, cursor:'pointer', boxShadow:'0 6px 20px rgba(124,58,237,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8, animation:'sr-fade 0.3s ease' }}>
            {idx+1 >= questions.length ? '✓ Revision झाले!' : <>पुढे <ChevronRight size={16} /></>}
          </button>
        )}
      </div>
    </div>
  );
};

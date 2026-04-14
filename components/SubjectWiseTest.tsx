import React, { useState } from 'react';
import { ArrowLeft, BookOpen, ChevronRight, Trophy, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import { addXP, checkAndAwardBadges } from './xpSystem';

interface Props { onBack: () => void; }
interface Q { id:number; question:string; options:string[]; correct_answer_index:number; explanation:string; subject:string; }

const SUBJECTS = [
  { name:'राज्यघटना',      emoji:'⚖️', color:'#2563EB', db:'राज्यघटना',   count:20 },
  { name:'महाराष्ट्र इतिहास', emoji:'📜', color:'#D97706', db:'इतिहास',     count:20 },
  { name:'भूगोल',           emoji:'🗺️', color:'#059669', db:'भूगोल',       count:20 },
  { name:'अर्थशास्त्र',     emoji:'💹', color:'#7C3AED', db:'अर्थशास्त्र', count:20 },
  { name:'विज्ञान',         emoji:'🔬', color:'#0891B2', db:'विज्ञान',      count:20 },
  { name:'चालू घडामोडी',    emoji:'📰', color:'#EC4899', db:'चालू घडामोडी', count:20 },
  { name:'मराठी',           emoji:'📝', color:'#E8671A', db:'मराठी',        count:20 },
  { name:'राज्यशास्त्र',    emoji:'🏛️', color:'#8B5CF6', db:'राज्यशास्त्र', count:20 },
];

const CSS = `
@keyframes sw-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes sw-spin{to{transform:rotate(360deg)}}
@keyframes sw-pop{0%{transform:scale(0.8)}60%{transform:scale(1.06)}100%{transform:scale(1)}}
`;

export const SubjectWiseTest: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]       = useState<'pick'|'quiz'|'result'>('pick');
  const [selected, setSelected] = useState<typeof SUBJECTS[0]|null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx]           = useState(0);
  const [answers, setAnswers]   = useState<Record<number,number>>({});
  const [loading, setLoading]   = useState(false);

  const start = async (subj: typeof SUBJECTS[0]) => {
    setLoading(true); setSelected(subj);
    try {
      const { data } = await supabase
        .from('prelims_questions')
        .select('*')
        .eq('subject', subj.db)
        .limit(subj.count)
        .order('id', { ascending: false });
      const qs = data?.length ? data : await fallback(subj);
      setQuestions(qs); setIdx(0); setAnswers({});
      setPhase('quiz');
    } catch { const qs = await fallback(subj); setQuestions(qs); setIdx(0); setAnswers({}); setPhase('quiz'); }
    setLoading(false);
  };

  const fallback = async (subj: typeof SUBJECTS[0]) => {
    // fallback: use mock questions with subject filter
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter:'Rajyaseva', row_limit:20 });
      return (data || []).filter((q: Q) => q.subject?.includes(subj.db.slice(0,3))).slice(0, 10);
    } catch { return []; }
  };

  const handle = (optIdx: number) => {
    if (answers[idx] !== undefined) return;
    const correct = optIdx === questions[idx]?.correct_answer_index;
    setAnswers(prev => ({ ...prev, [idx]: optIdx }));
    updateProgress(1, correct ? 1 : 0);
    addXP(correct ? 5 : 1);
  };

  const finish = () => {
    const score = Object.entries(answers).filter(([i, a]) => questions[+i]?.correct_answer_index === a).length;
    const prog  = JSON.parse(localStorage.getItem('mpsc_user_progress') || '{}');
    const badges = checkAndAwardBadges(prog.totalCorrect || 0, prog.streak || 0);
    addXP(score * 2, badges); // bonus XP at end
    setPhase('result');
  };

  const score = Object.entries(answers).filter(([i,a]) => questions[+i]?.correct_answer_index === a).length;
  const q = questions[idx];
  const acc = questions.length > 0 ? Math.round((score / Object.keys(answers).length) * 100) || 0 : 0;

  // ── PICK SUBJECT ──
  if (phase === 'pick') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
          <BookOpen size={16} style={{color:'#E8671A'}}/> Subject Test
        </div>
      </div>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ fontWeight:700, fontSize:13, color:'#7A9090', marginBottom:16, textAlign:'center' }}>विषय निवडा — 20 focused प्रश्न</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {SUBJECTS.map(subj => (
            <button key={subj.name} onClick={() => start(subj)} disabled={loading}
              style={{ background:'#fff', border:`2px solid ${subj.color}20`, borderRadius:20, padding:'20px 16px', cursor:'pointer', textAlign:'left', boxShadow:`0 3px 14px ${subj.color}10`, position:'relative', overflow:'hidden', animation:'sw-fade 0.3s ease' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:`linear-gradient(90deg,${subj.color},${subj.color}80)` }}/>
              <div style={{ fontSize:32, marginBottom:8 }}>{subj.emoji}</div>
              <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B', marginBottom:3 }}>{subj.name}</div>
              <div style={{ fontSize:10, fontWeight:700, color:subj.color }}>{subj.count} प्रश्न</div>
              {loading && selected?.name === subj.name && (
                <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ width:24, height:24, border:'3px solid rgba(0,0,0,0.1)', borderTopColor:subj.color, borderRadius:'50%', animation:'sw-spin 0.8s linear infinite' }}/>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── RESULT ──
  if (phase === 'result') {
    const answered = Object.keys(answers).length;
    const finalAcc = answered > 0 ? Math.round((score/answered)*100) : 0;
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#1A0A2E)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <style>{CSS}</style>
        <div style={{ fontSize:20, fontWeight:800, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>{selected?.emoji} {selected?.name}</div>
        <div style={{ fontSize:56, marginBottom:12, animation:'sw-pop 0.5s ease' }}>{finalAcc>=80?'🏆':finalAcc>=60?'⭐':'📚'}</div>
        <div style={{ fontWeight:900, fontSize:36, letterSpacing:'-0.04em', marginBottom:4 }}>{score}/{questions.length}</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:24 }}>{finalAcc}% accuracy</div>
        {/* Per-question review */}
        <div style={{ width:'100%', maxWidth:380, background:'rgba(255,255,255,0.06)', borderRadius:20, padding:'16px', marginBottom:20, maxHeight:200, overflowY:'auto' }}>
          <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Quick Review</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {questions.map((qs, i) => {
              const userAns = answers[i];
              const correct = userAns === qs.correct_answer_index;
              const skipped = userAns === undefined;
              return (
                <div key={i} style={{ width:32, height:32, borderRadius:9, background:skipped?'rgba(255,255,255,0.08)':correct?'rgba(5,150,105,0.3)':'rgba(220,38,38,0.3)', border:`1px solid ${skipped?'rgba(255,255,255,0.1)':correct?'rgba(5,150,105,0.5)':'rgba(220,38,38,0.5)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900 }}>
                  {i+1}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, width:'100%', maxWidth:380 }}>
          <button onClick={() => { const t=`📚 MPSC ${selected?.name} Test!\n\n${score}/${questions.length} · ${finalAcc}%\n\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank'); }}
            style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤</button>
          <button onClick={() => { setPhase('pick'); setSelected(null); setQuestions([]); setAnswers({}); setIdx(0); }}
            style={{ flex:2, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}><RotateCcw size={14}/>नवीन विषय</button>
          <button onClick={onBack} style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'13px', color:'#fff', fontWeight:800, cursor:'pointer' }}>Home</button>
        </div>
      </div>
    );
  }

  // ── QUIZ ──
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:80 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B' }}>{selected?.emoji} {selected?.name} Test</div>
          <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:5, marginTop:6, overflow:'hidden' }}>
            <div style={{ height:'100%', background:selected?.color, borderRadius:99, width:`${((idx+1)/questions.length)*100}%`, transition:'width 0.4s' }}/>
          </div>
        </div>
        <div style={{ fontWeight:900, fontSize:12, color:'#7A9090' }}>{idx+1}/{questions.length}</div>
        <div style={{ fontWeight:900, fontSize:13, color:'#10B981', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:99, padding:'4px 10px' }}>{score}✓</div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'16px' }}>
        {q && (
          <>
            <div style={{ background:'#fff', borderRadius:20, padding:'20px 18px', marginBottom:12, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', animation:'sw-fade 0.25s ease' }}>
              <div style={{ fontSize:9, fontWeight:800, color:selected?.color, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>प्र.{idx+1}</div>
              <p style={{ fontWeight:700, fontSize:'clamp(0.9rem,3.5vw,1.05rem)', lineHeight:1.75, color:'#1C2B2B', margin:0 }}>{q.question}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:14 }}>
              {q.options?.map((opt, i) => {
                const isAnswered = answers[idx] !== undefined;
                const isSel = answers[idx] === i, isAns = i === q.correct_answer_index;
                let bg = '#fff', border = 'rgba(0,0,0,0.08)', color = '#1C2B2B';
                if (isAnswered && isAns)           { bg=`rgba(5,150,105,0.08)`;  border='rgba(5,150,105,0.4)';  color='#065F46'; }
                if (isAnswered && isSel && !isAns) { bg='rgba(220,38,38,0.06)'; border='rgba(220,38,38,0.3)'; color='#991B1B'; }
                if (isAnswered && !isSel && !isAns){ color='#9CA3AF'; }
                return (
                  <button key={i} disabled={isAnswered} onClick={() => handle(i)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 15px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:13, textAlign:'left', cursor:isAnswered?'default':'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', transition:'all 0.15s' }}>
                    <span style={{ width:26, height:26, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:isAnswered&&isAns?'#059669':isAnswered&&isSel&&!isAns?'#DC2626':'rgba(0,0,0,0.06)', color:isAnswered&&(isAns||(isSel&&!isAns))?'#fff':'#7A9090' }}>
                      {isAnswered&&isAns?'✓':isAnswered&&isSel&&!isAns?'✗':String.fromCharCode(65+i)}
                    </span>
                    <span style={{ flex:1 }}>{opt}</span>
                  </button>
                );
              })}
            </div>
            {/* Explanation */}
            {answers[idx] !== undefined && q.explanation && (
              <div style={{ background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:14, padding:'12px 14px', marginBottom:12, fontSize:12, fontWeight:600, color:'#4A6060', lineHeight:1.65 }}>
                💡 {q.explanation}
              </div>
            )}
            {/* Navigation */}
            <div style={{ display:'flex', gap:10 }}>
              {idx > 0 && <button onClick={() => setIdx(p => p-1)} style={{ flex:1, background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'13px', color:'#7A9090', fontWeight:800, cursor:'pointer' }}>← मागे</button>}
              {idx + 1 < questions.length
                ? <button onClick={() => { if (answers[idx] === undefined) handle(-1); setTimeout(() => { setIdx(p=>p+1); }, answers[idx]!==undefined?0:100); }} style={{ flex:2, background:`linear-gradient(135deg,${selected?.color},${selected?.color}CC)`, border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>पुढे <ChevronRight size={15}/></button>
                : <button onClick={finish} style={{ flex:2, background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}><Trophy size={15}/> Result पाहा</button>
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
};

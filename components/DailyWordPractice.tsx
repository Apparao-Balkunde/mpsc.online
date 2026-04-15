import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, ChevronRight, RotateCcw, Volume2 } from 'lucide-react';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }

const WORDS = [
  // MPSC important English words with Marathi meaning + usage
  { word:'Sovereignty', marathi:'सार्वभौमत्व', type:'Polity', example:'India gained sovereignty in 1947.', mpsc:'राज्यसेवा — Polity प्रश्नांमध्ये वारंवार येतो' },
  { word:'Preamble', marathi:'प्रस्तावना', type:'Polity', example:'The Preamble reflects the soul of the Constitution.', mpsc:'26 नोव्हेंबर — Constitution Day' },
  { word:'Ordinance', marathi:'अध्यादेश', type:'Polity', example:'The President promulgates an ordinance when Parliament is not in session.', mpsc:'Art 123 — President\'s ordinance power' },
  { word:'Incumbent', marathi:'विद्यमान/सद्य', type:'General', example:'The incumbent Chief Minister attended the meeting.', mpsc:'Current affairs मध्ये नेहमी येतो' },
  { word:'Autonomous', marathi:'स्वायत्त', type:'Polity', example:'Panchayati Raj institutions are autonomous bodies.', mpsc:'73rd Amendment — autonomous local bodies' },
  { word:'Bureaucracy', marathi:'नोकरशाही', type:'Polity', example:'A strong bureaucracy is essential for governance.', mpsc:'MPSC स्वतः bureaucracy भरती करतो' },
  { word:'Consensus', marathi:'एकमत/सहमती', type:'General', example:'The committee reached a consensus on the new policy.', mpsc:'Editorial — वारंवार वापर' },
  { word:'Inflation', marathi:'महागाई/चलनवाढ', type:'Economy', example:'High inflation erodes purchasing power.', mpsc:'Economics — WPI, CPI linked' },
  { word:'Subsidy', marathi:'अनुदान', type:'Economy', example:'The government provides subsidy to farmers.', mpsc:'Budget + Agriculture questions' },
  { word:'Referendum', marathi:'जनमत संग्रह', type:'Polity', example:'Brexit was decided by a referendum.', mpsc:'Current affairs — international' },
  { word:'Bicameral', marathi:'द्विसदनीय', type:'Polity', example:'India has a bicameral Parliament — Lok Sabha and Rajya Sabha.', mpsc:'Art 79 — Parliament composition' },
  { word:'Judicial Review', marathi:'न्यायिक पुनर्विलोकन', type:'Polity', example:'Judicial review ensures laws are constitutional.', mpsc:'Art 13 + Marbury v Madison' },
  { word:'Recession', marathi:'मंदी', type:'Economy', example:'The economy entered a recession during the pandemic.', mpsc:'GDP, growth rate related' },
  { word:'Tributary', marathi:'उपनदी', type:'Geography', example:'Son river is a tributary of the Ganga.', mpsc:'Rivers of Maharashtra chapter' },
  { word:'Peninsula', marathi:'द्वीपकल्प', type:'Geography', example:'India is a peninsula surrounded by three seas.', mpsc:'Physical geography' },
  { word:'Aquifer', marathi:'भूजल', type:'Environment', example:'The Deccan aquifer is depleting rapidly.', mpsc:'Environment + Maharashtra water' },
  { word:'Biodiversity', marathi:'जैवविविधता', type:'Environment', example:'Western Ghats is a biodiversity hotspot.', mpsc:'Environment questions' },
  { word:'Embargo', marathi:'व्यापार बंदी', type:'Economy', example:'The UN imposed an embargo on the rogue nation.', mpsc:'International relations' },
  { word:'Coalition', marathi:'युती/आघाडी', type:'Polity', example:'The coalition government won the confidence vote.', mpsc:'Maharashtra politics — Mahayuti' },
  { word:'Sediment', marathi:'गाळ/निक्षेप', type:'Geography', example:'Rivers deposit sediment in their delta regions.', mpsc:'Soil + River geography' },
];

const CSS = `
@keyframes dwp-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes dwp-flip{0%{transform:rotateY(0deg)}100%{transform:rotateY(180deg)}}
@keyframes dwp-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes dwp-pop{0%{transform:scale(0.85)}60%{transform:scale(1.05)}100%{transform:scale(1)}}
`;

const TYPE_COLOR: Record<string, string> = {
  Polity:'#2563EB', Economy:'#D97706', Geography:'#059669', Environment:'#0891B2', General:'#7C3AED'
};

export const DailyWordPractice: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]   = useState<'cards'|'quiz'|'result'>('cards');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learned, setLearned] = useState<Set<number>>(new Set());
  const [quizIdx, setQuizIdx] = useState(0);
  const [opts, setOpts]     = useState<string[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const [score, setScore]   = useState(0);
  const [dailyWords, setDailyWords] = useState<typeof WORDS>([]);

  // Pick 5 daily words based on date
  useEffect(() => {
    const seed  = new Date().getDate() + new Date().getMonth() * 31;
    const start = seed % (WORDS.length - 5);
    setDailyWords(WORDS.slice(start, start + 5));
  }, []);

  useEffect(() => {
    if (phase === 'quiz' && dailyWords.length > 0) genOpts(quizIdx);
  }, [phase, quizIdx, dailyWords]);

  const genOpts = (i: number) => {
    const correct = dailyWords[i];
    const wrong   = WORDS.filter(w => w.word !== correct.word)
                         .sort(() => Math.random() - 0.5).slice(0, 3)
                         .map(w => w.marathi);
    setOpts([...wrong, correct.marathi].sort(() => Math.random() - 0.5));
    setSelected(null);
  };

  const speak = (text: string) => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = 'en-US'; utt.rate = 0.85;
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(utt);
  };

  const handleAnswer = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === dailyWords[quizIdx].marathi;
    if (correct) setScore(s => s + 1);
    updateProgress(1, correct ? 1 : 0);
    addXP(correct ? 4 : 1);
    setTimeout(() => {
      if (quizIdx + 1 >= dailyWords.length) setPhase('result');
      else { setQuizIdx(q => q + 1); }
    }, 1200);
  };

  const w   = dailyWords[cardIdx];
  const qw  = dailyWords[quizIdx];
  const pct = dailyWords.length > 0 ? Math.round((score / dailyWords.length) * 100) : 0;

  if (!dailyWords.length) return null;

  // ── RESULT ──
  if (phase === 'result') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#1A0A2E)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{CSS}</style>
      <div style={{ fontSize:56, marginBottom:12, animation:'dwp-pop 0.5s ease' }}>{pct>=80?'🏆':pct>=60?'⭐':'📚'}</div>
      <div style={{ fontWeight:900, fontSize:32, letterSpacing:'-0.04em', marginBottom:4 }}>{score}/{dailyWords.length}</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>{pct}% accuracy</div>
      <div style={{ fontSize:13, fontWeight:800, color:'#A78BFA', marginBottom:28 }}>+{score*4+dailyWords.length} ⚡ XP!</div>
      {/* Word review */}
      <div style={{ width:'100%', maxWidth:380, background:'rgba(255,255,255,0.06)', borderRadius:18, padding:'16px', marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>आजचे शब्द</div>
        {dailyWords.map(w => (
          <div key={w.word} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:13 }}>
            <span style={{ fontWeight:800, color:'#fff' }}>{w.word}</span>
            <span style={{ fontWeight:700, color:'rgba(255,255,255,0.5)' }}>{w.marathi}</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, width:'100%', maxWidth:380 }}>
        <button onClick={() => { const t=`📖 MPSC Daily Word Practice!\n\n${score}/${dailyWords.length} शब्द · ${pct}%\n\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank'); }}
          style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤</button>
        <button onClick={() => { setPhase('cards'); setCardIdx(0); setFlipped(false); setLearned(new Set()); setQuizIdx(0); setScore(0); setSelected(null); }}
          style={{ flex:1, background:'linear-gradient(135deg,#7C3AED,#6D28D9)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🔁 पुन्हा</button>
        <button onClick={onBack}
          style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'13px', color:'#fff', fontWeight:800, cursor:'pointer' }}>Home</button>
      </div>
    </div>
  );

  // ── QUIZ ──
  if (phase === 'quiz') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => setPhase('cards')} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, background:'rgba(0,0,0,0.06)', borderRadius:99, height:5, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#7C3AED,#EC4899)', borderRadius:99, width:`${((quizIdx)/dailyWords.length)*100}%`, transition:'width 0.4s' }}/>
        </div>
        <span style={{ fontSize:12, fontWeight:800, color:'#7A9090' }}>{quizIdx+1}/{dailyWords.length}</span>
      </div>
      <div style={{ maxWidth:480, margin:'0 auto', padding:'24px 16px' }}>
        <div style={{ background:'linear-gradient(135deg,#1E1B4B,#312E81)', borderRadius:22, padding:'24px 20px', marginBottom:16, textAlign:'center', boxShadow:'0 8px 32px rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>
            {qw && TYPE_COLOR[qw.type] && <span style={{ color: TYPE_COLOR[qw.type] }}>{qw?.type}</span>}
          </div>
          <div style={{ fontWeight:900, fontSize:28, color:'#fff', marginBottom:8, letterSpacing:'-0.02em' }}>{qw?.word}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:600, fontStyle:'italic' }}>"{qw?.example}"</div>
          <button onClick={() => speak(qw?.word||'')}
            style={{ marginTop:12, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:99, padding:'6px 14px', color:'rgba(255,255,255,0.7)', fontWeight:700, fontSize:11, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5 }}>
            <Volume2 size={12}/> उच्चार ऐका
          </button>
        </div>
        <div style={{ fontSize:12, fontWeight:800, color:'#7A9090', textAlign:'center', marginBottom:12 }}>मराठी अर्थ निवडा</div>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {opts.map(opt => {
            const isSel = selected === opt;
            const isAns = opt === qw?.marathi;
            let bg = '#fff', border = 'rgba(0,0,0,0.08)', color = '#1C2B2B';
            if (selected && isAns)           { bg='rgba(5,150,105,0.08)'; border='rgba(5,150,105,0.35)'; color='#065F46'; }
            if (selected && isSel && !isAns) { bg='rgba(220,38,38,0.06)'; border='rgba(220,38,38,0.3)'; color='#991B1B'; }
            if (selected && !isSel && !isAns){ color='#9CA3AF'; }
            return (
              <button key={opt} disabled={!!selected} onClick={() => handleAnswer(opt)}
                style={{ padding:'14px 16px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:800, fontSize:14, textAlign:'left', cursor:selected?'default':'pointer', transition:'all 0.15s', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                {opt}
              </button>
            );
          })}
        </div>
        {selected && qw && (
          <div style={{ background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.15)', borderRadius:14, padding:'12px 14px', marginTop:12, fontSize:12, fontWeight:600, color:'#5B21B6', lineHeight:1.7, animation:'dwp-fade 0.2s ease' }}>
            📌 MPSC: {qw.mpsc}
          </div>
        )}
      </div>
    </div>
  );

  // ── FLASHCARDS ──
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
          <BookOpen size={16} style={{color:'#7C3AED'}}/> Daily Word Practice
        </div>
        <div style={{ fontSize:11, fontWeight:800, color:'#7C3AED', background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:99, padding:'4px 10px' }}>
          आज {dailyWords.length} शब्द
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display:'flex', justifyContent:'center', gap:8, padding:'16px 0 8px' }}>
        {dailyWords.map((_, i) => (
          <div key={i} style={{ width:28, height:28, borderRadius:8, background:learned.has(i)?'rgba(5,150,105,0.2)':i===cardIdx?'rgba(124,58,237,0.15)':'rgba(0,0,0,0.06)', border:`1.5px solid ${learned.has(i)?'rgba(5,150,105,0.4)':i===cardIdx?'rgba(124,58,237,0.4)':'rgba(0,0,0,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:learned.has(i)?'#059669':i===cardIdx?'#7C3AED':'#9CA3AF', cursor:'pointer' }}
            onClick={() => { setCardIdx(i); setFlipped(false); }}>
            {learned.has(i)?'✓':i+1}
          </div>
        ))}
      </div>

      {/* Flashcard */}
      <div style={{ maxWidth:480, margin:'0 auto', padding:'8px 16px 20px' }}>
        {w && (
          <div onClick={() => setFlipped(f => !f)}
            style={{ background:flipped?'linear-gradient(135deg,#1E1B4B,#312E81)':'linear-gradient(135deg,#fff,#F8F5FF)', borderRadius:24, padding:'32px 24px', minHeight:280, cursor:'pointer', boxShadow:'0 8px 32px rgba(124,58,237,0.15)', border:'1.5px solid rgba(124,58,237,0.15)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', transition:'all 0.4s', animation:'dwp-fade 0.3s ease', position:'relative', overflow:'hidden' }}>
            {/* Top stripe */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:`linear-gradient(90deg,${TYPE_COLOR[w.type]},${TYPE_COLOR[w.type]}80)`, backgroundSize:'200%', animation:'dwp-shimmer 3s linear infinite' }}/>
            {!flipped ? (
              <>
                <div style={{ fontSize:11, fontWeight:800, color:TYPE_COLOR[w.type], textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>{w.type}</div>
                <div style={{ fontWeight:900, fontSize:36, color:'#1C2B2B', marginBottom:12, letterSpacing:'-0.03em' }}>{w.word}</div>
                <button onClick={e => { e.stopPropagation(); speak(w.word); }}
                  style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:99, padding:'7px 16px', color:'#7C3AED', fontWeight:700, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:6, marginBottom:16 }}>
                  <Volume2 size={13}/> उच्चार ऐका
                </button>
                <div style={{ fontSize:12, color:'#9CA3AF', fontWeight:600, fontStyle:'italic' }}>"{w.example}"</div>
                <div style={{ marginTop:16, fontSize:11, color:'rgba(124,58,237,0.5)', fontWeight:700 }}>👆 tap for meaning</div>
              </>
            ) : (
              <>
                <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>मराठी अर्थ</div>
                <div style={{ fontWeight:900, fontSize:30, color:'#fff', marginBottom:12 }}>{w.marathi}</div>
                <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'12px', width:'100%', marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.5)', marginBottom:4 }}>📌 MPSC Relevance</div>
                  <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.8)', lineHeight:1.6 }}>{w.mpsc}</div>
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600, fontStyle:'italic' }}>"{w.example}"</div>
              </>
            )}
          </div>
        )}

        {/* Controls */}
        <div style={{ display:'flex', gap:10, marginTop:14 }}>
          <button onClick={() => { setCardIdx(p => Math.max(0, p-1)); setFlipped(false); }}
            disabled={cardIdx === 0}
            style={{ flex:1, background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'13px', color:cardIdx===0?'#D1D5DB':'#7A9090', fontWeight:800, cursor:cardIdx===0?'not-allowed':'pointer' }}>← मागे</button>

          {cardIdx + 1 < dailyWords.length ? (
            <button onClick={() => { setLearned(p => new Set([...p, cardIdx])); setCardIdx(p => p+1); setFlipped(false); }}
              style={{ flex:2, background:'linear-gradient(135deg,#7C3AED,#6D28D9)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
              शिकलो! <ChevronRight size={15}/>
            </button>
          ) : (
            <button onClick={() => { setLearned(p => new Set([...p, cardIdx])); setPhase('quiz'); setQuizIdx(0); setScore(0); setSelected(null); }}
              style={{ flex:2, background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>
              Quiz सुरू करा 🧪
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

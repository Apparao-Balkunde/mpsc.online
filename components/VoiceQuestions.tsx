import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2, VolumeX, Play, Pause, SkipForward, Settings, Mic } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }
interface Q { id:number; question:string; options:string[]; correct_answer_index:number; explanation:string; subject:string; }

const RATES  = [0.7, 0.9, 1.0, 1.2, 1.5];
const TOTAL  = 10;

const CSS = `
  @keyframes vq-spin { to{transform:rotate(360deg)} }
  @keyframes vq-fade { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes vq-wave { 0%{height:8px}25%{height:22px}50%{height:12px}75%{height:26px}100%{height:8px} }
  @keyframes vq-pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.95)} }
`;

export const VoiceQuestions: React.FC<Props> = ({ onBack }) => {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx]             = useState(0);
  const [speaking, setSpeaking]   = useState(false);
  const [muted, setMuted]         = useState(false);
  const [rate, setRate]           = useState(1.0);
  const [answered, setAnswered]   = useState<number|null>(null);
  const [loading, setLoading]     = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [score, setScore]         = useState(0);
  const [done, setDone]           = useState(false);
  const [lang, setLang]           = useState<'hi-IN'|'mr-IN'>('hi-IN');
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const autoRef  = useRef<any>(null);

  // Load questions
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    loadQuestions();
    return () => {
      synthRef.current?.cancel();
      clearTimeout(autoRef.current);
    };
  }, []);

  // Auto-read new question
  useEffect(() => {
    if (questions.length > 0 && !loading && !done) {
      autoRef.current = setTimeout(() => readQuestion(), 600);
    }
  }, [idx, questions.length, loading]);

  const loadQuestions = async () => {
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', {
        exam_filter: 'Rajyaseva',
        row_limit: TOTAL
      });
      if (data?.length) setQuestions(data);
      else {
        // Fallback questions if Supabase fails
        setQuestions([
          { id:1, question:'भारताची राजधानी कोणती आहे?', options:['मुंबई','दिल्ली','चेन्नई','कोलकाता'], correct_answer_index:1, explanation:'नवी दिल्ली ही भारताची राजधानी आहे.', subject:'भूगोल' },
          { id:2, question:'महाराष्ट्राची स्थापना कधी झाली?', options:['1 मे 1960','15 ऑगस्ट 1947','26 जानेवारी 1950','1 जून 1960'], correct_answer_index:0, explanation:'महाराष्ट्र राज्याची स्थापना 1 मे 1960 रोजी झाली.', subject:'इतिहास' },
          { id:3, question:'भारतीय राज्यघटनेत किती मूलभूत हक्क आहेत?', options:['5','6','7','8'], correct_answer_index:1, explanation:'भारतीय राज्यघटनेत 6 मूलभूत हक्क आहेत.', subject:'राज्यघटना' },
          { id:4, question:'गोदावरी नदीचे उगमस्थान कोठे आहे?', options:['महाबळेश्वर','त्र्यंबकेश्वर','नाशिक','पुणे'], correct_answer_index:1, explanation:'गोदावरी नदी नाशिक जिल्ह्यातील त्र्यंबकेश्वर येथून उगम पावते.', subject:'भूगोल' },
          { id:5, question:'RBI ची स्थापना केव्हा झाली?', options:['1930','1935','1947','1950'], correct_answer_index:1, explanation:'Reserve Bank of India ची स्थापना 1 एप्रिल 1935 रोजी झाली.', subject:'अर्थशास्त्र' },
        ]);
      }
    } catch {
      setQuestions([
        { id:1, question:'महाराष्ट्राची राजधानी कोणती?', options:['पुणे','नागपूर','मुंबई','औरंगाबाद'], correct_answer_index:2, explanation:'मुंबई ही महाराष्ट्राची उन्हाळी राजधानी आहे.', subject:'भूगोल' },
        { id:2, question:'भारतीय राज्यघटना कधी लागू झाली?', options:['1947','1950','1952','1955'], correct_answer_index:1, explanation:'भारतीय राज्यघटना 26 जानेवारी 1950 रोजी लागू झाली.', subject:'राज्यघटना' },
        { id:3, question:'73 वी घटनादुरुस्ती कशाशी संबंधित आहे?', options:['नगरपालिका','पंचायती राज','शिक्षण','अर्थव्यवस्था'], correct_answer_index:1, explanation:'73 वी घटनादुरुस्ती 1992 - पंचायती राज व्यवस्थेला मान्यता.', subject:'राज्यघटना' },
      ]);
    }
    setLoading(false);
  };

  const getBestVoice = () => {
    if (!synthRef.current) return null;
    const voices = synthRef.current.getVoices();
    // Prefer Hindi/Marathi voices
    const preferred = voices.find(v =>
      v.lang === lang ||
      v.lang.startsWith('hi') ||
      v.lang.startsWith('mr') ||
      v.name.includes('Hindi') ||
      v.name.includes('Marathi') ||
      v.name.includes('Google हिंदी')
    );
    return preferred || voices.find(v => v.lang.startsWith('en')) || null;
  };

  const speak = (text: string, onEnd?: () => void) => {
    if (muted || !synthRef.current) { onEnd?.(); return; }
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate  = rate;
    utt.pitch = 1;
    utt.lang  = lang;
    const voice = getBestVoice();
    if (voice) utt.voice = voice;
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => { setSpeaking(false); onEnd?.(); };
    utt.onerror = () => { setSpeaking(false); onEnd?.(); };
    synthRef.current.speak(utt);
  };

  const readQuestion = () => {
    const q = questions[idx];
    if (!q) return;
    const optText = q.options.map((o,i) => `${String.fromCharCode(65+i)}. ${o}`).join('. ');
    const text = `प्रश्न ${idx+1}. ${q.question}. पर्याय: ${optText}`;
    speak(text);
  };

  const readAnswer = (ansIdx: number) => {
    const q = questions[idx];
    if (!q) return;
    const correct = ansIdx === q.correct_answer_index;
    const text = correct
      ? `बरोबर! उत्तर आहे ${q.options[q.correct_answer_index]}. ${q.explanation || ''}`
      : `चुकीचे. बरोबर उत्तर: ${q.options[q.correct_answer_index]}. ${q.explanation || ''}`;
    speak(text);
  };

  const handleAnswer = (optIdx: number) => {
    if (answered !== null) return;
    synthRef.current?.cancel();
    setAnswered(optIdx);
    const correct = optIdx === questions[idx]?.correct_answer_index;
    if (correct) setScore(s => s+1);
    updateProgress(1, correct ? 1 : 0);
    addXP(correct ? 4 : 1);
    readAnswer(optIdx);
  };

  const nextQuestion = () => {
    synthRef.current?.cancel();
    setSpeaking(false);
    if (idx + 1 >= questions.length) {
      const finalScore = score + (answered === questions[idx]?.correct_answer_index ? 0 : 0); // already counted
      setDone(true);
      const pct = Math.round(((answered === questions[idx]?.correct_answer_index ? score : score) / questions.length) * 100);
      speak(`Quiz पूर्ण! तुम्ही ${score} पैकी ${questions.length} बरोबर उत्तरे दिली.`);
    } else {
      setAnswered(null);
      setIdx(p => p+1);
    }
  };

  const replay = () => {
    synthRef.current?.cancel();
    setSpeaking(false);
    setAnswered(null);
    setIdx(0);
    setScore(0);
    setDone(false);
    setTimeout(() => readQuestion(), 400);
  };

  const q = questions[idx];

  // ── LOADING ──
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#080C18', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Baloo 2',sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ width:50, height:50, border:'3px solid rgba(232,103,26,0.2)', borderTopColor:'#E8671A', borderRadius:'50%', animation:'vq-spin 0.8s linear infinite', marginBottom:16 }}/>
      <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>Questions लोड होत आहेत...</div>
    </div>
  );

  // ── DONE ──
  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#080C18,#1A0A2E)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <style>{CSS}</style>
        <div style={{ fontSize:64, marginBottom:12 }}>{pct>=80?'🏆':pct>=60?'⭐':'📚'}</div>
        <div style={{ fontWeight:900, fontSize:32, letterSpacing:'-0.04em', marginBottom:4 }}>{score}/{questions.length}</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', fontWeight:600, marginBottom:8 }}>{pct}% accuracy</div>
        <div style={{ fontSize:13, fontWeight:800, color:'#A78BFA', marginBottom:28 }}>+{score*4+questions.length} ⚡ XP earned!</div>
        <div style={{ display:'flex', gap:10, width:'100%', maxWidth:380 }}>
          <button onClick={()=>{const t=`🔊 MPSC Voice Quiz!\\n\\n${score}/${questions.length} · ${pct}%\\nmpscsarathi.online`;window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank');}}
            style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤 Share</button>
          <button onClick={replay}
            style={{ flex:1, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🔁 पुन्हा</button>
          <button onClick={onBack}
            style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'14px', color:'#fff', fontWeight:800, cursor:'pointer' }}>Home</button>
        </div>
      </div>
    );
  }

  // ── QUIZ ──
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#080C18,#0F1117)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60, color:'#fff' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={()=>{ synthRef.current?.cancel(); onBack(); }}
          style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}>
          <ArrowLeft size={14}/>
        </button>
        <div style={{ fontWeight:900, fontSize:15, color:'#fff', display:'flex', alignItems:'center', gap:7 }}>
          <Volume2 size={16} style={{color:'#E8671A'}}/> Voice Quiz
        </div>
        <button onClick={()=>setShowSettings(s=>!s)}
          style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}>
          <Settings size={14}/>
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:16, margin:'0 16px 14px', padding:'16px', animation:'vq-fade 0.2s ease' }}>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', width:50, paddingTop:8 }}>Speed</div>
            {RATES.map(r => (
              <button key={r} onClick={()=>setRate(r)}
                style={{ flex:1, padding:'8px', borderRadius:10, background:rate===r?'#E8671A':'rgba(255,255,255,0.08)', border:`1px solid ${rate===r?'#E8671A':'rgba(255,255,255,0.1)'}`, color:'#fff', fontWeight:800, fontSize:11, cursor:'pointer' }}>
                {r}x
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', width:50, paddingTop:8 }}>Voice</div>
            {([['hi-IN','हिंदी'],['mr-IN','मराठी']] as const).map(([l,label]) => (
              <button key={l} onClick={()=>setLang(l)}
                style={{ flex:1, padding:'8px', borderRadius:10, background:lang===l?'#7C3AED':'rgba(255,255,255,0.08)', border:`1px solid ${lang===l?'#7C3AED':'rgba(255,255,255,0.1)'}`, color:'#fff', fontWeight:800, fontSize:11, cursor:'pointer' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ margin:'0 20px 4px' }}>
        <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:99, height:5, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:99, width:`${((idx+1)/questions.length)*100}%`, transition:'width 0.4s' }}/>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 20px 14px', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>
        <span>{idx+1}/{questions.length}</span>
        <span>Score: {score} ✓</span>
      </div>

      {/* Sound wave animation */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, height:48, marginBottom:16 }}>
        {speaking ? (
          [...Array(7)].map((_,i) => (
            <div key={i} style={{ width:5, borderRadius:3, background:`rgba(232,103,26,${0.4+i*0.08})`, animation:`vq-wave 0.8s ease ${i*0.1}s infinite` }}/>
          ))
        ) : (
          <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center', gap:6 }}>
            <Mic size={14} style={{color:'rgba(255,255,255,0.3)'}}/> ▶ दाबा ऐकण्यासाठी
          </div>
        )}
      </div>

      <div style={{ maxWidth:520, margin:'0 auto', padding:'0 16px' }}>
        {/* Question card */}
        {q && (
          <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:22, padding:'22px 18px', marginBottom:14, animation:'vq-fade 0.3s ease', key:idx }}>
            <div style={{ fontSize:10, fontWeight:800, color:'rgba(232,103,26,0.8)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>
              Q.{idx+1} · {q.subject}
            </div>
            <p style={{ fontWeight:700, fontSize:'clamp(0.95rem,4vw,1.1rem)', lineHeight:1.75, color:'#fff', margin:0 }}>
              {q.question}
            </p>
          </div>
        )}

        {/* Options */}
        <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:20 }}>
          {q?.options?.map((opt, i) => {
            const isSel = answered === i;
            const isAns = i === q.correct_answer_index;
            let bg = 'rgba(255,255,255,0.06)', border = 'rgba(255,255,255,0.12)', color = '#fff';
            if (answered !== null && isAns)           { bg='rgba(5,150,105,0.2)';  border='rgba(5,150,105,0.5)'; }
            if (answered !== null && isSel && !isAns) { bg='rgba(220,38,38,0.2)';  border='rgba(220,38,38,0.5)'; }
            if (answered !== null && !isSel && !isAns){ color='rgba(255,255,255,0.3)'; }
            return (
              <button key={i} disabled={answered !== null} onClick={() => handleAnswer(i)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 15px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:13, textAlign:'left', cursor:answered!==null?'default':'pointer', transition:'all 0.2s' }}>
                <span style={{ width:28, height:28, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:'rgba(255,255,255,0.1)' }}>
                  {answered!==null && isAns ? '✓' : answered!==null && isSel && !isAns ? '✗' : String.fromCharCode(65+i)}
                </span>
                <span style={{ flex:1 }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setMuted(m => !m)}
            style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:'14px', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
            {muted ? <><VolumeX size={16}/> Muted</> : <><Volume2 size={16}/> Sound</>}
          </button>
          <button onClick={readQuestion}
            style={{ flex:1, background:'rgba(232,103,26,0.15)', border:'1px solid rgba(232,103,26,0.3)', borderRadius:14, padding:'14px', color:'#E8671A', fontWeight:800, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, animation:speaking?'vq-pulse 1s ease infinite':'' }}>
            {speaking ? <><Pause size={16}/> थांबा</> : <><Play size={16}/> ऐका</>}
          </button>
          <button onClick={nextQuestion}
            style={{ flex:1, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
            <SkipForward size={16}/> पुढे
          </button>
        </div>

        {/* Tip */}
        <div style={{ marginTop:14, fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.3)', textAlign:'center' }}>
          💡 ▶ दाबा = question ऐका · उत्तर निवडा · पुढे जा
        </div>
      </div>
    </div>
  );
};

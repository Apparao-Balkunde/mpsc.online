import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward, Settings, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';

interface Question { id:number; question:string; options:string[]; correct_answer_index:number; explanation:string; subject:string; }
interface Props { onBack: () => void; }

const RATES  = [0.7, 0.9, 1.0, 1.2, 1.5];
const VOICES_PREF = ['Google हिंदी','Google मराठी','Microsoft Hemant','hi-IN','mr-IN'];

const CSS = `
  @keyframes vq-spin { to{transform:rotate(360deg)} }
  @keyframes vq-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.8} }
  @keyframes vq-fade { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes vq-wave { 0%{height:8px}25%{height:20px}50%{height:12px}75%{height:24px}100%{height:8px} }
`;

export const VoiceQuestions: React.FC<Props> = ({ onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx]             = useState(0);
  const [speaking, setSpeaking]   = useState(false);
  const [muted, setMuted]         = useState(false);
  const [rate, setRate]           = useState(1.0);
  const [answered, setAnswered]   = useState<number|null>(null);
  const [loading, setLoading]     = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    loadQuestions();
    return () => { synthRef.current?.cancel(); };
  }, []);

  const loadQuestions = async () => {
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter:'Rajyaseva', row_limit:10 });
      if (data?.length) setQuestions(data);
    } catch {}
    setLoading(false);
  };

  const speak = (text: string, onEnd?: () => void) => {
    if (muted || !synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate  = rate;
    utt.pitch = 1;
    utt.lang  = 'hi-IN';
    // Try to find Hindi/Marathi voice
    const voices = synthRef.current.getVoices();
    const pref   = voices.find(v => VOICES_PREF.some(p => v.name.includes(p) || v.lang.includes(p)));
    if (pref) utt.voice = pref;
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => { setSpeaking(false); onEnd?.(); };
    utt.onerror = () => setSpeaking(false);
    synthRef.current.speak(utt);
  };

  const readQuestion = () => {
    const q = questions[idx];
    if (!q) return;
    const text = `प्रश्न ${idx+1}. ${q.question}. पर्याय A: ${q.options[0]}. B: ${q.options[1]}. C: ${q.options[2]}. D: ${q.options[3]}.`;
    speak(text);
  };

  const readAnswer = (ansIdx: number) => {
    const q = questions[idx];
    if (!q) return;
    const correct = ansIdx === q.correct_answer_index;
    const text = correct ? `बरोबर! उत्तर आहे: ${q.options[q.correct_answer_index]}. ${q.explanation||''}` : `चुकीचे. बरोबर उत्तर: ${q.options[q.correct_answer_index]}. ${q.explanation||''}`;
    speak(text);
  };

  const handleAnswer = (optIdx: number) => {
    if (answered !== null) return;
    setAnswered(optIdx);
    const correct = optIdx === questions[idx]?.correct_answer_index;
    updateProgress(1, correct ? 1 : 0);
    readAnswer(optIdx);
  };

  const nextQuestion = () => {
    synthRef.current?.cancel();
    setAnswered(null);
    setSpeaking(false);
    setIdx(p => (p+1) % questions.length);
  };

  useEffect(() => {
    if (questions.length > 0 && !loading) {
      setTimeout(() => readQuestion(), 500);
    }
  }, [idx, questions.length]);

  const q = questions[idx];

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0F0F1A', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{CSS}</style>
      <div style={{ width:44, height:44, border:'3px solid rgba(232,103,26,0.2)', borderTopColor:'#E8671A', borderRadius:'50%', animation:'vq-spin 0.8s linear infinite' }}/>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F0F1A 0%,#1A0A2E 100%)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60, color:'#fff' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={()=>{synthRef.current?.cancel();onBack();}} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}>
          <ArrowLeft size={15}/>
        </button>
        <div style={{ fontWeight:900, fontSize:15, color:'#fff', display:'flex', alignItems:'center', gap:8 }}>
          <Volume2 size={16} style={{color:'#E8671A'}}/> Voice Quiz
        </div>
        <button onClick={()=>setShowSettings(s=>!s)} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}>
          <Settings size={15}/>
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:16, margin:'0 16px 16px', padding:'16px' }}>
          <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Speed</div>
          <div style={{ display:'flex', gap:8 }}>
            {RATES.map(r=>(
              <button key={r} onClick={()=>setRate(r)}
                style={{ flex:1, padding:'8px', borderRadius:10, background:rate===r?'#E8671A':'rgba(255,255,255,0.08)', border:`1px solid ${rate===r?'#E8671A':'rgba(255,255,255,0.1)'}`, color:'#fff', fontWeight:800, fontSize:11, cursor:'pointer' }}>
                {r}x
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth:480, margin:'0 auto', padding:'0 16px' }}>
        {/* Sound wave animation */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, height:48, marginBottom:20 }}>
          {speaking ? (
            [...Array(7)].map((_,i) => (
              <div key={i} style={{ width:4, background:`rgba(232,103,26,${0.4+i*0.08})`, borderRadius:2, animation:`vq-wave 0.8s ease ${i*0.1}s infinite` }}/>
            ))
          ) : (
            <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.3)' }}>🎙️ tap करा ऐकण्यासाठी</div>
          )}
        </div>

        {/* Progress */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <div style={{ flex:1, background:'rgba(255,255,255,0.1)', borderRadius:99, height:4 }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:99, width:`${((idx+1)/questions.length)*100}%`, transition:'width 0.4s' }}/>
          </div>
          <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.6)' }}>{idx+1}/{questions.length}</span>
        </div>

        {/* Question card */}
        {q && (
          <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:22, padding:'24px 20px', marginBottom:16, animation:'vq-fade 0.3s ease' }}>
            <div style={{ fontSize:10, fontWeight:800, color:'rgba(232,103,26,0.8)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>
              Q.{idx+1} · {q.subject}
            </div>
            <p style={{ fontWeight:700, fontSize:'clamp(0.95rem,4vw,1.1rem)', lineHeight:1.7, color:'#fff', margin:0 }}>{q.question}</p>
          </div>
        )}

        {/* Options */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {q?.options?.map((opt,i) => {
            const isSel = answered===i, isAns = i===q.correct_answer_index;
            let bg = 'rgba(255,255,255,0.06)', border = 'rgba(255,255,255,0.1)', color = '#fff';
            if (answered!==null && isAns)            { bg='rgba(5,150,105,0.2)';  border='rgba(5,150,105,0.5)'; }
            if (answered!==null && isSel && !isAns)  { bg='rgba(220,38,38,0.2)';  border='rgba(220,38,38,0.5)'; }
            if (answered!==null && !isSel && !isAns) { color='rgba(255,255,255,0.3)'; }
            return (
              <button key={i} disabled={answered!==null} onClick={()=>handleAnswer(i)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 15px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:13, textAlign:'left', cursor:answered!==null?'default':'pointer', transition:'all 0.2s' }}>
                <span style={{ width:26, height:26, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:'rgba(255,255,255,0.1)' }}>
                  {answered!==null && isAns ? '✓' : answered!==null && isSel && !isAns ? '✗' : String.fromCharCode(65+i)}
                </span>
                <span style={{ flex:1 }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={()=>muted?setMuted(false):setMuted(true)}
            style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:'14px', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {muted ? <><VolumeX size={16}/> Muted</> : <><Volume2 size={16}/> Sound</>}
          </button>
          <button onClick={readQuestion}
            style={{ flex:1, background:'rgba(232,103,26,0.15)', border:'1px solid rgba(232,103,26,0.3)', borderRadius:14, padding:'14px', color:'#E8671A', fontWeight:800, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {speaking ? <><Pause size={16}/> थांबा</> : <><Play size={16}/> ऐका</>}
          </button>
          <button onClick={nextQuestion}
            style={{ flex:1, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <SkipForward size={16}/> पुढे
          </button>
        </div>
      </div>
    </div>
  );
};

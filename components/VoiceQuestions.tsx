import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward, Settings, ArrowLeft, Mic, WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';

interface Question { id:number; question:string; options:string[]; correct_answer_index:number; explanation:string; subject:string; }
interface Props { onBack: () => void; }

const RATES  = [0.7, 0.85, 1.0, 1.2, 1.5];
// Priority: Marathi > Hindi > any Indian voice
const VOICE_PRIORITY = ['mr','mr-IN','hi-IN','hi','Google हिंदी','Google मराठी','Microsoft Hemant','Lekha'];

// ✅ Offline fallback questions
const OFFLINE_QUESTIONS: Question[] = [
  { id:1, question:'महाराष्ट्राची राजधानी कोणती आहे?', options:['पुणे','नागपूर','मुंबई','औरंगाबाद'], correct_answer_index:2, explanation:'मुंबई ही महाराष्ट्राची उन्हाळी राजधानी आहे. नागपूर हिवाळी राजधानी आहे.', subject:'भूगोल' },
  { id:2, question:'भारतीय राज्यघटना कधी लागू झाली?', options:['15 ऑगस्ट 1947','26 जानेवारी 1950','2 ऑक्टोबर 1947','15 ऑगस्ट 1950'], correct_answer_index:1, explanation:'भारतीय राज्यघटना 26 जानेवारी 1950 रोजी लागू झाली. हा दिवस प्रजासत्ताक दिन म्हणून साजरा केला जातो.', subject:'राज्यशास्त्र' },
  { id:3, question:'पंचायती राजशी संबंधित कोणती घटनादुरुस्ती आहे?', options:['71वी','72वी','73वी','74वी'], correct_answer_index:2, explanation:'73वी घटनादुरुस्ती 1992 - पंचायती राज व्यवस्थेला घटनात्मक मान्यता मिळाली.', subject:'राज्यशास्त्र' },
  { id:4, question:'गोदावरी नदीचे उगमस्थान कोठे आहे?', options:['महाबळेश्वर','त्र्यंबकेश्वर','नाशिक','पुणे'], correct_answer_index:1, explanation:'गोदावरी नदी नाशिक जिल्ह्यातील त्र्यंबकेश्वर येथून उगम पावते. ती दक्षिण गंगा म्हणून ओळखली जाते.', subject:'भूगोल' },
  { id:5, question:'RBI ची स्थापना कधी झाली?', options:['1930','1935','1947','1950'], correct_answer_index:1, explanation:'RBI म्हणजे Reserve Bank of India ची स्थापना 1 एप्रिल 1935 रोजी झाली.', subject:'अर्थशास्त्र' },
  { id:6, question:'महाराष्ट्रात एकूण किती जिल्हे आहेत?', options:['32','35','36','38'], correct_answer_index:2, explanation:'महाराष्ट्रात एकूण 36 जिल्हे आहेत. हे 6 महसूल विभागांमध्ये विभागले आहेत.', subject:'भूगोल' },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes vq-spin   { to{transform:rotate(360deg)} }
  @keyframes vq-pulse  { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.18);opacity:0.75} }
  @keyframes vq-fade   { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes vq-wave1  { 0%,100%{height:6px}  50%{height:22px} }
  @keyframes vq-wave2  { 0%,100%{height:14px} 50%{height:28px} }
  @keyframes vq-wave3  { 0%,100%{height:8px}  50%{height:18px} }
  @keyframes vq-wave4  { 0%,100%{height:18px} 50%{height:10px} }
  @keyframes vq-wave5  { 0%,100%{height:10px} 50%{height:24px} }
  .vq-opt { transition: all 0.18s ease; cursor: pointer; }
  .vq-opt:hover { transform: translateX(4px); }
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
  const [isOffline, setIsOffline] = useState(false);
  const [autoPlay, setAutoPlay]   = useState(true);
  const [voices, setVoices]       = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIdx, setSelectedVoiceIdx] = useState(0);
  const [score, setScore]         = useState(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    
    // Load voices
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      // Auto-select best Indian voice
      const bestIdx = v.findIndex(voice =>
        VOICE_PRIORITY.some(p => voice.lang?.startsWith(p) || voice.name?.includes(p))
      );
      if (bestIdx >= 0) setSelectedVoiceIdx(bestIdx);
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Offline detection
    setIsOffline(!navigator.onLine);
    window.addEventListener('online', () => setIsOffline(false));
    window.addEventListener('offline', () => setIsOffline(true));
    
    loadQuestions();
    return () => { synthRef.current?.cancel(); };
  }, []);

  const loadQuestions = async () => {
    if (!navigator.onLine) {
      setQuestions(OFFLINE_QUESTIONS);
      setIsOffline(true);
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter:'Rajyaseva', row_limit:10 });
      if (data?.length) {
        setQuestions(data);
      } else {
        setQuestions(OFFLINE_QUESTIONS);
      }
    } catch {
      setQuestions(OFFLINE_QUESTIONS);
      setIsOffline(true);
    }
    setLoading(false);
  };

  // ✅ Improved TTS — Marathi/Hindi voice, better text preparation
  const speak = (text: string, onEnd?: () => void) => {
    if (muted || !synthRef.current) { onEnd?.(); return; }
    synthRef.current.cancel();

    // Prepare text for better TTS — numbers, symbols fix
    const cleanText = text
      .replace(/[()]/g, ', ')
      .replace(/\?/g, '? ')
      .replace(/\//g, ' किंवा ')
      .trim();

    const utt = new SpeechSynthesisUtterance(cleanText);
    utt.rate  = rate;
    utt.pitch = 1.0;
    utt.volume = 1.0;

    // Use selected voice or best available
    if (voices[selectedVoiceIdx]) {
      utt.voice = voices[selectedVoiceIdx];
      utt.lang  = voices[selectedVoiceIdx].lang || 'hi-IN';
    } else {
      utt.lang = 'hi-IN';
    }

    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => { setSpeaking(false); onEnd?.(); };
    utt.onerror = () => { setSpeaking(false); onEnd?.(); };
    
    // Workaround for Chrome bug — long text gets cut
    if (cleanText.length > 200) {
      const parts = cleanText.match(/.{1,200}(\s|$)/g) || [cleanText];
      let partIdx = 0;
      const speakPart = () => {
        if (partIdx >= parts.length) { setSpeaking(false); onEnd?.(); return; }
        const pUtt = new SpeechSynthesisUtterance(parts[partIdx++]);
        pUtt.rate = rate; pUtt.lang = utt.lang;
        if (voices[selectedVoiceIdx]) pUtt.voice = voices[selectedVoiceIdx];
        pUtt.onend = speakPart;
        pUtt.onstart = () => setSpeaking(true);
        synthRef.current?.speak(pUtt);
      };
      speakPart();
    } else {
      synthRef.current.speak(utt);
    }
  };

  const q = questions[idx];

  const readQuestion = () => {
    if (!q) return;
    const optLabels = ['A', 'B', 'C', 'D'];
    const text = `प्रश्न ${idx+1}: ${q.question}. पर्याय: ${q.options.map((o, i) => `${optLabels[i]}. ${o}`).join('. ')}`;
    speak(text);
  };

  const readAnswer = (optIdx: number) => {
    const isCorrect = optIdx === q.correct_answer_index;
    const ansText = isCorrect
      ? `बरोबर! ${q.options[optIdx]} योग्य उत्तर आहे. स्पष्टीकरण: ${q.explanation || ''}`
      : `चुकीचे. योग्य उत्तर ${q.options[q.correct_answer_index]} आहे. ${q.explanation || ''}`;
    speak(ansText);
  };

  const handleAnswer = (optIdx: number) => {
    if (answered !== null) return;
    setAnswered(optIdx);
    const correct = optIdx === q.correct_answer_index;
    if (correct) setScore(s => s + 1);
    updateProgress(1, correct ? 1 : 0);
    readAnswer(optIdx);
  };

  const nextQuestion = () => {
    synthRef.current?.cancel();
    if (idx + 1 >= questions.length) { setIdx(0); setAnswered(null); return; }
    setIdx(i => i + 1);
    setAnswered(null);
    if (autoPlay) setTimeout(() => readQuestion(), 300);
  };

  useEffect(() => {
    if (!loading && questions.length > 0 && autoPlay && !muted) {
      setTimeout(() => readQuestion(), 500);
    }
  }, [idx, loading]);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0D1F1F,#1C2B2B)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Baloo 2',sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ textAlign:'center', color:'#fff' }}>
        <div style={{ width:48, height:48, border:'3px solid rgba(232,103,26,0.2)', borderTopColor:'#E8671A', borderRadius:'50%', animation:'vq-spin 0.8s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ fontWeight:700, fontSize:13, color:'rgba(255,255,255,0.5)' }}>Questions load होत आहेत...</p>
      </div>
    </div>
  );

  const accuracy = idx > 0 ? Math.round((score / idx) * 100) : 0;

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0D1F1F 0%,#1C2B2B 100%)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', paddingBottom:40 }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12, background:'rgba(0,0,0,0.2)', backdropFilter:'blur(10px)', position:'sticky', top:0, zIndex:50 }}>
        <button onClick={() => { synthRef.current?.cancel(); onBack(); }} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, width:36, height:36, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <ArrowLeft size={18}/>
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:900, fontSize:15, color:'#fff' }}>🎙️ Voice Quiz</div>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>
            {isOffline ? '📡 Offline mode — cached questions' : `${idx+1}/${questions.length} · ${accuracy}% accuracy`}
          </div>
        </div>
        {isOffline && <div style={{ background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'4px 10px', display:'flex', alignItems:'center', gap:5 }}>
          <WifiOff size={12} style={{ color:'#FCA5A5' }}/><span style={{ fontSize:10, fontWeight:800, color:'#FCA5A5' }}>Offline</span>
        </div>}
        <button onClick={() => setMuted(m => !m)} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:10, width:36, height:36, color:muted?'#7A9090':'#E8671A', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {muted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
        </button>
        <button onClick={() => setShowSettings(s => !s)} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:10, width:36, height:36, color:'rgba(255,255,255,0.6)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Settings size={16}/>
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{ background:'rgba(0,0,0,0.4)', backdropFilter:'blur(10px)', padding:'16px', margin:'0 16px 12px', borderRadius:16, border:'1px solid rgba(255,255,255,0.1)', animation:'vq-fade 0.3s ease' }}>
          <div style={{ fontWeight:800, fontSize:12, color:'rgba(255,255,255,0.6)', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.1em' }}>⚙️ Settings</div>
          
          {/* Speed */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>Speed: {rate}x</div>
            <div style={{ display:'flex', gap:6 }}>
              {RATES.map(r => (
                <button key={r} onClick={() => setRate(r)}
                  style={{ flex:1, padding:'6px 4px', borderRadius:9, border:`1.5px solid ${rate===r?'#E8671A':'rgba(255,255,255,0.1)'}`, background:rate===r?'rgba(232,103,26,0.2)':'transparent', color:rate===r?'#E8671A':'rgba(255,255,255,0.5)', fontWeight:800, fontSize:11, cursor:'pointer' }}>
                  {r}x
                </button>
              ))}
            </div>
          </div>

          {/* Voice selection */}
          {voices.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>Voice:</div>
              <select value={selectedVoiceIdx}
                onChange={e => setSelectedVoiceIdx(Number(e.target.value))}
                style={{ width:'100%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:'8px 12px', color:'#fff', fontWeight:600, fontSize:12, fontFamily:"'Baloo 2',sans-serif" }}>
                {voices.map((v, i) => (
                  <option key={i} value={i} style={{ background:'#1C2B2B', color:'#fff' }}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>
          )}

          {/* Auto-play */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>Auto-play next question</span>
            <div onClick={() => setAutoPlay(a => !a)} style={{ width:40, height:22, borderRadius:11, background:autoPlay?'#E8671A':'rgba(255,255,255,0.15)', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left:autoPlay?20:2, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth:520, margin:'0 auto', padding:'16px' }}>
        
        {/* Sound visualizer */}
        {speaking && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:16, height:36 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ width:4, background:'#E8671A', borderRadius:2, animation:`vq-wave${i} ${0.4+i*0.08}s ease-in-out infinite` }}/>
            ))}
            <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', marginLeft:8 }}>Reading...</span>
          </div>
        )}

        {/* Progress */}
        <div style={{ display:'flex', gap:4, marginBottom:14 }}>
          {questions.slice(0,10).map((_, i) => (
            <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i < idx ? '#E8671A' : i === idx ? 'rgba(232,103,26,0.5)' : 'rgba(255,255,255,0.1)' }}/>
          ))}
        </div>

        {/* Question card */}
        {q && (
          <div key={idx} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:22, padding:'22px 20px', marginBottom:14, animation:'vq-fade 0.3s ease' }}>
            <div style={{ fontSize:10, fontWeight:800, color:'rgba(232,103,26,0.8)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>
              Q.{idx+1} · {q.subject}
            </div>
            <p style={{ fontWeight:700, fontSize:'clamp(1rem,4vw,1.15rem)', lineHeight:1.7, color:'#fff', margin:'0 0 16px' }}>{q.question}</p>
            
            {/* Play button */}
            <button onClick={readQuestion} disabled={speaking}
              style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(232,103,26,0.15)', border:'1px solid rgba(232,103,26,0.3)', borderRadius:12, padding:'8px 16px', color:'#E8671A', fontWeight:800, fontSize:12, cursor:speaking?'default':'pointer', marginBottom:4 }}>
              {speaking ? <><Volume2 size={14} style={{ animation:'vq-pulse 1s ease infinite' }}/> Reading...</> : <><Play size={14}/> प्रश्न ऐका</>}
            </button>
          </div>
        )}

        {/* Options */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
          {q?.options?.map((opt, i) => {
            const isSel = answered === i;
            const isAns = i === q.correct_answer_index;
            const revealed = answered !== null;
            let bg='rgba(255,255,255,0.05)', border='rgba(255,255,255,0.12)', color='#fff', icon='';
            if (revealed && isAns)           { bg='rgba(16,185,129,0.2)'; border='rgba(16,185,129,0.5)'; icon='✓'; }
            if (revealed && isSel && !isAns) { bg='rgba(220,38,38,0.2)'; border='rgba(220,38,38,0.4)'; icon='✗'; }
            if (revealed && !isSel && !isAns){ color='rgba(255,255,255,0.3)'; }
            return (
              <button key={i} disabled={answered !== null} className="vq-opt" onClick={() => handleAnswer(i)}
                style={{ padding:'14px 16px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:13, textAlign:'left', cursor:answered!==null?'default':'pointer', display:'flex', alignItems:'center', gap:10, transition:'all 0.18s' }}>
                <span style={{ width:26, height:26, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:'rgba(255,255,255,0.08)' }}>
                  {icon || String.fromCharCode(65+i)}
                </span>
                <span style={{ flex:1 }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {answered !== null && (
          <div style={{ background:'rgba(232,103,26,0.08)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:14, padding:'14px 16px', marginBottom:14, animation:'vq-fade 0.3s ease' }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#E8671A', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>💡 स्पष्टीकरण</div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.75)', lineHeight:1.65, fontWeight:600, margin:0 }}>{q?.explanation || 'उत्तर: ' + q?.options?.[q.correct_answer_index]}</p>
          </div>
        )}

        {/* Controls */}
        <div style={{ display:'flex', gap:10 }}>
          {answered !== null && (
            <button onClick={nextQuestion}
              style={{ flex:1, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {idx+1 >= questions.length ? '🔄 पुन्हा करा' : <>पुढे <SkipForward size={16}/></>}
            </button>
          )}
          {answered === null && !speaking && (
            <button onClick={readQuestion}
              style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'14px', color:'rgba(255,255,255,0.7)', fontWeight:800, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <Volume2 size={16}/> पुन्हा ऐका
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

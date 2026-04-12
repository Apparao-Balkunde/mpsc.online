import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mic, MicOff, Send, Bot, User, Volume2, Loader, RefreshCw } from 'lucide-react';

interface Props { onBack: () => void; }
interface Message { role: 'ai' | 'user'; text: string; time: string; }

const TOPICS = ['राज्यघटना','मराठी इतिहास','भूगोल','चालू घडामोडी','अर्थव्यवस्था','विज्ञान'];

const STARTER_QUESTIONS: Record<string, string> = {
  'राज्यघटना': 'भारतीय राज्यघटनेत किती मूलभूत हक्क आहेत आणि ते कोणते आहेत?',
  'मराठी इतिहास': 'छत्रपती शिवाजी महाराजांचे प्रशासन कसे होते? थोडक्यात सांगा.',
  'भूगोल': 'महाराष्ट्रातील प्रमुख नद्या कोणत्या आहेत आणि त्या कोठे उगम पावतात?',
  'चालू घडामोडी': 'तुम्ही MPSC साठी current affairs कशी तयार करता?',
  'अर्थव्यवस्था': 'GDP म्हणजे काय आणि ते कसे मोजतात?',
  'विज्ञान': 'Newton चा दुसरा नियम काय आहे? उदाहरण द्या.',
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes mi-spin { to{transform:rotate(360deg)} }
  @keyframes mi-fade { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
  @keyframes mi-pulse { 0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:0.8} }
  @keyframes mi-wave { 0%,100%{height:6px}50%{height:18px} }
`;

export const AIMockInterview: React.FC<Props> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [topic, setTopic]       = useState('');
  const [started, setStarted]   = useState(false);
  const [listening, setListening] = useState(false);
  const [score, setScore]       = useState<number|null>(null);
  const [qCount, setQCount]     = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'mr-IN'; utt.rate = 0.9;
    window.speechSynthesis.speak(utt);
  };

  const startInterview = async (t: string) => {
    setTopic(t); setStarted(true); setQCount(1);
    const firstQ = STARTER_QUESTIONS[t] || `${t} बद्दल एक महत्त्वाचा प्रश्न सांगा.`;
    const aiMsg: Message = { role:'ai', text:firstQ, time:new Date().toLocaleTimeString('mr-IN',{hour:'2-digit',minute:'2-digit'}) };
    setMessages([{ role:'ai', text:`नमस्कार! मी तुमचा MPSC Interview Trainer आहे. आजचा विषय: **${t}**\n\nचला सुरू करूया! 🎯`, time:'' }, aiMsg]);
    speak(firstQ);
  };

  const sendAnswer = async (ans?: string) => {
    const answer = ans || input.trim();
    if (!answer || loading) return;
    setInput('');

    const userMsg: Message = { role:'user', text:answer, time:new Date().toLocaleTimeString('mr-IN',{hour:'2-digit',minute:'2-digit'}) };
    setMessages(p => [...p, userMsg]);
    setLoading(true);

    const history = messages.filter(m=>m.text).map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text
    }));

    const isLast = qCount >= 5;
    const prompt = isLast
      ? `Student ने 5 questions ची answers दिली. आता त्यांना feedback दे:\n1. Performance assessment (100 पैकी score)\n2. चांगले काय होते\n3. सुधारणा कुठे हवी\n4. Study Tips\n\nमराठी मध्ये उत्तर दे.`
      : `Student ने "${answer}" असे उत्तर दिले. आता:\n1. त्यांच्या उत्तराबद्दल short feedback दे (1-2 lines)\n2. ${topic} बद्दल पुढचा MPSC interview question विचार\n\nमराठी मध्ये. Format: [FEEDBACK]\n...\n[QUESTION]\n...`;

    try {
      const res = await fetch('/api/ai', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          system: `तू एक experienced MPSC interview trainer आहेस. Student ला ${topic} बद्दल interview practice करायला मदत कर. मराठी मध्ये बोल. Encouraging रहा पण accurate feedback दे.`,
          messages: [...history, { role:'user', content:prompt }],
          max_tokens: 400
        })
      });
      const data = await res.json();
      let text = data?.text || '';

      if (isLast) {
        // Extract score
        const scoreMatch = text.match(/(\d{2,3})\s*(?:\/\s*100|पैकी|marks?)/i);
        if (scoreMatch) setScore(parseInt(scoreMatch[1]));
      }

      const aiMsg: Message = { role:'ai', text:text.trim(), time:new Date().toLocaleTimeString('mr-IN',{hour:'2-digit',minute:'2-digit'}) };
      setMessages(p => [...p, aiMsg]);
      setQCount(q => q+1);

      // Speak only the question part
      const questionPart = text.includes('[QUESTION]') ? text.split('[QUESTION]')[1]?.trim() : text;
      speak(questionPart || text);

    } catch {
      setMessages(p => [...p, { role:'ai', text:'काहीतरी चुकले. पुन्हा try करा.', time:'' }]);
    }
    setLoading(false);
  };

  const startVoice = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) { alert('Voice recognition supported नाही.'); return; }
    const rec = new SpeechRec();
    rec.lang = 'mr-IN';
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      sendAnswer(transcript);
    };
    rec.start();
    recognitionRef.current = rec;
  };

  // Topic selection screen
  if (!started) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#1A1228)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', paddingBottom:40 }}>
      <style>{CSS}</style>
      <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={14}/></button>
        <span style={{ fontWeight:900, fontSize:16 }}>🎙️ AI Mock Interview</span>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:64, marginBottom:12, animation:'mi-pulse 2s ease infinite', display:'inline-block' }}>🤖</div>
          <h2 style={{ fontWeight:900, fontSize:22, letterSpacing:'-0.04em', margin:'0 0 8px' }}>AI Interview Practice</h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:600, lineHeight:1.6 }}>
            5 MPSC level questions — Text किंवा Voice मध्ये उत्तर द्या<br/>
            AI तुमचे evaluation करेल!
          </p>
        </div>

        <div style={{ fontWeight:800, fontSize:12, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>विषय निवडा</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {TOPICS.map(t => (
            <button key={t} onClick={()=>startInterview(t)}
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, padding:'18px 14px', cursor:'pointer', textAlign:'center', transition:'all 0.2s', color:'#fff' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(232,103,26,0.15)';e.currentTarget.style.borderColor='rgba(232,103,26,0.4)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.borderColor='rgba(255,255,255,0.12)';}}>
              <div style={{ fontSize:28, marginBottom:6 }}>
                {t==='राज्यघटना'?'⚖️':t==='मराठी इतिहास'?'📜':t==='भूगोल'?'🗺️':t==='चालू घडामोडी'?'📰':t==='अर्थव्यवस्था'?'💹':'🔬'}
              </div>
              <div style={{ fontWeight:800, fontSize:13 }}>{t}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const isFinished = qCount > 5;

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#1A1228)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ padding:'12px 20px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:900, fontSize:14 }}>🎙️ AI Mock Interview</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{topic} · Q{Math.min(qCount,5)}/5</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ background:'rgba(232,103,26,0.15)', border:'1px solid rgba(232,103,26,0.3)', borderRadius:99, padding:'4px 12px', fontSize:11, fontWeight:800, color:'#E8671A' }}>
            {Math.min(qCount,5)}/5 Done
          </div>
          <button onClick={()=>{ setMessages([]); setStarted(false); setQCount(0); setScore(null); }}
            style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'7px 9px', cursor:'pointer', color:'rgba(255,255,255,0.6)', display:'flex' }}>
            <RefreshCw size={13}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 8px' }}>
        <div style={{ maxWidth:560, margin:'0 auto', display:'flex', flexDirection:'column', gap:12 }}>
          {messages.map((m,i) => (
            <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', animation:'mi-fade 0.25s ease' }}>
              <div style={{ maxWidth:'85%' }}>
                {m.role==='ai' && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                    <div style={{ width:22, height:22, borderRadius:7, background:'linear-gradient(135deg,#E8671A,#C4510E)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>🤖</div>
                    <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)' }}>AI Trainer {m.time}</span>
                  </div>
                )}
                <div style={{ background:m.role==='user'?'linear-gradient(135deg,#E8671A,#C4510E)':'rgba(255,255,255,0.08)', borderRadius:m.role==='user'?'18px 18px 4px 18px':'4px 18px 18px 18px', padding:'12px 16px', border:m.role==='ai'?'1px solid rgba(255,255,255,0.08)':'none' }}>
                  <p style={{ fontSize:13, fontWeight:600, color:'#fff', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap' }}>{m.text.replace('[FEEDBACK]','').replace('[QUESTION]','\n📌').trim()}</p>
                </div>
                {m.role==='user' && m.time && <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', textAlign:'right', marginTop:3 }}>{m.time}</div>}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display:'flex', gap:6, alignItems:'center', animation:'mi-fade 0.2s ease' }}>
              <div style={{ width:22, height:22, borderRadius:7, background:'linear-gradient(135deg,#E8671A,#C4510E)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>🤖</div>
              <div style={{ display:'flex', gap:3, alignItems:'flex-end', background:'rgba(255,255,255,0.08)', borderRadius:'4px 18px 18px 18px', padding:'12px 16px', border:'1px solid rgba(255,255,255,0.08)' }}>
                {[...Array(4)].map((_,i) => <div key={i} style={{ width:4, background:'rgba(255,255,255,0.4)', borderRadius:2, animation:`mi-wave 0.8s ease ${i*0.15}s infinite` }}/>)}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
      </div>

      {/* Input */}
      {!isFinished && (
        <div style={{ padding:'10px 16px max(12px,env(safe-area-inset-bottom))', borderTop:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
          <div style={{ maxWidth:560, margin:'0 auto', display:'flex', gap:8, alignItems:'flex-end' }}>
            <textarea value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),sendAnswer())}
              placeholder="उत्तर लिहा... (Enter = submit)"
              rows={2}
              style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'11px 14px', color:'#fff', fontSize:13, fontWeight:600, resize:'none', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", lineHeight:1.5, outline:'none' }}/>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <button onClick={startVoice} disabled={loading}
                style={{ background:listening?'rgba(220,38,38,0.3)':'rgba(255,255,255,0.08)', border:`1px solid ${listening?'rgba(220,38,38,0.5)':'rgba(255,255,255,0.15)'}`, borderRadius:12, padding:'10px', cursor:'pointer', display:'flex', animation:listening?'mi-pulse 1s ease infinite':'' }}>
                {listening?<MicOff size={16} style={{color:'#EF4444'}}/>:<Mic size={16} style={{color:'rgba(255,255,255,0.7)'}}/>}
              </button>
              <button onClick={()=>sendAnswer()} disabled={loading||!input.trim()}
                style={{ background:input.trim()?'linear-gradient(135deg,#E8671A,#C4510E)':'rgba(255,255,255,0.06)', border:'none', borderRadius:12, padding:'10px', cursor:input.trim()?'pointer':'not-allowed', display:'flex' }}>
                {loading?<div style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'mi-spin 0.8s linear infinite'}}/>:<Send size={16} style={{color:input.trim()?'#fff':'rgba(255,255,255,0.3)'}}/>}
              </button>
            </div>
          </div>
          {score!==null && (
            <div style={{ maxWidth:560, margin:'10px auto 0', background:'rgba(232,103,26,0.15)', border:'1px solid rgba(232,103,26,0.3)', borderRadius:12, padding:'10px 14px', textAlign:'center', fontSize:13, fontWeight:800, color:'#E8671A' }}>
              🏆 Interview Score: {score}/100
            </div>
          )}
        </div>
      )}
    </div>
  );
};

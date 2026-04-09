import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, RefreshCw, Sparkles, ChevronDown } from 'lucide-react';

interface Props { onClose: () => void; user?: any; }
interface Msg { role:'ai'|'user'; text:string; time:string; }

const CHAT_KEY = 'mpsc_buddy_chat';
const CSS = `
  @keyframes sb-fade { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
  @keyframes sb-spin { to{transform:rotate(360deg)} }
  @keyframes sb-wave { 0%,100%{height:6px}50%{height:16px} }
  @keyframes sb-pulse{ 0%,100%{opacity:1}50%{opacity:0.5} }
  @keyframes sb-glow { 0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.3)}50%{box-shadow:0 0 40px rgba(124,58,237,0.6)} }
  textarea:focus { outline:none; border-color:#7C3AED !important; }
`;

const QUICK = [
  '📅 आजचा study plan बनव',
  '🧠 मला motivation दे',
  '📚 राज्यघटना कसे अभ्यासायचे?',
  '⏰ Time management tips दे',
  '🎯 MPSC 2025 strategy सांग',
  '❓ Accuracy कमी आहे, काय करू?',
  '🗺️ Maharashtra geography shortcuts',
  '📰 Current affairs कशी study करू?',
];

export const AIStudyBuddy: React.FC<Props> = ({ onClose, user }) => {
  const [msgs, setMsgs]   = useState<Msg[]>(() => {
    try { return JSON.parse(localStorage.getItem(CHAT_KEY)||'[]').slice(-30); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'मित्र';

  const progress = (() => { try { return JSON.parse(localStorage.getItem('mpsc_user_progress')||'{}'); } catch { return {}; } })();
  const acc = progress.totalAttempted>0 ? Math.round((progress.totalCorrect/progress.totalAttempted)*100) : 0;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, loading]);

  useEffect(() => {
    if (msgs.length === 0) {
      const welcome: Msg = {
        role:'ai',
        text:`नमस्कार ${name}! 🙏 मी तुमचा AI Study Buddy आहे!\n\nतुमचा current status:\n📊 Accuracy: ${acc}%\n🔥 Streak: ${progress.streak||0} days\n📝 Questions solved: ${progress.totalAttempted||0}\n\nआज काय अभ्यास करायचा आहे? मी help करायला तयार आहे! 💪`,
        time:new Date().toLocaleTimeString('mr-IN',{hour:'2-digit',minute:'2-digit'})
      };
      setMsgs([welcome]);
    }
  }, []);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput(''); setShowQuick(false);
    const userMsg: Msg = { role:'user', text:msg, time:new Date().toLocaleTimeString('mr-IN',{hour:'2-digit',minute:'2-digit'}) };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setLoading(true);

    const history = newMsgs.slice(-10).map(m=>({ role:m.role==='ai'?'assistant':'user', content:m.text }));

    try {
      const res = await fetch('/api/ai', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          system: `तू MPSC सारथी चा AI Study Buddy आहेस. Student ${name} शी मराठी मध्ये बोल.
Student stats: Accuracy ${acc}%, Streak ${progress.streak||0} days, ${progress.totalAttempted||0} questions solved.
तू motivating, knowledgeable आणि friendly आहेस. MPSC exam tips, study strategies, current affairs, concepts — सगळ्या बद्दल मदत कर.
Response concise ठेव — 4-6 lines maximum. Emojis वापर.`,
          messages: history,
          max_tokens: 350
        })
      });
      const data = await res.json();
      const aiMsg: Msg = { role:'ai', text:data?.text?.trim()||'माफ करा, पुन्हा try करा.', time:new Date().toLocaleTimeString('mr-IN',{hour:'2-digit',minute:'2-digit'}) };
      const final = [...newMsgs, aiMsg];
      setMsgs(final);
      localStorage.setItem(CHAT_KEY, JSON.stringify(final.slice(-30)));
    } catch {
      setMsgs(m=>[...m,{role:'ai',text:'Connection issue. पुन्हा try करा.',time:''}]);
    }
    setLoading(false);
  };

  const clear = () => {
    if (!window.confirm('Chat clear करायचे?')) return;
    setMsgs([]); localStorage.removeItem(CHAT_KEY);
    setTimeout(()=>window.location.reload(),100);
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,17,30,0.7)',backdropFilter:'blur(10px)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:300,fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <style>{CSS}</style>
      <div style={{background:'#10142A',borderRadius:'28px 28px 0 0',width:'100%',maxWidth:540,height:'88vh',display:'flex',flexDirection:'column',boxShadow:'0 -20px 60px rgba(124,58,237,0.2)',animation:'sb-fade 0.4s cubic-bezier(.34,1.56,.64,1)'}}>
        {/* Header */}
        <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          <div style={{width:44,height:44,borderRadius:14,background:'linear-gradient(135deg,#7C3AED,#EC4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,animation:'sb-glow 3s ease infinite',flexShrink:0}}>🤖</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:15,color:'#fff'}}>AI Study Buddy</div>
            <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:600}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:'#10B981',animation:'sb-pulse 2s ease infinite'}}/>
              Online · मराठी मध्ये बोला
            </div>
          </div>
          <button onClick={clear} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:9,padding:'7px',cursor:'pointer',color:'rgba(255,255,255,0.4)',display:'flex'}}><RefreshCw size={13}/></button>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:9,padding:'7px',cursor:'pointer',color:'rgba(255,255,255,0.6)',display:'flex'}}><X size={15}/></button>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:'auto',padding:'14px 16px 8px'}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:12,animation:'sb-fade 0.25s ease'}}>
              <div style={{maxWidth:'85%'}}>
                {m.role==='ai'&&<div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                  <div style={{width:20,height:20,borderRadius:6,background:'linear-gradient(135deg,#7C3AED,#EC4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>🤖</div>
                  <span style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.35)'}}>AI Buddy · {m.time}</span>
                </div>}
                <div style={{background:m.role==='user'?'linear-gradient(135deg,#7C3AED,#6D28D9)':'rgba(255,255,255,0.07)',borderRadius:m.role==='user'?'18px 18px 4px 18px':'4px 18px 18px 18px',padding:'12px 16px',border:m.role==='ai'?'1px solid rgba(255,255,255,0.07)':'none'}}>
                  <p style={{fontSize:13,fontWeight:600,color:'#fff',lineHeight:1.75,margin:0,whiteSpace:'pre-wrap'}}>{m.text}</p>
                </div>
                {m.role==='user'&&<div style={{fontSize:9,color:'rgba(255,255,255,0.25)',textAlign:'right',marginTop:3}}>{m.time}</div>}
              </div>
            </div>
          ))}
          {loading&&(
            <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:12}}>
              <div style={{width:20,height:20,borderRadius:6,background:'linear-gradient(135deg,#7C3AED,#EC4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>🤖</div>
              <div style={{background:'rgba(255,255,255,0.07)',borderRadius:'4px 18px 18px 18px',padding:'12px 16px',border:'1px solid rgba(255,255,255,0.07)',display:'flex',gap:3,alignItems:'flex-end'}}>
                {[...Array(4)].map((_,i)=><div key={i} style={{width:4,background:'rgba(124,58,237,0.7)',borderRadius:2,animation:`sb-wave 0.8s ease ${i*0.15}s infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Quick prompts */}
        {showQuick && msgs.length<=1 && (
          <div style={{padding:'0 16px 10px',flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Quick prompts</div>
            <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
              {QUICK.map(q=>(
                <button key={q} onClick={()=>send(q)} style={{background:'rgba(124,58,237,0.12)',border:'1px solid rgba(124,58,237,0.3)',borderRadius:99,padding:'6px 12px',fontSize:11,fontWeight:700,color:'#A78BFA',cursor:'pointer'}}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{padding:'10px 16px max(12px,env(safe-area-inset-bottom))',borderTop:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>
          <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
            <textarea value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())}
              placeholder="काहीही विचारा... (Enter = send)"
              rows={2}
              style={{flex:1,background:'rgba(255,255,255,0.07)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'11px 14px',color:'#fff',fontSize:13,fontWeight:600,resize:'none',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",lineHeight:1.5,transition:'border 0.2s'}}/>
            <button onClick={()=>send()} disabled={loading||!input.trim()}
              style={{background:input.trim()?'linear-gradient(135deg,#7C3AED,#6D28D9)':'rgba(255,255,255,0.06)',border:'none',borderRadius:14,padding:'14px',cursor:input.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:input.trim()?'0 4px 16px rgba(124,58,237,0.4)':'none'}}>
              {loading?<div style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'sb-spin 0.8s linear infinite'}}/>:<Send size={16} style={{color:input.trim()?'#fff':'rgba(255,255,255,0.3)'}}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

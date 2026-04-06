import React, { useState, useEffect } from 'react';
import { ArrowLeft, PenLine, Sparkles, Clock, Save, Check, RefreshCw, Loader } from 'lucide-react';

interface Props { onBack: () => void; }
const KEY = 'mpsc_essays';
const CSS = `@keyframes em-spin{to{transform:rotate(360deg)}} @keyframes em-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} @keyframes em-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}`;

const TOPICS = [
  'महाराष्ट्रातील शेतकरी संकट आणि उपाय',
  'डिजिटल इंडिया — फायदे आणि आव्हाने',
  'स्त्री शिक्षण आणि सामाजिक विकास',
  'पर्यावरण रक्षण आणि आर्थिक विकास',
  'स्थानिक स्वराज्य संस्था — महत्त्व',
  'भ्रष्टाचार निर्मूलन — उपाय',
  'जलसंधारण आणि महाराष्ट्र',
  'युवा आणि राष्ट्र निर्माण',
];

interface Essay { id:string; topic:string; content:string; wordCount:number; date:string; score?:number; feedback?:string; }

export const EssayMode: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]       = useState<'list'|'write'|'review'>('list');
  const [essays, setEssays]     = useState<Essay[]>(() => { try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; }});
  const [topic, setTopic]       = useState('');
  const [content, setContent]   = useState('');
  const [timer, setTimer]       = useState(0);
  const [running, setRunning]   = useState(false);
  const [feedback, setFeedback] = useState('');
  const [score, setScore]       = useState<number|null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [selected, setSelected] = useState<Essay|null>(null);
  const [saved, setSaved]       = useState(false);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTimer(s=>s+1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const saveEssays = (data: Essay[]) => { setEssays(data); localStorage.setItem(KEY, JSON.stringify(data)); };

  const startEssay = (t: string) => {
    setTopic(t); setContent(''); setTimer(0); setFeedback(''); setScore(null);
    setRunning(true); setPhase('write');
  };

  const saveEssay = () => {
    const e: Essay = { id:Date.now().toString(), topic, content, wordCount, date:new Date().toLocaleDateString('mr-IN') };
    saveEssays([e, ...essays]);
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  const evaluate = async () => {
    if (!content.trim() || wordCount < 50) return;
    setEvaluating(true);
    try {
      const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
        system: 'तू MPSC Mains essay examiner आहेस. मराठी essays evaluate कर.',
        messages: [{ role:'user', content:`MPSC Mains Essay Topic: "${topic}"\n\nStudent Essay (${wordCount} words):\n"${content.slice(0,1500)}"\n\nJSON मध्ये evaluate कर:\n{"score":75,"structure":"Structure comment","content":"Content quality","language":"Language quality","improvements":"Top 3 suggestions","overall":"1 line summary"}\n\nScore 0-100. मराठी मध्ये.` }],
        max_tokens: 400
      })});
      const data = await res.json();
      const match = data?.text?.match(/\{[\s\S]*\}/);
      if (match) {
        const r = JSON.parse(match[0]);
        setScore(r.score);
        setFeedback(`📊 Score: ${r.score}/100\n\n🏗️ Structure: ${r.structure}\n\n📝 Content: ${r.content}\n\n🗣️ Language: ${r.language}\n\n💡 Improvements:\n${r.improvements}\n\n✅ Overall: ${r.overall}`);
        setPhase('review');
      }
    } catch { setFeedback('Evaluation होऊ शकली नाही.'); }
    setEvaluating(false);
  };

  const fmt = (s:number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  if (phase === 'review') return (
    <div style={{minHeight:'100vh',background:'#F5F0E8',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",paddingBottom:60}}>
      <style>{CSS}</style>
      <div style={{background:'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(0,0,0,0.08)',padding:'12px 16px',position:'sticky',top:0,zIndex:50,display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>setPhase('write')} style={{background:'rgba(0,0,0,0.05)',border:'none',borderRadius:9,padding:'7px 10px',cursor:'pointer',color:'#7A9090',display:'flex'}}><ArrowLeft size={14}/></button>
        <div style={{flex:1,fontWeight:900,fontSize:14,color:'#1C2B2B'}}>AI Feedback</div>
        {score!==null&&<div style={{fontWeight:900,fontSize:16,color:score>=75?'#059669':score>=50?'#D97706':'#DC2626'}}>{score}/100</div>}
      </div>
      <div style={{maxWidth:560,margin:'0 auto',padding:'16px'}}>
        <div style={{background:'#fff',borderRadius:18,padding:'18px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:13,fontWeight:600,color:'#4A6060',lineHeight:1.85,whiteSpace:'pre-wrap'}}>{feedback}</div>
        </div>
        <button onClick={()=>{setPhase('list');}} style={{width:'100%',background:'linear-gradient(135deg,#E8671A,#C4510E)',border:'none',borderRadius:14,padding:'14px',color:'#fff',fontWeight:900,fontSize:14,cursor:'pointer',marginTop:16}}>
          नवीन Essay लिहा
        </button>
      </div>
    </div>
  );

  if (phase === 'write') return (
    <div style={{minHeight:'100vh',background:'#F5F0E8',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",paddingBottom:80,display:'flex',flexDirection:'column'}}>
      <style>{CSS}</style>
      <div style={{background:'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(0,0,0,0.08)',padding:'12px 16px',position:'sticky',top:0,zIndex:50,display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <button onClick={()=>{setRunning(false);setPhase('list');}} style={{background:'rgba(0,0,0,0.05)',border:'none',borderRadius:9,padding:'7px 10px',cursor:'pointer',color:'#7A9090',display:'flex'}}><ArrowLeft size={14}/></button>
        <div style={{flex:1}}>
          <div style={{fontWeight:900,fontSize:12,color:'#1C2B2B',lineHeight:1.3}}>{topic}</div>
          <div style={{fontSize:10,color:'#7A9090',fontWeight:700}}>{wordCount} words</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(0,0,0,0.05)',borderRadius:99,padding:'5px 12px'}}>
          <Clock size={12} style={{color:'#E8671A'}}/>
          <span style={{fontSize:12,fontWeight:900,color:'#E8671A'}}>{fmt(timer)}</span>
          <button onClick={()=>setRunning(r=>!r)} style={{background:'none',border:'none',cursor:'pointer',fontSize:12}}>
            {running?'⏸':'▶'}
          </button>
        </div>
      </div>
      <div style={{flex:1,maxWidth:680,margin:'0 auto',padding:'16px',width:'100%',display:'flex',flexDirection:'column'}}>
        <textarea value={content} onChange={e=>setContent(e.target.value)}
          placeholder={`"${topic}" या विषयावर निबंध लिहा...\n\nसुरुवात करा प्रस्तावनेने, मग मुख्य मुद्दे, शेवटी निष्कर्ष.`}
          style={{flex:1,width:'100%',minHeight:'60vh',background:'#fff',border:'1.5px solid rgba(0,0,0,0.1)',borderRadius:16,padding:'16px',fontSize:14,fontWeight:600,color:'#1C2B2B',boxSizing:'border-box',resize:'none',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",lineHeight:1.8,outline:'none'}}/>
        <div style={{display:'flex',gap:10,marginTop:12}}>
          <button onClick={saveEssay} style={{flex:1,background:saved?'rgba(5,150,105,0.1)':'rgba(0,0,0,0.06)',border:saved?'1px solid rgba(5,150,105,0.3)':'1px solid rgba(0,0,0,0.1)',borderRadius:13,padding:'12px',color:saved?'#059669':'#7A9090',fontWeight:800,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            {saved?<><Check size={14}/>Saved!</>:<><Save size={14}/>Save</>}
          </button>
          <button onClick={evaluate} disabled={evaluating||wordCount<50}
            style={{flex:2,background:wordCount>=50?'linear-gradient(135deg,#7C3AED,#6D28D9)':'rgba(0,0,0,0.1)',border:'none',borderRadius:13,padding:'12px',color:wordCount>=50?'#fff':'#A8A29E',fontWeight:900,fontSize:13,cursor:wordCount>=50?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
            {evaluating?<><div style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'em-spin 0.8s linear infinite'}}/> Evaluating...</>:<><Sparkles size={14}/>AI Evaluate करा</>}
          </button>
        </div>
        {wordCount<50&&<div style={{fontSize:10,fontWeight:600,color:'#A8A29E',textAlign:'center',marginTop:6}}>Evaluate साठी किमान 50 words लिहा ({50-wordCount} बाकी)</div>}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#F5F0E8',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",paddingBottom:60}}>
      <style>{CSS}</style>
      <div style={{background:'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(0,0,0,0.08)',padding:'12px 16px',position:'sticky',top:0,zIndex:50,display:'flex',alignItems:'center',gap:10}}>
        <button onClick={onBack} style={{background:'rgba(0,0,0,0.05)',border:'none',borderRadius:9,padding:'7px 10px',cursor:'pointer',color:'#7A9090',display:'flex'}}><ArrowLeft size={14}/></button>
        <div style={{flex:1,fontWeight:900,fontSize:15,color:'#1C2B2B',display:'flex',alignItems:'center',gap:6}}><PenLine size={16} style={{color:'#7C3AED'}}/>Essay Mode</div>
      </div>
      <div style={{maxWidth:560,margin:'0 auto',padding:'16px'}}>
        <div style={{fontWeight:800,fontSize:11,color:'#7A9090',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>Topic निवडा किंवा स्वतः लिहा</div>
        <div style={{background:'#fff',borderRadius:14,padding:'10px 14px',marginBottom:14,border:'1.5px solid rgba(0,0,0,0.1)'}}>
          <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Custom topic..."
            style={{width:'100%',border:'none',fontSize:13,fontWeight:600,color:'#1C2B2B',outline:'none',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif"}}/>
        </div>
        {topic.trim()&&<button onClick={()=>startEssay(topic)} style={{width:'100%',background:'linear-gradient(135deg,#7C3AED,#6D28D9)',border:'none',borderRadius:13,padding:'13px',color:'#fff',fontWeight:900,fontSize:14,cursor:'pointer',marginBottom:16}}>
          ✍️ लिहायला सुरू करा
        </button>}
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
          {TOPICS.map(t=>(
            <button key={t} onClick={()=>startEssay(t)} style={{background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:13,padding:'13px 16px',fontSize:13,fontWeight:700,color:'#1C2B2B',textAlign:'left',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
              {t} <span style={{color:'#7C3AED',fontSize:16}}>→</span>
            </button>
          ))}
        </div>
        {essays.length>0&&(
          <>
            <div style={{fontWeight:800,fontSize:11,color:'#7A9090',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>जुने Essays ({essays.length})</div>
            {essays.slice(0,5).map(e=>(
              <div key={e.id} style={{background:'#fff',borderRadius:13,padding:'12px 14px',marginBottom:8,boxShadow:'0 1px 6px rgba(0,0,0,0.05)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:800,fontSize:12,color:'#1C2B2B'}}>{e.topic.slice(0,45)}...</div>
                  <div style={{fontSize:10,fontWeight:600,color:'#7A9090',marginTop:2}}>{e.wordCount} words · {e.date}</div>
                </div>
                <button onClick={()=>{setTopic(e.topic);setContent(e.content);setPhase('write');setTimer(0);setRunning(false);}}
                  style={{background:'rgba(124,58,237,0.08)',border:'none',borderRadius:9,padding:'6px 12px',color:'#7C3AED',fontWeight:700,fontSize:11,cursor:'pointer'}}>Edit</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

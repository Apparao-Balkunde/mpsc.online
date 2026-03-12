cat > /home/ubuntu/mpsc.online/components/AIDoubtSolver.tsx << 'EOF'
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Trash2 } from 'lucide-react';

const SYSTEM_PROMPT = `तू MPSC सारथी चा AI assistant आहेस. फक्त MPSC, राज्यसेवा, PSI, STI, ASO परीक्षांशी संबंधित प्रश्नांची उत्तरे दे. मराठी मध्ये उत्तर दे. Non-MPSC प्रश्नांना नम्रपणे नकार दे.`;

const CHIPS = ['MPSC syllabus काय आहे?','Rajyaseva pattern सांग','PSI साठी eligibility?','Current Affairs कसा अभ्यास करावा?','मराठी व्याकरण tips','GS preparation strategy'];

interface Msg { role:'user'|'assistant'; content:string; }

export const AIDoubtSolver: React.FC = () => {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState<Msg[]>([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef  = useRef<AbortController | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, loading]);
  useEffect(() => { if (open) setUnread(0); }, [open]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role:'user', content:text };
    const history = [...msgs, userMsg];
    setMsgs(history); setInput(''); setLoading(true);
    abortRef.current = new AbortController();
    try {
      const res = await fetch('/api/ai', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ system: SYSTEM_PROMPT, messages: history, max_tokens: 400 }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      const reply = data?.text || 'माफ करा, उत्तर मिळाले नाही.';
      setMsgs([...history, { role:'assistant', content:reply }]);
      if (!open) setUnread(u => u+1);
    } catch(e:any) {
      if (e.name !== 'AbortError') setMsgs([...history, { role:'assistant', content:'Error आला. पुन्हा प्रयत्न करा.' }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(o => !o)}
        style={{ position:'fixed', bottom:24, right:24, zIndex:150, width:54, height:54, borderRadius:'50%', background:'linear-gradient(135deg,#F97316,#EF4444)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(249,115,22,0.45)' }}>
        <Sparkles size={22} color="#fff" />
        {unread > 0 && <div style={{ position:'absolute', top:-4, right:-4, width:18, height:18, borderRadius:'50%', background:'#EF4444', fontSize:10, fontWeight:900, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>{unread}</div>}
      </button>

      {open && (
        <div style={{ position:'fixed', bottom:88, right:24, zIndex:150, width:360, maxWidth:'calc(100vw - 48px)', background:'#0F1623', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, display:'flex', flexDirection:'column', maxHeight:520, overflow:'hidden', fontFamily:"'Poppins','Noto Sans Devanagari',sans-serif", color:'#fff', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:'rgba(249,115,22,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Sparkles size={15} style={{ color:'#F97316' }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:900, fontSize:13 }}>AI Doubt Solver</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:600 }}>MPSC तज्ज्ञ · Groq Free</div>
            </div>
            {msgs.length > 0 && (
              <button onClick={() => { if(window.confirm('Chat clear करायचा?')) setMsgs([]); }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', display:'flex' }}>
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', display:'flex' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'14px 14px 8px' }}>
            {msgs.length === 0 && (
              <div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', fontWeight:700, marginBottom:10, textAlign:'center' }}>MPSC बद्दल काहीही विचारा 👇</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {CHIPS.map(c => (
                    <button key={c} onClick={() => send(c)}
                      style={{ fontSize:10, fontWeight:700, padding:'6px 10px', borderRadius:99, background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.25)', color:'#FB923C', cursor:'pointer' }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m,i) => (
              <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start', marginBottom:10 }}>
                <div style={{ maxWidth:'82%', padding:'9px 13px', borderRadius: m.role==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.role==='user' ? 'linear-gradient(135deg,#F97316,#EF4444)' : 'rgba(255,255,255,0.07)', fontSize:12, fontWeight:600, lineHeight:1.7, color:'#fff' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex', gap:5, padding:'8px 12px' }}>
                {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#F97316', animation:`bounce 0.8s ease ${i*0.15}s infinite` }} />)}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding:'10px 14px 14px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:8 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && send(input)}
              placeholder="प्रश्न विचारा..."
              style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'10px 14px', color:'#fff', fontSize:12, fontWeight:600, outline:'none' }} />
            <button onClick={() => send(input)} disabled={loading || !input.trim()}
              style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#F97316,#EF4444)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: loading||!input.trim() ? 0.5 : 1 }}>
              <Send size={15} color="#fff" />
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </>
  );
};
EOF
echo "AIDoubtSolver done!"

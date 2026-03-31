import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';

export const AIDoubtSolver: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    if (!input.trim()) return;
    setMsgs([...msgs, { role: 'user', content: input }]);
    setInput('');
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, width: 54, height: 54, borderRadius: '50%', background: '#F97316', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Sparkles size={22} color="#fff" />
      </button>

      {open && (
        <div style={{ position: 'fixed', bottom: 88, right: 24, zIndex: 100, width: 350, background: '#0F1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, display: 'flex', flexDirection: 'column', height: 450, overflow: 'hidden', color: '#fff' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>AI Doubt Solver</span>
            <X size={20} onClick={() => setOpen(false)} style={{ cursor: 'pointer' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ textAlign: m.role === 'user' ? 'right' : 'left', marginBottom: 10 }}>
                <div style={{ display: 'inline-block', padding: '10px', borderRadius: 12, background: m.role === 'user' ? '#F97316' : '#1E293B', fontSize: '13px' }}>{m.content}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 10 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ flex: 1, background: '#1E293B', border: 'none', padding: '10px', borderRadius: 10, color: '#fff' }} placeholder="विचारा..." />
            <button onClick={send} style={{ background: '#F97316', border: 'none', padding: '10px', borderRadius: 10 }}><Send size={18} color="#fff" /></button>
          </div>
        </div>
      )}
    </>
  );
};

cat > /home/ubuntu/mpsc.online/components/AIExplainer.tsx << 'EOF'
import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, RefreshCcw, Loader2 } from 'lucide-react';
import type { Question } from '../types';

interface Props { item: Question; onClose: () => void; }

export const AIExplainer: React.FC<Props> = ({ item, onClose }) => {
  const [text, setText]       = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const explain = async () => {
    setLoading(true); setText(''); setError('');
    abortRef.current = new AbortController();
    const opts = Array.isArray(item.options) ? item.options : Object.values(item.options || {});
    const correct = opts[item.correct_answer_index] || '';
    const prompt = `MPSC प्रश्न: ${item.question}\nपर्याय: ${opts.map((o,i)=>`${i+1}. ${o}`).join(', ')}\nबरोबर उत्तर: ${correct}\n\n## heading वापरून 4 sections मध्ये उत्तर दे:\n## मुख्य संकल्पना\n## सोपी भाषा\n## उदाहरण\n## परीक्षेत लक्षात ठेवा\n\nमराठी मध्ये, short sentences, plain text, max 150 words.`;
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], max_tokens: 600 }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      const t = data?.text || '';
      if (!t) throw new Error('empty');
      setText(t);
    } catch (e: any) {
      if (e.name !== 'AbortError') setError('AI उपलब्ध नाही. पुन्हा प्रयत्न करा.');
    } finally { setLoading(false); }
  };

  useEffect(() => { explain(); return () => abortRef.current?.abort(); }, []);

  const opts = Array.isArray(item.options) ? item.options : Object.values(item.options || {});

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(10px)', display:'flex', alignItems:'flex-end', justifyContent:'center', fontFamily:"'Poppins','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#0F1623', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'28px 28px 0 0', width:'100%', maxWidth:640, maxHeight:'88vh', display:'flex', flexDirection:'column', color:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:34, height:34, borderRadius:11, background:'rgba(139,92,246,0.2)', border:'1px solid rgba(139,92,246,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Sparkles size={16} style={{ color:'#A78BFA' }} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:14 }}>AI स्पष्टीकरण</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:600 }}>Powered by Groq · Llama 3.3 70B</div>
          </div>
          <button onClick={() => explain()} disabled={loading} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, padding:'6px', cursor:'pointer', color:'rgba(255,255,255,0.4)', display:'flex' }}>
            <RefreshCcw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, padding:'6px', cursor:'pointer', color:'rgba(255,255,255,0.4)', display:'flex' }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 24px' }}>
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:14, padding:'12px 14px', marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>प्रश्न:</div>
            <div style={{ fontSize:13, fontWeight:700, lineHeight:1.6, marginBottom:10 }}>{item.question}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {opts.map((o,i) => (
                <div key={i} style={{ fontSize:12, padding:'6px 10px', borderRadius:8, background: i===item.correct_answer_index ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', border: i===item.correct_answer_index ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)', color: i===item.correct_answer_index ? '#34D399' : 'rgba(255,255,255,0.55)', fontWeight: i===item.correct_answer_index ? 800 : 500 }}>
                  {i+1}. {String(o)}
                </div>
              ))}
            </div>
          </div>
          {loading && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'20px 0', color:'rgba(255,255,255,0.4)' }}>
              <Loader2 size={18} style={{ animation:'spin 0.8s linear infinite', color:'#A78BFA' }} />
              <span style={{ fontSize:13, fontWeight:700 }}>AI विश्लेषण करत आहे...</span>
            </div>
          )}
          {error && <div style={{ color:'#EF4444', fontSize:13, fontWeight:700, padding:'16px 0' }}>{error}</div>}
          {text && (
            <div style={{ fontSize:13, lineHeight:1.9, color:'rgba(255,255,255,0.8)' }}>
              {text.split('\n').map((line,i) => line.startsWith('##')
                ? <div key={i} style={{ fontWeight:900, fontSize:13, color:'#A78BFA', marginTop:14, marginBottom:4 }}>{line.replace('##','').trim()}</div>
                : <div key={i}>{line}</div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};
EOF
echo "AIExplainer done!"

import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Copy, Check, Loader, Brain } from 'lucide-react';

interface Props { onBack: () => void; }
const TOPICS = ['मूलभूत हक्क','पंचवार्षिक योजना','महाराष्ट्र विभाग','नद्या','राज्यघटना कलमे','VIBGYOR रंग','ग्रह क्रम','वायू वर्गीकरण'];
const CSS = `@keyframes mn-spin{to{transform:rotate(360deg)}} @keyframes mn-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes mn-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}`;

export const MnemonicGenerator: React.FC<Props> = ({ onBack }) => {
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generate = async (t?: string) => {
    const src = t || topic; if (!src.trim()) { setError('Topic टाका!'); return; }
    setLoading(true); setError(''); setResult('');
    try {
      const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
        system:'तू MPSC exam memory expert आहेस. मराठी मध्ये creative mnemonics बनव जे students ला topics लक्षात राहतील.',
        messages:[{ role:'user', content:`"${src}" साठी खालील format मध्ये mnemonic बनव:\n\n1. **Acronym/Short Formula** — पहिल्या अक्षरांचे word\n2. **Story Method** — एक छोटी मजेदार story\n3. **Visual Hook** — डोळ्यासमोर येईल असे काहीतरी\n4. **Practice Tip** — लक्षात ठेवण्याचा उपाय\n\nमराठी मध्ये, creative आणि MPSC relevant.` }],
        max_tokens: 500 }) });
      const data = await res.json();
      setResult(data?.text?.trim() || '');
    } catch { setError('Generate होऊ शकले नाही!'); }
    finally { setLoading(false); }
  };

  const copy = () => { navigator.clipboard.writeText(result).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}><Brain size={16} style={{color:'#7C3AED'}}/> Mnemonic Generator</div>
      </div>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ background:'#fff', borderRadius:20, padding:'20px', marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#7C3AED,#E8671A)', backgroundSize:'200%', animation:'mn-shimmer 3s linear infinite' }}/>
          <textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Topic टाका... उदा: मूलभूत हक्क, पंचवार्षिक योजना" rows={2}
            style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'12px', fontSize:13, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', marginBottom:12, resize:'none', fontFamily:"'Baloo 2',sans-serif", outline:'none' }}/>
          <button onClick={()=>generate()} disabled={loading}
            style={{ width:'100%', background:'linear-gradient(135deg,#7C3AED,#6D28D9)', border:'none', borderRadius:12, padding:'13px', color:'#fff', fontWeight:900, fontSize:14, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:loading?0.8:1 }}>
            {loading?<><div style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'mn-spin 0.8s linear infinite'}}/> बनवत आहे...</>:<><Sparkles size={15}/> Mnemonic बनवा</>}
          </button>
          {error && <div style={{ marginTop:10, fontSize:12, color:'#DC2626', fontWeight:700 }}>⚠️ {error}</div>}
        </div>

        {/* Quick topics */}
        <div style={{ fontWeight:800, fontSize:11, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Quick Topics</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:16 }}>
          {TOPICS.map(t => <button key={t} onClick={()=>{setTopic(t);generate(t);}} style={{ padding:'6px 12px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', border:'1px solid rgba(124,58,237,0.2)', background:'rgba(124,58,237,0.07)', color:'#7C3AED' }}>{t}</button>)}
        </div>

        {result && (
          <div style={{ background:'#fff', borderRadius:18, padding:'18px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', animation:'mn-fade 0.3s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B' }}>🧠 Mnemonic तयार!</div>
              <button onClick={copy} style={{ display:'flex', alignItems:'center', gap:5, background:copied?'rgba(5,150,105,0.1)':'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'5px 10px', cursor:'pointer', fontSize:11, fontWeight:700, color:copied?'#059669':'#7A9090' }}>
                {copied?<><Check size={11}/>Copied!</>:<><Copy size={11}/>Copy</>}
              </button>
            </div>
            <p style={{ fontSize:13, fontWeight:600, color:'#4A6060', lineHeight:1.85, margin:0, whiteSpace:'pre-wrap' }}>{result}</p>
          </div>
        )}
      </div>
    </div>
  );
};

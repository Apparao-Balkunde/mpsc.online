import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Loader, BookOpen, Copy, Check } from 'lucide-react';

interface Props { onBack: () => void; }
const EXAMPLES = ['लोकशाही म्हणजे काय?','GDP आणि GNP मधला फरक','Photosynthesis कसे होते?','संसदीय प्रणाली म्हणजे काय?','Inflation कसे होते?'];
const CSS = `@keyframes ce-spin{to{transform:rotate(360deg)}} @keyframes ce-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes ce-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}`;

export const ConceptExplainer: React.FC<Props> = ({ onBack }) => {
  const [query, setQuery]   = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError]   = useState('');

  const explain = async (q?: string) => {
    const src = q || query; if (!src.trim()) { setError('Topic टाका!'); return; }
    setLoading(true); setError(''); setResult('');
    try {
      const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        system:'तू MPSC exam teacher आहेस. Simple मराठी भाषेत concepts explain कर.',
        messages:[{role:'user', content:`"${src}" हे concept MPSC student ला explain कर:\n\n**Simple Explanation** (2-3 lines)\n**Key Points** (bullet points)\n**MPSC साठी Important** (काय लक्षात ठेवायचे)\n**Example** (real world उदाहरण)\n\nमराठी मध्ये, simple आणि clear.`}],
        max_tokens:500 }) });
      const data = await res.json();
      setResult(data?.text?.trim() || '');
    } catch { setError('Explain होऊ शकले नाही!'); }
    finally { setLoading(false); }
  };

  const copy = () => { navigator.clipboard.writeText(result).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}><BookOpen size={16} style={{color:'#2563EB'}}/> Concept Explainer</div>
      </div>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ background:'#fff', borderRadius:20, padding:'20px', marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#2563EB,#7C3AED)', backgroundSize:'200%', animation:'ce-shimmer 3s linear infinite' }}/>
          <textarea value={query} onChange={e=>setQuery(e.target.value)} placeholder="Topic किंवा question लिहा... उदा: GDP म्हणजे काय?" rows={2}
            style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'12px', fontSize:13, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', marginBottom:12, resize:'none', fontFamily:"'Baloo 2',sans-serif", outline:'none' }}/>
          <button onClick={()=>explain()} disabled={loading}
            style={{ width:'100%', background:'linear-gradient(135deg,#2563EB,#1D4ED8)', border:'none', borderRadius:12, padding:'13px', color:'#fff', fontWeight:900, fontSize:14, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:loading?0.8:1 }}>
            {loading?<><div style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'ce-spin 0.8s linear infinite'}}/> Explaining...</>:<><Sparkles size={15}/> Explain करा</>}
          </button>
          {error && <div style={{ marginTop:10, fontSize:12, color:'#DC2626', fontWeight:700 }}>⚠️ {error}</div>}
        </div>

        <div style={{ fontWeight:800, fontSize:11, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Examples</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:16 }}>
          {EXAMPLES.map(e => <button key={e} onClick={()=>{setQuery(e);explain(e);}} style={{ padding:'6px 12px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', border:'1px solid rgba(37,99,235,0.2)', background:'rgba(37,99,235,0.07)', color:'#2563EB' }}>{e}</button>)}
        </div>

        {result && (
          <div style={{ background:'#fff', borderRadius:18, padding:'18px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', animation:'ce-fade 0.3s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B' }}>📖 Explanation</div>
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

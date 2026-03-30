import React, { useState } from 'react';
import { ArrowLeft, Languages, Loader, Copy, Check, RotateCcw } from 'lucide-react';

interface Props { onBack: () => void; }

const CSS = `
  @keyframes mt-spin { to{transform:rotate(360deg)} }
  @keyframes mt-fade { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
  @keyframes mt-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  textarea:focus { outline:none; border-color:#7C3AED !important; }
`;

const EXAMPLES = [
  'The Governor of a state is appointed by the President of India.',
  'Which of the following is NOT a Fundamental Right?',
  'The Preamble to the Indian Constitution was amended in the year 1976.',
  'What is the minimum age required to become the President of India?',
];

export const AIMarathiTranslator: React.FC<Props> = ({ onBack }) => {
  const [input, setInput]       = useState('');
  const [output, setOutput]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [error, setError]       = useState('');
  const [mode, setMode]         = useState<'en-mr'|'mr-en'>('en-mr');

  const translate = async (text?: string) => {
    const src = text || input;
    if (!src.trim()) { setError('Text टाका!'); return; }
    setLoading(true); setError(''); setOutput('');

    const prompt = mode === 'en-mr'
      ? `खालील English MPSC question/text चे मराठी मध्ये अचूक भाषांतर कर. फक्त मराठी भाषांतर दे, बाकी काही नाही:\n\n${src}`
      : `खालील मराठी MPSC question/text चे English मध्ये अचूक translation कर. फक्त English translation दे, बाकी काही नाही:\n\n${src}`;

    try {
      const res = await fetch('/api/ai', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          system: 'You are an expert MPSC exam translator. Translate accurately maintaining technical terms.',
          messages:[{role:'user', content:prompt}],
          max_tokens:500
        })
      });
      const data = await res.json();
      setOutput(data?.text?.trim() || '');
    } catch { setError('Translation होऊ शकले नाही. पुन्हा try करा!'); }
    finally { setLoading(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(output).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
          <Languages size={16} style={{color:'#7C3AED'}}/> AI Translator
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px' }}>
        {/* Mode toggle */}
        <div style={{ display:'flex', background:'#fff', borderRadius:14, padding:4, marginBottom:18, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          {([['en-mr','English → मराठी'],['mr-en','मराठी → English']] as const).map(([m,l]) => (
            <button key={m} onClick={()=>setMode(m)}
              style={{ flex:1, padding:'10px', borderRadius:11, fontWeight:800, fontSize:12, cursor:'pointer', border:'none', background:mode===m?'linear-gradient(135deg,#7C3AED,#6D28D9)':'transparent', color:mode===m?'#fff':'#7A9090', transition:'all 0.2s' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ background:'#fff', borderRadius:18, padding:'16px', marginBottom:14, boxShadow:'0 2px 10px rgba(0,0,0,0.06)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#7C3AED,#E8671A)', backgroundSize:'200%', animation:'mt-shimmer 3s linear infinite' }}/>
          <div style={{ fontSize:10, fontWeight:800, color:'#7C3AED', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
            {mode==='en-mr'?'English Input':'मराठी Input'}
          </div>
          <textarea value={input} onChange={e=>setInput(e.target.value)} rows={4}
            placeholder={mode==='en-mr'?'English text/question इथे paste करा...':'मराठी text/question इथे paste करा...'}
            style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'12px', fontSize:13, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', resize:'vertical', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", lineHeight:1.7, transition:'border 0.2s' }}/>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10 }}>
            <button onClick={()=>translate()} disabled={loading}
              style={{ background:'linear-gradient(135deg,#7C3AED,#6D28D9)', border:'none', borderRadius:11, padding:'10px 20px', color:'#fff', fontWeight:900, fontSize:13, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:7, opacity:loading?0.8:1 }}>
              {loading ? <><div style={{ width:15, height:15, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'mt-spin 0.8s linear infinite' }}/> Translating...</> : <><Languages size={14}/> Translate</>}
            </button>
          </div>
        </div>

        {/* Output */}
        {output && (
          <div style={{ background:'#fff', borderRadius:18, padding:'16px', marginBottom:16, boxShadow:'0 2px 10px rgba(0,0,0,0.06)', animation:'mt-fade 0.3s ease', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:mode==='en-mr'?'linear-gradient(90deg,#059669,#10B981)':'linear-gradient(90deg,#2563EB,#3B82F6)' }}/>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:800, color:mode==='en-mr'?'#059669':'#2563EB', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                {mode==='en-mr'?'मराठी Output':'English Output'}
              </div>
              <button onClick={copy} style={{ display:'flex', alignItems:'center', gap:5, background:copied?'rgba(5,150,105,0.1)':'rgba(0,0,0,0.05)', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer', fontSize:11, fontWeight:700, color:copied?'#059669':'#7A9090' }}>
                {copied?<><Check size={12}/> Copied!</>:<><Copy size={12}/> Copy</>}
              </button>
            </div>
            <p style={{ fontSize:14, fontWeight:700, color:'#1C2B2B', lineHeight:1.8, margin:0, whiteSpace:'pre-wrap' }}>{output}</p>
          </div>
        )}

        {error && <div style={{ background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:12, padding:'12px', fontSize:12, color:'#DC2626', fontWeight:700, marginBottom:14 }}>⚠️ {error}</div>}

        {/* Examples */}
        <div style={{ fontWeight:800, fontSize:11, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Examples</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={()=>{setInput(ex); setMode('en-mr'); translate(ex);}}
              style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.08)', borderRadius:12, padding:'12px 14px', fontSize:12, fontWeight:600, color:'#4A6060', textAlign:'left', cursor:'pointer', transition:'all 0.15s', lineHeight:1.5 }}>
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

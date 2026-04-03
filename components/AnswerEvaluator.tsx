import React, { useState } from 'react';
import { ArrowLeft, CheckSquare, Loader, Star, AlertCircle } from 'lucide-react';

interface Props { onBack: () => void; }
const CSS = `@keyframes ae-spin{to{transform:rotate(360deg)}} @keyframes ae-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes ae-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}`;

export const AnswerEvaluator: React.FC<Props> = ({ onBack }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer]     = useState('');
  const [result, setResult]     = useState<{score:number;feedback:string;strengths:string;improvements:string}|null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const evaluate = async () => {
    if (!question.trim() || !answer.trim()) { setError('Question आणि Answer दोन्ही टाका!'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        system:'तू MPSC examiner आहेस. Long answer type questions evaluate करतो.',
        messages:[{role:'user', content:`MPSC Question: "${question}"\n\nStudent Answer: "${answer}"\n\nJSON format मध्ये evaluate कर — फक्त JSON:\n{"score":75,"feedback":"Overall assessment","strengths":"काय चांगले आहे","improvements":"काय सुधारायला हवे"}\n\nScore 0-100 मध्ये. मराठी मध्ये.`}],
        max_tokens:400 }) });
      const data = await res.json();
      const match = data?.text?.match(/\{[\s\S]*\}/);
      if (match) setResult(JSON.parse(match[0]));
      else throw new Error('no json');
    } catch { setError('Evaluate होऊ शकले नाही!'); }
    finally { setLoading(false); }
  };

  const scoreColor = (s:number) => s>=75?'#059669':s>=50?'#D97706':'#DC2626';

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}><CheckSquare size={16} style={{color:'#059669'}}/> Answer Evaluator</div>
      </div>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ background:'#fff', borderRadius:20, padding:'20px', marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#059669,#2563EB)', backgroundSize:'200%', animation:'ae-shimmer 3s linear infinite' }}/>
          <div style={{ fontSize:11, fontWeight:800, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Question</div>
          <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="MPSC question इथे लिहा..." rows={2}
            style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'12px', fontSize:13, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', marginBottom:14, resize:'vertical', fontFamily:"'Baloo 2',sans-serif", outline:'none' }}/>
          <div style={{ fontSize:11, fontWeight:800, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>तुमचे Answer</div>
          <textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="तुमचे उत्तर इथे लिहा... (long answer)" rows={5}
            style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'12px', fontSize:13, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', marginBottom:14, resize:'vertical', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", outline:'none' }}/>
          <button onClick={evaluate} disabled={loading}
            style={{ width:'100%', background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:12, padding:'13px', color:'#fff', fontWeight:900, fontSize:14, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:loading?0.8:1 }}>
            {loading?<><div style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'ae-spin 0.8s linear infinite'}}/> Evaluating...</>:<><CheckSquare size={15}/> Evaluate करा</>}
          </button>
          {error && <div style={{ marginTop:10, fontSize:12, color:'#DC2626', fontWeight:700 }}>⚠️ {error}</div>}
        </div>

        {result && (
          <div style={{ display:'flex', flexDirection:'column', gap:12, animation:'ae-fade 0.3s ease' }}>
            {/* Score */}
            <div style={{ background:'#fff', borderRadius:18, padding:'20px', textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid ${scoreColor(result.score)}` }}>
              <div style={{ fontWeight:900, fontSize:48, color:scoreColor(result.score), letterSpacing:'-0.05em', marginBottom:4 }}>{result.score}</div>
              <div style={{ fontSize:12, fontWeight:700, color:'#7A9090' }}>/ 100 marks</div>
              <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:8, margin:'12px 0 8px', overflow:'hidden' }}>
                <div style={{ height:'100%', background:scoreColor(result.score), borderRadius:99, width:`${result.score}%`, transition:'width 1s ease' }}/>
              </div>
              <p style={{ fontSize:13, fontWeight:600, color:'#4A6060', margin:0, lineHeight:1.65 }}>{result.feedback}</p>
            </div>

            {/* Strengths */}
            <div style={{ background:'rgba(5,150,105,0.06)', border:'1px solid rgba(5,150,105,0.2)', borderRadius:14, padding:'14px' }}>
              <div style={{ fontWeight:800, fontSize:11, color:'#059669', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>✅ Strengths</div>
              <p style={{ fontSize:12, fontWeight:600, color:'#4A6060', margin:0, lineHeight:1.65 }}>{result.strengths}</p>
            </div>

            {/* Improvements */}
            <div style={{ background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:14, padding:'14px' }}>
              <div style={{ fontWeight:800, fontSize:11, color:'#DC2626', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>💡 Improvements</div>
              <p style={{ fontSize:12, fontWeight:600, color:'#4A6060', margin:0, lineHeight:1.65 }}>{result.improvements}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

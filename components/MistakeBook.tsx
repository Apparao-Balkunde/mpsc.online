import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookMarked, Trash2, RefreshCw, ChevronDown, ChevronUp, Brain, TrendingUp } from 'lucide-react';
import { updateProgress } from '../App';

interface Props { onBack: () => void; }
interface Mistake { id:string; question:string; options:string[]; correct_answer_index:number; explanation:string; subject:string; wrongAnswer:number; addedAt:string; revisedCount:number; lastRevised?:string; }

const KEY = 'mpsc_mistake_book';
const CSS = `
  @keyframes mb-fade { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
  @keyframes mb-pop  { 0%{transform:scale(0.8)}60%{transform:scale(1.1)}100%{transform:scale(1)} }
  @keyframes mb-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
`;

// Export for use in QuestionView
export function addToMistakeBook(q: Omit<Mistake,'id'|'addedAt'|'revisedCount'>) {
  try {
    const all: Mistake[] = JSON.parse(localStorage.getItem(KEY)||'[]');
    if (all.find(m=>m.question===q.question)) return; // no duplicates
    all.unshift({ ...q, id:Date.now().toString(), addedAt:new Date().toLocaleDateString('mr-IN'), revisedCount:0 });
    localStorage.setItem(KEY, JSON.stringify(all.slice(0,200))); // max 200
  } catch {}
}

export const MistakeBook: React.FC<Props> = ({ onBack }) => {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [mode, setMode]         = useState<'list'|'revise'>('list');
  const [filter, setFilter]     = useState('सर्व');
  const [expanded, setExpanded] = useState<string|null>(null);
  const [revIdx, setRevIdx]     = useState(0);
  const [revAns, setRevAns]     = useState<number|null>(null);
  const [revScore, setRevScore] = useState({ correct:0, total:0 });

  const subjects = ['सर्व', ...Array.from(new Set(mistakes.map(m=>m.subject).filter(Boolean)))];

  useEffect(() => {
    try { setMistakes(JSON.parse(localStorage.getItem(KEY)||'[]')); } catch {}
  }, []);

  const save = (data: Mistake[]) => { setMistakes(data); localStorage.setItem(KEY, JSON.stringify(data)); };

  const remove = (id: string) => {
    if (!window.confirm('हे question काढायचे?')) return;
    save(mistakes.filter(m=>m.id!==id));
  };

  const filtered = mistakes.filter(m => filter==='सर्व' || m.subject===filter);
  const pending   = mistakes.filter(m => !m.lastRevised || new Date(m.addedAt)<new Date(m.lastRevised)).length;

  // Revision mode
  const revMistakes = filtered.slice(0,20); // revise max 20 at a time
  const revQ = revMistakes[revIdx];

  const handleRevAns = (i: number) => {
    if (revAns!==null) return;
    setRevAns(i);
    const correct = i === revQ?.correct_answer_index;
    updateProgress(1, correct?1:0);
    setRevScore(s=>({correct:s.correct+(correct?1:0),total:s.total+1}));
    // Mark as revised
    const updated = mistakes.map(m => m.id===revQ?.id ? {...m, revisedCount:m.revisedCount+1, lastRevised:new Date().toISOString()} : m);
    save(updated);
    setTimeout(()=>{
      setRevAns(null);
      if (revIdx+1>=revMistakes.length) { setMode('list'); setRevIdx(0); setRevScore({correct:0,total:0}); }
      else setRevIdx(r=>r+1);
    }, 1400);
  };

  if (mode==='revise' && revQ) return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0F1117,#1A0827)',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",color:'#fff',paddingBottom:40}}>
      <style>{CSS}</style>
      <div style={{padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>{setMode('list');setRevIdx(0);setRevAns(null);}} style={{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:9,padding:'8px 10px',cursor:'pointer',color:'#fff',display:'flex'}}><ArrowLeft size={14}/></button>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:99,height:5,overflow:'hidden'}}>
          <div style={{height:'100%',background:'linear-gradient(90deg,#8B5CF6,#EC4899)',borderRadius:99,width:`${((revIdx)/revMistakes.length)*100}%`,transition:'width 0.4s'}}/>
        </div>
        <span style={{fontSize:12,fontWeight:900,color:'rgba(255,255,255,0.7)'}}>{revIdx+1}/{revMistakes.length}</span>
        <span style={{fontSize:12,fontWeight:900,color:'#10B981',background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:99,padding:'4px 10px'}}>{revScore.correct}✓</span>
      </div>
      <div style={{maxWidth:520,margin:'0 auto',padding:'10px 16px'}}>
        <div style={{background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.25)',borderRadius:10,padding:'6px 12px',marginBottom:12,fontSize:10,fontWeight:800,color:'#A78BFA',display:'flex',alignItems:'center',gap:6}}>
          <Brain size={12}/> Mistake Book Revision · {revQ.subject}
        </div>
        <div style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'22px 18px',marginBottom:14,animation:'mb-fade 0.25s ease'}}>
          <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.4)',marginBottom:8}}>⚠️ गेल्यावेळी चुकले होते</div>
          <p style={{fontWeight:700,fontSize:'clamp(0.95rem,4vw,1.1rem)',lineHeight:1.7,color:'#fff',margin:0}}>{revQ.question}</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:9}}>
          {revQ.options?.map((opt,i)=>{
            const isSel=revAns===i, isAns=i===revQ.correct_answer_index;
            let bg='rgba(255,255,255,0.05)', border='rgba(255,255,255,0.1)', color='#fff';
            if (revAns!==null&&isAns) { bg='rgba(16,185,129,0.2)'; border='rgba(16,185,129,0.5)'; }
            if (revAns!==null&&isSel&&!isAns) { bg='rgba(220,38,38,0.2)'; border='rgba(220,38,38,0.5)'; }
            if (revAns!==null&&!isSel&&!isAns){ color='rgba(255,255,255,0.3)'; }
            return (
              <button key={i} disabled={revAns!==null} onClick={()=>handleRevAns(i)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'13px 15px',borderRadius:14,border:`1.5px solid ${border}`,background:bg,color,fontWeight:700,fontSize:13,textAlign:'left',cursor:revAns!==null?'default':'pointer',transition:'all 0.2s'}}>
                <span style={{width:26,height:26,borderRadius:8,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,background:'rgba(255,255,255,0.1)'}}>{revAns!==null&&isAns?'✓':revAns!==null&&isSel&&!isAns?'✗':String.fromCharCode(65+i)}</span>
                <span style={{flex:1}}>{opt}</span>
              </button>
            );
          })}
        </div>
        {revAns!==null && revQ.explanation && (
          <div style={{background:'rgba(139,92,246,0.08)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:14,padding:'12px',marginTop:12,fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.7)',lineHeight:1.65}}>
            💡 {revQ.explanation}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#F5F0E8',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",paddingBottom:60}}>
      <style>{CSS}</style>
      {/* Header */}
      <div style={{background:'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(0,0,0,0.08)',padding:'12px 16px',position:'sticky',top:0,zIndex:50,boxShadow:'0 2px 12px rgba(0,0,0,0.06)',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={onBack} style={{background:'rgba(0,0,0,0.05)',border:'none',borderRadius:9,padding:'7px 10px',cursor:'pointer',color:'#7A9090',display:'flex'}}><ArrowLeft size={14}/></button>
        <div style={{flex:1,fontWeight:900,fontSize:15,color:'#1C2B2B',display:'flex',alignItems:'center',gap:6}}><BookMarked size={16} style={{color:'#8B5CF6'}}/>Mistake Book</div>
        <span style={{fontSize:11,fontWeight:800,color:'#8B5CF6',background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:99,padding:'4px 10px'}}>{mistakes.length} saved</span>
      </div>

      <div style={{maxWidth:560,margin:'0 auto',padding:'16px'}}>
        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
          {[{l:'एकूण Mistakes',v:mistakes.length,c:'#DC2626',e:'❌'},{l:'Revised',v:mistakes.filter(m=>m.revisedCount>0).length,c:'#059669',e:'✅'},{l:'Pending',v:mistakes.filter(m=>!m.revisedCount).length,c:'#D97706',e:'⏳'}].map(({l,v,c,e})=>(
            <div key={l} style={{background:'#fff',border:`1px solid ${c}20`,borderRadius:14,padding:'12px',textAlign:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
              <div style={{fontSize:20,marginBottom:3}}>{e}</div>
              <div style={{fontWeight:900,fontSize:22,color:c}}>{v}</div>
              <div style={{fontSize:9,fontWeight:700,color:'#7A9090',textTransform:'uppercase',marginTop:2,lineHeight:1.3}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Revise button */}
        {filtered.length > 0 && (
          <button onClick={()=>{setMode('revise');setRevIdx(0);setRevAns(null);setRevScore({correct:0,total:0});}}
            style={{width:'100%',background:'linear-gradient(135deg,#8B5CF6,#7C3AED)',border:'none',borderRadius:14,padding:'14px',color:'#fff',fontWeight:900,fontSize:14,cursor:'pointer',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 6px 20px rgba(139,92,246,0.3)'}}>
            <Brain size={16}/>Revise करा ({filtered.length} questions)
          </button>
        )}

        {/* Subject filter */}
        <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:14,paddingBottom:4}}>
          {subjects.map(s=>(
            <button key={s} onClick={()=>setFilter(s)}
              style={{flexShrink:0,padding:'5px 12px',borderRadius:99,fontSize:11,fontWeight:700,cursor:'pointer',border:`1.5px solid ${filter===s?'#8B5CF6':'rgba(0,0,0,0.1)'}`,background:filter===s?'rgba(139,92,246,0.1)':'#fff',color:filter===s?'#8B5CF6':'#7A9090'}}>
              {s}
            </button>
          ))}
        </div>

        {/* Mistakes list */}
        {filtered.length===0 ? (
          <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:20,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:48,marginBottom:10}}>✨</div>
            <div style={{fontWeight:800,fontSize:14,color:'#1C2B2B',marginBottom:6}}>कोणतीही चुकलेली प्रश्न नाही!</div>
            <div style={{fontSize:12,fontWeight:600,color:'#7A9090'}}>Quiz सोडवा — चुकलेले आपोआप इथे येतील</div>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {filtered.map((m,i)=>(
              <div key={m.id} style={{background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',animation:`mb-fade 0.2s ease ${i*0.03}s both`,borderLeft:'4px solid #8B5CF6'}}>
                <div style={{padding:'14px 16px',display:'flex',alignItems:'start',gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:800,color:'#1C2B2B',lineHeight:1.5,marginBottom:4}}>{m.question?.slice(0,90)}{m.question?.length>90?'...':''}</div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <span style={{fontSize:9,fontWeight:700,color:'#8B5CF6',background:'rgba(139,92,246,0.08)',borderRadius:99,padding:'2px 8px'}}>{m.subject}</span>
                      <span style={{fontSize:9,fontWeight:700,color:'#DC2626',background:'rgba(220,38,38,0.06)',borderRadius:99,padding:'2px 8px'}}>✗ {m.options[m.wrongAnswer]?.slice(0,20)}</span>
                      {m.revisedCount>0&&<span style={{fontSize:9,fontWeight:700,color:'#059669',background:'rgba(5,150,105,0.08)',borderRadius:99,padding:'2px 8px'}}>✓ {m.revisedCount}x revised</span>}
                      <span style={{fontSize:9,fontWeight:600,color:'#A8A29E'}}>{m.addedAt}</span>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6,flexShrink:0}}>
                    <button onClick={()=>setExpanded(expanded===m.id?null:m.id)} style={{background:'rgba(0,0,0,0.05)',border:'none',borderRadius:8,padding:'5px',cursor:'pointer',display:'flex'}}>
                      {expanded===m.id?<ChevronUp size={13} style={{color:'#7A9090'}}/>:<ChevronDown size={13} style={{color:'#7A9090'}}/>}
                    </button>
                    <button onClick={()=>remove(m.id)} style={{background:'rgba(220,38,38,0.07)',border:'none',borderRadius:8,padding:'5px',cursor:'pointer',display:'flex'}}><Trash2 size={13} style={{color:'#DC2626'}}/></button>
                  </div>
                </div>
                {expanded===m.id && (
                  <div style={{padding:'0 16px 14px',animation:'mb-fade 0.2s ease'}}>
                    <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:10}}>
                      {m.options?.map((opt,oi)=>{
                        const isAns=oi===m.correct_answer_index, isWrong=oi===m.wrongAnswer;
                        let bg='#F8F5F0',border='rgba(0,0,0,0.08)',color='#1C2B2B';
                        if (isAns)   { bg='rgba(5,150,105,0.08)'; border='rgba(5,150,105,0.3)'; color='#065F46'; }
                        if (isWrong&&!isAns) { bg='rgba(220,38,38,0.07)'; border='rgba(220,38,38,0.25)'; color='#991B1B'; }
                        return (
                          <div key={oi} style={{display:'flex',gap:8,padding:'9px 12px',borderRadius:11,border:`1px solid ${border}`,background:bg}}>
                            <span style={{fontSize:11,fontWeight:900,color:isAns?'#059669':isWrong?'#DC2626':'#7A9090',flexShrink:0}}>{isAns?'✓':isWrong?'✗':String.fromCharCode(65+oi)}</span>
                            <span style={{fontSize:12,fontWeight:600,color}}>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                    {m.explanation&&<div style={{background:'rgba(139,92,246,0.06)',border:'1px solid rgba(139,92,246,0.15)',borderRadius:10,padding:'10px 12px',fontSize:11,fontWeight:600,color:'#4A6060',lineHeight:1.65}}>💡 {m.explanation}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

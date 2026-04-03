import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Search, BookOpen, ChevronDown, ChevronUp, Loader, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';

interface Question { id:number; question:string; options:string[]; correct_answer_index:number; explanation:string; subject:string; exam_name:string; difficulty?:string; }
interface Props { onBack: () => void; }

const TABLES = [
  { key:'prelims_questions',  label:'पूर्व परीक्षा', color:'#3B82F6' },
  { key:'mains_questions',    label:'मुख्य परीक्षा', color:'#10B981' },
  { key:'saralseva_questions',label:'सरळसेवा',       color:'#06B6D4' },
  { key:'mock_questions',     label:'Mock Test',     color:'#F59E0B' },
  { key:'current_affairs',    label:'चालू घडामोडी', color:'#EC4899' },
];

const CSS = `
  @keyframes qb-fade { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
  @keyframes qb-spin { to{transform:rotate(360deg)} }
  input:focus { outline:none; border-color:#E8671A !important; }
`;

export const QuestionBank: React.FC<Props> = ({ onBack }) => {
  const [table, setTable]       = useState('prelims_questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [subject, setSubject]   = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<number|null>(null);
  const [answered, setAnswered] = useState<Record<number,number>>({});
  const [page, setPage]         = useState(0);
  const PAGE = 20;

  const load = async () => {
    setLoading(true); setExpanded(null);
    try {
      let q = supabase.from(table).select('*').range(page*PAGE, (page+1)*PAGE-1);
      if (subject) q = q.eq('subject', subject);
      if (search)  q = q.ilike('question', `%${search}%`);
      const { data } = await q;
      setQuestions(data || []);
      // Load subjects
      const { data: subData } = await supabase.from(table).select('subject').limit(100);
      const uniqueSubs = [...new Set((subData||[]).map((d:any)=>d.subject).filter(Boolean))];
      setSubjects(uniqueSubs);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [table, page, subject]);

  const handleAnswer = (qId: number, optIdx: number, correctIdx: number) => {
    if (answered[qId] !== undefined) return;
    setAnswered(p => ({...p, [qId]: optIdx}));
    updateProgress(1, optIdx === correctIdx ? 1 : 0);
  };

  const tableInfo = TABLES.find(t=>t.key===table)!;

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:680, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
          <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
            <BookOpen size={16} style={{color:'#E8671A'}}/> Question Bank
          </div>
          <button onClick={load} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px', cursor:'pointer', color:'#7A9090', display:'flex' }}>
            <RefreshCw size={13} style={loading?{animation:'qb-spin 0.8s linear infinite'}:{}}/>
          </button>
        </div>
      </div>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'14px 16px' }}>
        {/* Table tabs */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:12, paddingBottom:4 }}>
          {TABLES.map(t => (
            <button key={t.key} onClick={()=>{setTable(t.key);setPage(0);setSubject('');}}
              style={{ flexShrink:0, padding:'7px 13px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', border:`1.5px solid ${table===t.key?t.color:'rgba(0,0,0,0.1)'}`, background:table===t.key?`${t.color}15`:'#fff', color:table===t.key?t.color:'#7A9090', transition:'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          <div style={{ position:'relative', flex:1 }}>
            <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#A8A29E' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}
              placeholder="Question शोधा..."
              style={{ width:'100%', background:'#fff', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'9px 12px 9px 30px', fontSize:12, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', fontFamily:"'Baloo 2',sans-serif", transition:'border 0.2s' }}/>
          </div>
          <select value={subject} onChange={e=>{setSubject(e.target.value);setPage(0);}}
            style={{ background:'#fff', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'9px 12px', fontSize:12, fontWeight:700, color:'#4A6060', cursor:'pointer', outline:'none' }}>
            <option value="">सर्व Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Questions */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'50px' }}>
            <div style={{ width:40, height:40, border:'3px solid rgba(232,103,26,0.2)', borderTopColor:'#E8671A', borderRadius:'50%', animation:'qb-spin 0.8s linear infinite', margin:'0 auto' }}/>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {questions.map((q,i) => {
                const isAns = answered[q.id] !== undefined;
                const isOpen = expanded === q.id;
                return (
                  <div key={q.id} style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', animation:`qb-fade 0.2s ease ${i*0.03}s both`, borderLeft:`4px solid ${isAns?(answered[q.id]===q.correct_answer_index?'#059669':'#DC2626'):'rgba(0,0,0,0.1)'}`, transition:'border 0.3s' }}>
                    <div style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', gap:10, marginBottom:10 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:'#1C2B2B', lineHeight:1.6, margin:0, flex:1 }}>{q.question}</p>
                        <button onClick={()=>setExpanded(isOpen?null:q.id)}
                          style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:8, padding:'5px', cursor:'pointer', flexShrink:0, display:'flex' }}>
                          {isOpen?<ChevronUp size={14} style={{color:'#7A9090'}}/>:<ChevronDown size={14} style={{color:'#7A9090'}}/>}
                        </button>
                      </div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <span style={{ fontSize:8, fontWeight:800, color:tableInfo.color, background:`${tableInfo.color}15`, borderRadius:99, padding:'2px 8px', textTransform:'uppercase' }}>{q.subject}</span>
                        {q.difficulty && <span style={{ fontSize:8, fontWeight:800, color:'#7A9090', background:'rgba(0,0,0,0.05)', borderRadius:99, padding:'2px 8px' }}>{q.difficulty}</span>}
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ padding:'0 16px 14px', animation:'qb-fade 0.2s ease' }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:10 }}>
                          {q.options?.map((opt,oi) => {
                            const isSel = answered[q.id]===oi, isAns2 = oi===q.correct_answer_index;
                            let bg='#F8F5F0', border='rgba(0,0,0,0.08)', color='#1C2B2B';
                            if (isAns && isAns2)           { bg='rgba(5,150,105,0.08)'; border='rgba(5,150,105,0.3)'; color='#065F46'; }
                            if (isAns && isSel && !isAns2) { bg='rgba(220,38,38,0.07)'; border='rgba(220,38,38,0.3)'; color='#991B1B'; }
                            if (isAns && !isSel && !isAns2){ color='#A8A29E'; }
                            return (
                              <button key={oi} disabled={isAns} onClick={()=>handleAnswer(q.id,oi,q.correct_answer_index)}
                                style={{ display:'flex', gap:8, padding:'9px 12px', borderRadius:11, border:`1px solid ${border}`, background:bg, color, fontWeight:600, fontSize:12, textAlign:'left', cursor:isAns?'default':'pointer', transition:'all 0.15s' }}>
                                <span style={{ width:22, height:22, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, background:'rgba(0,0,0,0.06)' }}>
                                  {isAns&&isAns2?'✓':isAns&&isSel&&!isAns2?'✗':String.fromCharCode(65+oi)}
                                </span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {isAns && q.explanation && (
                          <div style={{ background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:10, padding:'10px 12px', fontSize:11, fontWeight:600, color:'#4A6060', lineHeight:1.65 }}>
                            💡 {q.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:16 }}>
              <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
                style={{ padding:'9px 20px', borderRadius:12, border:'1px solid rgba(0,0,0,0.1)', background:page===0?'rgba(0,0,0,0.04)':'#fff', color:page===0?'#A8A29E':'#1C2B2B', fontWeight:800, fontSize:12, cursor:page===0?'not-allowed':'pointer' }}>
                ← मागील
              </button>
              <div style={{ padding:'9px 16px', background:'rgba(232,103,26,0.08)', borderRadius:12, fontSize:12, fontWeight:800, color:'#E8671A' }}>
                Page {page+1}
              </div>
              <button onClick={()=>setPage(p=>p+1)} disabled={questions.length<PAGE}
                style={{ padding:'9px 20px', borderRadius:12, border:'1px solid rgba(0,0,0,0.1)', background:questions.length<PAGE?'rgba(0,0,0,0.04)':'#fff', color:questions.length<PAGE?'#A8A29E':'#1C2B2B', fontWeight:800, fontSize:12, cursor:questions.length<PAGE?'not-allowed':'pointer' }}>
                पुढील →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

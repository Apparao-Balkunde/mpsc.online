import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit3, Save, X, BookOpen, Search } from 'lucide-react';

interface Note { id:string; title:string; content:string; subject:string; createdAt:string; color:string; }
interface Props { onBack: () => void; }

const COLORS = ['#FEF3C7','#EFF6FF','#F0FDF4','#FDF4FF','#FFF1F2','#F0FDFA'];
const SUBJECTS = ['सर्व','मराठी','English','इतिहास','भूगोल','राज्यघटना','विज्ञान','गणित','चालू घडामोडी'];
const KEY = 'mpsc_notes';

const CSS = `
  @keyframes n-slide { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
  textarea:focus, input:focus { outline:none; border-color:#E8671A !important; }
`;

export const NotesFeature: React.FC<Props> = ({ onBack }) => {
  const [notes, setNotes]     = useState<Note[]>(() => { try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } });
  const [editing, setEditing] = useState<Note|null>(null);
  const [isNew, setIsNew]     = useState(false);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('सर्व');

  const save = () => {
    if (!editing || !editing.title.trim()) return;
    const updated = isNew ? [...notes, editing] : notes.map(n => n.id===editing.id ? editing : n);
    setNotes(updated);
    localStorage.setItem(KEY, JSON.stringify(updated));
    setEditing(null); setIsNew(false);
  };

  const del = (id:string) => {
    if (!window.confirm('Delete?')) return;
    const updated = notes.filter(n => n.id!==id);
    setNotes(updated);
    localStorage.setItem(KEY, JSON.stringify(updated));
  };

  const newNote = () => {
    setEditing({ id:Date.now().toString(), title:'', content:'', subject:'सर्व', createdAt:new Date().toLocaleDateString('mr-IN'), color:COLORS[Math.floor(Math.random()*COLORS.length)] });
    setIsNew(true);
  };

  const filtered = notes.filter(n =>
    (filter==='सर्व' || n.subject===filter) &&
    (n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
  );

  if (editing) return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={()=>{setEditing(null);setIsNew(false);}} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><X size={14}/></button>
        <span style={{ flex:1, fontWeight:900, fontSize:14, color:'#1C2B2B' }}>{isNew?'नवीन Note':'Edit Note'}</span>
        <button onClick={save} style={{ background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:10, padding:'8px 16px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
          <Save size={13}/> Save
        </button>
      </div>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px' }}>
        <input value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})} placeholder="Title..."
          style={{ width:'100%', background:'#fff', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'14px 16px', fontSize:18, fontWeight:900, color:'#1C2B2B', boxSizing:'border-box', marginBottom:12, fontFamily:"'Baloo 2',sans-serif", transition:'border 0.2s' }}/>
        <div style={{ display:'flex', gap:7, marginBottom:12, flexWrap:'wrap' }}>
          {SUBJECTS.filter(s=>s!=='सर्व').map(s=>(
            <button key={s} onClick={()=>setEditing({...editing,subject:s})}
              style={{ padding:'5px 12px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', border:`1.5px solid ${editing.subject===s?'#E8671A':'rgba(0,0,0,0.1)'}`, background:editing.subject===s?'rgba(232,103,26,0.1)':'#fff', color:editing.subject===s?'#E8671A':'#7A9090' }}>
              {s}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setEditing({...editing,color:c})}
              style={{ width:28, height:28, borderRadius:'50%', background:c, border:editing.color===c?'2.5px solid #E8671A':'1px solid rgba(0,0,0,0.1)', cursor:'pointer' }}/>
          ))}
        </div>
        <textarea value={editing.content} onChange={e=>setEditing({...editing,content:e.target.value})} placeholder="Notes इथे लिहा..."
          style={{ width:'100%', background:'#fff', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'16px', fontSize:14, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', minHeight:300, resize:'vertical', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", lineHeight:1.7, transition:'border 0.2s' }}/>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:80 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:560, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
          <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', flex:1, display:'flex', alignItems:'center', gap:6 }}>
            <BookOpen size={16} style={{color:'#E8671A'}}/> My Notes ({notes.length})
          </div>
          <button onClick={newNote} style={{ background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:10, padding:'8px 14px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            <Plus size={14}/> नवीन
          </button>
        </div>
      </div>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'16px' }}>
        <div style={{ position:'relative', marginBottom:12 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#A8A29E' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Notes शोधा..."
            style={{ width:'100%', background:'#fff', border:'1px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'10px 14px 10px 34px', fontSize:13, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', fontFamily:"'Baloo 2',sans-serif", outline:'none' }}/>
        </div>
        <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
          {SUBJECTS.map(s=>(
            <button key={s} onClick={()=>setFilter(s)}
              style={{ padding:'5px 11px', borderRadius:99, fontSize:10, fontWeight:700, cursor:'pointer', border:`1.5px solid ${filter===s?'#E8671A':'rgba(0,0,0,0.1)'}`, background:filter===s?'rgba(232,103,26,0.1)':'#fff', color:filter===s?'#E8671A':'#7A9090' }}>
              {s}
            </button>
          ))}
        </div>
        {filtered.length===0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📝</div>
            <div style={{ fontWeight:800, fontSize:15, color:'#1C2B2B', marginBottom:6 }}>अजून Notes नाहीत!</div>
            <div style={{ fontSize:12, color:'#7A9090', fontWeight:600 }}>+ बटण दाबा आणि notes लिहा</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(note=>(
              <div key={note.id} style={{ background:note.color, borderRadius:16, padding:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', animation:'n-slide 0.2s ease' }}>
                <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', marginBottom:8 }}>
                  <div>
                    <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:3 }}>{note.title||'Untitled'}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#7A9090', textTransform:'uppercase' }}>{note.subject} · {note.createdAt}</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>{setEditing(note);setIsNew(false);}} style={{ background:'rgba(0,0,0,0.08)', border:'none', borderRadius:8, padding:'5px', cursor:'pointer', display:'flex' }}><Edit3 size={13} style={{color:'#4A6060'}}/></button>
                    <button onClick={()=>del(note.id)} style={{ background:'rgba(220,38,38,0.1)', border:'none', borderRadius:8, padding:'5px', cursor:'pointer', display:'flex' }}><Trash2 size={13} style={{color:'#DC2626'}}/></button>
                  </div>
                </div>
                <p style={{ fontSize:12, color:'#4A6060', fontWeight:600, lineHeight:1.65, margin:0, whiteSpace:'pre-wrap' }}>{note.content.slice(0,200)}{note.content.length>200?'...':''}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

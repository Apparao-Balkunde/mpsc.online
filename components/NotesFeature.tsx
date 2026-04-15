import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Trash2, Edit3, Save, X, Tag, Download } from 'lucide-react';

interface Props { onBack: () => void; }
interface Note {
  id: string; title: string; content: string;
  subject: string; tag: string; color: string;
  createdAt: string; updatedAt: string; pinned: boolean;
}

const KEY = 'mpsc_notes_v2';
const SUBJECTS = ['सर्व', 'राज्यघटना', 'इतिहास', 'भूगोल', 'अर्थशास्त्र', 'विज्ञान', 'मराठी', 'चालू घडामोडी', 'इतर'];
const COLORS   = ['#FEF3C7','#FEE2E2','#DCFCE7','#DBEAFE','#F3E8FF','#FCE7F3','#E0F2FE','#FFF7ED'];
const TAGS     = ['Important','Revision','Formula','Definition','Date','Person','Place','Other'];

const CSS = `
@keyframes nf-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes nf-pop{0%{transform:scale(0.92)}60%{transform:scale(1.02)}100%{transform:scale(1)}}
textarea:focus,input:focus{outline:none;}
`;

export const NotesFeature: React.FC<Props> = ({ onBack }) => {
  const [notes, setNotes]     = useState<Note[]>([]);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('सर्व');
  const [editing, setEditing] = useState<Note|null>(null);
  const [isNew, setIsNew]     = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      // Migrate old notes if any
      const migrated = saved.map((n: any) => ({
        ...n, tag: n.tag||'Other', updatedAt: n.updatedAt||n.createdAt, pinned: n.pinned||false
      }));
      setNotes(migrated);
    } catch { setNotes([]); }
  }, []);

  const save = (data: Note[]) => {
    setNotes(data);
    localStorage.setItem(KEY, JSON.stringify(data));
  };

  const newNote = () => {
    const n: Note = {
      id: Date.now().toString(), title: '', content: '', subject: 'इतर',
      tag: 'Other', color: COLORS[Math.floor(Math.random()*COLORS.length)],
      createdAt: new Date().toLocaleDateString('mr-IN'),
      updatedAt: new Date().toLocaleDateString('mr-IN'), pinned: false
    };
    setEditing(n); setIsNew(true);
  };

  const saveNote = () => {
    if (!editing || (!editing.title.trim() && !editing.content.trim())) return;
    const updated = { ...editing, updatedAt: new Date().toLocaleDateString('mr-IN') };
    if (isNew) save([updated, ...notes]);
    else save(notes.map(n => n.id === editing.id ? updated : n));
    setEditing(null); setIsNew(false);
  };

  const deleteNote = (id: string) => {
    if (!confirm('Note delete करायचे?')) return;
    save(notes.filter(n => n.id !== id));
  };

  const togglePin = (id: string) => {
    save(notes.map(n => n.id === id ? {...n, pinned: !n.pinned} : n));
  };

  const exportNote = (note: Note) => {
    const text = `${note.title}\n${'─'.repeat(40)}\nविषय: ${note.subject} | Tag: ${note.tag}\nDate: ${note.createdAt}\n\n${note.content}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${note.title||'note'}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = notes
    .filter(n => filter === 'सर्व' || n.subject === filter)
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  // ── EDIT SCREEN ──
  if (editing) return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:80, display:'flex', flexDirection:'column' }}>
      <style>{CSS}</style>
      <div style={{ background:editing.color, borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ background:'rgba(0,0,0,0.08)', border:'none', borderRadius:9, padding:'7px 9px', cursor:'pointer', display:'flex' }}><X size={14}/></button>
        <div style={{ flex:1, fontWeight:900, fontSize:14, color:'#1C2B2B' }}>{isNew ? '+ नवीन Note' : 'Edit Note'}</div>
        <button onClick={exportNote.bind(null,editing)} style={{ background:'rgba(0,0,0,0.08)', border:'none', borderRadius:9, padding:'7px 9px', cursor:'pointer', display:'flex' }}><Download size={13}/></button>
        <button onClick={saveNote} style={{ background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:11, padding:'8px 16px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <Save size={13}/> Save
        </button>
      </div>
      <div style={{ flex:1, maxWidth:680, margin:'0 auto', padding:'16px', width:'100%', boxSizing:'border-box' }}>
        <input value={editing.title} onChange={e => setEditing({...editing, title:e.target.value})}
          placeholder="Title..."
          style={{ width:'100%', background:'transparent', border:'none', borderBottom:'2px solid rgba(0,0,0,0.1)', padding:'10px 0', fontSize:20, fontWeight:900, color:'#1C2B2B', marginBottom:14, fontFamily:"'Baloo 2',sans-serif", boxSizing:'border-box' }}/>
        {/* Metadata row */}
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          <select value={editing.subject} onChange={e => setEditing({...editing, subject:e.target.value})}
            style={{ background:'rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:10, padding:'7px 12px', fontSize:12, fontWeight:700, color:'#1C2B2B', outline:'none', cursor:'pointer' }}>
            {SUBJECTS.filter(s=>s!=='सर्व').map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={editing.tag} onChange={e => setEditing({...editing, tag:e.target.value})}
            style={{ background:'rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:10, padding:'7px 12px', fontSize:12, fontWeight:700, color:'#1C2B2B', outline:'none', cursor:'pointer' }}>
            {TAGS.map(t => <option key={t}>{t}</option>)}
          </select>
          {/* Color picker */}
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            {COLORS.map(clr => (
              <button key={clr} onClick={() => setEditing({...editing, color:clr})}
                style={{ width:20, height:20, borderRadius:6, background:clr, border:editing.color===clr?'2.5px solid #1C2B2B':'1.5px solid rgba(0,0,0,0.15)', cursor:'pointer', padding:0 }}/>
            ))}
          </div>
        </div>
        <textarea value={editing.content} onChange={e => setEditing({...editing, content:e.target.value})}
          placeholder="Notes लिहा... (मराठी किंवा English)"
          style={{ width:'100%', minHeight:'55vh', background:'rgba(255,255,255,0.7)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:16, padding:'16px', fontSize:14, fontWeight:600, color:'#1C2B2B', resize:'none', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", lineHeight:1.8, boxSizing:'border-box' }}/>
      </div>
    </div>
  );

  // ── LIST SCREEN ──
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
            <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B' }}>📝 My Notes</div>
            <span style={{ fontSize:11, fontWeight:700, color:'#7A9090', background:'rgba(0,0,0,0.05)', borderRadius:99, padding:'3px 10px' }}>{notes.length}</span>
            <button onClick={newNote} style={{ background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:11, padding:'8px 14px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 4px 12px rgba(232,103,26,0.3)' }}>
              <Plus size={14}/> नवीन
            </button>
          </div>
          {/* Search */}
          <div style={{ position:'relative', marginBottom:10 }}>
            <Search size={13} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#B0CCCC' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Notes search करा..."
              style={{ width:'100%', background:'#F8F5F0', border:'1px solid rgba(0,0,0,0.08)', borderRadius:12, padding:'9px 12px 9px 34px', fontSize:13, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', fontFamily:"'Baloo 2',sans-serif" }}/>
          </div>
          {/* Subject filter */}
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                style={{ flexShrink:0, padding:'5px 11px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', border:`1.5px solid ${filter===s?'#E8671A':'rgba(0,0,0,0.1)'}`, background:filter===s?'rgba(232,103,26,0.1)':'#fff', color:filter===s?'#E8671A':'#7A9090', whiteSpace:'nowrap' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'14px 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:48, marginBottom:10 }}>📝</div>
            <div style={{ fontWeight:800, fontSize:14, color:'#1C2B2B', marginBottom:6 }}>{search ? 'Notes सापडले नाहीत' : 'अजून Notes नाहीत'}</div>
            <div style={{ fontSize:12, fontWeight:600, color:'#7A9090' }}>{search ? 'दुसरे keyword वापरा' : '+ नवीन दाबा आणि पहिला note लिहा!'}</div>
          </div>
        ) : (
          <div style={{ columns: window.innerWidth > 600 ? 2 : 1, gap:12 }}>
            {filtered.map((note, i) => (
              <div key={note.id} style={{ background:note.color, borderRadius:18, padding:'16px', marginBottom:12, boxShadow:'0 2px 10px rgba(0,0,0,0.07)', animation:`nf-fade 0.2s ease ${i*0.04}s both`, breakInside:'avoid', cursor:'pointer', position:'relative', border:'1px solid rgba(0,0,0,0.06)' }}
                onClick={() => setEditing({...note})}>
                {/* Pin badge */}
                {note.pinned && <div style={{ position:'absolute', top:12, right:12, fontSize:14 }}>📌</div>}
                {/* Tag */}
                <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:9, fontWeight:800, color:'#E8671A', background:'rgba(232,103,26,0.12)', borderRadius:99, padding:'2px 8px', textTransform:'uppercase' }}>{note.subject}</span>
                  {note.tag && note.tag !== 'Other' && (
                    <span style={{ fontSize:9, fontWeight:800, color:'#7C3AED', background:'rgba(124,58,237,0.1)', borderRadius:99, padding:'2px 8px', display:'flex', alignItems:'center', gap:3 }}>
                      <Tag size={8}/>{note.tag}
                    </span>
                  )}
                </div>
                <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:6, lineHeight:1.4 }}>
                  {note.title || 'Untitled'}
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:'#4A6060', lineHeight:1.6, marginBottom:10 }}>
                  {note.content.slice(0, 120)}{note.content.length > 120 ? '...' : ''}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:9, fontWeight:600, color:'#A8A29E' }}>{note.updatedAt}</span>
                  <div style={{ display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => togglePin(note.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13 }}>{note.pinned ? '📌' : '📍'}</button>
                    <button onClick={() => exportNote(note)} style={{ background:'rgba(0,0,0,0.07)', border:'none', borderRadius:7, padding:'4px 6px', cursor:'pointer', display:'flex' }}><Download size={11} style={{color:'#7A9090'}}/></button>
                    <button onClick={() => deleteNote(note.id)} style={{ background:'rgba(220,38,38,0.08)', border:'none', borderRadius:7, padding:'4px 6px', cursor:'pointer', display:'flex' }}><Trash2 size={11} style={{color:'#DC2626'}}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ArrowLeft, FolderPlus, Folder, Trash2, BookmarkX, Plus, ChevronRight, Edit3, Check } from 'lucide-react';

interface Bookmark { id:string; question:string; subject:string; table:string; answer:string; note?:string; }
interface Collection { id:string; name:string; color:string; emoji:string; bookmarks:string[]; }
interface Props { onBack: () => void; }

const BM_KEY   = 'mpsc_bookmarks';
const COLL_KEY = 'mpsc_bookmark_collections';
const COLORS   = ['#E8671A','#2563EB','#7C3AED','#059669','#DC2626','#D97706'];
const EMOJIS   = ['📚','📝','⚖️','🗺️','🔬','💰','📰','🎯'];
const CSS = `@keyframes bc-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} input:focus{outline:none;border-color:#E8671A !important;}`;

export const BookmarkCollections: React.FC<Props> = ({ onBack }) => {
  const [bookmarks, setBookmarks]     = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [active, setActive]           = useState<Collection|null>(null);
  const [creating, setCreating]       = useState(false);
  const [newName, setNewName]         = useState('');
  const [newColor, setNewColor]       = useState(COLORS[0]);
  const [newEmoji, setNewEmoji]       = useState(EMOJIS[0]);
  const [editId, setEditId]           = useState<string|null>(null);

  useEffect(() => {
    try {
      setBookmarks(JSON.parse(localStorage.getItem(BM_KEY)||'[]'));
      setCollections(JSON.parse(localStorage.getItem(COLL_KEY)||'[]'));
    } catch {}
  }, []);

  const saveColl = (data: Collection[]) => { setCollections(data); localStorage.setItem(COLL_KEY, JSON.stringify(data)); };

  const createCollection = () => {
    if (!newName.trim()) return;
    const c: Collection = { id:Date.now().toString(), name:newName.trim(), color:newColor, emoji:newEmoji, bookmarks:[] };
    saveColl([...collections, c]);
    setCreating(false); setNewName(''); setNewColor(COLORS[0]); setNewEmoji(EMOJIS[0]);
  };

  const deleteCollection = (id: string) => {
    if (!window.confirm('Collection delete करायची?')) return;
    saveColl(collections.filter(c=>c.id!==id));
    if (active?.id===id) setActive(null);
  };

  const addToCollection = (bmId: string, collId: string) => {
    const updated = collections.map(c => c.id===collId && !c.bookmarks.includes(bmId) ? {...c, bookmarks:[...c.bookmarks, bmId]} : c);
    saveColl(updated);
  };

  const removeFromCollection = (bmId: string) => {
    if (!active) return;
    const updated = collections.map(c => c.id===active.id ? {...c, bookmarks:c.bookmarks.filter(b=>b!==bmId)} : c);
    saveColl(updated);
    setActive(updated.find(c=>c.id===active.id)!);
  };

  const uncollected = bookmarks.filter(b => !collections.some(c=>c.bookmarks.includes(b.id)));

  if (active) {
    const collBMs = bookmarks.filter(b => active.bookmarks.includes(b.id));
    return (
      <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
        <style>{CSS}</style>
        <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={()=>setActive(null)} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
          <span style={{ fontSize:20 }}>{active.emoji}</span>
          <div style={{ flex:1, fontWeight:900, fontSize:14, color:'#1C2B2B' }}>{active.name}</div>
          <span style={{ fontSize:10, fontWeight:700, color:'#7A9090', background:'rgba(0,0,0,0.05)', borderRadius:99, padding:'4px 10px' }}>{collBMs.length} bookmarks</span>
        </div>
        <div style={{ maxWidth:560, margin:'0 auto', padding:'16px' }}>
          {collBMs.length===0 ? (
            <div style={{ textAlign:'center', padding:'50px 20px', background:'#fff', borderRadius:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🔖</div>
              <div style={{ fontWeight:800, fontSize:14, color:'#1C2B2B' }}>Collection खाली आहे</div>
            </div>
          ) : collBMs.map((b,i) => (
            <div key={b.id} style={{ background:'#fff', borderRadius:14, padding:'14px', marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.05)', animation:`bc-fade 0.2s ease ${i*0.05}s both`, display:'flex', gap:10, alignItems:'start' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:800, color:'#1C2B2B', lineHeight:1.5, marginBottom:4 }}>{b.question?.slice(0,80)}{b.question?.length>80?'...':''}</div>
                <div style={{ fontSize:10, fontWeight:700, color:active.color }}>{b.subject} · {b.table?.replace('_questions','')}</div>
              </div>
              <button onClick={()=>removeFromCollection(b.id)} style={{ background:'rgba(220,38,38,0.08)', border:'none', borderRadius:8, padding:'5px', cursor:'pointer', flexShrink:0 }}>
                <BookmarkX size={13} style={{color:'#DC2626'}}/>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B' }}>📂 Bookmark Collections</div>
        <button onClick={()=>setCreating(true)} style={{ background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:10, padding:'8px 14px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
          <Plus size={14}/> नवीन
        </button>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'16px' }}>
        {/* Create form */}
        {creating && (
          <div style={{ background:'#fff', borderRadius:18, padding:'18px', marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', animation:'bc-fade 0.3s ease' }}>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Collection नाव..."
              style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'11px 14px', fontSize:14, fontWeight:700, color:'#1C2B2B', boxSizing:'border-box', marginBottom:12, fontFamily:"'Baloo 2',sans-serif", transition:'border 0.2s' }}/>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              {EMOJIS.map(e=><button key={e} onClick={()=>setNewEmoji(e)} style={{ width:36, height:36, borderRadius:10, border:`2px solid ${newEmoji===e?'#E8671A':'rgba(0,0,0,0.1)'}`, background:newEmoji===e?'rgba(232,103,26,0.1)':'#F8F5F0', fontSize:18, cursor:'pointer' }}>{e}</button>)}
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              {COLORS.map(c=><button key={c} onClick={()=>setNewColor(c)} style={{ width:28, height:28, borderRadius:'50%', background:c, border:newColor===c?'3px solid #1C2B2B':'2px solid rgba(0,0,0,0.1)', cursor:'pointer' }}/>)}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={createCollection} style={{ flex:2, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:12, padding:'12px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer' }}>Create</button>
              <button onClick={()=>setCreating(false)} style={{ flex:1, background:'#F8F5F0', border:'none', borderRadius:12, padding:'12px', color:'#7A9090', fontWeight:800, fontSize:13, cursor:'pointer' }}>रद्द</button>
            </div>
          </div>
        )}

        {/* Collections */}
        {collections.length > 0 && (
          <>
            <div style={{ fontWeight:800, fontSize:11, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Collections ({collections.length})</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
              {collections.map((c,i) => (
                <div key={c.id} onClick={()=>setActive(c)}
                  style={{ background:'#fff', borderRadius:16, padding:'14px', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', animation:`bc-fade 0.2s ease ${i*0.05}s both`, borderTop:`4px solid ${c.color}`, position:'relative' }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>{c.emoji}</div>
                  <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B', marginBottom:2 }}>{c.name}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:c.color }}>{c.bookmarks.length} bookmarks</div>
                  <button onClick={e=>{e.stopPropagation();deleteCollection(c.id);}} style={{ position:'absolute', top:10, right:10, background:'rgba(220,38,38,0.08)', border:'none', borderRadius:7, padding:'4px', cursor:'pointer', display:'flex' }}>
                    <Trash2 size={11} style={{color:'#DC2626'}}/>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Uncollected bookmarks */}
        {uncollected.length > 0 && (
          <>
            <div style={{ fontWeight:800, fontSize:11, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Uncollected ({uncollected.length})</div>
            {uncollected.map((b,i) => (
              <div key={b.id} style={{ background:'#fff', borderRadius:14, padding:'14px', marginBottom:8, boxShadow:'0 2px 6px rgba(0,0,0,0.05)', animation:`bc-fade 0.2s ease ${i*0.04}s both` }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#1C2B2B', marginBottom:8, lineHeight:1.5 }}>{b.question?.slice(0,70)}...</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {collections.map(c => (
                    <button key={c.id} onClick={()=>addToCollection(b.id, c.id)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:99, border:`1px solid ${c.color}30`, background:`${c.color}10`, fontSize:10, fontWeight:700, color:c.color, cursor:'pointer' }}>
                      {c.emoji} {c.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {bookmarks.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:48, marginBottom:10 }}>🔖</div>
            <div style={{ fontWeight:800, fontSize:14, color:'#1C2B2B' }}>अजून Bookmarks नाहीत</div>
          </div>
        )}
      </div>
    </div>
  );
};

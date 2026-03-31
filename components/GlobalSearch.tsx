import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight, Loader, BookOpen, Zap, History, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Result { id:number; question:string; subject:string; table:string; correct_answer_index:number; options:string[]; explanation:string; }
interface Props { onClose: () => void; onGoToMode: (mode:string) => void; }

const TABLES = [
  { name:'prelims_questions', label:'पूर्व परीक्षा', color:'#3B82F6' },
  { name:'mains_questions',   label:'मुख्य परीक्षा', color:'#10B981' },
  { name:'saralseva_questions',label:'सरळसेवा',      color:'#06B6D4' },
  { name:'current_affairs',   label:'चालू घडामोडी', color:'#EC4899' },
  { name:'vocab_questions',   label:'शब्दसंग्रह',   color:'#8B5CF6' },
];

const RECENT_KEY = 'mpsc_search_history';

const CSS = `
  @keyframes gs-fade { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
  @keyframes gs-spin { to{transform:rotate(360deg)} }
  input:focus { outline:none; }
`;

export const GlobalSearch: React.FC<Props> = ({ onClose, onGoToMode }) => {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<Result[]>([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState<Result|null>(null);
  const [recent, setRecent]     = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]'); } catch { return []; }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<any>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const searches = await Promise.all(
        TABLES.map(t => supabase.from(t.name).select('id,question,subject,options,correct_answer_index,explanation').ilike('question', `%${q}%`).limit(5))
      );
      const all: Result[] = [];
      TABLES.forEach((t, i) => {
        (searches[i].data || []).forEach((r:any) => all.push({ ...r, table:t.name }));
      });
      setResults(all.slice(0,20));
    } catch {}
    setLoading(false);
  };

  const handleChange = (val: string) => {
    setQuery(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(val), 400);
  };

  const addRecent = (q: string) => {
    const updated = [q, ...recent.filter(r=>r!==q)].slice(0,8);
    setRecent(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const getTableLabel = (t: string) => TABLES.find(x=>x.name===t)?.label || t;
  const getTableColor = (t: string) => TABLES.find(x=>x.name===t)?.color || '#E8671A';

  if (selected) return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,17,23,0.7)', backdropFilter:'blur(8px)', zIndex:500, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", overflowY:'auto' }}
      onClick={e => e.target===e.currentTarget && setSelected(null)}>
      <div style={{ background:'#fff', maxWidth:560, margin:'40px auto', borderRadius:22, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ background:'linear-gradient(135deg,#1C2B2B,#2D4040)', padding:'16px 20px', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={()=>setSelected(null)} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, padding:'6px', cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={15}/></button>
          <span style={{ flex:1, fontWeight:800, fontSize:13, color:'rgba(255,255,255,0.7)' }}>Question</span>
          <span style={{ fontSize:10, fontWeight:800, color:getTableColor(selected.table), background:`${getTableColor(selected.table)}20`, borderRadius:99, padding:'3px 10px' }}>{getTableLabel(selected.table)}</span>
        </div>
        <div style={{ padding:'20px' }}>
          <p style={{ fontWeight:700, fontSize:15, lineHeight:1.7, color:'#1C2B2B', marginBottom:16 }}>{selected.question}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
            {selected.options?.map((opt,i) => (
              <div key={i} style={{ display:'flex', gap:9, alignItems:'center', padding:'11px 13px', borderRadius:12, background: i===selected.correct_answer_index ? 'rgba(5,150,105,0.08)' : '#F8F5F0', border:`1px solid ${i===selected.correct_answer_index?'rgba(5,150,105,0.3)':'rgba(0,0,0,0.07)'}` }}>
                <span style={{ width:24, height:24, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:i===selected.correct_answer_index?'#059669':'rgba(0,0,0,0.08)', color:i===selected.correct_answer_index?'#fff':'#4A6060', flexShrink:0 }}>
                  {i===selected.correct_answer_index?'✓':String.fromCharCode(65+i)}
                </span>
                <span style={{ fontSize:13, fontWeight:i===selected.correct_answer_index?800:600, color:i===selected.correct_answer_index?'#065F46':'#4A6060' }}>{opt}</span>
              </div>
            ))}
          </div>
          {selected.explanation && (
            <div style={{ background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:12, padding:'12px', fontSize:12, color:'#4A6060', fontWeight:600, lineHeight:1.7 }}>
              💡 {selected.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,17,23,0.7)', backdropFilter:'blur(8px)', zIndex:500, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", padding:'60px 16px 20px' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div style={{ maxWidth:560, margin:'0 auto', animation:'gs-fade 0.25s ease' }}>
        {/* Search input */}
        <div style={{ background:'#fff', borderRadius:18, padding:'4px 4px 4px 16px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:12 }}>
          {loading
            ? <div style={{ width:18, height:18, border:'2px solid rgba(232,103,26,0.3)', borderTopColor:'#E8671A', borderRadius:'50%', animation:'gs-spin 0.8s linear infinite', flexShrink:0 }}/>
            : <Search size={18} style={{ color:'#A8A29E', flexShrink:0 }}/>}
          <input ref={inputRef} value={query} onChange={e=>handleChange(e.target.value)}
            placeholder="प्रश्न शोधा... (मराठी किंवा English)"
            style={{ flex:1, border:'none', fontSize:14, fontWeight:600, color:'#1C2B2B', background:'transparent', padding:'12px 0', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}/>
          <button onClick={onClose} style={{ background:'rgba(0,0,0,0.06)', border:'none', borderRadius:12, padding:'10px 12px', cursor:'pointer', color:'#7A9090', display:'flex' }}><X size={15}/></button>
        </div>

        {/* Results */}
        <div style={{ background:'#fff', borderRadius:18, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.15)', maxHeight:'65vh', overflowY:'auto' }}>
          {query.length < 2 && recent.length > 0 && (
            <div style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:10, fontWeight:800, color:'#A8A29E', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Recent Searches</div>
              {recent.map(r => (
                <button key={r} onClick={()=>{ setQuery(r); search(r); addRecent(r); }}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 10px', borderRadius:10, background:'none', border:'none', cursor:'pointer', textAlign:'left', color:'#4A6060', fontSize:12, fontWeight:700 }}>
                  <History size={13} style={{color:'#A8A29E', flexShrink:0}}/> {r}
                </button>
              ))}
            </div>
          )}

          {query.length < 2 && recent.length === 0 && (
            <div style={{ padding:'40px', textAlign:'center' }}>
              <Search size={32} style={{ color:'#E5E7EB', marginBottom:10, display:'block', margin:'0 auto 10px' }}/>
              <div style={{ fontSize:13, fontWeight:700, color:'#A8A29E' }}>कमीत कमी 2 अक्षरे टाका</div>
            </div>
          )}

          {query.length >= 2 && !loading && results.length === 0 && (
            <div style={{ padding:'40px', textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🔍</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#A8A29E' }}>"{query}" साठी काहीच सापडले नाही</div>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div style={{ padding:'12px 16px 6px', fontSize:10, fontWeight:800, color:'#A8A29E', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                {results.length} results
              </div>
              {results.map((r,i) => (
                <button key={`${r.table}-${r.id}`} onClick={()=>{ setSelected(r); addRecent(query); }}
                  style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'12px 16px', borderBottom:'1px solid rgba(0,0,0,0.05)', background:'none', border:'none', cursor:'pointer', textAlign:'left', animation:`gs-fade 0.2s ease ${i*0.04}s both` }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${getTableColor(r.table)}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <BookOpen size={15} style={{color:getTableColor(r.table)}}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#1C2B2B', lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.question}</div>
                    <div style={{ fontSize:10, fontWeight:700, color:getTableColor(r.table), marginTop:2 }}>{getTableLabel(r.table)} · {r.subject}</div>
                  </div>
                  <ChevronRight size={14} style={{color:'#D1D5DB', flexShrink:0}}/>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

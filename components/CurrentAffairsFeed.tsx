import React, { useState, useEffect } from 'react';
import { ArrowLeft, Newspaper, RefreshCw, ExternalLink, Bookmark, BookmarkCheck, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Article { id:number; title:string; details:string; subject:string; category:string; important_date:string; exam_name:string; }
interface Props { onBack: () => void; }

const CATEGORIES = ['सर्व','राज्य','राष्ट्रीय','आंतरराष्ट्रीय','क्रीडा','पुरस्कार','विज्ञान','अर्थव्यवस्था'];
const SAVED_KEY = 'mpsc_saved_ca';

const CSS = `
  @keyframes ca-fade { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
  @keyframes ca-spin { to{transform:rotate(360deg)} }
  @keyframes ca-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
`;

export const CurrentAffairsFeed: React.FC<Props> = ({ onBack }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading]   = useState(true);
  const [cat, setCat]           = useState('सर्व');
  const [saved, setSaved]       = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(SAVED_KEY)||'[]')); } catch { return new Set(); }
  });
  const [expanded, setExpanded] = useState<number|null>(null);
  const [tab, setTab]           = useState<'feed'|'saved'>('feed');

  const load = async () => {
    setLoading(true);
    try {
      let q = supabase.from('current_affairs').select('*').order('important_date', {ascending:false}).limit(50);
      if (cat !== 'सर्व') q = q.ilike('category', `%${cat}%`);
      const { data } = await q;
      setArticles(data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [cat]);

  const toggleSave = (id: number) => {
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const display = tab === 'saved' ? articles.filter(a => saved.has(a.id)) : articles;

  const catColor = (c: string) => {
    const map: Record<string,string> = { राज्य:'#2563EB', राष्ट्रीय:'#E8671A', आंतरराष्ट्रीय:'#7C3AED', क्रीडा:'#059669', पुरस्कार:'#D97706', विज्ञान:'#0891B2', अर्थव्यवस्था:'#DC2626' };
    return map[c] || '#7A9090';
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:600, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
          <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
            <Newspaper size={16} style={{color:'#EC4899'}}/> चालू घडामोडी
          </div>
          <button onClick={load} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 9px', cursor:'pointer', color:'#7A9090', display:'flex' }}>
            <RefreshCw size={13} style={loading?{animation:'ca-spin 0.8s linear infinite'}:{}}/>
          </button>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'16px' }}>
        {/* Tabs */}
        <div style={{ display:'flex', background:'#fff', borderRadius:14, padding:4, marginBottom:14, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          {[['feed','📰 Feed'],['saved',`🔖 Saved (${saved.size})`]].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k as any)}
              style={{ flex:1, padding:'9px', borderRadius:11, fontWeight:800, fontSize:12, cursor:'pointer', border:'none', background:tab===k?'linear-gradient(135deg,#EC4899,#DB2777)':'transparent', color:tab===k?'#fff':'#7A9090', transition:'all 0.2s' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div style={{ display:'flex', gap:7, overflowX:'auto', marginBottom:16, paddingBottom:4 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={()=>setCat(c)}
              style={{ flexShrink:0, padding:'6px 13px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', border:`1.5px solid ${cat===c?'#EC4899':'rgba(0,0,0,0.1)'}`, background:cat===c?'rgba(236,72,153,0.1)':'#fff', color:cat===c?'#EC4899':'#7A9090', transition:'all 0.15s' }}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ width:40, height:40, border:'3px solid rgba(236,72,153,0.2)', borderTopColor:'#EC4899', borderRadius:'50%', animation:'ca-spin 0.8s linear infinite', margin:'0 auto 14px' }}/>
            <div style={{ fontSize:12, fontWeight:700, color:'#7A9090' }}>Loading...</div>
          </div>
        ) : display.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📰</div>
            <div style={{ fontWeight:800, fontSize:14, color:'#1C2B2B', marginBottom:6 }}>
              {tab === 'saved' ? 'अजून काहीच save नाही' : 'Current Affairs उपलब्ध नाहीत'}
            </div>
            <div style={{ fontSize:12, color:'#7A9090', fontWeight:600 }}>Admin Panel मधून articles add करा</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {display.map((a, i) => (
              <div key={a.id} style={{ background:'#fff', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', animation:`ca-fade 0.2s ease ${i*0.04}s both`, border:'1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ height:3, background:`linear-gradient(90deg,${catColor(a.category)},${catColor(a.category)}88)` }}/>
                <div style={{ padding:'16px' }}>
                  <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', gap:10, marginBottom:10 }}>
                    <h3 style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', lineHeight:1.5, margin:0, flex:1 }}>{a.title}</h3>
                    <button onClick={()=>toggleSave(a.id)} style={{ background:'none', border:'none', cursor:'pointer', flexShrink:0, padding:4 }}>
                      {saved.has(a.id)
                        ? <BookmarkCheck size={18} style={{color:'#EC4899'}}/>
                        : <Bookmark size={18} style={{color:'#D1D5DB'}}/>}
                    </button>
                  </div>
                  <div style={{ display:'flex', gap:8, marginBottom:expanded===a.id?12:0, flexWrap:'wrap' }}>
                    {a.category && <span style={{ fontSize:9, fontWeight:800, color:catColor(a.category), background:`${catColor(a.category)}15`, border:`1px solid ${catColor(a.category)}25`, borderRadius:99, padding:'2px 9px', textTransform:'uppercase' }}>{a.category}</span>}
                    {a.important_date && <span style={{ fontSize:9, fontWeight:700, color:'#7A9090', background:'rgba(0,0,0,0.05)', borderRadius:99, padding:'2px 9px' }}>📅 {new Date(a.important_date).toLocaleDateString('mr-IN')}</span>}
                    {a.exam_name && <span style={{ fontSize:9, fontWeight:700, color:'#7A9090', background:'rgba(0,0,0,0.05)', borderRadius:99, padding:'2px 9px' }}>🎯 {a.exam_name}</span>}
                  </div>
                  {expanded === a.id && a.details && (
                    <p style={{ fontSize:13, fontWeight:600, color:'#4A6060', lineHeight:1.75, margin:'0 0 10px' }}>{a.details}</p>
                  )}
                  <button onClick={()=>setExpanded(expanded===a.id ? null : a.id)}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, fontWeight:800, color:'#EC4899', padding:0, marginTop:8 }}>
                    {expanded===a.id ? '↑ कमी दाखवा' : '↓ जास्त वाचा'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

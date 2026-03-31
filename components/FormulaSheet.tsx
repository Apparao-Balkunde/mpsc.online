import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Star, Copy, Check, Search } from 'lucide-react';

interface Props { onBack: () => void; }

const FORMULAS = [
  { id:1, category:'गणित', title:'टक्केवारी', formula:'(भाग / एकूण) × 100', example:'50 पैकी 40 = (40/50)×100 = 80%', color:'#3B82F6', emoji:'📊' },
  { id:2, category:'गणित', title:'साधे व्याज', formula:'SI = (P × R × T) / 100', example:'1000, 5%, 2 वर्षे = 100', color:'#3B82F6', emoji:'💰' },
  { id:3, category:'गणित', title:'क्षेत्रफळ — चौरस', formula:'a²', example:'5 × 5 = 25 चौ.मी.', color:'#3B82F6', emoji:'⬜' },
  { id:4, category:'गणित', title:'क्षेत्रफळ — आयत', formula:'लांबी × रुंदी', example:'8 × 5 = 40 चौ.मी.', color:'#3B82F6', emoji:'🔲' },
  { id:5, category:'गणित', title:'वेग-वेळ-अंतर', formula:'अंतर = वेग × वेळ', example:'60 km/h × 2h = 120 km', color:'#3B82F6', emoji:'🚗' },
  { id:6, category:'इतिहास', title:'महाराष्ट्र स्थापना', formula:'1 मे 1960', example:'महाराष्ट्र राज्य स्थापना दिन', color:'#D97706', emoji:'🏛️' },
  { id:7, category:'इतिहास', title:'संविधान लागू', formula:'26 जानेवारी 1950', example:'प्रजासत्ताक दिन', color:'#D97706', emoji:'📜' },
  { id:8, category:'इतिहास', title:'स्वातंत्र्य दिन', formula:'15 ऑगस्ट 1947', example:'भारत स्वतंत्र झाला', color:'#D97706', emoji:'🇮🇳' },
  { id:9, category:'राज्यघटना', title:'मूलभूत हक्क', formula:'कलम 12-35', example:'समता, स्वातंत्र्य, शोषण, धर्म, शिक्षण', color:'#DC2626', emoji:'⚖️' },
  { id:10, category:'राज्यघटना', title:'मार्गदर्शक तत्त्वे', formula:'कलम 36-51', example:'DPSP - Directive Principles', color:'#DC2626', emoji:'📋' },
  { id:11, category:'राज्यघटना', title:'मूलभूत कर्तव्ये', formula:'कलम 51A', example:'42वी दुरुस्ती 1976', color:'#DC2626', emoji:'🎯' },
  { id:12, category:'राज्यघटना', title:'राष्ट्रपती — वय', formula:'किमान 35 वर्षे', example:'भारताचे नागरिक असणे आवश्यक', color:'#DC2626', emoji:'👑' },
  { id:13, category:'भूगोल', title:'महाराष्ट्र जिल्हे', formula:'36 जिल्हे', example:'6 विभाग', color:'#059669', emoji:'🗺️' },
  { id:14, category:'भूगोल', title:'सह्याद्री', formula:'पश्चिम घाट', example:'महाराष्ट्राच्या पश्चिमेला', color:'#059669', emoji:'⛰️' },
  { id:15, category:'भूगोल', title:'गोदावरी नदी', formula:'महाराष्ट्र → आंध्र', example:'दक्षिण भारतातील सर्वात लांब', color:'#059669', emoji:'🌊' },
  { id:16, category:'विज्ञान', title:'Newton 2nd Law', formula:'F = ma', example:'Force = Mass × Acceleration', color:'#7C3AED', emoji:'⚗️' },
  { id:17, category:'विज्ञान', title:'Ohm\'s Law', formula:'V = IR', example:'Voltage = Current × Resistance', color:'#7C3AED', emoji:'⚡' },
  { id:18, category:'विज्ञान', title:'पाण्याचे सूत्र', formula:'H₂O', example:'2 Hydrogen + 1 Oxygen', color:'#7C3AED', emoji:'💧' },
  { id:19, category:'अर्थशास्त्र', title:'GDP', formula:'C + I + G + (X-M)', example:'Consumption+Investment+Govt+Net Exports', color:'#0891B2', emoji:'💹' },
  { id:20, category:'अर्थशास्त्र', title:'Inflation Formula', formula:'(CPI curr - CPI base) / CPI base × 100', example:'Consumer Price Index based', color:'#0891B2', emoji:'📈' },
  { id:21, category:'English', title:'Synonyms — Abandon', formula:'Forsake, Desert, Relinquish', example:'opposite: Adopt, Keep', color:'#8B5CF6', emoji:'🔤' },
  { id:22, category:'English', title:'Active → Passive', formula:'Object + was/were + V3 + by + Subject', example:'Ram eats mango → Mango is eaten by Ram', color:'#8B5CF6', emoji:'📝' },
];

const CATEGORIES = ['सर्व','गणित','इतिहास','राज्यघटना','भूगोल','विज्ञान','अर्थशास्त्र','English'];

const CSS = `
  @keyframes fs-fade { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
  @keyframes fs-pop { 0%{transform:scale(0.8)}60%{transform:scale(1.1)}100%{transform:scale(1)} }
  input:focus { outline:none; border-color:#E8671A !important; }
`;

export const FormulaSheet: React.FC<Props> = ({ onBack }) => {
  const [cat, setCat]       = useState('सर्व');
  const [search, setSearch] = useState('');
  const [starred, setStarred] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('mpsc_starred_formulas')||'[]')); } catch { return new Set(); }
  });
  const [copied, setCopied] = useState<number|null>(null);
  const [tab, setTab]       = useState<'all'|'starred'>('all');

  const toggleStar = (id: number) => {
    setStar(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('mpsc_starred_formulas', JSON.stringify([...next]));
      return next;
    });
  };
  const [,setStar] = useState(starred);
  const starToggle = (id: number) => {
    const next = new Set(starred);
    next.has(id) ? next.delete(id) : next.add(id);
    setStarred(next);
    localStorage.setItem('mpsc_starred_formulas', JSON.stringify([...next]));
  };

  const copy = (text: string, id: number) => {
    navigator.clipboard.writeText(text).catch(()=>{});
    setCopied(id); setTimeout(()=>setCopied(null), 1500);
  };

  const filtered = FORMULAS.filter(f => {
    const matchCat = cat === 'सर्व' || f.category === cat;
    const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase()) || f.formula.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'all' || starred.has(f.id);
    return matchCat && matchSearch && matchTab;
  });

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:600, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
          <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
            <BookOpen size={16} style={{color:'#E8671A'}}/> Formula Sheet
          </div>
          <span style={{ fontSize:10, fontWeight:800, color:'#7A9090', background:'rgba(0,0,0,0.05)', borderRadius:99, padding:'4px 10px' }}>{filtered.length} formulas</span>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'16px' }}>
        {/* Search */}
        <div style={{ position:'relative', marginBottom:12 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#A8A29E' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Formula शोधा..."
            style={{ width:'100%', background:'#fff', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'10px 14px 10px 34px', fontSize:13, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', fontFamily:"'Baloo 2',sans-serif", transition:'border 0.2s' }}/>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', background:'#fff', borderRadius:14, padding:4, marginBottom:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          {[['all','📚 सर्व'],['starred',`⭐ Starred (${starred.size})`]].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k as any)}
              style={{ flex:1, padding:'9px', borderRadius:11, fontWeight:800, fontSize:12, cursor:'pointer', border:'none', background:tab===k?'linear-gradient(135deg,#E8671A,#C4510E)':'transparent', color:tab===k?'#fff':'#7A9090', transition:'all 0.2s' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div style={{ display:'flex', gap:7, overflowX:'auto', marginBottom:16, paddingBottom:4 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={()=>setCat(c)}
              style={{ flexShrink:0, padding:'5px 12px', borderRadius:99, fontSize:10, fontWeight:700, cursor:'pointer', border:`1.5px solid ${cat===c?'#E8671A':'rgba(0,0,0,0.1)'}`, background:cat===c?'rgba(232,103,26,0.1)':'#fff', color:cat===c?'#E8671A':'#7A9090' }}>
              {c}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map((f,i) => (
            <div key={f.id} style={{ background:'#fff', borderRadius:16, padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', animation:`fs-fade 0.2s ease ${i*0.04}s both`, borderLeft:`4px solid ${f.color}` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:20 }}>{f.emoji}</span>
                  <div>
                    <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B' }}>{f.title}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:f.color, textTransform:'uppercase', letterSpacing:'0.08em' }}>{f.category}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>copy(f.formula, f.id)}
                    style={{ background:copied===f.id?'rgba(5,150,105,0.1)':'rgba(0,0,0,0.05)', border:'none', borderRadius:8, padding:'5px 9px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, color:copied===f.id?'#059669':'#7A9090', animation:copied===f.id?'fs-pop 0.3s ease':'none' }}>
                    {copied===f.id?<><Check size={11}/>Copied!</>:<><Copy size={11}/>Copy</>}
                  </button>
                  <button onClick={()=>starToggle(f.id)}
                    style={{ background:starred.has(f.id)?'rgba(245,200,66,0.15)':'rgba(0,0,0,0.05)', border:'none', borderRadius:8, padding:'5px 8px', cursor:'pointer', display:'flex' }}>
                    <Star size={14} fill={starred.has(f.id)?'#F5C842':'none'} style={{color:starred.has(f.id)?'#F5C842':'#D1D5DB'}}/>
                  </button>
                </div>
              </div>
              <div style={{ background:`${f.color}10`, border:`1px solid ${f.color}20`, borderRadius:10, padding:'10px 14px', marginBottom:8, fontFamily:'monospace', fontSize:14, fontWeight:900, color:f.color, letterSpacing:'0.02em' }}>
                {f.formula}
              </div>
              {f.example && (
                <div style={{ fontSize:11, fontWeight:600, color:'#7A9090', lineHeight:1.6 }}>
                  📌 {f.example}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'50px 20px', background:'#fff', borderRadius:18, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>📚</div>
              <div style={{ fontWeight:800, fontSize:14, color:'#1C2B2B' }}>काहीच सापडले नाही</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

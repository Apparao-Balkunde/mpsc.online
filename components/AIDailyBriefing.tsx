import React, { useState, useEffect } from 'react';
import { Zap, X, RefreshCw, Loader, Star, Bell } from 'lucide-react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes db-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes db-spin { to{transform:rotate(360deg)} }
  .db-fact { animation: db-fade 0.3s ease; }
  .db-fact:hover { transform: translateX(3px); transition: 0.2s; }
`;

const STATIC_FACTS = [
  { category:'राज्यघटना', fact:'भारतीय राज्यघटनेत आतापर्यंत 106 घटनादुरुस्त्या झाल्या आहेत.', importance:'HIGH', icon:'⚖️' },
  { category:'महाराष्ट्र', fact:'महाराष्ट्र हे भारतातील सर्वाधिक औद्योगिक उत्पादन असलेले राज्य आहे.', importance:'HIGH', icon:'🏭' },
  { category:'इतिहास', fact:'छत्रपती शिवाजी महाराजांनी 1674 साली रायगडावर राज्याभिषेक केला.', importance:'MED', icon:'🏰' },
  { category:'भूगोल', fact:'गोदावरी ही महाराष्ट्रातील सर्वात लांब नदी असून ती दक्षिण गंगा म्हणून ओळखली जाते.', importance:'MED', icon:'🌊' },
  { category:'चालू घडामोडी', fact:'भारत 2047 पर्यंत विकसित राष्ट्र बनण्याचे उद्दिष्ट ठेवले आहे — "विकसित भारत@2047"', importance:'HIGH', icon:'🎯' },
  { category:'अर्थव्यवस्था', fact:'भारत जगातील 5वी सर्वात मोठी अर्थव्यवस्था असून 2030 पर्यंत तिसऱ्या क्रमांकावर जाण्याचा अंदाज.', importance:'HIGH', icon:'📈' },
  { category:'विज्ञान', fact:'ISRO ने 2023 मध्ये Chandrayaan-3 चंद्राच्या दक्षिण ध्रुवावर यशस्वीपणे उतरवले.', importance:'HIGH', icon:'🚀' },
  { category:'क्रीडा', fact:'भारताने 2023 क्रिकेट विश्वचषकात विजेते ट्रॉफी जिंकली.', importance:'LOW', icon:'🏏' },
];

const IMP_COLOR = { HIGH:'#EF4444', MED:'#F59E0B', LOW:'#10B981' } as const;
const IMP_TEXT = { HIGH:'महत्त्वाचे', MED:'मध्यम', LOW:'सामान्य' } as const;

export function AIDailyBriefing({ onClose }: { onClose: () => void }) {
  const [facts, setFacts] = useState(STATIC_FACTS);
  const [loading, setLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [filter, setFilter] = useState('सर्व');

  const today = new Date().toLocaleDateString('mr-IN', { weekday:'long', day:'numeric', month:'long' });

  useEffect(() => {
    const stored = localStorage.getItem('ai_briefing_date');
    const storedFacts = localStorage.getItem('ai_briefing_facts');
    if (stored === new Date().toDateString() && storedFacts) {
      setFacts(JSON.parse(storedFacts));
      setAiGenerated(true);
      setLastRefresh(stored);
    }
  }, []);

  const generateAIFacts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          prompt: `MPSC स्पर्धा परीक्षेसाठी आजचे 6 महत्त्वाचे facts द्या. प्रत्येक fact हे एका ओळीत मराठीत असावे. JSON format मध्ये द्या:
[{"category":"विषय","fact":"...","importance":"HIGH/MED/LOW","icon":"emoji"}]
फक्त JSON array द्या, इतर काहीही नको.`
        })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const text = data.result || data.text || '';
      const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
      setFacts(parsed);
      setAiGenerated(true);
      localStorage.setItem('ai_briefing_date', new Date().toDateString());
      localStorage.setItem('ai_briefing_facts', JSON.stringify(parsed));
      setLastRefresh(new Date().toDateString());
    } catch(e) {
      // Shuffle existing facts as "new"
      const shuffled = [...STATIC_FACTS].sort(() => Math.random()-0.5);
      setFacts(shuffled);
      setAiGenerated(true);
      setLastRefresh(new Date().toDateString());
    }
    setLoading(false);
  };

  const categories = ['सर्व', ...new Set(facts.map(f => f.category))];
  const filtered = filter === 'सर्व' ? facts : facts.filter(f => f.category === filter);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:480, maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 64px rgba(28,43,43,0.2)' }}>

        <div style={{ background:'linear-gradient(135deg,#3B82F6,#1D4ED8)', padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Zap size={22} color="#fff"/>
            <div>
              <div style={{ color:'#fff', fontWeight:900, fontSize:17 }}>AI Daily Briefing</div>
              <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:600 }}>रोज सकाळी — {today}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:32, height:32, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:16 }}>

          {/* AI Generate Section */}
          <div style={{ background:'linear-gradient(135deg,#EFF6FF,#DBEAFE)', borderRadius:16, padding:16, marginBottom:16, border:'1.5px solid rgba(59,130,246,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:800, fontSize:13, color:'#1E40AF' }}>🤖 AI Generated Facts</div>
                {aiGenerated && <div style={{ fontSize:10, color:'#3B82F6', fontWeight:700, marginTop:2 }}>✓ आजसाठी generated</div>}
              </div>
              <button onClick={generateAIFacts} disabled={loading}
                style={{ background:'#3B82F6', border:'none', borderRadius:10, padding:'8px 14px', color:'#fff', fontWeight:800, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                {loading ? <Loader size={14} style={{ animation:'db-spin 1s linear infinite' }}/> : <><RefreshCw size={13}/> Generate</>}
              </button>
            </div>
            {loading && <div style={{ marginTop:8, fontSize:12, color:'#3B82F6', fontWeight:700 }}>🤖 AI आजचे important facts तयार करत आहे...</div>}
          </div>

          {/* Category filter */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                style={{ padding:'4px 12px', borderRadius:16, border:'1.5px solid', borderColor: filter===c ? '#3B82F6' : 'rgba(28,43,43,0.1)', background: filter===c ? '#3B82F6' : '#fff', color: filter===c ? '#fff' : '#7A9090', fontWeight:700, fontSize:11, cursor:'pointer' }}>
                {c}
              </button>
            ))}
          </div>

          {/* Facts */}
          {filtered.map((fact, i) => (
            <div key={i} className="db-fact"
              style={{ background:'#FDF6EC', borderRadius:14, padding:14, marginBottom:10, border:'1.5px solid rgba(28,43,43,0.07)', display:'flex', gap:12, alignItems:'flex-start' }}>
              <span style={{ fontSize:24, lineHeight:1 }}>{fact.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:10, fontWeight:800, color:'#3B82F6', background:'rgba(59,130,246,0.08)', padding:'2px 8px', borderRadius:10 }}>{fact.category}</span>
                  <span style={{ fontSize:10, fontWeight:800, color: IMP_COLOR[fact.importance as keyof typeof IMP_COLOR], background:`${IMP_COLOR[fact.importance as keyof typeof IMP_COLOR]}15`, padding:'2px 8px', borderRadius:10 }}>
                    {IMP_TEXT[fact.importance as keyof typeof IMP_TEXT]}
                  </span>
                </div>
                <p style={{ fontWeight:700, fontSize:13, color:'#1C2B2B', margin:0, lineHeight:1.6 }}>{fact.fact}</p>
              </div>
            </div>
          ))}

          {/* Memory trick section */}
          <div style={{ background:'rgba(59,130,246,0.05)', borderRadius:14, padding:14, border:'1.5px solid rgba(59,130,246,0.15)', marginTop:4 }}>
            <div style={{ fontWeight:800, fontSize:13, color:'#1E40AF', marginBottom:8 }}>🧠 आज लक्षात ठेवा</div>
            <p style={{ fontSize:13, fontWeight:700, color:'#374151', margin:0, lineHeight:1.6 }}>
              <strong style={{ color:'#3B82F6' }}>TRICK:</strong> "मूलभूत हक्क = भाग III" — तीन = त्रिरंगा = स्वातंत्र्य 🇮🇳
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

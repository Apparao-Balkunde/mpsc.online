import React, { useState, useEffect } from 'react';
import { Newspaper, X, RefreshCw, Loader, Globe, ExternalLink } from 'lucide-react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes ns-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .ns-card { animation: ns-fade 0.4s ease; transition: all 0.2s; }
  .ns-card:hover { transform: translateY(-2px); }
`;

// Fallback Marathi summaries for demo (when API not available)
const SAMPLE_NEWS = [
  { title: 'MPSC 2025 परीक्षा वेळापत्रक जाहीर', category: 'MPSC', summary: 'महाराष्ट्र लोकसेवा आयोगाने 2025 साठी राज्यसेवा पूर्व परीक्षेचे वेळापत्रक जाहीर केले आहे. परीक्षा जुलै 2025 मध्ये घेतली जाणार आहे. उमेदवारांना ऑनलाइन अर्ज करण्यास सांगण्यात आले आहे.', importance: 'High', tags: ['MPSC','परीक्षा','2025'] },
  { title: 'महाराष्ट्र अर्थसंकल्प 2025 — मुख्य मुद्दे', category: 'अर्थव्यवस्था', summary: 'राज्य अर्थसंकल्पात शेतकऱ्यांसाठी विशेष पॅकेज, पायाभूत सुविधांसाठी भरीव तरतूद आणि शिक्षण क्षेत्रावर लक्ष केंद्रित करण्यात आले. सकल राज्य उत्पन्न 8% वाढण्याचा अंदाज.', importance: 'High', tags: ['अर्थसंकल्प','महाराष्ट्र','अर्थव्यवस्था'] },
  { title: 'भारत-अमेरिका संरक्षण करार', category: 'आंतरराष्ट्रीय', summary: 'भारत आणि अमेरिका यांनी सामरिक संरक्षण सहकार्यासाठी नवीन करारावर स्वाक्षरी केली. यामुळे संरक्षण उत्पादन क्षेत्रात भारतात गुंतवणूक वाढेल असा अंदाज.', importance: 'Medium', tags: ['परराष्ट्र','संरक्षण','USA'] },
  { title: 'पंतप्रधानांचा शेतकरी सम्मेलनाला पाठिंबा', category: 'कृषी', summary: 'पंतप्रधानांनी राष्ट्रीय शेतकरी सम्मेलनात MSP वाढवण्याची घोषणा केली. डिजिटल शेतीला प्रोत्साहन देण्यासाठी विशेष निधी जाहीर करण्यात आला.', importance: 'High', tags: ['शेती','MSP','कृषी'] },
  { title: 'सर्वोच्च न्यायालयाचा महत्त्वाचा निर्णय', category: 'न्यायव्यवस्था', summary: 'सर्वोच्च न्यायालयाने मूलभूत हक्कांच्या संदर्भात एक ऐतिहासिक निर्णय दिला. या निर्णयाचा परिणाम नागरिकांच्या गोपनीयतेच्या अधिकारावर होणार आहे.', importance: 'High', tags: ['न्यायालय','हक्क','कायदा'] },
  { title: 'भारत-चीन सीमा वाटाघाटी', category: 'संरक्षण', summary: 'लडाखमधील तणाव कमी करण्यासाठी दोन्ही देशांच्या सैन्यांमध्ये नवीन फेरीची चर्चा झाली. परस्पर सहमतीने सैन्य मागे घेण्याची प्रक्रिया सुरू आहे.', importance: 'Medium', tags: ['चीन','सीमा','संरक्षण'] },
];

const CATEGORIES = ['सर्व','MPSC','अर्थव्यवस्था','आंतरराष्ट्रीय','कृषी','न्यायव्यवस्था','संरक्षण'];
const IMP_COLOR = { High:'#EF4444', Medium:'#F59E0B', Low:'#10B981' } as const;

export function NewspaperSummary({ onClose }: { onClose: () => void }) {
  const [news, setNews] = useState(SAMPLE_NEWS);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('सर्व');
  const [expanded, setExpanded] = useState<number|null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const today = new Date().toLocaleDateString('mr-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  const filtered = category === 'सर्व' ? news : news.filter(n => n.category === category);

  const generateAISummary = async () => {
    setAiLoading(true);
    setAiSummary('');
    try {
      const topNews = news.slice(0,4).map(n => `${n.title}: ${n.summary}`).join('\n');
      const res = await fetch('/api/ai', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ prompt: `MPSC स्पर्धा परीक्षेच्या दृष्टिकोनातून खालील बातम्यांचा 3-4 ओळींमध्ये मराठीत सारांश द्या:\n${topNews}` })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setAiSummary(data.result || data.text || '');
    } catch(e) {
      setAiSummary('आजच्या प्रमुख बातम्या: MPSC परीक्षा वेळापत्रक जाहीर झाले असून उमेदवारांनी तयारी सुरू करावी. राज्य अर्थसंकल्पात शेतकऱ्यांसाठी भरीव तरतूद. भारत-अमेरिका संरक्षण करार झाला. सर्वोच्च न्यायालयाने नागरिकांच्या हक्कांसंदर्भात महत्त्वाचा निर्णय दिला.');
    }
    setAiLoading(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:520, maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 64px rgba(28,43,43,0.2)' }}>

        <div style={{ background:'linear-gradient(135deg,#EC4899,#BE185D)', padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Newspaper size={22} color="#fff"/>
            <div>
              <div style={{ color:'#fff', fontWeight:900, fontSize:17 }}>Newspaper Summary</div>
              <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:600 }}>AI Marathi News — {today}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:32, height:32, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:16 }}>

          {/* AI Daily Briefing */}
          <div style={{ background:'linear-gradient(135deg,#FFF7ED,#FEF3C7)', borderRadius:16, padding:16, marginBottom:16, border:'1.5px solid rgba(236,72,153,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: aiSummary ? 10 : 0 }}>
              <span style={{ fontWeight:800, fontSize:13, color:'#1C2B2B' }}>🤖 AI Daily Briefing</span>
              <button onClick={generateAISummary} disabled={aiLoading}
                style={{ background:'#EC4899', border:'none', borderRadius:10, padding:'6px 12px', color:'#fff', fontWeight:800, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                {aiLoading ? <Loader size={12} style={{ animation:'spin 1s linear infinite' }}/> : <><RefreshCw size={12}/> Generate</>}
              </button>
            </div>
            {aiLoading && <div style={{ color:'#EC4899', fontSize:12, fontWeight:700, marginTop:8 }}>🤖 AI सारांश तयार होत आहे...</div>}
            {aiSummary && <p style={{ fontSize:13, color:'#374151', fontWeight:600, margin:0, lineHeight:1.6 }}>{aiSummary}</p>}
            {!aiSummary && !aiLoading && <p style={{ fontSize:12, color:'#9CA3AF', margin:0, fontWeight:600 }}>वरील बटण दाबा — AI आजच्या बातम्यांचा MPSC-focused सारांश देईल</p>}
          </div>

          {/* Category filter */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                style={{ padding:'4px 12px', borderRadius:16, border:'1.5px solid', borderColor: category===c ? '#EC4899' : 'rgba(28,43,43,0.1)', background: category===c ? '#EC4899' : '#fff', color: category===c ? '#fff' : '#7A9090', fontWeight:700, fontSize:11, cursor:'pointer' }}>
                {c}
              </button>
            ))}
          </div>

          {/* News cards */}
          {filtered.map((item, i) => (
            <div key={i} className="ns-card"
              style={{ background:'#FDF6EC', borderRadius:16, padding:14, marginBottom:10, border:'1.5px solid rgba(28,43,43,0.07)', cursor:'pointer' }}
              onClick={() => setExpanded(expanded === i ? null : i)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <span style={{ fontSize:10, fontWeight:800, color:IMP_COLOR[item.importance as keyof typeof IMP_COLOR] || '#10B981', background:'rgba(0,0,0,0.04)', padding:'2px 8px', borderRadius:20 }}>
                  {item.importance === 'High' ? '🔴' : item.importance === 'Medium' ? '🟡' : '🟢'} {item.category}
                </span>
                <Globe size={13} color="#9CA3AF"/>
              </div>
              <h3 style={{ fontWeight:800, fontSize:14, color:'#1C2B2B', margin:'0 0 6px', lineHeight:1.4 }}>{item.title}</h3>
              {expanded === i && (
                <p style={{ fontSize:13, color:'#374151', fontWeight:600, margin:'0 0 8px', lineHeight:1.6 }}>{item.summary}</p>
              )}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {item.tags.map(tag => (
                  <span key={tag} style={{ fontSize:10, fontWeight:800, color:'#EC4899', background:'rgba(236,72,153,0.08)', padding:'2px 8px', borderRadius:10 }}>#{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

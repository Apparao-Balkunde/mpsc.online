import React, { useState } from 'react';
import { Map, X, ZoomIn, ZoomOut, Info } from 'lucide-react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes mg-fade { from{opacity:0} to{opacity:1} }
  .mg-district { cursor:pointer; transition: all 0.15s ease; }
  .mg-district:hover { opacity:0.75; }
  .mg-tab-btn { transition: all 0.2s; }
  .mg-tab-btn:hover { transform: translateY(-1px); }
`;

const DIVISIONS = [
  { name:'कोकण विभाग', districts:['मुंबई शहर','मुंबई उपनगर','ठाणे','पालघर','रायगड','रत्नागिरी','सिंधुदुर्ग'], color:'#0D6B6E', capital:'मुंबई' },
  { name:'नाशिक विभाग', districts:['नाशिक','धुळे','नंदुरबार','जळगाव','अहमदनगर'], color:'#E8671A', capital:'नाशिक' },
  { name:'औरंगाबाद विभाग', districts:['छत्रपती संभाजीनगर','जालना','परभणी','हिंगोली','बीड','नांदेड','लातूर','धाराशिव'], color:'#8B5CF6', capital:'छत्रपती संभाजीनगर' },
  { name:'अमरावती विभाग', districts:['अमरावती','बुलढाणा','अकोला','वाशिम','यवतमाळ'], color:'#10B981', capital:'अमरावती' },
  { name:'नागपूर विभाग', districts:['नागपूर','वर्धा','यवतमाळ','चंद्रपूर','गडचिरोली','गोंदिया','भंडारा'], color:'#F59E0B', capital:'नागपूर' },
  { name:'पुणे विभाग', districts:['पुणे','सोलापूर','सातारा','सांगली','कोल्हापूर'], color:'#EC4899', capital:'पुणे' },
];

const QUIZ_QUESTIONS = [
  { q:'महाराष्ट्राची राजधानी कोणती?', options:['पुणे','नागपूर','मुंबई','औरंगाबाद'], answer:'मुंबई' },
  { q:'महाराष्ट्रात एकूण किती जिल्हे आहेत?', options:['32','36','38','40'], answer:'36' },
  { q:'महाराष्ट्राची हिवाळी राजधानी कोणती?', options:['पुणे','नागपूर','अमरावती','नाशिक'], answer:'नागपूर' },
  { q:'सह्याद्री पर्वतरांग कोणत्या दिशेने जाते?', options:['पूर्व-पश्चिम','उत्तर-दक्षिण','ईशान्य-नैऋत्य','वायव्य-आग्नेय'], answer:'उत्तर-दक्षिण' },
  { q:'गोदावरी नदीचे उगमस्थान कोणते?', options:['महाबळेश्वर','त्र्यंबकेश्वर','नाशिक','पुणे'], answer:'त्र्यंबकेश्वर' },
  { q:'महाराष्ट्राचा सर्वात मोठा जिल्हा क्षेत्रफळाने कोणता?', options:['अहमदनगर','पुणे','नाशिक','नागपूर'], answer:'अहमदनगर' },
];

export function MapsGeography({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<typeof DIVISIONS[0]|null>(null);
  const [tab, setTab] = useState<'map'|'quiz'|'rivers'>('map');
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAns, setQuizAns] = useState<string|null>(null);
  const [quizDone, setQuizDone] = useState(false);

  const handleQuizAnswer = (opt: string) => {
    if (quizAns) return;
    setQuizAns(opt);
    if (opt === QUIZ_QUESTIONS[quizIdx].answer) setQuizScore(s=>s+1);
    setTimeout(() => {
      if (quizIdx+1 >= QUIZ_QUESTIONS.length) { setQuizDone(true); return; }
      setQuizIdx(i=>i+1);
      setQuizAns(null);
    }, 1100);
  };

  const q = QUIZ_QUESTIONS[quizIdx];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:520, maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 64px rgba(28,43,43,0.2)' }}>

        <div style={{ background:'linear-gradient(135deg,#0D6B6E,#094D50)', padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Map size={22} color="#fff"/>
            <div>
              <div style={{ color:'#fff', fontWeight:900, fontSize:17 }}>Maps & Geography</div>
              <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:600 }}>Maharashtra Interactive Map</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:32, height:32, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'2px solid #F5F0E8' }}>
          {[['map','🗺️ विभाग'],['quiz','❓ Quiz'],['rivers','🌊 नद्या']] .map(([t,label]) => (
            <button key={t} onClick={() => setTab(t as any)} className="mg-tab-btn"
              style={{ flex:1, padding:'11px', fontWeight:800, fontSize:12, border:'none', cursor:'pointer', background:'none', color: tab===t ? '#0D6B6E' : '#7A9090', borderBottom: tab===t ? '2px solid #0D6B6E' : '2px solid transparent', marginBottom:-2 }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:16 }}>

          {tab === 'map' && (
            <>
              <p style={{ fontSize:12, fontWeight:700, color:'#7A9090', marginBottom:12 }}>विभागावर tap करा — माहिती पहा</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                {DIVISIONS.map(div => (
                  <button key={div.name} onClick={() => setSelected(selected?.name === div.name ? null : div)}
                    style={{ background: selected?.name === div.name ? div.color : `${div.color}15`, border:`2px solid ${selected?.name === div.name ? div.color : div.color+'30'}`, borderRadius:14, padding:'14px 12px', textAlign:'left', cursor:'pointer', transition:'all 0.2s' }}>
                    <div style={{ fontWeight:800, fontSize:13, color: selected?.name === div.name ? '#fff' : '#1C2B2B', marginBottom:2 }}>{div.name}</div>
                    <div style={{ fontSize:10, color: selected?.name === div.name ? 'rgba(255,255,255,0.8)' : '#7A9090', fontWeight:600 }}>🏛️ {div.capital}</div>
                    <div style={{ fontSize:10, color: selected?.name === div.name ? 'rgba(255,255,255,0.8)' : div.color, fontWeight:700, marginTop:4 }}>{div.districts.length} जिल्हे</div>
                  </button>
                ))}
              </div>
              {selected && (
                <div style={{ background:`${selected.color}10`, borderRadius:16, padding:16, border:`2px solid ${selected.color}30` }}>
                  <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', marginBottom:10 }}>📍 {selected.name}</div>
                  <div style={{ fontWeight:700, fontSize:12, color:'#7A9090', marginBottom:8 }}>जिल्हे ({selected.districts.length}):</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {selected.districts.map(d => (
                      <span key={d} style={{ background:'#fff', border:`1.5px solid ${selected.color}40`, borderRadius:10, padding:'4px 10px', fontSize:11, fontWeight:700, color:'#1C2B2B' }}>{d}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ background:'#F0FDF4', borderRadius:14, padding:14, marginTop:14, border:'1.5px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontWeight:800, fontSize:13, color:'#059669', marginBottom:8 }}>📊 महाराष्ट्र — Key Facts</div>
                {[['एकूण जिल्हे','36'],['एकूण विभाग','6'],['क्षेत्रफळ','3,07,713 km²'],['लोकसंख्या (2011)','11.24 कोटी'],['राजभाषा','मराठी'],['स्थापना दिन','1 मे 1960']].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(16,185,129,0.1)', fontSize:12 }}>
                    <span style={{ fontWeight:700, color:'#374151' }}>{k}</span>
                    <span style={{ fontWeight:800, color:'#059669' }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'quiz' && (
            <>
              {!quizDone ? (
                <div>
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, fontWeight:800, color:'#7A9090', marginBottom:4 }}>प्रश्न {quizIdx+1}/{QUIZ_QUESTIONS.length} • Score: {quizScore}</div>
                    <div style={{ height:4, background:'#F5F0E8', borderRadius:2 }}>
                      <div style={{ height:'100%', background:'#0D6B6E', width:`${(quizIdx/QUIZ_QUESTIONS.length)*100}%`, borderRadius:2 }}/>
                    </div>
                  </div>
                  <div style={{ background:'linear-gradient(135deg,#E0F7F7,#CCEFEF)', borderRadius:16, padding:20, textAlign:'center', marginBottom:14 }}>
                    <p style={{ fontWeight:800, fontSize:16, color:'#1C2B2B', margin:0, lineHeight:1.5 }}>{q.q}</p>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {q.options.map(opt => {
                      const isCorrect = opt === q.answer;
                      const isSelected = opt === quizAns;
                      let bg='#FDF6EC', border='rgba(28,43,43,0.1)', color='#1C2B2B';
                      if (quizAns) {
                        if (isCorrect) { bg='rgba(16,185,129,0.1)'; border='#10B981'; color='#059669'; }
                        else if (isSelected) { bg='rgba(220,38,38,0.08)'; border='#EF4444'; color='#DC2626'; }
                      }
                      return (
                        <button key={opt} onClick={() => handleQuizAnswer(opt)}
                          style={{ background:bg, border:`2px solid ${border}`, borderRadius:12, padding:'14px 10px', color, fontWeight:800, fontSize:13, cursor:quizAns ? 'default' : 'pointer', transition:'all 0.2s', fontFamily:"'Baloo 2',sans-serif" }}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:20 }}>
                  <div style={{ fontSize:60, marginBottom:16 }}>{quizScore >= 5 ? '🏆' : quizScore >= 3 ? '😊' : '💪'}</div>
                  <h2 style={{ fontWeight:900, fontSize:24, color:'#1C2B2B' }}>{quizScore}/{QUIZ_QUESTIONS.length} बरोबर!</h2>
                  <button onClick={() => { setQuizIdx(0); setQuizScore(0); setQuizAns(null); setQuizDone(false); }}
                    style={{ marginTop:16, background:'#0D6B6E', border:'none', borderRadius:14, padding:'13px 28px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer' }}>
                    पुन्हा खेळा
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'rivers' && (
            <div>
              {[
                { name:'गोदावरी', origin:'त्र्यंबकेश्वर, नाशिक', length:'1465 km', direction:'पश्चिम → पूर्व', sea:'बंगालचा उपसागर', cities:'नाशिक, औरंगाबाद, नांदेड' },
                { name:'कृष्णा', origin:'महाबळेश्वर, सातारा', length:'1400 km', direction:'पश्चिम → पूर्व', sea:'बंगालचा उपसागर', cities:'सातारा, सांगली, कोल्हापूर' },
                { name:'तापी', origin:'मुलताई, मध्य प्रदेश', length:'724 km', direction:'पूर्व → पश्चिम', sea:'अरबी समुद्र', cities:'अमरावती, जळगाव, धुळे' },
                { name:'नर्मदा', origin:'अमरकंटक', length:'1312 km', direction:'पूर्व → पश्चिम', sea:'अरबी समुद्र', cities:'नंदुरबार (महाराष्ट्र)' },
              ].map(r => (
                <div key={r.name} style={{ background:'#EFF6FF', borderRadius:14, padding:14, marginBottom:10, border:'1.5px solid rgba(59,130,246,0.2)' }}>
                  <div style={{ fontWeight:900, fontSize:15, color:'#1E40AF', marginBottom:6 }}>🌊 {r.name} नदी</div>
                  {[['उगम',r.origin],['एकूण लांबी',r.length],['दिशा',r.direction],['मिळते',r.sea],['महाराष्ट्रातील शहरे',r.cities]].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', gap:8, fontSize:12, marginBottom:3 }}>
                      <span style={{ fontWeight:800, color:'#374151', minWidth:80 }}>{k}:</span>
                      <span style={{ fontWeight:600, color:'#1E40AF' }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

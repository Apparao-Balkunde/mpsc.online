import React, { useState } from 'react';
import { ArrowLeft, MapPin, ChevronRight } from 'lucide-react';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }

const TOPICS = [
  {
    id:'geography', title:'भूगोल', emoji:'🗺️', color:'#059669',
    qs:[
      {q:'महाराष्ट्रात एकूण किती जिल्हे आहेत?', opts:['32','34','36','38'], a:2, exp:'महाराष्ट्रात 36 जिल्हे आणि 6 महसूल विभाग आहेत.'},
      {q:'महाराष्ट्राची सर्वात उंच शिखर कोणते?', opts:['हरिश्चंद्रगड','कळसूबाई','महाबळेश्वर','सिंधुदुर्ग'], a:1, exp:'कळसूबाई — उंची 1646 मीटर — अहमदनगर जिल्हा'},
      {q:'गोदावरी नदी कोठून उगम पावते?', opts:['महाबळेश्वर','त्र्यंबकेश्वर','भीमाशंकर','नाशिक'], a:1, exp:'गोदावरी — त्र्यंबकेश्वर, नाशिक — दक्षिण गंगा'},
      {q:'ताडोबा व्याघ्र प्रकल्प कोणत्या जिल्ह्यात?', opts:['नागपूर','चंद्रपूर','गडचिरोली','भंडारा'], a:1, exp:'ताडोबा-अंधारी — चंद्रपूर — महाराष्ट्रातील सर्वात मोठा'},
      {q:'कोयना धरण कोणत्या नदीवर आहे?', opts:['कृष्णा','भीमा','कोयना','वारणा'], a:2, exp:'कोयना धरण — कोयना नदी — सातारा जिल्हा — सर्वात मोठे जलविद्युत'},
      {q:'लोणार सरोवर कोणत्या प्रकारचे सरोवर आहे?', opts:['ज्वालामुखी','उल्का','हिमनदी','नदी'], a:1, exp:'लोणार — उल्का विवर सरोवर — बुलढाणा — जगातील दुर्मिळ'},
    ]
  },
  {
    id:'history', title:'इतिहास', emoji:'📜', color:'#D97706',
    qs:[
      {q:'छत्रपती शिवाजी महाराजांचा राज्याभिषेक कधी झाला?', opts:['1670','1672','1674','1676'], a:2, exp:'राज्याभिषेक: 6 जून 1674 — रायगड — हिंदवी स्वराज्य स्थापना'},
      {q:'भारतातील पहिले स्वातंत्र्ययुद्ध 1857 मध्ये महाराष्ट्रातून कोण होते?', opts:['वासुदेव बळवंत फडके','नानासाहेब पेशवे','तात्या टोपे','लक्ष्मीबाई'], a:2, exp:'तात्या टोपे — नाना साहेब यांचे सेनापती — 1857 चे महान नेते'},
      {q:'महाराष्ट्र राज्याची स्थापना कधी झाली?', opts:['1 जानेवारी 1960','1 मे 1960','15 ऑगस्ट 1960','26 जानेवारी 1961'], a:1, exp:'महाराष्ट्र — 1 मे 1960 — भाषावार प्रांत रचनेनुसार — महाराष्ट्र दिन'},
      {q:'रायगड किल्ला कोणत्या जिल्ह्यात आहे?', opts:['पुणे','सातारा','रायगड','ठाणे'], a:2, exp:'रायगड किल्ला — रायगड जिल्हा — शिवाजी महाराजांची राजधानी'},
      {q:'वारकरी संप्रदायाचे प्रवर्तक कोण?', opts:['ज्ञानेश्वर','नामदेव','एकनाथ','तुकाराम'], a:0, exp:'संत ज्ञानेश्वर — 13 वे शतक — भक्ती चळवळ — ज्ञानेश्वरी लेखक'},
      {q:'गांधीजींनी 1917 मध्ये महाराष्ट्रात कोणते सत्याग्रह केले?', opts:['मिठाचा सत्याग्रह','खेडा','वर्धा','मुळशी'], a:2, exp:'वर्धा — गांधीजींचा आश्रम — सेवाग्राम — महाराष्ट्रातील क्रियाकलाप'},
    ]
  },
  {
    id:'culture', title:'संस्कृती व कला', emoji:'🎭', color:'#8B5CF6',
    qs:[
      {q:'महाराष्ट्राचा राज्य प्राणी कोणता?', opts:['वाघ','शेकरू','बिबट्या','गव'], a:1, exp:'शेकरू (Giant Squirrel) — महाराष्ट्राचा राज्य प्राणी'},
      {q:'पुणे येथे कोणता उत्सव प्रसिद्ध आहे?', opts:['नवरात्री','गणपती उत्सव','दिवाळी','होळी'], a:1, exp:'पुण्याचा गणपती उत्सव — बाळ गंगाधर टिळकांनी सार्वजनिक केला — 1893'},
      {q:'लावणी हा कोणता प्रकार आहे?', opts:['संगीत','नृत्य','कला','उत्सव'], a:1, exp:'लावणी — महाराष्ट्राचा पारंपरिक नृत्यप्रकार — तमाशा लोककलेचा भाग'},
      {q:'वारली चित्रकला कोणत्या जिल्ह्यात प्रसिद्ध?', opts:['नाशिक','पालघर','नंदुरबार','धुळे'], a:1, exp:'वारली — पालघर जिल्हा — आदिवासी लोककला — GI Tag मिळालेली'},
      {q:'महाराष्ट्राचा राज्य पक्षी कोणता?', opts:['मोर','हारियाल','बुलबुल','सुगरण'], a:1, exp:'हरियाल (Green Pigeon) — महाराष्ट्राचा राज्य पक्षी'},
      {q:'पंढरपूर कोणत्या नदीकाठी आहे?', opts:['कृष्णा','भीमा','गोदावरी','वारणा'], a:1, exp:'पंढरपूर — भीमा (चंद्रभागा) नदीकाठी — सोलापूर जिल्हा — विठोबाचे धाम'},
    ]
  },
  {
    id:'economy', title:'अर्थव्यवस्था', emoji:'💹', color:'#2563EB',
    qs:[
      {q:'महाराष्ट्र कोणत्या पिकात प्रथम क्रमांकावर आहे?', opts:['तांदूळ','ऊस','कापूस','गहू'], a:1, exp:'ऊस उत्पादनात महाराष्ट्र देशात अग्रेसर — साखर कारखाने सर्वाधिक'},
      {q:'मुंबई शेअर बाजाराची स्थापना?', opts:['1850','1875','1900','1947'], a:1, exp:'BSE — Bombay Stock Exchange — 1875 — आशियातील सर्वात जुना'},
      {q:'SEEPZ कुठे आहे?', opts:['पुणे','मुंबई','नागपूर','औरंगाबाद'], a:1, exp:'SEEPZ — Santa Cruz Electronics Export Processing Zone — अंधेरी, मुंबई'},
      {q:'महाराष्ट्राची औद्योगिक राजधानी कोणती?', opts:['मुंबई','पुणे','नागपूर','औरंगाबाद'], a:1, exp:'पुणे — IT, Auto Industry — Pune Pune is called Oxford of the East also'},
      {q:'नागपूर कशासाठी प्रसिद्ध आहे?', opts:['संत्री','द्राक्षे','केळी','आंबा'], a:0, exp:'नागपूर — संत्री (Orange City) — विदर्भातील प्रमुख फळ उत्पादन'},
      {q:'महाराष्ट्रात किती IT Parks आहेत (approx)?', opts:['10','25','50 पेक्षा जास्त','100 पेक्षा जास्त'], a:2, exp:'महाराष्ट्रात 50+ IT Parks — पुणे, मुंबई, नाशिक, नागपूर — देशात #1 IT state'},
    ]
  },
];

const CSS = `
@keyframes mg2-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes mg2-pop{0%{transform:scale(0.85)}60%{transform:scale(1.06)}100%{transform:scale(1)}}
`;

export const MaharashtraGK: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]     = useState<'menu'|'quiz'|'result'>('menu');
  const [topic, setTopic]     = useState<typeof TOPICS[0]|null>(null);
  const [idx, setIdx]         = useState(0);
  const [answers, setAnswers] = useState<Record<number,number>>({});

  const start = (t: typeof TOPICS[0]) => { setTopic(t); setIdx(0); setAnswers({}); setPhase('quiz'); };
  const handle = (optIdx: number) => {
    if (answers[idx] !== undefined) return;
    const correct = optIdx === topic!.qs[idx].a;
    setAnswers(p => ({ ...p, [idx]: optIdx }));
    updateProgress(1, correct ? 1 : 0);
    addXP(correct ? 5 : 1);
  };

  const qs    = topic?.qs || [];
  const score = Object.entries(answers).filter(([i,a]) => qs[+i]?.a === +a).length;
  const acc   = qs.length > 0 ? Math.round((score / qs.length) * 100) : 0;

  if (phase === 'menu') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}><MapPin size={16} style={{color:'#D97706'}}/> Maharashtra GK</div>
      </div>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ fontWeight:700, fontSize:13, color:'#7A9090', marginBottom:16, textAlign:'center' }}>महाराष्ट्र विशेष — MPSC साठी अत्यावश्यक!</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {TOPICS.map(t => (
            <button key={t.id} onClick={() => start(t)}
              style={{ background:'#fff', border:`2px solid ${t.color}20`, borderRadius:20, padding:'20px 14px', cursor:'pointer', textAlign:'center', boxShadow:`0 3px 14px ${t.color}10`, animation:'mg2-fade 0.3s ease', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:`linear-gradient(90deg,${t.color},${t.color}80)` }}/>
              <div style={{ fontSize:32, marginBottom:8 }}>{t.emoji}</div>
              <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B', marginBottom:3 }}>{t.title}</div>
              <div style={{ fontSize:10, fontWeight:700, color:t.color }}>{t.qs.length} MCQ</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (phase === 'result') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#0D1929)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{CSS}</style>
      <div style={{ fontSize:56, marginBottom:12, animation:'mg2-pop 0.5s ease' }}>{acc>=80?'🏆':acc>=60?'⭐':'📚'}</div>
      <div style={{ fontWeight:900, fontSize:36, letterSpacing:'-0.04em', marginBottom:4 }}>{score}/{qs.length}</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>{acc}% accuracy</div>
      <div style={{ fontSize:13, fontWeight:700, color:topic?.color, marginBottom:24 }}>{topic?.emoji} {topic?.title}</div>
      <div style={{ display:'flex', gap:8, width:'100%', maxWidth:360 }}>
        <button onClick={() => { const t=`🏛️ Maharashtra GK!\n${topic?.title}\n\n${score}/${qs.length} · ${acc}%\n\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank'); }}
          style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤</button>
        <button onClick={() => start(topic!)}
          style={{ flex:1, background:`linear-gradient(135deg,${topic?.color},${topic?.color}CC)`, border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🔁</button>
        <button onClick={() => setPhase('menu')}
          style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'13px', color:'#fff', fontWeight:800, cursor:'pointer' }}>Menu</button>
      </div>
    </div>
  );

  const q = qs[idx];
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => setPhase('menu')} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:900, fontSize:12, color:'#1C2B2B' }}>{topic?.emoji} {topic?.title}</div>
          <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:4, marginTop:5, overflow:'hidden' }}>
            <div style={{ height:'100%', background:topic?.color, borderRadius:99, width:`${((idx+1)/qs.length)*100}%`, transition:'width 0.4s' }}/>
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:'#7A9090' }}>{idx+1}/{qs.length}</span>
        <span style={{ fontWeight:900, fontSize:12, color:'#10B981', background:'rgba(16,185,129,0.1)', borderRadius:99, padding:'3px 9px' }}>{score}✓</span>
      </div>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'16px' }}>
        {q && (
          <>
            <div style={{ background:'#fff', borderRadius:20, padding:'20px 18px', marginBottom:12, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', animation:'mg2-fade 0.25s ease' }}>
              <p style={{ fontWeight:700, fontSize:'clamp(0.9rem,3.5vw,1.05rem)', lineHeight:1.75, color:'#1C2B2B', margin:0 }}>{q.q}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:14 }}>
              {q.opts.map((opt, i) => {
                const isAns = i === q.a, isSel = answers[idx] === i, isAnswered = answers[idx] !== undefined;
                let bg='#fff', border='rgba(0,0,0,0.08)', color='#1C2B2B';
                if (isAnswered && isAns)           { bg='rgba(5,150,105,0.08)'; border='rgba(5,150,105,0.4)'; color='#065F46'; }
                if (isAnswered && isSel && !isAns) { bg='rgba(220,38,38,0.06)'; border='rgba(220,38,38,0.3)'; color='#991B1B'; }
                if (isAnswered && !isSel && !isAns){ color='#9CA3AF'; }
                return (
                  <button key={i} disabled={isAnswered} onClick={() => handle(i)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:13, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:13, textAlign:'left', cursor:isAnswered?'default':'pointer', transition:'all 0.15s' }}>
                    <span style={{ width:24, height:24, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, background:isAnswered&&isAns?'#059669':isAnswered&&isSel&&!isAns?'#DC2626':'rgba(0,0,0,0.06)', color:isAnswered&&(isAns||(isSel&&!isAns))?'#fff':'#7A9090' }}>
                      {isAnswered&&isAns?'✓':isAnswered&&isSel&&!isAns?'✗':String.fromCharCode(65+i)}
                    </span>
                    <span style={{ flex:1 }}>{opt}</span>
                  </button>
                );
              })}
            </div>
            {answers[idx] !== undefined && (
              <div style={{ background:`${topic?.color}0D`, border:`1px solid ${topic?.color}25`, borderRadius:14, padding:'12px 14px', marginBottom:14, fontSize:12, fontWeight:600, color:'#374151', lineHeight:1.7, animation:'mg2-fade 0.2s ease' }}>
                📌 {q.exp}
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              {idx > 0 && <button onClick={() => setIdx(p=>p-1)} style={{ flex:1, background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'12px', color:'#7A9090', fontWeight:800, cursor:'pointer' }}>←</button>}
              {idx+1 < qs.length
                ? <button onClick={() => setIdx(p=>p+1)} disabled={answers[idx]===undefined}
                    style={{ flex:2, background:answers[idx]!==undefined?`linear-gradient(135deg,${topic?.color},${topic?.color}CC)`:'rgba(0,0,0,0.1)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, cursor:answers[idx]!==undefined?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>पुढे →</button>
                : <button onClick={() => setPhase('result')} style={{ flex:2, background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🏆 Result</button>
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowLeft, BookOpen, ChevronRight, RotateCcw } from 'lucide-react';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }

const CHAPTERS = [
  {
    id: 'sandhi', title: 'संधी', emoji: '🔗', color: '#E8671A',
    qs: [
      { q: 'स्वर + स्वर = ? (विद्या + आलय)', opts: ['विद्यालय','विद्यआलय','विद्यायलय','विद्यलय'], a: 0, exp: 'अ/आ + अ/आ = आ — "विद्या + आलय = विद्यालय" — स्वर संधी' },
      { q: '"नमस्कार" या शब्दात कोणती संधी आहे?', opts: ['विसर्ग संधी','स्वर संधी','व्यंजन संधी','कोणतीही नाही'], a: 0, exp: 'नमः + कार = नमस्कार — विसर्ग संधी' },
      { q: '"देवालय" = ?', opts: ['देव + आलय','देवा + लय','देव + लय','देवाल + य'], a: 0, exp: 'देव + आलय = देवालय — आ + आ = आ' },
      { q: 'गणेश + उत्सव = ?', opts: ['गणेशोत्सव','गणेशउत्सव','गणेशात्सव','गणेशसोत्सव'], a: 0, exp: 'अ + उ = ओ — "गणेश + उत्सव = गणेशोत्सव"' },
      { q: '"वागीश" यात कोणती संधी?', opts: ['स्वर','व्यंजन','विसर्ग','यापैकी नाही'], a: 1, exp: 'वाक् + ईश = वागीश — व्यंजन संधी' },
    ]
  },
  {
    id: 'samas', title: 'समास', emoji: '📎', color: '#2563EB',
    qs: [
      { q: '"राजपुत्र" हा कोणता समास?', opts: ['तत्पुरुष','द्वंद्व','बहुव्रीही','कर्मधारय'], a: 0, exp: 'राजाचा पुत्र = राजपुत्र — तत्पुरुष समास (ष. वि. संबंध)' },
      { q: '"नीलकमल" हा समास?', opts: ['द्वंद्व','कर्मधारय','तत्पुरुष','द्विगु'], a: 1, exp: 'नील असे कमल = नीलकमल — कर्मधारय (विशेषण + विशेष्य)' },
      { q: '"पंचवटी" म्हणजे?', opts: ['पाच झाडे','पाच वड','पाच वटांचा समूह','पाच वनस्पती'], a: 2, exp: 'पंच वटांचा समूह = पंचवटी — द्विगु समास (संख्या + नाम)' },
      { q: '"सीताराम" हा समास?', opts: ['तत्पुरुष','द्वंद्व','कर्मधारय','बहुव्रीही'], a: 1, exp: 'सीता आणि राम = सीताराम — द्वंद्व समास (दोन समान महत्त्वाचे शब्द)' },
      { q: '"चतुर्भुज" म्हणजे?', opts: ['चार हात असलेला','चार बाहू','चार + भुज','चतुर असा भुज'], a: 0, exp: 'चार भुज ज्याला त्याला = चतुर्भुज — बहुव्रीही (इतर गोष्ट सुचवतो)' },
    ]
  },
  {
    id: 'alankar', title: 'अलंकार', emoji: '✨', color: '#7C3AED',
    qs: [
      { q: '"चंद्रमुखी" मध्ये कोणता अलंकार?', opts: ['उपमा','रूपक','उत्प्रेक्षा','अनुप्रास'], a: 1, exp: 'उपमेय = उपमान — "चंद्र हेच मुख" — रूपक अलंकार' },
      { q: '"मुखं चंद्राप्रमाणे आहे" मध्ये?', opts: ['रूपक','उपमा','उत्प्रेक्षा','यमक'], a: 1, exp: 'उपमेय + वाचक शब्द (प्रमाणे) + उपमान = उपमा अलंकार' },
      { q: '"कमळासारखे नेत्र जणू चंद्रच" — कोणता अलंकार?', opts: ['उपमा','रूपक','उत्प्रेक्षा','अपन्हुती'], a: 2, exp: '"जणू" वाचक शब्द + कल्पना = उत्प्रेक्षा अलंकार' },
      { q: '"का का करी कावळा" — अलंकार?', opts: ['यमक','अनुप्रास','उपमा','रूपक'], a: 1, exp: '"क" वर्णाची पुनरावृत्ती = अनुप्रास अलंकार' },
      { q: '"तो वीर सिंह आहे" — कोणता अलंकार?', opts: ['उत्प्रेक्षा','उपमा','रूपक','अनुप्रास'], a: 2, exp: '"सिंह" हेच उपमान = उपमेय — "आहे" शब्द — रूपक अलंकार' },
    ]
  },
  {
    id: 'vibhakti', title: 'विभक्ती', emoji: '📐', color: '#059669',
    qs: [
      { q: '"रामाने सफरचंद खाल्ले" — "रामाने" कोणती विभक्ती?', opts: ['प्रथमा','द्वितीया','तृतीया','चतुर्थी'], a: 2, exp: '"ने/शी/आधारे" = तृतीया विभक्ती — कर्ता सकर्मक क्रियापदासोबत' },
      { q: '"मुलाला शाळेत जायचे आहे" — "मुलाला" कोणती विभक्ती?', opts: ['तृतीया','चतुर्थी','षष्ठी','सप्तमी'], a: 1, exp: '"ला/स" = चतुर्थी विभक्ती — संप्रदान' },
      { q: '"घरापासून शाळा दूर आहे" — "घरापासून" कोणती विभक्ती?', opts: ['चतुर्थी','पंचमी','षष्ठी','सप्तमी'], a: 1, exp: '"पासून/हून/आहून" = पंचमी विभक्ती — अपादान' },
      { q: '"रामाचे पुस्तक" — "रामाचे" कोणती विभक्ती?', opts: ['पंचमी','षष्ठी','सप्तमी','अष्टमी'], a: 1, exp: '"चा/ची/चे" = षष्ठी विभक्ती — संबंध' },
      { q: 'प्रथमा विभक्तीचे प्रत्यय कोणते?', opts: ['ने, शी','ला, स','चा, ची, चे','आ, ई, े'], a: 3, exp: 'प्रथमा = ०, आ, ई, े — "राम, रामा, रामी"' },
    ]
  },
];

const CSS = `
@keyframes mg-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes mg-pop{0%{transform:scale(0.85)}60%{transform:scale(1.06)}100%{transform:scale(1)}}
`;

export const MarathiGrammar: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]     = useState<'menu'|'quiz'|'result'>('menu');
  const [chapter, setChapter] = useState<typeof CHAPTERS[0]|null>(null);
  const [idx, setIdx]         = useState(0);
  const [answers, setAnswers] = useState<Record<number,number>>({});

  const start = (ch: typeof CHAPTERS[0]) => {
    setChapter(ch); setIdx(0); setAnswers({}); setPhase('quiz');
  };

  const handle = (optIdx: number) => {
    if (answers[idx] !== undefined) return;
    const correct = optIdx === chapter!.qs[idx].a;
    setAnswers(p => ({ ...p, [idx]: optIdx }));
    updateProgress(1, correct ? 1 : 0);
    addXP(correct ? 5 : 1);
  };

  const qs    = chapter?.qs || [];
  const score = Object.entries(answers).filter(([i,a]) => qs[+i]?.a === a).length;
  const acc   = qs.length > 0 ? Math.round((score / qs.length) * 100) : 0;

  // ── MENU ──
  if (phase === 'menu') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
          <BookOpen size={16} style={{color:'#E8671A'}}/> मराठी व्याकरण
        </div>
      </div>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ fontWeight:700, fontSize:13, color:'#7A9090', marginBottom:16, textAlign:'center' }}>Chapter निवडा — प्रत्येकी 5 प्रश्न</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {CHAPTERS.map(ch => (
            <button key={ch.id} onClick={() => start(ch)}
              style={{ background:'#fff', border:`1.5px solid ${ch.color}20`, borderRadius:18, padding:'18px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, boxShadow:`0 2px 12px ${ch.color}10`, textAlign:'left', animation:'mg-fade 0.3s ease' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:`${ch.color}15`, border:`1.5px solid ${ch.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{ch.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:2 }}>{ch.title}</div>
                <div style={{ fontSize:11, fontWeight:600, color:'#7A9090' }}>{ch.qs.length} प्रश्न · MPSC Marathi साठी महत्त्वाचे</div>
              </div>
              <ChevronRight size={18} style={{ color:'#D1D5DB' }}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── RESULT ──
  if (phase === 'result') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#0D1929)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{CSS}</style>
      <div style={{ fontSize:18, fontWeight:800, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>{chapter?.emoji} {chapter?.title}</div>
      <div style={{ fontSize:56, marginBottom:12, animation:'mg-pop 0.5s ease' }}>{acc>=80?'🏆':acc>=60?'⭐':'📚'}</div>
      <div style={{ fontWeight:900, fontSize:36, letterSpacing:'-0.04em', marginBottom:4 }}>{score}/{qs.length}</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>{acc}% accuracy</div>
      <div style={{ fontSize:13, fontWeight:800, color:'#A78BFA', marginBottom:24 }}>+{score*5+qs.length} ⚡ XP!</div>
      <div style={{ display:'flex', gap:8, width:'100%', maxWidth:360 }}>
        <button onClick={() => { const t=`📝 मराठी व्याकरण Quiz!\n${chapter?.title}\n\n${score}/${qs.length} · ${acc}%\n\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank'); }}
          style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤</button>
        <button onClick={() => start(chapter!)}
          style={{ flex:1, background:`linear-gradient(135deg,${chapter?.color},${chapter?.color}CC)`, border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🔁</button>
        <button onClick={() => setPhase('menu')}
          style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'13px', color:'#fff', fontWeight:800, cursor:'pointer' }}>Menu</button>
      </div>
    </div>
  );

  // ── QUIZ ──
  const q = qs[idx];
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => setPhase('menu')} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:900, fontSize:12, color:'#1C2B2B' }}>{chapter?.emoji} {chapter?.title}</div>
          <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:4, marginTop:5, overflow:'hidden' }}>
            <div style={{ height:'100%', background:chapter?.color, borderRadius:99, width:`${((idx+1)/qs.length)*100}%`, transition:'width 0.4s' }}/>
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:'#7A9090' }}>{idx+1}/{qs.length}</span>
        <div style={{ fontWeight:900, fontSize:13, color:'#10B981', background:'rgba(16,185,129,0.1)', borderRadius:99, padding:'4px 10px' }}>{score}✓</div>
      </div>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'16px' }}>
        {q && (
          <>
            <div style={{ background:'#fff', borderRadius:20, padding:'20px 18px', marginBottom:12, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', animation:'mg-fade 0.25s ease' }}>
              <p style={{ fontWeight:700, fontSize:'clamp(0.9rem,3.5vw,1.05rem)', lineHeight:1.75, color:'#1C2B2B', margin:0 }}>{q.q}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:14 }}>
              {q.opts.map((opt, i) => {
                const isAns = i === q.a, isSel = answers[idx] === i, isAnswered = answers[idx] !== undefined;
                let bg = '#fff', border = 'rgba(0,0,0,0.08)', color = '#1C2B2B';
                if (isAnswered && isAns)           { bg='rgba(5,150,105,0.08)';  border='rgba(5,150,105,0.4)'; color='#065F46'; }
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
              <div style={{ background:`${chapter?.color}0D`, border:`1px solid ${chapter?.color}25`, borderRadius:14, padding:'12px 14px', marginBottom:14, fontSize:12, fontWeight:600, color:'#374151', lineHeight:1.7, animation:'mg-fade 0.2s ease' }}>
                📌 {q.exp}
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              {idx > 0 && <button onClick={() => setIdx(p=>p-1)} style={{ flex:1, background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'12px', color:'#7A9090', fontWeight:800, cursor:'pointer' }}>← मागे</button>}
              {idx+1 < qs.length
                ? <button onClick={() => setIdx(p=>p+1)} disabled={answers[idx]===undefined}
                    style={{ flex:2, background:answers[idx]!==undefined?`linear-gradient(135deg,${chapter?.color},${chapter?.color}CC)`:'rgba(0,0,0,0.1)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, cursor:answers[idx]!==undefined?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>पुढे <ChevronRight size={14}/></button>
                : <button onClick={() => setPhase('result')}
                    style={{ flex:2, background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🏆 Result</button>
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
};

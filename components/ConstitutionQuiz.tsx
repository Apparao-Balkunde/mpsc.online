import React, { useState } from 'react';
import { ArrowLeft, Scale, ChevronRight, BookMarked } from 'lucide-react';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }

const CHAPTERS = [
  {
    id:'basics', title:'मूलभूत संकल्पना', emoji:'📋', color:'#2563EB',
    questions:[
      { q:'भारतीय राज्यघटना कधी अंमलात आली?', opts:['15 ऑगस्ट 1947','26 जानेवारी 1950','2 ऑक्टोबर 1950','15 ऑगस्ट 1950'], a:1, exp:'26 जानेवारी 1950 रोजी राज्यघटना अंमलात आली — "प्रजासत्ताक दिन".' },
      { q:'राज्यघटनेत मूळतः किती कलमे होती?', opts:['395','444','448','450'], a:0, exp:'मूळ राज्यघटनेत 395 कलमे, 8 परिशिष्टे आणि 22 भाग होते.' },
      { q:'राज्यघटनेचे जनक कोण?', opts:['महात्मा गांधी','जवाहरलाल नेहरू','डॉ. बाबासाहेब आंबेडकर','सरदार पटेल'], a:2, exp:'डॉ. भीमराव आंबेडकर — Drafting Committee चे अध्यक्ष होते.' },
      { q:'भारत हे "Sovereign Socialist Secular Democratic Republic" असल्याचे कोठे नमूद आहे?', opts:['कलम 1','प्रस्तावना','कलम 368','कलम 13'], a:1, exp:'42 व्या घटनादुरुस्तीने 1976 मध्ये "Socialist" आणि "Secular" हे शब्द प्रस्तावनेत जोडले.' },
      { q:'राज्यघटना कोणी मंजूर केली?', opts:['ब्रिटिश संसद','संविधान सभा','सर्वोच्च न्यायालय','लोकसभा'], a:1, exp:'26 नोव्हेंबर 1949 रोजी संविधान सभेने राज्यघटना मंजूर केली.' },
    ]
  },
  {
    id:'rights', title:'मूलभूत हक्क', emoji:'⚖️', color:'#7C3AED',
    questions:[
      { q:'भारतीय राज्यघटनेत किती मूलभूत हक्क आहेत?', opts:['5','6','7','8'], a:1, exp:'कलम 12-35: समता, स्वातंत्र्य, शोषणाविरुद्ध, धर्मस्वातंत्र्य, सांस्कृतिक-शैक्षणिक, घटनात्मक उपाय असे 6 हक्क.' },
      { q:'Right to Property हा मूलभूत हक्क कोणत्या घटनादुरुस्तीने रद्द झाला?', opts:['42 वी','44 वी','45 वी','46 वी'], a:1, exp:'44 व्या घटनादुरुस्ती (1978) ने Right to Property (Art 19(f) व 31) रद्द केला.' },
      { q:'राज्यघटनेच्या कोणत्या कलमाला "Heart and Soul of Constitution" म्हणतात?', opts:['कलम 14','कलम 21','कलम 32','कलम 356'], a:2, exp:'डॉ. आंबेडकरांनी कलम 32 ला "Heart and Soul" म्हटले — घटनात्मक उपाय — SC कडे जाण्याचा हक्क.' },
      { q:'कलम 21 कशाशी संबंधित आहे?', opts:['समानतेचा हक्क','स्वातंत्र्याचा हक्क','जीवन आणि स्वातंत्र्याचे संरक्षण','शोषणाविरुद्ध हक्क'], a:2, exp:'कलम 21: "No person shall be deprived of his life or personal liberty..."' },
      { q:'शिक्षणाचा हक्क कोणत्या कलमाखाली आहे?', opts:['कलम 21A','कलम 22','कलम 25','कलम 29'], a:0, exp:'कलम 21A (86 वी घटनादुरुस्ती, 2002): 6-14 वर्षे वयोगटातील मुलांना मोफत व सक्तीचे शिक्षण.' },
    ]
  },
  {
    id:'dpsp', title:'राज्य धोरणाची मार्गदर्शक तत्त्वे', emoji:'🏛️', color:'#059669',
    questions:[
      { q:'DPSP कोणत्या देशाच्या राज्यघटनेतून घेण्यात आले?', opts:['ब्रिटन','अमेरिका','आयर्लंड','फ्रान्स'], a:2, exp:'DPSP (Directive Principles of State Policy) आयर्लंडच्या राज्यघटनेतून घेण्यात आले.' },
      { q:'DPSP कोणत्या कलमांमध्ये नमूद आहेत?', opts:['कलम 36-51','कलम 52-62','कलम 12-35','कलम 1-11'], a:0, exp:'कलम 36-51 — भाग IV मध्ये DPSP नमूद आहेत.' },
      { q:'DPSP न्यायालयात लागू करता येतात का?', opts:['होय','नाही','काही प्रमाणात','SC ठरवतो'], a:1, exp:'DPSP "Non-Justiciable" आहेत — न्यायालयात enforce करता येत नाहीत, पण राज्य सरकारवर नैतिक बंधन आहे.' },
      { q:'समान नागरी संहिता (UCC) कोणत्या कलमाखाली येते?', opts:['कलम 44','कलम 45','कलम 46','कलम 47'], a:0, exp:'कलम 44: राज्याने नागरिकांसाठी समान नागरी संहिता (UCC) लागू करण्याचा प्रयत्न करावा.' },
    ]
  },
  {
    id:'amendments', title:'महत्त्वाच्या घटनादुरुस्त्या', emoji:'✏️', color:'#E8671A',
    questions:[
      { q:'73 वी घटनादुरुस्ती कशाशी संबंधित आहे?', opts:['नगरपालिका','पंचायती राज','शिक्षण','संसद'], a:1, exp:'73 वी घटनादुरुस्ती (1992): पंचायती राजला घटनात्मक दर्जा — भाग IX जोडला.' },
      { q:'42 व्या घटनादुरुस्तीस काय म्हणतात?', opts:['लघु राज्यघटना','मिनी कॉन्स्टिट्यूशन','दोन्ही','कोणतेही नाही'], a:2, exp:'42 व्या घटनादुरुस्तीस (1976) "Mini Constitution" किंवा "लघु राज्यघटना" म्हणतात — सर्वाधिक बदल.' },
      { q:'RTI Act कोणत्या वर्षी अस्तित्वात आला?', opts:['2000','2003','2005','2007'], a:2, exp:'Right to Information Act 2005 मध्ये अस्तित्वात आला — नागरिकांना सरकारी माहितीचा अधिकार.' },
      { q:'कोणत्या घटनादुरुस्तीने मतदानाचे वय 21 वरून 18 केले?', opts:['52 वी','61 वी','73 वी','74 वी'], a:1, exp:'61 व्या घटनादुरुस्ती (1989): कलम 326 मध्ये बदल — मतदानाचे वय 21 वरून 18 वर्षे.' },
    ]
  },
];

const CSS = `
@keyframes cq-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes cq-pop{0%{transform:scale(0.85)}60%{transform:scale(1.06)}100%{transform:scale(1)}}
`;

export const ConstitutionQuiz: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]   = useState<'chapters'|'quiz'|'result'>('chapters');
  const [chapter, setChapter] = useState<typeof CHAPTERS[0]|null>(null);
  const [idx, setIdx]       = useState(0);
  const [answers, setAnswers] = useState<Record<number,number>>({});

  const startChapter = (ch: typeof CHAPTERS[0]) => {
    setChapter(ch); setIdx(0); setAnswers({}); setPhase('quiz');
  };

  const handle = (optIdx: number) => {
    if (answers[idx] !== undefined) return;
    const correct = optIdx === chapter!.questions[idx].a;
    setAnswers(prev => ({ ...prev, [idx]: optIdx }));
    updateProgress(1, correct ? 1 : 0);
    addXP(correct ? 5 : 1);
  };

  const score = chapter ? Object.entries(answers).filter(([i,a]) => chapter.questions[+i]?.a === a).length : 0;
  const qs    = chapter?.questions || [];
  const q     = qs[idx];
  const acc   = qs.length > 0 ? Math.round((score/qs.length)*100) : 0;

  // ── CHAPTERS ──
  if (phase === 'chapters') return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}><Scale size={16} style={{color:'#2563EB'}}/> राज्यघटना Quiz</div>
      </div>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ fontWeight:700, fontSize:13, color:'#7A9090', marginBottom:16, textAlign:'center' }}>Chapter निवडा</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {CHAPTERS.map(ch => (
            <button key={ch.id} onClick={() => startChapter(ch)}
              style={{ background:'#fff', border:`1.5px solid ${ch.color}20`, borderRadius:18, padding:'18px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, boxShadow:`0 2px 12px ${ch.color}10`, textAlign:'left', animation:'cq-fade 0.3s ease' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:`${ch.color}15`, border:`1.5px solid ${ch.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{ch.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:3 }}>{ch.title}</div>
                <div style={{ fontSize:10, fontWeight:700, color:ch.color }}>{ch.questions.length} प्रश्न</div>
              </div>
              <ChevronRight size={18} style={{ color:'#D1D5DB', flexShrink:0 }}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── RESULT ──
  if (phase === 'result') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#0F1729)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{CSS}</style>
      <div style={{ fontSize:18, fontWeight:800, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>{chapter?.emoji} {chapter?.title}</div>
      <div style={{ fontSize:56, marginBottom:12, animation:'cq-pop 0.5s ease' }}>{acc>=80?'🏆':acc>=60?'⭐':'📚'}</div>
      <div style={{ fontWeight:900, fontSize:36, letterSpacing:'-0.04em', marginBottom:4 }}>{score}/{qs.length}</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>{acc}% accuracy</div>
      <div style={{ fontSize:13, fontWeight:800, color:'#A78BFA', marginBottom:28 }}>+{score*5+qs.length} ⚡ XP earned!</div>
      <div style={{ display:'flex', gap:8, width:'100%', maxWidth:360 }}>
        <button onClick={() => { const t=`⚖️ राज्यघटना Quiz — ${chapter?.title}!\n\n${score}/${qs.length} · ${acc}%\n\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank'); }}
          style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤</button>
        <button onClick={() => startChapter(chapter!)}
          style={{ flex:1, background:'linear-gradient(135deg,#2563EB,#1D4ED8)', border:'none', borderRadius:14, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🔁</button>
        <button onClick={() => setPhase('chapters')}
          style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'13px', color:'#fff', fontWeight:800, cursor:'pointer' }}>Chapters</button>
      </div>
    </div>
  );

  // ── QUIZ ──
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => setPhase('chapters')} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:900, fontSize:12, color:'#1C2B2B' }}>{chapter?.emoji} {chapter?.title}</div>
          <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:4, marginTop:5, overflow:'hidden' }}>
            <div style={{ height:'100%', background:chapter?.color, borderRadius:99, width:`${((idx+1)/qs.length)*100}%`, transition:'width 0.4s' }}/>
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:'#7A9090' }}>{idx+1}/{qs.length}</span>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'16px' }}>
        {q && (
          <>
            <div style={{ background:'#fff', borderRadius:20, padding:'20px 18px', marginBottom:12, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', animation:'cq-fade 0.25s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                <BookMarked size={12} style={{ color:chapter?.color }}/><span style={{ fontSize:9, fontWeight:800, color:chapter?.color, textTransform:'uppercase', letterSpacing:'0.1em' }}>राज्यघटना</span>
              </div>
              <p style={{ fontWeight:700, fontSize:'clamp(0.9rem,3.5vw,1.05rem)', lineHeight:1.75, color:'#1C2B2B', margin:0 }}>{q.q}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
              {q.opts.map((opt, i) => {
                const isAnswered = answers[idx] !== undefined;
                const isSel = answers[idx] === i, isAns = i === q.a;
                let bg = '#fff', border = 'rgba(0,0,0,0.08)', color = '#1C2B2B';
                if (isAnswered && isAns)           { bg='rgba(5,150,105,0.08)';  border='rgba(5,150,105,0.4)';  color='#065F46'; }
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
              <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:14, padding:'12px 14px', marginBottom:14, fontSize:12, fontWeight:600, color:'#1E40AF', lineHeight:1.65, animation:'cq-fade 0.2s ease' }}>
                ⚖️ {q.exp}
              </div>
            )}
            <div style={{ display:'flex', gap:8 }}>
              {idx > 0 && <button onClick={() => setIdx(p=>p-1)} style={{ flex:1, background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'12px', color:'#7A9090', fontWeight:800, cursor:'pointer' }}>← मागे</button>}
              {idx+1 < qs.length
                ? <button onClick={() => setIdx(p=>p+1)} disabled={answers[idx]===undefined} style={{ flex:2, background:answers[idx]!==undefined?`linear-gradient(135deg,${chapter?.color},${chapter?.color}CC)`:'rgba(0,0,0,0.1)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, cursor:answers[idx]!==undefined?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>पुढे <ChevronRight size={14}/></button>
                : <button onClick={() => setPhase('result')} style={{ flex:2, background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, cursor:'pointer' }}>🏆 Result</button>
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
};

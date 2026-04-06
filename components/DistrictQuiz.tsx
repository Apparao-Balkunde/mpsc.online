import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Check, X, SkipForward, Trophy } from 'lucide-react';
import { updateProgress } from '../App';

interface Props { onBack: () => void; }

const QUESTIONS = [
  {q:'महाराष्ट्राची राजधानी कोणती?',opts:['पुणे','नागपूर','मुंबई','औरंगाबाद'],a:2,fact:'मुंबई — आर्थिक राजधानी, हिवाळी राजधानी नागपूर'},
  {q:'36 जिल्ह्यांचे किती विभाग आहेत?',opts:['5','6','7','8'],a:1,fact:'महाराष्ट्रात 6 विभाग — कोकण, पुणे, नाशिक, औरंगाबाद, अमरावती, नागपूर'},
  {q:'गोदावरी नदी कोणत्या जिल्ह्यातून उगम पावते?',opts:['नाशिक','पुणे','अहमदनगर','नागपूर'],a:0,fact:'गोदावरी — नाशिक जवळ त्र्यंबकेश्वर येथून उगम'},
  {q:'लोणार सरोवर कोणत्या जिल्ह्यात आहे?',opts:['अकोला','बुलढाणा','वाशिम','यवतमाळ'],a:1,fact:'लोणार — जगातील दुर्मिळ खाऱ्या पाण्याचे सरोवर, बुलढाणा'},
  {q:'ताडोबा व्याघ्र प्रकल्प कोणत्या जिल्ह्यात?',opts:['नागपूर','चंद्रपूर','गडचिरोली','भंडारा'],a:1,fact:'ताडोबा — महाराष्ट्रातील सर्वात मोठा व्याघ्र प्रकल्प'},
  {q:'अजिंठा-वेरूळ लेणी कोणत्या जिल्ह्यात?',opts:['नाशिक','औरंगाबाद','पुणे','अहमदनगर'],a:1,fact:'औरंगाबाद — UNESCO World Heritage Site'},
  {q:'कृष्णा नदी महाराष्ट्रात कोणत्या जिल्ह्यातून वाहते?',opts:['सातारा-सांगली','पुणे-कोल्हापूर','सोलापूर-नाशिक','सातारा-सोलापूर'],a:0,fact:'कृष्णा — सातारा, सांगली मधून वाहते'},
  {q:'महाराष्ट्रात सर्वाधिक पाऊस कुठे पडतो?',opts:['मुंबई','रत्नागिरी','सिंधुदुर्ग','ठाणे'],a:2,fact:'सिंधुदुर्ग — आंबोली हे महाराष्ट्रातील सर्वाधिक पर्जन्याचे ठिकाण'},
  {q:'सह्याद्री पर्वतरांगा कोणत्या दिशेला आहे?',opts:['पूर्व','पश्चिम','उत्तर','दक्षिण'],a:1,fact:'सह्याद्री — महाराष्ट्राच्या पश्चिमेला, Western Ghats'},
  {q:'नागपूर जिल्हा कोणत्या विभागात येतो?',opts:['अमरावती','नागपूर','औरंगाबाद','नाशिक'],a:1,fact:'नागपूर हे नागपूर विभागाचे मुख्यालय आणि हिवाळी राजधानी'},
  {q:'वैनगंगा नदी कोणत्या जिल्ह्यातून वाहते?',opts:['अमरावती','भंडारा','वर्धा','चंद्रपूर'],a:1,fact:'वैनगंगा — भंडारा, गोंदिया मधून वाहते'},
  {q:'महाराष्ट्रात सर्वाधिक लोकसंख्या असलेला जिल्हा?',opts:['पुणे','मुंबई उपनगर','ठाणे','नाशिक'],a:1,fact:'मुंबई उपनगर — सर्वाधिक लोकसंख्या'},
];

const CSS = `@keyframes dq-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes dq-spin{to{transform:rotate(360deg)}}`;

export const DistrictQuiz: React.FC<Props> = ({ onBack }) => {
  const [idx, setIdx]       = useState(0);
  const [answered, setAnswered] = useState<number|null>(null);
  const [score, setScore]   = useState(0);
  const [done, setDone]     = useState(false);
  const [qs, setQs]         = useState(() => [...QUESTIONS].sort(()=>Math.random()-0.5).slice(0,10));

  const q = qs[idx];

  const handleAnswer = (i: number) => {
    if (answered!==null) return;
    setAnswered(i);
    const correct = i===q.a;
    if (correct) setScore(s=>s+1);
    updateProgress(1, correct?1:0);
    setTimeout(() => {
      if (idx+1>=qs.length) setDone(true);
      else { setIdx(x=>x+1); setAnswered(null); }
    }, 1800);
  };

  if (done) return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0F1117,#1A1228)',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:28,padding:'36px 28px',maxWidth:380,width:'100%',textAlign:'center'}}>
        <div style={{fontSize:56,marginBottom:12}}>{score>=8?'🏆':score>=6?'⭐':'📚'}</div>
        <div style={{fontWeight:900,fontSize:30,letterSpacing:'-0.04em',marginBottom:4}}>{score}/{qs.length}</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',fontWeight:600,marginBottom:24}}>Maharashtra Geography Quiz</div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={()=>{setQs([...QUESTIONS].sort(()=>Math.random()-0.5).slice(0,10));setIdx(0);setAnswered(null);setScore(0);setDone(false);}}
            style={{flex:1,background:'linear-gradient(135deg,#E8671A,#C4510E)',border:'none',borderRadius:14,padding:'14px',color:'#fff',fontWeight:900,cursor:'pointer'}}>पुन्हा</button>
          <button onClick={onBack} style={{flex:1,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:14,padding:'14px',color:'#fff',fontWeight:800,cursor:'pointer'}}>Home</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0F1117,#1A1228)',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",color:'#fff',paddingBottom:40}}>
      <style>{CSS}</style>
      <div style={{padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={onBack} style={{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:9,padding:'8px 10px',cursor:'pointer',color:'#fff',display:'flex'}}><ArrowLeft size={14}/></button>
        <div style={{flex:1,background:'rgba(255,255,255,0.1)',borderRadius:99,height:5,overflow:'hidden'}}>
          <div style={{height:'100%',background:'linear-gradient(90deg,#059669,#34D399)',borderRadius:99,width:`${((idx)/qs.length)*100}%`,transition:'width 0.4s'}}/>
        </div>
        <span style={{fontSize:12,fontWeight:900,color:'rgba(255,255,255,0.7)'}}>{idx+1}/{qs.length}</span>
        <div style={{background:'rgba(5,150,105,0.2)',border:'1px solid rgba(5,150,105,0.4)',borderRadius:99,padding:'4px 12px',fontSize:12,fontWeight:900,color:'#34D399'}}>
          {score} ✓
        </div>
      </div>

      <div style={{maxWidth:480,margin:'0 auto',padding:'10px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <MapPin size={16} style={{color:'#059669'}}/>
          <span style={{fontSize:11,fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Maharashtra Geography</span>
        </div>

        <div style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'22px 18px',marginBottom:14,animation:'dq-fade 0.3s ease',minHeight:120}}>
          <p style={{fontWeight:700,fontSize:'clamp(1rem,4vw,1.15rem)',lineHeight:1.7,color:'#fff',margin:0}}>{q.question}</p>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:9}}>
          {q.opts.map((opt,i)=>{
            const isSel=answered===i, isAns=i===q.a;
            let bg='rgba(255,255,255,0.06)', border='rgba(255,255,255,0.12)', color='#fff';
            if (answered!==null&&isAns)           {bg='rgba(5,150,105,0.2)';border='rgba(5,150,105,0.5)';}
            if (answered!==null&&isSel&&!isAns)   {bg='rgba(220,38,38,0.2)';border='rgba(220,38,38,0.5)';}
            if (answered!==null&&!isSel&&!isAns)  {color='rgba(255,255,255,0.3)';}
            return (
              <button key={i} disabled={answered!==null} onClick={()=>handleAnswer(i)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'13px 15px',borderRadius:14,border:`1.5px solid ${border}`,background:bg,color,fontWeight:700,fontSize:13,textAlign:'left',cursor:answered!==null?'default':'pointer',transition:'all 0.2s'}}>
                <span style={{width:26,height:26,borderRadius:8,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,background:'rgba(255,255,255,0.1)'}}>
                  {answered!==null&&isAns?'✓':answered!==null&&isSel&&!isAns?'✗':String.fromCharCode(65+i)}
                </span>
                <span style={{flex:1}}>{opt}</span>
              </button>
            );
          })}
        </div>

        {answered!==null&&(
          <div style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'13px 16px',marginTop:12,animation:'dq-fade 0.3s ease',fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.7)',lineHeight:1.65}}>
            💡 {q.fact}
          </div>
        )}
      </div>
    </div>
  );
};

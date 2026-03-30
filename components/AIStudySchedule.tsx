import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Loader, Calendar, Clock, Target, ChevronRight, Download } from 'lucide-react';

interface Props { onBack: () => void; }

const EXAMS = ['राज्यसेवा पूर्व','PSI/STI/ASO','Combined Group B','Combined Group C','तलाठी भरती'];
const HOURS = ['1-2 तास','2-3 तास','3-4 तास','4-5 तास','5+ तास'];

interface DayPlan { day:string; topics:string[]; hours:string; tip:string; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes as-spin { to{transform:rotate(360deg)} }
  @keyframes as-fade { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes as-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
`;

export const AIStudySchedule: React.FC<Props> = ({ onBack }) => {
  const [exam, setExam]       = useState('राज्यसेवा पूर्व');
  const [examDate, setExamDate] = useState('');
  const [hours, setHours]     = useState('2-3 तास');
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<DayPlan[]|null>(null);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState(false);

  const daysLeft = examDate ? Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000*60*60*24)) : null;

  const generate = async () => {
    if (!examDate) { setError('Exam date निवडा!'); return; }
    setLoading(true); setError(''); setSchedule(null);

    const prompt = `तू MPSC exam expert आहेस. खालील details साठी 7-day study schedule बनव:

Exam: ${exam}
Exam Date: ${examDate} (${daysLeft} दिवस बाकी)
Daily Study Time: ${hours}

JSON format मध्ये फक्त हे दे — बाकी काही नाही:
[
  {
    "day": "Day 1 - सोमवार",
    "topics": ["topic 1", "topic 2", "topic 3"],
    "hours": "${hours}",
    "tip": "एक practical tip"
  }
]

Rules:
- 7 days plan
- Realistic topics — MPSC syllabus नुसार
- Mix of subjects रोज
- Marathi मध्ये topics
- Short practical tips`;

    try {
      const res = await fetch('/api/ai', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          system:'You are an MPSC study planner. Respond with valid JSON array only, no markdown.',
          messages:[{role:'user', content:prompt}],
          max_tokens:1200
        })
      });
      const data = await res.json();
      const text = data?.text || '';
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('JSON नाही');
      const parsed: DayPlan[] = JSON.parse(match[0]);
      setSchedule(parsed);
      localStorage.setItem('mpsc_ai_schedule', JSON.stringify({ exam, examDate, hours, plan:parsed, savedAt: new Date().toISOString() }));
      setSaved(true);
    } catch {
      setError('Schedule generate करता आले नाही. पुन्हा try करा!');
    } finally { setLoading(false); }
  };

  const loadSaved = () => {
    try {
      const s = JSON.parse(localStorage.getItem('mpsc_ai_schedule')||'{}');
      if (s.plan) { setSchedule(s.plan); setExam(s.exam); setExamDate(s.examDate); setHours(s.hours); }
    } catch {}
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14} /></button>
        <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6, flex:1 }}>
          <Sparkles size={16} style={{ color:'#7C3AED' }} /> AI Study Schedule
        </div>
        {saved && <button onClick={loadSaved} style={{ fontSize:11, fontWeight:700, color:'#7C3AED', background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:9, padding:'5px 10px', cursor:'pointer' }}>📂 Load Saved</button>}
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px' }}>
        {/* Input form */}
        <div style={{ background:'#fff', borderRadius:22, padding:'22px', marginBottom:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#7C3AED,#E8671A,#7C3AED)', backgroundSize:'200%', animation:'as-shimmer 3s linear infinite' }} />

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:800, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:8 }}>Exam निवडा</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {EXAMS.map(e => (
                <button key={e} onClick={() => setExam(e)}
                  style={{ padding:'6px 12px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', border:`1.5px solid ${exam===e?'#7C3AED':'rgba(0,0,0,0.1)'}`, background:exam===e?'rgba(124,58,237,0.1)':'#F8F5F0', color:exam===e?'#7C3AED':'#7A9090' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:800, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:8 }}>Exam Date</label>
            <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
              style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'11px 14px', fontSize:14, fontWeight:700, color:'#1C2B2B', boxSizing:'border-box', fontFamily:"'Baloo 2',sans-serif" }} />
            {daysLeft !== null && daysLeft > 0 && (
              <div style={{ marginTop:6, fontSize:11, fontWeight:800, color:daysLeft<30?'#DC2626':daysLeft<90?'#D97706':'#059669' }}>
                ⏰ {daysLeft} दिवस बाकी
              </div>
            )}
          </div>

          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:11, fontWeight:800, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:8 }}>रोज किती वेळ?</label>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {HOURS.map(h => (
                <button key={h} onClick={() => setHours(h)}
                  style={{ padding:'6px 12px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', border:`1.5px solid ${hours===h?'#E8671A':'rgba(0,0,0,0.1)'}`, background:hours===h?'rgba(232,103,26,0.1)':'#F8F5F0', color:hours===h?'#E8671A':'#7A9090' }}>
                  {h}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={loading}
            style={{ width:'100%', background:'linear-gradient(135deg,#7C3AED,#6D28D9)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:14, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 20px rgba(124,58,237,0.3)', opacity:loading?0.8:1 }}>
            {loading
              ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'as-spin 0.8s linear infinite' }} /> Plan तयार होत आहे...</>
              : <><Sparkles size={16} /> 7-Day Schedule Generate करा</>}
          </button>
          {error && <div style={{ marginTop:10, background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:10, padding:'10px', fontSize:12, color:'#DC2626', fontWeight:700 }}>⚠️ {error}</div>}
        </div>

        {/* Schedule display */}
        {schedule && (
          <div style={{ display:'flex', flexDirection:'column', gap:12, animation:'as-fade 0.4s ease' }}>
            <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', display:'flex', alignItems:'center', gap:8 }}>
              <Calendar size={16} style={{ color:'#7C3AED' }} /> तुमचा 7-Day Plan
            </div>
            {schedule.map((day, i) => (
              <div key={i} style={{ background:'#fff', borderRadius:18, padding:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', animation:`as-fade 0.3s ease ${i*0.06}s both`, borderLeft:`4px solid ${i===0?'#E8671A':i===1?'#7C3AED':i===2?'#2563EB':i===3?'#059669':i===4?'#D97706':i===5?'#DC2626':'#EC4899'}` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B' }}>{day.day}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:99, padding:'3px 10px' }}>
                    <Clock size={10} style={{ color:'#7C3AED' }} />
                    <span style={{ fontSize:10, fontWeight:800, color:'#7C3AED' }}>{day.hours}</span>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:10 }}>
                  {day.topics.map((t, ti) => (
                    <div key={ti} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:700, color:'#4A6060' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#7C3AED', flexShrink:0 }} />
                      {t}
                    </div>
                  ))}
                </div>
                {day.tip && (
                  <div style={{ background:'#FFF7ED', border:'1px solid rgba(232,103,26,0.15)', borderRadius:10, padding:'8px 12px', fontSize:11, color:'#C4510E', fontWeight:600 }}>
                    💡 {day.tip}
                  </div>
                )}
              </div>
            ))}
            <div style={{ background:'rgba(5,150,105,0.06)', border:'1px solid rgba(5,150,105,0.2)', borderRadius:14, padding:'12px 16px', fontSize:12, color:'#047857', fontWeight:700, textAlign:'center' }}>
              ✅ हा plan localStorage मध्ये save झाला आहे!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

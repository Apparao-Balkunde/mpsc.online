import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Target, ChevronRight, Bell } from 'lucide-react';

interface Props { onClose: () => void; }

const EXAMS = [
  { id:'rajyaseva', name:'राज्यसेवा पूर्व', color:'#2563EB', emoji:'🏛️', date:'2025-08-15' },
  { id:'psi',       name:'PSI / STI / ASO', color:'#7C3AED', emoji:'⚖️', date:'2025-09-20' },
  { id:'groupb',    name:'Combined Group B', color:'#059669', emoji:'📋', date:'2025-10-10' },
  { id:'groupc',    name:'Combined Group C', color:'#D97706', emoji:'📝', date:'2025-11-05' },
  { id:'talathi',   name:'तलाठी भरती',       color:'#DC2626', emoji:'🌾', date:'2025-12-01' },
];

const STORAGE_KEY = 'mpsc_exam_dates';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes ec-fade { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes ec-tick { 0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)} }
  @keyframes ec-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
`;

export const ExamCountdown: React.FC<Props> = ({ onClose }) => {
  const [customDates, setCustomDates] = useState<Record<string,string>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  });
  const [editing, setEditing] = useState<string|null>(null);

  const saveDate = (id: string, date: string) => {
    const updated = { ...customDates, [id]: date };
    setCustomDates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setEditing(null);
  };

  const getDays = (examId: string, defaultDate: string) => {
    const dateStr = customDates[examId] || defaultDate;
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getUrgency = (days: number) => {
    if (days < 0)   return { label:'परीक्षा झाली', color:'#94A3B8', bg:'rgba(148,163,184,0.1)' };
    if (days <= 30) return { label:'लवकरच!', color:'#DC2626', bg:'rgba(220,38,38,0.08)' };
    if (days <= 90) return { label:'तयारी करा', color:'#D97706', bg:'rgba(217,119,6,0.08)' };
    return { label:'वेळ आहे', color:'#059669', bg:'rgba(5,150,105,0.08)' };
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:420, maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'ec-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#2563EB,#7C3AED,#DC2626)', backgroundSize:'200%', animation:'ec-shimmer 3s linear infinite', flexShrink:0 }} />

        <div style={{ padding:'20px 20px 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:'rgba(37,99,235,0.1)', border:'1.5px solid rgba(37,99,235,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Clock size={18} style={{ color:'#2563EB' }} />
              </div>
              <div>
                <div style={{ fontWeight:900, fontSize:16, color:'#1C2B2B' }}>Exam Countdown</div>
                <div style={{ fontSize:11, color:'#7A9090', fontWeight:600 }}>परीक्षेचे किती दिवस बाकी</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'0 20px 24px', display:'flex', flexDirection:'column', gap:12 }}>
          {EXAMS.map(exam => {
            const days    = getDays(exam.id, exam.date);
            const urgency = getUrgency(days);
            const isEdit  = editing === exam.id;

            return (
              <div key={exam.id} style={{ background:urgency.bg, border:`1.5px solid ${exam.color}25`, borderRadius:18, padding:'16px', transition:'all 0.2s' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:24 }}>{exam.emoji}</span>
                    <div>
                      <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B' }}>{exam.name}</div>
                      <div style={{ fontSize:10, fontWeight:700, color:urgency.color }}>{urgency.label}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:900, fontSize:28, color:exam.color, letterSpacing:'-0.05em', lineHeight:1, animation: days <= 30 && days > 0 ? 'ec-tick 1s ease infinite' : 'none' }}>
                      {days > 0 ? days : '—'}
                    </div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#7A9090' }}>{days > 0 ? 'दिवस' : ''}</div>
                  </div>
                </div>

                {isEdit ? (
                  <div style={{ display:'flex', gap:8 }}>
                    <input type="date"
                      defaultValue={customDates[exam.id] || exam.date}
                      onChange={e => saveDate(exam.id, e.target.value)}
                      style={{ flex:1, background:'#fff', border:`1.5px solid ${exam.color}50`, borderRadius:10, padding:'8px 12px', fontSize:13, fontWeight:700, color:'#1C2B2B', outline:'none' }} />
                    <button onClick={() => setEditing(null)}
                      style={{ background:'rgba(0,0,0,0.06)', border:'none', borderRadius:10, padding:'8px 12px', cursor:'pointer', fontSize:12, fontWeight:800, color:'#7A9090' }}>
                      रद्द
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditing(exam.id)}
                    style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(0,0,0,0.05)', border:'none', borderRadius:10, padding:'7px 12px', fontSize:11, fontWeight:700, color:'#7A9090', cursor:'pointer' }}>
                    <Calendar size={11} /> तारीख बदला
                  </button>
                )}

                {days > 0 && days <= 365 && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:5, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:exam.color, borderRadius:99, width:`${Math.max(0, 100 - (days/365)*100)}%`, transition:'width 0.8s ease' }} />
                    </div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#7A9090', marginTop:4 }}>
                      {Math.round(100 - (days/365)*100)}% वेळ निघून गेला
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ background:'rgba(37,99,235,0.05)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:14, padding:'12px 16px', marginTop:4 }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#2563EB', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>💡 टीप</div>
            <p style={{ fontSize:11, color:'#4A6060', fontWeight:600, lineHeight:1.6, margin:0 }}>
              तारीख चुकीची असेल तर "तारीख बदला" वर click करा आणि official date टाका.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

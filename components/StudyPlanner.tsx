import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Circle, Calendar, Target, ChevronRight, RotateCcw } from 'lucide-react';

interface Props { onBack: () => void; }

const STORAGE_KEY = 'mpsc_study_planner';

const SYLLABUS = [
  { subject:'मराठी व्याकरण',    topics:['संधी','समास','वाक्यप्रकार','म्हणी','अलंकार','शब्दसंग्रह'], color:'#7C3AED', emoji:'📝' },
  { subject:'English Grammar',   topics:['Tenses','Articles','Prepositions','Synonyms','Antonyms','Idioms'], color:'#2563EB', emoji:'🔤' },
  { subject:'इतिहास',            topics:['प्राचीन भारत','मध्ययुगीन भारत','आधुनिक भारत','महाराष्ट्राचा इतिहास','स्वातंत्र्य चळवळ'], color:'#D97706', emoji:'📜' },
  { subject:'भूगोल',             topics:['भारताचा भूगोल','महाराष्ट्राचा भूगोल','जागतिक भूगोल','नद्या व पर्वत','हवामान'], color:'#059669', emoji:'🗺️' },
  { subject:'राज्यघटना',         topics:['मूलभूत हक्क','मार्गदर्शक तत्त्वे','कलमे','घटनादुरुस्ती','न्यायव्यवस्था'], color:'#DC2626', emoji:'⚖️' },
  { subject:'अर्थशास्त्र',        topics:['राष्ट्रीय उत्पन्न','पंचवार्षिक योजना','बँकिंग','कर प्रणाली','बजेट'], color:'#0891B2', emoji:'💰' },
  { subject:'विज्ञान',            topics:['भौतिकशास्त्र','रसायनशास्त्र','जीवशास्त्र','पर्यावरण','तंत्रज्ञान'], color:'#16A34A', emoji:'🔬' },
  { subject:'चालू घडामोडी',      topics:['महाराष्ट्र','राष्ट्रीय','आंतरराष्ट्रीय','क्रीडा','पुरस्कार'], color:'#EC4899', emoji:'📰' },
  { subject:'गणित/Reasoning',   topics:['संख्याशास्त्र','टक्केवारी','वेळ-काम','Logical Reasoning','Data Interpretation'], color:'#F97316', emoji:'🔢' },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes sp2-fade { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes sp2-check { 0%{transform:scale(0.8)}60%{transform:scale(1.15)}100%{transform:scale(1)} }
  .sp2-topic:hover { background:#FDF6EC !important; }
`;

export const StudyPlanner: React.FC<Props> = ({ onBack }) => {
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { return new Set(); }
  });
  const [expanded, setExpanded] = useState<string|null>(null);

  const toggle = (key: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const totalTopics = SYLLABUS.reduce((a,s) => a+s.topics.length, 0);
  const doneTopics  = completed.size;
  const pct         = Math.round((doneTopics/totalTopics)*100);

  const reset = () => {
    if (!window.confirm('सर्व progress reset करायचे?')) return;
    setCompleted(new Set());
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'14px 20px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14} /></button>
          <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
            <Calendar size={16} style={{ color:'#E8671A' }} /> Study Planner
          </div>
        </div>
        <button onClick={reset} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px' }}>
        {/* Progress */}
        <div style={{ background:'#fff', borderRadius:20, padding:'20px', marginBottom:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:'20px 20px 0 0', width:`${pct}%`, transition:'width 0.8s ease' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontWeight:900, fontSize:16, color:'#1C2B2B' }}>Syllabus Progress</div>
            <div style={{ fontWeight:900, fontSize:22, color:'#E8671A' }}>{pct}%</div>
          </div>
          <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:8, overflow:'hidden', marginBottom:10 }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:99, width:`${pct}%`, transition:'width 0.8s ease' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:700, color:'#7A9090' }}>
            <span>{doneTopics} topics पूर्ण</span>
            <span>{totalTopics - doneTopics} बाकी</span>
          </div>
        </div>

        {/* Subject list */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {SYLLABUS.map(({ subject, topics, color, emoji }) => {
            const subDone = topics.filter(t => completed.has(`${subject}::${t}`)).length;
            const subPct  = Math.round((subDone/topics.length)*100);
            const isOpen  = expanded === subject;
            return (
              <div key={subject} style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', animation:'sp2-fade 0.2s ease' }}>
                <div onClick={() => setExpanded(isOpen ? null : subject)}
                  style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
                  <span style={{ fontSize:22 }}>{emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:13, color:'#1C2B2B' }}>{subject}</div>
                    <div style={{ fontSize:10, fontWeight:700, color, marginTop:2 }}>{subDone}/{topics.length} topics</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ background:`${color}15`, border:`1px solid ${color}25`, borderRadius:99, padding:'3px 10px', fontSize:11, fontWeight:900, color }}>{subPct}%</div>
                    <ChevronRight size={14} style={{ color:'#A8A29E', transform: isOpen ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }} />
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height:3, background:'rgba(0,0,0,0.06)', margin:'0 16px 0' }}>
                  <div style={{ height:'100%', background:color, width:`${subPct}%`, transition:'width 0.5s ease' }} />
                </div>
                {isOpen && (
                  <div style={{ padding:'10px 16px 14px', display:'flex', flexDirection:'column', gap:6 }}>
                    {topics.map(topic => {
                      const key  = `${subject}::${topic}`;
                      const done = completed.has(key);
                      return (
                        <button key={topic} className="sp2-topic"
                          onClick={() => toggle(key)}
                          style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, background: done ? `${color}08` : '#F8F5F0', border:`1px solid ${done ? color+'30' : 'rgba(0,0,0,0.06)'}`, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
                          {done
                            ? <CheckCircle size={18} style={{ color, flexShrink:0, animation:'sp2-check 0.3s ease' }} />
                            : <Circle size={18} style={{ color:'#D1D5DB', flexShrink:0 }} />
                          }
                          <span style={{ fontSize:12, fontWeight:700, color: done ? color : '#4A6060' }}>{topic}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { X, TrendingUp, AlertTriangle, CheckCircle, Target, BookOpen, ChevronRight } from 'lucide-react';

interface Props { onClose: () => void; onGoToSubject?: (subject: string) => void; }

const HISTORY_KEY = 'mpsc_history';
const SUBJECT_KEY = 'mpsc_subject_stats';

interface SubjectStat {
  subject: string; attempted: number; correct: number; emoji: string; color: string; mode: string;
}

const SUBJECTS: SubjectStat[] = [
  { subject:'मराठी व्याकरण',  attempted:0, correct:0, emoji:'📝', color:'#7C3AED', mode:'PRELIMS' },
  { subject:'English Grammar', attempted:0, correct:0, emoji:'🔤', color:'#2563EB', mode:'MAINS'   },
  { subject:'इतिहास',          attempted:0, correct:0, emoji:'📜', color:'#D97706', mode:'PRELIMS' },
  { subject:'भूगोल',           attempted:0, correct:0, emoji:'🗺️', color:'#059669', mode:'PRELIMS' },
  { subject:'राज्यघटना',       attempted:0, correct:0, emoji:'⚖️', color:'#DC2626', mode:'PRELIMS' },
  { subject:'अर्थशास्त्र',     attempted:0, correct:0, emoji:'💰', color:'#0891B2', mode:'MAINS'   },
  { subject:'विज्ञान',         attempted:0, correct:0, emoji:'🔬', color:'#059669', mode:'PRELIMS' },
  { subject:'चालू घडामोडी',   attempted:0, correct:0, emoji:'📰', color:'#EC4899', mode:'CURRENT' },
  { subject:'गणित/Reasoning', attempted:0, correct:0, emoji:'🔢', color:'#F97316', mode:'PRELIMS' },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes wt-fade { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes wt-bar { from{width:0}to{width:var(--w)} }
  @keyframes wt-pulse { 0%,100%{opacity:1}50%{opacity:0.6} }
`;

export const WeakTopics: React.FC<Props> = ({ onClose, onGoToSubject }) => {
  const [stats, setStats] = useState<SubjectStat[]>(SUBJECTS);

  useEffect(() => {
    // Load subject stats from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem(SUBJECT_KEY) || '{}');
      setStats(SUBJECTS.map(s => ({
        ...s,
        attempted: saved[s.subject]?.attempted || 0,
        correct:   saved[s.subject]?.correct   || 0,
      })));
    } catch {}
  }, []);

  const withData  = stats.filter(s => s.attempted > 0).sort((a,b) => (a.correct/Math.max(a.attempted,1)) - (b.correct/Math.max(b.attempted,1)));
  const noData    = stats.filter(s => s.attempted === 0);
  const weak      = withData.filter(s => (s.correct/s.attempted) < 0.5);
  const ok        = withData.filter(s => (s.correct/s.attempted) >= 0.5 && (s.correct/s.attempted) < 0.75);
  const strong    = withData.filter(s => (s.correct/s.attempted) >= 0.75);

  const getStatus = (s: SubjectStat) => {
    if (s.attempted === 0) return { label:'सुरू करा', color:'#7A9090', bg:'rgba(0,0,0,0.05)', border:'rgba(0,0,0,0.08)' };
    const pct = (s.correct/s.attempted)*100;
    if (pct < 50)  return { label:`${Math.round(pct)}% ⚠️`, color:'#DC2626', bg:'rgba(220,38,38,0.07)', border:'rgba(220,38,38,0.2)' };
    if (pct < 75)  return { label:`${Math.round(pct)}% 📈`, color:'#D97706', bg:'rgba(217,119,6,0.07)', border:'rgba(217,119,6,0.2)' };
    return           { label:`${Math.round(pct)}% ✓`, color:'#059669', bg:'rgba(5,150,105,0.07)', border:'rgba(5,150,105,0.2)' };
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:440, maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'wt-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#DC2626,#D97706,#059669)', flexShrink:0 }} />

        {/* Header */}
        <div style={{ padding:'20px 20px 16px', flexShrink:0, borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:'rgba(220,38,38,0.1)', border:'1.5px solid rgba(220,38,38,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Target size={18} style={{ color:'#DC2626' }} />
              </div>
              <div>
                <div style={{ fontWeight:900, fontSize:16, color:'#1C2B2B' }}>Weak Topics</div>
                <div style={{ fontSize:11, color:'#7A9090', fontWeight:600 }}>तुमचे कमकुवत विषय</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 24px' }}>

          {/* Summary pills */}
          {withData.length > 0 && (
            <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
              {[
                { label:`⚠️ कमकुवत (${weak.length})`, c:'#DC2626', bg:'rgba(220,38,38,0.08)', border:'rgba(220,38,38,0.2)' },
                { label:`📈 ठीक (${ok.length})`,       c:'#D97706', bg:'rgba(217,119,6,0.08)', border:'rgba(217,119,6,0.2)' },
                { label:`✓ चांगले (${strong.length})`, c:'#059669', bg:'rgba(5,150,105,0.08)', border:'rgba(5,150,105,0.2)' },
              ].map(({ label,c,bg,border }) => (
                <div key={label} style={{ background:bg, border:`1px solid ${border}`, borderRadius:99, padding:'5px 12px', fontSize:11, fontWeight:800, color:c }}>{label}</div>
              ))}
            </div>
          )}

          {/* No data message */}
          {withData.length === 0 && (
            <div style={{ background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:16, padding:'20px', textAlign:'center', marginBottom:18 }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📊</div>
              <div style={{ fontWeight:800, fontSize:13, color:'#1C2B2B', marginBottom:6 }}>अजून डेटा नाही!</div>
              <div style={{ fontSize:11, color:'#7A9090', fontWeight:600, lineHeight:1.5 }}>
                प्रश्न सोडवल्यावर इथे विषयनिहाय performance दिसेल.
              </div>
            </div>
          )}

          {/* Subject list */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[...withData, ...noData].map(s => {
              const pct    = s.attempted > 0 ? Math.round((s.correct/s.attempted)*100) : 0;
              const status = getStatus(s);
              return (
                <div key={s.subject} style={{ background:'#F8F5F0', border:`1px solid ${status.border}`, borderRadius:16, padding:'14px 16px', cursor: onGoToSubject ? 'pointer' : 'default', transition:'all 0.15s' }}
                  onClick={() => onGoToSubject && onGoToSubject(s.mode)}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: s.attempted > 0 ? 10 : 0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:22 }}>{s.emoji}</span>
                      <div>
                        <div style={{ fontWeight:800, fontSize:13, color:'#1C2B2B' }}>{s.subject}</div>
                        <div style={{ fontSize:10, color:'#7A9090', fontWeight:600 }}>
                          {s.attempted > 0 ? `${s.attempted} प्रश्न · ${s.correct} बरोबर` : 'अजून सुरू नाही'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:12, fontWeight:900, color:status.color, background:status.bg, border:`1px solid ${status.border}`, borderRadius:99, padding:'3px 10px' }}>
                        {status.label}
                      </span>
                      {onGoToSubject && <ChevronRight size={14} style={{ color:'#A8A29E' }} />}
                    </div>
                  </div>

                  {s.attempted > 0 && (
                    <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:6, overflow:'hidden' }}>
                      <div style={{ height:'100%', background: pct >= 75 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626', borderRadius:99, width:`${pct}%`, transition:'width 0.8s ease' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tip */}
          {weak.length > 0 && (
            <div style={{ marginTop:16, background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:14, padding:'14px 16px' }}>
              <div style={{ fontSize:10, fontWeight:800, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>💡 सल्ला</div>
              <p style={{ fontSize:12, color:'#4A6060', fontWeight:600, lineHeight:1.6, margin:0 }}>
                <strong style={{ color:'#DC2626' }}>{weak[0]?.subject}</strong> मध्ये जास्त सराव करा — हा तुमचा कमकुवत विषय आहे!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper to save subject stats (call this from QuestionView)
export function saveSubjectStat(subject: string, correct: boolean) {
  try {
    const saved = JSON.parse(localStorage.getItem(SUBJECT_KEY) || '{}');
    if (!saved[subject]) saved[subject] = { attempted:0, correct:0 };
    saved[subject].attempted += 1;
    if (correct) saved[subject].correct += 1;
    localStorage.setItem(SUBJECT_KEY, JSON.stringify(saved));
  } catch {}
}

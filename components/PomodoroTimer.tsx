import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Coffee, BookOpen, Target, Bell } from 'lucide-react';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }

const SESSIONS = [
  { label:'25 min Study', study:25*60, break_:5*60, color:'#E8671A', emoji:'📚' },
  { label:'45 min Deep',  study:45*60, break_:10*60, color:'#7C3AED', emoji:'🧠' },
  { label:'15 min Quick', study:15*60, break_:3*60, color:'#059669', emoji:'⚡' },
];

const CSS = `
  @keyframes pt-spin { to{transform:rotate(360deg)} }
  @keyframes pt-fade { from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)} }
  @keyframes pt-ring { 0%{stroke-dashoffset:var(--full)} }
  @keyframes pt-pulse { 0%,100%{opacity:1}50%{opacity:0.6} }
`;

export const PomodoroTimer: React.FC<Props> = ({ onBack }) => {
  const [sessionIdx, setSessionIdx] = useState(0);
  const [phase, setPhase]           = useState<'study'|'break'>('study');
  const [running, setRunning]       = useState(false);
  const [timeLeft, setTimeLeft]     = useState(SESSIONS[0].study);
  const [completed, setCompleted]   = useState(0);
  const [task, setTask]             = useState('');
  const intervalRef = useRef<any>(null);

  const session = SESSIONS[sessionIdx];
  const total   = phase === 'study' ? session.study : session.break_;
  const pct     = ((total - timeLeft) / total) * 100;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (phase === 'study') {
              setCompleted(c => c+1);
              setPhase('break');
              setTimeLeft(session.break_);
              // Notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🎉 Study Session Complete!', { body: 'Break time! 5 min rest करा.' });
              // Award XP + coins per pomodoro session
              addXP(15);
              const coins = parseInt(localStorage.getItem('mpsc_coins')||'0');
              localStorage.setItem('mpsc_coins', String(coins + 10));
              // Save session to history
              try {
                const hist = JSON.parse(localStorage.getItem('mpsc_pomodoro_history')||'[]');
                hist.unshift({ date: new Date().toLocaleDateString('mr-IN'), task: '', duration: session.study/60, time: new Date().toLocaleTimeString('mr-IN',{hour:'2-digit',minute:'2-digit'}) });
                localStorage.setItem('mpsc_pomodoro_history', JSON.stringify(hist.slice(0,30)));
              } catch {}
              }
            } else {
              setPhase('study');
              setTimeLeft(session.study);
            }
            return 1;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, phase, session]);

  const reset = () => { clearInterval(intervalRef.current); setRunning(false); setTimeLeft(session.study); setPhase('study'); };
  const changeSession = (idx: number) => { reset(); setSessionIdx(idx); setTimeLeft(SESSIONS[idx].study); };
  const mm = String(Math.floor(timeLeft/60)).padStart(2,'0');
  const ss = String(timeLeft%60).padStart(2,'0');

  const r = 100, circ = 2*Math.PI*r;
  const offset = circ - (pct/100)*circ;

  return (
    <div style={{ minHeight:'100vh', background:'#0F1117', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={14}/></button>
        <span style={{ fontWeight:900, fontSize:16 }}>⏱️ Pomodoro Timer</span>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.06)', borderRadius:99, padding:'4px 12px' }}>
          <span style={{ fontSize:18 }}>🍅</span>
          <span style={{ fontWeight:900, fontSize:14, color:'#E8671A' }}>{completed}</span>
        </div>
      </div>

      {/* Session selector */}
      <div style={{ display:'flex', gap:8, padding:'0 16px', marginBottom:24 }}>
        {SESSIONS.map((s,i) => (
          <button key={i} onClick={()=>changeSession(i)}
            style={{ flex:1, padding:'8px', borderRadius:12, border:`1.5px solid ${sessionIdx===i?s.color:'rgba(255,255,255,0.1)'}`, background:sessionIdx===i?`${s.color}20`:'transparent', color:sessionIdx===i?s.color:'rgba(255,255,255,0.5)', fontWeight:800, fontSize:10, cursor:'pointer', transition:'all 0.2s' }}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'0 20px 24px' }}>
        <div style={{ position:'relative', width:240, height:240, marginBottom:20 }}>
          <svg width="240" height="240" style={{ transform:'rotate(-90deg)' }}>
            <circle cx="120" cy="120" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8}/>
            <circle cx="120" cy="120" r={r} fill="none" stroke={session.color} strokeWidth={8}
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition:'stroke-dashoffset 1s linear' }}/>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:4 }}>
              {phase === 'study' ? '📚 Study' : '☕ Break'}
            </div>
            <div style={{ fontWeight:900, fontSize:52, letterSpacing:'-0.05em', color:'#fff', lineHeight:1 }}>{mm}:{ss}</div>
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', marginTop:4 }}>
              {phase==='study'?session.label:session.label.replace('Study','Break').replace('Deep','Break').replace('Quick','Break')}
            </div>
          </div>
        </div>

        {/* Task input */}
        <input value={task} onChange={e=>setTask(e.target.value)} placeholder="आज काय शिकणार? (optional)"
          style={{ width:'100%', maxWidth:320, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'11px 16px', color:'#fff', fontSize:13, fontWeight:600, fontFamily:"'Baloo 2',sans-serif", outline:'none', marginBottom:20, textAlign:'center' }}/>

        {/* Controls */}
        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
          <button onClick={reset}
            style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.6)' }}>
            <RotateCcw size={18}/>
          </button>
          <button onClick={()=>setRunning(r=>!r)}
            style={{ width:72, height:72, borderRadius:22, background:`linear-gradient(135deg,${session.color},${session.color}99)`, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 8px 28px ${session.color}40`, animation:running?'pt-pulse 2s ease infinite':'' }}>
            {running ? <Pause size={28} fill="#fff" style={{color:'#fff'}}/> : <Play size={28} fill="#fff" style={{color:'#fff', marginLeft:4}}/>}
          </button>
          <button onClick={()=>{ if('Notification' in window) Notification.requestPermission(); }}
            style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.6)' }}>
            <Bell size={18}/>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth:480, margin:'0 auto', padding:'0 16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
          {[
            { l:'Sessions', v:`${completed} 🍅`, c:'#E8671A' },
            { l:'Focus Time', v:`${Math.round(completed*(session.study/60))} min`, c:'#7C3AED' },
            { l:'Phase', v:phase==='study'?'📚':'☕', c:session.color },
          ].map(({l,v,c}) => (
            <div key={l} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'12px', textAlign:'center' }}>
              <div style={{ fontWeight:900, fontSize:16, color:c }}>{v}</div>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'14px' }}>
          <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>💡 Tips</div>
          {['एक topic घ्या, focus करा — phone बाजूला ठेवा','Break मध्ये water प्या, stretch करा','4 sessions नंतर 15-20 min long break घ्या'].map((t,i) => (
            <div key={i} style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.5)', marginBottom:4, display:'flex', gap:6 }}>
              <span style={{ color:session.color }}>›</span> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

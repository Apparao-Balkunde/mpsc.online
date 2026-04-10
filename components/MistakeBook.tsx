import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Users, Zap, Crown, Copy, Check, ChevronRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import { addXP, checkAndAwardBadges } from './xpSystem';

interface Props { onBack: () => void; user?: any; }
interface Q { id:number; question:string; options:string[]; correct_answer_index:number; subject:string; }
interface Player { name:string; score:number; answers:number; }

const CSS = `@keyframes lq-spin{to{transform:rotate(360deg)}} @keyframes lq-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes lq-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}} @keyframes lq-timer{from{width:100%}to{width:0}}`;
const ROOM_KEY = 'mpsc_quiz_rooms';
const TIME = 20;

export const MistakeBook: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase]       = useState<'lobby'|'playing'|'result'>('lobby');
  const [roomId, setRoomId]     = useState('');
  const [joinId, setJoinId]     = useState('');
  const [questions, setQuestions] = useState<Q[]>([]);
  const [qIdx, setQIdx]         = useState(0);
  const [answered, setAnswered] = useState<number|null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [score, setScore]       = useState(0);
  const [players, setPlayers]   = useState<Player[]>([]);
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const timerRef = useRef<any>(null);
  const myName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player';

  const createRoom = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.rpc('get_random_mock_questions', { exam_filter:'Rajyaseva', row_limit:10 });
      const qs = data || [];
      const id = Math.random().toString(36).slice(2,7).toUpperCase();
      const roomData = { id, questions:qs, players:[{ name:myName, score:0, answers:0 }], created:Date.now() };
      const rooms = JSON.parse(localStorage.getItem(ROOM_KEY)||'{}');
      rooms[id] = roomData;
      localStorage.setItem(ROOM_KEY, JSON.stringify(rooms));
      setRoomId(id); setQuestions(qs);
      setPlayers([{ name:myName, score:0, answers:0 }]);
      setPhase('playing');
    } catch { alert('Room बनवता आले नाही!'); }
    setLoading(false);
  };

  const joinRoom = () => {
    const rooms = JSON.parse(localStorage.getItem(ROOM_KEY)||'{}');
    const room = rooms[joinId.toUpperCase()];
    if (!room) { alert('Room सापडला नाही! ID check करा.'); return; }
    // Add player
    if (!room.players.find((p:Player) => p.name === myName)) {
      room.players.push({ name:myName, score:0, answers:0 });
      localStorage.setItem(ROOM_KEY, JSON.stringify(rooms));
    }
    setRoomId(room.id); setQuestions(room.questions); setPlayers(room.players);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { nextQ(); return TIME; }
        return t-1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, qIdx]);

  const handleAnswer = (i: number) => {
    if (answered !== null) return;
    clearInterval(timerRef.current);
    setAnswered(i);
    const correct = i === questions[qIdx]?.correct_answer_index;
    if (correct) {
      setScore(s => s+1);
      updateProgress(1, 1);
    } else { updateProgress(1, 0); }
    setTimeout(nextQ, 1500);
  };

  const nextQ = () => {
    setAnswered(null);
    if (qIdx + 1 >= questions.length) {
      // Update room scores
      const rooms = JSON.parse(localStorage.getItem(ROOM_KEY)||'{}');
      const room = rooms[roomId];
      if (room) {
        const player = room.players.find((p:Player)=>p.name===myName);
        if (player) { player.score = score; player.answers = questions.length; }
        localStorage.setItem(ROOM_KEY, JSON.stringify(rooms));
        setPlayers([...room.players].sort((a:Player,b:Player)=>b.score-a.score));
      }
      setPhase('result');
    } else { setQIdx(q=>q+1); setTimeLeft(TIME); }
  };

  const copy = () => { navigator.clipboard.writeText(`MPSC Quiz Room: ${roomId} — mpscsarathi.online`).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const q = questions[qIdx];
  const timerPct = (timeLeft/TIME)*100;

  if (phase === 'result') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#1A0A2E)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', padding:'20px 16px' }}>
      <style>{CSS}</style>
      <button onClick={onBack} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex', marginBottom:20 }}><ArrowLeft size={14}/></button>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:56, marginBottom:10 }}>{score === questions.length?'🏆':score>=questions.length*0.7?'⭐':'💪'}</div>
        <div style={{ fontWeight:900, fontSize:28, letterSpacing:'-0.04em' }}>{score}/{questions.length}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>तुमचा score</div>
      </div>
      <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:20, padding:'16px', marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Leaderboard</div>
        {players.map((p, i) => (
          <div key={p.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:i<players.length-1?'1px solid rgba(255,255,255,0.06)':'none' }}>
            <div style={{ width:28, height:28, borderRadius:9, background:i===0?'linear-gradient(135deg,#F5C842,#D97706)':'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:13 }}>{i+1}</div>
            <div style={{ flex:1, fontWeight:800, fontSize:13, color:p.name===myName?'#F5C842':'#fff' }}>{p.name} {p.name===myName?'(तुम्ही)':''}</div>
            <div style={{ fontWeight:900, fontSize:16, color:i===0?'#F5C842':'rgba(255,255,255,0.8)' }}>{p.score}/{questions.length}</div>
          </div>
        ))}
      </div>
      <div style={{background:'rgba(245,200,66,0.12)',border:'1px solid rgba(245,200,66,0.25)',borderRadius:14,padding:'10px',marginBottom:10,textAlign:'center',fontSize:14,fontWeight:900,color:'#F5C842'}}>
        +{score*4+questions.length} ⚡ XP earned!
      </div>
      <div style={{display:'flex',gap:8,marginBottom:0}}>
        <button onClick={()=>{const p=Math.round((score/questions.length)*100);const t=`🎮 MPSC Live Quiz!\n\n${score}/${questions.length} · ${p}%\nmpscsarathi.online`;window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank');}} style={{flex:1,background:'linear-gradient(135deg,#25D366,#128C7E)',border:'none',borderRadius:14,padding:'13px',color:'#fff',fontWeight:900,cursor:'pointer'}}>📤 Share</button>
        <button onClick={onBack} style={{flex:2,background:'linear-gradient(135deg,#E8671A,#C4510E)',border:'none',borderRadius:14,padding:'13px',color:'#fff',fontWeight:900,fontSize:14,cursor:'pointer'}}>डॅशबोर्ड</button>
      </div>
    </div>
  );

  if (phase === 'playing' && q) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#1A0A2E)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', paddingBottom:40 }}>
      <style>{CSS}</style>
      <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ flex:1, background:'rgba(255,255,255,0.1)', borderRadius:99, height:5, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:99, width:`${((qIdx)/questions.length)*100}%`, transition:'width 0.4s' }}/>
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.7)' }}>{qIdx+1}/{questions.length}</span>
        <div style={{ display:'flex', alignItems:'center', gap:5, background:timeLeft<=5?'rgba(220,38,38,0.3)':'rgba(255,255,255,0.08)', borderRadius:99, padding:'5px 12px', transition:'background 0.3s' }}>
          <span style={{ fontSize:14, fontWeight:900, color:timeLeft<=5?'#EF4444':'#F5C842' }}>{timeLeft}s</span>
        </div>
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.1)', margin:'0 20px 16px' }}>
        <div style={{ height:'100%', background:timeLeft<=5?'#EF4444':'#F5C842', width:`${timerPct}%`, transition:'width 1s linear, background 0.3s' }}/>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'0 16px' }}>
        {/* Room ID */}
        <button onClick={copy} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 12px', cursor:'pointer', color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:700, marginBottom:16 }}>
          {copied?<><Check size={11}/>Copied!</>:<><Copy size={11}/>Room: {roomId}</>}
        </button>

        <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'20px', marginBottom:14, animation:'lq-fade 0.25s ease' }}>
          <div style={{ fontSize:10, fontWeight:800, color:'rgba(245,200,66,0.8)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Q.{qIdx+1} · {q.subject}</div>
          <p style={{ fontWeight:700, fontSize:'clamp(0.95rem,4vw,1.1rem)', lineHeight:1.7, color:'#fff', margin:0 }}>{q.question}</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {q.options?.map((opt,i) => {
            const isSel = answered===i, isAns = i===q.correct_answer_index;
            let bg='rgba(255,255,255,0.06)', border='rgba(255,255,255,0.12)', color='#fff';
            if (answered!==null && isAns)            { bg='rgba(5,150,105,0.2)'; border='rgba(5,150,105,0.5)'; }
            if (answered!==null && isSel && !isAns)  { bg='rgba(220,38,38,0.2)'; border='rgba(220,38,38,0.5)'; }
            if (answered!==null && !isSel && !isAns) { color='rgba(255,255,255,0.3)'; }
            return (
              <button key={i} disabled={answered!==null} onClick={()=>handleAnswer(i)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 15px', borderRadius:14, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:13, textAlign:'left', cursor:answered!==null?'default':'pointer', transition:'all 0.15s' }}>
                <span style={{ width:26, height:26, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, background:'rgba(255,255,255,0.1)' }}>
                  {answered!==null&&isAns?'✓':answered!==null&&isSel&&!isAns?'✗':String.fromCharCode(65+i)}
                </span>
                <span style={{ flex:1 }}>{opt}</span>
                {answered!==null&&isAns&&<CheckCircle2 size={15} style={{color:'#10B981'}}/>}
              </button>
            );
          })}
        </div>

        <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:16 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontWeight:900, fontSize:20, color:'#10B981' }}>{score}</div>
            <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>Score</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontWeight:900, fontSize:20, color:'rgba(255,255,255,0.7)' }}>{players.length}</div>
            <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>Players</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Lobby
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1117,#1A0A2E)', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#fff', paddingBottom:40 }}>
      <style>{CSS}</style>
      <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={14}/></button>
        <span style={{ fontWeight:900, fontSize:16 }}>🎮 Live Quiz Room</span>
      </div>
      <div style={{ maxWidth:440, margin:'0 auto', padding:'20px' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:56, marginBottom:10, animation:'lq-pulse 2s ease infinite' }}>🎮</div>
          <h2 style={{ fontWeight:900, fontSize:22, letterSpacing:'-0.04em', margin:'0 0 8px' }}>Multiplayer Quiz</h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>मित्रांसोबत एकत्र quiz खेळा! 10 questions · 20 sec each</p>
        </div>

        <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:20, padding:'20px', marginBottom:14 }}>
          <div style={{ fontWeight:800, fontSize:13, marginBottom:12, color:'rgba(255,255,255,0.8)' }}>नवीन Room तयार करा</div>
          <button onClick={createRoom} disabled={loading}
            style={{ width:'100%', background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:14, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:loading?0.8:1 }}>
            {loading?<div style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'lq-spin 0.8s linear infinite'}}/>:<><Zap size={16} fill="currentColor"/> Room तयार करा</>}
          </button>
        </div>

        <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:20, padding:'20px' }}>
          <div style={{ fontWeight:800, fontSize:13, marginBottom:12, color:'rgba(255,255,255,0.8)' }}>Room Join करा</div>
          <div style={{ display:'flex', gap:8 }}>
            <input value={joinId} onChange={e=>setJoinId(e.target.value.toUpperCase())} placeholder="Room ID (5 letters)"
              style={{ flex:1, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'12px', color:'#fff', fontSize:14, fontWeight:800, fontFamily:'monospace', letterSpacing:'0.2em', outline:'none' }}/>
            <button onClick={joinRoom} style={{ background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:12, padding:'12px 20px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer' }}>Join</button>
          </div>
        </div>
      </div>
    </div>
  );
};

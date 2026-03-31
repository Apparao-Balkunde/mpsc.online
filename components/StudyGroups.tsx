import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, Send, X, Copy, Check, MessageCircle, Crown } from 'lucide-react';

interface Props { onBack: () => void; user?: any; }
interface Group { id:string; name:string; members:string[]; messages:{user:string;text:string;time:string}[]; createdBy:string; subject:string; }

const GROUPS_KEY = 'mpsc_study_groups';
const CSS = `
  @keyframes sg-fade { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
  @keyframes sg-pop  { 0%{transform:scale(0.8)}60%{transform:scale(1.1)}100%{transform:scale(1)} }
  @keyframes sg-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  input:focus, textarea:focus { outline:none; border-color:#E8671A !important; }
`;

export const StudyGroups: React.FC<Props> = ({ onBack, user }) => {
  const [groups, setGroups]     = useState<Group[]>(() => { try { return JSON.parse(localStorage.getItem(GROUPS_KEY)||'[]'); } catch { return []; }});
  const [phase, setPhase]       = useState<'list'|'create'|'chat'>('list');
  const [active, setActive]     = useState<Group|null>(null);
  const [msg, setMsg]           = useState('');
  const [newName, setNewName]   = useState('');
  const [newSubject, setNewSubject] = useState('पूर्व परीक्षा');
  const [copied, setCopied]     = useState(false);
  const [joinId, setJoinId]     = useState('');

  const save = (data: Group[]) => { setGroups(data); localStorage.setItem(GROUPS_KEY, JSON.stringify(data)); };

  const createGroup = () => {
    if (!newName.trim()) return;
    const g: Group = { id: Math.random().toString(36).slice(2,8).toUpperCase(), name:newName.trim(), subject:newSubject, members:[user?.email||'You'], messages:[], createdBy:user?.email||'You' };
    save([g, ...groups]);
    setActive(g); setPhase('chat');
  };

  const joinGroup = () => {
    const g = groups.find(g => g.id === joinId.toUpperCase());
    if (!g) { alert('Group सापडला नाही!'); return; }
    if (!g.members.includes(user?.email||'You')) {
      const updated = groups.map(x => x.id===g.id ? {...x, members:[...x.members, user?.email||'You']} : x);
      save(updated);
      setActive(updated.find(x=>x.id===g.id)!);
    } else { setActive(g); }
    setPhase('chat'); setJoinId('');
  };

  const sendMsg = () => {
    if (!msg.trim() || !active) return;
    const newMsg = { user: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You', text:msg.trim(), time:new Date().toLocaleTimeString('mr-IN',{hour:'2-digit',minute:'2-digit'}) };
    const updated = groups.map(g => g.id===active.id ? {...g, messages:[...g.messages, newMsg]} : g);
    save(updated);
    setActive(updated.find(g=>g.id===active.id)!);
    setMsg('');
  };

  const copyLink = (id:string) => {
    navigator.clipboard.writeText(`Group ID: ${id} — mpscsarathi.online वर join करा!`).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  const SUBJECTS = ['पूर्व परीक्षा','मुख्य परीक्षा','सरळसेवा','शब्दसंग्रह','चालू घडामोडी'];

  if (phase === 'chat' && active) return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", display:'flex', flexDirection:'column' }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', flexShrink:0 }}>
        <div style={{ maxWidth:600, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={()=>setPhase('list')} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B' }}>{active.name}</div>
            <div style={{ fontSize:10, fontWeight:700, color:'#7A9090' }}>{active.members.length} members · {active.subject}</div>
          </div>
          <button onClick={()=>copyLink(active.id)} style={{ display:'flex', alignItems:'center', gap:5, background:copied?'rgba(5,150,105,0.1)':'rgba(232,103,26,0.08)', border:`1px solid ${copied?'rgba(5,150,105,0.3)':'rgba(232,103,26,0.2)'}`, borderRadius:9, padding:'6px 11px', cursor:'pointer', fontSize:10, fontWeight:800, color:copied?'#059669':'#E8671A' }}>
            {copied?<><Check size={11}/>Copied!</>:<><Copy size={11}/>ID: {active.id}</>}
          </button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', maxWidth:600, margin:'0 auto', width:'100%', padding:'12px 16px' }}>
        {active.messages.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:40, marginBottom:10 }}>💬</div>
            <div style={{ fontWeight:800, fontSize:14, color:'#1C2B2B', marginBottom:6 }}>Group Ready!</div>
            <div style={{ fontSize:12, fontWeight:700, color:'#7A9090', marginBottom:12 }}>Group ID: <strong style={{color:'#E8671A'}}>{active.id}</strong></div>
            <div style={{ fontSize:11, fontWeight:600, color:'#A8A29E' }}>मित्रांना ID share करा — पहिला message करा!</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {active.messages.map((m,i) => {
              const isMe = m.user === (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You');
              return (
                <div key={i} style={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start', animation:'sg-fade 0.2s ease' }}>
                  <div style={{ maxWidth:'80%' }}>
                    {!isMe && <div style={{ fontSize:10, fontWeight:700, color:'#7A9090', marginBottom:3, paddingLeft:4 }}>{m.user}</div>}
                    <div style={{ background:isMe?'linear-gradient(135deg,#E8671A,#C4510E)':'#fff', borderRadius:isMe?'18px 18px 4px 18px':'18px 18px 18px 4px', padding:'10px 14px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
                      <div style={{ fontSize:13, fontWeight:600, color:isMe?'#fff':'#1C2B2B', lineHeight:1.5 }}>{m.text}</div>
                    </div>
                    <div style={{ fontSize:9, fontWeight:600, color:'#A8A29E', marginTop:2, textAlign:isMe?'right':'left', paddingLeft:4 }}>{m.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderTop:'1px solid rgba(0,0,0,0.08)', padding:'10px 16px max(10px,env(safe-area-inset-bottom))', flexShrink:0 }}>
        <div style={{ maxWidth:600, margin:'0 auto', display:'flex', gap:8 }}>
          <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMsg()}
            placeholder="Message लिहा..."
            style={{ flex:1, background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'11px 14px', fontSize:13, fontWeight:600, color:'#1C2B2B', fontFamily:"'Baloo 2',sans-serif", transition:'border 0.2s' }}/>
          <button onClick={sendMsg} disabled={!msg.trim()}
            style={{ background:msg.trim()?'linear-gradient(135deg,#E8671A,#C4510E)':'rgba(0,0,0,0.1)', border:'none', borderRadius:14, padding:'11px 16px', cursor:msg.trim()?'pointer':'not-allowed', display:'flex', alignItems:'center' }}>
            <Send size={16} style={{color:msg.trim()?'#fff':'#A8A29E'}}/>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:600, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
          <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
            <Users size={16} style={{color:'#2563EB'}}/> Study Groups
          </div>
          <button onClick={()=>setPhase('create')}
            style={{ background:'linear-gradient(135deg,#2563EB,#1D4ED8)', border:'none', borderRadius:10, padding:'8px 14px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            <Plus size={14}/> नवीन
          </button>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'16px' }}>
        {phase === 'create' ? (
          <div style={{ background:'#fff', borderRadius:22, padding:'22px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', animation:'sg-fade 0.3s ease', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#2563EB,#7C3AED)', backgroundSize:'200%', animation:'sg-shimmer 3s linear infinite' }}/>
            <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', marginBottom:16 }}>नवीन Group तयार करा</div>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Group नाव..."
              style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'12px', fontSize:14, fontWeight:700, color:'#1C2B2B', boxSizing:'border-box', marginBottom:12, fontFamily:"'Baloo 2',sans-serif", transition:'border 0.2s' }}/>
            <div style={{ display:'flex', gap:7, marginBottom:16, flexWrap:'wrap' }}>
              {SUBJECTS.map(s => (
                <button key={s} onClick={()=>setNewSubject(s)}
                  style={{ padding:'6px 12px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', border:`1.5px solid ${newSubject===s?'#2563EB':'rgba(0,0,0,0.1)'}`, background:newSubject===s?'rgba(37,99,235,0.1)':'#fff', color:newSubject===s?'#2563EB':'#7A9090' }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Join existing */}
            <div style={{ background:'#F8F5F0', borderRadius:14, padding:'14px', marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#4A6060', marginBottom:8 }}>किंवा Group Join करा</div>
              <div style={{ display:'flex', gap:8 }}>
                <input value={joinId} onChange={e=>setJoinId(e.target.value.toUpperCase())} placeholder="Group ID (6 letters)"
                  style={{ flex:1, background:'#fff', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:10, padding:'10px 12px', fontSize:13, fontWeight:700, color:'#1C2B2B', fontFamily:'monospace', letterSpacing:'0.2em', outline:'none' }}/>
                <button onClick={joinGroup} style={{ background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:10, padding:'10px 16px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer' }}>Join</button>
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={createGroup} disabled={!newName.trim()}
                style={{ flex:2, background:'linear-gradient(135deg,#2563EB,#1D4ED8)', border:'none', borderRadius:12, padding:'13px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer', opacity:newName.trim()?1:0.5 }}>
                Group तयार करा
              </button>
              <button onClick={()=>setPhase('list')} style={{ flex:1, background:'#F8F5F0', border:'1px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'13px', color:'#7A9090', fontWeight:800, fontSize:13, cursor:'pointer' }}>रद्द</button>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
            <div style={{ fontWeight:800, fontSize:15, color:'#1C2B2B', marginBottom:6 }}>अजून कोणताही group नाही!</div>
            <div style={{ fontSize:12, fontWeight:600, color:'#7A9090', marginBottom:16 }}>नवीन group तयार करा किंवा join करा</div>
            <button onClick={()=>setPhase('create')}
              style={{ background:'linear-gradient(135deg,#2563EB,#1D4ED8)', border:'none', borderRadius:12, padding:'12px 24px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer' }}>
              + Group बनवा
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {groups.map((g,i) => (
              <div key={g.id} onClick={()=>{setActive(g);setPhase('chat');}}
                style={{ background:'#fff', borderRadius:18, padding:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', cursor:'pointer', animation:`sg-fade 0.2s ease ${i*0.05}s both`, display:'flex', alignItems:'center', gap:12, border:'1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#2563EB,#1D4ED8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {g.name[0]?.toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:2 }}>{g.name}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#7A9090' }}>
                    {g.members.length} members · {g.subject} · ID: {g.id}
                  </div>
                  {g.messages.length > 0 && (
                    <div style={{ fontSize:11, fontWeight:600, color:'#A8A29E', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {g.messages[g.messages.length-1].user}: {g.messages[g.messages.length-1].text}
                    </div>
                  )}
                </div>
                {g.createdBy === user?.email && <Crown size={14} style={{color:'#F5C842', flexShrink:0}}/>}
                <div style={{ background:'rgba(37,99,235,0.08)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:8, padding:'5px 9px', fontSize:10, fontWeight:800, color:'#2563EB', flexShrink:0 }}>
                  {g.messages.length} msgs
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Trophy, Flame, Target, Award, Star, Edit3, Save, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props { onClose: () => void; user: any; }

const BADGES_DATA = [
  { id:'first_correct', emoji:'⭐', name:'पहिले बरोबर' },
  { id:'streak_3',      emoji:'🔥', name:'3-Day Streak' },
  { id:'streak_7',      emoji:'💫', name:'7-Day Streak' },
  { id:'streak_30',     emoji:'👑', name:'30-Day Legend' },
  { id:'q_10',          emoji:'🎯', name:'दहाचा सराव' },
  { id:'q_50',          emoji:'💪', name:'पन्नाशी' },
  { id:'q_100',         emoji:'🏅', name:'शतक' },
  { id:'q_500',         emoji:'🏆', name:'MPSC योद्धा' },
  { id:'acc_80',        emoji:'🎖️', name:'Sharp Mind' },
  { id:'daily_done',    emoji:'📅', name:'Daily Star' },
];

const CSS = `
  @keyframes up-fade { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes up-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes up-float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }
`;

export const UserProfile: React.FC<Props> = ({ onClose, user }) => {
  const [progress, setProgress] = useState({ totalAttempted:0, totalCorrect:0, streak:0 });
  const [badges, setBadges]     = useState<string[]>([]);
  const [coins, setCoins]       = useState(0);
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState('');
  const [bio, setBio]           = useState('');
  const [rank, setRank]         = useState<number|null>(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('mpsc_user_progress')||'{}');
      setProgress({ totalAttempted:p.totalAttempted||0, totalCorrect:p.totalCorrect||0, streak:p.streak||0 });
      setBadges(JSON.parse(localStorage.getItem('mpsc_earned_achievements')||'[]'));
      setCoins(parseInt(localStorage.getItem('mpsc_coins')||'0'));
      const savedName = localStorage.getItem('mpsc_profile_name') || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
      const savedBio  = localStorage.getItem('mpsc_profile_bio') || '';
      setName(savedName);
      setBio(savedBio);
    } catch {}
    loadRank();
  }, []);

  const loadRank = async () => {
    try {
      const { count } = await supabase.from('user_progress')
        .select('*', { count:'exact', head:true })
        .gt('total_attempted', (JSON.parse(localStorage.getItem('mpsc_user_progress')||'{}').totalAttempted||0));
      setRank((count||0) + 1);
    } catch {}
  };

  const saveProfile = () => {
    localStorage.setItem('mpsc_profile_name', name);
    localStorage.setItem('mpsc_profile_bio', bio);
    setEditing(false);
  };

  const acc = progress.totalAttempted > 0 ? Math.round((progress.totalCorrect/progress.totalAttempted)*100) : 0;
  const earnedBadges = BADGES_DATA.filter(b => badges.includes(b.id));
  const level = acc >= 90 ? 7 : acc >= 80 ? 6 : acc >= 70 ? 5 : acc >= 60 ? 4 : acc >= 50 ? 3 : progress.totalAttempted > 50 ? 2 : 1;
  const levelNames = ['','🌱 नवशिके','📖 अभ्यासू','🔍 जिज्ञासू','⚔️ योद्धा','🦁 वीर','🏆 Expert','👑 केसरी'];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:420, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'up-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#E8671A,#F5C842,#7C3AED)', backgroundSize:'200%', animation:'up-shimmer 3s linear infinite', flexShrink:0 }}/>

        {/* Cover + Avatar */}
        <div style={{ background:'linear-gradient(135deg,#1C2B2B,#2D4040)', padding:'20px 20px 0', position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:9, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><X size={14}/></button>

          <div style={{ display:'flex', alignItems:'flex-end', gap:14, paddingBottom:16 }}>
            <div style={{ width:72, height:72, borderRadius:20, background:`linear-gradient(135deg,#E8671A,#C4510E)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:'#fff', border:'3px solid rgba(255,255,255,0.2)', flexShrink:0, animation:'up-float 3s ease infinite' }}>
              {name[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex:1, paddingBottom:4 }}>
              {editing ? (
                <input value={name} onChange={e=>setName(e.target.value)}
                  style={{ width:'100%', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'7px 10px', color:'#fff', fontSize:15, fontWeight:900, fontFamily:"'Baloo 2',sans-serif", outline:'none', boxSizing:'border-box' }}/>
              ) : (
                <div style={{ fontWeight:900, fontSize:16, color:'#fff' }}>{name}</div>
              )}
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600, marginTop:2 }}>{user?.email}</div>
              <div style={{ fontSize:11, color:'#F5C842', fontWeight:800, marginTop:3 }}>{levelNames[level]}</div>
            </div>
            <button onClick={()=>editing ? saveProfile() : setEditing(true)}
              style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:9, padding:'7px 12px', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, flexShrink:0 }}>
              {editing ? <><Save size={12}/> Save</> : <><Edit3 size={12}/> Edit</>}
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 20px' }}>
          {/* Bio */}
          {editing ? (
            <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Bio लिहा..." rows={2}
              style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'10px 12px', fontSize:12, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', marginBottom:14, resize:'none', fontFamily:"'Baloo 2',sans-serif", outline:'none' }}/>
          ) : bio ? (
            <p style={{ fontSize:12, fontWeight:600, color:'#4A6060', marginBottom:14, lineHeight:1.65 }}>{bio}</p>
          ) : null}

          {/* Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
            {[
              { l:'प्रश्न', v:progress.totalAttempted, c:'#2563EB', e:'📝' },
              { l:'अचूकता', v:`${acc}%`, c:'#059669', e:'🎯' },
              { l:'Streak', v:`${progress.streak}🔥`, c:'#E8671A', e:'🔥' },
              { l:'Coins', v:`${coins}🪙`, c:'#D97706', e:'🪙' },
              { l:'Badges', v:earnedBadges.length, c:'#7C3AED', e:'🏅' },
              { l:'Rank', v:rank ? `#${rank}` : '—', c:'#DC2626', e:'🏆' },
            ].map(({ l,v,c,e }) => (
              <div key={l} style={{ background:`${c}08`, border:`1px solid ${c}20`, borderRadius:12, padding:'12px 8px', textAlign:'center' }}>
                <div style={{ fontSize:16, marginBottom:3 }}>{e}</div>
                <div style={{ fontWeight:900, fontSize:16, color:c }}>{v}</div>
                <div style={{ fontSize:8, fontWeight:700, color:'#7A9090', textTransform:'uppercase', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div style={{ marginBottom:4 }}>
            <div style={{ fontWeight:800, fontSize:12, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>🏅 Badges ({earnedBadges.length}/{BADGES_DATA.length})</div>
            {earnedBadges.length === 0 ? (
              <div style={{ background:'#F8F5F0', borderRadius:14, padding:'16px', textAlign:'center', fontSize:12, fontWeight:700, color:'#7A9090' }}>अजून badges नाहीत. Quiz सोडवा!</div>
            ) : (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {earnedBadges.map(b => (
                  <div key={b.id} style={{ background:'rgba(232,103,26,0.08)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:12, padding:'8px 12px', display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:18 }}>{b.emoji}</span>
                    <span style={{ fontSize:11, fontWeight:800, color:'#C4510E' }}>{b.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

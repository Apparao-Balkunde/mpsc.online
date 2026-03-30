import React, { useEffect, useState } from 'react';
import { X, Flame, Trophy, Star, Award, Zap, Shield, Crown } from 'lucide-react';

interface Props { onClose: () => void; }

const ACHIEVEMENTS = [
  { id:'first_day',    emoji:'🌱', title:'पहिले पाऊल',     desc:'पहिल्यांदा quiz सोडवला',     xp:10,  check:(p:any) => p.totalAttempted >= 1 },
  { id:'streak_3',     emoji:'🔥', title:'3-Day Streak',   desc:'3 दिवस सलग अभ्यास',          xp:50,  check:(p:any) => p.streak >= 3 },
  { id:'streak_7',     emoji:'💫', title:'7-Day Streak',   desc:'7 दिवस सलग अभ्यास',          xp:150, check:(p:any) => p.streak >= 7 },
  { id:'streak_30',    emoji:'👑', title:'30-Day Legend',  desc:'30 दिवस सलग अभ्यास',         xp:500, check:(p:any) => p.streak >= 30 },
  { id:'q_10',         emoji:'🎯', title:'दहाचा सराव',    desc:'10 प्रश्न बरोबर',             xp:30,  check:(p:any) => p.totalCorrect >= 10 },
  { id:'q_50',         emoji:'💪', title:'पन्नाशी',       desc:'50 प्रश्न बरोबर',             xp:100, check:(p:any) => p.totalCorrect >= 50 },
  { id:'q_100',        emoji:'🏅', title:'शतक',           desc:'100 प्रश्न बरोबर',            xp:250, check:(p:any) => p.totalCorrect >= 100 },
  { id:'q_500',        emoji:'🏆', title:'MPSC योद्धा',   desc:'500 प्रश्न बरोबर',            xp:1000,check:(p:any) => p.totalCorrect >= 500 },
  { id:'acc_80',       emoji:'🎖️', title:'Sharp Mind',    desc:'80%+ accuracy (min 20Q)',     xp:200, check:(p:any) => p.totalAttempted>=20 && (p.totalCorrect/p.totalAttempted)>=0.8 },
  { id:'daily_done',   emoji:'📅', title:'Daily Star',    desc:'Daily Challenge complete',    xp:75,  check:(_:any, d:any) => d },
  { id:'flash_10',     emoji:'🎴', title:'Flash Master',  desc:'10 flashcards review',        xp:50,  check:(_:any,__:any,f:number) => f >= 10 },
];

const STREAK_REWARDS = [
  { days:3,   reward:'3-Day Badge 🔥', color:'#E8671A' },
  { days:7,   reward:'7-Day Badge 💫', color:'#7C3AED' },
  { days:14,  reward:'14-Day Badge ⭐', color:'#2563EB' },
  { days:30,  reward:'Month Champion 👑', color:'#D97706' },
  { days:60,  reward:'2-Month Legend 🏆', color:'#DC2626' },
  { days:100, reward:'100-Day Master 💎', color:'#059669' },
];

const CSS = `
  @keyframes sr-fade { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes sr-pop  { 0%{transform:scale(0.85)}60%{transform:scale(1.08)}100%{transform:scale(1)} }
  @keyframes sr-glow { 0%,100%{box-shadow:0 0 8px rgba(232,103,26,0.3)} 50%{box-shadow:0 0 20px rgba(232,103,26,0.6)} }
  @keyframes sr-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
`;

export const StreakRewards: React.FC<Props> = ({ onClose }) => {
  const [progress, setProgress] = useState({ totalAttempted:0, totalCorrect:0, streak:0 });
  const [earned, setEarned]     = useState<Set<string>>(new Set());
  const [dailyDone, setDailyDone] = useState(false);
  const [flashCards, setFlashCards] = useState(0);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('mpsc_user_progress')||'{}');
      setProgress({ totalAttempted:p.totalAttempted||0, totalCorrect:p.totalCorrect||0, streak:p.streak||0 });
      const e = new Set<string>(JSON.parse(localStorage.getItem('mpsc_earned_achievements')||'[]'));

      // Check new achievements
      const d = JSON.parse(localStorage.getItem('mpsc_daily_challenge')||'{}');
      const dd = d.date === new Date().toDateString() && d.done;
      setDailyDone(dd);
      const fc = parseInt(localStorage.getItem('mpsc_flashcard_count')||'0');
      setFlashCards(fc);

      // Auto-earn achievements
      ACHIEVEMENTS.forEach(a => {
        if (!e.has(a.id) && a.check(p, dd, fc)) e.add(a.id);
      });
      setEarned(e);
      localStorage.setItem('mpsc_earned_achievements', JSON.stringify([...e]));
    } catch {}
  }, []);

  const earnedList  = ACHIEVEMENTS.filter(a => earned.has(a.id));
  const lockedList  = ACHIEVEMENTS.filter(a => !earned.has(a.id));
  const totalXP     = earnedList.reduce((a,x) => a+x.xp, 0);

  const nextStreak  = STREAK_REWARDS.find(r => r.days > progress.streak);
  const daysToNext  = nextStreak ? nextStreak.days - progress.streak : 0;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:440, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'sr-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#E8671A,#F5C842,#7C3AED)', backgroundSize:'200%', animation:'sr-shimmer 3s linear infinite', flexShrink:0 }} />

        {/* Header */}
        <div style={{ padding:'18px 20px', flexShrink:0, borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#E8671A,#C4510E)', display:'flex', alignItems:'center', justifyContent:'center', animation:'sr-glow 2s ease infinite' }}>
                <Trophy size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight:900, fontSize:16, color:'#1C2B2B' }}>Achievements</div>
                <div style={{ fontSize:11, color:'#7A9090', fontWeight:600 }}>{earnedList.length}/{ACHIEVEMENTS.length} earned · {totalXP} XP</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}><X size={15} /></button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
          {/* Streak section */}
          <div style={{ background:'linear-gradient(135deg,rgba(232,103,26,0.1),rgba(245,200,66,0.1))', border:'1.5px solid rgba(232,103,26,0.25)', borderRadius:18, padding:'16px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Flame size={20} style={{ color:'#E8671A' }} />
                <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B' }}>Current Streak</div>
              </div>
              <div style={{ fontWeight:900, fontSize:28, color:'#E8671A' }}>{progress.streak} 🔥</div>
            </div>
            {nextStreak && (
              <>
                <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:7, overflow:'hidden', marginBottom:6 }}>
                  <div style={{ height:'100%', background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:99, width:`${(progress.streak/nextStreak.days)*100}%`, transition:'width 0.8s ease' }} />
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:'#7A9090' }}>
                  {daysToNext} दिवस बाकी → <strong style={{ color:nextStreak.color }}>{nextStreak.reward}</strong>
                </div>
              </>
            )}
          </div>

          {/* Streak milestones */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontWeight:800, fontSize:12, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>🏆 Streak Milestones</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {STREAK_REWARDS.map(r => {
                const done = progress.streak >= r.days;
                return (
                  <div key={r.days} style={{ background:done?`${r.color}15`:'rgba(0,0,0,0.04)', border:`1.5px solid ${done?r.color+'40':'rgba(0,0,0,0.08)'}`, borderRadius:12, padding:'8px 12px', opacity:done?1:0.5, minWidth:80, textAlign:'center', animation:done?'sr-pop 0.4s ease':'none' }}>
                    <div style={{ fontSize:10, fontWeight:800, color:done?r.color:'#7A9090' }}>{r.days} days</div>
                    <div style={{ fontSize:11, fontWeight:900, color:done?r.color:'#A8A29E', marginTop:2 }}>{r.reward}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Earned badges */}
          {earnedList.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontWeight:800, fontSize:12, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>✅ मिळवलेले Badges ({earnedList.length})</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {earnedList.map(a => (
                  <div key={a.id} style={{ background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:14, padding:'12px', display:'flex', alignItems:'center', gap:10, animation:'sr-pop 0.3s ease' }}>
                    <span style={{ fontSize:26, flexShrink:0 }}>{a.emoji}</span>
                    <div>
                      <div style={{ fontWeight:800, fontSize:11, color:'#1C2B2B' }}>{a.title}</div>
                      <div style={{ fontSize:9, color:'#7A9090', fontWeight:600, marginTop:1 }}>{a.desc}</div>
                      <div style={{ fontSize:9, fontWeight:800, color:'#E8671A', marginTop:2 }}>+{a.xp} XP</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked badges */}
          {lockedList.length > 0 && (
            <div>
              <div style={{ fontWeight:800, fontSize:12, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>🔒 Locked ({lockedList.length})</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {lockedList.map(a => (
                  <div key={a.id} style={{ background:'#F8F5F0', border:'1px solid rgba(0,0,0,0.07)', borderRadius:14, padding:'12px', display:'flex', alignItems:'center', gap:10, opacity:0.6 }}>
                    <span style={{ fontSize:26, flexShrink:0, filter:'grayscale(1)' }}>{a.emoji}</span>
                    <div>
                      <div style={{ fontWeight:800, fontSize:11, color:'#7A9090' }}>{a.title}</div>
                      <div style={{ fontSize:9, color:'#A8A29E', fontWeight:600, marginTop:1 }}>{a.desc}</div>
                      <div style={{ fontSize:9, fontWeight:700, color:'#A8A29E', marginTop:2 }}>+{a.xp} XP</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

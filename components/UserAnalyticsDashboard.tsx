import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, TrendingUp, Target, RefreshCw, BarChart2, Award, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props { onBack: () => void; }

interface UserStat {
  email: string; display_name: string; total_attempted: number;
  total_correct: number; streak: number; updated_at: string;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes ua-fade { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
  @keyframes ua-spin { to{transform:rotate(360deg)} }
  @keyframes ua-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  .ua-row:hover { background:#FDF6EC !important; }
`;

export const UserAnalyticsDashboard: React.FC<Props> = ({ onBack }) => {
  const [users, setUsers]       = useState<UserStat[]>([]);
  const [loading, setLoading]   = useState(true);
  const [totals, setTotals]     = useState({ users:0, attempted:0, correct:0, avgAcc:0, topStreak:0 });
  const [sort, setSort]         = useState<'total_attempted'|'total_correct'|'streak'>('total_attempted');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('user_progress')
        .select('email, display_name, total_attempted, total_correct, streak, updated_at')
        .order(sort, { ascending:false })
        .limit(100);

      if (data) {
        setUsers(data);
        const totalAtt = data.reduce((a,u)=>a+(u.total_attempted||0),0);
        const totalCor = data.reduce((a,u)=>a+(u.total_correct||0),0);
        const avgAcc   = totalAtt>0 ? Math.round((totalCor/totalAtt)*100) : 0;
        const topStreak = Math.max(...data.map(u=>u.streak||0),0);
        setTotals({ users:data.length, attempted:totalAtt, correct:totalCor, avgAcc, topStreak });
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [sort]);

  const fmt = (n:number) => n>=1000 ? `${(n/1000).toFixed(1)}k` : String(n);
  const acc = (u:UserStat) => u.total_attempted>0 ? Math.round((u.total_correct/u.total_attempted)*100) : 0;

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:40 }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1C2B2B,#2D4040)', padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}><ArrowLeft size={14}/></button>
        <div style={{ color:'#fff', fontWeight:900, fontSize:16, flex:1, display:'flex', alignItems:'center', gap:8 }}>
          <BarChart2 size={18}/> User Analytics
        </div>
        <button onClick={load} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:9, padding:'8px 10px', cursor:'pointer', color:'#fff', display:'flex' }}>
          <RefreshCw size={14} style={loading?{animation:'ua-spin 0.8s linear infinite'}:{}}/>
        </button>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'20px 16px' }}>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 }}>
          {[
            { l:'Total Users', v:totals.users, c:'#2563EB', bg:'rgba(37,99,235,0.08)', e:'👥' },
            { l:'Questions Solved', v:fmt(totals.attempted), c:'#E8671A', bg:'rgba(232,103,26,0.08)', e:'📝' },
            { l:'Avg Accuracy', v:`${totals.avgAcc}%`, c:'#059669', bg:'rgba(5,150,105,0.08)', e:'🎯' },
            { l:'Top Streak', v:`${totals.topStreak}🔥`, c:'#DC2626', bg:'rgba(220,38,38,0.08)', e:'🏆' },
          ].map(({ l,v,c,bg,e }) => (
            <div key={l} style={{ background:'#fff', borderRadius:18, padding:'18px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', borderLeft:`4px solid ${c}`, animation:'ua-fade 0.3s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:22 }}>{e}</span>
                <span style={{ fontSize:10, fontWeight:700, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</span>
              </div>
              <div style={{ fontWeight:900, fontSize:26, color:c, letterSpacing:'-0.04em' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Sort tabs */}
        <div style={{ display:'flex', background:'#fff', borderRadius:14, padding:4, marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          {[['total_attempted','सोडवलेले'],['total_correct','बरोबर'],['streak','Streak']] .map(([k,l]) => (
            <button key={k} onClick={()=>setSort(k as any)}
              style={{ flex:1, padding:'9px', borderRadius:11, fontWeight:800, fontSize:11, cursor:'pointer', border:'none', background:sort===k?'linear-gradient(135deg,#E8671A,#C4510E)':'transparent', color:sort===k?'#fff':'#7A9090', transition:'all 0.2s' }}>
              {l} ↓
            </button>
          ))}
        </div>

        {/* Users table */}
        <div style={{ background:'#fff', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:800, fontSize:13, color:'#1C2B2B' }}>Users ({users.length})</div>
          </div>

          {loading ? (
            <div style={{ padding:'50px', textAlign:'center' }}>
              <div style={{ width:40,height:40,border:'3px solid rgba(232,103,26,0.2)',borderTopColor:'#E8671A',borderRadius:'50%',animation:'ua-spin 0.8s linear infinite',margin:'0 auto' }}/>
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding:'40px', textAlign:'center', color:'#7A9090', fontSize:13, fontWeight:700 }}>अजून कोणी login नाही</div>
          ) : (
            <>
              {/* Header row */}
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:8, padding:'10px 18px', background:'#F8F5F0', fontSize:9, fontWeight:800, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                <span>User</span><span style={{textAlign:'center'}}>Attempted</span><span style={{textAlign:'center'}}>Correct</span><span style={{textAlign:'center'}}>Accuracy</span><span style={{textAlign:'center'}}>Streak</span>
              </div>
              {users.map((u,i) => (
                <div key={i} className="ua-row"
                  style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:8, padding:'12px 18px', borderBottom:'1px solid rgba(0,0,0,0.04)', transition:'background 0.15s', animation:`ua-fade 0.2s ease ${i*0.02}s both` }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:12, color:'#1C2B2B' }}>{u.display_name || u.email?.split('@')[0] || 'User'}</div>
                    <div style={{ fontSize:9, color:'#7A9090', fontWeight:600 }}>{u.email}</div>
                  </div>
                  <div style={{ textAlign:'center', fontWeight:900, fontSize:13, color:'#2563EB' }}>{fmt(u.total_attempted||0)}</div>
                  <div style={{ textAlign:'center', fontWeight:900, fontSize:13, color:'#059669' }}>{fmt(u.total_correct||0)}</div>
                  <div style={{ textAlign:'center' }}>
                    <span style={{ fontSize:11, fontWeight:900, padding:'3px 8px', borderRadius:99, background:`${acc(u)>=75?'rgba(5,150,105,0.1)':acc(u)>=50?'rgba(217,119,6,0.1)':'rgba(220,38,38,0.1)'}`, color:acc(u)>=75?'#059669':acc(u)>=50?'#D97706':'#DC2626' }}>
                      {acc(u)}%
                    </span>
                  </div>
                  <div style={{ textAlign:'center', fontWeight:900, fontSize:13, color:'#E8671A' }}>{u.streak||0}🔥</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Award, Download, Star } from 'lucide-react';

interface Props { onClose: () => void; user?: any; }
const CSS = `@keyframes pc-fade{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}} @keyframes pc-shimmer{0%{background-position:-200% center}100%{background-position:200% center}} @keyframes pc-spin{to{transform:rotate(360deg)}}`;

export const ProgressCertificate: React.FC<Props> = ({ onClose, user }) => {
  const [stats, setStats]     = useState({ attempted:0, correct:0, streak:0, badges:0 });
  const [generating, setGenerating] = useState(false);
  const [done, setDone]       = useState(false);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('mpsc_user_progress')||'{}');
      const badges = JSON.parse(localStorage.getItem('mpsc_earned_achievements')||'[]');
      setStats({ attempted:p.totalAttempted||0, correct:p.totalCorrect||0, streak:p.streak||0, badges:badges.length });
    } catch {}
  }, []);

  const acc = stats.attempted > 0 ? Math.round((stats.correct/stats.attempted)*100) : 0;
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const eligible = stats.attempted >= 100;
  const level = acc>=80?'Expert':acc>=60?'Proficient':acc>=40?'Learner':'Beginner';
  const today = new Date().toLocaleDateString('mr-IN', { day:'numeric', month:'long', year:'numeric' });

  const generate = () => {
    setGenerating(true);
    const html = `<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8"><title>MPSC Sarathi Certificate</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;900&family=Playfair+Display:wght@700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:800px; height:566px; background:#fff; font-family:'Noto Sans Devanagari',sans-serif; overflow:hidden; }
  .cert { width:100%; height:100%; position:relative; padding:40px 50px; background:linear-gradient(135deg,#FFF7ED 0%,#FFFBEB 50%,#FFF7ED 100%); }
  .border-outer { position:absolute; inset:10px; border:3px solid #E8671A; border-radius:8px; }
  .border-inner { position:absolute; inset:16px; border:1px solid rgba(232,103,26,0.3); border-radius:4px; }
  .header { text-align:center; margin-bottom:20px; position:relative; z-index:1; }
  .logo { font-size:13px; font-weight:700; color:#7A9090; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:4px; }
  .title { font-family:'Playfair Display',serif; font-size:32px; font-weight:900; color:#1C2B2B; margin-bottom:4px; }
  .subtitle { font-size:13px; color:#7A9090; font-weight:600; }
  .body { text-align:center; position:relative; z-index:1; }
  .presented { font-size:13px; color:#7A9090; font-weight:600; margin-bottom:8px; }
  .student-name { font-family:'Playfair Display',serif; font-size:42px; font-weight:900; color:#E8671A; margin-bottom:8px; border-bottom:2px solid rgba(232,103,26,0.3); padding-bottom:8px; display:inline-block; }
  .achievement { font-size:15px; color:#4A6060; font-weight:600; line-height:1.6; margin-bottom:20px; }
  .stats { display:flex; justify-content:center; gap:30px; margin-bottom:20px; }
  .stat { text-align:center; }
  .stat-val { font-size:22px; font-weight:900; color:#E8671A; }
  .stat-label { font-size:10px; font-weight:700; color:#7A9090; text-transform:uppercase; letter-spacing:0.1em; }
  .level-badge { display:inline-block; background:linear-gradient(135deg,#E8671A,#C4510E); color:#fff; padding:6px 20px; border-radius:99px; font-size:13px; font-weight:900; letter-spacing:0.05em; margin-bottom:16px; }
  .footer { display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px; }
  .date { font-size:11px; color:#7A9090; font-weight:600; }
  .seal { width:60px; height:60px; border:2px solid #E8671A; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; }
  .watermark { position:absolute; inset:0; display:flex; align-items:center; justifyContent:center; opacity:0.04; font-size:100px; font-weight:900; color:#E8671A; transform:rotate(-30deg); pointer-events:none; z-index:0; overflow:hidden; }
  @media print { body{-webkit-print-color-adjust:exact; print-color-adjust:exact;} }
</style></head><body>
<div class="cert">
  <div class="border-outer"></div>
  <div class="border-inner"></div>
  <div class="watermark">MPSC सारथी</div>
  <div class="header">
    <div class="logo">📚 MPSC Sarathi · mpscsarathi.online</div>
    <div class="title">Certificate of Achievement</div>
    <div class="subtitle">यश प्रमाणपत्र · Maharashtra MPSC Exam Preparation</div>
  </div>
  <div class="body">
    <div class="presented">हे प्रमाणपत्र देण्यात येत आहे</div>
    <div class="student-name">${name}</div>
    <div style="margin:8px 0;">
      <div class="level-badge">🏆 ${level} Level</div>
    </div>
    <div class="achievement">यांनी MPSC सारथी वर ${stats.attempted.toLocaleString()} प्रश्न यशस्वीपणे सोडवले<br>आणि ${acc}% accuracy सह उत्कृष्ट performance दाखवली.</div>
    <div class="stats">
      <div class="stat"><div class="stat-val">${stats.attempted}</div><div class="stat-label">प्रश्न</div></div>
      <div class="stat"><div class="stat-val">${acc}%</div><div class="stat-label">अचूकता</div></div>
      <div class="stat"><div class="stat-val">${stats.streak}🔥</div><div class="stat-label">Streak</div></div>
      <div class="stat"><div class="stat-val">${stats.badges}</div><div class="stat-label">Badges</div></div>
    </div>
    <div class="footer">
      <div class="date">📅 ${today}</div>
      <div class="seal">🏅</div>
      <div style="text-align:right;"><div style="font-size:11px;color:#7A9090;font-weight:600">MPSC Sarathi Team</div><div style="font-size:10px;color:#A8A29E">Maharashtra, India</div></div>
    </div>
  </div>
</div>
</body></html>`;
    const win = window.open('','_blank');
    if (win) { win.document.write(html); win.document.close(); setTimeout(()=>win.print(),800); }
    setGenerating(false); setDone(true);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:400, overflow:'hidden', animation:'pc-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#F5C842,#E8671A,#7C3AED)', backgroundSize:'200%', animation:'pc-shimmer 3s linear infinite' }}/>
        <div style={{ padding:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontWeight:900, fontSize:16, color:'#1C2B2B', display:'flex', alignItems:'center', gap:8 }}><Award size={18} style={{color:'#E8671A'}}/> Progress Certificate</div>
            <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}><X size={14}/></button>
          </div>

          <div style={{ textAlign:'center', padding:'20px', background:'linear-gradient(135deg,#FFF7ED,#FEF3C7)', borderRadius:18, marginBottom:16, border:'2px solid rgba(232,103,26,0.2)' }}>
            <div style={{ fontSize:48, marginBottom:8 }}>{eligible?'🏆':'📚'}</div>
            <div style={{ fontWeight:900, fontSize:16, color:'#1C2B2B', marginBottom:4 }}>{name}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'#7A9090', marginBottom:12 }}>{level} Level · {acc}% accuracy</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[{l:'Questions',v:stats.attempted,c:'#2563EB'},{l:'Correct',v:stats.correct,c:'#059669'},{l:'Accuracy',v:`${acc}%`,c:'#E8671A'},{l:'Streak',v:`${stats.streak}🔥`,c:'#DC2626'}].map(({l,v,c})=>(
                <div key={l} style={{ background:'rgba(255,255,255,0.7)', borderRadius:10, padding:'8px', textAlign:'center' }}>
                  <div style={{ fontWeight:900, fontSize:16, color:c }}>{v}</div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#7A9090', textTransform:'uppercase' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {!eligible && <div style={{ background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.15)', borderRadius:12, padding:'12px', marginBottom:14, fontSize:12, fontWeight:700, color:'#DC2626', textAlign:'center' }}>
            ⚠️ Certificate साठी कमीत कमी 100 questions सोडवा<br/>({100-stats.attempted} questions बाकी)
          </div>}

          <button onClick={generate} disabled={!eligible||generating}
            style={{ width:'100%', background:eligible?'linear-gradient(135deg,#E8671A,#C4510E)':'rgba(0,0,0,0.1)', border:'none', borderRadius:14, padding:'14px', color:eligible?'#fff':'#A8A29E', fontWeight:900, fontSize:14, cursor:eligible&&!generating?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {generating?<><div style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'pc-spin 0.8s linear infinite'}}/> Generating...</>
            :done?'✅ Print Dialog उघडला!'
            :<><Download size={15}/> Certificate Download करा</>}
          </button>
        </div>
      </div>
    </div>
  );
};

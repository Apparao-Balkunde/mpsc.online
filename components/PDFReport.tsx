import React, { useState, useEffect } from 'react';
import { X, Download, FileText, TrendingUp, Target, Award, Flame } from 'lucide-react';

interface Props { onClose: () => void; }

const CSS = `
  @keyframes pdf-fade { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes pdf-spin { to{transform:rotate(360deg)} }
  @keyframes pdf-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
`;

export const PDFReport: React.FC<Props> = ({ onClose }) => {
  const [generating, setGenerating] = useState(false);
  const [done, setDone]             = useState(false);
  const [stats, setStats]           = useState({ attempted:0, correct:0, streak:0, activeDays:0, bestSubject:'', accuracy:0 });

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('mpsc_user_progress')||'{}');
      const h = JSON.parse(localStorage.getItem('mpsc_history')||'[]');
      const acc = p.totalAttempted>0 ? Math.round((p.totalCorrect/p.totalAttempted)*100) : 0;
      const active = h.filter((d:any) => d.attempted>0).length;
      setStats({ attempted:p.totalAttempted||0, correct:p.totalCorrect||0, streak:p.streak||0, activeDays:active, bestSubject:'राज्यघटना', accuracy:acc });
    } catch {}
  }, []);

  const generatePDF = async () => {
    setGenerating(true);
    // Generate HTML report and open print dialog
    const now = new Date();
    const month = now.toLocaleDateString('mr-IN', { month:'long', year:'numeric' });
    const history = JSON.parse(localStorage.getItem('mpsc_history')||'[]').slice(-30);

    const html = `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8">
  <title>MPSC सारथी — Progress Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;900&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Noto Sans Devanagari',sans-serif; background:#fff; color:#1C2B2B; padding:40px; }
    .header { text-align:center; border-bottom:3px solid #E8671A; padding-bottom:20px; margin-bottom:30px; }
    .logo { font-size:28px; font-weight:900; color:#E8671A; }
    .subtitle { font-size:14px; color:#7A9090; margin-top:4px; }
    .date { font-size:12px; color:#A8A29E; margin-top:2px; }
    .stats-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:30px; }
    .stat-card { background:#F8F5F0; border-radius:12px; padding:16px; text-align:center; border-left:4px solid var(--c); }
    .stat-val { font-size:28px; font-weight:900; color:var(--c); }
    .stat-label { font-size:11px; font-weight:700; color:#7A9090; text-transform:uppercase; margin-top:4px; }
    .section-title { font-size:16px; font-weight:900; color:#1C2B2B; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
    .history-table { width:100%; border-collapse:collapse; margin-bottom:30px; }
    .history-table th { background:#E8671A; color:#fff; padding:10px; font-size:12px; font-weight:700; text-align:left; }
    .history-table td { padding:9px 10px; font-size:12px; border-bottom:1px solid #F0EDE8; }
    .history-table tr:nth-child(even) td { background:#FAFAFA; }
    .badge { display:inline-block; padding:2px 8px; border-radius:99px; font-size:10px; font-weight:700; }
    .badge-good { background:rgba(5,150,105,0.1); color:#059669; }
    .badge-ok { background:rgba(217,119,6,0.1); color:#D97706; }
    .badge-low { background:rgba(220,38,38,0.1); color:#DC2626; }
    .footer { text-align:center; padding-top:20px; border-top:1px solid #E5E7EB; font-size:11px; color:#A8A29E; }
    .motivation { background:linear-gradient(135deg,#FFF7ED,#FEF3C7); border-radius:12px; padding:16px; margin-bottom:20px; text-align:center; }
    .motivation h3 { font-size:15px; color:#92400E; margin-bottom:4px; }
    .motivation p { font-size:12px; color:#B45309; }
    @media print { body { padding:20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">📚 MPSC सारथी</div>
    <div class="subtitle">Monthly Progress Report</div>
    <div class="date">${month} · ${now.toLocaleDateString('mr-IN', { day:'numeric', month:'long', year:'numeric' })}</div>
  </div>

  <div class="stats-grid">
    <div class="stat-card" style="--c:#2563EB">
      <div class="stat-val">${stats.attempted}</div>
      <div class="stat-label">सोडवलेले प्रश्न</div>
    </div>
    <div class="stat-card" style="--c:#059669">
      <div class="stat-val">${stats.accuracy}%</div>
      <div class="stat-label">अचूकता</div>
    </div>
    <div class="stat-card" style="--c:#E8671A">
      <div class="stat-val">${stats.streak}🔥</div>
      <div class="stat-label">Current Streak</div>
    </div>
    <div class="stat-card" style="--c:#7C3AED">
      <div class="stat-val">${stats.correct}</div>
      <div class="stat-label">बरोबर उत्तरे</div>
    </div>
    <div class="stat-card" style="--c:#D97706">
      <div class="stat-val">${stats.activeDays}</div>
      <div class="stat-label">Active Days</div>
    </div>
    <div class="stat-card" style="--c:#DC2626">
      <div class="stat-val">${stats.attempted - stats.correct}</div>
      <div class="stat-label">चुकीची उत्तरे</div>
    </div>
  </div>

  <div class="motivation">
    <h3>${stats.accuracy >= 75 ? '🏆 उत्कृष्ट कामगिरी!' : stats.accuracy >= 50 ? '💪 चांगली प्रगती!' : '📚 अजून सराव करा!'}</h3>
    <p>${stats.accuracy >= 75 ? 'तुमची अचूकता खूप चांगली आहे. असेच चालू ठेवा!' : stats.accuracy >= 50 ? 'तुम्ही योग्य दिशेने आहात. सराव वाढवा!' : 'रोज थोडा सराव करा — यश मिळेलच!'}</p>
  </div>

  ${history.length > 0 ? `
  <div class="section-title">📅 गेल्या 30 दिवसांचा इतिहास</div>
  <table class="history-table">
    <tr><th>तारीख</th><th>सोडवलेले</th><th>बरोबर</th><th>अचूकता</th></tr>
    ${history.map((d:any) => {
      const pct = d.attempted > 0 ? Math.round((d.correct/d.attempted)*100) : 0;
      const cls = pct>=75?'badge-good':pct>=50?'badge-ok':'badge-low';
      return `<tr><td>${d.date}</td><td>${d.attempted}</td><td>${d.correct}</td><td><span class="badge ${cls}">${pct}%</span></td></tr>`;
    }).join('')}
  </table>` : '<p style="color:#7A9090;text-align:center;padding:20px">अजून quiz history नाही</p>'}

  <div class="footer">
    mpscsarathi.online · Maharashtra's #1 Free MPSC Practice Portal<br>
    Generated on ${now.toLocaleString('mr-IN')}
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); }, 800);
    }
    setGenerating(false);
    setDone(true);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:400, overflow:'hidden', animation:'pdf-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#E8671A,#F5C842)', backgroundSize:'200%', animation:'pdf-shimmer 3s linear infinite' }}/>
        <div style={{ padding:'24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:'rgba(232,103,26,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FileText size={18} style={{color:'#E8671A'}}/>
              </div>
              <div>
                <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B' }}>Progress Report</div>
                <div style={{ fontSize:10, color:'#7A9090', fontWeight:600 }}>PDF Download करा</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}><X size={14}/></button>
          </div>

          {/* Stats preview */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            {[
              {l:'सोडवलेले', v:stats.attempted, c:'#2563EB', e:'📝'},
              {l:'अचूकता',  v:`${stats.accuracy}%`, c:'#059669', e:'🎯'},
              {l:'Streak',  v:`${stats.streak}🔥`, c:'#E8671A', e:'🔥'},
              {l:'Active Days', v:stats.activeDays, c:'#7C3AED', e:'📅'},
            ].map(({l,v,c,e}) => (
              <div key={l} style={{ background:`${c}10`, border:`1px solid ${c}20`, borderRadius:12, padding:'12px', textAlign:'center' }}>
                <div style={{ fontSize:18, marginBottom:2 }}>{e}</div>
                <div style={{ fontWeight:900, fontSize:16, color:c }}>{v}</div>
                <div style={{ fontSize:9, fontWeight:700, color:'#7A9090', textTransform:'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ background:'#FDF6EC', border:'1px solid rgba(232,103,26,0.15)', borderRadius:14, padding:'12px 14px', marginBottom:16, fontSize:12, color:'#7A9090', fontWeight:600, lineHeight:1.6 }}>
            📄 Report मध्ये: एकूण stats, 30-day history table, performance badge, मराठी मध्ये motivational message
          </div>

          <button onClick={generatePDF} disabled={generating}
            style={{ width:'100%', background: done ? 'rgba(5,150,105,0.1)' : 'linear-gradient(135deg,#E8671A,#C4510E)', border: done ? '1px solid rgba(5,150,105,0.3)' : 'none', borderRadius:14, padding:'14px', color: done ? '#059669' : '#fff', fontWeight:900, fontSize:14, cursor:generating?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:generating?0.8:1 }}>
            {generating ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'pdf-spin 0.8s linear infinite' }}/> Generate होत आहे...</>
              : done ? '✅ Print/Save Dialog उघडला!'
              : <><Download size={16}/> PDF Report Generate करा</>}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { X, Calendar, Flame, TrendingUp, Target } from 'lucide-react';

interface Props { onClose: () => void; }

const CSS = `
  @keyframes hm-fade    { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
  @keyframes hm-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes hm-pop     { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
  .hm-cell { transition: transform 0.12s ease; cursor: pointer; }
  .hm-cell:hover { transform: scale(1.35) !important; z-index: 2; position: relative; }
`;

// Generate last 98 days = 14 weeks
function generateDays() {
  return Array.from({ length: 98 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (97 - i));
    return {
      date: d.toDateString(),
      iso: d.toISOString().slice(0, 10),
      day: d.getDay(),                    // 0=Sun
      month: d.toLocaleDateString('mr-IN', { month: 'short' }),
      label: d.toLocaleDateString('mr-IN', { month: 'short', day: 'numeric' }),
    };
  });
}

function getIntensityColor(attempted: number, max: number) {
  if (!attempted || attempted === 0) return { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.04)' };
  const t = attempted / Math.max(max, 1);
  if (t > 0.75) return { bg: '#E8671A', border: '#C4510E' };
  if (t > 0.5)  return { bg: '#F97316', border: '#E8671A' };
  if (t > 0.25) return { bg: '#FED7AA', border: '#FDBA74' };
  return              { bg: '#FEF3C7', border: '#FDE68A' };
}

// Demo data for empty state display
function generateDemoData() {
  const demo: Record<string, { attempted: number; correct: number }> = {};
  const today = new Date();
  for (let i = 1; i <= 60; i++) {
    if (Math.random() > 0.4) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const att = Math.floor(Math.random() * 30) + 5;
      demo[d.toDateString()] = { attempted: att, correct: Math.floor(att * (0.5 + Math.random() * 0.45)) };
    }
  }
  return demo;
}

export const HeatmapCalendar: React.FC<Props> = ({ onClose }) => {
  const [data, setData]       = useState<Record<string, { attempted: number; correct: number }>>({});
  const [streak, setStreak]   = useState(0);
  const [maxAtt, setMaxAtt]   = useState(1);
  const [isEmpty, setIsEmpty] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    try {
      const hist = JSON.parse(localStorage.getItem('mpsc_history') || '[]');
      const p    = JSON.parse(localStorage.getItem('mpsc_user_progress') || '{}');
      setStreak(p.streak || 0);

      if (!hist || hist.length === 0) {
        setIsEmpty(true);
        const demo = generateDemoData();
        setData(demo);
        setMaxAtt(Math.max(...Object.values(demo).map(d => d.attempted), 1));
        return;
      }

      const map: Record<string, { attempted: number; correct: number }> = {};
      hist.forEach((d: any) => {
        if (d.date && d.attempted > 0) map[d.date] = { attempted: d.attempted, correct: d.correct };
      });
      setData(map);
      setMaxAtt(Math.max(...hist.map((d: any) => d.attempted || 0), 1));
      setIsEmpty(false);
    } catch {}
  }, []);

  const days  = generateDays();
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const DAY_LABELS = ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

  // Stats
  const realData = isEmpty ? {} : data;
  const totalActive = Object.keys(realData).filter(k => realData[k]?.attempted > 0).length;
  const totalQ      = Object.values(realData).reduce((a, d) => a + (d.attempted || 0), 0);
  const totalCorr   = Object.values(realData).reduce((a, d) => a + (d.correct || 0), 0);
  const accuracy    = totalQ > 0 ? Math.round((totalCorr / totalQ) * 100) : 0;

  // Best week
  const weeklyTotals = weeks.map(w => w.reduce((s, d) => s + (realData[d.date]?.attempted || 0), 0));
  const bestWeekIdx  = weeklyTotals.indexOf(Math.max(...weeklyTotals));

  // Month labels above grid (show when week changes month)
  const monthLabels = weeks.map((w, wi) => {
    const firstDay = w.find(d => d.day === 0) || w[0];
    const prevWeek = wi > 0 ? weeks[wi - 1] : null;
    const prevMonth = prevWeek ? (prevWeek.find(d => d.day === 0) || prevWeek[0]).month : null;
    return firstDay.month !== prevMonth ? firstDay.month : '';
  });

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16, fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div style={{ background: '#1A1F2E', borderRadius: 28, width: '100%', maxWidth: 500, overflow: 'hidden', animation: 'hm-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', color: '#fff' }}>

        {/* Top shimmer bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg,#E8671A,#F5C842,#E8671A)', backgroundSize: '300%', animation: 'hm-shimmer 3s linear infinite' }} />

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(232,103,26,0.15)', border: '1px solid rgba(232,103,26,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={16} style={{ color: '#E8671A' }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15 }}>Activity Heatmap</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>14 आठवड्यांचा अभ्यास</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 9, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '16px 20px 20px' }}>

          {/* Empty state banner */}
          {isEmpty && (
            <div style={{ background: 'rgba(232,103,26,0.08)', border: '1px solid rgba(232,103,26,0.2)', borderRadius: 12, padding: '9px 14px', marginBottom: 14, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>👆</span> अजून quiz नाही — हे Demo data आहे. Quiz खेळल्यावर actual progress दिसेल!
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
            {[
              { l: 'Active Days', v: isEmpty ? '—' : totalActive, c: '#E8671A', icon: <Calendar size={13} /> },
              { l: 'Questions',   v: isEmpty ? '—' : totalQ.toLocaleString(), c: '#2563EB', icon: <Target size={13} /> },
              { l: 'Accuracy',    v: isEmpty ? '—' : `${accuracy}%`, c: '#059669', icon: <TrendingUp size={13} /> },
              { l: 'Streak',      v: isEmpty ? '—' : `${streak}🔥`, c: '#DC2626', icon: <Flame size={13} /> },
            ].map(({ l, v, c, icon }) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ color: c, marginBottom: 3, display: 'flex', justifyContent: 'center' }}>{icon}</div>
                <div style={{ fontWeight: 900, fontSize: 15, color: c }}>{v}</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.05em' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Month labels row */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 2, paddingLeft: 28 }}>
            {weeks.map((_, wi) => (
              <div key={wi} style={{ flex: 1, fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textAlign: 'center', letterSpacing: '0.03em' }}>
                {monthLabels[wi]}
              </div>
            ))}
          </div>

          {/* Day label + grid */}
          <div style={{ display: 'flex', gap: 3 }}>
            {/* Day labels (left column) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 0 }}>
              {DAY_LABELS.map((d, i) => (
                <div key={i} style={{ height: 16, fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', letterSpacing: '0.02em', width: 22, justifyContent: 'flex-end', paddingRight: 3 }}>
                  {i % 2 === 0 ? d : ''}
                </div>
              ))}
            </div>

            {/* Grid */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                {week.map((day, di) => {
                  const d     = data[day.date];
                  const { bg, border } = getIntensityColor(d?.attempted || 0, maxAtt);
                  const isToday = day.date === new Date().toDateString();
                  const isBestWeek = wi === bestWeekIdx && !isEmpty && weeklyTotals[wi] > 0;
                  return (
                    <div key={di}
                      className="hm-cell"
                      title={`${day.label}: ${d?.attempted || 0} प्रश्न, ${d?.correct || 0} बरोबर`}
                      onMouseEnter={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ text: `${day.label}: ${d?.attempted || 0}Q · ${d?.correct || 0}✓`, x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        height: 16,
                        borderRadius: 3,
                        background: bg,
                        border: `1px solid ${isToday ? '#E8671A' : border}`,
                        boxShadow: isToday ? '0 0 0 1.5px #E8671A' : undefined,
                        opacity: isEmpty ? 0.5 : 1,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
              {isEmpty ? 'Demo data' : `${totalActive} active days`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>कमी</span>
              {['rgba(255,255,255,0.07)', '#FEF3C7', '#FED7AA', '#F97316', '#E8671A'].map((c, i) => (
                <div key={i} style={{ width: 13, height: 13, borderRadius: 3, background: c }} />
              ))}
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>जास्त</span>
            </div>
          </div>

          {/* Best week highlight */}
          {!isEmpty && weeklyTotals[bestWeekIdx] > 0 && (
            <div style={{ marginTop: 12, background: 'rgba(232,103,26,0.1)', border: '1px solid rgba(232,103,26,0.2)', borderRadius: 10, padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
              🏅 Best week: {weeklyTotals[bestWeekIdx]} प्रश्न ({weeks[bestWeekIdx]?.[0]?.label} – {weeks[bestWeekIdx]?.[6]?.label})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Target, TrendingUp, AlertTriangle, CheckCircle, Brain, RefreshCw } from 'lucide-react';

interface Props { onBack: () => void; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes sr-fade  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sr-draw  { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }
  @keyframes sr-pop   { 0%{transform:scale(0)} 70%{transform:scale(1.1)} 100%{transform:scale(1)} }
  @keyframes sr-glow  { 0%,100%{opacity:0.6} 50%{opacity:1} }
  .sr-card { animation: sr-fade 0.4s ease; }
  .sr-subject:hover { transform: translateX(3px); transition: 0.2s; }
`;

const SYLLABUS_SUBJECTS = [
  { id: 'history',     label: 'इतिहास',         key: 'history',      color: '#E8671A', topics: ['मराठा साम्राज्य', 'स्वातंत्र्य चळवळ', 'प्राचीन भारत', 'मध्ययुगीन भारत'] },
  { id: 'geography',   label: 'भूगोल',           key: 'geography',    color: '#10B981', topics: ['महाराष्ट्र भूगोल', 'भारत भूगोल', 'जागतिक भूगोल', 'नद्या-पर्वत'] },
  { id: 'polity',      label: 'राज्यशास्त्र',    key: 'polity',       color: '#3B82F6', topics: ['घटना', 'संसद', 'न्यायव्यवस्था', 'स्थानिक स्वराज्य'] },
  { id: 'economy',     label: 'अर्थव्यवस्था',    key: 'economy',      color: '#8B5CF6', topics: ['बजेट', 'शेती', 'बँकिंग', 'पंचवार्षिक योजना'] },
  { id: 'science',     label: 'सामान्य विज्ञान', key: 'science',      color: '#06B6D4', topics: ['भौतिकशास्त्र', 'रसायनशास्त्र', 'जीवशास्त्र', 'तंत्रज्ञान'] },
  { id: 'current',     label: 'चालू घडामोडी',    key: 'current',      color: '#EC4899', topics: ['महाराष्ट्र', 'राष्ट्रीय', 'आंतरराष्ट्रीय', 'पुरस्कार'] },
  { id: 'marathi',     label: 'मराठी भाषा',      key: 'marathi',      color: '#F59E0B', topics: ['व्याकरण', 'साहित्य', 'शब्दसंग्रह', 'लेखन'] },
  { id: 'math',        label: 'अंकगणित',         key: 'math',         color: '#EF4444', topics: ['टक्केवारी', 'गुणोत्तर', 'वेळ-काम', 'साधी व्याज'] },
];

const HIST_KEY = 'mpsc_subject_history';
const GOAL_KEY = 'mpsc_syllabus_goals';

function loadHistory(): Record<string, { attempted: number; correct: number }> {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '{}'); } catch { return {}; }
}
function loadGoals(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(GOAL_KEY) || '{}'); } catch { return {}; }
}

// SVG Radar Chart
function RadarChart({ data, size = 260 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38;
  const n = data.length;

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle - Math.PI / 2),
    y: cy + radius * Math.sin(angle - Math.PI / 2),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const angles = data.map((_, i) => (2 * Math.PI * i) / n);

  // Data polygon
  const dataPoints = data.map((d, i) => toXY(angles[i], r * (d.value / 100)));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8671A" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#E8671A" stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {/* Grid circles */}
      {gridLevels.map((level, li) => {
        const pts = angles.map(a => toXY(a, r * level));
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
        return <path key={li} d={path} fill="none" stroke="rgba(28,43,43,0.08)" strokeWidth="1" />;
      })}

      {/* Axis lines */}
      {angles.map((angle, i) => {
        const end = toXY(angle, r);
        return <line key={i} x1={cx} y1={cy} x2={end.x.toFixed(1)} y2={end.y.toFixed(1)} stroke="rgba(28,43,43,0.08)" strokeWidth="1" />;
      })}

      {/* Data fill */}
      <path d={dataPath} fill="url(#radar-fill)" stroke="#E8671A" strokeWidth="2.5" strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 6px rgba(232,103,26,0.3))' }} />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={data[i].color} stroke="#fff" strokeWidth="2"
          style={{ animation: `sr-pop 0.5s ease ${i * 0.08}s both` }} />
      ))}

      {/* Labels */}
      {data.map((d, i) => {
        const labelPt = toXY(angles[i], r * 1.22);
        return (
          <text key={i} x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fontWeight="700" fill={d.value < 40 ? '#EF4444' : d.value > 70 ? '#10B981' : '#374151'}
            fontFamily="'Baloo 2', sans-serif">
            {d.label.length > 6 ? d.label.slice(0, 6) + '…' : d.label}
          </text>
        );
      })}

      {/* Center score */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="900" fill="#1C2B2B" fontFamily="'Baloo 2', sans-serif">
        {Math.round(data.reduce((a, d) => a + d.value, 0) / data.length)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fontWeight="700" fill="#7A9090" fontFamily="'Baloo 2', sans-serif">
        Overall
      </text>
    </svg>
  );
}

export const SyllabusRadar: React.FC<Props> = ({ onBack }) => {
  const [history, setHistory] = useState(loadHistory());
  const [goals, setGoals] = useState(loadGoals());
  const [editGoal, setEditGoal] = useState<string | null>(null);
  const [tab, setTab] = useState<'radar' | 'subjects' | 'gaps'>('radar');

  const getScore = (key: string): number => {
    const h = history[key];
    if (!h || h.attempted === 0) return 0;
    return Math.round((h.correct / h.attempted) * 100);
  };

  const getAttempted = (key: string): number => history[key]?.attempted || 0;

  const radarData = SYLLABUS_SUBJECTS.map(s => ({
    label: s.label,
    value: getScore(s.key),
    color: s.color,
  }));

  const weakSubjects = SYLLABUS_SUBJECTS
    .map(s => ({ ...s, score: getScore(s.key), attempted: getAttempted(s.key) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const strongSubjects = SYLLABUS_SUBJECTS
    .map(s => ({ ...s, score: getScore(s.key) }))
    .filter(s => s.score > 60)
    .sort((a, b) => b.score - a.score);

  const overallScore = Math.round(radarData.reduce((a, d) => a + d.value, 0) / radarData.length);

  // Simulate adding demo data
  const addDemoData = () => {
    const demo: Record<string, { attempted: number; correct: number }> = {
      history: { attempted: 45, correct: 32 },
      geography: { attempted: 30, correct: 18 },
      polity: { attempted: 60, correct: 50 },
      economy: { attempted: 20, correct: 11 },
      science: { attempted: 25, correct: 14 },
      current: { attempted: 40, correct: 28 },
      marathi: { attempted: 35, correct: 29 },
      math: { attempted: 15, correct: 7 },
    };
    localStorage.setItem(HIST_KEY, JSON.stringify(demo));
    setHistory(demo);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>🎯 Syllabus Radar</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600 }}>Subject-wise gap analysis</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '6px 12px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>{overallScore}%</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 700 }}>Overall</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '2px solid #F5F0E8' }}>
        {([['radar', '🕸️ Radar'], ['subjects', '📊 Subjects'], ['gaps', '⚠️ Gaps']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '12px 8px', fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer', background: 'none', color: tab === t ? '#7C3AED' : '#7A9090', borderBottom: tab === t ? '2px solid #7C3AED' : '2px solid transparent', marginBottom: -2, transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', maxWidth: 520, margin: '0 auto' }}>

        {/* RADAR TAB */}
        {tab === 'radar' && (
          <div className="sr-card">
            {getAttempted('history') === 0 && (
              <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 14, padding: 14, marginBottom: 16, border: '1.5px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 24 }}>💡</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#1E40AF' }}>Demo data दाखवतो</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6' }}>Questions सोडवल्यावर real data येईल</div>
                </div>
                <button onClick={addDemoData} style={{ background: '#3B82F6', border: 'none', borderRadius: 10, padding: '8px 12px', color: '#fff', fontWeight: 800, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Demo पहा
                </button>
              </div>
            )}

            {/* Radar Chart */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '20px 10px', marginBottom: 16, display: 'flex', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <RadarChart data={radarData} size={280} />
            </div>

            {/* Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SYLLABUS_SUBJECTS.map(s => {
                const score = getScore(s.key);
                return (
                  <div key={s.id} style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 11, color: '#1C2B2B' }}>{s.label}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#7A9090' }}>{getAttempted(s.key)} Q solved</div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 14, color: score < 40 ? '#EF4444' : score > 70 ? '#10B981' : '#F59E0B' }}>{score}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBJECTS TAB */}
        {tab === 'subjects' && (
          <div className="sr-card">
            {SYLLABUS_SUBJECTS.map(s => {
              const score = getScore(s.key);
              const attempted = getAttempted(s.key);
              const goal = goals[s.key] || 70;
              const gap = Math.max(0, goal - score);
              return (
                <div key={s.id} className="sr-subject" style={{ background: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 900, fontSize: 14, color: '#1C2B2B' }}>{s.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#7A9090', marginLeft: 8 }}>{attempted} solved</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 900, fontSize: 16, color: score < 40 ? '#EF4444' : score > 70 ? '#10B981' : '#F59E0B' }}>{score}%</span>
                      {gap > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', display: 'block' }}>Goal: {goal}% ({gap}% gap)</span>}
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#F5F0E8', borderRadius: 3, marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${score}%`, background: score < 40 ? '#EF4444' : score > 70 ? '#10B981' : '#F59E0B', borderRadius: 3, transition: 'width 0.8s ease', maxWidth: '100%' }} />
                  </div>
                  {/* Topics */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {s.topics.map(t => (
                      <span key={t} style={{ fontSize: 9, fontWeight: 700, color: s.color, background: `${s.color}10`, padding: '3px 8px', borderRadius: 8 }}>{t}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* GAPS TAB */}
        {tab === 'gaps' && (
          <div className="sr-card">
            {/* Weak subjects */}
            <div style={{ background: 'rgba(239,68,68,0.05)', borderRadius: 18, padding: 16, marginBottom: 14, border: '1.5px solid rgba(239,68,68,0.15)' }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#DC2626', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} /> कमकुवत विषय (Priority)
              </div>
              {weakSubjects.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, background: '#fff', borderRadius: 12, padding: '10px 14px' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#EF4444', width: 24 }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#1C2B2B' }}>{s.label}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#7A9090' }}>{s.attempted} Q solved</div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: '#EF4444' }}>{s.score}%</div>
                </div>
              ))}
              <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '10px 14px', marginTop: 4, border: '1px solid rgba(239,68,68,0.15)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
                  💡 AI Suggestion: {weakSubjects[0]?.label} वर जास्त वेळ द्या. दररोज 10 प्रश्न या विषयातून सोडवा.
                </div>
              </div>
            </div>

            {/* Strong subjects */}
            {strongSubjects.length > 0 && (
              <div style={{ background: 'rgba(5,150,105,0.05)', borderRadius: 18, padding: 16, marginBottom: 14, border: '1.5px solid rgba(5,150,105,0.15)' }}>
                <div style={{ fontWeight: 900, fontSize: 14, color: '#059669', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} /> चांगले विषय ✅
                </div>
                {strongSubjects.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                    <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: '#1C2B2B' }}>{s.label}</span>
                    <span style={{ fontWeight: 900, fontSize: 14, color: '#059669' }}>{s.score}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* AI study plan */}
            <div style={{ background: 'linear-gradient(135deg,#F3F0FF,#EDE9FE)', borderRadius: 18, padding: 16, border: '1.5px solid rgba(124,58,237,0.15)' }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#7C3AED', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={16} /> 7-Day Focus Plan
              </div>
              {weakSubjects.slice(0, 3).map((s, i) => (
                <div key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ background: '#7C3AED', color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap' }}>Day {i * 2 + 1}-{i * 2 + 2}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{s.label} — 20 MCQ + revision</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ background: '#7C3AED', color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 10, fontWeight: 900 }}>Day 7</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Full Mock Test + Analysis</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

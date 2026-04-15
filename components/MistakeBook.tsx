import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, RotateCcw, Trash2, CheckCircle2, XCircle, Filter, TrendingUp, Brain } from 'lucide-react';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }

interface Mistake {
  id: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  chosen_index: number;
  subject: string;
  explanation?: string;
  addedAt: string;
  reviewCount: number;
  lastReviewed?: string;
  mastered: boolean;
}

const MISTAKE_KEY = 'mpsc_mistake_book';
const CSS = `
  @keyframes mb-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes mb-pop  { 0%{transform:scale(0.94)} 60%{transform:scale(1.03)} 100%{transform:scale(1)} }
  @keyframes mb-shake{ 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
  .mb-opt { transition: all 0.16s ease; }
  .mb-opt:not(:disabled):hover { transform: translateX(3px); }
  .mb-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12)!important; }
`;

type View = 'list' | 'review';
type Filter = 'all' | 'pending' | 'mastered';

function loadMistakes(): Mistake[] {
  try { return JSON.parse(localStorage.getItem(MISTAKE_KEY) || '[]'); } catch { return []; }
}
function saveMistakes(m: Mistake[]) {
  try { localStorage.setItem(MISTAKE_KEY, JSON.stringify(m)); } catch {}
}

// Subject color map
const SUBJ_COLOR: Record<string, string> = {
  'राज्यघटना': '#2563EB', 'इतिहास': '#D97706', 'भूगोल': '#059669',
  'अर्थशास्त्र': '#7C3AED', 'विज्ञान': '#0891B2', 'English': '#DB2777',
  'मराठी': '#E8671A', 'चालू घडामोडी': '#DC2626',
};
const subjectColor = (s: string) => SUBJ_COLOR[s] || '#6B7280';

export const MistakeBook: React.FC<Props> = ({ onBack }) => {
  const [mistakes, setMistakes]   = useState<Mistake[]>(loadMistakes);
  const [view, setView]           = useState<View>('list');
  const [filter, setFilter]       = useState<Filter>('pending');
  const [reviewQueue, setReviewQueue] = useState<Mistake[]>([]);
  const [qIdx, setQIdx]           = useState(0);
  const [answered, setAnswered]   = useState<number | null>(null);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });
  const [shake, setShake]         = useState(false);
  const [done, setDone]           = useState(false);

  const filtered = mistakes.filter(m =>
    filter === 'all' ? true : filter === 'mastered' ? m.mastered : !m.mastered
  );

  const subjectCounts = mistakes.reduce<Record<string, number>>((acc, m) => {
    acc[m.subject] = (acc[m.subject] || 0) + 1;
    return acc;
  }, {});

  const startReview = () => {
    const queue = filtered.filter(m => !m.mastered).sort(() => Math.random() - 0.5).slice(0, 10);
    if (queue.length === 0) return;
    setReviewQueue(queue);
    setQIdx(0);
    setAnswered(null);
    setSessionScore({ correct: 0, total: 0 });
    setDone(false);
    setView('review');
  };

  const handleAnswer = (i: number) => {
    if (answered !== null) return;
    setAnswered(i);
    const q = reviewQueue[qIdx];
    const correct = i === q.correct_answer_index;

    if (correct) {
      setSessionScore(s => ({ ...s, correct: s.correct + 1, total: s.total + 1 }));
      addXP(3);
      updateProgress(1, 1);
      // increment review count, possibly mark mastered
      const updated = mistakes.map(m => {
        if (m.id !== q.id) return m;
        const newCount = m.reviewCount + 1;
        return { ...m, reviewCount: newCount, lastReviewed: new Date().toDateString(), mastered: newCount >= 3 };
      });
      setMistakes(updated);
      saveMistakes(updated);
    } else {
      setSessionScore(s => ({ ...s, total: s.total + 1 }));
      setShake(true);
      setTimeout(() => setShake(false), 500);
      updateProgress(1, 0);
      addXP(1);
    }

    setTimeout(() => {
      if (qIdx + 1 >= reviewQueue.length) {
        setDone(true);
      } else {
        setQIdx(x => x + 1);
        setAnswered(null);
      }
    }, 1800);
  };

  const deleteMistake = (id: string) => {
    const updated = mistakes.filter(m => m.id !== id);
    setMistakes(updated);
    saveMistakes(updated);
  };

  const clearMastered = () => {
    const updated = mistakes.filter(m => !m.mastered);
    setMistakes(updated);
    saveMistakes(updated);
  };

  // ── Review Done Screen ──
  if (view === 'review' && done) {
    const pct = Math.round((sessionScore.correct / sessionScore.total) * 100);
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0F1117,#1C0A2E)', fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <style>{CSS}</style>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '36px 24px', maxWidth: 360, width: '100%', textAlign: 'center', animation: 'mb-pop 0.4s ease' }}>
          <div style={{ fontSize: 56, marginBottom: 10 }}>{pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '📖'}</div>
          <div style={{ fontWeight: 900, fontSize: 32, letterSpacing: '-0.05em', marginBottom: 4 }}>{sessionScore.correct}/{sessionScore.total}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 20 }}>Review Session</div>
          <div style={{ background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)', borderRadius: 12, padding: '10px', marginBottom: 16, fontSize: 14, fontWeight: 900, color: '#34D399' }}>
            +{sessionScore.correct * 3 + sessionScore.total} ⚡ XP earned!
          </div>
          {pct >= 80 && <div style={{ fontSize: 12, color: '#FBBF24', fontWeight: 700, marginBottom: 16 }}>🔥 बरोबर उत्तरांना Mastered म्हणून mark केले!</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={()=>{const p=Math.round((sessionScore.correct/sessionScore.total)*100);const t=`📖 MPSC Mistake Book!\n\n${sessionScore.correct}/${sessionScore.total} revised · ${p}% accuracy\nmpscsarathi.online`;window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank');}} style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:12, padding:'13px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤 Share</button>
            <button onClick={startReview} style={{ flex: 1, background: 'linear-gradient(135deg,#E8671A,#C4510E)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>पुन्हा</button>
            <button onClick={() => setView('list')} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '13px', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>यादी</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Review Screen ──
  if (view === 'review' && reviewQueue.length > 0) {
    const q = reviewQueue[qIdx];
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0F1117,#1C0A2E)', fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", color: '#fff', paddingBottom: 40 }}>
        <style>{CSS}</style>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setView('list')} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 9, padding: '8px 10px', cursor: 'pointer', color: '#fff', display: 'flex' }}><ArrowLeft size={14} /></button>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius: 99, width: `${(qIdx / reviewQueue.length) * 100}%`, transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>{qIdx + 1}/{reviewQueue.length}</span>
          <div style={{ background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(5,150,105,0.35)', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 900, color: '#34D399' }}>{sessionScore.correct} ✓</div>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '8px 16px' }}>
          {/* Subject tag */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${subjectColor(q.subject)}20`, border: `1px solid ${subjectColor(q.subject)}40`, borderRadius: 99, padding: '4px 12px', fontSize: 11, fontWeight: 800, color: subjectColor(q.subject), marginBottom: 12 }}>
            <Brain size={10} /> {q.subject} · चूक #{q.reviewCount} वेळा review केले
          </div>

          {/* Original wrong answer reminder */}
          <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, padding: '8px 14px', marginBottom: 12, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
            ❌ तुमचं चुकीचं उत्तर: <span style={{ color: '#F87171', fontWeight: 800 }}>{q.options[q.chosen_index]}</span>
          </div>

          <div key={qIdx} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '20px 18px', marginBottom: 14, animation: 'mb-fade 0.3s ease', minHeight: 110 }}>
            <p style={{ fontWeight: 700, fontSize: 'clamp(0.95rem,4vw,1.1rem)', lineHeight: 1.7, color: '#fff', margin: 0 }}>{q.question}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, animation: shake ? 'mb-shake 0.4s ease' : undefined }}>
            {q.options.map((opt, i) => {
              const isSel = answered === i, isAns = i === q.correct_answer_index;
              let bg = 'rgba(255,255,255,0.06)', border = 'rgba(255,255,255,0.12)', clr = '#fff';
              if (answered !== null && isAns)           { bg = 'rgba(5,150,105,0.2)'; border = 'rgba(5,150,105,0.55)'; }
              if (answered !== null && isSel && !isAns) { bg = 'rgba(220,38,38,0.2)'; border = 'rgba(220,38,38,0.55)'; }
              if (answered !== null && !isSel && !isAns) { clr = 'rgba(255,255,255,0.28)'; }
              return (
                <button key={i} className="mb-opt" disabled={answered !== null} onClick={() => handleAnswer(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', borderRadius: 14, border: `1.5px solid ${border}`, background: bg, color: clr, fontWeight: 700, fontSize: 13, textAlign: 'left', cursor: answered !== null ? 'default' : 'pointer', width: '100%', fontFamily: 'inherit' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, background: 'rgba(255,255,255,0.1)' }}>
                    {answered !== null && isAns ? '✓' : answered !== null && isSel && !isAns ? '✗' : String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ flex: 1 }}>{opt}</span>
                  {answered !== null && isAns && <CheckCircle2 size={14} style={{ color: '#10B981', flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {answered !== null && q.explanation && (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 16px', marginTop: 12, animation: 'mb-fade 0.3s ease', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65 }}>
              💡 {q.explanation}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── List Screen ──
  const pendingCount  = mistakes.filter(m => !m.mastered).length;
  const masteredCount = mistakes.filter(m => m.mastered).length;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0F1117,#1C0A2E)', fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", color: '#fff', paddingBottom: 40 }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 9, padding: '8px 10px', cursor: 'pointer', color: '#fff', display: 'flex' }}><ArrowLeft size={14} /></button>
        <span style={{ fontWeight: 900, fontSize: 17, flex: 1 }}>📕 Mistake Book</span>
        {masteredCount > 0 && (
          <button onClick={clearMastered} style={{ background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', borderRadius: 9, padding: '6px 10px', cursor: 'pointer', color: '#34D399', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Trash2 size={11} /> Mastered clear
          </button>
        )}
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { l: 'एकूण चुका', v: mistakes.length, c: '#F87171', e: '❌' },
            { l: 'Pending', v: pendingCount, c: '#FBBF24', e: '⏳' },
            { l: 'Mastered', v: masteredCount, c: '#34D399', e: '✅' },
          ].map(({ l, v, c, e }) => (
            <div key={l} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{e}</div>
              <div style={{ fontWeight: 900, fontSize: 20, color: c }}>{v}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: 1 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Subject breakdown */}
        {Object.keys(subjectCounts).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {Object.entries(subjectCounts).map(([subj, cnt]) => (
              <div key={subj} style={{ background: `${subjectColor(subj)}18`, border: `1px solid ${subjectColor(subj)}35`, borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 800, color: subjectColor(subj) }}>
                {subj} ({cnt})
              </div>
            ))}
          </div>
        )}

        {/* Review CTA */}
        {pendingCount > 0 && (
          <button onClick={startReview}
            style={{ width: '100%', background: 'linear-gradient(135deg,#E8671A,#C4510E)', border: 'none', borderRadius: 16, padding: '15px', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, fontFamily: 'inherit' }}>
            <RotateCcw size={16} /> {pendingCount} चुकांचा Review सुरू करा
          </button>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {(['pending', 'all', 'mastered'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1.5px solid ${filter === f ? '#E8671A' : 'rgba(255,255,255,0.1)'}`, background: filter === f ? 'rgba(232,103,26,0.15)' : 'rgba(255,255,255,0.04)', color: filter === f ? '#E8671A' : 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
              {f === 'pending' ? '⏳ Pending' : f === 'mastered' ? '✅ Mastered' : '📋 सर्व'}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', animation: 'mb-fade 0.3s ease' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{filter === 'mastered' ? '🏆' : '🎉'}</div>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>
              {filter === 'mastered' ? 'अजून कोणतेही mastered नाही' : filter === 'pending' ? 'कोणतीही pending चूक नाही!' : 'Mistake Book रिकामे आहे'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              {filter === 'pending' ? 'सर्व चुका master केल्या! 🎊' : 'Quiz खेळताना चुकलेले प्रश्न इथे आपोआप save होतात.'}
            </div>
          </div>
        )}

        {/* Mistake cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((m, idx) => (
            <div key={m.id} className="mb-card" style={{ background: m.mastered ? 'rgba(5,150,105,0.07)' : 'rgba(255,255,255,0.05)', border: `1px solid ${m.mastered ? 'rgba(5,150,105,0.25)' : 'rgba(255,255,255,0.09)'}`, borderRadius: 16, padding: '14px 16px', animation: 'mb-fade 0.3s ease', animationDelay: `${idx * 0.04}s` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, background: `${subjectColor(m.subject)}20`, color: subjectColor(m.subject), borderRadius: 6, padding: '2px 8px' }}>{m.subject}</span>
                  {m.mastered && <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(5,150,105,0.2)', color: '#34D399', borderRadius: 6, padding: '2px 8px' }}>✅ Mastered</span>}
                  {!m.mastered && m.reviewCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{m.reviewCount}x reviewed</span>}
                </div>
                <button onClick={() => deleteMistake(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 2, flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>

              <p style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: '0 0 10px' }}>{m.question}</p>

              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 8, padding: '7px 10px', fontSize: 11 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#F87171', textTransform: 'uppercase', marginBottom: 2 }}>❌ तुमचं उत्तर</div>
                  <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{m.options[m.chosen_index]}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)', borderRadius: 8, padding: '7px 10px', fontSize: 11 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#34D399', textTransform: 'uppercase', marginBottom: 2 }}>✓ बरोबर उत्तर</div>
                  <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{m.options[m.correct_answer_index]}</div>
                </div>
              </div>

              {m.explanation && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, lineHeight: 1.5 }}>
                  💡 {m.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Helper: call this from QuizMode/MockTest when user answers wrong ──
export function addToMistakeBook(entry: {
  question: string; options: string[]; correct_answer_index: number;
  chosen_index: number; subject: string; explanation?: string;
}) {
  try {
    const mistakes: Mistake[] = JSON.parse(localStorage.getItem(MISTAKE_KEY) || '[]');
    // Avoid duplicate questions
    if (mistakes.find(m => m.question === entry.question)) return;
    mistakes.unshift({
      ...entry,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      addedAt: new Date().toDateString(),
      reviewCount: 0,
      mastered: false,
    });
    localStorage.setItem(MISTAKE_KEY, JSON.stringify(mistakes.slice(0, 200)));
  } catch {}
}

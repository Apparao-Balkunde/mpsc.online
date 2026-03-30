import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Bookmark, BookmarkX, CheckCircle2, XCircle, Check, X, BookOpen, Trash2, RefreshCcw } from 'lucide-react';
import { getBookmarks, removeBookmark, type Bookmark as BM } from '../services/bookmarks';
import { updateProgress } from '../App';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes bm-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bm-pop  { 0%{transform:scale(1)} 45%{transform:scale(1.04)} 100%{transform:scale(1)} }
  @keyframes bm-out  { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(0.95);height:0;padding:0;margin:0} }
  @keyframes bm-correct { 0%{box-shadow:0 0 0 0 rgba(5,150,105,0.4)} 100%{box-shadow:0 0 0 12px rgba(5,150,105,0)} }
  @keyframes bm-wrong   { 0%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 100%{box-shadow:0 0 0 12px rgba(220,38,38,0)} }
  .bm-opt:hover:not([data-locked="true"]) {
    background:#FDF6EC !important;
    border-color:rgba(232,103,26,0.3) !important;
    transform:translateX(4px) !important;
    box-shadow:0 4px 16px rgba(232,103,26,0.1) !important;
  }
  .bm-del:hover {
    background:rgba(239,68,68,0.1) !important;
    border-color:rgba(239,68,68,0.3) !important;
    color:#EF4444 !important;
  }
  .bm-filter-btn:hover { opacity:0.85; transform:translateY(-1px); }
  .bm-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
  .bm-card:hover { box-shadow: 0 8px 32px rgba(28,43,43,0.1) !important; }
`;

export const BookmarkMode: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [bookmarks, setBookmarks]   = useState<BM[]>([]);
  const [answers, setAnswers]       = useState<Record<number, number>>({});
  const [score, setScore]           = useState(0);
  const [attempted, setAttempted]   = useState(0);
  const [filter, setFilter]         = useState<'all' | 'unanswered' | 'wrong'>('all');
  const [removing, setRemoving]     = useState<number | null>(null);

  const load = useCallback(() => setBookmarks(getBookmarks()), []);
  useEffect(() => { load(); }, [load]);

  const handleAnswer = (id: number, optIdx: number, correctIdx: number) => {
    if (answers[id] !== undefined) return;
    const correct = optIdx === correctIdx;
    setAnswers(p => ({ ...p, [id]: optIdx }));
    if (correct) setScore(p => p + 1);
    setAttempted(p => p + 1);
    updateProgress(1, correct ? 1 : 0);
  };

  const handleRemove = (id: number) => {
    setRemoving(id);
    setTimeout(() => { removeBookmark(id); setRemoving(null); load(); }, 350);
  };

  const clearAll = () => {
    if (!window.confirm(`सर्व ${bookmarks.length} bookmarks delete करायचे?`)) return;
    bookmarks.forEach(b => removeBookmark(b.id));
    load();
  };

  const resetSession = () => { setAnswers({}); setScore(0); setAttempted(0); };

  const accuracy = attempted > 0 ? Math.round((score / attempted) * 100) : 0;

  const filtered = filter === 'unanswered'
    ? bookmarks.filter(b => answers[b.id] === undefined)
    : filter === 'wrong'
    ? bookmarks.filter(b => answers[b.id] !== undefined && answers[b.id] !== b.correct_answer_index)
    : bookmarks;

  const base: React.CSSProperties = {
    minHeight: '100vh',
    background: '#FDF6EC',
    fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif",
    color: '#1C2B2B',
    padding: '0 0 80px',
  };

  return (
    <div style={base}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1C2B2B,#0D6B6E)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 4px 20px rgba(13,107,110,0.3)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 14px', color: '#FDF6EC', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            <ArrowLeft size={14} /> परत
          </button>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#F5C842', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bookmark size={17} fill="#F5C842" /> Bookmarks
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, marginTop: 1 }}>
              {bookmarks.length} जतन केलेले प्रश्न
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {attempted > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 12, padding: '7px 14px', fontWeight: 900, fontSize: 13, color: '#10B981' }}>
              ✓ {score}/{attempted} · {accuracy}%
            </div>
          )}
          {attempted > 0 && (
            <button onClick={resetSession}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 10px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCcw size={14} />
            </button>
          )}
          {bookmarks.length > 0 && (
            <button onClick={clearAll} className="bm-del"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '7px 12px', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, transition: 'all 0.15s' }}>
              <Trash2 size={13} /> Clear All
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

        {/* Stats bar */}
        {attempted > 0 && (
          <div style={{ background: '#fff', border: '1px solid rgba(28,43,43,0.08)', borderRadius: 18, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 12px rgba(28,43,43,0.06)', animation: 'bm-fade 0.3s ease' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.08em' }}>अचूकता</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: accuracy >= 60 ? '#059669' : '#E8671A' }}>{accuracy}%</span>
              </div>
              <div style={{ background: 'rgba(28,43,43,0.08)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: accuracy >= 60 ? 'linear-gradient(90deg,#10B981,#059669)' : 'linear-gradient(90deg,#E8671A,#F5C842)', width: `${accuracy}%`, borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 18, color: '#059669', lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.06em' }}>बरोबर</div>
              </div>
              <div style={{ width: 1, background: 'rgba(28,43,43,0.08)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 18, color: '#DC2626', lineHeight: 1 }}>{attempted - score}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.06em' }}>चुकीचे</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        {bookmarks.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {(['all', 'unanswered', 'wrong'] as const).map(f => {
              const count = f === 'all' ? bookmarks.length
                : f === 'unanswered' ? bookmarks.filter(b => answers[b.id] === undefined).length
                : bookmarks.filter(b => answers[b.id] !== undefined && answers[b.id] !== b.correct_answer_index).length;
              const active = filter === f;
              const colors = { all: '#E8671A', unanswered: '#0D6B6E', wrong: '#DC2626' };
              const c = colors[f];
              return (
                <button key={f} onClick={() => setFilter(f)} className="bm-filter-btn"
                  style={{ padding: '8px 16px', borderRadius: 99, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: `1.5px solid ${active ? c : 'rgba(28,43,43,0.1)'}`, background: active ? `${c}15` : '#fff', color: active ? c : '#7A9090', transition: 'all 0.15s', boxShadow: active ? `0 2px 12px ${c}25` : 'none' }}>
                  {f === 'all' ? `सर्व (${count})` : f === 'unanswered' ? `न सोडवलेले (${count})` : `चुकीचे (${count})`}
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {bookmarks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', border: '1px solid rgba(28,43,43,0.08)', borderRadius: 24, boxShadow: '0 2px 16px rgba(28,43,43,0.06)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(232,103,26,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>🔖</div>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#1C2B2B', marginBottom: 8 }}>अजून Bookmark नाही</div>
            <div style={{ fontSize: 13, color: '#7A9090', fontWeight: 600 }}>प्रश्न सोडवताना 🔖 बटण दाबा</div>
          </div>
        )}

        {/* Question list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
         // नवीन सुरक्षित कोड (बदल करा):
        {(filtered || []).map((item, idx) => {
          // इथे एक सेफ्टी चेक ॲड करा जेणेकरून जर item चुकीचा असेल तर तो रेंडर होणार नाही
            if (!item || !item.id) return null;
            const hasAnswered = answers[item.id] !== undefined;
            const isCorrect   = hasAnswered && answers[item.id] === item.correct_answer_index;
            const isRemoving  = removing === item.id;
            const borderColor = !hasAnswered ? 'rgba(28,43,43,0.08)' : isCorrect ? 'rgba(5,150,105,0.25)' : 'rgba(220,38,38,0.2)';

            return (
              <div key={item.id} className="bm-card"
                style={{ background: '#fff', border: `1.5px solid ${borderColor}`, borderRadius: 22, overflow: 'hidden', animation: isRemoving ? 'bm-out 0.35s ease forwards' : `bm-fade 0.2s ease ${idx * 0.03}s both`, boxShadow: '0 2px 12px rgba(28,43,43,0.06)' }}>

                {/* Top indicator bar */}
                <div style={{ height: 3, background: !hasAnswered ? 'linear-gradient(90deg,#F5C842,#E8671A)' : isCorrect ? '#10B981' : '#EF4444', animation: hasAnswered ? (isCorrect ? 'bm-correct 0.5s ease' : 'bm-wrong 0.5s ease') : 'none' }} />

                <div style={{ padding: '18px 20px' }}>
                  {/* Meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    {item.year && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(232,103,26,0.1)', border: '1px solid rgba(232,103,26,0.2)', borderRadius: 99, padding: '3px 9px', color: '#C4510E', textTransform: 'uppercase' }}>{item.year}</span>
                    )}
                    {item.exam_name && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(13,107,110,0.1)', border: '1px solid rgba(13,107,110,0.2)', borderRadius: 99, padding: '3px 9px', color: '#0D6B6E', textTransform: 'uppercase' }}>{item.exam_name}</span>
                    )}
                    {item.subject && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 99, padding: '3px 9px', color: '#7C3AED', textTransform: 'uppercase' }}>{item.subject}</span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#7A9090', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Bookmark size={9} style={{ color: '#F5C842' }} />
                      {new Date(item.savedAt).toLocaleDateString('mr-IN')}
                    </span>
                    <button onClick={() => handleRemove(item.id)} className="bm-del"
                      style={{ background: 'transparent', border: '1px solid transparent', padding: '4px 6px', cursor: 'pointer', color: '#B0CCCC', display: 'flex', alignItems: 'center', transition: 'all 0.15s', borderRadius: 7 }}>
                      <BookmarkX size={14} />
                    </button>
                  </div>

                  {/* Question */}
                  <p style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.65, color: '#1C2B2B', marginBottom: 14 }}>{item.question}</p>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: hasAnswered && item.explanation ? 14 : 0 }}>
                    {(item.options || []).map((opt, i) => {
                      const isSel = answers[item.id] === i;
                      const isAns = i === item.correct_answer_index;
                      let bg     = '#FDF6EC';
                      let border = 'rgba(28,43,43,0.08)';
                      let color  = '#1C2B2B';
                      let bdgBg  = '#fff';
                      let bdgCol = '#4A6060';
                      let bdgBorder = '1.5px solid rgba(28,43,43,0.12)';

                      if (hasAnswered && isAns) {
                        bg = 'rgba(5,150,105,0.08)'; border = 'rgba(5,150,105,0.3)'; color = '#065F46';
                        bdgBg = '#059669'; bdgCol = '#fff'; bdgBorder = 'none';
                      } else if (hasAnswered && isSel && !isAns) {
                        bg = 'rgba(220,38,38,0.06)'; border = 'rgba(220,38,38,0.25)'; color = '#991B1B';
                        bdgBg = '#DC2626'; bdgCol = '#fff'; bdgBorder = 'none';
                      } else if (hasAnswered) {
                        color = '#9BBFC6'; bg = '#F9F7F4';
                      }

                      return (
                        <button key={i} className="bm-opt" data-locked={hasAnswered ? 'true' : 'false'}
                          onClick={() => handleAnswer(item.id, i, item.correct_answer_index)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 13, border: `1.5px solid ${border}`, background: bg, color, fontWeight: 600, fontSize: 12, textAlign: 'left', cursor: hasAnswered ? 'default' : 'pointer', transition: 'all 0.15s ease', animation: isSel && !hasAnswered ? 'bm-pop 0.2s ease' : 'none' }}>
                          <span style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, background: bdgBg, color: bdgCol, border: bdgBorder, transition: 'all 0.15s' }}>
                            {hasAnswered && isAns ? <Check size={12} /> : hasAnswered && isSel && !isAns ? <X size={12} /> : String.fromCharCode(65 + i)}
                          </span>
                          <span style={{ flex: 1 }}>{opt}</span>
                          {hasAnswered && isAns && <CheckCircle2 size={15} style={{ color: '#059669', flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {hasAnswered && item.explanation && (
                    <div style={{ background: 'rgba(232,103,26,0.06)', border: '1px solid rgba(232,103,26,0.15)', borderRadius: 14, padding: '12px 14px', animation: 'bm-fade 0.28s ease' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#C4510E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <BookOpen size={10} /> स्पष्टीकरण
                      </div>
                      <p style={{ fontSize: 12, color: '#4A6060', lineHeight: 1.65, fontWeight: 500, fontStyle: 'italic', margin: 0 }}>{item.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

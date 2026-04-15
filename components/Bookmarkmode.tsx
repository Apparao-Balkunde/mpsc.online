import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Bookmark, BookmarkX, CheckCircle2, XCircle, Check, X, BookOpen, Trash2, RefreshCcw } from 'lucide-react';
import { getBookmarks, removeBookmark, type Bookmark as BM } from '../services/bookmarks';
import { updateProgress } from '../App';
import { addXP } from './xpSystem';

const CSS = `
  @keyframes bm-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bm-pop  { 0%{transform:scale(1)} 45%{transform:scale(1.04)} 100%{transform:scale(1)} }
  @keyframes bm-out  { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(0.9)} }
  .bm-opt:hover:not([data-locked="true"]){background:rgba(255,255,255,0.07)!important;border-color:rgba(255,255,255,0.2)!important;transform:translateX(3px)}
  .bm-del:hover{background:rgba(239,68,68,0.15)!important;border-color:rgba(239,68,68,0.4)!important;color:#EF4444!important}
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
    addXP(correct ? 4 : 1);
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
    minHeight:'100vh', background:'#0B0F1A',
    fontFamily:"'Poppins','Noto Sans Devanagari',sans-serif", color:'#fff',
    padding:'16px 16px 80px',
  };

  return (
    <div style={base}>
      <style>{CSS}</style>
      <div style={{ maxWidth:800, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={onBack}
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'8px 14px', color:'rgba(255,255,255,0.55)', fontWeight:800, fontSize:12, cursor:'pointer' }}>
              <ArrowLeft size={14} /> परत
            </button>
            <div>
              <div style={{ fontWeight:900, fontSize:18, letterSpacing:'-0.03em', display:'flex', alignItems:'center', gap:7 }}>
                <Bookmark size={18} style={{ color:'#F59E0B' }} /> Bookmarks
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, marginTop:1 }}>
                {bookmarks.length} जतन केलेले प्रश्न
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            {attempted > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(16,185,129,0.14)', border:'1px solid rgba(16,185,129,0.28)', borderRadius:10, padding:'7px 12px', fontWeight:900, fontSize:13, color:'#10B981' }}>
                ✓ {score}/{attempted} · {accuracy}%
              </div>
            )}
            {attempted > 0 && (
              <button onClick={resetSession}
                style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'7px 10px', color:'rgba(255,255,255,0.4)', cursor:'pointer', display:'flex', alignItems:'center' }}>
                <RefreshCcw size={14} />
              </button>
            )}
            {bookmarks.length > 0 && (
              <button onClick={clearAll} className="bm-del"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'7px 12px', color:'rgba(255,255,255,0.35)', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:800, transition:'all 0.15s' }}>
                <Trash2 size={13} /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        {bookmarks.length > 0 && (
          <div style={{ display:'flex', gap:6, marginBottom:16 }}>
            {(['all', 'unanswered', 'wrong'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'6px 14px', borderRadius:99, fontSize:11, fontWeight:800, cursor:'pointer', border:'none', background: filter===f ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)', color: filter===f ? '#F59E0B' : 'rgba(255,255,255,0.35)', transition:'all 0.15s' }}>
                {f === 'all' ? `सर्व (${bookmarks.length})` : f === 'unanswered' ? `न सोडवलेले (${bookmarks.filter(b => answers[b.id] === undefined).length})` : `चुकीचे (${bookmarks.filter(b => answers[b.id] !== undefined && answers[b.id] !== b.correct_answer_index).length})`}
              </button>
            ))}
          </div>
        )}

        {/* Empty */}
        {bookmarks.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 20px', background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(255,255,255,0.07)', borderRadius:22 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔖</div>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:6 }}>अजून Bookmark नाही</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', fontWeight:600 }}>प्रश्न सोडवताना 🔖 बटण दाबा</div>
          </div>
        )}

        {/* Question list */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map((item, idx) => {
            const hasAnswered = answers[item.id] !== undefined;
            const isCorrect = hasAnswered && answers[item.id] === item.correct_answer_index;
            const isRemoving = removing === item.id;

            return (
              <div key={item.id}
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:22, overflow:'hidden', animation: isRemoving ? 'bm-out 0.35s ease forwards' : `bm-fade 0.2s ease ${idx * 0.02}s both` }}>

                <div style={{ height:2, background: !hasAnswered ? 'rgba(245,158,11,0.5)' : isCorrect ? '#10B981' : '#EF4444' }} />

                <div style={{ padding:'18px 20px' }}>
                  {/* Meta row */}
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, flexWrap:'wrap' }}>
                    {item.year && <span style={{ fontSize:9, fontWeight:800, background:'rgba(249,115,22,0.12)', border:'1px solid rgba(249,115,22,0.22)', borderRadius:99, padding:'3px 9px', color:'#F97316', textTransform:'uppercase' }}>{item.year}</span>}
                    {item.exam_name && <span style={{ fontSize:9, fontWeight:800, background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.22)', borderRadius:99, padding:'3px 9px', color:'#60A5FA', textTransform:'uppercase' }}>{item.exam_name}</span>}
                    {item.subject && <span style={{ fontSize:9, fontWeight:800, background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.22)', borderRadius:99, padding:'3px 9px', color:'#A78BFA', textTransform:'uppercase' }}>{item.subject}</span>}
                    <span style={{ marginLeft:'auto', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', gap:4 }}>
                      <Bookmark size={10} style={{ color:'#F59E0B' }} />
                      {new Date(item.savedAt).toLocaleDateString('mr-IN')}
                    </span>
                    <button onClick={() => handleRemove(item.id)} className="bm-del"
                      style={{ background:'transparent', border:'none', padding:'3px 5px', cursor:'pointer', color:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', transition:'all 0.15s', borderRadius:6 }}>
                      <BookmarkX size={14} />
                    </button>
                  </div>

                  <p style={{ fontWeight:700, fontSize:13, lineHeight:1.6, color:'rgba(255,255,255,0.85)', marginBottom:14 }}>{item.question}</p>

                  {/* Options */}
                  <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom: hasAnswered && item.explanation ? 12 : 0 }}>
                    {(item.options || []).map((opt, i) => {
                      const isSel = answers[item.id] === i;
                      const isAns = i === item.correct_answer_index;
                      let bg='rgba(255,255,255,0.03)',border='rgba(255,255,255,0.07)',color='rgba(255,255,255,0.65)',bdgBg='rgba(255,255,255,0.07)',bdgCol='rgba(255,255,255,0.35)';
                      if (hasAnswered && isAns)              { bg='rgba(16,185,129,0.12)'; border='rgba(16,185,129,0.35)'; color='#fff'; bdgBg='#10B981'; bdgCol='#fff'; }
                      else if (hasAnswered && isSel && !isAns){ bg='rgba(239,68,68,0.1)'; border='rgba(239,68,68,0.3)'; color='rgba(255,255,255,0.5)'; bdgBg='#EF4444'; bdgCol='#fff'; }
                      else if (hasAnswered)                  { color='rgba(255,255,255,0.22)'; }
                      return (
                        <button key={i} className="bm-opt" data-locked={hasAnswered ? 'true' : 'false'}
                          onClick={() => handleAnswer(item.id, i, item.correct_answer_index)}
                          style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', borderRadius:11, border:`1.5px solid ${border}`, background:bg, color, fontWeight:700, fontSize:12, textAlign:'left', cursor:hasAnswered?'default':'pointer', transition:'all 0.15s ease' }}>
                          <span style={{ width:24, height:24, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, background:bdgBg, color:bdgCol }}>
                            {hasAnswered && isAns ? <Check size={12} /> : hasAnswered && isSel && !isAns ? <X size={12} /> : String.fromCharCode(65+i)}
                          </span>
                          <span style={{ flex:1 }}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {hasAnswered && item.explanation && (
                    <div style={{ background:'rgba(249,115,22,0.07)', border:'1px solid rgba(249,115,22,0.18)', borderRadius:13, padding:'11px 13px', animation:'bm-fade 0.25s ease' }}>
                      <div style={{ fontSize:9, fontWeight:800, color:'#F97316', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5, display:'flex', alignItems:'center', gap:4 }}>
                        <BookOpen size={10} /> स्पष्टीकरण
                      </div>
                      <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.65, fontWeight:500, fontStyle:'italic', margin:0 }}>{item.explanation}</p>
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

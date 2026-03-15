import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import { ArrowLeft, Search, Languages, BookOpen, ChevronDown, CheckCircle2, XCircle, Check, X, ChevronLeft, ChevronRight, RefreshCcw, Filter } from 'lucide-react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes vc-fade { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes vc-spin { to{transform:rotate(360deg)} }
  @keyframes vc-pop  { 0%{transform:scale(1)}45%{transform:scale(1.04)}100%{transform:scale(1)} }
  @keyframes vc-in   { from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)} }
  .vc-opt:hover:not([data-locked="true"]) { background:#FDF6EC !important; border-color:rgba(232,103,26,0.3) !important; transform:translateX(4px) !important; }
  .vc-card { transition: all 0.2s ease; }
  .vc-card:hover { box-shadow: 0 8px 28px rgba(28,43,43,0.1) !important; border-color: rgba(232,103,26,0.2) !important; }
  .vc-chip:hover { opacity:0.85; }
  .vc-reset:hover { background:rgba(232,103,26,0.1) !important; color:#E8671A !important; }
`;

const PAGE_SIZE = 15;
const VOCAB_TYPES = ['All','Synonyms','Antonyms','One Word Substitution','Idioms & Phrases','Grammar Question','म्हणी','वाक्प्रचार'];
const LANG_OPTIONS = ['All','Marathi','English'];

function catStyle(cat: string) {
  if (cat==='Synonyms')              return { bg:'rgba(5,150,105,0.1)',   border:'rgba(5,150,105,0.25)',   color:'#059669' };
  if (cat==='Antonyms')              return { bg:'rgba(220,38,38,0.1)',   border:'rgba(220,38,38,0.25)',   color:'#DC2626' };
  if (cat==='One Word Substitution') return { bg:'rgba(13,107,110,0.1)',  border:'rgba(13,107,110,0.25)',  color:'#0D6B6E' };
  if (cat==='Idioms & Phrases')      return { bg:'rgba(217,119,6,0.1)',   border:'rgba(217,119,6,0.25)',   color:'#D97706' };
  if (cat==='म्हणी'||cat==='वाक्प्रचार') return { bg:'rgba(232,103,26,0.1)', border:'rgba(232,103,26,0.25)', color:'#E8671A' };
  return                                    { bg:'rgba(124,58,237,0.1)',  border:'rgba(124,58,237,0.25)',  color:'#7C3AED' };
}

function langStyle(lang: string) {
  return lang==='Marathi'
    ? { bg:'rgba(232,103,26,0.1)', border:'rgba(232,103,26,0.25)', color:'#C4510E' }
    : { bg:'rgba(13,107,110,0.1)', border:'rgba(13,107,110,0.25)', color:'#0D6B6E' };
}

export const VocabMode: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [vocab, setVocab]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selLang, setSelLang]       = useState('All');
  const [selType, setSelType]       = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [answers, setAnswers]       = useState<Record<number, number>>({});
  const [score, setScore]           = useState(0);
  const [attempted, setAttempted]   = useState(0);

  const fetchVocab = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase.from('vocab_questions').select('*', { count: 'exact' });
      if (selLang !== 'All') q = q.eq('language', selLang);
      if (selType !== 'All') q = q.eq('category', selType);
      if (searchTerm.trim()) q = q.ilike('question', `%${searchTerm}%`);
      q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1).order('id', { ascending: false });
      const { data, count, error } = await q;
      if (error) throw error;
      setVocab(data || []);
      setTotal(count || 0);
    } catch (err: any) { console.error('Vocab load error:', err.message); }
    setLoading(false);
  }, [selLang, selType, searchTerm, page]);

  useEffect(() => { fetchVocab(); }, [fetchVocab]);
  useEffect(() => { setPage(0); }, [selLang, selType, searchTerm]);

  const handleAnswer = (itemId: number, optIdx: number, correctIdx: number) => {
    if (answers[itemId] !== undefined) return;
    const correct = optIdx === correctIdx;
    setAnswers(p => ({ ...p, [itemId]: optIdx }));
    if (correct) setScore(p => p + 1);
    setAttempted(p => p + 1);
    updateProgress(1, correct ? 1 : 0);
  };

  const resetSession = () => { setAnswers({}); setScore(0); setAttempted(0); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const accuracy = attempted > 0 ? Math.round((score / attempted) * 100) : 0;

  const base: React.CSSProperties = {
    minHeight: '100vh', background: '#FDF6EC',
    fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", color: '#1C2B2B',
    padding: '0 0 80px',
  };

  return (
    <div style={base}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1C2B2B,#7C3AED)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '7px 13px', color: '#FDF6EC', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            <ArrowLeft size={13} /> परत
          </button>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: '#F5C842', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1 }}>
              <Languages size={16} /> शब्दसंग्रह
            </div>
            {total > 0 && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginTop: 2 }}>{total.toLocaleString()} शब्द उपलब्ध</div>}
          </div>
        </div>

        {attempted > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ minWidth: 100 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>अचूकता</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: accuracy >= 60 ? '#10B981' : '#EF4444' }}>{accuracy}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: accuracy >= 60 ? '#10B981' : '#EF4444', width: `${accuracy}%`, borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10, padding: '6px 12px', fontWeight: 900, fontSize: 13, color: '#10B981', display: 'flex', alignItems: 'center', gap: 5 }}>
              ✓ {score}/{attempted}
            </div>
            <button onClick={resetSession} className="vc-reset"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '7px 9px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
              <RefreshCcw size={14} />
            </button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '20px 16px' }}>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7A9090', pointerEvents: 'none' }} />
            <input type="text" placeholder="शब्द शोधा..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', background: '#fff', border: '1.5px solid rgba(28,43,43,0.1)', borderRadius: 12, padding: '10px 12px 10px 34px', color: '#1C2B2B', fontWeight: 600, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: "'Baloo 2',sans-serif" }} />
          </div>
          <button onClick={() => setShowFilters(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: showFilters ? 'rgba(124,58,237,0.1)' : '#fff', border: `1.5px solid ${showFilters ? 'rgba(124,58,237,0.3)' : 'rgba(28,43,43,0.1)'}`, borderRadius: 12, padding: '10px 16px', color: showFilters ? '#7C3AED' : '#4A6060', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            <Filter size={13} /> Filter {showFilters ? '▲' : '▼'}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{ background: '#fff', border: '1px solid rgba(28,43,43,0.08)', borderRadius: 18, padding: '18px', marginBottom: 16, animation: 'vc-fade 0.2s ease', boxShadow: '0 2px 12px rgba(28,43,43,0.06)' }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>भाषा</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {LANG_OPTIONS.map(l => (
                  <button key={l} className="vc-chip" onClick={() => { setSelLang(l); setPage(0); }}
                    style={{ background: selLang===l ? 'rgba(124,58,237,0.1)' : '#FDF6EC', border: `1.5px solid ${selLang===l ? 'rgba(124,58,237,0.35)' : 'rgba(28,43,43,0.08)'}`, borderRadius: 99, padding: '5px 14px', fontSize: 11, fontWeight: 800, color: selLang===l ? '#7C3AED' : '#4A6060', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {l==='All'?'सर्व':l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>प्रकार</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {VOCAB_TYPES.map(t => (
                  <button key={t} className="vc-chip" onClick={() => { setSelType(t); setPage(0); }}
                    style={{ background: selType===t ? 'rgba(124,58,237,0.1)' : '#FDF6EC', border: `1.5px solid ${selType===t ? 'rgba(124,58,237,0.35)' : 'rgba(28,43,43,0.08)'}`, borderRadius: 99, padding: '5px 13px', fontSize: 11, fontWeight: 800, color: selType===t ? '#7C3AED' : '#4A6060', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {t==='All'?'सर्व':t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(selLang !== 'All' || selType !== 'All') && (
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            {selLang !== 'All' && <span onClick={() => setSelLang('All')} style={{ fontSize: 10, fontWeight: 800, background: 'rgba(13,107,110,0.1)', border: '1px solid rgba(13,107,110,0.25)', borderRadius: 99, padding: '4px 11px', color: '#0D6B6E', cursor: 'pointer' }}>{selLang} ✕</span>}
            {selType !== 'All' && <span onClick={() => setSelType('All')} style={{ fontSize: 10, fontWeight: 800, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 99, padding: '4px 11px', color: '#7C3AED', cursor: 'pointer' }}>{selType} ✕</span>}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'vc-spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 11, fontWeight: 800, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.15em' }}>शब्द शोधत आहोत...</div>
          </div>
        ) : vocab.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', border: '1px dashed rgba(28,43,43,0.12)', borderRadius: 22 }}>
            <BookOpen size={44} style={{ color: '#B0CCCC', margin: '0 auto 14px' }} />
            <div style={{ fontWeight: 800, fontSize: 15, color: '#4A6060', marginBottom: 10 }}>शब्द सापडले नाहीत</div>
            <button onClick={() => { setSelLang('All'); setSelType('All'); setSearchTerm(''); }}
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 10, padding: '8px 18px', color: '#7C3AED', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
              Filter Reset करा
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {vocab.map((item, idx) => {
                const hasAnswered  = answers[item.id] !== undefined;
                const isCorrect    = hasAnswered && answers[item.id] === item.correct_answer_index;
                const cs           = catStyle(item.category || '');
                const ls           = langStyle(item.language || 'English');
                const isFlashcard  = !item.options || item.options.length === 0;
                const globalIdx    = page * PAGE_SIZE + idx;

                return (
                  <div key={item.id} className="vc-card"
                    style={{ background: '#fff', border: `1.5px solid ${hasAnswered ? (isCorrect ? 'rgba(5,150,105,0.25)' : 'rgba(220,38,38,0.2)') : 'rgba(28,43,43,0.07)'}`, borderRadius: 20, overflow: 'hidden', animation: `vc-fade 0.2s ease ${idx * 0.02}s both`, boxShadow: '0 2px 10px rgba(28,43,43,0.05)' }}>
                    <div style={{ height: 2, background: hasAnswered ? (isCorrect ? '#10B981' : '#EF4444') : `linear-gradient(90deg,${cs.color}60,transparent)` }} />

                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, background: ls.bg, border: `1px solid ${ls.border}`, borderRadius: 99, padding: '3px 9px', color: ls.color, textTransform: 'uppercase' }}>{item.language || 'English'}</span>
                        {item.category && <span style={{ fontSize: 9, fontWeight: 800, background: cs.bg, border: `1px solid ${cs.border}`, borderRadius: 99, padding: '3px 9px', color: cs.color, textTransform: 'uppercase' }}>{item.category}</span>}
                        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#B0CCCC' }}>#{globalIdx + 1}</span>
                      </div>

                      <div style={{ fontWeight: 900, fontSize: 'clamp(1rem,3vw,1.3rem)', letterSpacing: '-0.02em', color: '#1C2B2B', marginBottom: 12, lineHeight: 1.3 }}>{item.question}</div>

                      {!isFlashcard && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: hasAnswered ? 12 : 0 }}>
                          {(item.options || []).map((opt: string, i: number) => {
                            const isSel   = answers[item.id] === i;
                            const isAns   = i === item.correct_answer_index;
                            let bg = '#FDF6EC', border = 'rgba(28,43,43,0.08)', color = '#1C2B2B';
                            let bdgBg = '#fff', bdgCol = '#4A6060', bdgBorder = '1.5px solid rgba(28,43,43,0.12)';
                            if (hasAnswered && isAns)           { bg='rgba(5,150,105,0.08)'; border='rgba(5,150,105,0.3)'; color='#065F46'; bdgBg='#059669'; bdgCol='#fff'; bdgBorder='none'; }
                            else if (hasAnswered && isSel)      { bg='rgba(220,38,38,0.06)'; border='rgba(220,38,38,0.25)'; color='#991B1B'; bdgBg='#DC2626'; bdgCol='#fff'; bdgBorder='none'; }
                            else if (hasAnswered)               { color='#9BBFC6'; bg='#F9F7F4'; }
                            else if (isSel)                    { bg='rgba(124,58,237,0.08)'; border='rgba(124,58,237,0.35)'; bdgBg='#7C3AED'; bdgCol='#fff'; bdgBorder='none'; }
                            return (
                              <button key={i} className="vc-opt" data-locked={hasAnswered ? 'true' : 'false'}
                                onClick={() => handleAnswer(item.id, i, item.correct_answer_index)}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderRadius: 11, border: `1.5px solid ${border}`, background: bg, color, fontWeight: 600, fontSize: 12, textAlign: 'left', cursor: hasAnswered ? 'default' : 'pointer', transition: 'all 0.15s ease' }}>
                                <span style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, background: bdgBg, color: bdgCol, border: bdgBorder, transition: 'all 0.15s' }}>
                                  {hasAnswered && isAns ? <Check size={12} /> : hasAnswered && isSel ? <X size={12} /> : String.fromCharCode(65 + i)}
                                </span>
                                <span style={{ flex: 1 }}>{opt}</span>
                                {hasAnswered && isAns && <CheckCircle2 size={13} style={{ color: '#059669', flexShrink: 0 }} />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {isFlashcard ? (
                        <div style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 13, padding: '12px 14px' }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>अर्थ / Meaning</div>
                          <p style={{ fontSize: 13, color: '#1C2B2B', lineHeight: 1.65, fontWeight: 600, margin: 0 }}>{item.explanation}</p>
                        </div>
                      ) : hasAnswered && item.explanation ? (
                        <div style={{ background: 'rgba(232,103,26,0.06)', border: '1px solid rgba(232,103,26,0.15)', borderRadius: 13, padding: '11px 13px', animation: 'vc-in 0.28s ease' }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#C4510E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <BookOpen size={10} /> स्पष्टीकरण
                          </div>
                          <p style={{ fontSize: 12, color: '#4A6060', lineHeight: 1.65, fontWeight: 500, fontStyle: 'italic', margin: 0 }}>{item.explanation}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
              <button disabled={page === 0} onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid rgba(28,43,43,0.1)', borderRadius: 12, padding: '11px 18px', color: '#4A6060', fontWeight: 800, fontSize: 13, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.3 : 1 }}>
                <ChevronLeft size={15} /> मागील
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7A9090' }}>{page * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE + PAGE_SIZE, total)} / {total}</div>
                {attempted > 0 && <div style={{ fontSize: 10, fontWeight: 800, color: accuracy >= 60 ? '#059669' : '#D97706', marginTop: 2 }}>{score} बरोबर · {accuracy}% अचूक</div>}
              </div>
              <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: (page+1)*PAGE_SIZE>=total ? '#F9F7F4' : 'linear-gradient(135deg,#7C3AED,#5B21B6)', border: 'none', borderRadius: 12, padding: '11px 18px', color: (page+1)*PAGE_SIZE>=total ? '#B0CCCC' : '#fff', fontWeight: 900, fontSize: 13, cursor: (page+1)*PAGE_SIZE>=total ? 'not-allowed' : 'pointer', boxShadow: (page+1)*PAGE_SIZE>=total ? 'none' : '0 4px 14px rgba(124,58,237,0.3)' }}>
                पुढील <ChevronRight size={15} />
              </button>
            </div>

            {(page+1)*PAGE_SIZE >= total && total > 0 && (
              <div style={{ marginTop: 24, textAlign: 'center', padding: '24px', background: '#fff', border: '1px solid rgba(28,43,43,0.08)', borderRadius: 20, boxShadow: '0 2px 12px rgba(28,43,43,0.06)', animation: 'vc-fade 0.3s ease' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
                <div style={{ fontWeight: 900, fontSize: 15, color: '#1C2B2B', marginBottom: 4 }}>सर्व {total} शब्द संपले!</div>
                {attempted > 0 && <div style={{ fontSize: 13, color: '#7A9090', fontWeight: 700, marginBottom: 14 }}>गुण: {score}/{attempted} · {accuracy}% अचूकता</div>}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={resetSession} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', border: 'none', borderRadius: 12, padding: '11px 22px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 5px 18px rgba(124,58,237,0.3)' }}>
                    <RefreshCcw size={14} /> पुन्हा सराव
                  </button>
                  <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#FDF6EC', border: '1.5px solid rgba(13,107,110,0.2)', borderRadius: 12, padding: '11px 20px', color: '#0D6B6E', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                    <ArrowLeft size={14} /> डॅशबोर्ड
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

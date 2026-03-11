import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { updateProgress } from '../App';
import {
  ArrowLeft, Search, Languages, BookOpen,
  ChevronDown, CheckCircle2, XCircle, Check, X,
  ChevronLeft, ChevronRight, RefreshCcw, Filter
} from 'lucide-react';

const CSS = `
  @keyframes vc-fade  { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes vc-spin  { to{transform:rotate(360deg)} }
  @keyframes vc-pop   { 0%{transform:scale(1)}45%{transform:scale(1.04)}100%{transform:scale(1)} }
  @keyframes vc-in    { from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)} }
  @keyframes vc-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,0.35)}50%{box-shadow:0 0 0 8px rgba(139,92,246,0)} }
  .vc-opt:hover:not([data-locked="true"]){background:rgba(255,255,255,0.07)!important;border-color:rgba(255,255,255,0.2)!important;transform:translateX(3px)}
  .vc-chip:hover{background:rgba(139,92,246,0.2)!important;border-color:rgba(139,92,246,0.45)!important;color:#A78BFA!important}
  .vc-chip-active{background:rgba(139,92,246,0.2)!important;border-color:rgba(139,92,246,0.45)!important;color:#A78BFA!important}
  .vc-card:hover{background:rgba(255,255,255,0.05)!important;border-color:rgba(139,92,246,0.2)!important}
  .vc-reset:hover{background:rgba(139,92,246,0.18)!important;color:#A78BFA!important}
`;

const PAGE_SIZE = 15;
const VOCAB_TYPES = ['All', 'Synonyms', 'Antonyms', 'One Word Substitution', 'Idioms & Phrases', 'Grammar Question', 'म्हणी', 'वाक्प्रचार'];
const LANG_OPTIONS = ['All', 'Marathi', 'English'];

// Category color map
function catStyle(cat: string) {
  if (cat === 'Synonyms')               return { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  color: '#10B981' };
  if (cat === 'Antonyms')               return { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   color: '#EF4444' };
  if (cat === 'One Word Substitution')  return { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  color: '#60A5FA' };
  if (cat === 'Idioms & Phrases')       return { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  color: '#F59E0B' };
  if (cat === 'म्हणी' || cat === 'वाक्प्रचार') return { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)', color: '#F97316' };
  return                                       { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', color: '#A78BFA' };
}

function langStyle(lang: string) {
  return lang === 'Marathi'
    ? { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)', color: '#F97316' }
    : { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', color: '#60A5FA' };
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

  // Quiz state
  const [answers, setAnswers]     = useState<Record<number, number>>({});
  const [score, setScore]         = useState(0);
  const [attempted, setAttempted] = useState(0);

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
    } catch (err: any) {
      console.error('Vocab load error:', err.message);
    }
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

  const resetSession = () => {
    setAnswers({});
    setScore(0);
    setAttempted(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const accuracy = attempted > 0 ? Math.round((score / attempted) * 100) : 0;

  const base: React.CSSProperties = {
    minHeight: '100vh', background: '#0B0F1A',
    fontFamily: "'Poppins','Noto Sans Devanagari',sans-serif", color: '#fff',
    padding: '16px 16px 80px',
  };

  return (
    <div style={base}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onBack}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', color: 'rgba(255,255,255,0.55)', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
              <ArrowLeft size={14} /> परत
            </button>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em', lineHeight: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Languages size={18} style={{ color: '#A78BFA' }} /> शब्दसंग्रह
              </div>
              {total > 0 && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginTop: 2 }}>{total.toLocaleString()} शब्द उपलब्ध</div>}
            </div>
          </div>

          {/* Score */}
          {attempted > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'vc-in 0.25s ease' }}>
              <div style={{ minWidth: 110 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>अचूकता</span>
                  <span style={{ fontSize: 10, fontWeight: 900, color: accuracy >= 60 ? '#10B981' : '#EF4444' }}>{accuracy}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: accuracy >= 60 ? '#10B981' : '#EF4444', width: `${accuracy}%`, borderRadius: 99, transition: 'width 0.4s ease' }} />
                </div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.28)', borderRadius: 10, padding: '7px 13px', fontWeight: 900, fontSize: 13, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                ✓ {score}/{attempted}
              </div>
              <button onClick={resetSession} className="vc-reset"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 10px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
                <RefreshCcw size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Search + Filter toggle */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="शब्द शोधा..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '10px 12px 10px 34px', color: '#fff', fontWeight: 600, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button onClick={() => setShowFilters(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: showFilters ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${showFilters ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '10px 16px', color: showFilters ? '#A78BFA' : 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            <Filter size={13} /> Filter {showFilters ? '▲' : '▼'}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '18px 18px 14px', marginBottom: 16, animation: 'vc-fade 0.2s ease' }}>
            {/* Language */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>भाषा</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {LANG_OPTIONS.map(l => (
                  <button key={l} className={`vc-chip${selLang === l ? ' vc-chip-active' : ''}`}
                    onClick={() => { setSelLang(l); setPage(0); }}
                    style={{ background: selLang === l ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selLang === l ? 'rgba(139,92,246,0.45)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 99, padding: '5px 14px', fontSize: 11, fontWeight: 800, color: selLang === l ? '#A78BFA' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {l === 'All' ? 'सर्व' : l}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>प्रकार</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {VOCAB_TYPES.map(t => (
                  <button key={t} className={`vc-chip${selType === t ? ' vc-chip-active' : ''}`}
                    onClick={() => { setSelType(t); setPage(0); }}
                    style={{ background: selType === t ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selType === t ? 'rgba(139,92,246,0.45)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 99, padding: '5px 13px', fontSize: 11, fontWeight: 800, color: selType === t ? '#A78BFA' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {t === 'All' ? 'सर्व' : t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active filter pills */}
        {(selLang !== 'All' || selType !== 'All') && (
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            {selLang !== 'All' && (
              <span onClick={() => setSelLang('All')}
                style={{ fontSize: 10, fontWeight: 800, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)', borderRadius: 99, padding: '4px 11px', color: '#60A5FA', cursor: 'pointer' }}>
                {selLang} ✕
              </span>
            )}
            {selType !== 'All' && (
              <span onClick={() => setSelType('All')}
                style={{ fontSize: 10, fontWeight: 800, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)', borderRadius: 99, padding: '4px 11px', color: '#A78BFA', cursor: 'pointer' }}>
                {selType} ✕
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, border: '3px solid rgba(139,92,246,0.18)', borderTopColor: '#A78BFA', borderRadius: '50%', animation: 'vc-spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>शब्द शोधत आहोत...</div>
          </div>
        ) : vocab.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 22 }}>
            <BookOpen size={44} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 14px' }} />
            <div style={{ fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>शब्द सापडले नाहीत</div>
            <button onClick={() => { setSelLang('All'); setSelType('All'); setSearchTerm(''); }}
              style={{ background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '8px 18px', color: '#A78BFA', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
              Filter Reset करा
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {vocab.map((item, idx) => {
                const hasAnswered = answers[item.id] !== undefined;
                const isCorrect = hasAnswered && answers[item.id] === item.correct_answer_index;
                const cs = catStyle(item.category || '');
                const ls = langStyle(item.language || 'English');
                const isFlashcard = !item.options || item.options.length === 0;
                const globalIdx = page * PAGE_SIZE + idx;

                return (
                  <div key={item.id} className="vc-card"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${hasAnswered ? (isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)') : 'rgba(255,255,255,0.07)'}`, borderRadius: 22, overflow: 'hidden', animation: `vc-fade 0.2s ease ${idx * 0.02}s both`, transition: 'all 0.18s' }}>

                    {/* Top accent */}
                    <div style={{ height: 2, background: hasAnswered ? (isCorrect ? '#10B981' : '#EF4444') : `linear-gradient(90deg, ${cs.color}60, transparent)` }} />

                    <div style={{ padding: '18px 20px' }}>
                      {/* Meta row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, background: ls.bg, border: `1px solid ${ls.border}`, borderRadius: 99, padding: '3px 9px', color: ls.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          {item.language || 'English'}
                        </span>
                        {item.category && (
                          <span style={{ fontSize: 9, fontWeight: 800, background: cs.bg, border: `1px solid ${cs.border}`, borderRadius: 99, padding: '3px 9px', color: cs.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {item.category}
                          </span>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.18)' }}>#{globalIdx + 1}</span>
                      </div>

                      {/* Word / Question */}
                      <div style={{ fontWeight: 900, fontSize: 'clamp(1.1rem,3vw,1.4rem)', letterSpacing: '-0.02em', color: '#fff', marginBottom: 12, lineHeight: 1.3 }}>
                        {item.question}
                      </div>

                      {/* MCQ mode */}
                      {!isFlashcard && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: hasAnswered ? 12 : 0 }}>
                          {(item.options || []).map((opt: string, i: number) => {
                            const isSel = answers[item.id] === i;
                            const isAnsCorrect = i === item.correct_answer_index;
                            let bg = 'rgba(255,255,255,0.03)'; let border = 'rgba(255,255,255,0.07)';
                            let color = 'rgba(255,255,255,0.65)';
                            let bdgBg = 'rgba(255,255,255,0.07)'; let bdgCol = 'rgba(255,255,255,0.35)';
                            if (hasAnswered && isAnsCorrect) {
                              bg = 'rgba(16,185,129,0.12)'; border = 'rgba(16,185,129,0.35)'; color = '#fff';
                              bdgBg = '#10B981'; bdgCol = '#fff';
                            } else if (hasAnswered && isSel && !isAnsCorrect) {
                              bg = 'rgba(239,68,68,0.1)'; border = 'rgba(239,68,68,0.3)'; color = 'rgba(255,255,255,0.45)';
                              bdgBg = '#EF4444'; bdgCol = '#fff';
                            } else if (hasAnswered) { color = 'rgba(255,255,255,0.2)'; }
                            else if (isSel) { bg = 'rgba(139,92,246,0.12)'; border = 'rgba(139,92,246,0.45)'; color = '#fff'; bdgBg = '#A78BFA'; bdgCol = '#fff'; }

                            return (
                              <button key={i} className="vc-opt" data-locked={hasAnswered ? 'true' : 'false'}
                                onClick={() => handleAnswer(item.id, i, item.correct_answer_index)}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, border: `1.5px solid ${border}`, background: bg, color, fontWeight: 700, fontSize: 13, textAlign: 'left', cursor: hasAnswered ? 'default' : 'pointer', transition: 'all 0.15s ease', animation: isSel && !hasAnswered ? 'vc-pop 0.2s ease' : 'none' }}>
                                <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, background: bdgBg, color: bdgCol, transition: 'all 0.15s' }}>
                                  {hasAnswered && isAnsCorrect ? <Check size={13} /> : hasAnswered && isSel && !isAnsCorrect ? <X size={13} /> : String.fromCharCode(65 + i)}
                                </span>
                                <span style={{ flex: 1 }}>{opt}</span>
                                {hasAnswered && isAnsCorrect && <CheckCircle2 size={14} style={{ color: '#10B981', flexShrink: 0 }} />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Flashcard / explanation reveal */}
                      {isFlashcard ? (
                        <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, padding: '14px 16px' }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>अर्थ / Meaning</div>
                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, fontWeight: 600, margin: 0 }}>{item.explanation}</p>
                        </div>
                      ) : hasAnswered && item.explanation ? (
                        <div style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.18)', borderRadius: 14, padding: '13px 15px', animation: 'vc-in 0.28s ease' }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <BookOpen size={11} /> स्पष्टीकरण
                          </div>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, fontWeight: 500, fontStyle: 'italic', margin: 0 }}>{item.explanation}</p>
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
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '11px 18px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: 13, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.3 : 1 }}>
                <ChevronLeft size={15} /> मागील
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                  {page * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE + PAGE_SIZE, total)} / {total}
                </div>
                {attempted > 0 && (
                  <div style={{ fontSize: 10, fontWeight: 800, color: accuracy >= 60 ? '#10B981' : '#F59E0B', marginTop: 2 }}>
                    {score} बरोबर · {accuracy}% अचूक
                  </div>
                )}
              </div>
              <button disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: (page + 1) * PAGE_SIZE >= total ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#8B5CF6,#6D28D9)', border: 'none', borderRadius: 12, padding: '11px 18px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: (page + 1) * PAGE_SIZE >= total ? 'not-allowed' : 'pointer', opacity: (page + 1) * PAGE_SIZE >= total ? 0.3 : 1, boxShadow: (page + 1) * PAGE_SIZE >= total ? 'none' : '0 4px 14px rgba(139,92,246,0.25)' }}>
                पुढील <ChevronRight size={15} />
              </button>
            </div>

            {/* End CTA */}
            {(page + 1) * PAGE_SIZE >= total && total > 0 && (
              <div style={{ marginTop: 24, textAlign: 'center', padding: '24px', background: 'rgba(139,92,246,0.05)', border: '1px dashed rgba(139,92,246,0.15)', borderRadius: 20, animation: 'vc-fade 0.3s ease' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
                <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 4 }}>सर्व {total} शब्द संपले!</div>
                {attempted > 0 && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 14 }}>
                    गुण: {score}/{attempted} · {accuracy}% अचूकता
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={resetSession}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', border: 'none', borderRadius: 12, padding: '11px 22px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 5px 18px rgba(139,92,246,0.28)' }}>
                    <RefreshCcw size={14} /> पुन्हा सराव
                  </button>
                  <button onClick={onBack}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '11px 20px', color: 'rgba(255,255,255,0.6)', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
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

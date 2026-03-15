import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, ChevronRight, ChevronLeft, Filter,
  BookOpen, CheckCircle2, X, Check, RotateCcw,
  Layers, Calendar, Tag, AlertCircle
} from 'lucide-react';
import { updateProgress } from '../App';

interface PYQQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
  subject: string;
  exam_name: string;
  year: number;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes pyq-fade  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pyq-scale { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
  @keyframes pyq-spin  { to{transform:rotate(360deg)} }
  @keyframes pyq-pop   { 0%{transform:scale(1)} 45%{transform:scale(1.03)} 100%{transform:scale(1)} }
  @keyframes pyq-slide { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  .pyq-opt { transition: all 0.18s ease !important; }
  .pyq-opt:hover:not([data-locked="true"]) {
    background: #FDF6EC !important;
    border-color: rgba(232,103,26,0.35) !important;
    transform: translateX(4px) !important;
    box-shadow: 0 4px 16px rgba(232,103,26,0.12) !important;
  }
  .pyq-card { transition: all 0.2s ease; }
  .pyq-card:hover {
    transform: translateX(4px) !important;
    box-shadow: 0 6px 24px rgba(28,43,43,0.1) !important;
    border-color: rgba(232,103,26,0.25) !important;
  }
  .pyq-year-btn { transition: all 0.15s ease; }
  .pyq-year-btn:hover { transform: translateY(-1px); }
  select.pyq-select { background: #fff !important; color: #1C2B2B !important; }
  select.pyq-select option { background: #fff; color: #1C2B2B; }
`;

const YEARS = ['ALL', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];
const PAGE_SIZE = 20;

export const PYQMode: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [questions, setQuestions]   = useState<PYQQuestion[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [year, setYear]             = useState('ALL');
  const [subject, setSubject]       = useState('ALL');
  const [exam, setExam]             = useState('ALL');
  const [subjects, setSubjects]     = useState<string[]>([]);
  const [exams, setExams]           = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage]             = useState(0);
  const [total, setTotal]           = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected]     = useState<number | null>(null);
  const [revealed, setRevealed]     = useState(false);
  const [sessionCorrect, setSessionCorrect]   = useState(0);
  const [sessionAttempted, setSessionAttempted] = useState(0);
  const [mode, setMode]             = useState<'list' | 'quiz'>('list');

  const fetchQuestions = useCallback(async () => {
    setLoading(true); setError('');
    try {
      let q = supabase.from('prelims_questions').select('*', { count: 'exact' });
      if (year !== 'ALL')    q = q.eq('year', parseInt(year));
      if (subject !== 'ALL') q = q.eq('subject', subject);
      if (exam !== 'ALL')    q = q.eq('exam_name', exam);
      q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1).order('year', { ascending: false });
      const { data, count, error: err } = await q;
      if (err) throw err;
      setQuestions(data || []);
      setTotal(count || 0);
    } catch { setError('प्रश्न लोड होऊ शकले नाहीत. पुन्हा try करा.'); }
    setLoading(false);
  }, [year, subject, exam, page]);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: e }] = await Promise.all([
        supabase.from('prelims_questions').select('subject').limit(500),
        supabase.from('prelims_questions').select('exam_name').limit(500),
      ]);
      if (s) setSubjects(['ALL', ...Array.from(new Set(s.map((x: any) => x.subject).filter(Boolean)))]);
      if (e) setExams(['ALL', ...Array.from(new Set(e.map((x: any) => x.exam_name).filter(Boolean)))]);
    })();
  }, []);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleAnswer = (i: number) => {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    const correct = i === questions[currentIdx]?.correct_answer_index;
    setSessionAttempted(p => p + 1);
    setSessionCorrect(p => p + (correct ? 1 : 0));
    updateProgress(1, correct ? 1 : 0);
  };

  const nextQ = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(p => p + 1); setSelected(null); setRevealed(false);
    } else if (page * PAGE_SIZE + questions.length < total) {
      setPage(p => p + 1); setCurrentIdx(0); setSelected(null); setRevealed(false);
    }
  };

  const prevQ = () => {
    if (currentIdx > 0) { setCurrentIdx(p => p - 1); setSelected(null); setRevealed(false); }
  };

  const resetFilters = () => { setYear('ALL'); setSubject('ALL'); setExam('ALL'); setPage(0); };

  const startQuiz = (idx = 0) => {
    setCurrentIdx(idx); setSelected(null); setRevealed(false);
    setSessionCorrect(0); setSessionAttempted(0); setMode('quiz');
  };

  const base: React.CSSProperties = {
    minHeight: '100vh',
    background: '#FDF6EC',
    fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif",
    color: '#1C2B2B',
    padding: '0 0 80px',
  };

  // ── QUIZ MODE ──────────────────────────────────────────────
  if (mode === 'quiz' && questions.length > 0) {
    const q = questions[currentIdx];
    const accuracy   = sessionAttempted > 0 ? Math.round((sessionCorrect / sessionAttempted) * 100) : 0;
    const globalIdx  = page * PAGE_SIZE + currentIdx;

    return (
      <div style={{ ...base }}>
        <style>{CSS}</style>

        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(253,246,236,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(232,103,26,0.1)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 16px rgba(232,103,26,0.08)', flexWrap: 'wrap' }}>
          <button onClick={() => setMode('list')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(13,107,110,0.08)', border: '1px solid rgba(13,107,110,0.15)', borderRadius: 10, padding: '7px 13px', color: '#0D6B6E', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            <ArrowLeft size={13} /> List
          </button>

          <div style={{ flex: 1, minWidth: 80, background: 'rgba(232,103,26,0.1)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius: 99, width: `${((globalIdx + 1) / total) * 100}%`, transition: 'width 0.4s ease' }} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.25)', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 900, color: '#059669' }}>
              ✓ {sessionCorrect}
            </div>
            <div style={{ background: '#fff', border: '1px solid rgba(28,43,43,0.1)', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 900, color: '#4A6060' }}>
              {globalIdx + 1}/{total}
            </div>
          </div>
        </div>

        {/* Question */}
        <div style={{ maxWidth: 680, margin: '24px auto 0', padding: '0 16px' }}>
          <div style={{ background: '#fff', border: '1px solid rgba(28,43,43,0.08)', borderRadius: 24, padding: '28px 24px', animation: 'pyq-fade 0.22s ease', boxShadow: '0 4px 24px rgba(28,43,43,0.08)' }}>

            {/* Meta badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
              {q?.year && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(232,103,26,0.1)', border: '1px solid rgba(232,103,26,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: 10, fontWeight: 800, color: '#C4510E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <Calendar size={10} /> {q.year}
                </span>
              )}
              {q?.exam_name && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(13,107,110,0.1)', border: '1px solid rgba(13,107,110,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: 10, fontWeight: 800, color: '#0D6B6E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <Layers size={10} /> {q.exam_name}
                </span>
              )}
              {q?.subject && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: 10, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <Tag size={10} /> {q.subject}
                </span>
              )}
            </div>

            {/* Question text */}
            <p style={{ fontWeight: 700, fontSize: 'clamp(0.95rem,2.5vw,1.15rem)', lineHeight: 1.7, color: '#1C2B2B', marginBottom: 24 }}>
              <span style={{ color: '#E8671A', fontWeight: 900 }}>Q.{globalIdx + 1} </span>
              {q?.question}
            </p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(q?.options || []).map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect  = i === q.correct_answer_index;
                let bg = '#FDF6EC', border = 'rgba(28,43,43,0.08)', color = '#1C2B2B';
                let badgeBg = '#fff', badgeColor = '#4A6060', badgeBorder = '1.5px solid rgba(28,43,43,0.12)';

                if (revealed && isCorrect) {
                  bg = 'rgba(5,150,105,0.08)'; border = 'rgba(5,150,105,0.3)'; color = '#065F46';
                  badgeBg = '#059669'; badgeColor = '#fff'; badgeBorder = 'none';
                } else if (revealed && isSelected && !isCorrect) {
                  bg = 'rgba(220,38,38,0.07)'; border = 'rgba(220,38,38,0.28)'; color = '#991B1B';
                  badgeBg = '#DC2626'; badgeColor = '#fff'; badgeBorder = 'none';
                } else if (revealed) {
                  color = '#9BBFC6'; bg = '#F9F7F4';
                } else if (isSelected) {
                  bg = 'rgba(232,103,26,0.08)'; border = '#E8671A'; color = '#1C2B2B';
                  badgeBg = '#E8671A'; badgeColor = '#fff'; badgeBorder = 'none';
                }

                return (
                  <button key={i} className="pyq-opt" data-locked={revealed ? 'true' : 'false'}
                    onClick={() => handleAnswer(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 13, border: `1.5px solid ${border}`, background: bg, color, fontWeight: 600, fontSize: 13, textAlign: 'left', cursor: revealed ? 'default' : 'pointer', animation: isSelected && !revealed ? 'pyq-pop 0.2s ease' : 'none', boxShadow: isSelected && !revealed ? '0 4px 16px rgba(232,103,26,0.15)' : 'none' }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, background: badgeBg, color: badgeColor, border: badgeBorder, transition: 'all 0.16s' }}>
                      {revealed && isCorrect ? <Check size={13} /> : revealed && isSelected && !isCorrect ? <X size={13} /> : String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ flex: 1 }}>{opt}</span>
                    {revealed && isCorrect && <CheckCircle2 size={15} style={{ color: '#059669', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {revealed && q?.explanation && (
              <div style={{ marginTop: 18, background: 'rgba(232,103,26,0.06)', border: '1px solid rgba(232,103,26,0.15)', borderRadius: 14, padding: '14px 16px', animation: 'pyq-fade 0.3s ease' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#C4510E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <BookOpen size={11} /> स्पष्टीकरण
                </div>
                <p style={{ fontSize: 12, color: '#4A6060', lineHeight: 1.65, fontWeight: 500, fontStyle: 'italic', margin: 0 }}>{q.explanation}</p>
              </div>
            )}

            {/* Accuracy */}
            {sessionAttempted > 0 && (
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, background: 'rgba(28,43,43,0.08)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: accuracy >= 60 ? '#10B981' : '#E8671A', borderRadius: 99, width: `${accuracy}%`, transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#7A9090', whiteSpace: 'nowrap' }}>
                  {accuracy}% ({sessionCorrect}/{sessionAttempted})
                </span>
              </div>
            )}
          </div>

          {/* Prev / Next */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <button onClick={prevQ} disabled={currentIdx === 0 && page === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid rgba(28,43,43,0.1)', borderRadius: 12, padding: '11px 18px', color: '#4A6060', fontWeight: 800, fontSize: 13, cursor: (currentIdx === 0 && page === 0) ? 'not-allowed' : 'pointer', opacity: (currentIdx === 0 && page === 0) ? 0.35 : 1, boxShadow: '0 2px 8px rgba(28,43,43,0.06)' }}>
              <ChevronLeft size={15} /> मागे
            </button>
            <button onClick={nextQ}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#E8671A,#C4510E)', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 6px 20px rgba(232,103,26,0.3)' }}>
              पुढे <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST MODE ──────────────────────────────────────────────
  return (
    <div style={{ ...base }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1C2B2B,#0D6B6E)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 4px 20px rgba(13,107,110,0.3)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 14px', color: '#FDF6EC', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            <ArrowLeft size={14} /> परत
          </button>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#F5C842', letterSpacing: '-0.02em' }}>PYQ संच</div>
            {total > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, marginTop: 1 }}>{total.toLocaleString()} प्रश्न उपलब्ध</div>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowFilters(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: showFilters ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.1)', border: `1px solid ${showFilters ? 'rgba(245,200,66,0.4)' : 'rgba(255,255,255,0.2)'}`, borderRadius: 10, padding: '8px 14px', color: showFilters ? '#F5C842' : '#FDF6EC', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            <Filter size={13} /> Filter {showFilters ? '▲' : '▼'}
          </button>
          {questions.length > 0 && (
            <button onClick={() => startQuiz(0)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#E8671A,#C4510E)', border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', fontWeight: 900, fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 16px rgba(232,103,26,0.35)' }}>
              Quiz सुरू करा →
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>

        {/* Filters panel */}
        {showFilters && (
          <div style={{ background: '#fff', border: '1px solid rgba(28,43,43,0.08)', borderRadius: 20, padding: '20px', marginBottom: 20, animation: 'pyq-fade 0.2s ease', boxShadow: '0 2px 16px rgba(28,43,43,0.06)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>

              {/* Year */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>वर्ष</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {YEARS.map(y => (
                    <button key={y} className="pyq-year-btn"
                      onClick={() => { setYear(y); setPage(0); }}
                      style={{ background: year === y ? 'rgba(232,103,26,0.12)' : '#FDF6EC', border: `1.5px solid ${year === y ? '#E8671A' : 'rgba(28,43,43,0.1)'}`, borderRadius: 99, padding: '5px 13px', fontSize: 11, fontWeight: 800, color: year === y ? '#C4510E' : '#4A6060', cursor: 'pointer', boxShadow: year === y ? '0 2px 8px rgba(232,103,26,0.2)' : 'none' }}>
                      {y === 'ALL' ? 'सर्व' : y}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              {subjects.length > 1 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>विषय</div>
                  <select value={subject} onChange={e => { setSubject(e.target.value); setPage(0); }} className="pyq-select"
                    style={{ background: '#fff', border: '1.5px solid rgba(28,43,43,0.1)', borderRadius: 10, padding: '8px 12px', color: '#1C2B2B', fontWeight: 700, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                    {subjects.map(s => <option key={s} value={s}>{s === 'ALL' ? 'सर्व विषय' : s}</option>)}
                  </select>
                </div>
              )}

              {/* Exam */}
              {exams.length > 1 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>परीक्षा</div>
                  <select value={exam} onChange={e => { setExam(e.target.value); setPage(0); }} className="pyq-select"
                    style={{ background: '#fff', border: '1.5px solid rgba(28,43,43,0.1)', borderRadius: 10, padding: '8px 12px', color: '#1C2B2B', fontWeight: 700, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                    {exams.map(e => <option key={e} value={e}>{e === 'ALL' ? 'सर्व परीक्षा' : e}</option>)}
                  </select>
                </div>
              )}

              {(year !== 'ALL' || subject !== 'ALL' || exam !== 'ALL') && (
                <button onClick={resetFilters}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '8px 14px', color: '#DC2626', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                  <RotateCcw size={12} /> Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '80px 0' }}>
            <div style={{ width: 48, height: 48, border: '4px solid rgba(232,103,26,0.15)', borderTopColor: '#E8671A', borderRadius: '50%', animation: 'pyq-spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, fontWeight: 800, color: '#7A9090' }}>लोड होत आहे...</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 20, border: '1px solid rgba(28,43,43,0.08)' }}>
            <AlertCircle size={40} style={{ color: '#EF4444', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 800, fontSize: 15, color: '#1C2B2B', marginBottom: 12 }}>{error}</div>
            <button onClick={fetchQuestions}
              style={{ background: '#FDF6EC', border: '1.5px solid rgba(28,43,43,0.1)', borderRadius: 10, padding: '9px 20px', color: '#1C2B2B', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
              पुन्हा try करा
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && questions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 20, border: '1px dashed rgba(28,43,43,0.12)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#1C2B2B', marginBottom: 8 }}>निवडलेल्या filter साठी प्रश्न नाहीत</div>
            <button onClick={resetFilters}
              style={{ background: 'rgba(232,103,26,0.1)', border: '1.5px solid rgba(232,103,26,0.2)', borderRadius: 10, padding: '9px 18px', color: '#C4510E', fontWeight: 800, fontSize: 12, cursor: 'pointer', marginTop: 8 }}>
              Filter Reset करा
            </button>
          </div>
        )}

        {/* Question list */}
        {!loading && !error && questions.length > 0 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {questions.map((q, i) => (
                <div key={q.id} className="pyq-card"
                  style={{ background: '#fff', border: '1.5px solid rgba(28,43,43,0.08)', borderRadius: 18, padding: '16px 20px', animation: `pyq-slide 0.2s ease ${i * 0.02}s both`, cursor: 'pointer', boxShadow: '0 2px 8px rgba(28,43,43,0.05)' }}
                  onClick={() => startQuiz(i)}>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {q.year && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(232,103,26,0.1)', border: '1px solid rgba(232,103,26,0.2)', borderRadius: 99, padding: '3px 9px', color: '#C4510E', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{q.year}</span>
                    )}
                    {q.exam_name && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(13,107,110,0.1)', border: '1px solid rgba(13,107,110,0.2)', borderRadius: 99, padding: '3px 9px', color: '#0D6B6E', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{q.exam_name}</span>
                    )}
                    {q.subject && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 99, padding: '3px 9px', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{q.subject}</span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#B0CCCC' }}>#{page * PAGE_SIZE + i + 1}</span>
                  </div>

                  <p style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.6, color: '#1C2B2B', margin: '0 0 10px' }}>{q.question}</p>

                  <div style={{ fontSize: 10, fontWeight: 800, color: '#E8671A', display: 'flex', alignItems: 'center', gap: 4 }}>
                    सराव करा <ChevronRight size={11} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid rgba(28,43,43,0.1)', borderRadius: 11, padding: '10px 18px', color: '#4A6060', fontWeight: 800, fontSize: 13, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.35 : 1, boxShadow: '0 2px 8px rgba(28,43,43,0.06)' }}>
                <ChevronLeft size={15} /> मागील
              </button>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7A9090' }}>
                {page * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE + PAGE_SIZE, total)} / {total}
              </div>
              <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: (page + 1) * PAGE_SIZE >= total ? '#fff' : 'linear-gradient(135deg,#E8671A,#C4510E)', border: 'none', borderRadius: 11, padding: '10px 18px', color: (page + 1) * PAGE_SIZE >= total ? '#B0CCCC' : '#fff', fontWeight: 900, fontSize: 13, cursor: (page + 1) * PAGE_SIZE >= total ? 'not-allowed' : 'pointer', boxShadow: (page + 1) * PAGE_SIZE >= total ? 'none' : '0 4px 14px rgba(232,103,26,0.3)' }}>
                पुढील <ChevronRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

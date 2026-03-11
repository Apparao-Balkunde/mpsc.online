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
  @keyframes pyq-fade { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes pyq-scale { from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)} }
  @keyframes pyq-spin { to{transform:rotate(360deg)} }
  @keyframes pyq-pop { 0%{transform:scale(1)}45%{transform:scale(1.04)}100%{transform:scale(1)} }
  @keyframes pyq-slide { from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)} }
  .pyq-opt:hover:not([data-locked="true"]){background:rgba(255,255,255,0.07)!important;border-color:rgba(255,255,255,0.2)!important;transform:translateX(3px)}
  .pyq-chip:hover{background:rgba(249,115,22,0.18)!important;border-color:rgba(249,115,22,0.45)!important;color:#F97316!important}
  .pyq-chip-active{background:rgba(249,115,22,0.18)!important;border-color:rgba(249,115,22,0.45)!important;color:#F97316!important}
  .pyq-filter:hover{border-color:rgba(255,255,255,0.2)!important}
`;

const YEARS = ['ALL', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];
const PAGE_SIZE = 20;

export const PYQMode: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [year, setYear] = useState('ALL');
  const [subject, setSubject] = useState('ALL');
  const [exam, setExam] = useState('ALL');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [exams, setExams] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Quiz state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionAttempted, setSessionAttempted] = useState(0);
  const [mode, setMode] = useState<'list' | 'quiz'>('list');

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let q = supabase.from('prelims_questions').select('*', { count: 'exact' });
      if (year !== 'ALL') q = q.eq('year', parseInt(year));
      if (subject !== 'ALL') q = q.eq('subject', subject);
      if (exam !== 'ALL') q = q.eq('exam_name', exam);
      q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1).order('year', { ascending: false });

      const { data, count, error: err } = await q;
      if (err) throw err;
      setQuestions(data || []);
      setTotal(count || 0);
    } catch (e) {
      setError('प्रश्न लोड होऊ शकले नाहीत. पुन्हा try करा.');
    }
    setLoading(false);
  }, [year, subject, exam, page]);

  // Load filter options
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
    const newAttempted = sessionAttempted + 1;
    const newCorrect = sessionCorrect + (correct ? 1 : 0);
    setSessionAttempted(newAttempted);
    setSessionCorrect(newCorrect);
    updateProgress(1, correct ? 1 : 0);
  };

  const nextQ = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(p => p + 1);
      setSelected(null);
      setRevealed(false);
    } else if (page * PAGE_SIZE + questions.length < total) {
      setPage(p => p + 1);
      setCurrentIdx(0);
      setSelected(null);
      setRevealed(false);
    }
  };

  const prevQ = () => {
    if (currentIdx > 0) {
      setCurrentIdx(p => p - 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const resetFilters = () => {
    setYear('ALL');
    setSubject('ALL');
    setExam('ALL');
    setPage(0);
  };

  const startQuiz = () => {
    setCurrentIdx(0);
    setSelected(null);
    setRevealed(false);
    setSessionCorrect(0);
    setSessionAttempted(0);
    setMode('quiz');
  };

  const base: React.CSSProperties = {
    minHeight: '100vh', background: '#0B0F1A',
    fontFamily: "'Poppins','Noto Sans Devanagari',sans-serif", color: '#fff',
  };

  // QUIZ MODE
  if (mode === 'quiz' && questions.length > 0) {
    const q = questions[currentIdx];
    const accuracy = sessionAttempted > 0 ? Math.round((sessionCorrect / sessionAttempted) * 100) : 0;
    const globalIdx = page * PAGE_SIZE + currentIdx;

    return (
      <div style={{ ...base, padding: '16px 16px 80px' }}>
        <style>{CSS}</style>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => setMode('list')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', color: 'rgba(255,255,255,0.55)', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            <ArrowLeft size={14} /> List
          </button>

          {/* Progress bar */}
          <div style={{ flex: 1, minWidth: 100 }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,#F97316,#FBBF24)', borderRadius: 99, width: `${((globalIdx + 1) / total) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Session stats */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.28)', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 900, color: '#10B981' }}>
              ✓ {sessionCorrect}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>
              {globalIdx + 1}/{total}
            </div>
          </div>
        </div>

        {/* Question card */}
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 26, padding: '28px 24px', animation: 'pyq-fade 0.22s ease' }}>

            {/* Meta badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
              {q?.year && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(249,115,22,0.14)', border: '1px solid rgba(249,115,22,0.28)', borderRadius: 99, padding: '4px 12px', fontSize: 10, fontWeight: 800, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <Calendar size={10} /> {q.year}
                </span>
              )}
              {q?.exam_name && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 99, padding: '4px 12px', fontSize: 10, fontWeight: 800, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <Layers size={10} /> {q.exam_name}
                </span>
              )}
              {q?.subject && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 99, padding: '4px 12px', fontSize: 10, fontWeight: 800, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <Tag size={10} /> {q.subject}
                </span>
              )}
            </div>

            {/* Question */}
            <p style={{ fontWeight: 700, fontSize: 'clamp(0.95rem,2.5vw,1.15rem)', lineHeight: 1.65, color: '#fff', marginBottom: 24 }}>
              <span style={{ color: '#F97316', fontWeight: 900 }}>Q.{globalIdx + 1} </span>
              {q?.question}
            </p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {(q?.options || []).map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = i === q.correct_answer_index;
                let bg = 'rgba(255,255,255,0.03)';
                let border = 'rgba(255,255,255,0.07)';
                let color = 'rgba(255,255,255,0.65)';
                let badgeBg = 'rgba(255,255,255,0.07)';
                let badgeColor = 'rgba(255,255,255,0.35)';

                if (revealed && isCorrect) {
                  bg = 'rgba(16,185,129,0.12)'; border = 'rgba(16,185,129,0.35)';
                  color = '#fff'; badgeBg = '#10B981'; badgeColor = '#fff';
                } else if (revealed && isSelected && !isCorrect) {
                  bg = 'rgba(239,68,68,0.1)'; border = 'rgba(239,68,68,0.32)';
                  color = 'rgba(255,255,255,0.55)'; badgeBg = '#EF4444'; badgeColor = '#fff';
                } else if (revealed) {
                  color = 'rgba(255,255,255,0.28)';
                } else if (isSelected) {
                  bg = 'rgba(249,115,22,0.11)'; border = 'rgba(249,115,22,0.5)';
                  color = '#fff'; badgeBg = '#F97316'; badgeColor = '#fff';
                }

                return (
                  <button key={i} className="pyq-opt" data-locked={revealed ? 'true' : 'false'}
                    onClick={() => handleAnswer(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', borderRadius: 13, border: `1.5px solid ${border}`, background: bg, color, fontWeight: 700, fontSize: 13, textAlign: 'left', cursor: revealed ? 'default' : 'pointer', transition: 'all 0.16s ease', animation: isSelected && !revealed ? 'pyq-pop 0.2s ease' : 'none' }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, background: badgeBg, color: badgeColor, transition: 'all 0.16s' }}>
                      {revealed && isCorrect ? <Check size={14} /> : revealed && isSelected && !isCorrect ? <X size={14} /> : String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ flex: 1 }}>{opt}</span>
                    {revealed && isCorrect && <CheckCircle2 size={15} style={{ color: '#10B981', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {revealed && q?.explanation && (
              <div style={{ marginTop: 18, background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.18)', borderRadius: 14, padding: '14px 16px', animation: 'pyq-fade 0.3s ease' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <BookOpen size={11} /> स्पष्टीकरण
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, fontWeight: 500, fontStyle: 'italic' }}>{q.explanation}</p>
              </div>
            )}

            {/* Accuracy snapshot */}
            {sessionAttempted > 0 && (
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: accuracy >= 60 ? '#10B981' : '#EF4444', borderRadius: 99, width: `${accuracy}%`, transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                  {accuracy}% ({sessionCorrect}/{sessionAttempted})
                </span>
              </div>
            )}
          </div>

          {/* Prev / Next */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <button onClick={prevQ} disabled={currentIdx === 0 && page === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '11px 18px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: 13, cursor: (currentIdx === 0 && page === 0) ? 'not-allowed' : 'pointer', opacity: (currentIdx === 0 && page === 0) ? 0.3 : 1 }}>
              <ChevronLeft size={15} /> मागे
            </button>
            <button onClick={nextQ}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#F97316,#EF4444)', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 5px 18px rgba(249,115,22,0.22)' }}>
              पुढे <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LIST / BROWSE MODE
  return (
    <div style={{ ...base, padding: '16px 16px 80px' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ maxWidth: 860, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', color: 'rgba(255,255,255,0.55)', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            <ArrowLeft size={14} /> परत
          </button>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em', lineHeight: 1 }}>PYQ संच</div>
            {total > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginTop: 2 }}>{total.toLocaleString()} प्रश्न उपलब्ध</div>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowFilters(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: showFilters ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${showFilters ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '8px 14px', color: showFilters ? '#F97316' : 'rgba(255,255,255,0.55)', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            <Filter size={13} /> Filter {showFilters ? '▲' : '▼'}
          </button>
          {questions.length > 0 && (
            <button onClick={startQuiz}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#F97316,#EF4444)', border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', fontWeight: 900, fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.25)' }}>
              Quiz सुरू करा →
            </button>
          )}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{ maxWidth: 860, margin: '0 auto 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '20px', animation: 'pyq-fade 0.2s ease' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>

            {/* Year */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>वर्ष</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {YEARS.map(y => (
                  <button key={y} className={`pyq-chip${year === y ? ' pyq-chip-active' : ''}`}
                    onClick={() => { setYear(y); setPage(0); }}
                    style={{ background: year === y ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.05)', border: `1px solid ${year === y ? 'rgba(249,115,22,0.45)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 99, padding: '5px 13px', fontSize: 11, fontWeight: 800, color: year === y ? '#F97316' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {y === 'ALL' ? 'सर्व' : y}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            {subjects.length > 1 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>विषय</div>
                <select value={subject} onChange={e => { setSubject(e.target.value); setPage(0); }} className="pyq-filter"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', color: '#fff', fontWeight: 700, fontSize: 12, outline: 'none', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                  {subjects.map(s => <option key={s} value={s} style={{ background: '#1e293b' }}>{s === 'ALL' ? 'सर्व विषय' : s}</option>)}
                </select>
              </div>
            )}

            {/* Exam */}
            {exams.length > 1 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>परीक्षा</div>
                <select value={exam} onChange={e => { setExam(e.target.value); setPage(0); }} className="pyq-filter"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', color: '#fff', fontWeight: 700, fontSize: 12, outline: 'none', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                  {exams.map(e => <option key={e} value={e} style={{ background: '#1e293b' }}>{e === 'ALL' ? 'सर्व परीक्षा' : e}</option>)}
                </select>
              </div>
            )}

            {(year !== 'ALL' || subject !== 'ALL' || exam !== 'ALL') && (
              <button onClick={resetFilters}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '8px 14px', color: '#EF4444', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, border: '3px solid rgba(249,115,22,0.18)', borderTopColor: '#F97316', borderRadius: '50%', animation: 'pyq-spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>लोड होत आहे...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <AlertCircle size={40} style={{ color: '#EF4444', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>{error}</div>
            <button onClick={fetchQuestions}
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, padding: '9px 20px', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
              पुन्हा try करा
            </button>
          </div>
        ) : questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>निवडलेल्या filter साठी प्रश्न नाहीत</div>
            <button onClick={resetFilters}
              style={{ marginTop: 16, background: 'rgba(249,115,22,0.14)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 10, padding: '9px 18px', color: '#F97316', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
              Filter Reset करा
            </button>
          </div>
        ) : (
          <>
            {/* Question list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {questions.map((q, i) => (
                <div key={q.id}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '16px 20px', animation: `pyq-slide 0.2s ease ${i * 0.02}s both`, cursor: 'pointer', transition: 'all 0.18s' }}
                  onClick={() => { setCurrentIdx(i); startQuiz(); }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateX(3px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>

                  {/* Badges row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {q.year && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(249,115,22,0.14)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 99, padding: '3px 9px', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {q.year}
                      </span>
                    )}
                    {q.exam_name && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 99, padding: '3px 9px', color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {q.exam_name}
                      </span>
                    )}
                    {q.subject && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 99, padding: '3px 9px', color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {q.subject}
                      </span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}>#{page * PAGE_SIZE + i + 1}</span>
                  </div>

                  <p style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                    {q.question}
                  </p>

                  <div style={{ marginTop: 10, fontSize: 10, fontWeight: 800, color: '#F97316', display: 'flex', alignItems: 'center', gap: 4 }}>
                    सराव करा <ChevronRight size={11} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, padding: '0 4px' }}>
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 11, padding: '10px 18px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: 13, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.3 : 1 }}>
                <ChevronLeft size={15} /> मागील
              </button>

              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                {page * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE + PAGE_SIZE, total)} / {total}
              </div>

              <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: (page + 1) * PAGE_SIZE >= total ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#F97316,#EF4444)', border: 'none', borderRadius: 11, padding: '10px 18px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: (page + 1) * PAGE_SIZE >= total ? 'not-allowed' : 'pointer', opacity: (page + 1) * PAGE_SIZE >= total ? 0.35 : 1, boxShadow: (page + 1) * PAGE_SIZE >= total ? 'none' : '0 4px 14px rgba(249,115,22,0.2)' }}>
                पुढील <ChevronRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

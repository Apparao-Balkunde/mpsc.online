import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, CheckCircle2, Trophy, BookOpen,
  ChevronDown, HelpCircle, XCircle, RefreshCcw,
  ChevronLeft, ChevronRight, Zap, Target
} from 'lucide-react';
import { Mode } from '../types';
import { updateProgress } from '../App';

interface Props {
  type: Mode.PRELIMS | Mode.MAINS | Mode.MOCK | 'VOCAB' | 'MOCK_TEST' | 'CURRENT_AFFAIRS' | 'SARALSEVA';
  onBack: () => void;
  tableName: string;
  onProgressUpdate?: () => void;
}

const CSS = `
  @keyframes qv-fade { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes qv-spin { to{transform:rotate(360deg)} }
  @keyframes qv-pop  { 0%{transform:scale(1)}45%{transform:scale(1.04)}100%{transform:scale(1)} }
  @keyframes qv-in   { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
  @keyframes qv-pulse{ 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,0.3)}50%{box-shadow:0 0 0 8px rgba(249,115,22,0)} }
  .qv-opt:hover:not([data-locked="true"]){background:rgba(255,255,255,0.07)!important;border-color:rgba(255,255,255,0.2)!important;transform:translateX(3px)}
  .qv-sel:hover{background:rgba(255,255,255,0.06)!important;border-color:rgba(255,255,255,0.12)!important}
  .qv-reset:hover{background:rgba(249,115,22,0.18)!important;color:#F97316!important}
`;

const PAGE_SIZE = 15;

const EXAM_OPTIONS: Record<string, string[]> = {
  SARALSEVA:      ['TCS', 'IBPS', 'ZP', 'Talathi', 'Police Bharti', 'MPSC'],
  DEFAULT:        ['Rajyaseva', 'Combined Group B', 'Combined Group C'],
};

const SUBJECT_OPTIONS: Record<string, string[]> = {
  PRELIMS:        ['History', 'Geography', 'Polity', 'Economics', 'Science', 'Environment', 'Current Affairs', 'Maths & Reasoning'],
  MAINS_DEFAULT:  ['Marathi', 'English', 'GS Paper 1', 'GS Paper 2', 'GS Paper 3', 'GS Paper 4'],
  MAINS_COMBINED: ['Paper 1 (Language)', 'Paper 2 (General Ability)'],
  MOCK:           ['State Board History', 'State Board Geography', 'State Board Science', 'State Board Polity'],
  SARALSEVA:      ['मराठी व्याकरण', 'English Grammar', 'सामान्य ज्ञान', 'बुद्धिमत्ता व गणित', 'सामान्य विज्ञान', 'भूगोल', 'राज्यघटना', 'अर्थशास्त्र'],
};

const YEARS = ['All', '2026', '2025', '2024', '2023', '2022', '2021', '2020'];

function getExamOptions(type: string) {
  return type === 'SARALSEVA' ? EXAM_OPTIONS.SARALSEVA : EXAM_OPTIONS.DEFAULT;
}

function getSubjectOptions(type: string, selExam: string) {
  if (type === 'SARALSEVA') return SUBJECT_OPTIONS.SARALSEVA;
  if (type === 'MOCK')      return SUBJECT_OPTIONS.MOCK;
  if (type === 'MAINS')     return selExam === 'Rajyaseva' ? SUBJECT_OPTIONS.MAINS_DEFAULT : SUBJECT_OPTIONS.MAINS_COMBINED;
  return SUBJECT_OPTIONS.PRELIMS;
}

// Difficulty badge color
function diffColor(d?: string) {
  if (!d) return { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', border: 'rgba(255,255,255,0.08)' };
  if (d === 'Easy')   return { bg: 'rgba(16,185,129,0.12)',  color: '#10B981', border: 'rgba(16,185,129,0.25)'  };
  if (d === 'Hard')   return { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444', border: 'rgba(239,68,68,0.25)'   };
  return                     { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', border: 'rgba(245,158,11,0.25)'  };
}

// Mini dropdown component
const DarkSelect = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '9px 34px 9px 12px', color: '#fff', fontWeight: 700, fontSize: 12, outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
        <option value="All" style={{ background: '#1a1f2e' }}>सर्व (All)</option>
        {options.map(o => <option key={o} value={o} style={{ background: '#1a1f2e' }}>{o}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
    </div>
  </div>
);

export const QuestionView: React.FC<Props> = ({ type, onBack, tableName, onProgressUpdate }) => {
  const [dataList, setDataList]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(0);

  const [selExam, setSelExam]       = useState(type === 'SARALSEVA' ? 'TCS' : 'Rajyaseva');
  const [selYear, setSelYear]       = useState('All');
  const [selSubject, setSelSubject] = useState('All');

  const [answers, setAnswers]       = useState<Record<number, number>>({});
  const [score, setScore]           = useState(0);
  const [attempted, setAttempted]   = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase.from(tableName).select('*', { count: 'exact' });
      if (type !== 'CURRENT_AFFAIRS') q = q.eq('exam_name', selExam);
      if (selSubject !== 'All') q = q.eq('subject', selSubject);
      if (selYear !== 'All') q = q.eq('year', parseInt(selYear));
      q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1).order('id', { ascending: false });

      const { data, count, error } = await q;
      if (error) throw error;
      setDataList(data || []);
      setTotal(count || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [tableName, type, selExam, selSubject, selYear, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [selExam, selSubject, selYear]);

  const handleAnswer = (itemId: number, optIdx: number, correctIdx: number) => {
    if (answers[itemId] !== undefined) return;
    const correct = optIdx === correctIdx;
    setAnswers(prev => ({ ...prev, [itemId]: optIdx }));
    if (correct) setScore(p => p + 1);
    setAttempted(p => p + 1);
    updateProgress(1, correct ? 1 : 0);
    onProgressUpdate?.();
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
              <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {type === 'SARALSEVA' ? 'सरळसेवा' : type === 'CURRENT_AFFAIRS' ? 'चालू घडामोडी' : type === 'MOCK' ? 'State Board' : type === 'PRELIMS' ? 'पूर्व परीक्षा' : type === 'MAINS' ? 'मुख्य परीक्षा' : type}
              </div>
              {total > 0 && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginTop: 2 }}>{total.toLocaleString()} प्रश्न</div>}
            </div>
          </div>

          {/* Score + Reset */}
          {attempted > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'qv-in 0.25s ease' }}>
              {/* Accuracy bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>अचूकता</span>
                  <span style={{ fontSize: 10, fontWeight: 900, color: accuracy >= 60 ? '#10B981' : '#EF4444' }}>{accuracy}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: accuracy >= 60 ? '#10B981' : '#EF4444', width: `${accuracy}%`, borderRadius: 99, transition: 'width 0.4s ease' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.28)', borderRadius: 10, padding: '7px 13px', fontWeight: 900, fontSize: 13, color: '#10B981' }}>
                <Trophy size={14} /> {score}/{attempted}
              </div>
              <button onClick={resetSession} className="qv-reset"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 10px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
                <RefreshCcw size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '18px 20px', marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 14 }}>
          {type !== 'CURRENT_AFFAIRS' && (
            <DarkSelect
              label={type === 'SARALSEVA' ? 'पॅटर्न' : 'परीक्षा'}
              value={selExam}
              options={getExamOptions(type)}
              onChange={v => { setSelExam(v); setSelSubject('All'); }}
            />
          )}
          <DarkSelect label="विषय" value={selSubject} options={getSubjectOptions(type, selExam)} onChange={setSelSubject} />
          <DarkSelect label="वर्ष"  value={selYear}    options={YEARS.slice(1)}                   onChange={setSelYear}    />

          {/* Active filter pills */}
          {(selSubject !== 'All' || selYear !== 'All') && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
              {selSubject !== 'All' && (
                <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 99, padding: '4px 10px', color: '#A78BFA', cursor: 'pointer' }}
                  onClick={() => setSelSubject('All')}>
                  {selSubject} ✕
                </span>
              )}
              {selYear !== 'All' && (
                <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 99, padding: '4px 10px', color: '#F97316', cursor: 'pointer' }}
                  onClick={() => setSelYear('All')}>
                  {selYear} ✕
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, border: '3px solid rgba(249,115,22,0.18)', borderTopColor: '#F97316', borderRadius: '50%', animation: 'qv-spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>लोड होत आहे...</div>
          </div>
        ) : dataList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 24 }}>
            <HelpCircle size={44} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 14px' }} />
            <div style={{ fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>या फिल्टरसाठी प्रश्न नाहीत</div>
            <button onClick={() => { setSelSubject('All'); setSelYear('All'); }}
              style={{ background: 'rgba(249,115,22,0.14)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 10, padding: '8px 18px', color: '#F97316', fontWeight: 800, fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
              Filter Reset करा
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dataList.map((item, idx) => {
                const hasAnswered = answers[item.id] !== undefined;
                const globalIdx = page * PAGE_SIZE + idx;
                const dc = diffColor(item.difficulty);

                return (
                  <div key={item.id}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, overflow: 'hidden', animation: `qv-fade 0.2s ease ${idx * 0.025}s both` }}>

                    {/* Top accent based on answer */}
                    <div style={{ height: 2, background: !hasAnswered ? 'rgba(255,255,255,0.06)' : answers[item.id] === item.correct_answer_index ? '#10B981' : '#EF4444' }} />

                    <div style={{ padding: '20px 22px' }}>
                      {/* Meta row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                        {item.exam_name && (
                          <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: 99, padding: '3px 9px', color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {item.exam_name}
                          </span>
                        )}
                        {item.subject && (
                          <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: 99, padding: '3px 9px', color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {item.subject}
                          </span>
                        )}
                        {item.year && (
                          <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.22)', borderRadius: 99, padding: '3px 9px', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {item.year}
                          </span>
                        )}
                        {item.difficulty && (
                          <span style={{ fontSize: 9, fontWeight: 800, background: dc.bg, border: `1px solid ${dc.border}`, borderRadius: 99, padding: '3px 9px', color: dc.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {item.difficulty}
                          </span>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.18)' }}>#{globalIdx + 1}</span>
                      </div>

                      {/* Question */}
                      <p style={{ fontWeight: 700, fontSize: 'clamp(0.9rem,2.5vw,1.05rem)', lineHeight: 1.65, color: '#fff', marginBottom: 16 }}>
                        <span style={{ color: '#F97316', fontWeight: 900, marginRight: 6 }}>प्र.{globalIdx + 1}</span>
                        {item.question}
                      </p>

                      {/* Options */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(item.options || []).map((opt: string, i: number) => {
                          const isSelected = answers[item.id] === i;
                          const isCorrect  = i === item.correct_answer_index;
                          let bg     = 'rgba(255,255,255,0.03)';
                          let border = 'rgba(255,255,255,0.07)';
                          let color  = 'rgba(255,255,255,0.65)';
                          let bdgBg  = 'rgba(255,255,255,0.07)';
                          let bdgCol = 'rgba(255,255,255,0.35)';

                          if (hasAnswered && isCorrect) {
                            bg = 'rgba(16,185,129,0.12)'; border = 'rgba(16,185,129,0.35)'; color = '#fff';
                            bdgBg = '#10B981'; bdgCol = '#fff';
                          } else if (hasAnswered && isSelected && !isCorrect) {
                            bg = 'rgba(239,68,68,0.1)'; border = 'rgba(239,68,68,0.3)'; color = 'rgba(255,255,255,0.5)';
                            bdgBg = '#EF4444'; bdgCol = '#fff';
                          } else if (hasAnswered) {
                            color = 'rgba(255,255,255,0.22)';
                          } else if (isSelected) {
                            bg = 'rgba(249,115,22,0.11)'; border = 'rgba(249,115,22,0.5)'; color = '#fff';
                            bdgBg = '#F97316'; bdgCol = '#fff';
                          }

                          return (
                            <button key={i} className="qv-opt" data-locked={hasAnswered ? 'true' : 'false'}
                              onClick={() => handleAnswer(item.id, i, item.correct_answer_index)}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${border}`, background: bg, color, fontWeight: 700, fontSize: 13, textAlign: 'left', cursor: hasAnswered ? 'default' : 'pointer', transition: 'all 0.15s ease', animation: isSelected && !hasAnswered ? 'qv-pop 0.2s ease' : 'none' }}>
                              <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, background: bdgBg, color: bdgCol, transition: 'all 0.15s' }}>
                                {hasAnswered && isCorrect ? <CheckCircle2 size={13} /> : hasAnswered && isSelected && !isCorrect ? <XCircle size={13} /> : String.fromCharCode(65 + i)}
                              </span>
                              <span style={{ flex: 1 }}>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {hasAnswered && (
                        <div style={{ marginTop: 14, background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.18)', borderRadius: 14, padding: '13px 15px', animation: 'qv-in 0.28s ease' }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <BookOpen size={11} /> स्पष्टीकरण
                          </div>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, fontWeight: 500, fontStyle: 'italic', margin: 0 }}>
                            {item.explanation || 'या प्रश्नाचे स्पष्टीकरण उपलब्ध नाही.'}
                          </p>
                        </div>
                      )}
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

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                  {page * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE + PAGE_SIZE, total)} / {total}
                </span>
                {attempted > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: accuracy >= 60 ? '#10B981' : '#F59E0B' }}>
                    {score} बरोबर · {accuracy}% अचूक
                  </span>
                )}
              </div>

              <button disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: (page + 1) * PAGE_SIZE >= total ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#F97316,#EF4444)', border: 'none', borderRadius: 12, padding: '11px 18px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: (page + 1) * PAGE_SIZE >= total ? 'not-allowed' : 'pointer', opacity: (page + 1) * PAGE_SIZE >= total ? 0.3 : 1, boxShadow: (page + 1) * PAGE_SIZE >= total ? 'none' : '0 4px 14px rgba(249,115,22,0.2)' }}>
                पुढील <ChevronRight size={15} />
              </button>
            </div>

            {/* End of page CTA */}
            {(page + 1) * PAGE_SIZE >= total && total > 0 && (
              <div style={{ marginTop: 28, textAlign: 'center', padding: '28px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 20, animation: 'qv-fade 0.3s ease' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
                <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 4 }}>सर्व {total} प्रश्न संपले!</div>
                {attempted > 0 && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 16 }}>
                    अंतिम गुण: {score}/{attempted} · {accuracy}% अचूकता
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={resetSession}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#F97316,#EF4444)', border: 'none', borderRadius: 13, padding: '12px 24px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 6px 20px rgba(249,115,22,0.25)' }}>
                    <RefreshCcw size={15} /> पुन्हा सराव करा
                  </button>
                  <button onClick={onBack}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 13, padding: '12px 22px', color: 'rgba(255,255,255,0.65)', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                    <ArrowLeft size={15} /> डॅशबोर्ड
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

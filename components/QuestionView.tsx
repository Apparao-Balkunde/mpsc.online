import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { addXP, checkAndAwardBadges } from './xpSystem';
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
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes qv-fade { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes qv-spin { to{transform:rotate(360deg)} }
  @keyframes qv-pop  { 0%{transform:scale(1)}45%{transform:scale(1.03)}100%{transform:scale(1)} }
  @keyframes qv-in   { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
  .qv-opt:hover:not([data-locked="true"]) { background:#FDF6EC !important; border-color:rgba(232,103,26,0.3) !important; transform:translateX(4px) !important; box-shadow:0 4px 16px rgba(232,103,26,0.1) !important; }
  .qv-reset:hover { background:rgba(232,103,26,0.1) !important; color:#E8671A !important; }
  .qv-card { transition: box-shadow 0.2s ease; }
  .qv-card:hover { box-shadow: 0 8px 28px rgba(28,43,43,0.1) !important; }
`;

const PAGE_SIZE = 15;

const EXAM_OPTIONS: Record<string, string[]> = {
  SARALSEVA: ['TCS', 'IBPS', 'ZP', 'Talathi', 'Police Bharti', 'MPSC'],
  DEFAULT:   ['Rajyaseva', 'Combined Group B', 'Combined Group C'],
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

function diffColor(d?: string) {
  if (!d) return { bg: '#F3EFFE', color: '#8B7FD4', border: 'rgba(99,79,192,0.15)' };
  if (d === 'Easy') return { bg: 'rgba(5,150,105,0.08)', color: '#059669', border: 'rgba(5,150,105,0.2)' };
  if (d === 'Hard') return { bg: 'rgba(220,38,38,0.08)', color: '#DC2626', border: 'rgba(220,38,38,0.2)' };
  return { bg: 'rgba(217,119,6,0.08)', color: '#D97706', border: 'rgba(217,119,6,0.2)' };
}

const LightSelect = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <span style={{ fontSize: 9, fontWeight: 800, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: '#fff', border: '1.5px solid rgba(28,43,43,0.1)', borderRadius: 10, padding: '9px 30px 9px 12px', color: '#1C2B2B', fontWeight: 700, fontSize: 12, outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', fontFamily: "'Baloo 2',sans-serif" }}>
        <option value="All">सर्व (All)</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: '#7A9090', pointerEvents: 'none' }} />
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
  const [bookmarked, setBookmarked] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('mpsc_bookmarks_ids') || '[]')); } catch { return new Set(); }
  });
  const [xpToast, setXpToast]       = useState<{show:boolean; xp:number; msg:string}>({show:false,xp:0,msg:''});
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
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [tableName, type, selExam, selSubject, selYear, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(0); }, [selExam, selSubject, selYear]);

  const handleAnswer = (itemId: number, optIdx: number, correctIdx: number, item?: any) => {
    if (answers[itemId] !== undefined) return;
    const correct = optIdx === correctIdx;
    setAnswers(prev => ({ ...prev, [itemId]: optIdx }));
    if (correct) setScore(p => p + 1);
    setAttempted(p => p + 1);
    updateProgress(1, correct ? 1 : 0);
    onProgressUpdate?.();

    // XP System
    const xpEarned = correct ? 5 : 1;
    const progress = JSON.parse(localStorage.getItem('mpsc_user_progress') || '{}');
    const badges   = checkAndAwardBadges(progress.totalCorrect || 0, progress.streak || 0);
    const result   = addXP(xpEarned, badges);
    if (result.levelUp) {
      setXpToast({ show:true, xp:xpEarned, msg:'🎉 Level Up!' });
    } else if (correct) {
      setXpToast({ show:true, xp:xpEarned, msg:`+${xpEarned} XP` });
    }
    setTimeout(() => setXpToast(t => ({...t, show:false})), 2000);

    // Auto-add to Mistake Book if wrong
    if (!correct && item) {
      try {
        const mistakes = JSON.parse(localStorage.getItem('mpsc_mistake_book') || '[]');
        if (!mistakes.find((m: any) => m.question === item.question)) {
          mistakes.unshift({
            id: Date.now().toString(), question:item.question, options:item.options,
            correct_answer_index:item.correct_answer_index, explanation:item.explanation,
            subject:item.subject, wrongAnswer:optIdx,
            addedAt:new Date().toLocaleDateString('mr-IN'), revisedCount:0
          });
          localStorage.setItem('mpsc_mistake_book', JSON.stringify(mistakes.slice(0, 200)));
        }
      } catch {}
    }
  };

  const [reportedQs, setReportedQs] = useState<Set<number>>(new Set());
  const [reportToast, setReportToast] = useState('');

  const reportQuestion = (item: any) => {
    if (reportedQs.has(item.id)) return;
    setReportedQs(prev => new Set([...prev, item.id]));
    // Save report locally
    try {
      const reports = JSON.parse(localStorage.getItem('mpsc_reported_questions') || '[]');
      reports.push({ id: item.id, question: item.question.slice(0,80), table: tableName, reportedAt: new Date().toISOString() });
      localStorage.setItem('mpsc_reported_questions', JSON.stringify(reports.slice(-100)));
    } catch {}
    // Send to server (best-effort)
    fetch('/api/report-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: item.id, table: tableName, question: item.question.slice(0, 100) })
    }).catch(() => {});
    setReportToast('प्रश्न report झाला! आम्ही तपासू. धन्यवाद 🙏');
    setTimeout(() => setReportToast(''), 3000);
  };

  const toggleBookmark = (item: any) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
        // Remove from localStorage bookmarks
        try {
          const bms = JSON.parse(localStorage.getItem('mpsc_bookmarks') || '[]');
          localStorage.setItem('mpsc_bookmarks', JSON.stringify(bms.filter((b: any) => b.id !== item.id)));
          localStorage.setItem('mpsc_bookmarks_ids', JSON.stringify([...next]));
        } catch {}
      } else {
        next.add(item.id);
        // Save to localStorage bookmarks
        try {
          const bms = JSON.parse(localStorage.getItem('mpsc_bookmarks') || '[]');
          bms.unshift({ id:item.id, question:item.question, options:item.options,
            correct_answer_index:item.correct_answer_index, explanation:item.explanation,
            subject:item.subject, table:tableName });
          localStorage.setItem('mpsc_bookmarks', JSON.stringify(bms.slice(0, 500)));
          localStorage.setItem('mpsc_bookmarks_ids', JSON.stringify([...next]));
        } catch {}
      }
      return next;
    });
  };

  const resetSession = () => { setAnswers({}); setScore(0); setAttempted(0); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const accuracy = attempted > 0 ? Math.round((score / attempted) * 100) : 0;

  const modeLabel: Record<string, string> = {
    SARALSEVA: 'सरळसेवा', CURRENT_AFFAIRS: 'चालू घडामोडी',
    MOCK: 'State Board', PRELIMS: 'पूर्व परीक्षा', MAINS: 'मुख्य परीक्षा',
  };

  const base: React.CSSProperties = {
    minHeight: '100vh', background: '#FDF6EC',
    fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", color: '#1C2B2B',
    padding: '0 0 80px',
  };

  return (
    <div style={base}>
      {/* XP Toast */}
      {reportToast && (
        <div style={{ position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%)', zIndex:9999, background:'#EF4444', color:'#fff', fontWeight:800, fontSize:13, borderRadius:14, padding:'12px 20px', boxShadow:'0 6px 24px rgba(239,68,68,0.3)', whiteSpace:'nowrap', animation:'qv-fade 0.3s ease', fontFamily:"'Baloo 2',sans-serif" }}>
          ⚠️ {reportToast}
        </div>
      )}
      {xpToast.show && (
        <div style={{ position:'fixed', top:70, right:16, zIndex:999, background:'linear-gradient(135deg,#F97316,#F59E0B)', borderRadius:14, padding:'10px 16px', color:'#fff', fontWeight:900, fontSize:14, boxShadow:'0 6px 24px rgba(249,115,22,0.4)', animation:'qv-in 0.3s ease', display:'flex', alignItems:'center', gap:8 }}>
          ⚡ {xpToast.msg}
        </div>
      )}
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1C2B2B,#0D6B6E)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, boxShadow: '0 4px 20px rgba(13,107,110,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '7px 13px', color: '#FDF6EC', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            <ArrowLeft size={13} /> परत
          </button>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: '#F5C842', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {modeLabel[type] || type}
            </div>
            {total > 0 && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginTop: 2 }}>{total.toLocaleString()} प्रश्न उपलब्ध</div>}
          </div>
        </div>

        {attempted > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'qv-in 0.25s ease' }}>
            <div style={{ minWidth: 110 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>अचूकता</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: accuracy >= 60 ? '#10B981' : '#EF4444' }}>{accuracy}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: accuracy >= 60 ? '#10B981' : '#EF4444', width: `${accuracy}%`, borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10, padding: '6px 12px', fontWeight: 900, fontSize: 13, color: '#10B981' }}>
              <Trophy size={13} /> {score}/{attempted}
            </div>
            <button onClick={resetSession} className="qv-reset"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '7px 9px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
              <RefreshCcw size={14} />
            </button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '20px 16px' }}>

        {/* Filters */}
        <div style={{ background: '#fff', border: '1px solid rgba(28,43,43,0.08)', borderRadius: 18, padding: '16px 18px', marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, boxShadow: '0 2px 12px rgba(28,43,43,0.06)' }}>
          {type !== 'CURRENT_AFFAIRS' && (
            <LightSelect label={type === 'SARALSEVA' ? 'पॅटर्न' : 'परीक्षा'} value={selExam} options={getExamOptions(type)} onChange={v => { setSelExam(v); setSelSubject('All'); }} />
          )}
          <LightSelect label="विषय" value={selSubject} options={getSubjectOptions(type, selExam)} onChange={setSelSubject} />
          <LightSelect label="वर्ष"  value={selYear}    options={YEARS.slice(1)}                   onChange={setSelYear} />

          {(selSubject !== 'All' || selYear !== 'All') && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
              {selSubject !== 'All' && (
                <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 99, padding: '4px 10px', color: '#7C3AED', cursor: 'pointer' }}
                  onClick={() => setSelSubject('All')}>{selSubject} ✕</span>
              )}
              {selYear !== 'All' && (
                <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(232,103,26,0.1)', border: '1px solid rgba(232,103,26,0.25)', borderRadius: 99, padding: '4px 10px', color: '#E8671A', cursor: 'pointer' }}
                  onClick={() => setSelYear('All')}>{selYear} ✕</span>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, border: '3px solid rgba(232,103,26,0.2)', borderTopColor: '#E8671A', borderRadius: '50%', animation: 'qv-spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 11, fontWeight: 800, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.15em' }}>लोड होत आहे...</div>
          </div>
        ) : dataList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', border: '1px dashed rgba(28,43,43,0.12)', borderRadius: 22 }}>
            <HelpCircle size={44} style={{ color: '#B0CCCC', margin: '0 auto 14px' }} />
            <div style={{ fontWeight: 800, fontSize: 15, color: '#4A6060', marginBottom: 8 }}>या फिल्टरसाठी प्रश्न नाहीत</div>
            <button onClick={() => { setSelSubject('All'); setSelYear('All'); }}
              style={{ background: 'rgba(232,103,26,0.1)', border: '1px solid rgba(232,103,26,0.25)', borderRadius: 10, padding: '8px 18px', color: '#E8671A', fontWeight: 800, fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
              Filter Reset करा
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {dataList.map((item, idx) => {
                const hasAnswered = answers[item.id] !== undefined;
                const globalIdx  = page * PAGE_SIZE + idx;
                const dc         = diffColor(item.difficulty);
                const isCorrect  = hasAnswered && answers[item.id] === item.correct_answer_index;

                return (
                  <div key={item.id} className="qv-card"
                    style={{ background: '#fff', border: `1.5px solid ${hasAnswered ? (isCorrect ? 'rgba(5,150,105,0.25)' : 'rgba(220,38,38,0.2)') : 'rgba(28,43,43,0.07)'}`, borderRadius: 20, overflow: 'hidden', animation: `qv-fade 0.2s ease ${idx * 0.025}s both`, boxShadow: '0 2px 12px rgba(28,43,43,0.05)' }}>
                    <div style={{ height: 3, background: !hasAnswered ? 'linear-gradient(90deg,#E8671A,#F5C842,transparent)' : isCorrect ? '#10B981' : '#EF4444' }} />

                    <div style={{ padding: '18px 20px' }}>
                      {/* Meta */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        {item.exam_name && <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(13,107,110,0.1)', border: '1px solid rgba(13,107,110,0.2)', borderRadius: 99, padding: '3px 9px', color: '#0D6B6E', textTransform: 'uppercase' }}>{item.exam_name}</span>}
                        {item.subject   && <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 99, padding: '3px 9px', color: '#7C3AED', textTransform: 'uppercase' }}>{item.subject}</span>}
                        {item.year      && <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(232,103,26,0.1)', border: '1px solid rgba(232,103,26,0.2)', borderRadius: 99, padding: '3px 9px', color: '#C4510E', textTransform: 'uppercase' }}>{item.year}</span>}
                        {item.difficulty && <span style={{ fontSize: 9, fontWeight: 800, background: dc.bg, border: `1px solid ${dc.border}`, borderRadius: 99, padding: '3px 9px', color: dc.color, textTransform: 'uppercase' }}>{item.difficulty}</span>}
                        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#B0CCCC' }}>#{globalIdx + 1}</span>
                        {/* Bookmark button */}
                        <button onClick={e => { e.stopPropagation(); toggleBookmark(item); }}
                          style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 4px', display:'flex', alignItems:'center' }}
                          title={bookmarked.has(item.id) ? 'Bookmark remove करा' : 'Bookmark करा'}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={bookmarked.has(item.id) ? '#F97316' : 'none'} stroke={bookmarked.has(item.id) ? '#F97316' : '#B0CCCC'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                          </svg>
                        </button>
                        {/* Report button */}
                        <button onClick={e => { e.stopPropagation(); reportQuestion(item); }}
                          style={{ background:'none', border:'none', cursor: reportedQs.has(item.id) ? 'default' : 'pointer', padding:'2px 4px', display:'flex', alignItems:'center', opacity: reportedQs.has(item.id) ? 0.4 : 1 }}
                          title="चुकीचा प्रश्न report करा">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={reportedQs.has(item.id) ? '#EF4444' : '#D0D8D8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                        </button>
                      </div>

                      {/* Question */}
                      <p style={{ fontWeight: 700, fontSize: 'clamp(0.9rem,2.5vw,1.05rem)', lineHeight: 1.7, color: '#1C2B2B', marginBottom: 14 }}>
                        <span style={{ color: '#E8671A', fontWeight: 900, marginRight: 6 }}>प्र.{globalIdx + 1}</span>{item.question}
                      </p>

                      {/* Options */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(item.options || []).map((opt: string, i: number) => {
                          const isSelected = answers[item.id] === i;
                          const isAns      = i === item.correct_answer_index;
                          let bg = '#FDF6EC', border = 'rgba(28,43,43,0.08)', color = '#1C2B2B';
                          let bdgBg = '#fff', bdgCol = '#4A6060', bdgBorder = '1.5px solid rgba(28,43,43,0.12)';

                          if (hasAnswered && isAns)             { bg='rgba(5,150,105,0.08)'; border='rgba(5,150,105,0.3)'; color='#065F46'; bdgBg='#059669'; bdgCol='#fff'; bdgBorder='none'; }
                          else if (hasAnswered && isSelected)   { bg='rgba(220,38,38,0.06)'; border='rgba(220,38,38,0.25)'; color='#991B1B'; bdgBg='#DC2626'; bdgCol='#fff'; bdgBorder='none'; }
                          else if (hasAnswered)                 { color='#9BBFC6'; bg='#F9F7F4'; }
                          else if (isSelected)                  { bg='rgba(232,103,26,0.08)'; border='rgba(232,103,26,0.35)'; bdgBg='#E8671A'; bdgCol='#fff'; bdgBorder='none'; }

                          return (
                            <button key={i} className="qv-opt" data-locked={hasAnswered ? 'true' : 'false'}
                              onClick={() => handleAnswer(item.id, i, item.correct_answer_index, item)}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 13, border: `1.5px solid ${border}`, background: bg, color, fontWeight: 600, fontSize: 13, textAlign: 'left', cursor: hasAnswered ? 'default' : 'pointer', transition: 'all 0.15s ease', animation: isSelected && !hasAnswered ? 'qv-pop 0.2s ease' : 'none' }}>
                              <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, background: bdgBg, color: bdgCol, border: bdgBorder, transition: 'all 0.15s' }}>
                                {hasAnswered && isAns ? <CheckCircle2 size={13} /> : hasAnswered && isSelected ? <XCircle size={13} /> : String.fromCharCode(65 + i)}
                              </span>
                              <span style={{ flex: 1 }}>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Wrong answer indicator → auto saved to Mistake Book */}
                      {hasAnswered && answers[item.id] !== item.correct_answer_index && (
                        <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:6, fontSize:10, fontWeight:700, color:'#8B5CF6', background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.15)', borderRadius:10, padding:'7px 12px' }}>
                          📖 Mistake Book मध्ये auto-save झाले!
                        </div>
                      )}

                      {/* Explanation */}
                      {hasAnswered && (
                        <div style={{ marginTop: 14, background: 'rgba(232,103,26,0.06)', border: '1px solid rgba(232,103,26,0.15)', borderRadius: 14, padding: '12px 14px', animation: 'qv-in 0.28s ease' }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#C4510E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <BookOpen size={10} /> स्पष्टीकरण
                          </div>
                          <p style={{ fontSize: 12, color: '#4A6060', lineHeight: 1.65, fontWeight: 500, fontStyle: 'italic', margin: 0 }}>
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
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid rgba(28,43,43,0.1)', borderRadius: 12, padding: '11px 18px', color: '#4A6060', fontWeight: 800, fontSize: 13, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.3 : 1 }}>
                <ChevronLeft size={15} /> मागील
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#7A9090' }}>{page * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE + PAGE_SIZE, total)} / {total}</span>
                {attempted > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: accuracy >= 60 ? '#059669' : '#D97706' }}>{score} बरोबर · {accuracy}% अचूक</span>}
              </div>
              <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: (page + 1) * PAGE_SIZE >= total ? '#F9F7F4' : 'linear-gradient(135deg,#E8671A,#C4510E)', border: 'none', borderRadius: 12, padding: '11px 18px', color: (page + 1) * PAGE_SIZE >= total ? '#B0CCCC' : '#fff', fontWeight: 900, fontSize: 13, cursor: (page + 1) * PAGE_SIZE >= total ? 'not-allowed' : 'pointer', boxShadow: (page + 1) * PAGE_SIZE >= total ? 'none' : '0 4px 14px rgba(232,103,26,0.3)' }}>
                पुढील <ChevronRight size={15} />
              </button>
            </div>

            {(page + 1) * PAGE_SIZE >= total && total > 0 && (
              <div style={{ marginTop: 28, textAlign: 'center', padding: '28px', background: '#fff', border: '1px solid rgba(28,43,43,0.08)', borderRadius: 20, boxShadow: '0 2px 12px rgba(28,43,43,0.06)', animation: 'qv-fade 0.3s ease' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
                <div style={{ fontWeight: 900, fontSize: 15, color: '#1C2B2B', marginBottom: 4 }}>सर्व {total} प्रश्न संपले!</div>
                {attempted > 0 && <div style={{ fontSize: 13, color: '#7A9090', fontWeight: 700, marginBottom: 16 }}>अंतिम गुण: {score}/{attempted} · {accuracy}% अचूकता</div>}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={resetSession}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#E8671A,#C4510E)', border: 'none', borderRadius: 13, padding: '12px 24px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 6px 20px rgba(232,103,26,0.3)' }}>
                    <RefreshCcw size={15} /> पुन्हा सराव
                  </button>
                  <button onClick={onBack}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#FDF6EC', border: '1.5px solid rgba(13,107,110,0.2)', borderRadius: 13, padding: '12px 22px', color: '#0D6B6E', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
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

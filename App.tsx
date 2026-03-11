import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Mode, UserProgress } from './types';
import { QuestionView } from './components/QuestionView';
import { MockTestMode } from './components/MockTestMode';
import { VocabMode } from './components/VocabMode';
import { LiteratureMode } from './components/LiteratureMode';
import {
  History, BookOpen, Trophy, Newspaper, ShieldCheck,
  Zap, BookMarked, Menu, X, Target, Flame, Languages,
  GraduationCap, ChevronRight, Star, TrendingUp, Clock, Award
} from 'lucide-react';

// Progress helpers
const PROGRESS_KEY = 'mpsc_user_progress';

function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { totalAttempted: 0, totalCorrect: 0, streak: 0, lastActiveDate: '' };
}

function saveProgress(p: UserProgress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

export function updateProgress(attempted: number, correct: number) {
  const p = loadProgress();
  const today = new Date().toDateString();
  p.totalAttempted += attempted;
  p.totalCorrect += correct;
  if (p.lastActiveDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    p.streak = p.lastActiveDate === yesterday.toDateString() ? p.streak + 1 : 1;
    p.lastActiveDate = today;
  }
  saveProgress(p);
}

// Section config
const SECTIONS = [
  { mode: Mode.PRELIMS,         label: 'पूर्व परीक्षा',   sub: 'PYQ संच',            icon: History,       accent: '#3B82F6', tag: 'PYQ'   },
  { mode: Mode.MAINS,           label: 'मुख्य परीक्षा',   sub: 'GS + भाषा',          icon: BookMarked,    accent: '#10B981', tag: 'PYQ'   },
  { mode: Mode.SARALSEVA,       label: 'सरळसेवा',         sub: 'TCS / IBPS',         icon: ShieldCheck,   accent: '#06B6D4', tag: 'NEW'   },
  { mode: Mode.VOCAB,           label: 'शब्दसंग्रह',      sub: 'Marathi + English',  icon: Languages,     accent: '#8B5CF6', tag: 'HOT'   },
  { mode: Mode.LITERATURE,      label: 'मराठी साहित्य',   sub: 'Mains + NET/SET',    icon: GraduationCap, accent: '#F97316', tag: 'NEW'   },
  { mode: Mode.MOCK,            label: 'State Board',      sub: 'पाठ्यपुस्तक Mock',  icon: Trophy,        accent: '#F59E0B', tag: 'MOCK'  },
  { mode: Mode.CURRENT_AFFAIRS, label: 'चालू घडामोडी',   sub: 'Daily Updates',      icon: Newspaper,     accent: '#EC4899', tag: 'DAILY' },
];

// Circular ring component
function Ring({ pct, color, size = 80, stroke = 7 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
      />
    </svg>
  );
}

export default function App() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('mpsc_mode') as Mode) || Mode.HOME);
  const [count, setCount] = useState(0);
  const [progress, setProgress] = useState<UserProgress>(loadProgress());
  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const isExam = mode === Mode.MOCK_TEST;

  useEffect(() => {
    localStorage.setItem('mpsc_mode', mode);
    window.scrollTo(0, 0);
    setMenuOpen(false);
    setProgress(loadProgress());
  }, [mode]);

  useEffect(() => {
    const tables = ['prelims_questions', 'mains_questions', 'mock_questions', 'current_affairs', 'vocab_questions', 'literature_questions'];
    Promise.all(tables.map(t => supabase.from(t).select('*', { count: 'exact', head: true })))
      .then(rs => setCount(rs.reduce((a, c) => a + (c.count || 0), 0)))
      .catch(() => {});
    const tick = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  const accuracy = progress.totalAttempted > 0
    ? Math.round((progress.totalCorrect / progress.totalAttempted) * 100)
    : 0;

  const hour = time.getHours();
  const greeting = hour < 12 ? 'शुभ सकाळ' : hour < 17 ? 'शुभ दुपार' : 'शुभ संध्याकाळ';

  const go = (m: Mode) => setMode(m);
  const back = () => { setMode(Mode.HOME); setProgress(loadProgress()); };

  // Non-home view
  if (mode !== Mode.HOME) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0F1A', fontFamily: "'Poppins','Noto Sans Devanagari',sans-serif" }}>
        {!isExam && (
          <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            className="sticky top-0 z-50 flex items-center gap-4 px-6 py-4">
            <button onClick={back} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-bold text-sm">
              <X size={18} /> डॅशबोर्ड
            </button>
            <span className="text-white/20">|</span>
            <span className="text-white font-black text-sm">
              {SECTIONS.find(s => s.mode === mode)?.label || mode}
            </span>
          </div>
        )}
        <div className={isExam ? '' : 'max-w-5xl mx-auto px-4 py-6'}>
          {mode === Mode.PRELIMS        && <QuestionView type={Mode.PRELIMS}        tableName="prelims_questions"   onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
          {mode === Mode.MAINS          && <QuestionView type={Mode.MAINS}          tableName="mains_questions"     onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
          {mode === Mode.SARALSEVA      && <QuestionView type={Mode.SARALSEVA}      tableName="saralseva_questions" onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
          {mode === Mode.MOCK           && <QuestionView type={Mode.MOCK}           tableName="mock_questions"      onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
          {mode === Mode.MOCK_TEST      && <MockTestMode onBack={back} />}
          {mode === Mode.CURRENT_AFFAIRS && <QuestionView type={Mode.CURRENT_AFFAIRS} tableName="current_affairs"  onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
          {mode === Mode.VOCAB          && <VocabMode onBack={back} />}
          {mode === Mode.LITERATURE     && <LiteratureMode onBack={back} />}
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: '#0B0F1A', fontFamily: "'Poppins','Noto Sans Devanagari',sans-serif", color: '#fff' }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '30%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '30%', width: '40vw', height: '30vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-20">

        {/* Nav */}
        <nav className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div style={{ background: 'linear-gradient(135deg, #F97316, #EF4444)', borderRadius: 14, padding: '8px 10px' }}>
              <BookOpen size={22} className="text-white" />
            </div>
            <div>
              <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.04em', lineHeight: 1 }}>MPSC</span>
              <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.04em', color: '#F97316' }}> सारथी</span>
            </div>
          </div>
          <div
            className="hidden md:flex items-center gap-2"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '8px 18px' }}
          >
            <Clock size={14} style={{ color: '#F97316' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
              {time.toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </nav>

        {/* Hero */}
        <div className="mt-2 mb-10">
          <div style={{ fontSize: 13, fontWeight: 800, color: '#F97316', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
            {greeting} 🙏
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            यश मिळवायचे आहे,<br />
            <span style={{ background: 'linear-gradient(90deg, #F97316, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              तर आजच सुरू करा.
            </span>
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)', borderRadius: 999, padding: '10px 20px', fontWeight: 900, fontSize: 14, boxShadow: '0 8px 32px rgba(249,115,22,0.35)' }}>
              <Zap size={16} fill="currentColor" />
              {count.toLocaleString()} प्रश्न उपलब्ध
            </div>
            {progress.streak > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 999, padding: '10px 18px', fontWeight: 800, fontSize: 13 }}>
                <Flame size={15} style={{ color: '#FB923C' }} />
                <span style={{ color: '#FB923C' }}>{progress.streak} दिवस streak</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'सोडवलेले', value: progress.totalAttempted.toLocaleString(), icon: Target,     color: '#3B82F6', pct: Math.min(progress.totalAttempted / 500 * 100, 100) },
            { label: 'अचूकता',   value: accuracy + '%',                            icon: TrendingUp, color: '#10B981', pct: accuracy },
            { label: 'बरोबर',    value: progress.totalCorrect.toLocaleString(),    icon: Award,      color: '#F97316', pct: accuracy },
          ].map(({ label, value, icon: Icon, color, pct }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 0%, ${color}18 0%, transparent 60%)` }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Ring pct={pct} color={color} size={68} stroke={6} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(90deg)' }}>
                  <Icon size={18} style={{ color }} />
                </div>
              </div>
              <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 'clamp(1rem,3vw,1.4rem)', letterSpacing: '-0.03em' }}>{value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Section label */}
        <div className="flex items-center gap-4 mb-6">
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            अभ्यास विभाग निवडा
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>

          {/* Featured: Mock Test */}
          <div
            onClick={() => go(Mode.MOCK_TEST)}
            className="cursor-pointer group"
            style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #5C1414 0%, #0F0303 100%)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 28, padding: 32, position: 'relative', overflow: 'hidden', minHeight: 180 }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', overflow: 'hidden', opacity: 0.06 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ position: 'absolute', top: '-20%', right: i * 28 - 40, width: 12, height: '160%', background: '#EF4444', transform: 'rotate(15deg)' }} />
              ))}
            </div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 999, padding: '4px 12px', marginBottom: 16 }}>
                  <div className="animate-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#FCA5A5', letterSpacing: '0.15em', textTransform: 'uppercase' }}>LIVE TEST</span>
                </div>
                <h2 style={{ fontSize: 'clamp(1.4rem,3.5vw,2rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 8 }}>
                  Full Mock Test<br /><span style={{ color: '#FCA5A5' }}>100 प्रश्न · 2 तास</span>
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>वास्तविक परीक्षेसारखे वातावरण</p>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 18, padding: 14 }} className="group-hover:scale-110 transition-transform duration-300">
                <Zap size={28} style={{ color: '#EF4444' }} />
              </div>
            </div>
            <div className="mt-6 relative z-10 flex items-center gap-2">
              <span style={{ fontSize: 13, fontWeight: 800, color: '#FCA5A5' }}>चाचणी सुरू करा</span>
              <ChevronRight size={16} style={{ color: '#FCA5A5' }} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Regular cards */}
          {SECTIONS.map(({ mode: m, label, sub, icon: Icon, accent, tag }) => (
            <div
              key={m}
              onClick={() => go(m)}
              className="cursor-pointer group"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24, position: 'relative', overflow: 'hidden', transition: 'all 0.25s ease' }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = 'rgba(255,255,255,0.07)';
                el.style.borderColor = `${accent}40`;
                el.style.transform = 'translateY(-4px)';
                el.style.boxShadow = `0 20px 40px ${accent}20`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = 'rgba(255,255,255,0.04)';
                el.style.borderColor = 'rgba(255,255,255,0.08)';
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.6 }} />
              <div className="flex items-start justify-between mb-4">
                <div style={{ background: `${accent}20`, border: `1px solid ${accent}30`, borderRadius: 14, padding: 10 }}>
                  <Icon size={22} style={{ color: accent }} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', background: `${accent}20`, border: `1px solid ${accent}30`, borderRadius: 999, padding: '3px 9px', color: accent }}>
                  {tag}
                </span>
              </div>
              <h3 style={{ fontSize: 'clamp(1rem,2.5vw,1.2rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 4 }}>
                {label}
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{sub}</p>
              <div className="flex items-center gap-1 mt-4" style={{ color: accent }}>
                <span style={{ fontSize: 12, fontWeight: 800 }}>सुरू करा</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#F97316" style={{ color: '#F97316' }} />)}
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
            Maharashtra's #1 Free MPSC Practice Portal · mpscsarathi.online
          </p>
        </div>

      </div>
    </div>
  );
        }
      

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mode, UserProgress } from './types';

// Components
import { QuizMode } from './components/QuizMode';
import { QuestionView } from './components/QuestionView';
import { MockTestMode } from './components/MockTestMode';
import { VocabMode } from './components/VocabMode';
import { LiteratureMode } from './components/LiteratureMode';
import { SpardhaYodha } from './components/SpardhaYodha';
import { PYQMode } from './components/PYQMode';
import { ProgressDashboard } from './components/Progressdashboard';
import { AIDoubtSolver } from './components/AIDoubtSolver';
import { AuthModal } from './components/AuthModal';
import { Leaderboard } from './components/Leaderboard';
import { SupportModal } from './components/SupportModal';
import { ExamCountdown } from './components/ExamCountdown';
import { FlashcardMode } from './components/FlashcardMode';
import { SmartRevision } from './components/SmartRevision';
import { FriendChallenge } from './components/FriendChallenge';
import { DailyChallenge } from './components/DailyChallenge';
import { StudyPlanner } from './components/StudyPlanner';
import { AIQuestionGenerator } from './components/AIQuestionGenerator';
import { PerformanceAnalytics } from './components/PerformanceAnalytics';
import { AIStudySchedule } from './components/AIStudySchedule';
import { MockTestHistory } from './components/MockTestHistory';
import { StreakRewards } from './components/StreakRewards';
import { NotesFeature } from './components/NotesFeature';
import { VoiceQuestions } from './components/VoiceQuestions';
import { PDFReport } from './components/PDFReport';
import { WhatsAppShare } from './components/WhatsAppShare';
import { AIMarathiTranslator } from './components/AIMarathiTranslator';
import { WeakTopicDetector } from './components/WeakTopicDetector';
import { WeeklyTournament } from './components/WeeklyTournament';
import { CoinShop } from './components/CoinShop';
import { UserAnalyticsDashboard } from './components/UserAnalyticsDashboard';
import { PushNotifications } from './components/PushNotifications';
import { BookmarkMode } from './components/BookmarksMode';
import { BottomNav } from './components/BottomNav';
import { MoreMenu } from './components/MoreMenu';
import { PWAPrompt } from './components/PWAPrompt';

// Hooks & Libs
import { useAuth, signOut } from './hooks/useAuth';
import { pullProgressFromCloud, pushProgressToCloud, startAutoSync } from './lib/Cloudsync';

// Icons
import { 
  History, BookOpen, Trophy, Newspaper, ShieldCheck,
  Zap, BookMarked, X, Target, Flame, Languages,
  GraduationCap, ChevronRight, Star, TrendingUp,
  Award, FileText, Heart
} from 'lucide-react';

const PROGRESS_KEY = 'mpsc_user_progress';
const HISTORY_KEY  = 'mpsc_history';

// Helper Functions
function loadProgress(): UserProgress {
  try { 
    const r = localStorage.getItem(PROGRESS_KEY); 
    if (r) return JSON.parse(r); 
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
  p.totalCorrect   += correct;
  
  if (p.lastActiveDate !== today) {
    const yesterday = new Date(); 
    yesterday.setDate(yesterday.getDate() - 1);
    p.streak = p.lastActiveDate === yesterday.toDateString() ? p.streak + 1 : 1;
    p.lastActiveDate = today;
  }
  saveProgress(p);

  try {
    const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const todayEntry = hist.find((d: any) => d.date === today);
    if (todayEntry) {
      todayEntry.attempted += attempted;
      todayEntry.correct += correct;
    } else {
      hist.push({ date: today, attempted, correct });
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(-90)));
  } catch (_) {}
}

const SECTIONS = [
  { mode: Mode.PRELIMS, label: 'पूर्व परीक्षा', sub: 'PYQ + Practice', icon: History, accent: '#3B82F6', tag: 'PYQ' },
  { mode: Mode.MAINS, label: 'मुख्य परीक्षा', sub: 'GS + भाषा', icon: BookMarked, accent: '#10B981', tag: 'PYQ' },
  { mode: Mode.SARALSEVA, label: 'सरळसेवा', sub: 'TCS / IBPS / ZP', icon: ShieldCheck, accent: '#06B6D4', tag: 'NEW' },
  { mode: Mode.VOCAB, label: 'शब्दसंग्रह', sub: 'Marathi + English', icon: Languages, accent: '#8B5CF6', tag: 'HOT' },
  { mode: Mode.LITERATURE, label: 'मराठी साहित्य', sub: 'Mains + NET/SET', icon: GraduationCap, accent: '#F97316', tag: 'NEW' },
  { mode: Mode.MOCK, label: 'State Board', sub: 'पाठ्यपुस्तक Mock', icon: Trophy, accent: '#F59E0B', tag: 'MOCK' },
  { mode: Mode.CURRENT_AFFAIRS, label: 'चालू घडामोडी', sub: 'Daily Updates', icon: Newspaper, accent: '#EC4899', tag: 'DAILY' },
  { mode: 'PYQ' as any, label: 'PYQ संच', sub: 'मागील वर्षांचे प्रश्न', icon: FileText, accent: '#F59E0B', tag: 'PYQ' },
  { mode: Mode.QUIZ, label: 'Quiz Mode', sub: 'सराव चाचणी', icon: Zap, accent: '#E8671A', tag: 'HOT' }
];

// UI Component: Circular Progress Ring
function Ring({ pct, color, size = 64, stroke = 5 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

const CSS = `
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sp-heart { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  body { background: #F5F0E8 !important; margin: 0; }
  .card-hover { transition: all 0.18s ease; }
  .card-hover:active { transform: scale(0.97) !important; opacity:0.9; }
`;

export default function App() {
  const [mode, setMode] = useState<any>(() => {
    const saved = localStorage.getItem('mpsc_mode');
    if (saved === 'Quiz') return Mode.QUIZ;
    return saved || Mode.HOME;
  });

  const [count, setCount] = useState(0);
  const [progress, setProgress] = useState<UserProgress>(loadProgress());
  const [time, setTime] = useState(new Date());

  // UI State Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const { user } = useAuth();

  const isExam = mode === Mode.MOCK_TEST;

  useEffect(() => {
    localStorage.setItem('mpsc_mode', mode);
    window.scrollTo(0, 0);
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

  useEffect(() => {
    if (!user) return;
    pullProgressFromCloud(user).then(() => setProgress(loadProgress()));
    pushProgressToCloud(user);
    return startAutoSync(user);
  }, [user]);

  const accuracy = progress.totalAttempted > 0 ? Math.round((progress.totalCorrect / progress.totalAttempted) * 100) : 0;
  const hour = time.getHours();
  const greeting = hour < 12 ? 'शुभ सकाळ' : hour < 17 ? 'शुभ दुपार' : 'शुभ संध्याकाळ';

  const back = () => { setMode(Mode.HOME); setProgress(loadProgress()); };

  const dailyDone = (() => {
    try {
      const d = JSON.parse(localStorage.getItem('mpsc_daily_challenge') || '{}');
      return d.date === new Date().toDateString() && d.done;
    } catch { return false; }
  })();

  // Handlers
  const handleBottomNav = (tab: string) => {
    if (tab === 'HOME') setMode(Mode.HOME);
    else if (tab === 'DAILY') setMode('DAILY');
    else if (tab === 'FLASHCARD') setMode('FLASHCARD');
    else if (tab === 'PROGRESS') setActiveModal('ANALYTICS');
    else if (tab === 'MORE') setActiveModal('MORE');
  };

  const handleMoreNav = (m: string) => {
    setActiveModal(null);
    const modalScreens = ['COUNTDOWN', 'ANALYTICS', 'MOCK_HISTORY', 'AI_SCHEDULE', 'ACHIEVEMENTS', 'PDF_REPORT', 'WA_SHARE', 'WEAK_TOPICS', 'COIN_SHOP'];
    if (modalScreens.includes(m)) setActiveModal(m);
    else setMode(m);
  };

  // Condition Renders for Full-Screen Modes
  if (mode === Mode.SPARDHA) return <SpardhaYodha onBack={back} />;
  if (mode === 'BOOKMARKS') return <BookmarkMode onBack={back} />;
  if (mode === Mode.QUIZ) return <QuizMode onBack={back} />;
  if (mode === 'PYQ') return <PYQMode onBack={back} />;
  if (mode === 'FLASHCARD') return <FlashcardMode onBack={back} />;
  if (mode === 'REVISION') return <SmartRevision onBack={back} />;
  if (mode === 'CHALLENGE') return <FriendChallenge onBack={back} />;
  if (mode === 'DAILY') return <DailyChallenge onBack={back} />;
  if (mode === 'PLANNER') return <StudyPlanner onBack={back} />;
  if (mode === 'NOTES') return <NotesFeature onBack={back} />;
  if (mode === 'VOICE') return <VoiceQuestions onBack={back} />;
  if (mode === 'TRANSLATOR') return <AIMarathiTranslator onBack={back} />;
  if (mode === 'TOURNAMENT') return <WeeklyTournament onBack={back} />;
  if (mode === 'USER_ANALYTICS') return <UserAnalyticsDashboard onBack={back} />;
  if (mode === 'AI_QUIZ') return <AIQuestionGenerator onBack={back} />;

  // Render Sub-Views
  if (mode !== Mode.HOME) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'Poppins','Noto Sans Devanagari',sans-serif" }}>
      <style>{CSS}</style>
      {!isExam && (
        <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <button onClick={back} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F97316', fontWeight: 800, fontSize: 13, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer' }}>
            <X size={15} /> Home
          </button>
          <span style={{ color: 'rgba(0,0,0,0.2)' }}>|</span>
          <span style={{ color: '#1a1a1a', fontWeight: 900, fontSize: 13 }}>{SECTIONS.find(s => s.mode === mode)?.label || mode}</span>
        </div>
      )}
      <div className={isExam ? '' : 'max-w-5xl mx-auto px-4 py-6'}>
        {mode === Mode.PRELIMS && <QuestionView type={Mode.PRELIMS} tableName="prelims_questions" onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
        {mode === Mode.MAINS && <QuestionView type={Mode.MAINS} tableName="mains_questions" onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
        {mode === Mode.SARALSEVA && <QuestionView type={Mode.SARALSEVA} tableName="saralseva_questions" onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
        {mode === Mode.MOCK && <QuestionView type={Mode.MOCK} tableName="mock_questions" onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
        {mode === Mode.MOCK_TEST && <MockTestMode onBack={back} />}
        {mode === Mode.CURRENT_AFFAIRS && <QuestionView type={Mode.CURRENT_AFFAIRS} tableName="current_affairs" onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
        {mode === Mode.VOCAB && <VocabMode onBack={back} />}
        {mode === Mode.LITERATURE && <LiteratureMode onBack={back} />}
      </div>
      {!isExam && <BottomNav active="HOME" onNav={handleBottomNav} dailyDone={dailyDone} />}
    </div>
  );

  // MAIN DASHBOARD
  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'Poppins','Noto Sans Devanagari',sans-serif", color: '#1a1a1a', overflowX: 'hidden' }}>
      <style>{CSS}</style>

      {/* Modals Conditional Rendering */}
      {activeModal === 'ANALYTICS' && <PerformanceAnalytics onClose={() => setActiveModal(null)} />}
      {activeModal === 'AI_SCHEDULE' && <div style={{ position: 'fixed', inset: 0, zIndex: 200, overflowY: 'auto', background: '#F5F0E8' }}><AIStudySchedule onBack={() => setActiveModal(null)} /></div>}
      {activeModal === 'MOCK_HISTORY' && <MockTestHistory onClose={() => setActiveModal(null)} />}
      {activeModal === 'ACHIEVEMENTS' && <StreakRewards onClose={() => setActiveModal(null)} />}
      {activeModal === 'PDF_REPORT' && <PDFReport onClose={() => setActiveModal(null)} />}
      {activeModal === 'WA_SHARE' && <WhatsAppShare onClose={() => setActiveModal(null)} />}
      {activeModal === 'WEAK_TOPICS' && <WeakTopicDetector onClose={() => setActiveModal(null)} />}
      {activeModal === 'COIN_SHOP' && <CoinShop onClose={() => setActiveModal(null)} />}
      {activeModal === 'AUTH' && <AuthModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'LEADERBOARD' && <Leaderboard onClose={() => setActiveModal(null)} currentUserId={user?.id} />}
      {activeModal === 'SUPPORT' && <SupportModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'COUNTDOWN' && <ExamCountdown onClose={() => setActiveModal(null)} />}
      {activeModal === 'MORE' && (
        <MoreMenu 
          onClose={() => setActiveModal(null)} 
          onNav={handleMoreNav} 
          onShowSupport={() => setActiveModal('SUPPORT')} 
          onShowLeaderboard={() => setActiveModal('LEADERBOARD')} 
          onShowProgress={() => setActiveModal('ANALYTICS')} 
          onLogin={() => setActiveModal('AUTH')} 
          onLogout={() => signOut()} 
          user={user} 
        />
      )}

      <PushNotifications />
      <AIDoubtSolver />
      <PWAPrompt />

      {/* Decorative Background */}
      <div style={{ pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-5%', right: '-5%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(249,115,22,0.08) 0%,transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 680, margin: '0 auto', padding: '0 14px 100px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(0,0,0,0.07)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'linear-gradient(135deg,#F97316,#EF4444)', borderRadius: 12, padding: '8px', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>
              <BookOpen size={20} color="#fff" />
            </div>
            <span style={{ fontWeight: 900, fontSize: 18 }}>MPSC <span style={{ color: '#F97316' }}>सारथी</span></span>
          </div>
          <button onClick={() => setActiveModal('SUPPORT')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'linear-gradient(135deg,#E8671A,#C4510E)', border: 'none', borderRadius: 11, padding: '8px 14px', color: '#fff', fontWeight: 900, fontSize: 12, cursor: 'pointer' }}>
            <Heart size={12} fill="#fff" /> सपोर्ट
          </button>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 20, animation: 'fadeUp 0.4s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 999, padding: '5px 14px', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#C2410C' }}>{greeting} 🙏</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem,5vw,2.5rem)', fontWeight: 900, lineHeight: 1.15, margin: '0 0 12px' }}>
            यश मिळवायचे,<br />
            <span style={{ background: 'linear-gradient(90deg,#F97316,#EF4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>आजच सुरू करा.</span>
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#F97316,#EF4444)', borderRadius: 999, padding: '8px 16px', fontWeight: 900, fontSize: 13, color: '#fff' }}>
              <Zap size={14} fill="currentColor" /> {count.toLocaleString()} प्रश्न
            </div>
            {progress.streak > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 999, padding: '8px 14px', fontWeight: 800, color: '#EA580C' }}>
                <Flame size={13} /> {progress.streak} day streak 🔥
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'सोडवलेले', value: progress.totalAttempted.toLocaleString(), icon: Target, color: '#3B82F6', pct: Math.min(progress.totalAttempted / 500 * 100, 100) },
            { label: 'अचूकता', value: accuracy + '%', icon: TrendingUp, color: '#10B981', pct: accuracy },
            { label: 'बरोबर', value: progress.totalCorrect.toLocaleString(), icon: Award, color: '#F97316', pct: accuracy },
          ].map(({ label, value, icon: Icon, color, pct }) => (
            <div key={label} className="card-hover" onClick={() => setActiveModal('ANALYTICS')} style={{ background: '#fff', borderRadius: 18, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
              <Ring pct={pct} color={color} size={54} stroke={5} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: '1rem' }}>{value}</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          <ActionCard emoji={dailyDone ? '✅' : '📅'} title="Daily Challenge" sub={dailyDone ? "पूर्ण!" : "5 प्रश्न"} color="#C4510E" onClick={() => setMode('DAILY')} />
          <ActionCard emoji="⚔️" title="Tournament" sub="Live Rank" color="#D97706" onClick={() => setMode('TOURNAMENT')} />
          <ActionCard emoji="🤖" title="AI Quiz" sub="Generate Now" color="#DC2626" onClick={() => setMode('AI_QUIZ')} />
          <ActionCard emoji="📊" title="Countdown" sub="Exam Date" color="#2563EB" onClick={() => setActiveModal('COUNTDOWN')} />
        </div>

        {/* Featured Full Mock Test */}
        <div onClick={() => setMode(Mode.MOCK_TEST)} className="card-hover" style={{ background: 'linear-gradient(135deg,#7F1D1D,#450A0A)', borderRadius: 22, padding: '22px 20px', cursor: 'pointer', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>Full Mock Test 📝</div>
              <div style={{ fontSize: 11, color: '#FCA5A5' }}>100 प्रश्न • 2 तास • Timer</div>
            </div>
            <ChevronRight size={20} color="#fff" />
          </div>
        </div>

        {/* Main Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SECTIONS.map((sec) => (
            <div key={sec.label} onClick={() => setMode(sec.mode)} className="card-hover" style={{ background: '#fff', borderRadius: 18, padding: '16px 14px', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ color: sec.accent, marginBottom: 8 }}><sec.icon size={20} /></div>
              <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>{sec.label}</div>
              <div style={{ fontSize: 10, color: 'gray' }}>{sec.sub}</div>
            </div>
          ))}
        </div>

      </div>

      <BottomNav active="HOME" onNav={handleBottomNav} dailyDone={dailyDone} />
    </div>
  );
}

// Sub-component for DRY code
function ActionCard({ emoji, title, sub, color, onClick }: any) {
  return (
    <div className="card-hover" onClick={onClick} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 16, padding: '14px', cursor: 'pointer' }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontWeight: 900, fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 9, color, fontWeight: 700 }}>{sub}</div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Mode, UserProgress } from './types';
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
import { BookmarkMode } from './components/BookmarksMode';
import { BottomNav } from './components/BottomNav';
import { MoreMenu } from './components/MoreMenu';
import { PWAPrompt } from './components/PWAPrompt';
import { useAuth, signOut } from './hooks/useAuth';
import { pullProgressFromCloud, pushProgressToCloud, startAutoSync } from './lib/Cloudsync';
import { Heart } from 'lucide-react';
import {
  History, BookOpen, Trophy, Newspaper, ShieldCheck,
  Zap, BookMarked, X, Target, Flame, Languages,
  GraduationCap, ChevronRight, Star, TrendingUp,
  Award, Bookmark, BarChart2, FileText
} from 'lucide-react';

const Quiz = QuizMode;

const PROGRESS_KEY = 'mpsc_user_progress';
const HISTORY_KEY  = 'mpsc_history';

function loadProgress(): UserProgress {
  try { const r = localStorage.getItem(PROGRESS_KEY); if (r) return JSON.parse(r); } catch (_) {}
  return { totalAttempted:0, totalCorrect:0, streak:0, lastActiveDate:'' };
}
function saveProgress(p: UserProgress) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }

export function updateProgress(attempted: number, correct: number) {
  const p = loadProgress();
  const today = new Date().toDateString();
  p.totalAttempted += attempted;
  p.totalCorrect   += correct;
  if (p.lastActiveDate !== today) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    p.streak = p.lastActiveDate === yesterday.toDateString() ? p.streak + 1 : 1;
    p.lastActiveDate = today;
  }
  saveProgress(p);
  try {
    const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const todayEntry = hist.find((d: any) => d.date === today);
    if (todayEntry) { todayEntry.attempted += attempted; todayEntry.correct += correct; }
    else hist.push({ date: today, attempted, correct });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(-90)));
  } catch (_) {}
}

const SECTIONS = [
  { mode: Mode.PRELIMS,         label:'पूर्व परीक्षा',   sub:'PYQ + Practice',         icon:History,       accent:'#3B82F6', tag:'PYQ'   },
  { mode: Mode.MAINS,           label:'मुख्य परीक्षा',   sub:'GS + भाषा',              icon:BookMarked,    accent:'#10B981', tag:'PYQ'   },
  { mode: Mode.SARALSEVA,       label:'सरळसेवा',         sub:'TCS / IBPS / ZP',        icon:ShieldCheck,   accent:'#06B6D4', tag:'NEW'   },
  { mode: Mode.VOCAB,           label:'शब्दसंग्रह',      sub:'Marathi + English',      icon:Languages,     accent:'#8B5CF6', tag:'HOT'   },
  { mode: Mode.LITERATURE,      label:'मराठी साहित्य',   sub:'Mains + NET/SET',        icon:GraduationCap, accent:'#F97316', tag:'NEW'   },
  { mode: Mode.MOCK,            label:'State Board',      sub:'पाठ्यपुस्तक Mock',      icon:Trophy,        accent:'#F59E0B', tag:'MOCK'  },
  { mode: Mode.CURRENT_AFFAIRS, label:'चालू घडामोडी',   sub:'Daily Updates',          icon:Newspaper,     accent:'#EC4899', tag:'DAILY' },
  { mode: 'PYQ' as any, label: 'PYQ संच', sub: 'मागील वर्षांचे प्रश्न', icon: FileText, accent: '#F59E0B', tag: 'PYQ' },
  { mode: 'QUIZ' as any, label: 'Quiz Mode', sub: 'सराव चाचणी', icon: Zap, accent: '#E8671A', tag: 'HOT' } // ही नवीन ओळ नीट टाका
];

function Ring({ pct, color, size=64, stroke=5 }: { pct:number; color:string; size?:number; stroke?:number }) {
  const r = (size-stroke*2)/2, circ = 2*Math.PI*r, offset = circ-(pct/100)*circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

const CSS = `
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sp-heart { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  body { background: #F5F0E8 !important; }
  .card-hover { transition: all 0.18s ease; }
  .card-hover:active { transform: scale(0.97) !important; opacity:0.9; }
`;

export default function App() {
  const [mode, setMode] = useState<any>(() => {
    const saved = localStorage.getItem('mpsc_mode') as any;
    if (saved === 'Quiz') return Mode.QUIZ; // legacy value compatibility
    return saved || Mode.HOME;
  });  const [count, setCount]         = useState(0);
  const [progress, setProgress]   = useState<UserProgress>(loadProgress());
  const [time, setTime]           = useState(new Date());
  const [showProgress, setShowProgress]       = useState(false);
  const [showAuth, setShowAuth]               = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSupport, setShowSupport]         = useState(false);
  const [showCountdown, setShowCountdown]     = useState(false);
  const [showMore, setShowMore]               = useState(false);
  const [showAnalytics, setShowAnalytics]       = useState(false);
  const [showAISchedule, setShowAISchedule]     = useState(false);
  const [showMockHistory, setShowMockHistory]   = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showPDFReport, setShowPDFReport]       = useState(false);
  const [showWAShare, setShowWAShare]           = useState(false);
  const [showWeakTopics, setShowWeakTopics]     = useState(false);
  const [showCoinShop, setShowCoinShop]         = useState(false);
  const { user, loading: authLoading }        = useAuth();

  const isExam = mode === Mode.MOCK_TEST;

  useEffect(() => {
    localStorage.setItem('mpsc_mode', mode);
    window.scrollTo(0, 0);
    setProgress(loadProgress());
  }, [mode]);

  useEffect(() => {
    const tables = ['prelims_questions','mains_questions','mock_questions','current_affairs','vocab_questions','literature_questions'];
    Promise.all(tables.map(t => supabase.from(t).select('*',{count:'exact',head:true})))
      .then(rs => setCount(rs.reduce((a,c) => a+(c.count||0), 0))).catch(()=>{});
    const tick = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!user) return;
    pullProgressFromCloud(user).then(() => setProgress(loadProgress()));
    pushProgressToCloud(user);
    const stop = startAutoSync(user);
    return stop;
  }, [user]);

  const accuracy = progress.totalAttempted > 0 ? Math.round((progress.totalCorrect/progress.totalAttempted)*100) : 0;
  const hour     = time.getHours();
  const greeting = hour<12 ? 'शुभ सकाळ' : hour<17 ? 'शुभ दुपार' : 'शुभ संध्याकाळ';
  const go   = (m: any) => setMode(m);
  const back = () => { setMode(Mode.HOME); setProgress(loadProgress()); };

  const dailyDone = (() => {
    try { const d = JSON.parse(localStorage.getItem('mpsc_daily_challenge')||'{}'); return d.date===new Date().toDateString()&&d.done; } catch { return false; }
  })();

  const handleBottomNav = (tab: string) => {
    if (tab === 'HOME')           setMode(Mode.HOME);
    else if (tab === 'DAILY')     go('DAILY');
    else if (tab === 'FLASHCARD') go('FLASHCARD');
    else if (tab === 'PROGRESS')  setShowAnalytics(true);
    else if (tab === 'MORE')      setShowMore(true);
  };

  const handleMoreNav = (m: string) => {
    if (m === 'COUNTDOWN') setShowCountdown(true);
    else if (m === 'ANALYTICS') setShowAnalytics(true);
    else if (m === 'MOCK_HISTORY') setShowMockHistory(true);
    else if (m === 'AI_SCHEDULE') setShowAISchedule(true);
    else if (m === 'ACHIEVEMENTS') setShowAchievements(true);
    else if (m === 'PDF_REPORT') setShowPDFReport(true);
    else if (m === 'WA_SHARE') setShowWAShare(true);
    else if (m === 'WEAK_TOPICS') setShowWeakTopics(true);
    else if (m === 'COIN_SHOP') setShowCoinShop(true);
    else go(m);
  };

  if (mode === Mode.SPARDHA)   return <SpardhaYodha onBack={back} />;
  if (mode === 'BOOKMARKS')    return <BookmarkMode onBack={back} />;
   if (mode === Mode.QUIZ)      return <QuizMode onBack={back} />;
  if (mode === 'PYQ')          return <PYQMode onBack={back} />;
  if (mode === 'FLASHCARD')    return <FlashcardMode onBack={back} />;
  if (mode === 'REVISION')     return <SmartRevision onBack={back} />;
  if (mode === 'CHALLENGE')    return <FriendChallenge onBack={back} />;
  if (mode === 'DAILY')        return <DailyChallenge onBack={back} />;
  if (mode === 'PLANNER')        return <StudyPlanner onBack={back} />;
  if (mode === 'NOTES')          return <NotesFeature onBack={back} />;
  if (mode === 'VOICE')          return <VoiceQuestions onBack={back} />;
  if (mode === 'TRANSLATOR')     return <AIMarathiTranslator onBack={back} />;
  if (mode === 'TOURNAMENT')     return <WeeklyTournament onBack={back} />;
  if (mode === 'AI_QUIZ')      return <AIQuestionGenerator onBack={back} />;

  if (mode !== Mode.HOME) return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Poppins','Noto Sans Devanagari',sans-serif", color:'#1a1a1a' }}>
      <style>{CSS}</style>
      {!isExam && (
        <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:12, padding:'14px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <button onClick={back} style={{ display:'flex', alignItems:'center', gap:6, color:'#F97316', fontWeight:800, fontSize:13, background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:10, padding:'8px 14px', cursor:'pointer' }}>
            <X size={15} /> Home
          </button>
          <span style={{ color:'rgba(0,0,0,0.2)' }}>|</span>
          <span style={{ color:'#1a1a1a', fontWeight:900, fontSize:13 }}>{SECTIONS.find(s=>s.mode===mode)?.label||mode}</span>
        </div>
      )}
      <div className={isExam ? '' : 'max-w-5xl mx-auto px-4 py-6'}>
        {mode === Mode.PRELIMS         && <QuestionView type={Mode.PRELIMS}         tableName="prelims_questions"   onBack={back} onProgressUpdate={()=>setProgress(loadProgress())} />}
        {mode === Mode.MAINS           && <QuestionView type={Mode.MAINS}           tableName="mains_questions"     onBack={back} onProgressUpdate={()=>setProgress(loadProgress())} />}
        {mode === Mode.SARALSEVA       && <QuestionView type={Mode.SARALSEVA}       tableName="saralseva_questions" onBack={back} onProgressUpdate={()=>setProgress(loadProgress())} />}
        {mode === Mode.MOCK            && <QuestionView type={Mode.MOCK}            tableName="mock_questions"      onBack={back} onProgressUpdate={()=>setProgress(loadProgress())} />}
        {mode === Mode.MOCK_TEST       && <MockTestMode onBack={back} />}
        {mode === Mode.CURRENT_AFFAIRS && <QuestionView type={Mode.CURRENT_AFFAIRS} tableName="current_affairs"    onBack={back} onProgressUpdate={()=>setProgress(loadProgress())} />}
        {mode === Mode.VOCAB           && <VocabMode onBack={back} />}
        {mode === Mode.LITERATURE      && <LiteratureMode onBack={back} />}
      </div>
      {!isExam && <BottomNav active="HOME" onNav={handleBottomNav} dailyDone={dailyDone} />}
    </div>
  );

  // DASHBOARD
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Poppins','Noto Sans Devanagari',sans-serif", color:'#1a1a1a', overflowX:'hidden' }}>
      <style>{CSS}</style>

      {showProgress    && <ProgressDashboard onClose={()=>setShowProgress(false)} />}
      {showAnalytics    && <PerformanceAnalytics onClose={()=>setShowAnalytics(false)} />}
      {showAISchedule  && <div style={{position:'fixed',inset:0,zIndex:200,overflowY:'auto',background:'#F5F0E8'}}><AIStudySchedule onBack={()=>setShowAISchedule(false)} /></div>}
      {showMockHistory && <MockTestHistory onClose={()=>setShowMockHistory(false)} />}
      {showAchievements && <StreakRewards onClose={()=>setShowAchievements(false)} />}
      {showPDFReport   && <PDFReport onClose={()=>setShowPDFReport(false)} />}
      {showWAShare     && <WhatsAppShare onClose={()=>setShowWAShare(false)} />}
      {showWeakTopics  && <WeakTopicDetector onClose={()=>setShowWeakTopics(false)} onGoToTopic={(t)=>{ setShowWeakTopics(false); go(t==='इतिहास'?'PRELIMS':t==='राज्यघटना'?'MAINS':'PRELIMS'); }} />}
      {showCoinShop    && <CoinShop onClose={()=>setShowCoinShop(false)} />}
      <AIDoubtSolver />
      {showAuth        && <AuthModal onClose={()=>setShowAuth(false)} />}
      {showLeaderboard && <Leaderboard onClose={()=>setShowLeaderboard(false)} currentUserId={user?.id} />}
      {showSupport     && <SupportModal onClose={()=>setShowSupport(false)} />}
      {showCountdown   && <ExamCountdown onClose={()=>setShowCountdown(false)} />}
      {showMore        && <MoreMenu onClose={()=>setShowMore(false)} onNav={handleMoreNav} onShowSupport={()=>setShowSupport(true)} onShowLeaderboard={()=>setShowLeaderboard(true)} onShowProgress={()=>setShowAnalytics(true)} onLogin={()=>setShowAuth(true)} onLogout={()=>signOut()} user={user} />}
      <PWAPrompt />

      <div style={{ pointerEvents:'none', position:'fixed', inset:0, zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-5%', right:'-5%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(249,115,22,0.08) 0%,transparent 70%)', filter:'blur(50px)' }} />
        <div style={{ position:'absolute', bottom:'15%', left:'-5%', width:'40vw', height:'40vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,0.07) 0%,transparent 70%)', filter:'blur(50px)' }} />
      </div>

      <div style={{ position:'relative', zIndex:10, maxWidth:680, margin:'0 auto', padding:'0 14px 20px' }}>

        {/* Nav */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 0 14px', borderBottom:'1px solid rgba(0,0,0,0.07)', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ background:'linear-gradient(135deg,#F97316,#EF4444)', borderRadius:12, padding:'8px 9px', boxShadow:'0 4px 14px rgba(249,115,22,0.35)' }}>
              <BookOpen size={20} color="#fff" />
            </div>
            <div>
              <span style={{ fontWeight:900, fontSize:18, letterSpacing:'-0.04em', color:'#1a1a1a' }}>MPSC</span>
              <span style={{ fontWeight:900, fontSize:18, letterSpacing:'-0.04em', color:'#F97316' }}> सारथी</span>
            </div>
          </div>
          <button onClick={()=>setShowSupport(true)}
            style={{ display:'flex', alignItems:'center', gap:5, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:11, padding:'8px 14px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', boxShadow:'0 4px 14px rgba(232,103,26,0.3)' }}>
            <Heart size={12} fill="#fff" /> सपोर्ट
          </button>
        </div>

        {/* Hero */}
        <div style={{ marginBottom:20, animation:'fadeUp 0.4s ease' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:999, padding:'5px 14px', marginBottom:10 }}>
            <span style={{ fontSize:12, fontWeight:800, color:'#C2410C' }}>{greeting} 🙏</span>
          </div>
          <h1 style={{ fontSize:'clamp(1.5rem,5vw,2.5rem)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.15, margin:'0 0 12px', color:'#111' }}>
            यश मिळवायचे,<br />
            <span style={{ background:'linear-gradient(90deg,#F97316,#EF4444)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              आजच सुरू करा.
            </span>
          </h1>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#F97316,#EF4444)', borderRadius:999, padding:'8px 16px', fontWeight:900, fontSize:13, color:'#fff', boxShadow:'0 4px 18px rgba(249,115,22,0.35)' }}>
              <Zap size={14} fill="currentColor" /> {count.toLocaleString()} प्रश्न
            </div>
            {progress.streak > 0 && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.25)', borderRadius:999, padding:'8px 14px', fontWeight:800, fontSize:12, color:'#EA580C' }}>
                <Flame size={13} /> {progress.streak} day streak 🔥
              </div>
            )}
            {user && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:999, padding:'8px 14px', fontWeight:700, fontSize:11, color:'#065F46' }}>
                ✓ {user.email?.split('@')[0]}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
          {[
            { label:'सोडवलेले', value:progress.totalAttempted.toLocaleString(), icon:Target,     color:'#3B82F6', pct:Math.min(progress.totalAttempted/500*100,100) },
            { label:'अचूकता',   value:accuracy+'%',                             icon:TrendingUp, color:'#10B981', pct:accuracy },
            { label:'बरोबर',    value:progress.totalCorrect.toLocaleString(),   icon:Award,      color:'#F97316', pct:accuracy },
          ].map(({ label, value, icon:Icon, color, pct }) => (
            <div key={label} className="card-hover"
              style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:18, padding:'14px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', position:'relative', overflow:'hidden' }}
              onClick={()=>setShowAnalytics(true)}>
              <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at 50% 0%,${color}10 0%,transparent 60%)` }} />
              <div style={{ position:'relative', zIndex:1 }}>
                <Ring pct={pct} color={color} size={54} stroke={5} />
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', transform:'rotate(90deg)' }}>
                  <Icon size={13} style={{ color }} />
                </div>
              </div>
              <div style={{ textAlign:'center', zIndex:1 }}>
                <div style={{ fontWeight:900, fontSize:'clamp(0.85rem,3vw,1.1rem)', letterSpacing:'-0.03em', color:'#111' }}>{value}</div>
                <div style={{ fontSize:8, fontWeight:700, color:'rgba(0,0,0,0.35)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions — 4 cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {[
            { emoji:dailyDone?'✅':'📅', title:'Daily Challenge', sub:dailyDone?'आज पूर्ण!':'5 प्रश्न · आज', color:dailyDone?'#059669':'#C4510E', bg:dailyDone?'rgba(5,150,105,0.07)':'rgba(232,103,26,0.07)', border:dailyDone?'rgba(5,150,105,0.25)':'rgba(232,103,26,0.25)', onClick:()=>go('DAILY') },
            { emoji:'⚔️', title:'Tournament',     sub:'20Q · 15sec · Rank', color:'#F5C842', bg:'rgba(245,200,66,0.07)', border:'rgba(245,200,66,0.25)', onClick:()=>go('TOURNAMENT') },
            { emoji:'📅', title:'Study Planner',  sub:'Syllabus tracker', color:'#7C3AED', bg:'rgba(124,58,237,0.07)', border:'rgba(124,58,237,0.2)', onClick:()=>go('PLANNER') },
            { emoji:'🤖', title:'AI Quiz',         sub:'AI questions generate', color:'#DC2626', bg:'rgba(220,38,38,0.07)', border:'rgba(220,38,38,0.2)', onClick:()=>go('AI_QUIZ') },
            { emoji:'🧠', title:'Weak Topics',    sub:'AI analysis', color:'#DC2626', bg:'rgba(220,38,38,0.07)', border:'rgba(220,38,38,0.2)', onClick:()=>setShowWeakTopics(true) },
            { emoji:'🌐', title:'Translator',      sub:'EN ↔ मराठी', color:'#7C3AED', bg:'rgba(124,58,237,0.07)', border:'rgba(124,58,237,0.2)', onClick:()=>go('TRANSLATOR') },
            { emoji:'🪙', title:'Coin Shop',       sub:'Themes unlock करा', color:'#D97706', bg:'rgba(217,119,6,0.07)', border:'rgba(217,119,6,0.2)', onClick:()=>setShowCoinShop(true) },
            { emoji:'📊', title:'Exam Countdown',  sub:'किती दिवस बाकी', color:'#2563EB', bg:'rgba(37,99,235,0.07)', border:'rgba(37,99,235,0.2)', onClick:()=>setShowCountdown(true) },
          ].map(({ emoji, title, sub, color, bg, border, onClick }) => (
            <div key={title} className="card-hover" onClick={onClick}
              style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:16, padding:'14px 12px', cursor:'pointer' }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{emoji}</div>
              <div style={{ fontWeight:900, fontSize:12, color:'#1C2B2B' }}>{title}</div>
              <div style={{ fontSize:9, fontWeight:700, color, marginTop:2 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* New Features */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }} />
            <span style={{ fontSize:9, fontWeight:800, color:'rgba(0,0,0,0.3)', textTransform:'uppercase', letterSpacing:'0.15em' }}>✨ नवीन Features</span>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { emoji:'🎯', title:'Smart Revision',   sub:'चुकलेले → auto-save', color:'#7C3AED', bg:'rgba(124,58,237,0.07)', border:'rgba(124,58,237,0.2)', onClick:()=>go('REVISION') },
              { emoji:'🏆', title:'Friend Challenge', sub:'Link share → compete', color:'#DC2626', bg:'rgba(220,38,38,0.07)',  border:'rgba(220,38,38,0.2)',  onClick:()=>go('CHALLENGE') },
              { emoji:'🎴', title:'Flashcard Mode',   sub:'Swipe → vocabulary',  color:'#059669', bg:'rgba(5,150,105,0.07)', border:'rgba(5,150,105,0.2)',  onClick:()=>go('FLASHCARD') },
              { emoji:'📈', title:'Analytics',        sub:'Performance graphs',  color:'#E8671A', bg:'rgba(232,103,26,0.07)', border:'rgba(232,103,26,0.2)',  onClick:()=>setShowAnalytics(true) },
            ].map(({ emoji, title, sub, color, bg, border, onClick }) => (
              <div key={title} className="card-hover" onClick={onClick}
                style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:16, padding:'14px 12px', cursor:'pointer' }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{emoji}</div>
                <div style={{ fontWeight:900, fontSize:12, color:'#1C2B2B', marginBottom:2 }}>{title}</div>
                <div style={{ fontSize:9, fontWeight:700, color }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Support banner */}
        <div onClick={()=>setShowSupport(true)}
          style={{ background:'linear-gradient(135deg,#FFF7ED,#FEF3C7)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:16, padding:'14px 16px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}
          onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 6px 24px rgba(232,103,26,0.15)')}
          onMouseLeave={e=>(e.currentTarget.style.boxShadow='none')}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontSize:24, animation:'sp-heart 2s ease infinite' }}>❤️</div>
            <div>
              <div style={{ fontWeight:900, fontSize:12, color:'#92400E' }}>MPSC सारथी सपोर्ट करा!</div>
              <div style={{ fontSize:10, color:'#B45309', fontWeight:600 }}>₹29 पासून · GPay / PhonePe</div>
            </div>
          </div>
          <ChevronRight size={16} style={{ color:'#E8671A' }} />
        </div>

        {/* Section divider */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }} />
          <span style={{ fontSize:9, fontWeight:800, color:'rgba(0,0,0,0.3)', textTransform:'uppercase', letterSpacing:'0.15em' }}>अभ्यास विभाग</span>
          <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }} />
        </div>

        {/* Featured card */}
        <div style={{ marginBottom:12 }}>
          <div onClick={()=>go(Mode.MOCK_TEST)} className="card-hover"
            style={{ background:'linear-gradient(135deg,#7F1D1D,#450A0A)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:22, padding:'22px 20px', cursor:'pointer', boxShadow:'0 6px 28px rgba(239,68,68,0.2)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:999, padding:'3px 10px', marginBottom:10 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#EF4444', animation:'pulse 2s infinite' }} />
                  <span style={{ fontSize:9, fontWeight:800, color:'#FCA5A5', textTransform:'uppercase' }}>LIVE TEST</span>
                </div>
                <div style={{ fontSize:'clamp(1.1rem,4vw,1.4rem)', fontWeight:900, color:'#fff' }}>Full Mock Test 📝</div>
                <div style={{ fontSize:11, color:'#FCA5A5', fontWeight:700, marginTop:3 }}>100 प्रश्न · 2 तास · Timer</div>
              </div>
              <ChevronRight size={20} style={{ color:'#FCA5A5' }} />
            </div>
          </div>
        </div>

        {/* Regular cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {SECTIONS.map(({ mode:m, label, sub, icon:Icon, accent, tag }) => (
            <div key={String(m)} onClick={()=>go(m)} className="card-hover"
              style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:18, padding:'16px 14px', position:'relative', overflow:'hidden', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,transparent,${accent},transparent)`, opacity:0.7 }} />
              <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ background:`${accent}15`, border:`1px solid ${accent}25`, borderRadius:10, padding:7 }}>
                  <Icon size={17} style={{ color:accent }} />
                </div>
                <span style={{ fontSize:7, fontWeight:900, textTransform:'uppercase', background:`${accent}15`, border:`1px solid ${accent}25`, borderRadius:999, padding:'2px 7px', color:accent }}>{tag}</span>
              </div>
              <div style={{ fontWeight:900, fontSize:'clamp(0.8rem,3vw,0.95rem)', marginBottom:2, color:'#111' }}>{label}</div>
              <div style={{ fontSize:9, color:'rgba(0,0,0,0.4)', fontWeight:600 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', paddingBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'center', gap:2, marginBottom:6 }}>
            {[...Array(5)].map((_,i) => <Star key={i} size={10} fill="#F97316" style={{ color:'#F97316' }} />)}
          </div>
          <p style={{ fontSize:10, color:'rgba(0,0,0,0.3)', fontWeight:600 }}>Maharashtra's #1 Free MPSC Portal · mpscsarathi.online</p>
        </div>
      </div>

      <BottomNav active="HOME" onNav={handleBottomNav} dailyDone={dailyDone} />
    </div>
  );
}

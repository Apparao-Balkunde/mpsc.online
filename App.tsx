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
import { ThemeProvider, DarkModeToggle, DARK_CSS } from './components/ThemeContext';
import { GlobalSearch } from './components/GlobalSearch';
import { CurrentAffairsFeed } from './components/CurrentAffairsFeed';
import { FormulaSheet } from './components/FormulaSheet';
import { UserProfile } from './components/UserProfile';
import { StudyGroups } from './components/StudyGroups';
import { BookmarkMode } from './components/BookmarksMode';
import { MnemonicGenerator } from './components/MnemonicGenerator';
import { ExamReadinessScore } from './components/ExamReadinessScore';
import { RankPredictor } from './components/RankPredictor';
import { ConceptExplainer } from './components/ConceptExplainer';
import { AnswerEvaluator } from './components/AnswerEvaluator';
import { LiveQuizRoom } from './components/LiveQuizRoom';
import { ReferralSystem } from './components/ReferralSystem';
import { ProgressCertificate } from './components/ProgressCertificate';
import { BookmarkCollections } from './components/BookmarkCollections';
import { PomodoroTimer } from './components/PomodoroTimer';
import { QuestionBank } from './components/QuestionBank';
import { HeatmapCalendar } from './components/HeatmapCalendar';
import { BottomNav } from './components/BottomNav';
import { MoreMenu } from './components/MoreMenu';
import { PWAPrompt } from './components/PWAPrompt';
import { DoubtCommunity } from './components/DoubtCommunity';
import { VocabBuilder } from './components/VocabBuilder';
import { NewspaperSummary } from './components/NewspaperSummary';
import { MapsGeography } from './components/MapsGeography';
import { MockTestSeries } from './components/MockTestSeries';
import { AIDailyBriefing } from './components/AIDailyBriefing';
import { NewsToQuestion } from './components/NewsToQuestion';
import { SyllabusRadar } from './components/SyllabusRadar';
import { ExamCalendar } from './components/ExamCalendar';
import { SpeedDrill } from './components/SpeedDrill';
import { MistakeBook } from './components/MistakeBook';
import { AIStudyBuddy } from './components/AIStudyBuddy';
import { AIMockInterview } from './components/AIMockInterview';
import { AIStudySchedule } from './components/AIStudySchedule';
import { CoinShop } from './components/CoinShop';
import { MockTestHistory } from './components/MockTestHistory';
import { PDFReport } from './components/PDFReport';
import { StreakRewards } from './components/StreakRewards';
import { UserAnalyticsDashboard } from './components/UserAnalyticsDashboard';
import { WeakTopicDetector } from './components/WeakTopicDetector';
import { WhatsAppShare } from './components/WhatsAppShare';
import { XPDashboard } from './components/XPDashboard';
import { CutoffTracker } from './components/CutoffTracker';
import { EssayMode } from './components/EssayMode';
import { SubjectProgress } from './components/SubjectProgress';
import { DistrictQuiz } from './components/DistrictQuiz';
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
  ${DARK_CSS}

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
  const [showAnalytics, setShowAnalytics]     = useState(false);
  const [showSearch, setShowSearch]           = useState(false);
  const [showProfile, setShowProfile]         = useState(false);
  const [showReadiness, setShowReadiness]     = useState(false);
  const [showRankPredictor, setShowRankPredictor] = useState(false);
  const [showReferral, setShowReferral]       = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showHeatmap, setShowHeatmap]         = useState(false);
  const [showDoubtCommunity, setShowDoubtCommunity] = useState(false);
  const [showVocabBuilder, setShowVocabBuilder]     = useState(false);
  const [showNewspaper, setShowNewspaper]           = useState(false);
  const [showMapsGeo, setShowMapsGeo]               = useState(false);
  const [showMockSeries, setShowMockSeries]         = useState(false);
  const [showAIInterview, setShowAIInterview]       = useState(false);
  const [showAISchedule, setShowAISchedule]         = useState(false);
  const [showCoinShop, setShowCoinShop]             = useState(false);
  const [showMockHistory, setShowMockHistory]       = useState(false);
  const [showPDFReport, setShowPDFReport]           = useState(false);
  const [showStreakRewards, setShowStreakRewards]    = useState(false);
  const [showUserAnalytics, setShowUserAnalytics]   = useState(false);
  const [showWeakTopics, setShowWeakTopics]         = useState(false);
  const [showWAShare, setShowWAShare]               = useState(false);
  const [showXPDash, setShowXPDash]                 = useState(false);
  const [showAdmin, setShowAdmin]                   = useState(false);
  const [showCutoff, setShowCutoff]                 = useState(false);
  const [showSubjectProgress, setShowSubjectProgress] = useState(false);
  const [showAIBriefing, setShowAIBriefing]         = useState(false);
  const [showNewsToQ, setShowNewsToQ]               = useState(false);
  const [showSyllabusRadar, setShowSyllabusRadar]   = useState(false);
  const [showExamCalendar, setShowExamCalendar]     = useState(false);
  const [showStudyBuddy, setShowStudyBuddy]         = useState(false);
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
  if (mode === 'PLANNER')      return <StudyPlanner onBack={back} />;
  if (mode === 'NOTES')        return <NotesFeature onBack={back} />;
  if (mode === 'VOICE')        return <VoiceQuestions onBack={back} />;
  if (mode === 'TRANSLATOR')   return <AIMarathiTranslator onBack={back} />;
  if (mode === 'TOURNAMENT')   return <WeeklyTournament onBack={back} />;
  if (mode === 'CURRENT_FEED') return <CurrentAffairsFeed onBack={back} />;
  if (mode === 'FORMULA')      return <FormulaSheet onBack={back} />;
  if (mode === 'GROUPS')       return <StudyGroups onBack={back} user={user} />;
  if (mode === 'AI_QUIZ')        return <AIQuestionGenerator onBack={back} />;
  if (mode === 'MNEMONIC')      return <MnemonicGenerator onBack={back} />;
  if (mode === 'CONCEPT')       return <ConceptExplainer onBack={back} />;
  if (mode === 'EVAL_ANSWER')   return <AnswerEvaluator onBack={back} />;
  if (mode === 'LIVE_QUIZ')     return <LiveQuizRoom onBack={back} user={user} />;
  if (mode === 'BM_COLLECTIONS')  return <BookmarkCollections onBack={back} />;
  if (mode === 'POMODORO')       return <PomodoroTimer onBack={back} />;
  if (mode === 'QUESTION_BANK')  return <QuestionBank onBack={back} />;
  if (mode === 'ESSAY')          return <EssayMode onBack={back} />;
  if (mode === 'DISTRICT_QUIZ')  return <DistrictQuiz onBack={back} />;
  if (mode === 'SPEED_DRILL')   return <SpeedDrill onBack={back} />;
  if (mode === 'MISTAKE_BOOK')  return <MistakeBook onBack={back} />;
  if (mode === 'NEWS_TO_Q')     return <NewsToQuestion onBack={back} />;
  if (mode === 'SYLLABUS_RADAR') return <SyllabusRadar onBack={back} />;
  if (mode === 'EXAM_CALENDAR') return <ExamCalendar onBack={back} />;

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
      {showAnalytics   && <PerformanceAnalytics onClose={()=>setShowAnalytics(false)} />}
      {showSearch      && <GlobalSearch onClose={()=>setShowSearch(false)} onGoToMode={go} />}
      {showProfile     && user && <UserProfile onClose={()=>setShowProfile(false)} user={user} />}
      {showReadiness   && <ExamReadinessScore onClose={()=>setShowReadiness(false)} />}
      {showRankPredictor && <RankPredictor onClose={()=>setShowRankPredictor(false)} />}
      {showReferral    && <ReferralSystem onClose={()=>setShowReferral(false)} user={user} />}
      {showCertificate && <ProgressCertificate onClose={()=>setShowCertificate(false)} user={user} />}
      {showHeatmap     && <HeatmapCalendar onClose={()=>setShowHeatmap(false)} />}
      {showDoubtCommunity && <DoubtCommunity onClose={()=>setShowDoubtCommunity(false)} />}
      {showVocabBuilder   && <VocabBuilder onClose={()=>setShowVocabBuilder(false)} />}
      {showNewspaper      && <NewspaperSummary onClose={()=>setShowNewspaper(false)} />}
      {showMapsGeo        && <MapsGeography onClose={()=>setShowMapsGeo(false)} />}
      {showMockSeries     && <MockTestSeries onClose={()=>setShowMockSeries(false)} />}
      {showAIBriefing     && <AIDailyBriefing onClose={()=>setShowAIBriefing(false)} />}
      {showNewsToQ        && <NewsToQuestion onBack={()=>setShowNewsToQ(false)} />}
      {showAIInterview    && <div style={{position:'fixed',inset:0,zIndex:200,overflowY:'auto'}}><AIMockInterview onBack={()=>setShowAIInterview(false)} /></div>}
      {showAISchedule     && <div style={{position:'fixed',inset:0,zIndex:200,overflowY:'auto'}}><AIStudySchedule onBack={()=>setShowAISchedule(false)} /></div>}
      {showAdmin          && <div style={{position:'fixed',inset:0,zIndex:200,overflowY:'auto'}}><AdminPanel /></div>}
      {showCoinShop       && <CoinShop onClose={()=>setShowCoinShop(false)} />}
      {showMockHistory    && <MockTestHistory onClose={()=>setShowMockHistory(false)} />}
      {showPDFReport      && <PDFReport onClose={()=>setShowPDFReport(false)} />}
      {showStreakRewards   && <StreakRewards onClose={()=>setShowStreakRewards(false)} />}
      {showUserAnalytics  && <div style={{position:'fixed',inset:0,zIndex:200,overflowY:'auto'}}><UserAnalyticsDashboard onBack={()=>setShowUserAnalytics(false)} /></div>}
      {showWeakTopics     && <WeakTopicDetector onClose={()=>setShowWeakTopics(false)} />}
      {showWAShare        && <WhatsAppShare onClose={()=>setShowWAShare(false)} />}
      {showXPDash         && <XPDashboard onClose={()=>setShowXPDash(false)} />}
      {showCutoff         && <CutoffTracker onClose={()=>setShowCutoff(false)} />}
      {showSubjectProgress && <SubjectProgress onClose={()=>setShowSubjectProgress(false)} />}
      {showStudyBuddy     && <AIStudyBuddy onClose={()=>setShowStudyBuddy(false)} user={user} />}
      <AIDoubtSolver />
      {showAuth        && <AuthModal onClose={()=>setShowAuth(false)} />}
      {showLeaderboard && <Leaderboard onClose={()=>setShowLeaderboard(false)} currentUserId={user?.id} />}
      {showSupport     && <SupportModal onClose={()=>setShowSupport(false)} />}
      {showCountdown   && <ExamCountdown onClose={()=>setShowCountdown(false)} />}
      {showMore        && <MoreMenu onClose={()=>setShowMore(false)} onNav={handleMoreNav} onShowSupport={()=>setShowSupport(true)} onShowLeaderboard={()=>setShowLeaderboard(true)} onShowProgress={()=>setShowAnalytics(true)} onLogin={()=>setShowAuth(true)} onLogout={()=>signOut()} user={user} />}
      <PWAPrompt />

      {/* BG Blobs */}
      <div style={{ pointerEvents:'none', position:'fixed', inset:0, zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-5%', right:'-5%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(249,115,22,0.08) 0%,transparent 70%)', filter:'blur(50px)' }} />
        <div style={{ position:'absolute', bottom:'15%', left:'-5%', width:'40vw', height:'40vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,0.07) 0%,transparent 70%)', filter:'blur(50px)' }} />
      </div>

      <div style={{ position:'relative', zIndex:10, maxWidth:680, margin:'0 auto', padding:'0 14px 100px' }}>

        {/* ── TOP NAV ── */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 0 12px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
            <div style={{ background:'linear-gradient(135deg,#F97316,#EF4444)', borderRadius:12, padding:'8px 9px', boxShadow:'0 4px 14px rgba(249,115,22,0.35)' }}>
              <BookOpen size={20} color="#fff" />
            </div>
            <div>
              <span style={{ fontWeight:900, fontSize:18, letterSpacing:'-0.04em', color:'#1a1a1a' }}>MPSC</span>
              <span style={{ fontWeight:900, fontSize:18, letterSpacing:'-0.04em', color:'#F97316' }}> सारथी</span>
            </div>
          </div>
          <button onClick={()=>setShowSearch(true)} style={{ background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:11, padding:'8px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}>🔍</button>
          {user
            ? <button onClick={()=>setShowProfile(true)} style={{ width:36, height:36, borderRadius:12, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:15, flexShrink:0, boxShadow:'0 4px 12px rgba(232,103,26,0.35)' }}>
                {(user.user_metadata?.full_name||user.email||'U')[0].toUpperCase()}
              </button>
            : <button onClick={()=>setShowAuth(true)} style={{ background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:11, padding:'8px 14px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', boxShadow:'0 4px 14px rgba(232,103,26,0.3)', whiteSpace:'nowrap' }}>Login</button>
          }
          <button onClick={()=>setShowSupport(true)} style={{ display:'flex', alignItems:'center', gap:5, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:11, padding:'8px 13px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', boxShadow:'0 4px 14px rgba(232,103,26,0.3)' }}>
            <Heart size={12} fill="#fff" /> सपोर्ट
          </button>
          <button onClick={()=>setShowMore(true)} style={{ background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:11, padding:'8px 10px', cursor:'pointer', color:'#7A9090', display:'flex', flexDirection:'column', gap:3, alignItems:'center' }}>
            <div style={{width:14,height:1.5,background:'#7A9090',borderRadius:1}}/>
            <div style={{width:14,height:1.5,background:'#7A9090',borderRadius:1}}/>
            <div style={{width:14,height:1.5,background:'#7A9090',borderRadius:1}}/>
          </button>
        </div>

        {/* ── HERO CARD ── */}
        <div style={{ background:'linear-gradient(135deg,#1C2B2B 0%,#2D4040 100%)', borderRadius:24, padding:'20px 22px', marginBottom:16, position:'relative', overflow:'hidden', animation:'fadeUp 0.4s ease' }}>
          <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(249,115,22,0.12)', filter:'blur(30px)' }}/>
          <div style={{ position:'absolute', bottom:-30, left:-20, width:120, height:120, borderRadius:'50%', background:'rgba(59,130,246,0.1)', filter:'blur(25px)' }}/>
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(249,115,22,0.2)', border:'1px solid rgba(249,115,22,0.35)', borderRadius:999, padding:'5px 13px', marginBottom:10 }}>
              <span style={{ fontSize:12, fontWeight:800, color:'#FED7AA' }}>{greeting} 🙏</span>
            </div>
            <h1 style={{ fontSize:'clamp(1.4rem,5vw,2rem)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.2, margin:'0 0 14px', color:'#fff' }}>
              यश मिळवायचे,{' '}
              <span style={{ background:'linear-gradient(90deg,#F97316,#FBBF24)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>आजच सुरू करा.</span>
            </h1>
            {/* Inline stats row */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#F97316,#EF4444)', borderRadius:99, padding:'7px 14px', fontWeight:900, fontSize:12, color:'#fff', boxShadow:'0 4px 14px rgba(249,115,22,0.4)' }}>
                <Zap size={13} fill="currentColor"/> {count.toLocaleString()} प्रश्न
              </div>
              {progress.streak > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(249,115,22,0.15)', border:'1px solid rgba(249,115,22,0.3)', borderRadius:99, padding:'7px 13px', fontWeight:800, fontSize:12, color:'#FED7AA' }}>
                  <Flame size={13}/> {progress.streak} day streak 🔥
                </div>
              )}
              {user && (
                <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:99, padding:'7px 13px', fontWeight:700, fontSize:11, color:'#6EE7B7' }}>
                  ✓ {user.email?.split('@')[0]}
                </div>
              )}
              <div onClick={()=>setShowCountdown(true)} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(37,99,235,0.15)', border:'1px solid rgba(37,99,235,0.3)', borderRadius:99, padding:'7px 13px', fontWeight:700, fontSize:11, color:'#93C5FD', cursor:'pointer' }}>
                📊 Countdown
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {[
            { label:'सोडवलेले', value:progress.totalAttempted.toLocaleString(), icon:Target,     color:'#3B82F6', pct:Math.min(progress.totalAttempted/500*100,100), action:()=>setShowAnalytics(true) },
            { label:'अचूकता',   value:accuracy+'%',                             icon:TrendingUp, color:'#10B981', pct:accuracy, action:()=>setShowReadiness(true) },
            { label:'बरोबर',    value:progress.totalCorrect.toLocaleString(),   icon:Award,      color:'#F97316', pct:accuracy, action:()=>setShowHeatmap(true) },
          ].map(({ label, value, icon:Icon, color, pct, action }) => (
            <div key={label} className="card-hover" onClick={action}
              style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.06)', borderRadius:18, padding:'14px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', position:'relative', overflow:'hidden' }}>
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

        {/* ── TODAY SECTION ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          {/* Daily Challenge — big featured */}
          <div className="card-hover" onClick={()=>go('DAILY')}
            style={{ background:dailyDone?'linear-gradient(135deg,#064E3B,#065F46)':'linear-gradient(135deg,#7C2D12,#92400E)', borderRadius:20, padding:'18px 16px', cursor:'pointer', boxShadow:dailyDone?'0 6px 24px rgba(5,150,105,0.25)':'0 6px 24px rgba(232,103,26,0.25)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
            <div style={{ fontSize:32, marginBottom:8 }}>{dailyDone?'✅':'📅'}</div>
            <div style={{ fontWeight:900, fontSize:14, color:'#fff', marginBottom:4 }}>Daily Challenge</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', fontWeight:600 }}>{dailyDone?'आज पूर्ण! 🎉':'5 प्रश्न · आज'}</div>
            {!dailyDone && <div style={{ marginTop:8, background:'rgba(255,255,255,0.15)', borderRadius:99, padding:'4px 10px', fontSize:9, fontWeight:800, color:'#fff', display:'inline-block' }}>🔥 Streak साठी करा!</div>}
          </div>
          {/* AI Daily Briefing */}
          <div className="card-hover" onClick={()=>setShowAIBriefing(true)}
            style={{ background:'linear-gradient(135deg,#1E3A5F,#1E40AF)', borderRadius:20, padding:'18px 16px', cursor:'pointer', boxShadow:'0 6px 24px rgba(37,99,235,0.25)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
            <div style={{ fontSize:32, marginBottom:8 }}>⚡</div>
            <div style={{ fontWeight:900, fontSize:14, color:'#fff', marginBottom:4 }}>AI Daily Briefing</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', fontWeight:600 }}>रोज सकाळी · Important facts</div>
            <div style={{ marginTop:8, background:'rgba(255,255,255,0.15)', borderRadius:99, padding:'4px 10px', fontSize:9, fontWeight:800, color:'#93C5FD', display:'inline-block' }}>✨ AI Powered</div>
          </div>
        </div>

        {/* ── QUICK PLAY ── */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
            <span style={{ fontSize:9, fontWeight:800, color:'rgba(0,0,0,0.35)', textTransform:'uppercase', letterSpacing:'0.15em' }}>⚡ Quick Play</span>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[
              { e:'⚔️', t:'Tournament', s:'20Q · Rank', c:'#D97706', action:()=>go('TOURNAMENT') },
              { e:'⚡', t:'Speed Drill', s:'6sec · Fast', c:'#F59E0B', action:()=>go('SPEED_DRILL') },
              { e:'🎮', t:'Live Quiz', s:'Multiplayer', c:'#8B5CF6', action:()=>go('LIVE_QUIZ') },
              { e:'🏆', t:'Friend Duel', s:'Compete', c:'#DC2626', action:()=>go('CHALLENGE') },
              { e:'📊', t:'Exam Countdown', s:'दिवस बाकी', c:'#2563EB', action:()=>setShowCountdown(true) },
              { e:'🏆', t:'Mock Series', s:'Complete Papers', c:'#F59E0B', action:()=>setShowMockSeries(true) },
            ].map(({e,t,s,c,action}) => (
              <div key={t} className="card-hover" onClick={action}
                style={{ background:'#fff', border:`1.5px solid ${c}20`, borderRadius:16, padding:'13px 10px', cursor:'pointer', textAlign:'center', boxShadow:`0 2px 10px ${c}10` }}>
                <div style={{ fontSize:24, marginBottom:5 }}>{e}</div>
                <div style={{ fontWeight:900, fontSize:11, color:'#1C2B2B', marginBottom:2 }}>{t}</div>
                <div style={{ fontSize:9, fontWeight:700, color:c }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI TOOLS ── */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
            <span style={{ fontSize:9, fontWeight:800, color:'rgba(0,0,0,0.35)', textTransform:'uppercase', letterSpacing:'0.15em' }}>🤖 AI Tools</span>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:8 }}>
            {[
              { e:'🤖', t:'Study Buddy', s:'Personal tutor', c:'#7C3AED', action:()=>setShowStudyBuddy(true) },
              { e:'🧠', t:'Weak Topics', s:'AI analysis', c:'#DC2626', action:()=>setShowWeakTopics(true) },
              { e:'🎙️', t:'Mock Interview', s:'AI practice', c:'#8B5CF6', action:()=>setShowAIInterview(true) },
              { e:'🌐', t:'Translator', s:'EN ↔ मराठी', c:'#7C3AED', action:()=>go('TRANSLATOR') },
              { e:'📖', t:'Concept AI', s:'Topics explain', c:'#059669', action:()=>go('CONCEPT') },
              { e:'✍️', t:'Essay Mode', s:'AI evaluate', c:'#D97706', action:()=>go('ESSAY') },
            ].map(({e,t,s,c,action}) => (
              <div key={t} className="card-hover" onClick={action}
                style={{ background:'#fff', border:`1.5px solid ${c}20`, borderRadius:16, padding:'13px 10px', cursor:'pointer', boxShadow:`0 2px 10px ${c}10` }}>
                <div style={{ fontSize:22, marginBottom:5 }}>{e}</div>
                <div style={{ fontWeight:900, fontSize:11, color:'#1C2B2B', marginBottom:2 }}>{t}</div>
                <div style={{ fontSize:9, fontWeight:700, color:c }}>{s}</div>
              </div>
            ))}
          </div>
          {/* AI Quiz + Answer Evaluator wider */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { e:'🤖', t:'AI Quiz Generator', s:'Topic → 5 MPSC questions', c:'#DC2626', action:()=>go('AI_QUIZ') },
              { e:'✅', t:'Answer Evaluator', s:'Long answer score करा', c:'#059669', action:()=>go('EVAL_ANSWER') },
              { e:'📅', t:'AI Study Schedule', s:'7-day plan', c:'#3B82F6', action:()=>setShowAISchedule(true) },
              { e:'📰', t:'News → Question', s:'बातमी → MPSC MCQ', c:'#EC4899', action:()=>go('NEWS_TO_Q') },
              { e:'🎯', t:'Syllabus Radar', s:'Gap analysis', c:'#7C3AED', action:()=>go('SYLLABUS_RADAR') },
              { e:'📅', t:'Exam Calendar', s:'Schedule + countdown', c:'#0D6B6E', action:()=>go('EXAM_CALENDAR') },
            ].map(({e,t,s,c,action}) => (
              <div key={t} className="card-hover" onClick={action}
                style={{ background:`${c}08`, border:`1.5px solid ${c}20`, borderRadius:16, padding:'14px', cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:26, flexShrink:0 }}>{e}</div>
                <div>
                  <div style={{ fontWeight:900, fontSize:12, color:'#1C2B2B', marginBottom:2 }}>{t}</div>
                  <div style={{ fontSize:10, fontWeight:600, color:c }}>{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── STUDY TOOLS ── */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
            <span style={{ fontSize:9, fontWeight:800, color:'rgba(0,0,0,0.35)', textTransform:'uppercase', letterSpacing:'0.15em' }}>📚 Study Tools</span>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:8 }}>
            {[
              { e:'📖', t:'Mistake Book', s:'Revise errors', c:'#8B5CF6', action:()=>go('MISTAKE_BOOK') },
              { e:'🎴', t:'Flashcards', s:'Swipe vocab', c:'#059669', action:()=>go('FLASHCARD') },
              { e:'🎯', t:'Smart Rev.', s:'Auto-save', c:'#7C3AED', action:()=>go('REVISION') },
              { e:'⏱️', t:'Pomodoro', s:'Focus timer', c:'#E8671A', action:()=>go('POMODORO') },
            ].map(({e,t,s,c,action}) => (
              <div key={t} className="card-hover" onClick={action}
                style={{ background:'#fff', border:`1.5px solid ${c}20`, borderRadius:16, padding:'13px 10px', cursor:'pointer', textAlign:'center', boxShadow:`0 2px 8px ${c}0F` }}>
                <div style={{ fontSize:22, marginBottom:5 }}>{e}</div>
                <div style={{ fontWeight:900, fontSize:11, color:'#1C2B2B', marginBottom:2 }}>{t}</div>
                <div style={{ fontSize:9, fontWeight:700, color:c }}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[
              { e:'📅', t:'Study Planner', s:'Syllabus tracker', c:'#7C3AED', action:()=>go('PLANNER') },
              { e:'📝', t:'My Notes', s:'Personal notes', c:'#E8671A', action:()=>go('NOTES') },
              { e:'🏦', t:'Question Bank', s:"Browse all Q/'s", c:'#059669', action:()=>go('QUESTION_BANK') },
              { e:'📚', t:'Formula Sheet', s:'Quick revision', c:'#059669', action:()=>go('FORMULA') },
              { e:'🔊', t:'Voice Quiz', s:'TTS audio', c:'#E8671A', action:()=>go('VOICE') },
              { e:'🧠', t:'Mnemonics', s:'Memory tricks', c:'#8B5CF6', action:()=>go('MNEMONIC') },
            ].map(({e,t,s,c,action}) => (
              <div key={t} className="card-hover" onClick={action}
                style={{ background:'#fff', border:`1.5px solid ${c}20`, borderRadius:16, padding:'13px 10px', cursor:'pointer', boxShadow:`0 2px 8px ${c}0F` }}>
                <div style={{ fontSize:20, marginBottom:5 }}>{e}</div>
                <div style={{ fontWeight:900, fontSize:11, color:'#1C2B2B', marginBottom:2 }}>{t}</div>
                <div style={{ fontSize:9, fontWeight:700, color:c }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MORE PRACTICE ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
          {[
            { e:'📜', t:'PYQ संच', s:'मागील वर्षांचे', c:'#F59E0B', action:()=>go('PYQ') },
            { e:'⚡', t:'SpardhaYodha', s:'Speed quiz', c:'#E8671A', action:()=>go(Mode.SPARDHA) },
            { e:'📋', t:'Test History', s:'Past results', c:'#2563EB', action:()=>setShowMockHistory(true) },
          ].map(({e,t,s,c,action}) => (
            <div key={t} className="card-hover" onClick={action}
              style={{ background:'#fff', border:`1.5px solid ${c}20`, borderRadius:16, padding:'13px 10px', cursor:'pointer', textAlign:'center', boxShadow:`0 2px 8px ${c}10` }}>
              <div style={{ fontSize:22, marginBottom:5 }}>{e}</div>
              <div style={{ fontWeight:900, fontSize:11, color:'#1C2B2B', marginBottom:2 }}>{t}</div>
              <div style={{ fontSize:9, fontWeight:700, color:c }}>{s}</div>
            </div>
          ))}
        </div>

        {/* ── LIVE TEST FEATURE ── */}
        <div onClick={()=>go(Mode.MOCK_TEST)} className="card-hover"
          style={{ background:'linear-gradient(135deg,#7F1D1D,#450A0A)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:22, padding:'20px 20px', cursor:'pointer', boxShadow:'0 6px 28px rgba(239,68,68,0.2)', marginBottom:16 }}>
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

        {/* ── SUBJECT SECTIONS ── */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
            <span style={{ fontSize:9, fontWeight:800, color:'rgba(0,0,0,0.35)', textTransform:'uppercase', letterSpacing:'0.15em' }}>📋 अभ्यास विभाग</span>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            {SECTIONS.map(({ mode:m, label, sub, icon:Icon, accent, tag }) => (
              <div key={String(m)} onClick={()=>go(m)} className="card-hover"
                style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.06)', borderRadius:18, padding:'16px 14px', position:'relative', overflow:'hidden', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
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
        </div>

        {/* ── CURRENT AFFAIRS + NEWS ── */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
            <span style={{ fontSize:9, fontWeight:800, color:'rgba(0,0,0,0.35)', textTransform:'uppercase', letterSpacing:'0.15em' }}>📰 Current Affairs</span>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[
              { e:'📰', t:'CA Feed', s:'Category filter', c:'#EC4899', action:()=>go('CURRENT_FEED') },
              { e:'🗞️', t:'News Summary', s:'AI Marathi', c:'#EC4899', action:()=>setShowNewspaper(true) },
              { e:'💬', t:'Doubt Community', s:'Q&A forum', c:'#E8671A', action:()=>setShowDoubtCommunity(true) },
              { e:'📖', t:'Vocab Builder', s:'Daily 10 words', c:'#8B5CF6', action:()=>setShowVocabBuilder(true) },
              { e:'🗺️', t:'Maharashtra Map', s:'36 districts', c:'#0D9488', action:()=>setShowMapsGeo(true) },
              { e:'🗺️', t:'District Quiz', s:'Geography MCQ', c:'#059669', action:()=>go('DISTRICT_QUIZ') },
            ].map(({e,t,s,c,action}) => (
              <div key={t} className="card-hover" onClick={action}
                style={{ background:'#fff', border:`1.5px solid ${c}20`, borderRadius:16, padding:'13px 10px', cursor:'pointer', boxShadow:`0 2px 8px ${c}10` }}>
                <div style={{ fontSize:22, marginBottom:5 }}>{e}</div>
                <div style={{ fontWeight:900, fontSize:11, color:'#1C2B2B', marginBottom:2 }}>{t}</div>
                <div style={{ fontSize:9, fontWeight:700, color:c }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ANALYTICS + PROGRESS ── */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
            <span style={{ fontSize:9, fontWeight:800, color:'rgba(0,0,0,0.35)', textTransform:'uppercase', letterSpacing:'0.15em' }}>📊 Analytics & Progress</span>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:8 }}>
            {[
              { e:'📈', t:'Analytics', s:'Performance', c:'#E8671A', action:()=>setShowAnalytics(true) },
              { e:'🌡️', t:'Heatmap', s:'Activity calendar', c:'#7C3AED', action:()=>setShowHeatmap(true) },
              { e:'📊', t:'Subject %', s:'Per-subject', c:'#E8671A', action:()=>setShowSubjectProgress(true) },
              { e:'🎯', t:'Readiness', s:'Exam ready?', c:'#059669', action:()=>setShowReadiness(true) },
              { e:'🏆', t:'Rank Predict', s:'Possible rank', c:'#2563EB', action:()=>setShowRankPredictor(true) },
              { e:'📊', t:'Cut-offs', s:'Year trends', c:'#2563EB', action:()=>setShowCutoff(true) },
            ].map(({e,t,s,c,action}) => (
              <div key={t} className="card-hover" onClick={action}
                style={{ background:'#fff', border:`1.5px solid ${c}20`, borderRadius:16, padding:'13px 10px', cursor:'pointer', boxShadow:`0 2px 8px ${c}10` }}>
                <div style={{ fontSize:22, marginBottom:5 }}>{e}</div>
                <div style={{ fontWeight:900, fontSize:11, color:'#1C2B2B', marginBottom:2 }}>{t}</div>
                <div style={{ fontSize:9, fontWeight:700, color:c }}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { e:'⚡', t:'XP Dashboard', s:'Level + badges', c:'#D97706', action:()=>setShowXPDash(true) },
              { e:'🔥', t:'Streak Rewards', s:'Milestones', c:'#E8671A', action:()=>setShowStreakRewards(true) },
              { e:'👥', t:'User Analytics', s:'All students', c:'#2563EB', action:()=>setShowUserAnalytics(true) },
            ].map(({e,t,s,c,action}) => (
              <div key={t} className="card-hover" onClick={action}
                style={{ background:`${c}08`, border:`1.5px solid ${c}20`, borderRadius:16, padding:'14px', cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:26, flexShrink:0 }}>{e}</div>
                <div><div style={{ fontWeight:900, fontSize:12, color:'#1C2B2B', marginBottom:2 }}>{t}</div><div style={{ fontSize:10, fontWeight:600, color:c }}>{s}</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SOCIAL + GAMIFICATION ── */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
            <span style={{ fontSize:9, fontWeight:800, color:'rgba(0,0,0,0.35)', textTransform:'uppercase', letterSpacing:'0.15em' }}>🎮 Social & Fun</span>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {[
              { e:'👥', t:'Study Groups', s:'Chat + learn', c:'#2563EB', action:()=>go('GROUPS') },
              { e:'🏆', t:'Leaderboard', s:'Top students', c:'#F59E0B', action:()=>setShowLeaderboard(true) },
              { e:'🪙', t:'Coin Shop', s:'Themes unlock', c:'#D97706', action:()=>setShowCoinShop(true) },
              { e:'🎁', t:'Referral', s:'Invite = coins', c:'#E8671A', action:()=>setShowReferral(true) },
            ].map(({e,t,s,c,action}) => (
              <div key={t} className="card-hover" onClick={action}
                style={{ background:'#fff', border:`1.5px solid ${c}20`, borderRadius:16, padding:'13px 10px', cursor:'pointer', textAlign:'center', boxShadow:`0 2px 8px ${c}0F` }}>
                <div style={{ fontSize:22, marginBottom:5 }}>{e}</div>
                <div style={{ fontWeight:900, fontSize:11, color:'#1C2B2B', marginBottom:2 }}>{t}</div>
                <div style={{ fontSize:9, fontWeight:700, color:c }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DOWNLOADS ── */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[
              { e:'📄', t:'PDF Report', s:'Download progress', c:'#DC2626', action:()=>setShowPDFReport(true) },
              { e:'🏅', t:'Certificate', s:'Achievement PDF', c:'#D97706', action:()=>setShowCertificate(true) },
              { e:'💬', t:'Share Score', s:'WhatsApp share', c:'#25D366', action:()=>setShowWAShare(true) },
            ].map(({e,t,s,c,action}) => (
              <div key={t} className="card-hover" onClick={action}
                style={{ background:'#fff', border:`1.5px solid ${c}20`, borderRadius:16, padding:'14px 10px', cursor:'pointer', textAlign:'center', boxShadow:`0 2px 8px ${c}10` }}>
                <div style={{ fontSize:24, marginBottom:5 }}>{e}</div>
                <div style={{ fontWeight:900, fontSize:11, color:'#1C2B2B', marginBottom:2 }}>{t}</div>
                <div style={{ fontSize:9, fontWeight:700, color:c }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SUPPORT BANNER ── */}
        <div onClick={()=>setShowSupport(true)} className="card-hover"
          style={{ background:'linear-gradient(135deg,#FFF7ED,#FEF3C7)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:18, padding:'16px 18px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:28, animation:'sp-heart 2s ease infinite' }}>❤️</div>
            <div>
              <div style={{ fontWeight:900, fontSize:13, color:'#92400E' }}>MPSC सारथी सपोर्ट करा!</div>
              <div style={{ fontSize:11, color:'#B45309', fontWeight:600 }}>Free portal चालू ठेवण्यासाठी · ₹29 पासून</div>
            </div>
          </div>
          <ChevronRight size={16} style={{ color:'#E8671A' }} />
        </div>

        {/* ── FOOTER ── */}
        <div style={{ textAlign:'center', paddingBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'center', gap:2, marginBottom:6 }}>
            {[...Array(5)].map((_,i) => <Star key={i} size={10} fill="#F97316" style={{ color:'#F97316' }} />)}
          </div>
          <p style={{ fontSize:10, color:'rgba(0,0,0,0.3)', fontWeight:600 }}>Maharashtra's #1 Free MPSC Portal · mpscsarathi.online</p>
          <button onClick={()=>setShowAdmin(true)} style={{background:'none',border:'none',cursor:'pointer',fontSize:8,color:'rgba(0,0,0,0.1)',marginTop:4}}>v2.0</button>
        </div>
      </div>

      {/* Floating AI Buddy */}
      {!showStudyBuddy && (
        <button onClick={()=>setShowStudyBuddy(true)}
          style={{position:'fixed',bottom:76,right:16,zIndex:99,width:52,height:52,borderRadius:16,background:'linear-gradient(135deg,#7C3AED,#EC4899)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:'0 6px 24px rgba(124,58,237,0.5)',animation:'pulse 2s ease infinite'}}>
          🤖
        </button>
      )}
      <BottomNav active="HOME" onNav={handleBottomNav} dailyDone={dailyDone} />
    </div>
  );
}

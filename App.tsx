import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Mode, UserProgress } from './types';
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
import { BookmarkMode } from './components/BookmarksMode';
import { BottomNav } from './components/BottomNav';
import { MoreMenu } from './components/MoreMenu';
import { PWAPrompt } from './components/PWAPrompt';
import { useAuth, signOut } from './hooks/useAuth';
import { Result } from './components/Result';
import { pullProgressFromCloud, pushProgressToCloud, startAutoSync } from './lib/Cloudsync';
import { Heart, History, BookOpen, Trophy, Newspaper, ShieldCheck, Zap, BookMarked, X, Target, Flame, Languages, GraduationCap, ChevronRight, Star, TrendingUp, Award, Bookmark, BarChart2, FileText } from 'lucide-react';

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
  { mode: Mode.PRELIMS,         label:'पूर्व परीक्षा',   sub:'PYQ + Practice',         icon:History,      accent:'#3B82F6', tag:'PYQ'   },
  { mode: Mode.MAINS,           label:'मुख्य परीक्षा',   sub:'GS + भाषा',              icon:BookMarked,    accent:'#10B981', tag:'PYQ'   },
  { mode: Mode.SARALSEVA,       label:'सरळसेवा',         sub:'TCS / IBPS / ZP',        icon:ShieldCheck,   accent:'#06B6D4', tag:'NEW'   },
  { mode: Mode.VOCAB,           label:'शब्दसंग्रह',      sub:'Marathi + English',      icon:Languages,      accent:'#8B5CF6', tag:'HOT'   },
  { mode: Mode.LITERATURE,      label:'मराठी साहित्य',   sub:'Mains + NET/SET',        icon:GraduationCap, accent:'#F97316', tag:'NEW'   },
  { mode: Mode.MOCK,            label:'State Board',      sub:'पाठ्यपुस्तक Mock',       icon:Trophy,        accent:'#F59E0B', tag:'MOCK'  },
  { mode: Mode.CURRENT_AFFAIRS, label:'चालू घडामोडी',   sub:'Daily Updates',          icon:Newspaper,      accent:'#EC4899', tag:'DAILY' },
  { mode: 'PYQ' as any,         label:'PYQ संच',          sub:'मागील वर्षांचे प्रश्न', icon:FileText,       accent:'#F59E0B', tag:'PYQ'   },
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
  body { background: #F5F0E8 !important; margin: 0; padding: 0; }
  .card-hover { transition: all 0.18s ease; }
  .card-hover:active { transform: scale(0.97) !important; opacity:0.9; }
`;

export default function App() {
  const [mode, setMode] = useState<any>(() => (localStorage.getItem('mpsc_mode') as any) || Mode.HOME);
  const [count, setCount]         = useState(0);
  const [progress, setProgress]   = useState<UserProgress>(loadProgress());
  const [time, setTime]           = useState(new Date());
  const [showProgress, setShowProgress]       = useState(false);
  const [showAuth, setShowAuth]               = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSupport, setShowSupport]         = useState(false);
  const [showCountdown, setShowCountdown]     = useState(false);
  const [showMore, setShowMore]               = useState(false);
  const [showAnalytics, setShowAnalytics]     = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const { user } = useAuth();

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
  const greeting = time.getHours()<12 ? 'शुभ सकाळ' : time.getHours()<17 ? 'शुभ दुपार' : 'शुभ संध्याकाळ';
  const go   = (m: any) => { setMode(m); setShowResult(false); };
  const back = () => { setMode(Mode.HOME); setShowResult(false); setProgress(loadProgress()); };

  const handleBottomNav = (tab: string) => {
    if (tab === 'HOME') setMode(Mode.HOME);
    else if (tab === 'DAILY') go('DAILY');
    else if (tab === 'FLASHCARD') go('FLASHCARD');
    else if (tab === 'PROGRESS') setShowAnalytics(true);
    else if (tab === 'MORE') setShowMore(true);
  };

  const dailyDone = (() => {
    try { const d = JSON.parse(localStorage.getItem('mpsc_daily_challenge')||'{}'); return d.date===new Date().toDateString()&&d.done; } catch { return false; }
  })();

  // १. जर निकाल (Result) दाखवायचा असेल तर
  if (showResult) {
    return (
      <div style={{ minHeight:'100vh', background:'#F5F0E8' }}>
        <style>{CSS}</style>
        <Result 
          score={score} 
          totalQuestions={10} 
          onRestart={() => { setScore(0); setShowResult(false); setMode(Mode.HOME); }} 
        />
      </div>
    );
  }

  // २. जर युजर डॅशबोर्डवर नसेल तर (Study Modes)
  if (mode !== Mode.HOME) {
    return (
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
          {mode === Mode.PRELIMS       && <QuestionView type={Mode.PRELIMS} tableName="prelims_questions" onBack={back} onProgressUpdate={()=>setProgress(loadProgress())} />}
          {mode === Mode.MAINS         && <QuestionView type={Mode.MAINS} tableName="mains_questions" onBack={back} onProgressUpdate={()=>setProgress(loadProgress())} />}
          {mode === Mode.SARALSEVA     && <QuestionView type={Mode.SARALSEVA} tableName="saralseva_questions" onBack={back} onProgressUpdate={()=>setProgress(loadProgress())} />}
          {mode === Mode.MOCK          && <QuestionView type={Mode.MOCK} tableName="mock_questions" onBack={back} onProgressUpdate={()=>setProgress(loadProgress())} />}
          {mode === Mode.MOCK_TEST     && <MockTestMode onBack={back} />}
          {mode === Mode.CURRENT_AFFAIRS && <QuestionView type={Mode.CURRENT_AFFAIRS} tableName="current_affairs" onBack={back} onProgressUpdate={()=>setProgress(loadProgress())} />}
          {mode === Mode.VOCAB         && <VocabMode onBack={back} />}
          {mode === Mode.LITERATURE      && <LiteratureMode onBack={back} />}
          {mode === Mode.SPARDHA       && <SpardhaYodha onBack={back} />}
          {mode === 'BOOKMARKS'        && <BookmarkMode onBack={back} />}
          {mode === 'PYQ'              && <PYQMode onBack={back} />}
          {mode === 'FLASHCARD'        && <FlashcardMode onBack={back} />}
          {mode === 'REVISION'         && <SmartRevision onBack={back} />}
          {mode === 'CHALLENGE'        && <FriendChallenge onBack={back} />}
          {mode === 'DAILY'            && <DailyChallenge onBack={back} />}
          {mode === 'PLANNER'          && <StudyPlanner onBack={back} />}
          {mode === 'AI_QUIZ'          && <AIQuestionGenerator onBack={back} />}
        </div>
        {!isExam && <BottomNav active="HOME" onNav={handleBottomNav} dailyDone={dailyDone} />}
      </div>
    );
  }

  // ३. मुख्य डॅशबोर्ड (DASHBOARD)
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Poppins','Noto Sans Devanagari',sans-serif", color:'#1a1a1a', overflowX:'hidden' }}>
      <style>{CSS}</style>

      {showAnalytics   && <PerformanceAnalytics onClose={()=>setShowAnalytics(false)} />}
      <AIDoubtSolver />
      {showAuth        && <AuthModal onClose={()=>setShowAuth(false)} />}
      {showLeaderboard && <Leaderboard onClose={()=>setShowLeaderboard(false)} currentUserId={user?.id} />}
      {showSupport     && <SupportModal onClose={()=>setShowSupport(false)} />}
      {showCountdown   && <ExamCountdown onClose={()=>setShowCountdown(false)} />}
      {showMore        && <MoreMenu onClose={()=>setShowMore(false)} onNav={(m)=> {setShowMore(false); if(m==='COUNTDOWN') setShowCountdown(true); else if(m==='ANALYTICS') setShowAnalytics(true); else go(m);}} onShowSupport={()=>setShowSupport(true)} onShowLeaderboard={()=>setShowLeaderboard(true)} onShowProgress={()=>setShowAnalytics(true)} onLogin={()=>setShowAuth(true)} onLogout={()=>signOut()} user={user} />}
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
          <button onClick={()=>setShowSupport(true)} style={{ display:'flex', alignItems:'center', gap:5, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:11, padding:'8px 14px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', boxShadow:'0 4px 14px rgba(232,103,26,0.3)' }}>
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
            <span style={{ background:'linear-gradient(90deg,#F97316,#EF4444)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>आजच सुरू करा.</span>
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
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
          {[
            { label:'सोडवलेले', value:progress.totalAttempted.toLocaleString(), icon:Target, color:'#3B82F6', pct:Math.min(progress.totalAttempted/500*100,100) },
            { label:'अचूकता', value:accuracy+'%', icon:TrendingUp, color:'#10B981', pct:accuracy },
            { label:'बरोबर', value:progress.totalCorrect.toLocaleString(), icon:Award, color:'#F97316', pct:accuracy },
          ].map(({ label, value, icon:Icon, color, pct }) => (
            <div key={label} className="card-hover" style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:18, padding:'14px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', position:'relative', overflow:'hidden' }} onClick={()=>setShowAnalytics(true)}>
              <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at 50% 0%,${color}10 0%,transparent 60%)` }} />
              <Ring pct={pct} color={color} size={54} stroke={5} />
              <div style={{ position:'absolute', top:'24px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={13} style={{ color }} />
              </div>
              <div style={{ textAlign:'center', zIndex:1 }}>
                <div style={{ fontWeight:900, fontSize:'clamp(0.85rem,3vw,1.1rem)', color:'#111' }}>{value}</div>
                <div style={{ fontSize:8, fontWeight:700, color:'rgba(0,0,0,0.35)', textTransform:'uppercase' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {[
            { emoji:dailyDone?'✅':'📅', title:'Daily Challenge', sub:dailyDone?'आज पूर्ण!':'5 प्रश्न · आज', color:dailyDone?'#059669':'#C4510E', onClick:()=>go('DAILY') },
            { emoji:'📊', title:'Exam Countdown', sub:'किती दिवस बाकी', color:'#2563EB', onClick:()=>setShowCountdown(true) },
            { emoji:'📅', title:'Study Planner', sub:'Syllabus tracker', color:'#7C3AED', onClick:()=>go('PLANNER') },
            { emoji:'🤖', title:'AI Quiz', sub:'AI questions generate', color:'#DC2626', onClick:()=>go('AI_QUIZ') },
          ].map(({ emoji, title, sub, color, onClick }) => (
            <div key={title} className="card-hover" onClick={onClick} style={{ background:'rgba(255,255,255,0.6)', border:'1.5px solid rgba(0,0,0,0.05)', borderRadius:16, padding:'14px 12px', cursor:'pointer' }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{emoji}</div>
              <div style={{ fontWeight:900, fontSize:12 }}>{title}</div>
              <div style={{ fontSize:9, fontWeight:700, color, marginTop:2 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Categories / Sections */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {SECTIONS.map(({ mode:m, label, sub, icon:Icon, accent, tag }) => (
            <div key={String(m)} onClick={()=>go(m)} className="card-hover" style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:18, padding:'16px 14px', position:'relative', overflow:'hidden', cursor:'pointer' }}>
              <div style={{ background:`${accent}15`, borderRadius:10, padding:7, width:'fit-content', marginBottom:10 }}>
                <Icon size={17} style={{ color:accent }} />
              </div>
              <div style={{ fontWeight:900, fontSize:14, marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:9, color:'rgba(0,0,0,0.4)' }}>{sub}</div>
              {tag && <span style={{ position:'absolute', top:12, right:12, fontSize:7, fontWeight:900, background:`${accent}15`, color:accent, padding:'2px 6px', borderRadius:99 }}>{tag}</span>}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', padding:'20px 0 80px' }}>
          <p style={{ fontSize:10, color:'rgba(0,0,0,0.3)', fontWeight:600 }}>Maharashtra's #1 Free MPSC Portal · mpscsarathi.online</p>
        </div>
      </div>

      <BottomNav active="HOME" onNav={handleBottomNav} dailyDone={dailyDone} />
    </div>
  );
}

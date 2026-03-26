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
import { BookmarkMode } from './components/BookmarksMode';
import { useAuth, signOut } from './hooks/useAuth';
import { pullProgressFromCloud, startAutoSync } from './services/cloudSync';
import { LogIn, LogOut, Users, Heart } from 'lucide-react';
import {
  History, BookOpen, Trophy, Newspaper, ShieldCheck,
  Zap, BookMarked, X, Target, Flame, Languages,
  GraduationCap, ChevronRight, Star, TrendingUp,
  Award, Bookmark, BarChart2, FileText, Clock, Brain, Layers, Swords
} from 'lucide-react';

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
  { mode: 'PYQ' as any,         label:'PYQ संच',          sub:'मागील वर्षांचे प्रश्न', icon:FileText,      accent:'#F59E0B', tag:'PYQ'   },
];

function Ring({ pct, color, size=80, stroke=7 }: { pct:number; color:string; size?:number; stroke?:number }) {
  const r = (size - stroke*2)/2, circ = 2*Math.PI*r, offset = circ - (pct/100)*circ;
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
  body { background: #F5F0E8 !important; }
  .card-hover { transition: all 0.22s ease; }
  .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important; }
  .nav-btn:hover { background: rgba(0,0,0,0.06) !important; }
  .support-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(232,103,26,0.35) !important; }
`;

export default function App() {
  const [mode, setMode] = useState<Mode | 'PYQ' | 'BOOKMARKS' | 'FLASHCARD' | 'REVISION' | 'CHALLENGE'>(() => (localStorage.getItem('mpsc_mode') as any) || Mode.HOME);
  const [count, setCount]         = useState(0);
  const [progress, setProgress]   = useState<UserProgress>(loadProgress());
  const [time, setTime]           = useState(new Date());
  const [showProgress, setShowProgress]       = useState(false);
  const [showAuth, setShowAuth]               = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSupport, setShowSupport]         = useState(false);
  const [showCountdown, setShowCountdown]     = useState(false);
  const { user, loading: authLoading }        = useAuth();

  const isExam      = mode === Mode.MOCK_TEST;
  const isSpardha   = mode === Mode.SPARDHA;
  const isBookmark  = mode === 'BOOKMARKS';
  const isPYQ       = mode === 'PYQ';
  const isFlashcard = mode === 'FLASHCARD';
  const isRevision  = mode === 'REVISION';
  const isChallenge = mode === 'CHALLENGE';

  useEffect(() => {
    localStorage.setItem('mpsc_mode', mode as string);
    window.scrollTo(0, 0);
    setProgress(loadProgress());
  }, [mode]);

  useEffect(() => {
    const tables = ['prelims_questions','mains_questions','mock_questions','current_affairs','vocab_questions','literature_questions'];
    Promise.all(tables.map(t => supabase.from(t).select('*',{count:'exact',head:true})))
      .then(rs => setCount(rs.reduce((a,c) => a+(c.count||0), 0)))
      .catch(()=>{});
    const tick = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!user) return;
    pullProgressFromCloud(user).then(() => setProgress(loadProgress()));
    const stop = startAutoSync(user);
    return stop;
  }, [user]);

  const accuracy = progress.totalAttempted > 0 ? Math.round((progress.totalCorrect/progress.totalAttempted)*100) : 0;
  const hour     = time.getHours();
  const greeting = hour<12 ? 'शुभ सकाळ' : hour<17 ? 'शुभ दुपार' : 'शुभ संध्याकाळ';
  const go   = (m: any) => setMode(m);
  const back = () => { setMode(Mode.HOME); setProgress(loadProgress()); };

  const lightWrapper = { minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Poppins','Noto Sans Devanagari',sans-serif", color:'#1a1a1a' };

  if (isSpardha)   return <SpardhaYodha onBack={back} />;
  if (isBookmark)  return <BookmarkMode onBack={back} />;
  if (isPYQ)       return <PYQMode onBack={back} />;
  if (isFlashcard) return <FlashcardMode onBack={back} />;
  if (isRevision)  return <SmartRevision onBack={back} />;
  if (isChallenge) return <FriendChallenge onBack={back} />;

  if (mode !== Mode.HOME) return (
    <div style={lightWrapper}>
      <style>{CSS}</style>
      {!isExam && (
        <div style={{ background:'rgba(255,255,255,0.85)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:12, padding:'14px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <button onClick={back} style={{ display:'flex', alignItems:'center', gap:6, color:'#F97316', fontWeight:800, fontSize:13, background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:10, padding:'7px 14px', cursor:'pointer' }}>
            <X size={15} /> डॅशबोर्ड
          </button>
          <span style={{ color:'rgba(0,0,0,0.2)', fontSize:16 }}>|</span>
          <span style={{ color:'#1a1a1a', fontWeight:900, fontSize:13 }}>{SECTIONS.find(s => s.mode === mode)?.label || mode}</span>
        </div>
      )}
      <div className={isExam ? '' : 'max-w-5xl mx-auto px-4 py-6'}>
        {mode === Mode.PRELIMS         && <QuestionView type={Mode.PRELIMS}         tableName="prelims_questions"   onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
        {mode === Mode.MAINS           && <QuestionView type={Mode.MAINS}           tableName="mains_questions"     onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
        {mode === Mode.SARALSEVA       && <QuestionView type={Mode.SARALSEVA}       tableName="saralseva_questions" onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
        {mode === Mode.MOCK            && <QuestionView type={Mode.MOCK}            tableName="mock_questions"      onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
        {mode === Mode.MOCK_TEST       && <MockTestMode onBack={back} />}
        {mode === Mode.CURRENT_AFFAIRS && <QuestionView type={Mode.CURRENT_AFFAIRS} tableName="current_affairs"    onBack={back} onProgressUpdate={() => setProgress(loadProgress())} />}
        {mode === Mode.VOCAB           && <VocabMode onBack={back} />}
        {mode === Mode.LITERATURE      && <LiteratureMode onBack={back} />}
      </div>
    </div>
  );

  // DASHBOARD
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Poppins','Noto Sans Devanagari',sans-serif", color:'#1a1a1a', position:'relative', overflowX:'hidden' }}>
      <style>{CSS}</style>
      {showProgress    && <ProgressDashboard onClose={() => setShowProgress(false)} />}
      <AIDoubtSolver />
      {showAuth        && <AuthModal onClose={() => setShowAuth(false)} />}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} currentUserId={user?.id} />}
      {showSupport     && <SupportModal onClose={() => setShowSupport(false)} />}
      {showCountdown   && <ExamCountdown onClose={() => setShowCountdown(false)} />}

      <div style={{ pointerEvents:'none', position:'fixed', inset:0, zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-5%', right:'-5%', width:'40vw', height:'40vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(249,115,22,0.08) 0%,transparent 70%)', filter:'blur(50px)' }} />
        <div style={{ position:'absolute', bottom:'10%', left:'-5%', width:'35vw', height:'35vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,0.07) 0%,transparent 70%)', filter:'blur(50px)' }} />
        <div style={{ position:'absolute', top:'50%', left:'40%', width:'30vw', height:'30vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 70%)', filter:'blur(60px)' }} />
      </div>

      <div style={{ position:'relative', zIndex:10, maxWidth:1100, margin:'0 auto', padding:'0 16px 80px' }}>

        {/* Nav */}
        <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 0', borderBottom:'1px solid rgba(0,0,0,0.07)', marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ background:'linear-gradient(135deg,#F97316,#EF4444)', borderRadius:14, padding:'9px 11px', boxShadow:'0 4px 14px rgba(249,115,22,0.35)' }}>
              <BookOpen size={22} color="#fff" />
            </div>
            <div>
              <span style={{ fontWeight:900, fontSize:20, letterSpacing:'-0.04em', color:'#1a1a1a' }}>MPSC</span>
              <span style={{ fontWeight:900, fontSize:20, letterSpacing:'-0.04em', color:'#F97316' }}> सारथी</span>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={() => go('BOOKMARKS')} className="nav-btn"
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:'8px 14px', color:'#B45309', fontWeight:800, fontSize:12, cursor:'pointer' }}>
              <Bookmark size={14} /> Bookmarks
            </button>
            <button onClick={() => setShowProgress(true)} className="nav-btn"
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.3)', borderRadius:12, padding:'8px 14px', color:'#C2410C', fontWeight:800, fontSize:12, cursor:'pointer' }}>
              <BarChart2 size={14} /> प्रगती
            </button>
            <button onClick={() => setShowLeaderboard(true)} className="nav-btn"
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.3)', borderRadius:12, padding:'8px 14px', color:'#92400E', fontWeight:800, fontSize:12, cursor:'pointer' }}>
              <Users size={14} />
            </button>
            <button onClick={() => setShowSupport(true)} className="support-btn"
              style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:12, padding:'9px 16px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', boxShadow:'0 4px 14px rgba(232,103,26,0.3)', transition:'all 0.2s ease' }}>
              <Heart size={13} fill="#fff" /> सपोर्ट
            </button>
            {!authLoading && (
              user ? (
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <button onClick={() => signOut()} className="nav-btn"
                    style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'8px 12px', color:'#666', fontWeight:800, fontSize:11, cursor:'pointer' }}>
                    <LogOut size={13} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuth(true)} className="nav-btn"
                  style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#3B82F6,#2563EB)', border:'none', borderRadius:12, padding:'9px 16px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', boxShadow:'0 4px 14px rgba(59,130,246,0.3)' }}>
                  <LogIn size={14} /> Login
                </button>
              )
            )}
          </div>
        </nav>

        {/* Hero */}
        <div style={{ marginBottom:28, animation:'fadeUp 0.5s ease' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:999, padding:'6px 16px', marginBottom:14 }}>
            <span style={{ fontSize:12, fontWeight:800, color:'#C2410C' }}>{greeting} 🙏</span>
          </div>
          <h1 style={{ fontSize:'clamp(1.8rem,5vw,3rem)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.1, margin:'0 0 18px', color:'#111' }}>
            यश मिळवायचे आहे,<br />
            <span style={{ background:'linear-gradient(90deg,#F97316,#EF4444)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              तर आजच सुरू करा.
            </span>
          </h1>
          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:10 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#F97316,#EF4444)', borderRadius:999, padding:'11px 22px', fontWeight:900, fontSize:14, color:'#fff', boxShadow:'0 6px 24px rgba(249,115,22,0.35)' }}>
              <Zap size={16} fill="currentColor" /> {count.toLocaleString()} प्रश्न उपलब्ध
            </div>
            {user && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:999, padding:'9px 18px', fontWeight:700, fontSize:12 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#10B981' }} />
                <span style={{ color:'#065F46' }}>{user.email?.split('@')[0]} · Sync ON</span>
              </div>
            )}
            {progress.streak > 0 && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.25)', borderRadius:999, padding:'9px 18px', fontWeight:800, fontSize:13 }}>
                <Flame size={15} style={{ color:'#EA580C' }} />
                <span style={{ color:'#EA580C' }}>{progress.streak} दिवस streak</span>
              </div>
            )}
          </div>
        </div>

        {/* NEW FEATURES — 4 cards */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }} />
            <span style={{ fontSize:10, fontWeight:800, color:'rgba(0,0,0,0.3)', textTransform:'uppercase', letterSpacing:'0.15em' }}>✨ नवीन Features</span>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
            {[
              { emoji:'🎯', title:'Smart Revision',    sub:'चुकलेले → auto-save',  color:'#7C3AED', bg:'rgba(124,58,237,0.07)', border:'rgba(124,58,237,0.2)', onClick:() => go('REVISION') },
              { emoji:'📊', title:'Exam Countdown',    sub:'परीक्षेचे किती दिवस',  color:'#2563EB', bg:'rgba(37,99,235,0.07)',  border:'rgba(37,99,235,0.2)',  onClick:() => setShowCountdown(true) },
              { emoji:'🏆', title:'Friend Challenge',  sub:'Link share → compete', color:'#DC2626', bg:'rgba(220,38,38,0.07)',  border:'rgba(220,38,38,0.2)',  onClick:() => go('CHALLENGE') },
              { emoji:'🎴', title:'Flashcard Mode',    sub:'Swipe → vocabulary',   color:'#059669', bg:'rgba(5,150,105,0.07)', border:'rgba(5,150,105,0.2)',  onClick:() => go('FLASHCARD') },
            ].map(({ emoji, title, sub, color, bg, border, onClick }) => (
              <div key={title} className="card-hover" onClick={onClick}
                style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:18, padding:'16px 14px', cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize:26, marginBottom:8 }}>{emoji}</div>
                <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B', marginBottom:3 }}>{title}</div>
                <div style={{ fontSize:10, fontWeight:700, color }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Support banner */}
        <div onClick={() => setShowSupport(true)}
          style={{ background:'linear-gradient(135deg,#FFF7ED,#FEF3C7)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:18, padding:'16px 20px', marginBottom:28, display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', transition:'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow='0 6px 24px rgba(232,103,26,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:28, animation:'sp-heart 2s ease infinite' }}>❤️</div>
            <div>
              <div style={{ fontWeight:900, fontSize:13, color:'#92400E' }}>MPSC सारथी सपोर्ट करा!</div>
              <div style={{ fontSize:11, color:'#B45309', fontWeight:600 }}>₹5 पासून · GPay / PhonePe / UPI</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#E8671A,#C4510E)', borderRadius:10, padding:'8px 14px', color:'#fff', fontWeight:900, fontSize:12 }}>
            सपोर्ट करा <ChevronRight size={13} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:36 }}>
          {[
            { label:'सोडवलेले', value:progress.totalAttempted.toLocaleString(), icon:Target,     color:'#3B82F6', pct:Math.min(progress.totalAttempted/500*100,100) },
            { label:'अचूकता',   value:accuracy+'%',                             icon:TrendingUp, color:'#10B981', pct:accuracy },
            { label:'बरोबर',    value:progress.totalCorrect.toLocaleString(),   icon:Award,      color:'#F97316', pct:accuracy },
          ].map(({ label, value, icon:Icon, color, pct }) => (
            <div key={label} className="card-hover"
              style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:22, padding:'20px 14px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, position:'relative', overflow:'hidden', cursor:'pointer', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}
              onClick={() => setShowProgress(true)}>
              <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at 50% 0%,${color}10 0%,transparent 60%)` }} />
              <div style={{ position:'relative', zIndex:1 }}>
                <Ring pct={pct} color={color} size={64} stroke={6} />
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', transform:'rotate(90deg)' }}>
                  <Icon size={16} style={{ color }} />
                </div>
              </div>
              <div style={{ textAlign:'center', position:'relative', zIndex:1 }}>
                <div style={{ fontWeight:900, fontSize:'clamp(0.95rem,3vw,1.3rem)', letterSpacing:'-0.03em', color:'#111' }}>{value}</div>
                <div style={{ fontSize:9, fontWeight:700, color:'rgba(0,0,0,0.35)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Section divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }} />
          <span style={{ fontSize:10, fontWeight:800, color:'rgba(0,0,0,0.3)', textTransform:'uppercase', letterSpacing:'0.15em' }}>अभ्यास विभाग निवडा</span>
          <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }} />
        </div>

        {/* Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,290px),1fr))', gap:14 }}>
          <div onClick={() => go(Mode.SPARDHA)} className="card-hover"
            style={{ gridColumn:'span 2', background:'linear-gradient(135deg,#1E0A3C 0%,#2D1260 100%)', border:'1px solid rgba(168,85,247,0.4)', borderRadius:26, padding:28, position:'relative', overflow:'hidden', minHeight:170, cursor:'pointer', boxShadow:'0 8px 32px rgba(168,85,247,0.2)' }}>
            <div style={{ position:'absolute', inset:0, opacity:0.3 }}>
              {[...Array(20)].map((_,i) => <div key={i} style={{ position:'absolute', width:i%3===0?3:2, height:i%3===0?3:2, borderRadius:'50%', background:'#fff', left:`${(i*17+5)%95}%`, top:`${(i*23+10)%85}%`, opacity:0.3+(i%5)*0.1 }} />)}
            </div>
            <div style={{ position:'absolute', right:28, top:'50%', transform:'translateY(-50%)', width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.5) 0%,transparent 70%)', filter:'blur(20px)' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(168,85,247,0.25)', border:'1px solid rgba(168,85,247,0.5)', borderRadius:999, padding:'5px 13px', marginBottom:14 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#A855F7', boxShadow:'0 0 8px #A855F7', animation:'pulse 2s infinite' }} />
                <span style={{ fontSize:10, fontWeight:800, color:'#E9D5FF', letterSpacing:'0.12em', textTransform:'uppercase' }}>SPEED BATTLE</span>
              </div>
              <h2 style={{ fontSize:'clamp(1.3rem,3.5vw,1.9rem)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:6, color:'#fff' }}>
                स्पर्धा योद्धा<br />
                <span style={{ color:'#D8B4FE', fontSize:'0.65em', fontWeight:700 }}>10 प्रश्न · 12 sec · Rank मिळवा</span>
              </h2>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:14 }}>
                <span style={{ fontSize:13, fontWeight:800, color:'#D8B4FE' }}>युद्ध सुरू करा ⚔️</span>
                <ChevronRight size={15} style={{ color:'#D8B4FE' }} />
              </div>
            </div>
          </div>

          <div onClick={() => go(Mode.MOCK_TEST)} className="card-hover"
            style={{ gridColumn:'span 2', background:'linear-gradient(135deg,#7F1D1D 0%,#450A0A 100%)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:26, padding:28, position:'relative', overflow:'hidden', minHeight:150, cursor:'pointer', boxShadow:'0 8px 32px rgba(239,68,68,0.2)' }}>
            <div style={{ position:'absolute', top:0, right:0, width:'50%', height:'100%', overflow:'hidden', opacity:0.08 }}>
              {[...Array(8)].map((_,i) => <div key={i} style={{ position:'absolute', top:'-20%', right:i*28-40, width:12, height:'160%', background:'#EF4444', transform:'rotate(15deg)' }} />)}
            </div>
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:999, padding:'5px 13px', marginBottom:12 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#EF4444', animation:'pulse 2s infinite' }} />
                <span style={{ fontSize:10, fontWeight:800, color:'#FCA5A5', textTransform:'uppercase' }}>LIVE TEST</span>
              </div>
              <h2 style={{ fontSize:'clamp(1.2rem,3vw,1.7rem)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:5, color:'#fff' }}>
                Full Mock Test<br /><span style={{ color:'#FCA5A5' }}>100 प्रश्न · 2 तास</span>
              </h2>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:14 }}>
                <span style={{ fontSize:13, fontWeight:800, color:'#FCA5A5' }}>चाचणी सुरू करा</span>
                <ChevronRight size={15} style={{ color:'#FCA5A5' }} />
              </div>
            </div>
          </div>

          {SECTIONS.map(({ mode:m, label, sub, icon:Icon, accent, tag }) => (
            <div key={String(m)} onClick={() => go(m)} className="card-hover"
              style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:22, padding:22, position:'relative', overflow:'hidden', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,transparent,${accent},transparent)`, opacity:0.7 }} />
              <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ background:`${accent}15`, border:`1px solid ${accent}25`, borderRadius:12, padding:9 }}>
                  <Icon size={20} style={{ color:accent }} />
                </div>
                <span style={{ fontSize:9, fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase', background:`${accent}15`, border:`1px solid ${accent}25`, borderRadius:999, padding:'3px 9px', color:accent }}>{tag}</span>
              </div>
              <h3 style={{ fontSize:'clamp(0.95rem,2.5vw,1.1rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.2, marginBottom:3, color:'#111' }}>{label}</h3>
              <p style={{ fontSize:11, color:'rgba(0,0,0,0.4)', fontWeight:600 }}>{sub}</p>
              <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:14, color:accent }}>
                <span style={{ fontSize:11, fontWeight:800 }}>सुरू करा</span>
                <ChevronRight size={13} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop:60, textAlign:'center' }}>
          <div style={{ display:'flex', justifyContent:'center', gap:3, marginBottom:8 }}>
            {[...Array(5)].map((_,i) => <Star key={i} size={12} fill="#F97316" style={{ color:'#F97316' }} />)}
          </div>
          <p style={{ fontSize:11, color:'rgba(0,0,0,0.3)', fontWeight:600 }}>Maharashtra's #1 Free MPSC Practice Portal · mpscsarathi.online</p>
          <button onClick={() => setShowSupport(true)}
            style={{ marginTop:12, display:'inline-flex', alignItems:'center', gap:6, background:'none', border:'1px solid rgba(232,103,26,0.3)', borderRadius:99, padding:'8px 18px', color:'#C2410C', fontWeight:700, fontSize:11, cursor:'pointer' }}>
            <Heart size={11} fill="#C2410C" /> सपोर्ट करा — ₹29 पासून
          </button>
        </div>
      </div>
    </div>
  );
}

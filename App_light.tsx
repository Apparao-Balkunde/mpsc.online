import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Mode, UserProgress } from './types';
import { QuestionView } from './components/QuestionView';
import { MockTestMode } from './components/MockTestMode';
import { VocabMode } from './components/VocabMode';
import { LiteratureMode } from './components/LiteratureMode';
import { SpardhaYodha } from './components/SpardhaYodha';
import { PYQMode } from './components/PYQMode';
import { ProgressDashboard } from './components/ProgressDashboard';
import { AIDoubtSolver } from './components/AIDoubtSolver';
import { AuthModal } from './components/AuthModal';
import { Leaderboard } from './components/Leaderboard';
import { useAuth, signOut } from './hooks/useAuth';
import { pushProgressToCloud, pullProgressFromCloud, startAutoSync } from './services/cloudSync';
import { LogIn, LogOut, Users } from 'lucide-react';
import { BookmarkMode } from './components/BookmarkMode';
import {
  History, BookOpen, Trophy, Newspaper, ShieldCheck,
  Zap, BookMarked, X, Target, Flame, Languages,
  GraduationCap, ChevronRight, Star, TrendingUp, Clock,
  Award, Swords, Bookmark, BarChart2, FileText
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
  body { background: #F5F0E8 !important; }
  .card-hover { transition: all 0.22s ease; }
  .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important; }
  .nav-btn:hover { background: rgba(0,0,0,0.06) !important; }
`;

export default function App() {
  const [mode, setMode]           = useState<Mode | 'PYQ' | 'BOOKMARKS'>(() => (localStorage.getItem('mpsc_mode') as any) || Mode.HOME);
  const [count, setCount]         = useState(0);
  const [progress, setProgress]   = useState<UserProgress>(loadProgress());
  const [time, setTime]           = useState(new Date());
  const [showProgress, setShowProgress]       = useState(false);
  const [showAuth, setShowAuth]               = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { user, loading: authLoading }        = useAuth();

  const isExam     = mode === Mode.MOCK_TEST;
  const isSpardha  = mode === Mode.SPARDHA;
  const isBookmark = mode === 'BOOKMARKS';
  const isPYQ      = mode === 'PYQ';

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
  const hour = time.getHours();
  const greeting = hour<12 ? 'शुभ सकाळ' : hour<17 ? 'शुभ दुपार' : 'शुभ संध्याकाळ';
  const go = (m: any) => setMode(m);
  const back = () => { setMode(Mode.HOME); setProgress(loadProgress()); };

  // Light theme for sub-pages wrapper
  const lightWrapper = {
    minHeight:'100vh',
    background:'#F5F0E8',
    fontFamily:"'Poppins','Noto Sans Devanagari',sans-serif",
    color:'#1a1a1a'
  };

  if (isSpardha)  return <SpardhaYodha onBack={back} />;
  if (isBookmark) return <BookmarkMode onBack={back} />;
  if (isPYQ)      return <PYQMode onBack={back} />;

  if (mode !== Mode.HOME) return (
    <div style={lightWrapper}>
      <style>{CSS}</style>
      {!isExam && (
        <div style={{ background:'rgba(255,255,255,0.85)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:12, padding:'14px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <button onClick={back} style={{ display:'flex', alignItems:'center', gap:6, color:'#F97316', fontWeight:800, fontSize:13, background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:10, padding:'7px 14px', cursor:'pointer' }}>
            <X size={15} /> डॅशबोर्ड
          </button>
          <span style={{ color:'rgba(0,0,0,0.2)', fontSize:16 }}>|</span>
          <span style={{ color:'#1a1a1a', fontWeight:900, fontSize:13 }}>
            {SECTIONS.find(s => s.mode === mode)?.label || mode}
          </span>
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

  // DASHBOARD — Light Cream Theme
  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Poppins','Noto Sans Devanagari',sans-serif", color:'#1a1a1a', position:'relative', overflowX:'hidden' }}>
      <style>{CSS}</style>
      {showProgress && <ProgressDashboard onClose={() => setShowProgress(false)} />}
      <AIDoubtSolver />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} currentUserId={user?.id} />}

      {/* Subtle decorative blobs */}
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
            {!authLoading && (
              user ? (
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  {user.user_metadata?.avatar_url && (
                    <img src={user.user_metadata.avatar_url} alt="" style={{ width:30, height:30, borderRadius:'50%', border:'2px solid rgba(249,115,22,0.4)' }} />
                  )}
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
        <div style={{ marginBottom:36, animation:'fadeUp 0.5s ease' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:999, padding:'6px 16px', marginBottom:14 }}>
            <span style={{ fontSize:12, fontWeight:800, color:'#C2410C', letterSpacing:'0.05em' }}>{greeting} 🙏</span>
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
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#10B981', boxShadow:'0 0 6px #10B981' }} />
                <span style={{ color:'#065F46' }}>{user.user_metadata?.full_name?.split(' ')[0] || 'Welcome'} · Cloud Sync ON</span>
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

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:36 }}>
          {[
            { label:'सोडवलेले', value:progress.totalAttempted.toLocaleString(), icon:Target,     color:'#3B82F6', pct:Math.min(progress.totalAttempted/500*100,100) },
            { label:'अचूकता',   value:accuracy+'%',                             icon:TrendingUp, color:'#10B981', pct:accuracy },
            { label:'बरोबर',    value:progress.totalCorrect.toLocaleString(),   icon:Award,      color:'#F97316', pct:accuracy },
          ].map(({ label, value, icon:Icon, color, pct }) => (
            <div key={label}
              className="card-hover"
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

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }} />
          <span style={{ fontSize:10, fontWeight:800, color:'rgba(0,0,0,0.3)', textTransform:'uppercase', letterSpacing:'0.15em' }}>अभ्यास विभाग निवडा</span>
          <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }} />
        </div>

        {/* Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,290px),1fr))', gap:14 }}>

          {/* FEATURED — SpardhaYodha */}
          <div onClick={() => go(Mode.SPARDHA)} className="card-hover"
            style={{ gridColumn:'span 2', background:'linear-gradient(135deg,#1E0A3C 0%,#2D1260 100%)', border:'1px solid rgba(168,85,247,0.4)', borderRadius:26, padding:28, position:'relative', overflow:'hidden', minHeight:170, cursor:'pointer', boxShadow:'0 8px 32px rgba(168,85,247,0.2)' }}>
            <div style={{ position:'absolute', inset:0, opacity:0.3 }}>
              {[...Array(20)].map((_,i) => (
                <div key={i} style={{ position:'absolute', width:i%3===0?3:2, height:i%3===0?3:2, borderRadius:'50%', background:'#fff', left:`${(i*17+5)%95}%`, top:`${(i*23+10)%85}%`, opacity:0.3+(i%5)*0.1 }} />
              ))}
            </div>
            <div style={{ position:'absolute', right:28, top:'50%', transform:'translateY(-50%)', width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.5) 0%,transparent 70%)', filter:'blur(20px)' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'inline-flex',

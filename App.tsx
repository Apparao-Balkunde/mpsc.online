import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Mode, UserProgress } from './types';

// Components
import { QuestionView } from './components/QuestionView';
import { QuizMode } from './components/QuizMode';
import { MockTestMode } from './components/MockTestMode';
import { VocabMode } from './components/VocabMode';
import { LiteratureMode } from './components/LiteratureMode';
import { SpardhaYodha } from './components/SpardhaYodha';
import { PYQMode } from './components/PYQMode';
import { AIDoubtSolver } from './components/AIDoubtSolver';
import { AuthModal } from './components/AuthModal';
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

// Hooks & libs
import { useAuth, signOut } from './hooks/useAuth';
import { pullProgressFromCloud, pushProgressToCloud, startAutoSync } from './lib/Cloudsync';

const PROGRESS_KEY = 'mpsc_user_progress';

// ================= UTIL =================
function loadProgress() {
  try {
    const r = localStorage.getItem(PROGRESS_KEY);
    if (r) return JSON.parse(r);
  } catch (e) {
    console.error("Progress load error:", e);
  }
  return { totalAttempted: 0, totalCorrect: 0, streak: 0, lastActiveDate: '' };
}

// ================= APP =================
export default function App() {
  const [mode, setMode] = useState(() =>
    localStorage.getItem('mpsc_mode') || Mode.HOME
  );

  const [progress, setProgress] = useState(loadProgress());

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const { user } = useAuth();

  const go = (m) => setMode(m);
  const back = () => setMode(Mode.HOME);

  // ================= EFFECTS =================
  useEffect(() => {
    localStorage.setItem('mpsc_mode', mode);
    window.scrollTo(0, 0);
    setProgress(loadProgress());
  }, [mode]);

  useEffect(() => {
    if (!user) return;

    const sync = async () => {
      await pullProgressFromCloud(user);
      setProgress(loadProgress());
      pushProgressToCloud(user);
    };

    sync();
    const stop = startAutoSync(user);
    return stop;
  }, [user]);

  // ================= ROUTING =================
  if (mode === Mode.SPARDHA) return <SpardhaYodha onBack={back} />;
  if (mode === 'BOOKMARKS') return <BookmarkMode onBack={back} />;
  if (mode === 'PYQ') return <PYQMode onBack={back} />;
  if (mode === 'FLASHCARD') return <FlashcardMode onBack={back} />;
  if (mode === 'REVISION') return <SmartRevision onBack={back} />;
  if (mode === 'CHALLENGE') return <FriendChallenge onBack={back} />;
  if (mode === 'DAILY') return <DailyChallenge onBack={back} />;
  if (mode === 'PLANNER') return <StudyPlanner onBack={back} />;
  if (mode === 'AI_QUIZ') return <AIQuestionGenerator onBack={back} />;
  if (mode === 'QUIZ') return <QuizMode onBack={back} />;

  if (mode === Mode.PRELIMS)
    return (
      <QuestionView
        type={Mode.PRELIMS}
        tableName="prelims_questions"
        onBack={back}
        onProgressUpdate={() => setProgress(loadProgress())}
      />
    );

  if (mode === Mode.MAINS)
    return (
      <QuestionView
        type={Mode.MAINS}
        tableName="mains_questions"
        onBack={back}
        onProgressUpdate={() => setProgress(loadProgress())}
      />
    );

  if (mode === Mode.MOCK_TEST)
    return <MockTestMode onBack={back} />;

  if (mode === Mode.CURRENT_AFFAIRS)
    return (
      <QuestionView
        type={Mode.CURRENT_AFFAIRS}
        tableName="current_affairs"
        onBack={back}
        onProgressUpdate={() => setProgress(loadProgress())}
      />
    );

  if (mode === Mode.VOCAB)
    return <VocabMode onBack={back} />;

  if (mode === Mode.LITERATURE)
    return <LiteratureMode onBack={back} />;

  // ================= HOME =================
  return (
    <div className="min-h-screen bg-[#F5F0E8] font-sans pb-20">

      {/* Modals */}
      {showAnalytics && <PerformanceAnalytics onClose={() => setShowAnalytics(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      {showCountdown && <ExamCountdown onClose={() => setShowCountdown(false)} />}
      {showMore && (
        <MoreMenu
          onClose={() => setShowMore(false)}
          onNav={go}
          onLogout={() => signOut()}
          user={user}
        />
      )}

      <PWAPrompt />
      <AIDoubtSolver />

      {/* Header */}
      <header className="p-4 bg-white border-b flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-black text-orange-600">MPSC सारथी</h1>
        <button onClick={() => setShowMore(true)} className="p-2 bg-gray-100 rounded-lg">
          Menu
        </button>
      </header>

      {/* Main */}
      <main className="max-w-lg mx-auto p-4 space-y-4">

        {/* Welcome */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl text-white shadow-lg">
          <h2 className="text-xl font-bold">नमस्कार 👋</h2>
          <p className="text-sm mt-2">
            आज तुम्ही {progress.totalAttempted} प्रश्न सोडवले आहेत.
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => go('QUIZ')} className="btn">📝 Quiz</button>
          <button onClick={() => go('DAILY')} className="btn">📅 Daily</button>
          <button onClick={() => go(Mode.PRELIMS)} className="btn">📚 Prelims</button>
          <button onClick={() => go('FLASHCARD')} className="btn">🎴 Flashcards</button>
        </div>

      </main>

      {/* Bottom Nav */}
      <BottomNav
        active="HOME"
        onNav={(tab) => {
          if (tab === 'MORE') setShowMore(true);
          else if (tab === 'PROGRESS') setShowAnalytics(true);
          else handleBottomTab(tab, go);
        }}
      />
    </div>
  );
}

// ================= HELPER =================
function handleBottomTab(tab, go) {
  if (tab === 'HOME') go(Mode.HOME);
  if (tab === 'DAILY') go('DAILY');
  if (tab === 'FLASHCARD') go('FLASHCARD');
}

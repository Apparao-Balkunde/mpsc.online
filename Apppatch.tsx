// ══════════════════════════════════════════════════════════════
//   App.tsx PATCH — OMR Exam Simulator Integration
//   Apply these 4 changes to your App.tsx file
// ══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// CHANGE 1: types.ts — OMR_EXAM mode add करा
// ─────────────────────────────────────────────
// File: types.ts
// FIND:
//   AI_QUIZ = 'AI_QUIZ'
// REPLACE WITH:
//   AI_QUIZ = 'AI_QUIZ',
//   OMR_EXAM = 'OMR_EXAM',

// ─────────────────────────────────────────────
// CHANGE 2: App.tsx imports — top of file
// ─────────────────────────────────────────────
// File: App.tsx
// Existing import ओळीनंतर add करा (line ~77 च्या जवळ):
import { OMRExamSimulator } from './components/OMRExamSimulator';

// ─────────────────────────────────────────────
// CHANGE 3: App.tsx routing — mode switch
// ─────────────────────────────────────────────
// File: App.tsx  ~line 330
// FIND:
//   {mode === Mode.MOCK_TEST       && <MockTestMode onBack={back} />}
// ADD AFTER IT:
{mode === 'OMR_EXAM'              && <OMRExamSimulator onBack={back} />}

// ─────────────────────────────────────────────
// CHANGE 4: App.tsx — OMR Card (Home Screen)
// ─────────────────────────────────────────────
// File: App.tsx  ~line 687
// FIND the existing Full Mock Test card:
//   <div onClick={()=>go(Mode.MOCK_TEST)} className="card-hover"
// REPLACE ENTIRE CARD WITH THIS (two cards side by side):

{/* ── EXAM CARDS ── */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

  {/* Full Mock Test */}
  <div onClick={() => go(Mode.MOCK_TEST)} className="card-hover"
    style={{ background: 'linear-gradient(135deg,#7F1D1D,#450A0A)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 22, padding: '18px 16px', cursor: 'pointer', boxShadow: '0 6px 28px rgba(239,68,68,0.2)' }}>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 999, padding: '3px 10px', marginBottom: 10 }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF4444', animation: 'pulse 2s infinite' }} />
      <span style={{ fontSize: 9, fontWeight: 800, color: '#FCA5A5', textTransform: 'uppercase' }}>LIVE TEST</span>
    </div>
    <div style={{ fontSize: 'clamp(1rem,3.5vw,1.25rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>Full Mock Test 📝</div>
    <div style={{ fontSize: 10, color: '#FCA5A5', fontWeight: 700 }}>100 प्र · 2 तास</div>
  </div>

  {/* OMR Simulator — NEW */}
  <div onClick={() => go('OMR_EXAM' as any)} className="card-hover"
    style={{ background: 'linear-gradient(135deg,#0C2340,#0D4A6E)', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 22, padding: '18px 16px', cursor: 'pointer', boxShadow: '0 6px 28px rgba(13,74,110,0.3)', position: 'relative', overflow: 'hidden' }}>
    {/* Shimmer */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#3B82F6,#F5C842,#3B82F6)', backgroundSize: '200%', animation: 'mt-shimmer 2.5s infinite' }} />
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.4)', borderRadius: 999, padding: '3px 10px', marginBottom: 10 }}>
      <span style={{ fontSize: 9, fontWeight: 900, color: '#F5C842', textTransform: 'uppercase', letterSpacing: '0.05em' }}>✦ NEW</span>
    </div>
    <div style={{ fontSize: 'clamp(1rem,3.5vw,1.25rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>OMR Simulator 📋</div>
    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Real Bubble Sheet · Negative Marking</div>
  </div>

</div>

import React from 'react';
import { BookOpen, User } from 'lucide-react';
import { getProgress } from '../services/storageService';

export function Header() {
  const progress = getProgress();

  return (
    <header style={{
      background: 'linear-gradient(135deg,#1C2B2B,#0D6B6E)',
      borderBottom: '2px solid rgba(245,200,66,0.3)',
      position: 'sticky', top: 0, zIndex: 50,
      boxShadow: '0 4px 20px rgba(13,107,110,0.3)',
      fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif",
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'linear-gradient(135deg,#E8671A,#F5C842)', borderRadius: 12, padding: '8px 10px', boxShadow: '0 4px 14px rgba(232,103,26,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={20} color="#fff" />
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.04em', color: '#fff' }}>MPSC</span>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.04em', color: '#F5C842' }}> सारथी</span>
          </div>
        </div>

        {/* Score + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 99, padding: '6px 14px' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>गुण:</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#F5C842' }}>
              {progress.correctAnswers ?? 0} / {progress.totalQuestionsAttempted ?? 0}
            </span>
          </div>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(245,200,66,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="#F5C842" />
          </div>
        </div>

      </div>
    </header>
  );
}

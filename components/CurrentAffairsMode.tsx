import React, { useState, useEffect } from 'react';
import { CurrentAffairItem, LoadingState } from '../types';
import currentAffairsData from '../data/current_affairs.json';
import { Newspaper, Loader2, ArrowLeft, RefreshCw, Calendar, Tag, Database, Search } from 'lucide-react';

interface CurrentAffairsModeProps {
  onBack: () => void;
}

const CATEGORIES = ["Maharashtra Special", "National News", "International Relations", "Sports", "Economy & Budget"];

const CAT_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  "Maharashtra Special":    { label: 'महाराष्ट्र विशेष',   emoji: '🦁', color: '#E8671A', bg: 'rgba(232,103,26,0.1)'  },
  "National News":          { label: 'राष्ट्रीय घडामोडी', emoji: '🇮🇳', color: '#0D6B6E', bg: 'rgba(13,107,110,0.1)'   },
  "International Relations":{ label: 'आंतरराष्ट्रीय',      emoji: '🌏', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)'  },
  "Sports":                 { label: 'क्रीडा',              emoji: '🏆', color: '#D97706', bg: 'rgba(217,119,6,0.1)'   },
  "Economy & Budget":       { label: 'अर्थव्यवस्था',        emoji: '💰', color: '#059669', bg: 'rgba(5,150,105,0.1)'   },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes ca-fade  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ca-spin  { to{transform:rotate(360deg)} }
  @keyframes ca-pulse { 0%,100%{opacity:1}50%{opacity:0.6} }
  .ca-card { transition: all 0.2s ease; }
  .ca-card:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(28,43,43,0.1) !important; }
  .ca-cat-btn { transition: all 0.18s ease; }
  .ca-cat-btn:hover { transform: translateX(3px); }
  .ca-search input:focus { border-color: #E8671A !important; box-shadow: 0 0 0 3px rgba(232,103,26,0.12) !important; }
`;

export const CurrentAffairsMode: React.FC<CurrentAffairsModeProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<string>("Maharashtra Special");
  const [news, setNews]       = useState<CurrentAffairItem[]>([]);
  const [status, setStatus]   = useState<LoadingState>('idle');
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { loadStaticNews(); }, [activeCategory]);

  const loadStaticNews = () => {
    setStatus('loading');
    setTimeout(() => {
      try {
        const data = (currentAffairsData as any)[activeCategory] || [];
        setNews(data);
        setStatus('success');
      } catch (error) {
        console.error("Data loading error:", error);
        setStatus('error');
      }
    }, 400);
  };

  const filteredNews = news.filter(item =>
    item.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cfg = CAT_CONFIG[activeCategory];

  const base: React.CSSProperties = {
    minHeight: '100vh',
    background: '#FDF6EC',
    fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif",
    color: '#1C2B2B',
    padding: '0 0 80px',
  };

  return (
    <div style={base}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1C2B2B,#0D6B6E)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 4px 20px rgba(13,107,110,0.3)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 14px', color: '#FDF6EC', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
            <ArrowLeft size={14} /> मागे
          </button>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#F5C842', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Newspaper size={17} /> चालू घडामोडी
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, marginTop: 1 }}>
              MPSC 2026 · अधिकृत संग्रह
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="ca-search" style={{ position: 'relative', width: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="बातम्या शोधा..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '9px 12px 9px 34px', color: '#fff', fontSize: 12, fontWeight: 600, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(28,43,43,0.08)', border: '1px solid rgba(28,43,43,0.08)' }}>
            <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,#1C2B2B,#0D6B6E)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={15} style={{ color: '#F5C842' }} />
              <span style={{ fontWeight: 900, fontSize: 13, color: '#F5C842', letterSpacing: '-0.01em' }}>विषय सूची</span>
            </div>
            <div style={{ padding: '8px' }}>
              {CATEGORIES.map(cat => {
                const c = CAT_CONFIG[cat];
                const active = activeCategory === cat;
                return (
                  <button key={cat} className="ca-cat-btn"
                    onClick={() => { setActiveCategory(cat); setSearchTerm(""); }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 12, fontSize: 12, fontWeight: 800, cursor: 'pointer', border: `1.5px solid ${active ? c.color : 'transparent'}`, background: active ? c.bg : 'transparent', color: active ? c.color : '#4A6060', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, transition: 'all 0.18s' }}>
                    <span style={{ fontSize: 16 }}>{c.emoji}</span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 280 }}>

          {/* Category header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: cfg.bg, border: `1.5px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {cfg.emoji}
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: '#1C2B2B', letterSpacing: '-0.03em', lineHeight: 1 }}>{cfg.label}</div>
                <div style={{ fontSize: 11, color: '#7A9090', fontWeight: 700, marginTop: 3 }}>
                  {status === 'success' ? `${filteredNews.length} बातम्या` : '...'}
                </div>
              </div>
            </div>
            <button onClick={loadStaticNews}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `1.5px solid rgba(28,43,43,0.1)`, borderRadius: 12, padding: '8px 14px', color: '#4A6060', fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(28,43,43,0.06)' }}>
              <RefreshCw size={14} style={{ animation: status === 'loading' ? 'ca-spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>

          {/* Loading */}
          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 20, border: '1px solid rgba(28,43,43,0.08)' }}>
              <div style={{ width: 48, height: 48, border: `4px solid ${cfg.bg}`, borderTopColor: cfg.color, borderRadius: '50%', animation: 'ca-spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <div style={{ fontWeight: 800, fontSize: 14, color: '#1C2B2B', marginBottom: 4 }}>संग्रहातून माहिती शोधत आहे...</div>
              <div style={{ fontSize: 12, color: '#7A9090', fontWeight: 600 }}>{cfg.label}</div>
            </div>
          )}

          {/* News Cards */}
          {status === 'success' && filteredNews.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredNews.map((item, idx) => (
                <div key={idx} className="ca-card"
                  style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(28,43,43,0.08)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(28,43,43,0.06)', animation: `ca-fade 0.2s ease ${idx * 0.04}s both` }}>

                  {/* Top accent */}
                  <div style={{ height: 3, background: `linear-gradient(90deg,${cfg.color},${cfg.color}80)` }} />

                  <div style={{ padding: '20px 22px' }}>
                    {/* Headline row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                      <h3 style={{ fontWeight: 900, fontSize: 15, color: '#1C2B2B', lineHeight: 1.4, letterSpacing: '-0.02em', flex: 1 }}>
                        {item.headline}
                      </h3>
                      {item.date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: '#7A9090', background: '#FDF6EC', border: '1px solid rgba(28,43,43,0.08)', borderRadius: 8, padding: '4px 10px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                          <Calendar size={11} /> {item.date}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: 13, color: '#4A6060', lineHeight: 1.7, fontWeight: 500, marginBottom: 14 }}>
                      {item.description}
                    </p>

                    {/* Exam relevance */}
                    {item.examRelevance && (
                      <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}25`, borderRadius: 14, padding: '12px 16px' }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Tag size={10} /> परीक्षेसाठी महत्त्व
                        </div>
                        <p style={{ fontSize: 12, color: '#1C2B2B', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                          {item.examRelevance}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {status === 'success' && filteredNews.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 20, border: '1px dashed rgba(28,43,43,0.12)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#1C2B2B', marginBottom: 8 }}>माहिती सापडली नाही</div>
              <div style={{ fontSize: 12, color: '#7A9090', fontWeight: 600 }}>वेगळी category निवडा किंवा search बदला</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

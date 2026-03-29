import React, { useState, useEffect } from 'react';
import { X, Trophy, RefreshCcw, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeaderEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_attempted: number;
  total_correct: number;
  streak: number;
  rank?: number;
  accuracy?: number;
}

type SortBy = 'accuracy' | 'attempted' | 'streak';

const CSS = `
  @keyframes lb-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lb-pop  { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
  @keyframes lb-spin { to{transform:rotate(360deg)} }
  @keyframes lb-shine { 0%{background-position:-200% center} 100%{background-position:200% center} }
  .lb-tab:hover  { background:rgba(249,115,22,0.12)!important; color:rgba(255,255,255,0.8)!important; }
  .lb-row:hover  { background:rgba(255,255,255,0.06)!important; }
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
`;

function Avatar({ url, name, size = 36 }: { url: string | null; name: string; size?: number }) {
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  if (url) {
    return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />;
  }
  const colors = ['#F97316', '#8B5CF6', '#3B82F6', '#10B981', '#EC4899', '#F59E0B'];
  const color = colors[name?.charCodeAt(0) % colors.length] || '#F97316';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: size * 0.35, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

interface Props { onClose: () => void; currentUserId?: string; }

export const Leaderboard: React.FC<Props> = ({ onClose, currentUserId }) => {
  const [data, setData]     = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy]   = useState<SortBy>('accuracy');
  const [error, setError]     = useState('');
  const [myRank, setMyRank]   = useState<number | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true); setError('');
    try {
      const { data: rows, error: err } = await supabase
        .from('user_progress')
        .select('user_id, display_name, avatar_url, total_attempted, total_correct, streak')
        .gte('total_attempted', 5) // ५ पेक्षा जास्त प्रश्न सोडवलेले विद्यार्थीच दिसतील
        .limit(50);

      if (err) throw err;

      const processed = (rows || []).map(r => ({
        ...r,
        accuracy: r.total_attempted > 0 ? (r.total_correct / r.total_attempted) : 0
      }));

      const sorted = processed.sort((a, b) => {
        if (sortBy === 'accuracy') return b.accuracy! - a.accuracy!;
        if (sortBy === 'attempted') return b.total_attempted - a.total_attempted;
        return b.streak - a.streak;
      }).map((r, i) => ({ ...r, rank: i + 1 }));

      setData(sorted);

      if (currentUserId) {
        const myIdx = sorted.findIndex(r => r.user_id === currentUserId);
        setMyRank(myIdx >= 0 ? myIdx + 1 : null);
      }
    } catch (e) {
      setError('डेटा लोड झाला नाही. पुन्हा प्रयत्न करा.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaderboard(); }, [sortBy]);

  // Safe slicing for UI
  const top3 = data.slice(0, 3);
  const rest  = data.slice(3);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'Poppins', sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'lb-fade 0.4s ease-out', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>

        {/* Header Section */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#F97316,#FBBF24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Leaderboard</h2>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>टॉप ५० विद्यार्थी (किमान ५ प्रश्न)</p>
          </div>
          <button onClick={fetchLeaderboard} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#94A3B8' }}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} style={{ animation: loading ? 'lb-spin 1s linear infinite' : 'none' }} />
          </button>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#94A3B8' }}>
            <X size={18} />
          </button>
        </div>

        {/* Sorting Tabs */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 20px', background: 'rgba(0,0,0,0.2)' }}>
          {([['accuracy', '🎯 Accuracy'], ['attempted', '📚 Solved'], ['streak', '🔥 Streak']] as [SortBy, string][]).map(([s, l]) => (
            <button key={s} onClick={() => setSortBy(s)}
              style={{ flex: 1, padding: '8px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', transition: '0.2s', background: sortBy === s ? '#F97316' : 'rgba(255,255,255,0.05)', color: sortBy === s ? '#fff' : 'rgba(255,255,255,0.4)' }}>
              {l}
            </button>
          ))}
        </div>

        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          
          {/* User's Current Rank */}
          {myRank && myRank > 3 && (
            <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 16, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, animation: 'lb-pop 0.5s ease' }}>
              <Crown size={18} color="#F97316" />
              <span style={{ fontWeight: 700, fontSize: 13, color: '#F97316' }}>तुमचा सध्याचा रँक #{myRank} आहे</span>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: 60, borderRadius: 16, background: 'rgba(255,255,255,0.03)', animation: 'pulse 2s infinite' }} />
              ))}
            </div>
          ) : (
            <>
              {/* Top 3 Podium Logic */}
              {top3.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 30, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* 2nd Place */}
                  {top3[1] && (
                    <div style={{ textAlign: 'center', flex: 1, animation: 'lb-pop 0.5s ease 0.1s both' }}>
                      <Avatar url={top3[1].avatar_url} name={top3[1].display_name} size={42} />
                      <div style={{ fontSize: 10, fontWeight: 700, marginTop: 8 }}>{top3[1].display_name.split(' ')[0]}</div>
                      <div style={{ background: '#475569', height: 40, borderRadius: '8px 8px 0 0', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🥈</div>
                    </div>
                  )}
                  {/* 1st Place */}
                  {top3[0] && (
                    <div style={{ textAlign: 'center', flex: 1.2, animation: 'lb-pop 0.5s ease both' }}>
                      <Crown size={20} color="#FBBF24" style={{ marginBottom: 4 }} />
                      <Avatar url={top3[0].avatar_url} name={top3[0].display_name} size={54} />
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#FBBF24', marginTop: 8 }}>{top3[0].display_name.split(' ')[0]}</div>
                      <div style={{ background: 'linear-gradient(to top, #F97316, #FBBF24)', height: 60, borderRadius: '10px 10px 0 0', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 -10px 20px rgba(249,115,22,0.2)' }}>🥇</div>
                    </div>
                  )}
                  {/* 3rd Place */}
                  {top3[2] && (
                    <div style={{ textAlign: 'center', flex: 1, animation: 'lb-pop 0.5s ease 0.2s both' }}>
                      <Avatar url={top3[2].avatar_url} name={top3[2].display_name} size={38} />
                      <div style={{ fontSize: 10, fontWeight: 700, marginTop: 8 }}>{top3[2].display_name.split(' ')[0]}</div>
                      <div style={{ background: '#92400E', height: 30, borderRadius: '8px 8px 0 0', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🥉</div>
                    </div>
                  )}
                </div>
              )}

              {/* List Items */}
              {rest.map((entry, i) => {
                const accPercent = Math.round((entry.accuracy || 0) * 100);
                const isMe = entry.user_id === currentUserId;
                return (
                  <div key={entry.user_id} className="lb-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 16, marginBottom: 8, background: isMe ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)', border: isMe ? '1px solid #F97316' : '1px solid transparent', animation: `lb-fade 0.3s ease ${i * 0.05}s both` }}>
                    <div style={{ width: 24, fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.2)' }}>{entry.rank}</div>
                    <Avatar url={entry.avatar_url} name={entry.display_name} size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{entry.display_name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{entry.total_attempted} प्रश्न • {entry.streak}🔥 streak</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: accPercent > 80 ? '#10B981' : '#F97316' }}>{accPercent}%</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>Accuracy</div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
                      

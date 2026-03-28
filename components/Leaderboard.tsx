import React, { useState, useEffect } from 'react';
import { X, Trophy, Flame, TrendingUp, RefreshCcw, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeaderEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_attempted: number;
  total_correct: number;
  streak: number;
  rank?: number;
}

type SortBy = 'accuracy' | 'attempted' | 'streak';

const CSS = `
  @keyframes lb-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lb-pop  { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
  @keyframes lb-spin { to{transform:rotate(360deg)} }
  @keyframes lb-shine { 0%{background-position:-200% center} 100%{background-position:200% center} }
  .lb-tab:hover  { background:rgba(249,115,22,0.12)!important; color:rgba(255,255,255,0.8)!important; }
  .lb-row:hover  { background:rgba(255,255,255,0.06)!important; }
`;

const RANK_MEDAL = ['🥇', '🥈', '🥉'];

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
        .gte('total_attempted', 10) // min 10 questions
        .order('total_correct', { ascending: false })
        .limit(100);

      if (err) throw err;

      const sorted = (rows || [])
        .map(r => ({ ...r, accuracy: r.total_attempted > 0 ? r.total_correct / r.total_attempted : 0 }))
        .sort((a, b) => {
          if (sortBy === 'accuracy')  return b.accuracy - a.accuracy;
          if (sortBy === 'attempted') return b.total_attempted - a.total_attempted;
          return b.streak - a.streak;
        })
        .map((r, i) => ({ ...r, rank: i + 1 }));

      setData(sorted);

      if (currentUserId) {
        const myIdx = sorted.findIndex(r => r.user_id === currentUserId);
        setMyRank(myIdx >= 0 ? myIdx + 1 : null);
      }
    } catch (e) {
      setError('Leaderboard load झाले नाही. पुन्हा प्रयत्न करा.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaderboard(); }, [sortBy]);

  const top3 = data.slice(0, 3);
  const rest  = data.slice(3);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'Poppins','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div style={{ background: '#0F1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'lb-fade 0.4s cubic-bezier(.34,1.56,.64,1)', color: '#fff' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#F97316,#FBBF24)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trophy size={18} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.03em' }}>Leaderboard</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginTop: 1 }}>
              {data.length} students · minimum 10 questions
            </div>
          </div>
          <button onClick={fetchLeaderboard} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', display: 'flex' }}>
            <RefreshCcw size={14} style={{ animation: loading ? 'lb-spin 0.8s linear infinite' : 'none' }} />
          </button>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', display: 'flex' }}>
            <X size={15} />
          </button>
        </div>

        {/* Sort tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {([['accuracy', '🎯 अचूकता'], ['attempted', '📚 प्रश्न'], ['streak', '🔥 Streak']] as [SortBy, string][]).map(([s, l]) => (
            <button key={s} className="lb-tab" onClick={() => setSortBy(s)}
              style={{ flex: 1, padding: '7px 6px', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: 'none', background: sortBy === s ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.04)', color: sortBy === s ? '#F97316' : 'rgba(255,255,255,0.35)', borderBottom: sortBy === s ? '2px solid #F97316' : '2px solid transparent', transition: 'all 0.15s' }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 20px' }}>

          {/* My rank banner */}
          {myRank && myRank > 3 && (
            <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 14, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Crown size={16} style={{ color: '#F97316', flexShrink: 0 }} />
              <span style={{ fontWeight: 800, fontSize: 12, color: '#F97316' }}>तुमचा Rank #{myRank}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>— Top {Math.ceil(myRank / data.length * 100)}% मध्ये</span>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ height: 56, borderRadius: 14, background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.04) 100%)', backgroundSize: '200%', animation: `lb-shine 1.6s ease ${i * 0.1}s infinite` }} />
              ))}
            </div>
          )}

          {error && !loading && (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 700 }}>{error}</div>
          )}

          {!loading && !error && data.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>Leaderboard रिकामे आहे!</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Login करा आणि पहिले व्हा.</div>
            </div>
          )}

          {/* Top 3 podium */}
          {!loading && top3.length >= 3 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginBottom: 20, padding: '0 10px' }}>
              {/* 2nd */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, animation: 'lb-pop 0.4s ease 0.1s both' }}>
                <Avatar url={top3[1].avatar_url} name={top3[1].display_name} size={44} />
                <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', marginTop: 6, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{top3[1].display_name?.split(' ')[0]}</div>
                <div style={{ background: 'linear-gradient(135deg,#64748B,#94A3B8)', borderRadius: '10px 10px 0 0', width: '100%', padding: '10px 6px 6px', marginTop: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 20 }}>🥈</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', marginTop: 2 }}>{Math.round((top3[1].total_correct / top3[1].total_attempted) * 100)}%</div>
                </div>
              </div>
              {/* 1st */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1.2, animation: 'lb-pop 0.4s ease 0s both' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar url={top3[0].avatar_url} name={top3[0].display_name} size={56} />
                  <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontSize: 18 }}>👑</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#FFD700', marginTop: 8, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{top3[0].display_name?.split(' ')[0]}</div>
                <div style={{ background: 'linear-gradient(135deg,#F97316,#FBBF24)', borderRadius: '10px 10px 0 0', width: '100%', padding: '12px 6px 8px', marginTop: 6, textAlign: 'center', boxShadow: '0 -4px 20px rgba(249,115,22,0.3)' }}>
                  <div style={{ fontSize: 22 }}>🥇</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginTop: 2 }}>{Math.round((top3[0].total_correct / top3[0].total_attempted) * 100)}%</div>
                </div>
              </div>
              {/* 3rd */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, animation: 'lb-pop 0.4s ease 0.2s both' }}>
                <Avatar url={top3[2].avatar_url} name={top3[2].display_name} size={40} />
                <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', marginTop: 6, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{top3[2].display_name?.split(' ')[0]}</div>
                <div style={{ background: 'linear-gradient(135deg,#92400E,#B45309)', borderRadius: '10px 10px 0 0', width: '100%', padding: '8px 6px 6px', marginTop: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 18 }}>🥉</div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', marginTop: 2 }}>{Math.round((top3[2].total_correct / top3[2].total_attempted) * 100)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Rest of list */}
          {!loading && rest.map((entry, i) => {
            const acc = entry.total_attempted > 0 ? Math.round((entry.total_correct / entry.total_attempted) * 100) : 0;
            const isMe = entry.user_id === currentUserId;
            return (
              <div key={entry.user_id} className="lb-row"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, marginBottom: 6, background: isMe ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.02)', border: isMe ? '1px solid rgba(249,115,22,0.25)' : '1px solid transparent', transition: 'all 0.15s', animation: `lb-fade 0.2s ease ${i * 0.04}s both` }}>
                <div style={{ width: 28, textAlign: 'center', fontWeight: 900, fontSize: 13, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                  {entry.rank}
                </div>
                <Avatar url={entry.avatar_url} name={entry.display_name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: isMe ? '#F97316' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {entry.display_name?.split(' ')[0]}
                    {isMe && <span style={{ fontSize: 9, background: 'rgba(249,115,22,0.2)', borderRadius: 99, padding: '1px 7px', color: '#F97316' }}>तुम्ही</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginTop: 1 }}>
                    {entry.total_attempted} प्रश्न · {entry.streak}🔥 streak
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 15, color: acc >= 70 ? '#10B981' : acc >= 50 ? '#F59E0B' : '#EF4444' }}>{acc}%</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>{entry.total_correct} बरोबर</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

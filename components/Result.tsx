import React, { useState, useEffect } from 'react';
import { Trophy, Target, Award, Share2, RefreshCcw, Users } from 'lucide-react';
import { getLiveRank } from '../lib/supabase'; // मगाशी अपडेट केलेले फंक्शन

interface ResultProps {
  score: number;          // बरोबर आलेले प्रश्न
  totalQuestions: number; // एकूण प्रश्न
  onRestart: () => void;  // पुन्हा टेस्ट सुरू करण्यासाठी
}

export const Result: React.FC<ResultProps> = ({ score, totalQuestions, onRestart }) => {
  const [rankData, setRankData] = useState<{ rank: number | string; total: number | string }>({ rank: '-', total: '-' });
  const [loading, setLoading] = useState(true);

  // टक्केवारी काढणे
  const percentage = Math.round((score / totalQuestions) * 100);

  useEffect(() => {
    const fetchRank = async () => {
      setLoading(true);
      // समजा युजरचे 'total_correct' आपण डेटाबेसमध्ये सेव्ह केले आहेत, 
      // तर इथे आपण त्याचे 'Live Rank' मोजतोय.
      const data = await getLiveRank(score);
      setRankData(data);
      setLoading(false);
    };
    fetchRank();
  }, [score]);

  const handleShare = () => {
    const text = `🎯 मी MPSC Sarathi वर ${score}/${totalQuestions} गुण मिळवले! माझा रँक #${rankData.rank} आहे. तुम्ही पण ट्राय करा! 🚀`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Poppins, sans-serif', color: '#fff' }}>
      
      {/* १. मुख्य ट्रॉफी आणि स्कोअर */}
      <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, #1E293B, #0F172A)', borderRadius: '24px', padding: '30px 20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'inline-flex', padding: '15px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '50%', marginBottom: '15px' }}>
          <Trophy size={48} color="#F97316" />
        </div>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 800 }}>अभिनंदन! 🎉</h2>
        <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '20px' }}>तुम्ही टेस्ट यशस्वीरित्या पूर्ण केली आहे.</div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#F97316' }}>{score}/{totalQuestions}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>Score</div>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#10B981' }}>{percentage}%</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>Accuracy</div>
          </div>
        </div>
      </div>

      {/* २. लाईव्ह रँक आणि इतर युजर्सशी तुलना */}
      <div style={{ marginTop: '20px', background: 'rgba(249, 115, 22, 0.05)', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
          <Users size={20} color="#F97316" />
          <span style={{ fontSize: '14px', fontWeight: 700 }}>इतर स्पर्धकांशी तुलना (Live)</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>तुमचा रँक</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>
              {loading ? '...' : `#${rankData.rank}`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>एकूण विद्यार्थी</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>
              {loading ? '...' : rankData.total}
            </div>
          </div>
        </div>

        {/* Comparison Message */}
        {!loading && (
          <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '12px', color: '#CBD5E1', borderLeft: '3px solid #F97316' }}>
            {rankData.rank === 1 
              ? "🥇 तुम्ही सध्या १ नंबरवर आहात! ही कामगिरी टिकवून ठेवा." 
              : `तुमच्या रँकनुसार तुम्ही टॉप ${Math.round((Number(rankData.rank) / Number(rankData.total)) * 100)}% विद्यार्थ्यांमध्ये आहात.`}
          </div>
        )}
      </div>

      {/* ३. ॲक्शन बटन्स */}
      <div style={{ marginTop: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button 
          onClick={handleShare}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '14px', border: 'none', background: '#25D366', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
          <Share2 size={18} /> WhatsApp
        </button>
        <button 
          onClick={onRestart}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '14px', border: 'none', background: '#F97316', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
          <RefreshCcw size={18} /> पुन्हा प्रयत्न
        </button>
      </div>

    </div>
  );
};


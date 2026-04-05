import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { MessageCircle, ThumbsUp, Send, X, ChevronDown, ChevronUp, Loader } from 'lucide-react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  .dc-card { transition: all 0.18s ease; }
  .dc-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(28,43,43,0.12) !important; }
  .dc-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .dc-input:focus { border-color:#E8671A !important; box-shadow:0 0 0 3px rgba(232,103,26,0.12) !important; outline:none; }
  @keyframes dc-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .dc-item { animation: dc-fade 0.3s ease; }
`;

interface Question {
  id: string;
  user_email: string;
  question: string;
  subject: string;
  created_at: string;
  upvotes: number;
  answer_count?: number;
}

interface Answer {
  id: string;
  question_id: string;
  user_email: string;
  answer: string;
  created_at: string;
  upvotes: number;
}

const SUBJECTS = ['सर्व','राज्यशास्त्र','इतिहास','भूगोल','अर्थशास्त्र','विज्ञान','चालू घडामोडी','मराठी','इंग्रजी'];

export function DoubtCommunity({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newQ, setNewQ] = useState('');
  const [subject, setSubject] = useState('सर्व');
  const [filterSub, setFilterSub] = useState('सर्व');
  const [expanded, setExpanded] = useState<string|null>(null);
  const [answers, setAnswers] = useState<Record<string,Answer[]>>({});
  const [newAnswer, setNewAnswer] = useState<Record<string,string>>({});
  const [tab, setTab] = useState<'browse'|'ask'>('browse');

  useEffect(() => { loadQuestions(); }, [filterSub]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      let q = supabase.from('doubt_questions').select('*').order('created_at', { ascending: false }).limit(30);
      if (filterSub !== 'सर्व') q = q.eq('subject', filterSub);
      const { data } = await q;
      setQuestions(data || []);
    } catch(e) {
      // fallback to sample data if table doesn't exist yet
      setQuestions([
        { id:'1', user_email:'student@example.com', question:'महाराष्ट्राचे पहिले मुख्यमंत्री कोण होते?', subject:'इतिहास', created_at: new Date().toISOString(), upvotes: 5, answer_count: 2 },
        { id:'2', user_email:'aspirant@example.com', question:'MPSC Prelims साठी कोणते Optional subject चांगले?', subject:'सर्व', created_at: new Date().toISOString(), upvotes: 12, answer_count: 8 },
      ]);
    }
    setLoading(false);
  };

  const loadAnswers = async (qId: string) => {
    try {
      const { data } = await supabase.from('doubt_answers').select('*').eq('question_id', qId).order('upvotes', { ascending: false });
      setAnswers(prev => ({ ...prev, [qId]: data || [] }));
    } catch(e) {
      setAnswers(prev => ({ ...prev, [qId]: [
        { id:'a1', question_id: qId, user_email:'topper@example.com', answer:'यशवंतराव चव्हाण हे महाराष्ट्राचे पहिले मुख्यमंत्री होते (1960).', created_at: new Date().toISOString(), upvotes: 8 }
      ]}));
    }
  };

  const postQuestion = async () => {
    if (!newQ.trim()) return;
    if (!user) { alert('प्रश्न पोस्ट करण्यासाठी लॉगिन करा'); return; }
    setPosting(true);
    try {
      await supabase.from('doubt_questions').insert({
        user_email: user.email,
        question: newQ.trim(),
        subject,
        upvotes: 0,
      });
      setNewQ(''); setTab('browse');
      await loadQuestions();
    } catch(e) {
      // Demo mode
      const demo: Question = { id: Date.now().toString(), user_email: user.email||'you', question: newQ.trim(), subject, created_at: new Date().toISOString(), upvotes: 0, answer_count: 0 };
      setQuestions(prev => [demo, ...prev]);
      setNewQ(''); setTab('browse');
    }
    setPosting(false);
  };

  const postAnswer = async (qId: string) => {
    const ans = newAnswer[qId];
    if (!ans?.trim()) return;
    if (!user) { alert('उत्तर देण्यासाठी लॉगिन करा'); return; }
    try {
      await supabase.from('doubt_answers').insert({ question_id: qId, user_email: user.email, answer: ans.trim(), upvotes: 0 });
      setNewAnswer(prev => ({ ...prev, [qId]: '' }));
      await loadAnswers(qId);
    } catch(e) {
      const demo: Answer = { id: Date.now().toString(), question_id: qId, user_email: user.email||'you', answer: ans.trim(), created_at: new Date().toISOString(), upvotes: 0 };
      setAnswers(prev => ({ ...prev, [qId]: [...(prev[qId]||[]), demo] }));
      setNewAnswer(prev => ({ ...prev, [qId]: '' }));
    }
  };

  const toggleExpand = (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!answers[id]) loadAnswers(id);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff/60000);
    if (m < 60) return `${m} मिनिटांपूर्वी`;
    const h = Math.floor(m/60);
    if (h < 24) return `${h} तासांपूर्वी`;
    return `${Math.floor(h/24)} दिवसांपूर्वी`;
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:520, maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 64px rgba(28,43,43,0.2)' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#E8671A,#C4510E)', padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <MessageCircle size={22} color="#fff" />
            <div>
              <div style={{ color:'#fff', fontWeight:900, fontSize:17 }}>Doubt Community</div>
              <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:600 }}>प्रश्न विचारा, उत्तरे मिळवा</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:32, height:32, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'2px solid #F5F0E8', background:'#fff' }}>
          {(['browse','ask'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex:1, padding:'12px', fontWeight:800, fontSize:13, border:'none', cursor:'pointer', background:'none', color: tab===t ? '#E8671A' : '#7A9090', borderBottom: tab===t ? '2px solid #E8671A' : '2px solid transparent', marginBottom:-2, transition:'all 0.2s' }}>
              {t === 'browse' ? '📋 प्रश्न पहा' : '✏️ प्रश्न विचारा'}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:16 }}>

          {tab === 'ask' && (
            <div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:800, color:'#1C2B2B', display:'block', marginBottom:6 }}>विषय निवडा</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {SUBJECTS.filter(s => s !== 'सर्व').map(s => (
                    <button key={s} onClick={() => setSubject(s)}
                      style={{ padding:'5px 12px', borderRadius:20, border:'1.5px solid', borderColor: subject===s ? '#E8671A' : 'rgba(28,43,43,0.12)', background: subject===s ? '#FDF6EC' : '#fff', color: subject===s ? '#E8671A' : '#7A9090', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={newQ} onChange={e => setNewQ(e.target.value)}
                placeholder="तुमचा प्रश्न येथे लिहा... (Marathi किंवा English)"
                className="dc-input"
                style={{ width:'100%', minHeight:120, padding:14, borderRadius:12, border:'1.5px solid rgba(28,43,43,0.15)', fontSize:14, fontFamily:"'Baloo 2',sans-serif", fontWeight:600, resize:'vertical', color:'#1C2B2B', background:'#FDF6EC', boxSizing:'border-box' }}
              />
              <button onClick={postQuestion} disabled={posting || !newQ.trim()}
                style={{ width:'100%', marginTop:10, background:'linear-gradient(135deg,#E8671A,#C4510E)', border:'none', borderRadius:12, padding:'13px', color:'#fff', fontWeight:900, fontSize:14, cursor: posting || !newQ.trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: !newQ.trim() ? 0.6 : 1 }}>
                {posting ? <Loader size={16} style={{ animation:'dc-spin 1s linear infinite' }}/> : <><Send size={15}/> प्रश्न Post करा</>}
              </button>
            </div>
          )}

          {tab === 'browse' && (
            <>
              {/* Subject filter */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                {SUBJECTS.map(s => (
                  <button key={s} onClick={() => setFilterSub(s)}
                    style={{ padding:'4px 10px', borderRadius:16, border:'1.5px solid', borderColor: filterSub===s ? '#E8671A' : 'rgba(28,43,43,0.12)', background: filterSub===s ? '#E8671A' : '#fff', color: filterSub===s ? '#fff' : '#7A9090', fontWeight:700, fontSize:11, cursor:'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>

              {loading ? (
                <div style={{ textAlign:'center', padding:40, color:'#7A9090' }}><Loader size={24} style={{ animation:'dc-fade 1s ease infinite' }}/></div>
              ) : questions.map(q => (
                <div key={q.id} className="dc-item" style={{ background:'#FDF6EC', borderRadius:16, padding:14, marginBottom:10, border:'1.5px solid rgba(28,43,43,0.07)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:10, fontWeight:800, color:'#E8671A', background:'rgba(232,103,26,0.1)', padding:'2px 8px', borderRadius:20 }}>{q.subject}</span>
                    <span style={{ fontSize:10, color:'#7A9090', fontWeight:600 }}>{timeAgo(q.created_at)}</span>
                  </div>
                  <p style={{ fontWeight:700, fontSize:14, color:'#1C2B2B', margin:'0 0 8px', lineHeight:1.5 }}>{q.question}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:11, color:'#7A9090', fontWeight:600 }}>✍️ {q.user_email?.split('@')[0]}</span>
                    <span style={{ fontSize:11, color:'#7A9090', fontWeight:600 }}>👍 {q.upvotes}</span>
                    <button onClick={() => toggleExpand(q.id)}
                      style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, background:'rgba(13,107,110,0.1)', border:'none', borderRadius:10, padding:'5px 10px', color:'#0D6B6E', fontWeight:800, fontSize:11, cursor:'pointer' }}>
                      {expanded === q.id ? <><ChevronUp size={13}/> लपवा</> : <><ChevronDown size={13}/> उत्तरे ({q.answer_count||0})</>}
                    </button>
                  </div>

                  {expanded === q.id && (
                    <div style={{ marginTop:12, borderTop:'1px solid rgba(28,43,43,0.08)', paddingTop:12 }}>
                      {(answers[q.id]||[]).map(a => (
                        <div key={a.id} style={{ background:'#fff', borderRadius:10, padding:10, marginBottom:8, borderLeft:'3px solid #0D6B6E' }}>
                          <p style={{ margin:0, fontSize:13, color:'#1C2B2B', fontWeight:600, lineHeight:1.5 }}>{a.answer}</p>
                          <div style={{ marginTop:6, fontSize:11, color:'#7A9090' }}>✍️ {a.user_email?.split('@')[0]} · 👍 {a.upvotes}</div>
                        </div>
                      ))}
                      {!(answers[q.id]?.length) && <p style={{ color:'#7A9090', fontSize:12, fontStyle:'italic' }}>अजून उत्तर नाही. पहिले उत्तर द्या!</p>}
                      <div style={{ display:'flex', gap:8, marginTop:8 }}>
                        <input value={newAnswer[q.id]||''} onChange={e => setNewAnswer(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="तुमचे उत्तर लिहा..."
                          className="dc-input"
                          style={{ flex:1, padding:'8px 12px', borderRadius:10, border:'1.5px solid rgba(28,43,43,0.15)', fontSize:12, fontFamily:"'Baloo 2',sans-serif", fontWeight:600, color:'#1C2B2B', background:'#fff' }}
                        />
                        <button onClick={() => postAnswer(q.id)}
                          style={{ background:'#0D6B6E', border:'none', borderRadius:10, padding:'8px 14px', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center' }}>
                          <Send size={14}/>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2, ThumbsUp, ChevronDown, ChevronUp, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Comment {
  id: string;
  question_id: number;
  question_table: string;
  user_email: string;
  display_name: string;
  content: string;
  likes: number;
  created_at: string;
}

interface Props {
  questionId: number;
  questionTable: string;
  currentUser?: any;
}

const COMMENTS_KEY = (qid: number, table: string) => `mpsc_comments_${table}_${qid}`;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes qc-fade { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
  @keyframes qc-pop  { 0%{transform:scale(0.8)}60%{transform:scale(1.15)}100%{transform:scale(1)} }
  textarea:focus { outline:none; border-color:#E8671A !important; }
`;

export const QuestionComments: React.FC<Props> = ({ questionId, questionTable, currentUser }) => {
  const [open, setOpen]         = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked]       = useState<Set<string>>(new Set());

  const storageKey = COMMENTS_KEY(questionId, questionTable);

  // Load from localStorage (offline-first)
  const loadLocal = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]') as Comment[];
    } catch { return []; }
  };

  const saveLocal = (data: Comment[]) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  // Try to load from Supabase, fallback to local
  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('question_comments')
        .select('*')
        .eq('question_id', questionId)
        .eq('question_table', questionTable)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && !error) {
        setComments(data);
        saveLocal(data);
      } else {
        setComments(loadLocal());
      }
    } catch {
      setComments(loadLocal());
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const submit = async () => {
    if (!text.trim()) return;
    if (!currentUser) {
      alert('Comment करण्यासाठी Login करा!');
      return;
    }
    setSubmitting(true);

    const newComment: Comment = {
      id: Date.now().toString(),
      question_id: questionId,
      question_table: questionTable,
      user_email: currentUser.email || '',
      display_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
      content: text.trim(),
      likes: 0,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('question_comments')
        .insert([{
          question_id: questionId,
          question_table: questionTable,
          user_id: currentUser.id,
          user_email: newComment.user_email,
          display_name: newComment.display_name,
          content: newComment.content,
          likes: 0,
        }])
        .select()
        .single();

      if (data && !error) {
        const updated = [data, ...comments];
        setComments(updated);
        saveLocal(updated);
      } else {
        // Offline fallback
        const updated = [newComment, ...comments];
        setComments(updated);
        saveLocal(updated);
      }
    } catch {
      const updated = [newComment, ...comments];
      setComments(updated);
      saveLocal(updated);
    }

    setText('');
    setSubmitting(false);
  };

  const likeComment = async (id: string) => {
    if (liked.has(id)) return;
    setLiked(prev => new Set([...prev, id]));
    setComments(prev => prev.map(c => c.id === id ? { ...c, likes: (c.likes||0) + 1 } : c));
    // Update in Supabase
    try {
      const comment = comments.find(c => c.id === id);
      if (comment) {
        await supabase.from('question_comments').update({ likes: (comment.likes||0) + 1 }).eq('id', id);
      }
    } catch {}
  };

  const deleteComment = async (id: string, userEmail: string) => {
    if (currentUser?.email !== userEmail) return;
    if (!window.confirm('Delete?')) return;
    const updated = comments.filter(c => c.id !== id);
    setComments(updated);
    saveLocal(updated);
    try { await supabase.from('question_comments').delete().eq('id', id); } catch {}
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diff < 60) return 'आत्ता';
      if (diff < 3600) return `${Math.floor(diff/60)} min आधी`;
      if (diff < 86400) return `${Math.floor(diff/3600)} तास आधी`;
      return d.toLocaleDateString('mr-IN');
    } catch { return ''; }
  };

  return (
    <div style={{ fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}>
      <style>{CSS}</style>

      {/* Toggle button */}
      <button onClick={() => setOpen(o => !o)}
        style={{ display:'flex', alignItems:'center', gap:7, background: open ? 'rgba(232,103,26,0.1)' : 'rgba(0,0,0,0.05)', border:`1px solid ${open ? 'rgba(232,103,26,0.3)' : 'rgba(0,0,0,0.1)'}`, borderRadius:12, padding:'8px 14px', color: open ? '#E8671A' : '#7A9090', fontWeight:800, fontSize:12, cursor:'pointer', transition:'all 0.2s', width:'100%', justifyContent:'center' }}>
        <MessageCircle size={14}/>
        {open ? 'Comments बंद करा' : `Comments ${comments.length > 0 ? `(${comments.length})` : 'पाहा'}`}
        {open ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
      </button>

      {/* Comments panel */}
      {open && (
        <div style={{ marginTop:10, background:'#F8F5F0', borderRadius:16, padding:'16px', border:'1px solid rgba(0,0,0,0.07)', animation:'qc-fade 0.3s ease' }}>

          {/* Comment input */}
          <div style={{ marginBottom:14 }}>
            {currentUser ? (
              <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,#E8671A,#C4510E)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:'#fff', flexShrink:0 }}>
                      {(currentUser.user_metadata?.full_name || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:'#4A6060' }}>
                      {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                    </span>
                  </div>
                  <textarea value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && !e.shiftKey && (e.preventDefault(), submit())}
                    placeholder="तुमचा comment लिहा... (Enter = submit)"
                    rows={2}
                    style={{ width:'100%', background:'#fff', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'10px 12px', fontSize:13, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', resize:'none', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", lineHeight:1.6, transition:'border 0.2s' }}/>
                </div>
                <button onClick={submit} disabled={submitting || !text.trim()}
                  style={{ background:text.trim()?'linear-gradient(135deg,#E8671A,#C4510E)':'rgba(0,0,0,0.1)', border:'none', borderRadius:12, padding:'10px 14px', color:'#fff', cursor:text.trim()?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, opacity:submitting?0.7:1 }}>
                  <Send size={15}/>
                </button>
              </div>
            ) : (
              <div style={{ background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:12, padding:'12px', textAlign:'center', fontSize:12, fontWeight:700, color:'#C4510E' }}>
                💬 Comment करण्यासाठी Login करा
              </div>
            )}
          </div>

          {/* Comments list */}
          {loading ? (
            <div style={{ textAlign:'center', padding:'20px', fontSize:12, color:'#7A9090', fontWeight:600 }}>Loading...</div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px' }}>
              <div style={{ fontSize:28, marginBottom:6 }}>💬</div>
              <div style={{ fontSize:12, fontWeight:700, color:'#7A9090' }}>पहिला comment करा!</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {comments.map((c, i) => (
                <div key={c.id} style={{ background:'#fff', borderRadius:14, padding:'12px 14px', animation:`qc-fade 0.2s ease ${i*0.05}s both`, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <div style={{ width:26, height:26, borderRadius:'50%', background:`hsl(${(c.display_name?.charCodeAt(0)||0)*10}, 60%, 50%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff', flexShrink:0 }}>
                        {(c.display_name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:800, fontSize:12, color:'#1C2B2B' }}>{c.display_name || 'User'}</div>
                        <div style={{ fontSize:9, fontWeight:600, color:'#A8A29E' }}>{formatTime(c.created_at)}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <button onClick={() => likeComment(c.id)}
                        style={{ display:'flex', alignItems:'center', gap:4, background: liked.has(c.id) ? 'rgba(232,103,26,0.1)' : 'rgba(0,0,0,0.04)', border:'none', borderRadius:8, padding:'4px 9px', cursor:'pointer', animation: liked.has(c.id) ? 'qc-pop 0.3s ease' : 'none' }}>
                        <ThumbsUp size={11} style={{ color: liked.has(c.id) ? '#E8671A' : '#A8A29E' }}/>
                        <span style={{ fontSize:10, fontWeight:800, color: liked.has(c.id) ? '#E8671A' : '#A8A29E' }}>{c.likes||0}</span>
                      </button>
                      {currentUser?.email === c.user_email && (
                        <button onClick={() => deleteComment(c.id, c.user_email)}
                          style={{ background:'rgba(220,38,38,0.07)', border:'none', borderRadius:8, padding:'4px 6px', cursor:'pointer', display:'flex' }}>
                          <Trash2 size={11} style={{ color:'#DC2626' }}/>
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize:13, fontWeight:600, color:'#4A6060', margin:0, lineHeight:1.65, whiteSpace:'pre-wrap' }}>{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

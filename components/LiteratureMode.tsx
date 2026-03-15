import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, BookOpen, ChevronDown, Eye, EyeOff, GraduationCap, Search, HelpCircle } from 'lucide-react';

interface LitQuestion {
  id: number; question: string; model_answer: string; topic: string;
  author?: string; work?: string; difficulty?: string; exam_name?: string; subject?: string; year?: number;
}

const LIT_TOPICS = ['कवी परिचय','लेखक परिचय','कादंबरी','नाटक','कविता','दलित साहित्य','स्त्रीवादी साहित्य','व्याकरण'];
const EXAMS = ['Rajyaseva Mains','NET/SET','PhD Entrance','MPSC Combined'];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes lm-fade { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes lm-spin { to{transform:rotate(360deg)} }
  @keyframes lm-in   { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
  .lm-card  { transition: all 0.2s ease; }
  .lm-card:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(28,43,43,0.1) !important; }
  .lm-chip  { transition: all 0.15s ease; }
  .lm-chip:hover { transform:translateY(-1px); }
  .lm-toggle:hover { opacity:0.88; transform:scale(1.02); }
`;

export const LiteratureMode: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [questions, setQuestions] = useState<LitQuestion[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selTopic, setSelTopic]   = useState('All');
  const [selExam, setSelExam]     = useState('All');
  const [revealed, setRevealed]   = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from('literature_questions').select('*');
        if (selTopic !== 'All') query = query.eq('topic', selTopic);
        if (selExam  !== 'All') query = query.eq('exam_name', selExam);
        const { data, error } = await query.order('id', { ascending: false });
        if (error) throw error;
        setQuestions(data || []);
        setRevealed({});
      } catch (err: any) { console.error('Literature लोड करताना चूक:', err.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [selTopic, selExam]);

  const filtered = questions.filter(q =>
    q.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.work?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const base: React.CSSProperties = {
    minHeight: '100vh', background: '#FDF6EC',
    fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", color: '#1C2B2B',
    padding: '0 0 80px',
  };

  return (
    <div style={base}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1C2B2B,#E8671A)', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, boxShadow:'0 4px 20px rgba(232,103,26,0.3)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 14px', color:'#FDF6EC', fontWeight:800, fontSize:12, cursor:'pointer' }}>
            <ArrowLeft size={14} /> मागे
          </button>
          <div>
            <div style={{ fontWeight:900, fontSize:17, color:'#F5C842', letterSpacing:'-0.02em', display:'flex', alignItems:'center', gap:8, lineHeight:1 }}>
              <GraduationCap size={17} /> मराठी साहित्य
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', fontWeight:600, marginTop:2 }}>Mains & NET/SET साठी सखोल अभ्यास</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'24px 16px' }}>

        {/* Search */}
        <div style={{ position:'relative', marginBottom:16 }}>
          <Search size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#7A9090', pointerEvents:'none' }} />
          <input type="text" placeholder="लेखक, कृती किंवा विषय शोधा..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width:'100%', background:'#fff', border:'1.5px solid rgba(28,43,43,0.1)', borderRadius:14, padding:'13px 16px 13px 40px', color:'#1C2B2B', fontWeight:600, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:"'Baloo 2',sans-serif", transition:'border-color 0.2s' }} />
        </div>

        {/* Filters */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          {[
            { label:'साहित्य प्रकार', value:selTopic, onChange:setSelTopic, options:LIT_TOPICS, allLabel:'सर्व प्रकार' },
            { label:'परीक्षा',        value:selExam,  onChange:setSelExam,  options:EXAMS,      allLabel:'सर्व परीक्षा' },
          ].map(({ label, value, onChange, options, allLabel }) => (
            <div key={label} style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ fontSize:9, fontWeight:800, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.12em' }}>{label}</span>
              <div style={{ position:'relative' }}>
                <select value={value} onChange={e => onChange(e.target.value)}
                  style={{ width:'100%', background:'#fff', border:'1.5px solid rgba(28,43,43,0.1)', borderRadius:12, padding:'10px 30px 10px 12px', color:'#1C2B2B', fontWeight:700, fontSize:12, outline:'none', cursor:'pointer', appearance:'none', WebkitAppearance:'none', fontFamily:"'Baloo 2',sans-serif" }}>
                  <option value="All">{allLabel}</option>
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={13} style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', color:'#7A9090', pointerEvents:'none' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Topic chips */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
          {['All',...LIT_TOPICS].slice(0,7).map(t => (
            <button key={t} className="lm-chip" onClick={() => setSelTopic(t)}
              style={{ padding:'6px 14px', borderRadius:99, fontSize:11, fontWeight:800, cursor:'pointer', border:`1.5px solid ${selTopic===t ? '#E8671A' : 'rgba(28,43,43,0.1)'}`, background: selTopic===t ? 'rgba(232,103,26,0.1)' : '#fff', color: selTopic===t ? '#C4510E' : '#4A6060', transition:'all 0.15s', fontFamily:"'Baloo 2',sans-serif", boxShadow: selTopic===t ? '0 2px 8px rgba(232,103,26,0.2)' : 'none' }}>
              {t==='All'?'सर्व':t}
            </button>
          ))}
        </div>

        {!loading && <p style={{ fontSize:11, color:'#7A9090', fontWeight:700, marginBottom:16 }}>{filtered.length} प्रश्न / विषय सापडले</p>}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', borderRadius:22, border:'1px solid rgba(28,43,43,0.07)' }}>
            <div style={{ width:48, height:48, border:'4px solid rgba(232,103,26,0.2)', borderTopColor:'#E8671A', borderRadius:'50%', animation:'lm-spin 0.8s linear infinite', margin:'0 auto 16px' }} />
            <div style={{ fontWeight:800, fontSize:14, color:'#4A6060' }}>साहित्य डाटा लोड होत आहे...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', border:'1px dashed rgba(28,43,43,0.12)', borderRadius:22 }}>
            <HelpCircle size={48} style={{ color:'#B0CCCC', margin:'0 auto 14px' }} />
            <div style={{ fontWeight:800, fontSize:15, color:'#4A6060', marginBottom:6 }}>या निवडीसाठी सध्या प्रश्न उपलब्ध नाहीत.</div>
            <div style={{ fontSize:12, color:'#B0CCCC', fontWeight:600 }}>वेगळा प्रकार किंवा परीक्षा निवडा</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {filtered.map((q, idx) => {
              const isRevealed = revealed[q.id];
              return (
                <div key={q.id} className="lm-card"
                  style={{ background:'#fff', border:'1px solid rgba(28,43,43,0.07)', borderRadius:22, overflow:'hidden', boxShadow:'0 2px 12px rgba(28,43,43,0.06)', animation:`lm-fade 0.2s ease ${idx*0.04}s both` }}>
                  <div style={{ height:3, background:'linear-gradient(90deg,#E8671A,#F5C842)' }} />

                  <div style={{ padding:'20px 24px' }}>
                    {/* Badges */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
                      {q.topic     && <span style={{ fontSize:9, fontWeight:800, background:'rgba(232,103,26,0.1)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:99, padding:'3px 10px', color:'#C4510E', textTransform:'uppercase' }}>{q.topic}</span>}
                      {q.exam_name && <span style={{ fontSize:9, fontWeight:800, background:'rgba(13,107,110,0.1)', border:'1px solid rgba(13,107,110,0.2)', borderRadius:99, padding:'3px 10px', color:'#0D6B6E', textTransform:'uppercase' }}>{q.exam_name}</span>}
                      {q.author    && <span style={{ fontSize:9, fontWeight:800, background:'rgba(217,119,6,0.1)',  border:'1px solid rgba(217,119,6,0.2)',  borderRadius:99, padding:'3px 10px', color:'#D97706', textTransform:'uppercase' }}>✍️ {q.author}</span>}
                      {q.work      && <span style={{ fontSize:9, fontWeight:800, background:'rgba(124,58,237,0.1)',border:'1px solid rgba(124,58,237,0.2)',borderRadius:99, padding:'3px 10px', color:'#7C3AED', textTransform:'uppercase' }}>📖 {q.work}</span>}
                      {q.year      && <span style={{ fontSize:9, fontWeight:800, background:'rgba(13,107,110,0.1)', border:'1px solid rgba(13,107,110,0.2)', borderRadius:99, padding:'3px 10px', color:'#0D6B6E' }}>{q.year}</span>}
                    </div>

                    {/* Question */}
                    <h3 style={{ fontWeight:800, fontSize:15, color:'#1C2B2B', lineHeight:1.65, marginBottom:18 }}>
                      <span style={{ color:'#E8671A', fontWeight:900, marginRight:6 }}>प्र. {idx+1}</span>{q.question}
                    </h3>

                    {/* Toggle button */}
                    <button className="lm-toggle" onClick={() => setRevealed(p => ({ ...p, [q.id]: !p[q.id] }))}
                      style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:13, fontSize:11, fontWeight:900, cursor:'pointer', border:'none', background: isRevealed ? '#FDF6EC' : 'linear-gradient(135deg,#E8671A,#C4510E)', color: isRevealed ? '#7A9090' : '#fff', boxShadow: isRevealed ? 'none' : '0 6px 20px rgba(232,103,26,0.3)', transition:'all 0.18s ease', fontFamily:"'Baloo 2',sans-serif", textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      {isRevealed ? <><EyeOff size={14} /> उत्तर लपवा</> : <><Eye size={14} /> आदर्श उत्तर पहा</>}
                    </button>

                    {/* Model Answer */}
                    {isRevealed && (
                      <div style={{ marginTop:16, animation:'lm-in 0.28s ease' }}>
                        <div style={{ background:'linear-gradient(135deg,#1C2B2B,#0D6B6E)', borderRadius:18, padding:'20px 22px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12, fontSize:9, fontWeight:800, color:'#F5C842', textTransform:'uppercase', letterSpacing:'0.12em' }}>
                            <BookOpen size={13} /> संशोधन आधारित आदर्श उत्तर
                          </div>
                          <p style={{ fontSize:13, color:'rgba(255,255,255,0.85)', lineHeight:1.75, fontWeight:500, whiteSpace:'pre-line', margin:0 }}>
                            {q.model_answer || 'उत्तर लवकरच उपलब्ध केले जाईल.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

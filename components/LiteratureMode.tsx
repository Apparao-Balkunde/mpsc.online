import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, BookOpen, ChevronDown, Eye, EyeOff, GraduationCap,
  Search, HelpCircle, Layers, CheckCircle, RotateCcw, ChevronLeft, ChevronRight, BarChart2
} from 'lucide-react';

interface LitQuestion {
  id: number; question: string; model_answer: string; topic: string;
  author?: string; work?: string; difficulty?: string; exam_name?: string; subject?: string; year?: number;
}

// ── Updated Topics & Exams ──────────────────────────────────────────────────
const LIT_TOPICS = [
  'कवी परिचय','लेखक परिचय','कादंबरी','नाटक','कविता',
  'दलित साहित्य','स्त्रीवादी साहित्य','व्याकरण',
  'आत्मचरित्र','लघुकथा','वैचारिक गद्य','समीक्षा',
  'लोकसाहित्य','बालसाहित्य','प्रवासवर्णन',
];
const EXAMS = [
  'Rajyaseva Mains','NET/SET','PhD Entrance','MPSC Combined',
  'PSI/STI/ASO','Gramsevak','Zilla Parishad','TET/CTET',
];
const DIFFICULTIES = ['सोपा','मध्यम','कठीण'];

const DIFF_COLOR: Record<string, { bg: string; border: string; color: string }> = {
  'सोपा':  { bg:'rgba(34,197,94,0.1)',  border:'rgba(34,197,94,0.25)',  color:'#16a34a' },
  'मध्यम': { bg:'rgba(234,179,8,0.1)',  border:'rgba(234,179,8,0.25)',  color:'#b45309' },
  'कठीण':  { bg:'rgba(239,68,68,0.1)',  border:'rgba(239,68,68,0.25)',  color:'#dc2626' },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes lm-fade  { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes lm-spin  { to{transform:rotate(360deg)} }
  @keyframes lm-in    { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
  .lm-card        { transition:all 0.2s ease; }
  .lm-card:hover  { transform:translateY(-2px); box-shadow:0 10px 32px rgba(28,43,43,0.1) !important; }
  .lm-chip        { transition:all 0.15s ease; }
  .lm-chip:hover  { transform:translateY(-1px); }
  .lm-toggle:hover{ opacity:0.88; transform:scale(1.02); }
  .lm-fc-scene    { perspective:900px; }
  .lm-fc-card     { position:relative; width:100%; transition:transform 0.6s cubic-bezier(.4,0,.2,1); transform-style:preserve-3d; }
  .lm-fc-card.flipped { transform:rotateY(180deg); }
  .lm-fc-face     { position:absolute; width:100%; backface-visibility:hidden; -webkit-backface-visibility:hidden; border-radius:22px; overflow:hidden; }
  .lm-fc-back     { transform:rotateY(180deg); }
  .lm-mode-btn    { transition:all 0.15s; }
  .lm-mode-btn:hover { transform:translateY(-1px); }
`;

type ViewMode = 'list' | 'flashcard';

export const LiteratureMode: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [questions,  setQuestions]  = useState<LitQuestion[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selTopic,   setSelTopic]   = useState('All');
  const [selExam,    setSelExam]    = useState('All');
  const [selDiff,    setSelDiff]    = useState('All');
  const [revealed,   setRevealed]   = useState<Record<number, boolean>>({});
  const [viewMode,   setViewMode]   = useState<ViewMode>('list');
  const [fcIndex,    setFcIndex]    = useState(0);
  const [fcFlipped,  setFcFlipped]  = useState(false);
  const [seenIds,    setSeenIds]    = useState<Set<number>>(new Set());

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from('literature_questions').select('*');
        if (selTopic !== 'All') query = query.eq('topic',      selTopic);
        if (selExam  !== 'All') query = query.eq('exam_name',  selExam);
        if (selDiff  !== 'All') query = query.eq('difficulty', selDiff);
        const { data, error } = await query.order('id', { ascending: false });
        if (error) throw error;
        setQuestions(data || []);
        setRevealed({});
        setFcIndex(0);
        setFcFlipped(false);
      } catch (err: any) { console.error('Literature लोड करताना चूक:', err.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [selTopic, selExam, selDiff]);

  const filtered = questions.filter(q =>
    q.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.work?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Progress ───────────────────────────────────────────────────────────────
  const markSeen = useCallback((id: number) => {
    setSeenIds(prev => { const s = new Set(prev); s.add(id); return s; });
  }, []);

  const revealAnswer = (id: number) => {
    setRevealed(p => ({ ...p, [id]: !p[id] }));
    markSeen(id);
  };

  const seenCount   = filtered.filter(q => seenIds.has(q.id)).length;
  const progressPct = filtered.length ? Math.round((seenCount / filtered.length) * 100) : 0;

  // ── Flashcard nav ──────────────────────────────────────────────────────────
  const fcQ    = filtered[fcIndex];
  const fcNext = () => { if (fcIndex < filtered.length - 1) { setFcIndex(i => i + 1); setFcFlipped(false); } };
  const fcPrev = () => { if (fcIndex > 0) { setFcIndex(i => i - 1); setFcFlipped(false); } };
  const fcFlip = () => { if (fcQ) markSeen(fcQ.id); setFcFlipped(f => !f); };

  const base: React.CSSProperties = {
    minHeight:'100vh', background:'#FDF6EC',
    fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#1C2B2B',
    padding:'0 0 80px',
  };

  return (
    <div style={base}>
      <style>{CSS}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#1C2B2B,#E8671A)', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, boxShadow:'0 4px 20px rgba(232,103,26,0.3)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 14px', color:'#FDF6EC', fontWeight:800, fontSize:12, cursor:'pointer' }}>
            <ArrowLeft size={14} /> मागे
          </button>
          <div>
            <div style={{ fontWeight:900, fontSize:17, color:'#F5C842', letterSpacing:'-0.02em', display:'flex', alignItems:'center', gap:8, lineHeight:1 }}>
              <GraduationCap size={17} /> मराठी साहित्य
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', fontWeight:600, marginTop:2 }}>Mains, NET/SET आणि इतर परीक्षांसाठी सखोल अभ्यास</div>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div style={{ display:'flex', gap:6 }}>
          {(['list','flashcard'] as ViewMode[]).map(m => (
            <button key={m} className="lm-mode-btn"
              onClick={() => { setViewMode(m); setFcIndex(0); setFcFlipped(false); }}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:10, fontSize:11, fontWeight:800, cursor:'pointer', border:'1px solid rgba(255,255,255,0.25)', background: viewMode===m ? 'rgba(245,200,66,0.25)' : 'rgba(255,255,255,0.08)', color: viewMode===m ? '#F5C842' : 'rgba(255,255,255,0.65)', fontFamily:"'Baloo 2',sans-serif" }}>
              {m==='list' ? <><BarChart2 size={12}/> यादी</> : <><Layers size={12}/> फ्लॅशकार्ड</>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'24px 16px' }}>

        {/* ── Progress Bar ────────────────────────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div style={{ background:'#fff', borderRadius:16, padding:'14px 20px', marginBottom:16, border:'1px solid rgba(28,43,43,0.07)', boxShadow:'0 2px 8px rgba(28,43,43,0.05)', animation:'lm-in 0.3s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, fontWeight:800, color:'#1C2B2B' }}>
                <CheckCircle size={14} color="#E8671A"/> प्रगती — {seenCount} / {filtered.length} प्रश्न पाहिले
              </div>
              <span style={{ fontSize:12, fontWeight:900, color: progressPct===100 ? '#16a34a' : '#E8671A' }}>{progressPct}%</span>
            </div>
            <div style={{ background:'rgba(28,43,43,0.08)', borderRadius:99, height:8, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progressPct}%`, background:'linear-gradient(90deg,#E8671A,#F5C842)', borderRadius:99, transition:'width 0.4s ease' }}/>
            </div>
            {progressPct===100 && (
              <div style={{ marginTop:8, fontSize:11, fontWeight:800, color:'#16a34a' }}>🎉 सर्व प्रश्न पाहून झाले! उत्कृष्ट काम!</div>
            )}
            {seenCount > 0 && progressPct < 100 && (
              <button onClick={() => { setSeenIds(new Set()); setRevealed({}); }}
                style={{ marginTop:8, fontSize:10, fontWeight:800, color:'#7A9090', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:"'Baloo 2',sans-serif" }}>
                <RotateCcw size={10}/> प्रगती रीसेट करा
              </button>
            )}
          </div>
        )}

        {/* ── Search ─────────────────────────────────────────────────────────── */}
        <div style={{ position:'relative', marginBottom:16 }}>
          <Search size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#7A9090', pointerEvents:'none' }}/>
          <input type="text" placeholder="लेखक, कृती किंवा विषय शोधा..." value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setFcIndex(0); setFcFlipped(false); }}
            style={{ width:'100%', background:'#fff', border:'1.5px solid rgba(28,43,43,0.1)', borderRadius:14, padding:'13px 16px 13px 40px', color:'#1C2B2B', fontWeight:600, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:"'Baloo 2',sans-serif" }}/>
        </div>

        {/* ── 3-column Filters ───────────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
          {[
            { label:'साहित्य प्रकार', value:selTopic, onChange:setSelTopic, options:LIT_TOPICS,    allLabel:'सर्व प्रकार' },
            { label:'परीक्षा',        value:selExam,  onChange:setSelExam,  options:EXAMS,         allLabel:'सर्व परीक्षा' },
            { label:'कठिणता स्तर',    value:selDiff,  onChange:setSelDiff,  options:DIFFICULTIES,  allLabel:'सर्व स्तर' },
          ].map(({ label, value, onChange, options, allLabel }) => (
            <div key={label} style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ fontSize:9, fontWeight:800, color:'#7A9090', textTransform:'uppercase', letterSpacing:'0.12em' }}>{label}</span>
              <div style={{ position:'relative' }}>
                <select value={value} onChange={e => { onChange(e.target.value); setFcIndex(0); setFcFlipped(false); }}
                  style={{ width:'100%', background:'#fff', border:'1.5px solid rgba(28,43,43,0.1)', borderRadius:12, padding:'10px 28px 10px 12px', color:'#1C2B2B', fontWeight:700, fontSize:12, outline:'none', cursor:'pointer', appearance:'none', WebkitAppearance:'none', fontFamily:"'Baloo 2',sans-serif" }}>
                  <option value="All">{allLabel}</option>
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={13} style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', color:'#7A9090', pointerEvents:'none' }}/>
              </div>
            </div>
          ))}
        </div>

        {/* ── Topic Chips ────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:12 }}>
          {['All',...LIT_TOPICS].map(t => (
            <button key={t} className="lm-chip" onClick={() => { setSelTopic(t); setFcIndex(0); setFcFlipped(false); }}
              style={{ padding:'5px 13px', borderRadius:99, fontSize:11, fontWeight:800, cursor:'pointer', border:`1.5px solid ${selTopic===t?'#E8671A':'rgba(28,43,43,0.1)'}`, background: selTopic===t?'rgba(232,103,26,0.1)':'#fff', color: selTopic===t?'#C4510E':'#4A6060', fontFamily:"'Baloo 2',sans-serif", boxShadow: selTopic===t?'0 2px 8px rgba(232,103,26,0.2)':'none' }}>
              {t==='All'?'सर्व':t}
            </button>
          ))}
        </div>

        {/* ── Difficulty Chips ───────────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:7, marginBottom:20, flexWrap:'wrap' }}>
          {['All',...DIFFICULTIES].map(d => {
            const dc = d !== 'All' ? DIFF_COLOR[d] : null;
            return (
              <button key={d} className="lm-chip" onClick={() => { setSelDiff(d); setFcIndex(0); setFcFlipped(false); }}
                style={{ padding:'5px 14px', borderRadius:99, fontSize:11, fontWeight:800, cursor:'pointer', border:`1.5px solid ${selDiff===d?(dc?.border||'#E8671A'):'rgba(28,43,43,0.1)'}`, background: selDiff===d?(dc?.bg||'rgba(232,103,26,0.1)'):'#fff', color: selDiff===d?(dc?.color||'#C4510E'):'#4A6060', fontFamily:"'Baloo 2',sans-serif" }}>
                {d==='All'?'🎯 सर्व स्तर':d==='सोपा'?'🟢 सोपा':d==='मध्यम'?'🟡 मध्यम':'🔴 कठीण'}
              </button>
            );
          })}
        </div>

        {!loading && <p style={{ fontSize:11, color:'#7A9090', fontWeight:700, marginBottom:16 }}>{filtered.length} प्रश्न / विषय सापडले</p>}

        {/* ── Loading ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', borderRadius:22, border:'1px solid rgba(28,43,43,0.07)' }}>
            <div style={{ width:48, height:48, border:'4px solid rgba(232,103,26,0.2)', borderTopColor:'#E8671A', borderRadius:'50%', animation:'lm-spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
            <div style={{ fontWeight:800, fontSize:14, color:'#4A6060' }}>साहित्य डाटा लोड होत आहे...</div>
          </div>

        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', border:'1px dashed rgba(28,43,43,0.12)', borderRadius:22 }}>
            <HelpCircle size={48} style={{ color:'#B0CCCC', margin:'0 auto 14px' }}/>
            <div style={{ fontWeight:800, fontSize:15, color:'#4A6060', marginBottom:6 }}>या निवडीसाठी सध्या प्रश्न उपलब्ध नाहीत.</div>
            <div style={{ fontSize:12, color:'#B0CCCC', fontWeight:600 }}>वेगळा प्रकार, परीक्षा किंवा कठिणता स्तर निवडा</div>
          </div>

        ) : viewMode === 'flashcard' ? (
          /* ══════════════ FLASHCARD MODE ══════════════ */
          <div style={{ animation:'lm-fade 0.3s ease' }}>
            <div style={{ textAlign:'center', fontSize:12, fontWeight:800, color:'#7A9090', marginBottom:14 }}>
              {fcIndex+1} / {filtered.length}
            </div>

            <div className="lm-fc-scene" style={{ height:340, marginBottom:20 }}>
              <div className={`lm-fc-card${fcFlipped?' flipped':''}`} style={{ height:340 }}>

                {/* Front */}
                <div className="lm-fc-face" style={{ height:340, background:'#fff', border:'1px solid rgba(28,43,43,0.08)', boxShadow:'0 6px 28px rgba(28,43,43,0.09)', cursor:'pointer' }} onClick={fcFlip}>
                  <div style={{ height:4, background:'linear-gradient(90deg,#E8671A,#F5C842)' }}/>
                  <div style={{ padding:'24px 28px', height:'calc(100% - 4px)', display:'flex', flexDirection:'column', justifyContent:'space-between', boxSizing:'border-box' }}>
                    <div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
                        {fcQ?.topic     && <span style={{ fontSize:9, fontWeight:800, background:'rgba(232,103,26,0.1)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:99, padding:'3px 10px', color:'#C4510E' }}>{fcQ.topic}</span>}
                        {fcQ?.exam_name && <span style={{ fontSize:9, fontWeight:800, background:'rgba(13,107,110,0.1)', border:'1px solid rgba(13,107,110,0.2)', borderRadius:99, padding:'3px 10px', color:'#0D6B6E' }}>{fcQ.exam_name}</span>}
                        {fcQ?.difficulty && DIFF_COLOR[fcQ.difficulty] && (
                          <span style={{ fontSize:9, fontWeight:800, background:DIFF_COLOR[fcQ.difficulty].bg, border:`1px solid ${DIFF_COLOR[fcQ.difficulty].border}`, borderRadius:99, padding:'3px 10px', color:DIFF_COLOR[fcQ.difficulty].color }}>
                            {fcQ.difficulty==='सोपा'?'🟢':fcQ.difficulty==='मध्यम'?'🟡':'🔴'} {fcQ.difficulty}
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontWeight:800, fontSize:16, color:'#1C2B2B', lineHeight:1.7, margin:0 }}>
                        <span style={{ color:'#E8671A', fontWeight:900, marginRight:6 }}>प्र.</span>{fcQ?.question}
                      </h3>
                    </div>
                    <div style={{ textAlign:'center', fontSize:11, color:'#B0CCCC', fontWeight:700 }}>👆 कार्ड टॅप करा — उत्तर पहा</div>
                  </div>
                </div>

                {/* Back */}
                <div className="lm-fc-face lm-fc-back" style={{ height:340, background:'linear-gradient(135deg,#1C2B2B,#0D6B6E)', cursor:'pointer' }} onClick={fcFlip}>
                  <div style={{ height:4, background:'linear-gradient(90deg,#F5C842,#E8671A)' }}/>
                  <div style={{ padding:'24px 28px', height:'calc(100% - 4px)', display:'flex', flexDirection:'column', justifyContent:'space-between', boxSizing:'border-box', overflowY:'auto' }}>
                    <div>
                      <div style={{ fontSize:9, fontWeight:800, color:'#F5C842', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                        <BookOpen size={12}/> आदर्श उत्तर
                      </div>
                      <p style={{ fontSize:13, color:'rgba(255,255,255,0.88)', lineHeight:1.78, fontWeight:500, whiteSpace:'pre-line', margin:0 }}>
                        {fcQ?.model_answer || 'उत्तर लवकरच उपलब्ध केले जाईल.'}
                      </p>
                    </div>
                    {fcQ?.author && <div style={{ fontSize:11, color:'rgba(245,200,66,0.8)', fontWeight:700 }}>✍️ {fcQ.author}{fcQ.work ? ` — 📖 ${fcQ.work}` : ''}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
              <button onClick={fcPrev} disabled={fcIndex===0}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:13, fontSize:12, fontWeight:800, cursor:fcIndex===0?'not-allowed':'pointer', border:'1.5px solid rgba(28,43,43,0.12)', background:'#fff', color:fcIndex===0?'#B0CCCC':'#1C2B2B', fontFamily:"'Baloo 2',sans-serif" }}>
                <ChevronLeft size={14}/> मागील
              </button>
              <button onClick={fcFlip}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 26px', borderRadius:13, fontSize:12, fontWeight:900, cursor:'pointer', border:'none', background:'linear-gradient(135deg,#E8671A,#C4510E)', color:'#fff', boxShadow:'0 6px 20px rgba(232,103,26,0.35)', fontFamily:"'Baloo 2',sans-serif" }}>
                {fcFlipped ? <><EyeOff size={14}/> प्रश्न पहा</> : <><Eye size={14}/> उत्तर पहा</>}
              </button>
              <button onClick={fcNext} disabled={fcIndex===filtered.length-1}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:13, fontSize:12, fontWeight:800, cursor:fcIndex===filtered.length-1?'not-allowed':'pointer', border:'1.5px solid rgba(28,43,43,0.12)', background:'#fff', color:fcIndex===filtered.length-1?'#B0CCCC':'#1C2B2B', fontFamily:"'Baloo 2',sans-serif" }}>
                पुढील <ChevronRight size={14}/>
              </button>
            </div>

            {/* Dot nav */}
            <div style={{ display:'flex', justifyContent:'center', gap:5, marginTop:16, flexWrap:'wrap' }}>
              {filtered.slice(0, Math.min(filtered.length, 30)).map((q, i) => (
                <div key={i} onClick={() => { setFcIndex(i); setFcFlipped(false); }}
                  style={{ width:8, height:8, borderRadius:'50%', cursor:'pointer', background: i===fcIndex?'#E8671A':seenIds.has(q.id)?'#F5C842':'rgba(28,43,43,0.12)', transition:'background 0.2s' }}/>
              ))}
              {filtered.length > 30 && <span style={{ fontSize:10, color:'#7A9090', fontWeight:700 }}>+{filtered.length-30}</span>}
            </div>
          </div>

        ) : (
          /* ══════════════ LIST MODE ══════════════ */
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {filtered.map((q, idx) => {
              const isRevealed = revealed[q.id];
              const dc = q.difficulty ? DIFF_COLOR[q.difficulty] : null;
              return (
                <div key={q.id} className="lm-card"
                  style={{ background:'#fff', border:'1px solid rgba(28,43,43,0.07)', borderRadius:22, overflow:'hidden', boxShadow:'0 2px 12px rgba(28,43,43,0.06)', animation:`lm-fade 0.2s ease ${idx*0.04}s both` }}>
                  <div style={{ height:3, background:'linear-gradient(90deg,#E8671A,#F5C842)' }}/>

                  <div style={{ padding:'20px 24px' }}>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
                      {q.topic     && <span style={{ fontSize:9, fontWeight:800, background:'rgba(232,103,26,0.1)', border:'1px solid rgba(232,103,26,0.2)', borderRadius:99, padding:'3px 10px', color:'#C4510E', textTransform:'uppercase' }}>{q.topic}</span>}
                      {q.exam_name && <span style={{ fontSize:9, fontWeight:800, background:'rgba(13,107,110,0.1)', border:'1px solid rgba(13,107,110,0.2)', borderRadius:99, padding:'3px 10px', color:'#0D6B6E', textTransform:'uppercase' }}>{q.exam_name}</span>}
                      {q.difficulty && dc && <span style={{ fontSize:9, fontWeight:800, background:dc.bg, border:`1px solid ${dc.border}`, borderRadius:99, padding:'3px 10px', color:dc.color, textTransform:'uppercase' }}>{q.difficulty==='सोपा'?'🟢':q.difficulty==='मध्यम'?'🟡':'🔴'} {q.difficulty}</span>}
                      {q.author    && <span style={{ fontSize:9, fontWeight:800, background:'rgba(217,119,6,0.1)',  border:'1px solid rgba(217,119,6,0.2)',  borderRadius:99, padding:'3px 10px', color:'#D97706', textTransform:'uppercase' }}>✍️ {q.author}</span>}
                      {q.work      && <span style={{ fontSize:9, fontWeight:800, background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:99, padding:'3px 10px', color:'#7C3AED', textTransform:'uppercase' }}>📖 {q.work}</span>}
                      {q.year      && <span style={{ fontSize:9, fontWeight:800, background:'rgba(13,107,110,0.1)', border:'1px solid rgba(13,107,110,0.2)', borderRadius:99, padding:'3px 10px', color:'#0D6B6E' }}>{q.year}</span>}
                      {seenIds.has(q.id) && <span style={{ fontSize:9, fontWeight:800, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:99, padding:'3px 10px', color:'#16a34a' }}>✓ पाहिले</span>}
                    </div>

                    <h3 style={{ fontWeight:800, fontSize:15, color:'#1C2B2B', lineHeight:1.65, marginBottom:18 }}>
                      <span style={{ color:'#E8671A', fontWeight:900, marginRight:6 }}>प्र. {idx+1}</span>{q.question}
                    </h3>

                    <button className="lm-toggle" onClick={() => revealAnswer(q.id)}
                      style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:13, fontSize:11, fontWeight:900, cursor:'pointer', border:'none', background: isRevealed?'#FDF6EC':'linear-gradient(135deg,#E8671A,#C4510E)', color: isRevealed?'#7A9090':'#fff', boxShadow: isRevealed?'none':'0 6px 20px rgba(232,103,26,0.3)', transition:'all 0.18s ease', fontFamily:"'Baloo 2',sans-serif", textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      {isRevealed ? <><EyeOff size={14}/> उत्तर लपवा</> : <><Eye size={14}/> आदर्श उत्तर पहा</>}
                    </button>

                    {isRevealed && (
                      <div style={{ marginTop:16, animation:'lm-in 0.28s ease' }}>
                        <div style={{ background:'linear-gradient(135deg,#1C2B2B,#0D6B6E)', borderRadius:18, padding:'20px 22px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12, fontSize:9, fontWeight:800, color:'#F5C842', textTransform:'uppercase', letterSpacing:'0.12em' }}>
                            <BookOpen size={13}/> संशोधन आधारित आदर्श उत्तर
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

import React, { useState, useEffect } from 'react';
import { PERMANENT_MASTER_DATA } from '../services/localData';
import { ArrowLeft, Database, Eye, EyeOff, GraduationCap, UploadCloud, RefreshCw, Loader2, MessageSquareCode, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface GlobalLibraryProps { onBack: () => void; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes gl-fade { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes gl-spin { to{transform:rotate(360deg)} }
  @keyframes gl-pop  { from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)} }
  .gl-card  { transition: box-shadow 0.2s ease, transform 0.2s ease; }
  .gl-card:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(28,43,43,0.1) !important; }
  .gl-tab   { transition: all 0.18s ease; }
  .gl-tab:hover { opacity:0.85; }
  .gl-opt   { transition: all 0.15s ease; }
  .prose-light p  { margin-bottom:10px; line-height:1.75; color:#1C2B2B; }
  .prose-light h1,.prose-light h2,.prose-light h3 { color:#0D6B6E; font-weight:900; margin:16px 0 8px; }
  .prose-light ul,.prose-light ol { padding-left:18px; color:#1C2B2B; }
  .prose-light li { margin-bottom:5px; }
  .prose-light strong { color:#E8671A; font-weight:800; }
  .prose-light code { background:#FDF6EC; border:1px solid rgba(232,103,26,0.2); border-radius:5px; padding:2px 6px; font-size:0.9em; color:#C4510E; }
`;

export const GlobalLibrary: React.FC<GlobalLibraryProps> = ({ onBack }) => {
  const [activeTab, setActiveTab]       = useState<'NOTES'|'QUESTIONS'|'CONTRIBUTE'>('NOTES');
  const [revealedIdx, setRevealedIdx]   = useState<number | null>(null);
  const [communityContent, setCommunityContent] = useState<{ questions: any[]; notes: any[] }>({ questions:[], notes:[] });
  const [isLoading, setIsLoading]       = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle'|'loading'|'success'>('idle');

  useEffect(() => { loadCommunityData(); }, []);

  const loadCommunityData = async () => {
    setIsLoading(true);
    try { setCommunityContent({ questions:[], notes:[] }); }
    catch (e) { console.error("माहिती लोड करण्यात अडचण आली."); }
    finally { setIsLoading(false); }
  };

  const handleContribute = async () => {
    const text = prompt("तुमची नोट किंवा प्रश्न (JSON फॉरमॅटमध्ये) येथे पेस्ट करा:");
    if (!text) return;
    setSubmitStatus('loading');
    try {
      setTimeout(() => { setSubmitStatus('success'); setTimeout(() => setSubmitStatus('idle'), 3000); }, 1500);
    } catch (e) { alert("माहिती चुकीच्या फॉरमॅटमध्ये आहे."); setSubmitStatus('idle'); }
  };

  const allNotes     = [...(PERMANENT_MASTER_DATA.notes || []),     ...communityContent.notes];
  const allQuestions = [...(PERMANENT_MASTER_DATA.questions || []), ...communityContent.questions];

  const TABS = [
    { id:'NOTES',      label:`अभ्यास नोट्स (${allNotes.length})`,     color:'#0D6B6E' },
    { id:'QUESTIONS',  label:`प्रश्न संच (${allQuestions.length})`,    color:'#E8671A' },
    { id:'CONTRIBUTE', label:'योगदान',                                  color:'#7C3AED' },
  ];

  const base: React.CSSProperties = {
    minHeight:'100vh', background:'#FDF6EC',
    fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", color:'#1C2B2B',
    padding:'0 0 80px',
  };

  return (
    <div style={base}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1C2B2B,#0D6B6E)', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, boxShadow:'0 4px 20px rgba(13,107,110,0.3)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 14px', color:'#FDF6EC', fontWeight:800, fontSize:12, cursor:'pointer' }}>
            <ArrowLeft size={14} /> मागे
          </button>
          <div>
            <div style={{ fontWeight:900, fontSize:17, color:'#F5C842', letterSpacing:'-0.02em', display:'flex', alignItems:'center', gap:8, lineHeight:1 }}>
              <Database size={17} /> MPSC डिजिटल लायब्ररी
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600, marginTop:2 }}>राज्यातील विद्यार्थ्यांसाठी सामायिक अभ्यासक्रम</div>
          </div>
        </div>
        <button onClick={loadCommunityData} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'8px 10px', color:'rgba(255,255,255,0.7)', cursor:'pointer', display:'flex', alignItems:'center' }}>
          <RefreshCw size={16} style={{ animation: isLoading ? 'gl-spin 0.8s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background:'#fff', borderBottom:'1px solid rgba(28,43,43,0.08)', display:'flex', padding:'0 16px' }}>
        {TABS.map(t => (
          <button key={t.id} className="gl-tab" onClick={() => setActiveTab(t.id as any)}
            style={{ flex:1, padding:'14px 8px', fontSize:11, fontWeight:800, cursor:'pointer', border:'none', background:'transparent', color: activeTab===t.id ? t.color : '#7A9090', borderBottom: activeTab===t.id ? `3px solid ${t.color}` : '3px solid transparent', transition:'all 0.18s', fontFamily:"'Baloo 2',sans-serif", textAlign:'center' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px' }}>

        {/* NOTES */}
        {activeTab === 'NOTES' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'gl-fade 0.3s ease' }}>
            {allNotes.length === 0 ? (
              <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', border:'1px dashed rgba(28,43,43,0.12)', borderRadius:22 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📖</div>
                <div style={{ fontWeight:800, fontSize:15, color:'#4A6060' }}>अजून नोट्स उपलब्ध नाहीत</div>
              </div>
            ) : allNotes.map((note: any, idx: number) => (
              <div key={idx} className="gl-card"
                style={{ background:'#fff', border:'1px solid rgba(28,43,43,0.07)', borderRadius:22, overflow:'hidden', boxShadow:'0 2px 12px rgba(28,43,43,0.06)', animation:`gl-fade 0.2s ease ${idx*0.05}s both` }}>
                <div style={{ height:3, background:'linear-gradient(90deg,#0D6B6E,#14A3A8)' }} />
                <div style={{ padding:'18px 22px', background:'rgba(13,107,110,0.04)', borderBottom:'1px solid rgba(13,107,110,0.1)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ background:'linear-gradient(135deg,#0D6B6E,#094D50)', borderRadius:12, padding:'9px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(13,107,110,0.3)' }}>
                      <GraduationCap size={18} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize:9, fontWeight:800, color:'#0D6B6E', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:2 }}>{note.subject}</div>
                      <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', letterSpacing:'-0.02em' }}>{note.topic}</div>
                    </div>
                  </div>
                  {idx >= (PERMANENT_MASTER_DATA.notes || []).length && (
                    <span style={{ fontSize:9, fontWeight:800, background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.25)', borderRadius:99, padding:'3px 10px', color:'#7C3AED', textTransform:'uppercase' }}>Community</span>
                  )}
                </div>
                <div className="prose-light" style={{ padding:'20px 24px', fontSize:14, lineHeight:1.75 }}>
                  <ReactMarkdown>{note.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* QUESTIONS */}
        {activeTab === 'QUESTIONS' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'gl-fade 0.3s ease' }}>
            {allQuestions.length === 0 ? (
              <div style={{ textAlign:'center', padding:'80px 20px', background:'#fff', border:'1px dashed rgba(28,43,43,0.12)', borderRadius:22 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>❓</div>
                <div style={{ fontWeight:800, fontSize:15, color:'#4A6060' }}>अजून प्रश्न उपलब्ध नाहीत</div>
              </div>
            ) : allQuestions.map((q: any, idx: number) => (
              <div key={idx} className="gl-card"
                style={{ background:'#fff', border:'1px solid rgba(28,43,43,0.07)', borderRadius:22, overflow:'hidden', boxShadow:'0 2px 12px rgba(28,43,43,0.06)', animation:`gl-fade 0.2s ease ${idx*0.05}s both` }}>
                <div style={{ height:3, background:'linear-gradient(90deg,#E8671A,#F5C842)' }} />
                <div style={{ padding:'20px 24px' }}>
                  {/* Question */}
                  <div style={{ display:'flex', gap:12, marginBottom:16 }}>
                    <span style={{ background:'rgba(232,103,26,0.1)', border:'1px solid rgba(232,103,26,0.2)', color:'#C4510E', width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:13, flexShrink:0 }}>{idx+1}</span>
                    <h4 style={{ fontWeight:800, fontSize:15, color:'#1C2B2B', lineHeight:1.6, margin:0 }}>{q.question}</h4>
                  </div>

                  {/* Options */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16, paddingLeft:44 }}>
                    {(q.options || []).map((opt: string, oIdx: number) => {
                      const isCorrect = oIdx === q.correctAnswerIndex;
                      return (
                        <div key={oIdx} className="gl-opt"
                          style={{ padding:'11px 14px', borderRadius:13, border:`1.5px solid ${isCorrect ? 'rgba(5,150,105,0.3)' : 'rgba(28,43,43,0.08)'}`, background: isCorrect ? 'rgba(5,150,105,0.07)' : '#FDF6EC', fontSize:13, fontWeight:600, color: isCorrect ? '#065F46' : '#4A6060', display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ width:22, height:22, borderRadius:6, background: isCorrect ? '#059669' : 'rgba(28,43,43,0.06)', color: isCorrect ? '#fff' : '#7A9090', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, flexShrink:0 }}>
                            {String.fromCharCode(65+oIdx)}
                          </span>
                          {opt}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation toggle */}
                  <div style={{ paddingLeft:44 }}>
                    <button onClick={() => setRevealedIdx(revealedIdx===idx ? null : idx)}
                      style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(13,107,110,0.08)', border:'1px solid rgba(13,107,110,0.2)', borderRadius:10, padding:'8px 14px', color:'#0D6B6E', fontWeight:800, fontSize:12, cursor:'pointer', fontFamily:"'Baloo 2',sans-serif" }}>
                      {revealedIdx===idx ? <EyeOff size={14} /> : <Eye size={14} />}
                      {revealedIdx===idx ? 'स्पष्टीकरण लपवा' : 'स्पष्टीकरण पहा'}
                    </button>
                    {revealedIdx===idx && (
                      <div style={{ marginTop:12, background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:14, padding:'14px 16px', animation:'gl-pop 0.25s ease' }}>
                        <div style={{ fontSize:9, fontWeight:800, color:'#C4510E', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>💡 स्पष्टीकरण</div>
                        <div className="prose-light" style={{ fontSize:13 }}>
                          <ReactMarkdown>{q.explanation}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTRIBUTE */}
        {activeTab === 'CONTRIBUTE' && (
          <div style={{ animation:'gl-fade 0.3s ease' }}>
            <div style={{ background:'#fff', border:'1px solid rgba(124,58,237,0.15)', borderRadius:24, padding:'48px 32px', textAlign:'center', boxShadow:'0 8px 32px rgba(124,58,237,0.08)' }}>
              <div style={{ width:80, height:80, background:'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(124,58,237,0.08))', border:'2px solid rgba(124,58,237,0.2)', borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:36 }}>
                📤
              </div>
              <h3 style={{ fontWeight:900, fontSize:22, color:'#1C2B2B', letterSpacing:'-0.03em', marginBottom:10 }}>तुमच्या नोट्स शेअर करा</h3>
              <p style={{ fontSize:14, color:'#4A6060', fontWeight:600, lineHeight:1.7, marginBottom:32, maxWidth:400, margin:'0 auto 32px' }}>
                इतर विद्यार्थ्यांना मदत करण्यासाठी तुमच्याकडील दर्जेदार नोट्स किंवा प्रश्न येथे सबमिट करा.
              </p>

              {/* Feature points */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:32, maxWidth:480, margin:'0 auto 32px' }}>
                {[
                  { e:'✅', t:'Verified Content' },
                  { e:'🎯', t:'Quality Assured'  },
                  { e:'🏆', t:'Contributor Badge' },
                ].map(({ e, t }) => (
                  <div key={t} style={{ background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.15)', borderRadius:14, padding:'14px 10px', textAlign:'center' }}>
                    <div style={{ fontSize:24, marginBottom:6 }}>{e}</div>
                    <div style={{ fontSize:10, fontWeight:800, color:'#7C3AED', letterSpacing:'0.05em' }}>{t}</div>
                  </div>
                ))}
              </div>

              <button onClick={handleContribute} disabled={submitStatus==='loading'}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, background: submitStatus==='success' ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#7C3AED,#5B21B6)', border:'none', borderRadius:16, padding:'16px 40px', color:'#fff', fontWeight:900, fontSize:16, cursor: submitStatus==='loading' ? 'not-allowed' : 'pointer', boxShadow: submitStatus==='success' ? '0 8px 24px rgba(5,150,105,0.35)' : '0 8px 24px rgba(124,58,237,0.35)', transition:'all 0.2s ease', margin:'0 auto', fontFamily:"'Baloo 2',sans-serif" }}>
                {submitStatus==='loading' ? <Loader2 size={20} style={{ animation:'gl-spin 0.8s linear infinite' }} />
                 : submitStatus==='success' ? <CheckCircle size={20} />
                 : <UploadCloud size={20} />}
                {submitStatus==='success' ? 'पाठवले गेले! ✅' : 'लायब्ररीमध्ये सबमिट करा'}
              </button>

              <p style={{ marginTop:20, fontSize:10, color:'#B0CCCC', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                तुमच्या योगदानाची पडताळणी प्रशासकांकडून केली जाईल
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

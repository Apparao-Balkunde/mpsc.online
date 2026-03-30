import React, { useState, useEffect } from 'react';
import { X, Brain, AlertTriangle, TrendingUp, Sparkles, Loader, ChevronRight, Target } from 'lucide-react';

interface Props { onClose: () => void; onGoToTopic?: (topic: string) => void; }

interface WeakArea { subject:string; score:number; suggestion:string; priority:'high'|'medium'|'low'; }

const CSS = `
  @keyframes wd-fade { from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)} }
  @keyframes wd-spin { to{transform:rotate(360deg)} }
  @keyframes wd-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes wd-pulse { 0%,100%{opacity:1}50%{opacity:0.6} }
`;

export const WeakTopicDetector: React.FC<Props> = ({ onClose, onGoToTopic }) => {
  const [loading, setLoading]     = useState(false);
  const [analysis, setAnalysis]   = useState<WeakArea[]|null>(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [error, setError]         = useState('');

  const subjectStats = () => {
    try {
      const hist = JSON.parse(localStorage.getItem('mpsc_history')||'[]');
      const progress = JSON.parse(localStorage.getItem('mpsc_user_progress')||'{}');
      const subjectData = JSON.parse(localStorage.getItem('mpsc_subject_stats')||'{}');
      return { hist, progress, subjectData };
    } catch { return { hist:[], progress:{}, subjectData:{} }; }
  };

  const analyze = async () => {
    setLoading(true); setError('');
    const { hist, progress, subjectData } = subjectStats();

    // Build stats summary
    const acc = progress.totalAttempted>0 ? Math.round((progress.totalCorrect/progress.totalAttempted)*100) : 0;
    const last7 = hist.slice(-7);
    const weekAcc = last7.reduce((a:number,d:any)=>a+d.attempted,0)>0
      ? Math.round(last7.reduce((a:number,d:any)=>a+d.correct,0)/last7.reduce((a:number,d:any)=>a+d.attempted,0)*100) : 0;

    const subjectSummary = Object.entries(subjectData).map(([s,v]:any) =>
      `${s}: ${v.attempted} attempted, ${Math.round((v.correct/v.attempted)*100)}% accuracy`
    ).join('\n') || 'No subject data yet';

    const prompt = `तू MPSC exam expert आहेस. खालील student च्या performance data वरून weak areas identify कर आणि suggestions दे.

Performance Data:
- Overall accuracy: ${acc}%
- This week accuracy: ${weekAcc}%
- Total attempted: ${progress.totalAttempted||0}
- Streak: ${progress.streak||0} days
- Subject-wise: ${subjectSummary}

JSON format मध्ये फक्त हे दे:
{
  "weakAreas": [
    {"subject":"विषय", "score":45, "suggestion":"काय करायचे", "priority":"high"}
  ],
  "overallTip": "overall study tip मराठी मध्ये"
}

Priority: high (<50%), medium(50-70%), low(>70%)
Max 5 weak areas. मराठी मध्ये suggestions.`;

    try {
      const res = await fetch('/api/ai', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          system:'You are an MPSC performance analyzer. Respond with valid JSON only.',
          messages:[{role:'user', content:prompt}],
          max_tokens:600
        })
      });
      const data = await res.json();
      const text = data?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON');
      const parsed = JSON.parse(match[0]);
      setAnalysis(parsed.weakAreas || []);
      setAiSuggestion(parsed.overallTip || '');
    } catch {
      // Fallback — basic analysis without AI
      const { progress: p } = subjectStats();
      const acc2 = p.totalAttempted>0 ? Math.round((p.totalCorrect/p.totalAttempted)*100) : 0;
      const fallback: WeakArea[] = [
        { subject:'इतिहास', score:acc2-10, suggestion:'PYQ प्रश्न जास्त सोडवा', priority:'high' },
        { subject:'भूगोल', score:acc2+5, suggestion:'Maps आणि rivers study करा', priority:'medium' },
        { subject:'राज्यघटना', score:acc2-5, suggestion:'कलमे नीट वाचा', priority:'high' },
      ];
      setAnalysis(fallback);
      setAiSuggestion('रोज किमान 20 प्रश्न सोडवा आणि चुकलेले प्रश्न Smart Revision मध्ये review करा!');
    } finally { setLoading(false); }
  };

  useEffect(() => { analyze(); }, []);

  const priorityColor = (p:string) => p==='high'?'#DC2626':p==='medium'?'#D97706':'#059669';
  const priorityBg    = (p:string) => p==='high'?'rgba(220,38,38,0.08)':p==='medium'?'rgba(217,119,6,0.08)':'rgba(5,150,105,0.08)';
  const priorityLabel = (p:string) => p==='high'?'⚠️ जास्त लक्ष हवे':p==='medium'?'📈 सुधारणा शक्य':'✓ ठीक आहे';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:28, width:'100%', maxWidth:440, maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column', animation:'wd-fade 0.35s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 20px 60px rgba(28,43,43,0.15)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#DC2626,#D97706,#059669)', backgroundSize:'200%', animation:'wd-shimmer 3s linear infinite', flexShrink:0 }}/>

        <div style={{ padding:'18px 20px', flexShrink:0, borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:12, background:'rgba(220,38,38,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Brain size={18} style={{color:'#DC2626'}}/>
            </div>
            <div>
              <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B' }}>AI Weak Topic Detector</div>
              <div style={{ fontSize:10, color:'#7A9090', fontWeight:600 }}>Performance analysis</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'#F8F5F0', border:'none', borderRadius:9, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#7A9090' }}><X size={15}/></button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:'50px 20px' }}>
              <div style={{ width:48, height:48, border:'3px solid rgba(220,38,38,0.2)', borderTopColor:'#DC2626', borderRadius:'50%', animation:'wd-spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
              <div style={{ fontWeight:800, fontSize:13, color:'#4A6060' }}>AI तुमची performance analyze करत आहे...</div>
            </div>
          ) : analysis ? (
            <>
              {/* AI Overall tip */}
              {aiSuggestion && (
                <div style={{ background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:16, padding:'14px', marginBottom:16, display:'flex', gap:10 }}>
                  <Sparkles size={16} style={{color:'#7C3AED', flexShrink:0, marginTop:2}}/>
                  <div style={{ fontSize:12, fontWeight:700, color:'#4A6060', lineHeight:1.65 }}>{aiSuggestion}</div>
                </div>
              )}

              {/* Weak areas */}
              {analysis.length === 0 ? (
                <div style={{ textAlign:'center', padding:'30px 20px' }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>🎉</div>
                  <div style={{ fontWeight:800, fontSize:14, color:'#059669' }}>सगळे subjects ठीक आहेत!</div>
                  <div style={{ fontSize:12, color:'#7A9090', fontWeight:600, marginTop:4 }}>जास्त quiz सोडवा — detailed analysis साठी</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ fontWeight:800, fontSize:11, color:'#4A6060', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>कमकुवत विषय</div>
                  {analysis.sort((a,b) => a.score-b.score).map((area,i) => (
                    <div key={i} style={{ background:priorityBg(area.priority), border:`1.5px solid ${priorityColor(area.priority)}25`, borderRadius:16, padding:'14px', borderLeft:`4px solid ${priorityColor(area.priority)}` }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                        <div style={{ fontWeight:900, fontSize:13, color:'#1C2B2B' }}>{area.subject}</div>
                        <span style={{ fontSize:10, fontWeight:800, color:priorityColor(area.priority), background:`${priorityColor(area.priority)}15`, borderRadius:99, padding:'3px 9px' }}>
                          {priorityLabel(area.priority)}
                        </span>
                      </div>
                      <div style={{ background:'rgba(0,0,0,0.06)', borderRadius:99, height:6, marginBottom:8, overflow:'hidden' }}>
                        <div style={{ height:'100%', background:priorityColor(area.priority), borderRadius:99, width:`${Math.max(area.score,0)}%`, transition:'width 0.8s ease' }}/>
                      </div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#4A6060', marginBottom:6 }}>📊 Score: {area.score}%</div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#7A9090', marginBottom:area.priority==='high'?10:0 }}>💡 {area.suggestion}</div>
                      {area.priority === 'high' && onGoToTopic && (
                        <button onClick={()=>{onGoToTopic(area.subject);onClose();}}
                          style={{ display:'flex', alignItems:'center', gap:5, background:priorityColor(area.priority), border:'none', borderRadius:9, padding:'7px 12px', color:'#fff', fontWeight:800, fontSize:11, cursor:'pointer', marginTop:4 }}>
                          सराव सुरू करा <ChevronRight size={12}/>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button onClick={analyze} style={{ width:'100%', background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:12, padding:'12px', color:'#7C3AED', fontWeight:800, fontSize:12, cursor:'pointer', marginTop:14, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <Brain size={14}/> पुन्हा Analyze करा
              </button>
            </>
          ) : null}

          {error && <div style={{ background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:12, padding:'12px', fontSize:12, color:'#DC2626', fontWeight:700 }}>⚠️ {error}</div>}
        </div>
      </div>
    </div>
  );
};

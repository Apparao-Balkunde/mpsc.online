import React, { useState, useEffect, useRef } from 'react';
import { Trophy, X, Clock, ChevronRight, BarChart2, CheckCircle, XCircle, Loader } from 'lucide-react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes mt-fade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .mt-card { animation: mt-fade 0.3s ease; }
  .mt-opt:hover { transform: translateX(3px); }
  .mt-opt { transition: all 0.15s; }
`;

const TEST_PAPERS = [
  { id:1, title:'MPSC Prelims 2024 — Paper 1', subject:'General Studies', questions:100, duration:120, difficulty:'Hard', attempted: true, score: 72 },
  { id:2, title:'MPSC Prelims 2023 — Paper 1', subject:'General Studies', questions:100, duration:120, difficulty:'Hard', attempted: false },
  { id:3, title:'राज्यव्यवस्था Mock Test', subject:'Polity', questions:50, duration:60, difficulty:'Medium', attempted: false },
  { id:4, title:'भूगोल Mock Test', subject:'Geography', questions:50, duration:60, difficulty:'Medium', attempted: false },
  { id:5, title:'इतिहास Mock Test', subject:'History', questions:50, duration:60, difficulty:'Medium', attempted: true, score: 38 },
  { id:6, title:'चालू घडामोडी — Q1 2025', subject:'Current Affairs', questions:40, duration:45, difficulty:'Easy', attempted: false },
];

const SAMPLE_QUESTIONS = [
  { id:1, question:'भारतीय राज्यघटनेत मूलभूत हक्क कोणत्या भागात आहेत?', options:['भाग II','भाग III','भाग IV','भाग V'], correct:1, explanation:'भाग III (अनुच्छेद 12-35) मध्ये मूलभूत हक्क आहेत.' },
  { id:2, question:'महाराष्ट्राची स्थापना कधी झाली?', options:['1 मे 1960','26 जानेवारी 1960','15 ऑगस्ट 1960','1 नोव्हेंबर 1960'], correct:0, explanation:'1 मे 1960 रोजी महाराष्ट्र राज्याची स्थापना झाली. हा दिवस "महाराष्ट्र दिन" म्हणून साजरा केला जातो.' },
  { id:3, question:'सर्वोच्च न्यायालयाचे मुख्य न्यायाधीश कोण नेमतात?', options:['पंतप्रधान','राष्ट्रपती','संसद','उपराष्ट्रपती'], correct:1, explanation:'भारताचे राष्ट्रपती सर्वोच्च न्यायालयाच्या मुख्य न्यायाधीशांची नेमणूक करतात.' },
  { id:4, question:'पंचायती राजशी संबंधित कोणते घटनादुरुस्ती आहे?', options:['71 वी','73 वी','74 वी','75 वी'], correct:1, explanation:'73 वी घटनादुरुस्ती 1992 — पंचायती राज व्यवस्था घटनात्मक मान्यता मिळाली.' },
  { id:5, question:'गोदावरी नदीचे उगमस्थान कोठे आहे?', options:['महाबळेश्वर','त्र्यंबकेश्वर','नाशिक','पुणे'], correct:1, explanation:'गोदावरी नदी नाशिक जिल्ह्यातील त्र्यंबकेश्वर येथून उगम पावते.' },
];

type TestState = 'list'|'instructions'|'test'|'result';

export function MockTestSeries({ onClose }: { onClose: () => void }) {
  const [testState, setTestState] = useState<TestState>('list');
  const [currentTest, setCurrentTest] = useState<typeof TEST_PAPERS[0]|null>(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number,number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (testState === 'test' && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => { if(t<=1){clearInterval(timerRef.current);setTestState('result');return 0;} return t-1; }), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [testState]);

  const startTest = (paper: typeof TEST_PAPERS[0]) => {
    setCurrentTest(paper);
    setTestState('instructions');
  };

  const beginTest = () => {
    setAnswers({});
    setCurrentQIdx(0);
    setShowExplanation(false);
    setTimeLeft(SAMPLE_QUESTIONS.length * 72); // 72 sec per question
    setTestState('test');
  };

  const selectAnswer = (optIdx: number) => {
    if (answers[currentQIdx] !== undefined) return;
    setAnswers(prev => ({ ...prev, [currentQIdx]: optIdx }));
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQIdx + 1 >= SAMPLE_QUESTIONS.length) {
      clearInterval(timerRef.current);
      setTestState('result');
    } else {
      setCurrentQIdx(i=>i+1);
      setShowExplanation(false);
    }
  };

  const score = Object.entries(answers).filter(([i,a]) => SAMPLE_QUESTIONS[+i].correct === a).length;
  const q = SAMPLE_QUESTIONS[currentQIdx];
  const fmt = (s:number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const DiffBadge = ({ d }: { d:string }) => {
    const c = d==='Hard'?'#EF4444':d==='Medium'?'#F59E0B':'#10B981';
    return <span style={{ fontSize:10, fontWeight:800, color:c, background:`${c}15`, padding:'2px 8px', borderRadius:10 }}>{d}</span>;
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && testState==='list' && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:520, maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 64px rgba(28,43,43,0.2)' }}>

        <div style={{ background:'linear-gradient(135deg,#F59E0B,#D97706)', padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Trophy size={22} color="#fff"/>
            <div>
              <div style={{ color:'#fff', fontWeight:900, fontSize:17 }}>Mock Test Series</div>
              <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:600 }}>Complete Prelims Papers</div>
            </div>
          </div>
          {testState !== 'test' && (
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:32, height:32, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
          )}
          {testState === 'test' && (
            <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:12, padding:'6px 14px', display:'flex', alignItems:'center', gap:6 }}>
              <Clock size={14} color="#fff"/>
              <span style={{ color:'#fff', fontWeight:900, fontSize:15, fontFamily:'monospace' }}>{fmt(timeLeft)}</span>
            </div>
          )}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:16 }}>

          {testState === 'list' && (
            <>
              <div style={{ background:'linear-gradient(135deg,#FFFBEB,#FEF3C7)', borderRadius:14, padding:14, marginBottom:16, border:'1.5px solid rgba(245,158,11,0.2)' }}>
                <div style={{ fontWeight:800, fontSize:13, color:'#92400E' }}>📊 तुमची Stats</div>
                <div style={{ display:'flex', gap:20, marginTop:8 }}>
                  {[['Tests Attempted','2'],['Average Score','55%'],['Best Score','72%']].map(([k,v]) => (
                    <div key={k} style={{ textAlign:'center' }}>
                      <div style={{ fontWeight:900, fontSize:20, color:'#D97706' }}>{v}</div>
                      <div style={{ fontSize:10, color:'#92400E', fontWeight:700 }}>{k}</div>
                    </div>
                  ))}
                </div>
              </div>
              {TEST_PAPERS.map(paper => (
                <div key={paper.id} className="mt-card"
                  style={{ background: paper.attempted ? '#F0FDF4' : '#FDF6EC', borderRadius:16, padding:14, marginBottom:10, border:`1.5px solid ${paper.attempted ? 'rgba(16,185,129,0.2)' : 'rgba(28,43,43,0.07)'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:14, color:'#1C2B2B', marginBottom:4 }}>{paper.title}</div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <DiffBadge d={paper.difficulty}/>
                        <span style={{ fontSize:10, color:'#7A9090', fontWeight:700 }}>📝 {paper.questions} Q</span>
                        <span style={{ fontSize:10, color:'#7A9090', fontWeight:700 }}>⏱️ {paper.duration} min</span>
                      </div>
                    </div>
                    {paper.attempted && paper.score && (
                      <div style={{ textAlign:'center', background:'rgba(16,185,129,0.1)', borderRadius:10, padding:'4px 10px' }}>
                        <div style={{ fontWeight:900, fontSize:16, color:'#059669' }}>{paper.score}%</div>
                        <div style={{ fontSize:9, color:'#059669', fontWeight:700 }}>Score</div>
                      </div>
                    )}
                  </div>
                  <button onClick={() => startTest(paper)}
                    style={{ width:'100%', background: paper.attempted ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg,#F59E0B,#D97706)', border:'none', borderRadius:12, padding:'10px', color: paper.attempted ? '#059669' : '#fff', fontWeight:800, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    {paper.attempted ? '🔄 पुन्हा द्या' : '▶️ Test सुरू करा'} <ChevronRight size={14}/>
                  </button>
                </div>
              ))}
            </>
          )}

          {testState === 'instructions' && currentTest && (
            <div>
              <h3 style={{ fontWeight:900, fontSize:18, color:'#1C2B2B', margin:'0 0 16px' }}>{currentTest.title}</h3>
              {[
                '✅ एकूण 5 प्रश्न (Demo mode — full test येणार लवकरच)',
                '⏱️ प्रत्येक प्रश्नासाठी 72 सेकंद',
                '✔️ प्रत्येक बरोबर उत्तरासाठी 2 गुण',
                '❌ प्रत्येक चुकीच्या उत्तरासाठी -0.5 गुण (Negative Marking)',
                '📖 प्रत्येक प्रश्नानंतर explanation दिसेल',
                '🚫 Test सुरू झाल्यावर बाहेर जाता येणार नाही',
              ].map((rule,i) => (
                <div key={i} style={{ background:'#FDF6EC', borderRadius:10, padding:'10px 14px', marginBottom:8, fontSize:13, fontWeight:600, color:'#374151' }}>{rule}</div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button onClick={() => setTestState('list')} style={{ flex:1, background:'#F5F0E8', border:'none', borderRadius:12, padding:'12px', color:'#7A9090', fontWeight:800, fontSize:13, cursor:'pointer' }}>← मागे</button>
                <button onClick={beginTest} style={{ flex:2, background:'linear-gradient(135deg,#F59E0B,#D97706)', border:'none', borderRadius:12, padding:'12px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer' }}>Test सुरू करा ▶️</button>
              </div>
            </div>
          )}

          {testState === 'test' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:800, color:'#7A9090' }}>प्रश्न {currentQIdx+1}/{SAMPLE_QUESTIONS.length}</span>
                <span style={{ fontSize:11, fontWeight:800, color:'#F59E0B' }}>Score: {score}/{currentQIdx}</span>
              </div>
              <div style={{ height:4, background:'#F5F0E8', borderRadius:2, marginBottom:14 }}>
                <div style={{ height:'100%', background:'#F59E0B', width:`${((currentQIdx)/SAMPLE_QUESTIONS.length)*100}%`, borderRadius:2 }}/>
              </div>
              <div style={{ background:'linear-gradient(135deg,#FFFBEB,#FEF3C7)', borderRadius:16, padding:18, marginBottom:14, border:'1.5px solid rgba(245,158,11,0.2)' }}>
                <p style={{ fontWeight:800, fontSize:15, color:'#1C2B2B', margin:0, lineHeight:1.5 }}>{q.question}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
                {q.options.map((opt, i) => {
                  const answered = answers[currentQIdx] !== undefined;
                  const isSelected = answers[currentQIdx] === i;
                  const isCorrect = q.correct === i;
                  let bg='#FDF6EC', border='rgba(28,43,43,0.1)', color='#1C2B2B';
                  if (answered) {
                    if (isCorrect) { bg='rgba(16,185,129,0.1)'; border='#10B981'; color='#059669'; }
                    else if (isSelected) { bg='rgba(220,38,38,0.08)'; border='#EF4444'; color='#DC2626'; }
                  }
                  return (
                    <button key={i} onClick={() => selectAnswer(i)} className="mt-opt"
                      style={{ background:bg, border:`2px solid ${border}`, borderRadius:12, padding:'13px 16px', textAlign:'left', color, fontWeight:700, fontSize:13, cursor:answered?'default':'pointer', display:'flex', alignItems:'center', gap:10, fontFamily:"'Baloo 2',sans-serif" }}>
                      <span style={{ fontWeight:900, width:22, height:22, background:border==='rgba(28,43,43,0.1)'?'rgba(28,43,43,0.06)':border+'20', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0, color }}>
                        {['A','B','C','D'][i]}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {showExplanation && (
                <div style={{ background:'rgba(59,130,246,0.06)', borderRadius:12, padding:12, marginBottom:12, border:'1.5px solid rgba(59,130,246,0.2)' }}>
                  <div style={{ fontWeight:800, fontSize:12, color:'#3B82F6', marginBottom:4 }}>💡 Explanation</div>
                  <p style={{ fontSize:12, color:'#374151', fontWeight:600, margin:0, lineHeight:1.5 }}>{q.explanation}</p>
                </div>
              )}
              {answers[currentQIdx] !== undefined && (
                <button onClick={nextQuestion}
                  style={{ width:'100%', background:'linear-gradient(135deg,#F59E0B,#D97706)', border:'none', borderRadius:12, padding:'13px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer' }}>
                  {currentQIdx+1 >= SAMPLE_QUESTIONS.length ? '📊 Result पहा' : 'पुढील प्रश्न →'}
                </button>
              )}
            </div>
          )}

          {testState === 'result' && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:60, marginBottom:12 }}>{score >= 4 ? '🏆' : score >= 2 ? '😊' : '💪'}</div>
              <h2 style={{ fontWeight:900, fontSize:26, color:'#1C2B2B', margin:'0 0 4px' }}>{score}/{SAMPLE_QUESTIONS.length}</h2>
              <p style={{ color:'#7A9090', fontSize:14, fontWeight:700, margin:'0 0 20px' }}>{Math.round((score/SAMPLE_QUESTIONS.length)*100)}% Accuracy</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20 }}>
                {[['✅ बरोबर',score,'#10B981'],['❌ चुकीचे',SAMPLE_QUESTIONS.length-score,'#EF4444'],['⏭️ Skip',0,'#7A9090']].map(([l,v,c]) => (
                  <div key={l as string} style={{ background:`${c as string}10`, borderRadius:12, padding:12 }}>
                    <div style={{ fontWeight:900, fontSize:22, color:c as string }}>{v as number}</div>
                    <div style={{ fontSize:10, color:c as string, fontWeight:700 }}>{l as string}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => { setTestState('list'); setCurrentTest(null); }} style={{ flex:1, background:'#F5F0E8', border:'none', borderRadius:12, padding:'12px', color:'#7A9090', fontWeight:800, fontSize:13, cursor:'pointer' }}>← List</button>
                <button onClick={beginTest} style={{ flex:2, background:'linear-gradient(135deg,#F59E0B,#D97706)', border:'none', borderRadius:12, padding:'12px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer' }}>🔄 पुन्हा द्या</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

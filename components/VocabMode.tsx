import { updateProgress } from '../App';
import { addXP } from './xpSystem';
import React, { useState, useEffect } from 'react';
import { BookOpen, X, RefreshCw, Check, ChevronRight, Star } from 'lucide-react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes vb-flip { 0%{transform:rotateY(0deg)} 50%{transform:rotateY(90deg)} 100%{transform:rotateY(0deg)} }
  @keyframes vb-pop { 0%{transform:scale(0.9);opacity:0} 100%{transform:scale(1);opacity:1} }
  .vb-card { animation: vb-pop 0.3s ease; }
  .vb-word-card { transition: all 0.2s ease; cursor:pointer; }
  .vb-word-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(28,43,43,0.15) !important; }
`;

const DAILY_WORDS = [
  { word: 'Sovereign', marathi: 'सार्वभौम', meaning: 'स्वतंत्र सत्ता असलेले; कोणाच्याही अधिपत्याखाली नसलेले', example: 'India is a sovereign democratic republic.' },
  { word: 'Secularism', marathi: 'धर्मनिरपेक्षता', meaning: 'राज्य कोणत्याही धर्माची बाजू घेत नाही', example: 'Secularism is a basic feature of the Constitution.' },
  { word: 'Federalism', marathi: 'संघराज्यवाद', meaning: 'केंद्र व राज्य यांच्यात सत्तेचे विभाजन', example: 'India has a quasi-federal structure.' },
  { word: 'Preamble', marathi: 'प्रस्तावना', meaning: 'राज्यघटनेची सुरुवातीची ओळख करून देणारी भूमिका', example: 'The Preamble describes the ideals of the Constitution.' },
  { word: 'Ordinance', marathi: 'अध्यादेश', meaning: 'संसद सत्र नसताना राष्ट्रपतींनी जारी केलेला कायदा', example: 'The President promulgated an ordinance.' },
  { word: 'Jurisdiction', marathi: 'अधिकारक्षेत्र', meaning: 'न्यायालय किंवा अधिकाऱ्याचे कायदेशीर अधिकार', example: 'This case is under the Supreme Court jurisdiction.' },
  { word: 'Incumbent', marathi: 'विद्यमान', meaning: 'सध्या पदावर असलेली व्यक्ती', example: 'The incumbent Chief Minister addressed the press.' },
  { word: 'Bicameral', marathi: 'द्विसदनी', meaning: 'दोन सभागृहे असलेली संसद', example: 'India has a bicameral parliament.' },
  { word: 'Impeachment', marathi: 'महाभियोग', meaning: 'उच्च अधिकाऱ्यांवर चालवण्यात येणारी महाखटल्याची प्रक्रिया', example: 'Impeachment of the President requires special majority.' },
  { word: 'Referendum', marathi: 'सार्वमत', meaning: 'एखाद्या विषयावर जनतेचे थेट मत घेणे', example: 'Brexit was decided by a referendum.' },
];

type QuizState = 'learning' | 'quiz' | 'result';

export function VocabBuilder({ onClose }: { onClose: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>('learning');
  const [quizIdx, setQuizIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string|null>(null);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [learned, setLearned] = useState<Set<number>>(new Set());

  const today = new Date().toDateString();
  const savedKey = `vocab_learned_${today}`;
  useEffect(() => {
    const saved = localStorage.getItem(savedKey);
    if (saved) setLearned(new Set(JSON.parse(saved)));
  }, []);

  const markLearned = (idx: number) => {
    const newSet = new Set(learned).add(idx);
    setLearned(newSet);
    localStorage.setItem(savedKey, JSON.stringify([...newSet]));
  };

  const generateQuizOptions = (correctWord: typeof DAILY_WORDS[0]) => {
    const wrong = DAILY_WORDS
      .filter(w => w.word !== correctWord.word)
      .sort(() => Math.random()-0.5)
      .slice(0,3)
      .map(w => w.marathi);
    const opts = [...wrong, correctWord.marathi].sort(() => Math.random()-0.5);
    setQuizOptions(opts);
    setSelectedOpt(null);
  };

  const startQuiz = () => {
    setQuizState('quiz');
    setQuizIdx(0);
    setScore(0);
    generateQuizOptions(DAILY_WORDS[0]);
  };

  const handleAnswer = (opt: string) => {
    if (selectedOpt) return;
    setSelectedOpt(opt);
    if (opt === DAILY_WORDS[quizIdx].marathi) setScore(s => s+1);
    setTimeout(() => {
      if (quizIdx+1 >= DAILY_WORDS.length) { setQuizState('result'); return; }
      setQuizIdx(i => i+1);
      generateQuizOptions(DAILY_WORDS[quizIdx+1]);
    }, 1200);
  };

  const word = DAILY_WORDS[currentIdx];
  const quizWord = DAILY_WORDS[quizIdx];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,43,43,0.55)', backdropFilter:'blur(8px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:480, maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 64px rgba(28,43,43,0.2)' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#8B5CF6,#6D28D9)', padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <BookOpen size={22} color="#fff"/>
            <div>
              <div style={{ color:'#fff', fontWeight:900, fontSize:17 }}>Vocabulary Builder</div>
              <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, fontWeight:600 }}>Daily 10 Words + Quiz</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ background:'rgba(255,255,255,0.2)', color:'#fff', fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:20 }}>📅 आजचे शब्द</span>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:32, height:32, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height:4, background:'#F5F0E8' }}>
          <div style={{ height:'100%', background:'#8B5CF6', width:`${(learned.size/10)*100}%`, transition:'width 0.5s ease', borderRadius:2 }}/>
        </div>
        <div style={{ padding:'8px 16px', fontSize:11, fontWeight:700, color:'#7A9090', background:'#FDF6EC', textAlign:'center' }}>
          {learned.size}/10 शब्द शिकले • आज {10-learned.size} बाकी
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:16 }}>

          {quizState === 'learning' && (
            <>
              {/* Word card */}
              <div className="vb-card" onClick={() => setShowMeaning(!showMeaning)}
                style={{ background:'linear-gradient(135deg,#F3F0FF,#EDE9FE)', borderRadius:20, padding:24, marginBottom:14, border:'2px solid rgba(139,92,246,0.2)', cursor:'pointer' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:800, color:'#8B5CF6' }}>{currentIdx+1}/10</span>
                  {learned.has(currentIdx) && <span style={{ fontSize:11, fontWeight:800, color:'#10B981', background:'rgba(16,185,129,0.1)', padding:'2px 8px', borderRadius:10 }}>✓ शिकले</span>}
                </div>
                <h2 style={{ fontWeight:900, fontSize:28, color:'#1C2B2B', margin:'0 0 4px', letterSpacing:'-0.02em' }}>{word.word}</h2>
                <p style={{ fontWeight:700, fontSize:16, color:'#8B5CF6', margin:'0 0 12px' }}>{word.marathi}</p>
                {showMeaning ? (
                  <div>
                    <p style={{ fontSize:14, color:'#374151', fontWeight:600, margin:'0 0 8px', lineHeight:1.6 }}>📖 {word.meaning}</p>
                    <p style={{ fontSize:12, color:'#6B7280', fontStyle:'italic', margin:0, fontWeight:600 }}>💬 "{word.example}"</p>
                  </div>
                ) : (
                  <p style={{ fontSize:12, color:'#7A9090', fontWeight:600, margin:0 }}>👆 tap करा — meaning पहा</p>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                <button onClick={() => { markLearned(currentIdx); if(currentIdx < 9) setCurrentIdx(i=>i+1); }}
                  style={{ flex:1, background:'linear-gradient(135deg,#10B981,#059669)', border:'none', borderRadius:12, padding:'12px', color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <Check size={15}/> शिकले ✓
                </button>
                <button onClick={() => { setShowMeaning(false); setCurrentIdx(i => i < 9 ? i+1 : 0); }}
                  style={{ flex:1, background:'rgba(139,92,246,0.1)', border:'1.5px solid rgba(139,92,246,0.2)', borderRadius:12, padding:'12px', color:'#8B5CF6', fontWeight:800, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <ChevronRight size={15}/> पुढे
                </button>
              </div>

              {/* Word list */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                {DAILY_WORDS.map((w,i) => (
                  <button key={i} onClick={() => { setCurrentIdx(i); setShowMeaning(false); }}
                    className="vb-word-card"
                    style={{ background: learned.has(i) ? 'rgba(16,185,129,0.08)' : i===currentIdx ? 'rgba(139,92,246,0.1)' : '#FDF6EC',
                      border:`1.5px solid ${learned.has(i) ? 'rgba(16,185,129,0.3)' : i===currentIdx ? 'rgba(139,92,246,0.3)' : 'rgba(28,43,43,0.08)'}`,
                      borderRadius:10, padding:'8px 12px', textAlign:'left', cursor:'pointer' }}>
                    <div style={{ fontWeight:800, fontSize:12, color: learned.has(i) ? '#059669' : '#1C2B2B' }}>
                      {learned.has(i) ? '✓ ' : ''}{w.word}
                    </div>
                    <div style={{ fontSize:10, color:'#8B5CF6', fontWeight:700 }}>{w.marathi}</div>
                  </button>
                ))}
              </div>

              <button onClick={startQuiz}
                style={{ width:'100%', background:'linear-gradient(135deg,#8B5CF6,#6D28D9)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Star size={17}/> Quiz सुरू करा
              </button>
            </>
          )}

          {quizState === 'quiz' && (
            <div>
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <p style={{ fontWeight:700, fontSize:12, color:'#7A9090', margin:'0 0 4px' }}>प्रश्न {quizIdx+1}/10 • Score: {score}</p>
                <div style={{ height:4, background:'#F5F0E8', borderRadius:2, marginTop:8 }}>
                  <div style={{ height:'100%', background:'#8B5CF6', width:`${((quizIdx)/10)*100}%`, borderRadius:2, transition:'width 0.3s' }}/>
                </div>
              </div>
              <div className="vb-card" style={{ background:'linear-gradient(135deg,#F3F0FF,#EDE9FE)', borderRadius:20, padding:24, textAlign:'center', marginBottom:16 }}>
                <p style={{ fontWeight:700, fontSize:12, color:'#8B5CF6', margin:'0 0 8px' }}>खालील शब्दाचा मराठी अर्थ कोणता?</p>
                <h2 style={{ fontWeight:900, fontSize:32, color:'#1C2B2B', margin:0 }}>{quizWord.word}</h2>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {quizOptions.map(opt => {
                  const isCorrect = opt === quizWord.marathi;
                  const isSelected = opt === selectedOpt;
                  let bg = '#FDF6EC'; let border = 'rgba(28,43,43,0.1)'; let color = '#1C2B2B';
                  if (selectedOpt) {
                    if (isCorrect) { bg = 'rgba(16,185,129,0.1)'; border = '#10B981'; color = '#059669'; }
                    else if (isSelected) { bg = 'rgba(220,38,38,0.08)'; border = '#EF4444'; color = '#DC2626'; }
                  }
                  return (
                    <button key={opt} onClick={() => handleAnswer(opt)}
                      style={{ background:bg, border:`2px solid ${border}`, borderRadius:12, padding:'14px 10px', color, fontWeight:800, fontSize:13, cursor:selectedOpt ? 'default' : 'pointer', transition:'all 0.2s', fontFamily:"'Baloo 2',sans-serif" }}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {quizState === 'result' && (
            <div style={{ textAlign:'center', padding:20 }}>
              <div style={{ fontSize:60, marginBottom:16 }}>{score >= 8 ? '🏆' : score >= 5 ? '😊' : '💪'}</div>
              <h2 style={{ fontWeight:900, fontSize:24, color:'#1C2B2B', margin:'0 0 8px' }}>{score}/10 बरोबर!</h2>
              <p style={{ color:'#7A9090', fontWeight:600, fontSize:14, margin:'0 0 24px' }}>
                {score >= 8 ? 'शाब्बास! उत्कृष्ट performance!' : score >= 5 ? 'चांगला प्रयत्न! अजून सराव करा.' : 'सराव करत रहा. तुम्ही नक्की सुधारणार!'}
              </p>
              <div style={{ background:'#F3F0FF', borderRadius:16, padding:16, marginBottom:20 }}>
                <div style={{ fontWeight:900, fontSize:28, color:'#8B5CF6' }}>{score*10}%</div>
                <div style={{ fontSize:12, color:'#7A9090', fontWeight:700 }}>accuracy</div>
              </div>
              <button onClick={()=>{const p=Math.round((score/DAILY_WORDS.length)*100);const t=`📖 MPSC Vocab Builder!\n\n${score}/${DAILY_WORDS.length} · ${p}%\nशब्दसंग्रह सराव चालू आहे!\nmpscsarathi.online`;window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank');}} style={{display:'block',width:'100%',background:'linear-gradient(135deg,#25D366,#128C7E)',border:'none',borderRadius:14,padding:'13px',color:'#fff',fontWeight:900,fontSize:14,cursor:'pointer',marginBottom:8}}>📤 WhatsApp Share</button>
              <button onClick={() => { setQuizState('learning'); setCurrentIdx(0); setLearned(new Set()); }}
                style={{ width:'100%', background:'linear-gradient(135deg,#8B5CF6,#6D28D9)', border:'none', borderRadius:14, padding:'14px', color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <RefreshCw size={15}/> पुन्हा सराव करा
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

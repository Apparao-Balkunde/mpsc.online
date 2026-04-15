import React, { useState, useEffect } from 'react';
import { addXP } from './xpSystem';
import { updateProgress } from '../App';
import { ArrowLeft, Newspaper, Zap, CheckCircle, XCircle, RefreshCw, Loader, Share2, BookMarked } from 'lucide-react';

interface Props { onBack: () => void; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes ntq-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ntq-spin { to{transform:rotate(360deg)} }
  @keyframes ntq-pop  { 0%{transform:scale(0.85);opacity:0} 60%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
  @keyframes ntq-correct { 0%{box-shadow:0 0 0 0 rgba(5,150,105,0.5)} 100%{box-shadow:0 0 0 16px rgba(5,150,105,0)} }
  @keyframes ntq-wrong   { 0%{box-shadow:0 0 0 0 rgba(220,38,38,0.5)} 100%{box-shadow:0 0 0 16px rgba(220,38,38,0)} }
  .ntq-opt { transition: all 0.18s ease; cursor: pointer; }
  .ntq-opt:hover { transform: translateX(4px); }
  .ntq-card { animation: ntq-fade 0.35s ease; }
`;

// Sample news topics — real app मध्ये /api/ai ने generate होईल
const NEWS_TOPICS = [
  { headline: 'RBI ने Repo Rate 6.5% वर ठेवला', category: 'अर्थव्यवस्था', tags: ['RBI', 'monetary policy', 'inflation'] },
  { headline: 'महाराष्ट्रात नवीन जल धोरण जाहीर', category: 'महाराष्ट्र', tags: ['water policy', 'irrigation', 'dams'] },
  { headline: 'ISRO चे नवीन satellite launch यशस्वी', category: 'विज्ञान-तंत्रज्ञान', tags: ['ISRO', 'space', 'satellite'] },
  { headline: 'PM KISAN योजनेचा 17वा हप्ता जाहीर', category: 'कृषी', tags: ['PM KISAN', 'agriculture', 'subsidy'] },
  { headline: 'सर्वोच्च न्यायालयाचा नवीन निर्णय — Article 356', category: 'राज्यघटना', tags: ['President rule', 'Article 356', 'federalism'] },
  { headline: 'G20 India Presidency — मुख्य निर्णय', category: 'आंतरराष्ट्रीय', tags: ['G20', 'foreign policy', 'multilateral'] },
  { headline: 'नागपूर मेट्रो Phase-2 ला मंजुरी', category: 'महाराष्ट्र', tags: ['urban transport', 'Nagpur', 'infrastructure'] },
  { headline: 'नवीन शैक्षणिक धोरण (NEP 2020) अंमलबजावणी', category: 'शिक्षण', tags: ['NEP 2020', 'education reform', 'UGC'] },
];

interface GeneratedQ {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  mpscAngle: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const DIFF_COLOR = { Easy: '#10B981', Medium: '#F59E0B', Hard: '#EF4444' };

export const NewsToQuestion: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<'home' | 'generating' | 'quiz' | 'result'>('home');
  const [selectedTopic, setSelectedTopic] = useState<typeof NEWS_TOPICS[0] | null>(null);
  const [questions, setQuestions] = useState<GeneratedQ[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [category, setCategory] = useState('सर्व');
  const [customNews, setCustomNews] = useState('');

  const categories = ['सर्व', 'अर्थव्यवस्था', 'महाराष्ट्र', 'राज्यघटना', 'विज्ञान-तंत्रज्ञान', 'कृषी', 'आंतरराष्ट्रीय', 'शिक्षण'];
  const filtered = category === 'सर्व' ? NEWS_TOPICS : NEWS_TOPICS.filter(t => t.category === category);

  const generateFromTopic = async (topic: typeof NEWS_TOPICS[0] | string) => {
    setPhase('generating');
    const headline = typeof topic === 'string' ? topic : topic.headline;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `तू एक MPSC परीक्षा तज्ज्ञ आहेस. खालील बातमीवरून MPSC Rajyaseva परीक्षेसाठी 3 MCQ प्रश्न तयार कर.

बातमी: "${headline}"

JSON format मध्ये फक्त array द्या:
[
  {
    "question": "मराठीत प्रश्न",
    "options": ["पर्याय A", "पर्याय B", "पर्याय C", "पर्याय D"],
    "correct": 0,
    "explanation": "स्पष्टीकरण मराठीत",
    "mpscAngle": "MPSC साठी हे महत्त्वाचे का आहे - एक ओळ",
    "difficulty": "Easy/Medium/Hard"
  }
]

फक्त valid JSON array द्या, बाकी काही नाही.`,
          max_tokens: 1000,
        }),
      });
      const data = await res.json();
      const text = data.text || data.result || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed: GeneratedQ[] = JSON.parse(clean);
      setQuestions(parsed);
      setCurrentIdx(0);
      setScore(0);
      setAnswers([]);
      setSelectedOpt(null);
      setPhase('quiz');
    } catch (e) {
      // Fallback questions
      setQuestions([
        {
          question: `"${headline}" — या विषयाशी संबंधित कोणते मंत्रालय आहे?`,
          options: ['गृह मंत्रालय', 'वित्त मंत्रालय', 'कृषी मंत्रालय', 'परराष्ट्र मंत्रालय'],
          correct: 1,
          explanation: 'वित्त मंत्रालय आर्थिक धोरणे ठरवते.',
          mpscAngle: 'MPSC GS Paper 2 मध्ये सरकारी योजना येतात.',
          difficulty: 'Medium',
        },
        {
          question: `खालीलपैकी कोणते विधान "${headline.split(' ').slice(0,4).join(' ')}" बद्दल बरोबर आहे?`,
          options: ['फक्त 1 बरोबर', 'फक्त 2 बरोबर', '1 आणि 2 दोन्ही बरोबर', 'दोन्ही चुकीचे'],
          correct: 2,
          explanation: 'या विषयावर दोन्ही विधाने बरोबर आहेत.',
          mpscAngle: 'Current Affairs विभागात नेहमी येतो.',
          difficulty: 'Hard',
        },
      ]);
      setCurrentIdx(0);
      setScore(0);
      setAnswers([]);
      setSelectedOpt(null);
      setPhase('quiz');
    }
  };

  const handleAnswer = (optIdx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(optIdx);
    const correct = optIdx === questions[currentIdx].correct;
    if (correct) setScore(s => s + 1);
    setAnswers(prev => [...prev, correct]);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      setPhase('result');
    } else {
      setCurrentIdx(i => i + 1);
      setSelectedOpt(null);
    }
  };

  const q = questions[currentIdx];

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#EC4899,#BE185D)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>📰 News → Question</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600 }}>बातमीतून MPSC प्रश्न AI तयार करतो</div>
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: 520, margin: '0 auto' }}>

        {/* HOME */}
        {phase === 'home' && (
          <>
            {/* Custom news input */}
            <div style={{ background: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#1C2B2B', marginBottom: 10 }}>📝 स्वतःची बातमी टाका</div>
              <textarea
                value={customNews}
                onChange={e => setCustomNews(e.target.value)}
                placeholder="कुठलीही बातमी paste करा — AI MPSC प्रश्न बनवेल..."
                style={{ width: '100%', minHeight: 80, padding: '10px 14px', borderRadius: 12, border: '1.5px solid rgba(236,72,153,0.2)', fontSize: 13, fontFamily: "'Baloo 2',sans-serif", fontWeight: 600, resize: 'none', color: '#1C2B2B', background: '#FDF6EC', boxSizing: 'border-box' }}
              />
              <button
                onClick={() => customNews.trim() && generateFromTopic(customNews.trim())}
                disabled={!customNews.trim()}
                style={{ width: '100%', marginTop: 10, background: customNews.trim() ? 'linear-gradient(135deg,#EC4899,#BE185D)' : '#E5E7EB', border: 'none', borderRadius: 12, padding: '12px', color: '#fff', fontWeight: 900, fontSize: 14, cursor: customNews.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Zap size={15} /> AI ने प्रश्न बनवा
              </button>
            </div>

            {/* Category filter */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  style={{ padding: '4px 12px', borderRadius: 16, border: '1.5px solid', borderColor: category === c ? '#EC4899' : 'rgba(28,43,43,0.1)', background: category === c ? '#EC4899' : '#fff', color: category === c ? '#fff' : '#7A9090', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                  {c}
                </button>
              ))}
            </div>

            <div style={{ fontWeight: 800, fontSize: 13, color: '#7A9090', marginBottom: 10 }}>📋 किंवा ready topics निवडा:</div>
            {filtered.map((topic, i) => (
              <div key={i} className="ntq-card"
                onClick={() => { setSelectedTopic(topic); generateFromTopic(topic); }}
                style={{ background: '#fff', borderRadius: 16, padding: '14px', marginBottom: 10, cursor: 'pointer', border: '1.5px solid rgba(28,43,43,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.18s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#EC4899', background: 'rgba(236,72,153,0.08)', padding: '2px 8px', borderRadius: 10, marginBottom: 6, display: 'inline-block' }}>{topic.category}</span>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1C2B2B', lineHeight: 1.4 }}>{topic.headline}</div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {topic.tags.map(tag => <span key={tag} style={{ fontSize: 9, fontWeight: 700, color: '#7A9090', background: '#F5F0E8', padding: '2px 6px', borderRadius: 6 }}>#{tag}</span>)}
                    </div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg,#EC4899,#BE185D)', borderRadius: 10, padding: '8px 12px', color: '#fff', fontWeight: 900, fontSize: 11, whiteSpace: 'nowrap', marginLeft: 10 }}>
                    प्रश्न बनवा ⚡
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* GENERATING */}
        {phase === 'generating' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#EC4899,#BE185D)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 12px 32px rgba(236,72,153,0.3)' }}>
              <Loader size={36} color="#fff" style={{ animation: 'ntq-spin 0.8s linear infinite' }} />
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 20, color: '#1C2B2B', margin: '0 0 8px' }}>AI प्रश्न तयार करतोय...</h2>
            <p style={{ color: '#7A9090', fontSize: 13, fontWeight: 600 }}>बातमीतून MPSC angle शोधतोय 🔍</p>
            <div style={{ marginTop: 24, background: '#fff', borderRadius: 14, padding: '12px 16px', border: '1.5px solid rgba(236,72,153,0.15)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7A9090' }}>"{selectedTopic?.headline || customNews.slice(0, 60)}..."</div>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {phase === 'quiz' && q && (
          <div className="ntq-card">
            {/* Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#7A9090' }}>प्रश्न {currentIdx + 1}/{questions.length}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#EC4899' }}>Score: {score}/{currentIdx}</span>
            </div>
            <div style={{ height: 4, background: '#F5F0E8', borderRadius: 2, marginBottom: 16 }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,#EC4899,#BE185D)', width: `${((currentIdx) / questions.length) * 100}%`, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>

            {/* Difficulty + MPSC angle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: DIFF_COLOR[q.difficulty], background: `${DIFF_COLOR[q.difficulty]}15`, padding: '3px 10px', borderRadius: 10 }}>{q.difficulty}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#7A9090', background: '#F5F0E8', padding: '3px 10px', borderRadius: 10, flex: 1 }}>🎯 {q.mpscAngle}</span>
            </div>

            {/* Question */}
            <div style={{ background: 'linear-gradient(135deg,#FFF0F7,#FCE7F3)', borderRadius: 18, padding: 18, marginBottom: 16, border: '1.5px solid rgba(236,72,153,0.15)' }}>
              <p style={{ fontWeight: 800, fontSize: 15, color: '#1C2B2B', margin: 0, lineHeight: 1.6 }}>{q.question}</p>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {q.options.map((opt, i) => {
                const answered = selectedOpt !== null;
                const isSelected = selectedOpt === i;
                const isCorrect = q.correct === i;
                let bg = '#fff', border = 'rgba(28,43,43,0.1)', color = '#1C2B2B';
                let icon = null;
                if (answered) {
                  if (isCorrect) { bg = 'rgba(5,150,105,0.08)'; border = '#10B981'; color = '#065F46'; icon = <CheckCircle size={16} color="#10B981" />; }
                  else if (isSelected) { bg = 'rgba(220,38,38,0.07)'; border = '#EF4444'; color = '#7F1D1D'; icon = <XCircle size={16} color="#EF4444" />; }
                }
                return (
                  <div key={i} onClick={() => handleAnswer(i)} className="ntq-opt"
                    style={{ background: bg, border: `2px solid ${border}`, borderRadius: 14, padding: '13px 16px', color, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: answered ? 'default' : 'pointer', animation: answered && isCorrect ? 'ntq-correct 0.5s ease' : answered && isSelected ? 'ntq-wrong 0.5s ease' : 'none' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontWeight: 900, width: 24, height: 24, background: border === 'rgba(28,43,43,0.1)' ? '#F5F0E8' : `${border}20`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>{['A', 'B', 'C', 'D'][i]}</span>
                      {opt}
                    </div>
                    {icon}
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            {selectedOpt !== null && (
              <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 14, padding: '12px 14px', marginBottom: 14, border: '1.5px solid rgba(59,130,246,0.15)', animation: 'ntq-pop 0.3s ease' }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: '#3B82F6', marginBottom: 4 }}>💡 स्पष्टीकरण</div>
                <p style={{ fontSize: 12, color: '#374151', fontWeight: 600, margin: 0, lineHeight: 1.6 }}>{q.explanation}</p>
              </div>
            )}

            {selectedOpt !== null && (
              <button onClick={nextQuestion}
                style={{ width: '100%', background: 'linear-gradient(135deg,#EC4899,#BE185D)', border: 'none', borderRadius: 14, padding: '14px', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', animation: 'ntq-pop 0.3s ease' }}>
                {currentIdx + 1 >= questions.length ? '📊 Result पहा' : 'पुढील प्रश्न →'}
              </button>
            )}
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 16, animation: 'ntq-pop 0.5s ease' }}>
              {score === questions.length ? '🏆' : score >= questions.length / 2 ? '😊' : '💪'}
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 26, color: '#1C2B2B', margin: '0 0 6px' }}>{score}/{questions.length} बरोबर!</h2>
            <p style={{ color: '#7A9090', fontWeight: 700, fontSize: 13, margin: '0 0 24px' }}>
              {score === questions.length ? 'Excellent! बातमी पूर्ण समजली!' : score >= questions.length / 2 ? 'चांगला प्रयत्न!' : 'अजून वाचन करा 📰'}
            </p>
            <div style={{ background: 'linear-gradient(135deg,#FFF0F7,#FCE7F3)', borderRadius: 18, padding: 20, marginBottom: 20, border: '1.5px solid rgba(236,72,153,0.15)' }}>
              <div style={{ fontWeight: 900, fontSize: 32, color: '#EC4899' }}>{Math.round((score / questions.length) * 100)}%</div>
              <div style={{ fontSize: 12, color: '#BE185D', fontWeight: 700 }}>accuracy</div>
            </div>
            {/* XP earned */}
            <div style={{ background:'rgba(236,72,153,0.1)', border:'1px solid rgba(236,72,153,0.25)', borderRadius:14, padding:'10px', marginBottom:14, fontSize:14, fontWeight:900, color:'#EC4899' }}>
              +{score*5+questions.length} ⚡ XP earned!
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={()=>{const p=Math.round((score/questions.length)*100);const t=`📰 MPSC News→Quiz!\n\n${score}/${questions.length} · ${p}%\nBातमीवर आधारित MCQ!\nmpscsarathi.online`;window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank');}}
                style={{ flex:1, background:'linear-gradient(135deg,#25D366,#128C7E)', border:'none', borderRadius:14, padding:'12px', color:'#fff', fontWeight:900, cursor:'pointer' }}>📤</button>
              <button onClick={() => { setPhase('home'); setCustomNews(''); setSelectedTopic(null); }}
                style={{ flex: 1, background: '#F5F0E8', border: 'none', borderRadius: 14, padding: '12px', color: '#7A9090', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                ← नवीन
              </button>
              <button onClick={() => { setCurrentIdx(0); setScore(0); setAnswers([]); setSelectedOpt(null); setPhase('quiz'); }}
                style={{ flex: 1, background: 'linear-gradient(135deg,#EC4899,#BE185D)', border: 'none', borderRadius: 14, padding: '12px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <RefreshCw size={14} /> पुन्हा
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

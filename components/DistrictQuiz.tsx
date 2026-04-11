import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MapPin, SkipForward, Trophy, Clock, Zap } from 'lucide-react';
import { updateProgress } from '../App';
import { addXP, checkAndAwardBadges } from './xpSystem';

interface Props { onBack: () => void; }

type Difficulty = 'easy' | 'medium' | 'hard';
type Category = 'all' | 'कोकण' | 'पुणे' | 'नाशिक' | 'छत्रपती संभाजीनगर' | 'अमरावती' | 'नागपूर';

interface Question {
  q: string;
  opts: string[];
  a: number;
  fact: string;
  category: Category;
  difficulty: Difficulty;
}

const QUESTIONS: Question[] = [
  // ── EASY ──
  {q:'महाराष्ट्राची राजधानी कोणती?',opts:['पुणे','नागपूर','मुंबई','औरंगाबाद'],a:2,fact:'मुंबई — आर्थिक राजधानी; हिवाळी राजधानी नागपूर',category:'कोकण',difficulty:'easy'},
  {q:'महाराष्ट्रात एकूण किती जिल्हे आहेत?',opts:['32','34','36','38'],a:2,fact:'महाराष्ट्रात ३६ जिल्हे आहेत',category:'all' as Category,difficulty:'easy'},
  {q:'36 जिल्ह्यांचे किती विभाग आहेत?',opts:['5','6','7','8'],a:1,fact:'महाराष्ट्रात 6 विभाग — कोकण, पुणे, नाशिक, छत्रपती संभाजीनगर, अमरावती, नागपूर',category:'all' as Category,difficulty:'easy'},
  {q:'गोदावरी नदी कोणत्या जिल्ह्यातून उगम पावते?',opts:['नाशिक','पुणे','अहमदनगर','नागपूर'],a:0,fact:'गोदावरी — नाशिकजवळ त्र्यंबकेश्वर येथून उगम',category:'नाशिक',difficulty:'easy'},
  {q:'सह्याद्री पर्वतरांगा महाराष्ट्राच्या कोणत्या दिशेला आहे?',opts:['पूर्व','पश्चिम','उत्तर','दक्षिण'],a:1,fact:'सह्याद्री — महाराष्ट्राच्या पश्चिमेला, Western Ghats',category:'कोकण',difficulty:'easy'},
  {q:'नागपूर जिल्हा कोणत्या विभागात येतो?',opts:['अमरावती','नागपूर','छत्रपती संभाजीनगर','नाशिक'],a:1,fact:'नागपूर हे नागपूर विभागाचे मुख्यालय व हिवाळी राजधानी',category:'नागपूर',difficulty:'easy'},
  {q:'पुणे कोणत्या विभागाचे मुख्यालय आहे?',opts:['नाशिक','कोकण','पुणे','अमरावती'],a:2,fact:'पुणे हे पुणे विभागाचे मुख्यालय',category:'पुणे',difficulty:'easy'},
  {q:'कोकण विभागाचे मुख्यालय कोणते?',opts:['रत्नागिरी','ठाणे','मुंबई','सिंधुदुर्ग'],a:2,fact:'मुंबई हे कोकण विभागाचे मुख्यालय',category:'कोकण',difficulty:'easy'},
  {q:'महाराष्ट्रात सर्वाधिक लोकसंख्या असलेला जिल्हा कोणता?',opts:['पुणे','मुंबई उपनगर','ठाणे','नाशिक'],a:1,fact:'मुंबई उपनगर — सर्वाधिक लोकसंख्या असलेला जिल्हा',category:'कोकण',difficulty:'easy'},
  {q:'नाशिक विभागात किती जिल्हे आहेत?',opts:['4','5','6','3'],a:1,fact:'नाशिक विभागात ५ जिल्हे — नाशिक, धुळे, नंदुरबार, जळगाव, अहमदनगर',category:'नाशिक',difficulty:'easy'},

  // ── MEDIUM ──
  {q:'लोणार सरोवर कोणत्या जिल्ह्यात आहे?',opts:['अकोला','बुलढाणा','वाशिम','यवतमाळ'],a:1,fact:'लोणार — जगातील दुर्मिळ खाऱ्या पाण्याचे उल्काघात सरोवर, बुलढाणा',category:'अमरावती',difficulty:'medium'},
  {q:'ताडोबा व्याघ्र प्रकल्प कोणत्या जिल्ह्यात आहे?',opts:['नागपूर','चंद्रपूर','गडचिरोली','भंडारा'],a:1,fact:'ताडोबा — महाराष्ट्रातील सर्वात मोठा व्याघ्र प्रकल्प, चंद्रपूर',category:'नागपूर',difficulty:'medium'},
  {q:'अजिंठा-वेरूळ लेणी कोणत्या जिल्ह्यात आहेत?',opts:['नाशिक','छत्रपती संभाजीनगर','पुणे','अहमदनगर'],a:1,fact:'छत्रपती संभाजीनगर — UNESCO World Heritage Site',category:'छत्रपती संभाजीनगर',difficulty:'medium'},
  {q:'कृष्णा नदी महाराष्ट्रात कोणत्या जिल्ह्यांतून वाहते?',opts:['सातारा-सांगली','पुणे-कोल्हापूर','सोलापूर-नाशिक','सातारा-सोलापूर'],a:0,fact:'कृष्णा — सातारा व सांगली जिल्ह्यांतून वाहते',category:'पुणे',difficulty:'medium'},
  {q:'महाराष्ट्रात सर्वाधिक पाऊस कोठे पडतो?',opts:['मुंबई','रत्नागिरी','सिंधुदुर्ग','ठाणे'],a:2,fact:'सिंधुदुर्ग — आंबोली हे महाराष्ट्रातील सर्वाधिक पर्जन्याचे ठिकाण',category:'कोकण',difficulty:'medium'},
  {q:'वैनगंगा नदी कोणत्या जिल्ह्यातून वाहते?',opts:['अमरावती','भंडारा','वर्धा','चंद्रपूर'],a:1,fact:'वैनगंगा — भंडारा, गोंदिया जिल्ह्यांतून वाहते',category:'नागपूर',difficulty:'medium'},
  {q:'नांदेड जिल्हा कोणत्या विभागात येतो?',opts:['पुणे','अमरावती','छत्रपती संभाजीनगर','नागपूर'],a:2,fact:'नांदेड — छत्रपती संभाजीनगर विभागात',category:'छत्रपती संभाजीनगर',difficulty:'medium'},
  {q:'पेंच व्याघ्र प्रकल्प कोणत्या जिल्ह्यात आहे?',opts:['भंडारा','चंद्रपूर','नागपूर','वर्धा'],a:2,fact:'पेंच — नागपूर जिल्ह्यातील प्रसिद्ध व्याघ्र प्रकल्प',category:'नागपूर',difficulty:'medium'},
  {q:'महाराष्ट्रातील सर्वात उंच शिखर कोणते?',opts:['हरिश्चंद्रगड','कळसुबाई','साल्हेर','राजगड'],a:1,fact:'कळसुबाई (१,६४६ मी) — महाराष्ट्राचे सर्वोच्च शिखर, अहमदनगर',category:'नाशिक',difficulty:'medium'},
  {q:'कोयना धरण कोणत्या जिल्ह्यात आहे?',opts:['पुणे','सातारा','कोल्हापूर','रत्नागिरी'],a:1,fact:'कोयना — महाराष्ट्रातील सर्वात मोठे धरण, सातारा',category:'पुणे',difficulty:'medium'},

  // ── HARD ──
  {q:'महाराष्ट्रातील सर्वात कमी लोकसंख्या असलेला जिल्हा कोणता?',opts:['सिंधुदुर्ग','गडचिरोली','हिंगोली','वाशिम'],a:0,fact:'सिंधुदुर्ग — सर्वात कमी लोकसंख्या असलेला जिल्हा',category:'कोकण',difficulty:'hard'},
  {q:'चंद्रपूर जिल्ह्यातील इरई धरण कोणत्या नदीवर आहे?',opts:['वैनगंगा','वर्धा','इरई','पेंच'],a:2,fact:'इरई धरण — चंद्रपूर शहराला पाणीपुरवठा करते',category:'नागपूर',difficulty:'hard'},
  {q:'महाराष्ट्रात जमिनीने घेरलेले (landlocked) किती जिल्हे आहेत?',opts:['30','32','34','28'],a:1,fact:'३२ जिल्हे landlocked; फक्त ४ जिल्हे किनारपट्टीवर',category:'all' as Category,difficulty:'hard'},
  {q:'नंदुरबार जिल्हा कोणत्या वर्षी स्वतंत्र जिल्हा बनला?',opts:['1990','1996','1998','2000'],a:1,fact:'नंदुरबार — १९९६ मध्ये धुळ्यातून वेगळा जिल्हा',category:'नाशिक',difficulty:'hard'},
  {q:'गोसेखुर्द धरण कोणत्या नदीवर आहे?',opts:['वर्धा','वैनगंगा','पेंच','इंद्रावती'],a:1,fact:'गोसेखुर्द — वैनगंगा नदीवर, भंडारा-नागपूर',category:'नागपूर',difficulty:'hard'},
  {q:'महाराष्ट्रातील कोणत्या जिल्ह्याला "संत्र्यांचे शहर" म्हणतात?',opts:['अकोला','नागपूर','अमरावती','वर्धा'],a:1,fact:'नागपूर — संत्री उत्पादनासाठी जगप्रसिद्ध',category:'नागपूर',difficulty:'hard'},
  {q:'पुरंदर किल्ला कोणत्या जिल्ह्यात आहे?',opts:['सातारा','पुणे','सोलापूर','रायगड'],a:1,fact:'पुरंदर किल्ला — पुणे जिल्ह्यात, मराठा इतिहासाशी संबंधित',category:'पुणे',difficulty:'hard'},
  {q:'मुळा-मुठा नद्यांचे संगम कोठे होते?',opts:['अलंदी','रांजणगाव','पुणे शहर','शिरूर'],a:2,fact:'मुळा व मुठा नद्यांचा संगम पुणे शहरातच होतो',category:'पुणे',difficulty:'hard'},
];

const TIMER: Record<Difficulty, number> = { easy: 30, medium: 20, hard: 15 };
const DIFFICULTY_XP: Record<Difficulty, number> = { easy: 5, medium: 8, hard: 12 };
const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: 'सोपे', medium: 'मध्यम', hard: 'कठीण' };
const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy:   '#34D399',
  medium: '#FBBF24',
  hard:   '#F87171',
};
const CATEGORIES: Category[] = ['all', 'कोकण', 'पुणे', 'नाशिक', 'छत्रपती संभाजीनगर', 'अमरावती', 'नागपूर'];
const CATEGORY_LABEL: Record<Category, string> = {
  all: 'सर्व', कोकण: 'कोकण', पुणे: 'पुणे', नाशिक: 'नाशिक',
  'छत्रपती संभाजीनगर': 'छ. संभाजीनगर', अमरावती: 'अमरावती', नागपूर: 'नागपूर',
};

const CSS = `
  @keyframes dq-fade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes dq-pop {0%{transform:scale(0.92)}60%{transform:scale(1.04)}100%{transform:scale(1)}}
  @keyframes dq-timer{from{width:100%}to{width:0%}}
  @keyframes dq-pulse{0%,100%{opacity:1}50%{opacity:0.5}}
  .dq-opt:not(:disabled):hover{background:rgba(255,255,255,0.12)!important;transform:translateX(3px);}
  .dq-opt{transition:all 0.18s ease;}
  .dq-cat:hover{opacity:0.85;}
  .dq-diff:hover{opacity:0.85;}
`;

type Screen = 'setup' | 'quiz' | 'done';

export const DistrictQuiz: React.FC<Props> = ({ onBack }) => {
  const [screen, setScreen]         = useState<Screen>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [category, setCategory]     = useState<Category>('all');
  const [qs, setQs]                 = useState<Question[]>([]);
  const [idx, setIdx]               = useState(0);
  const [answered, setAnswered]     = useState<number | null>(null);
  const [score, setScore]           = useState(0);
  const [skipped, setSkipped]       = useState(0);
  const [timeLeft, setTimeLeft]     = useState(TIMER[difficulty]);
  const [timerActive, setTimerActive] = useState(false);
  const [streak, setStreak]         = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timedOut, setTimedOut]     = useState(false);

  const q = qs[idx];

  // ── Build question set ──
  const startQuiz = () => {
    const pool = QUESTIONS.filter(x =>
      x.difficulty === difficulty &&
      (category === 'all' || x.category === category || x.category === 'all')
    );
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    setQs(shuffled);
    setIdx(0); setAnswered(null); setScore(0); setSkipped(0);
    setStreak(0); setBestStreak(0); setTimedOut(false);
    setTimeLeft(TIMER[difficulty]);
    setScreen('quiz');
    setTimerActive(true);
  };

  // ── Timer logic ──
  useEffect(() => {
    if (screen !== 'quiz' || !timerActive || answered !== null) return;
    if (timeLeft <= 0) {
      setTimedOut(true);
      setTimerActive(false);
      setAnswered(-1); // -1 = timed out
      updateProgress(1, 0);
      addXP(0);
      setStreak(0);
      setTimeout(() => nextQuestion(), 2000);
      return;
    }
    const t = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, timerActive, answered, screen]);

  const nextQuestion = useCallback(() => {
    setIdx(x => {
      const next = x + 1;
      if (next >= qs.length) { setScreen('done'); return x; }
      setAnswered(null);
      setTimedOut(false);
      setTimeLeft(TIMER[difficulty]);
      setTimerActive(true);
      return next;
    });
  }, [qs.length, difficulty]);

  const handleAnswer = (i: number) => {
    if (answered !== null) return;
    setTimerActive(false);
    setAnswered(i);
    const correct = i === q.a;
    if (correct) {
      setScore(s => s + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(b => Math.max(b, newStreak));
      addXP(DIFFICULTY_XP[difficulty] + (newStreak >= 3 ? 3 : 0)); // streak bonus
    } else {
      setStreak(0);
      addXP(1);
    }
    updateProgress(1, correct ? 1 : 0);
    setTimeout(nextQuestion, 1900);
  };

  const handleSkip = () => {
    if (answered !== null) return;
    setTimerActive(false);
    setSkipped(s => s + 1);
    setStreak(0);
    setAnswered(-2); // -2 = skipped
    updateProgress(1, 0);
    addXP(0);
    setTimeout(nextQuestion, 900);
  };

  const timerPct = (timeLeft / TIMER[difficulty]) * 100;
  const timerColor = timerPct > 50 ? '#34D399' : timerPct > 25 ? '#FBBF24' : '#F87171';

  // ═══════════════════════════════════════════
  //  SETUP SCREEN
  // ═══════════════════════════════════════════
  if (screen === 'setup') return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0F1117,#1A1228)',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",color:'#fff',padding:'20px 16px'}}>
      <style>{CSS}</style>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24}}>
        <button onClick={onBack} style={{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:9,padding:'8px 10px',cursor:'pointer',color:'#fff',display:'flex'}}><ArrowLeft size={14}/></button>
        <span style={{fontWeight:900,fontSize:18}}>🗺️ जिल्हा Quiz</span>
      </div>

      <div style={{maxWidth:440,margin:'0 auto'}}>

        {/* Difficulty */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:12,fontWeight:800,color:'rgba(255,255,255,0.5)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>⚡ अडचण स्तर</div>
          <div style={{display:'flex',gap:8}}>
            {(['easy','medium','hard'] as Difficulty[]).map(d => (
              <button key={d} className="dq-diff" onClick={() => setDifficulty(d)}
                style={{flex:1,padding:'12px 6px',borderRadius:14,border:`2px solid ${difficulty===d ? DIFFICULTY_COLOR[d] : 'rgba(255,255,255,0.1)'}`,background:difficulty===d ? `rgba(${d==='easy'?'52,211,153':d==='medium'?'251,191,36':'248,113,113'},0.15)` : 'rgba(255,255,255,0.04)',color:difficulty===d ? DIFFICULTY_COLOR[d] : 'rgba(255,255,255,0.5)',fontWeight:900,fontSize:13,cursor:'pointer',transition:'all 0.2s',fontFamily:"inherit"}}>
                <div>{d==='easy'?'🟢':d==='medium'?'🟡':'🔴'}</div>
                <div style={{marginTop:4}}>{DIFFICULTY_LABEL[d]}</div>
                <div style={{fontSize:10,marginTop:2,opacity:0.7}}>{TIMER[d]}s / प्रश्न</div>
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div style={{marginBottom:28}}>
          <div style={{fontSize:12,fontWeight:800,color:'rgba(255,255,255,0.5)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>📍 विभाग</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
            {CATEGORIES.map(c => (
              <button key={c} className="dq-cat" onClick={() => setCategory(c)}
                style={{padding:'8px 13px',borderRadius:99,border:`1.5px solid ${category===c ? '#059669' : 'rgba(255,255,255,0.1)'}`,background:category===c ? 'rgba(5,150,105,0.2)' : 'rgba(255,255,255,0.04)',color:category===c ? '#34D399' : 'rgba(255,255,255,0.55)',fontWeight:700,fontSize:12,cursor:'pointer',transition:'all 0.2s',fontFamily:"inherit"}}>
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <div style={{marginTop:8,fontSize:11,color:'rgba(255,255,255,0.35)',fontWeight:600}}>
            {(() => {
              const n = QUESTIONS.filter(x => x.difficulty === difficulty && (category === 'all' || x.category === category || x.category === 'all')).length;
              return `${n} प्रश्न उपलब्ध (${Math.min(n,10)} निवडले जातील)`;
            })()}
          </div>
        </div>

        {/* XP info */}
        <div style={{background:'rgba(5,150,105,0.08)',border:'1px solid rgba(5,150,105,0.2)',borderRadius:14,padding:'12px 16px',marginBottom:24,fontSize:12,color:'rgba(255,255,255,0.6)'}}>
          <div style={{fontWeight:900,color:'#34D399',marginBottom:4}}>⚡ XP प्रति बरोबर उत्तर: {DIFFICULTY_XP[difficulty]}</div>
          <div>🔥 ३+ streak bonus: +3 XP प्रत्येक वेळी</div>
          <div>⏱️ वेळेत उत्तर द्या — {TIMER[difficulty]} सेकंद प्रति प्रश्न</div>
        </div>

        <button onClick={startQuiz}
          style={{width:'100%',padding:'16px',borderRadius:16,border:'none',background:`linear-gradient(135deg,#059669,#047857)`,color:'#fff',fontWeight:900,fontSize:16,cursor:'pointer',fontFamily:"inherit",letterSpacing:'-0.02em'}}>
          Quiz सुरू करा 🚀
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  //  DONE SCREEN
  // ═══════════════════════════════════════════
  if (screen === 'done') {
    const pct = Math.round((score / qs.length) * 100);
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '📚';
    const xpEarned = score * DIFFICULTY_XP[difficulty];
    return (
      <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0F1117,#1A1228)',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <div style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:28,padding:'36px 24px',maxWidth:380,width:'100%',textAlign:'center',animation:'dq-pop 0.4s ease'}}>
          <style>{CSS}</style>
          <div style={{fontSize:60,marginBottom:8}}>{emoji}</div>
          <div style={{fontWeight:900,fontSize:34,letterSpacing:'-0.05em',marginBottom:2}}>{score}/{qs.length}</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',fontWeight:700,marginBottom:6}}>Maharashtra Geography · {DIFFICULTY_LABEL[difficulty]}</div>
          <div style={{fontSize:13,color:DIFFICULTY_COLOR[difficulty],fontWeight:800,marginBottom:20}}>
            {pct >= 80 ? 'उत्कृष्ट! 🎉' : pct >= 60 ? 'चांगले! 👍' : 'अजून सराव करा 💪'}
          </div>

          {/* Stats row */}
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            {[
              {label:'बरोबर',val:score,color:'#34D399'},
              {label:'चुकीचे',val:qs.length - score - skipped,color:'#F87171'},
              {label:'वगळले',val:skipped,color:'#94A3B8'},
              {label:'Best streak',val:bestStreak,color:'#FBBF24'},
            ].map(s => (
              <div key={s.label} style={{flex:1,background:'rgba(255,255,255,0.05)',borderRadius:12,padding:'10px 4px'}}>
                <div style={{fontWeight:900,fontSize:18,color:s.color}}>{s.val}</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',fontWeight:700,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{background:'rgba(5,150,105,0.12)',border:'1px solid rgba(5,150,105,0.3)',borderRadius:12,padding:'10px',marginBottom:16,fontSize:14,fontWeight:900,color:'#34D399'}}>
            +{xpEarned} ⚡ XP earned!
          </div>

          <div style={{display:'flex',gap:8}}>
            <button onClick={() => { const t=`🗺️ MPSC District Quiz!\n\n${score}/${qs.length} · ${pct}% · ${DIFFICULTY_LABEL[difficulty]}\nmpscsarathi.online`; window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank'); }}
              style={{flex:1,background:'linear-gradient(135deg,#25D366,#128C7E)',border:'none',borderRadius:12,padding:'12px',color:'#fff',fontWeight:900,cursor:'pointer'}}>📤</button>
            <button onClick={startQuiz}
              style={{flex:1,background:'linear-gradient(135deg,#E8671A,#C4510E)',border:'none',borderRadius:12,padding:'12px',color:'#fff',fontWeight:900,cursor:'pointer',fontFamily:"inherit"}}>पुन्हा</button>
            <button onClick={() => setScreen('setup')}
              style={{flex:1,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:12,padding:'12px',color:'#fff',fontWeight:800,cursor:'pointer',fontFamily:"inherit"}}>बदल</button>
            <button onClick={onBack}
              style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:'12px',color:'rgba(255,255,255,0.6)',fontWeight:800,cursor:'pointer',fontFamily:"inherit"}}>🏠</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  QUIZ SCREEN
  // ═══════════════════════════════════════════
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0F1117,#1A1228)',fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif",color:'#fff',paddingBottom:40}}>
      <style>{CSS}</style>

      {/* Top bar */}
      <div style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={onBack} style={{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:9,padding:'8px 10px',cursor:'pointer',color:'#fff',display:'flex'}}><ArrowLeft size={14}/></button>

        {/* Progress bar */}
        <div style={{flex:1,background:'rgba(255,255,255,0.1)',borderRadius:99,height:5,overflow:'hidden'}}>
          <div style={{height:'100%',background:'linear-gradient(90deg,#059669,#34D399)',borderRadius:99,width:`${(idx/qs.length)*100}%`,transition:'width 0.4s'}}/>
        </div>

        <span style={{fontSize:11,fontWeight:900,color:'rgba(255,255,255,0.6)',minWidth:30}}>{idx+1}/{qs.length}</span>

        {/* Score */}
        <div style={{background:'rgba(5,150,105,0.2)',border:'1px solid rgba(5,150,105,0.35)',borderRadius:99,padding:'4px 10px',fontSize:12,fontWeight:900,color:'#34D399'}}>
          {score} ✓
        </div>

        {/* Streak */}
        {streak >= 2 && (
          <div style={{background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.35)',borderRadius:99,padding:'4px 10px',fontSize:12,fontWeight:900,color:'#FBBF24',animation:'dq-pulse 1s infinite'}}>
            🔥{streak}
          </div>
        )}
      </div>

      {/* Timer bar */}
      <div style={{height:4,background:'rgba(255,255,255,0.07)',margin:'0 16px 2px',borderRadius:99,overflow:'hidden'}}>
        <div style={{height:'100%',background:timerColor,borderRadius:99,width:`${timerPct}%`,transition:'width 1s linear,background 0.5s'}}/>
      </div>

      <div style={{maxWidth:480,margin:'0 auto',padding:'10px 16px'}}>

        {/* Meta row */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <MapPin size={13} style={{color:'#059669'}}/>
            <span style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.45)',textTransform:'uppercase',letterSpacing:'0.1em'}}>
              {q && (CATEGORY_LABEL[q.category] !== 'सर्व' ? CATEGORY_LABEL[q.category] : 'Maharashtra')}
            </span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <Clock size={12} style={{color:timerColor}}/>
            <span style={{fontSize:13,fontWeight:900,color:timerColor,minWidth:20}}>{timeLeft}</span>
            <span style={{fontSize:10,background:`rgba(${difficulty==='easy'?'52,211,153':difficulty==='medium'?'251,191,36':'248,113,113'},0.15)`,color:DIFFICULTY_COLOR[difficulty],borderRadius:6,padding:'2px 7px',fontWeight:800}}>
              {DIFFICULTY_LABEL[difficulty]}
            </span>
          </div>
        </div>

        {/* Question card */}
        <div key={idx} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'22px 18px',marginBottom:14,animation:'dq-fade 0.3s ease',minHeight:110}}>
          <p style={{fontWeight:700,fontSize:'clamp(1rem,4vw,1.12rem)',lineHeight:1.7,color:'#fff',margin:0}}>
            {q?.q}
          </p>
        </div>

        {/* Options */}
        <div style={{display:'flex',flexDirection:'column',gap:9}}>
          {q?.opts.map((opt, i) => {
            const isSel = answered === i;
            const isAns = i === q.a;
            const isTimedOut = answered === -1;
            const isSkipped = answered === -2;
            let bg = 'rgba(255,255,255,0.06)', border = 'rgba(255,255,255,0.12)', clr = '#fff';
            if ((isTimedOut || isSkipped) && isAns)     { bg='rgba(5,150,105,0.15)'; border='rgba(5,150,105,0.4)'; clr='rgba(255,255,255,0.5)'; }
            if (answered !== null && !isTimedOut && !isSkipped && isAns)           { bg='rgba(5,150,105,0.2)'; border='rgba(5,150,105,0.55)'; }
            if (answered !== null && isSel && !isAns)   { bg='rgba(220,38,38,0.2)'; border='rgba(220,38,38,0.55)'; }
            if (answered !== null && !isSel && !isAns && !isTimedOut && !isSkipped)  { clr='rgba(255,255,255,0.28)'; }
            return (
              <button key={i} className="dq-opt" disabled={answered !== null} onClick={() => handleAnswer(i)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'13px 15px',borderRadius:14,border:`1.5px solid ${border}`,background:bg,color:clr,fontWeight:700,fontSize:13,textAlign:'left',cursor:answered !== null ? 'default' : 'pointer',width:'100%',fontFamily:"inherit"}}>
                <span style={{width:26,height:26,borderRadius:8,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,background:'rgba(255,255,255,0.1)'}}>
                  {answered !== null && isAns && answered !== -2 ? '✓'
                    : answered !== null && isSel && !isAns ? '✗'
                    : String.fromCharCode(65 + i)}
                </span>
                <span style={{flex:1}}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Timeout / Skip / Fact banner */}
        {answered !== null && (
          <div style={{background: answered === -1 ? 'rgba(220,38,38,0.08)' : answered === -2 ? 'rgba(148,163,184,0.08)' : 'rgba(255,255,255,0.05)',border:`1px solid ${answered === -1 ? 'rgba(220,38,38,0.3)' : answered === -2 ? 'rgba(148,163,184,0.2)' : 'rgba(255,255,255,0.1)'}`,borderRadius:14,padding:'13px 16px',marginTop:12,animation:'dq-fade 0.3s ease',fontSize:12,fontWeight:600,lineHeight:1.65,color:'rgba(255,255,255,0.7)'}}>
            {answered === -1 ? `⏰ वेळ संपली! बरोबर उत्तर: ${q?.opts[q.a]}`
             : answered === -2 ? `⏭️ वगळले. बरोबर उत्तर: ${q?.opts[q.a]}`
             : `💡 ${q?.fact}`}
          </div>
        )}

        {/* Skip button */}
        {answered === null && (
          <button onClick={handleSkip}
            style={{marginTop:14,width:'100%',padding:'11px',borderRadius:12,border:'1px dashed rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.35)',fontWeight:700,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:"inherit"}}>
            <SkipForward size={13}/> प्रश्न वगळा
          </button>
        )}
      </div>
    </div>
  );
};

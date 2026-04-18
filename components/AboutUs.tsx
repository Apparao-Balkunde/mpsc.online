import React from 'react';
import { ArrowLeft, Target, Users, BookOpen, Heart, ExternalLink, Mail, Star } from 'lucide-react';

interface Props { onClose: () => void; }

const CSS = `@keyframes au-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`;

export const AboutUs: React.FC<Props> = ({ onClose }) => (
  <div style={{ position:'fixed', inset:0, background:'#F5F0E8', zIndex:300, overflowY:'auto', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}>
    <style>{CSS}</style>

    <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
      <button onClick={onClose} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
      <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B' }}>About MPSC सारथी</div>
    </div>

    <div style={{ maxWidth:680, margin:'0 auto', padding:'16px', animation:'au-fade 0.3s ease' }}>

      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#1C2B2B,#2D4040)', borderRadius:22, padding:'28px 22px', marginBottom:16, textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(232,103,26,0.12)' }}/>
        <div style={{ fontSize:56, marginBottom:12 }}>📚</div>
        <h1 style={{ fontWeight:900, fontSize:22, color:'#fff', margin:'0 0 8px', letterSpacing:'-0.03em' }}>MPSC सारथी</h1>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>Maharashtra's #1 Free MPSC Study Portal</div>
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:14, flexWrap:'wrap' }}>
          {['60+ Features','Free Forever','AI Powered','PWA App'].map(t => (
            <span key={t} style={{ fontSize:10, fontWeight:800, background:'rgba(255,255,255,0.12)', borderRadius:99, padding:'4px 12px', color:'rgba(255,255,255,0.8)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div style={{ background:'#fff', borderRadius:18, padding:'18px', marginBottom:12, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(232,103,26,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><Target size={18} style={{color:'#E8671A'}}/></div>
          <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B' }}>आमचे ध्येय</div>
        </div>
        <p style={{ fontSize:13, fontWeight:600, color:'#4A6060', lineHeight:1.75, margin:0 }}>
          दुर्गम भागातील आणि गरजू विद्यार्थ्यांना स्पर्धा परीक्षेसाठी आवश्यक असलेले दर्जेदार स्टडी मटेरियल, PYQ विश्लेषण आणि चालू घडामोडी <strong>मोफत</strong> उपलब्ध करून देणे. शहरात न जाता, लाखो रुपये न खर्च करता यश मिळवणे शक्य व्हावे.
        </p>
      </div>

      {/* What we offer */}
      <div style={{ background:'#fff', borderRadius:18, padding:'18px', marginBottom:12, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(5,150,105,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><BookOpen size={18} style={{color:'#059669'}}/></div>
          <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B' }}>आम्ही काय देतो?</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            ['📝','5000+ PYQ','मागील वर्षांचे प्रश्न'],
            ['🤖','AI Features','Doubt solving, MCQ gen'],
            ['📊','Analytics','Performance tracking'],
            ['⚡','XP System','Gamified learning'],
            ['📅','Daily Quiz','Streak maintain करा'],
            ['🗺️','Maharashtra GK','Special MCQ bank'],
            ['📖','Marathi Grammar','व्याकरण practice'],
            ['⭐','Govt Schemes','योजना MCQ'],
          ].map(([e,t,s]) => (
            <div key={t} style={{ background:'#F8F5F0', borderRadius:12, padding:'10px 12px', display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{e}</span>
              <div>
                <div style={{ fontWeight:800, fontSize:11, color:'#1C2B2B' }}>{t}</div>
                <div style={{ fontSize:9, fontWeight:600, color:'#7A9090' }}>{s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Who we are */}
      <div style={{ background:'#fff', borderRadius:18, padding:'18px', marginBottom:12, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(37,99,235,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><Users size={18} style={{color:'#2563EB'}}/></div>
          <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B' }}>आम्ही कोण आहोत?</div>
        </div>
        <p style={{ fontSize:13, fontWeight:600, color:'#4A6060', lineHeight:1.75, margin:'0 0 10px' }}>
          आम्ही स्पर्धा परीक्षेचा अनुभव असलेले मार्गदर्शक आणि तंत्रज्ञांची एक टीम आहोत. ग्रामीण भागातील विद्यार्थ्यांना डिजिटल माध्यमाद्वारे मदत करणे हेच आमचे उद्दिष्ट आहे.
        </p>
        <div style={{ background:'rgba(232,103,26,0.06)', border:'1px solid rgba(232,103,26,0.15)', borderRadius:12, padding:'12px', textAlign:'center', fontStyle:'italic', fontSize:13, fontWeight:700, color:'#92400E' }}>
          "विद्यार्थ्यांच्या यशातच आमचे यश आहे!" 🙏
        </div>
      </div>

      {/* Stats */}
      <div style={{ background:'linear-gradient(135deg,rgba(232,103,26,0.08),rgba(37,99,235,0.06))', border:'1px solid rgba(232,103,26,0.15)', borderRadius:18, padding:'18px', marginBottom:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, textAlign:'center' }}>
          {[['5000+','Questions','#E8671A'],['60+','Features','#2563EB'],['FREE','Always','#059669']].map(([v,l,c]) => (
            <div key={l}>
              <div style={{ fontWeight:900, fontSize:24, color:c, letterSpacing:'-0.04em' }}>{v}</div>
              <div style={{ fontSize:10, fontWeight:700, color:'#7A9090', textTransform:'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div style={{ background:'#fff', borderRadius:18, padding:'18px', marginBottom:12, boxShadow:'0 2px 8px rgba(0,0,0,0.05)', textAlign:'center' }}>
        <Heart size={20} style={{ color:'#E8671A', marginBottom:8 }}/>
        <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:4 }}>संपर्क साधा</div>
        <div style={{ fontSize:12, color:'#7A9090', marginBottom:12 }}>तुमच्या सूचना आणि feedback स्वागत आहे!</div>
        <a href="mailto:support@mpscsarathi.online"
          style={{ display:'inline-flex', alignItems:'center', gap:7, background:'linear-gradient(135deg,#E8671A,#C4510E)', borderRadius:12, padding:'10px 20px', color:'#fff', fontWeight:900, fontSize:13, textDecoration:'none', boxShadow:'0 4px 12px rgba(232,103,26,0.3)' }}>
          <Mail size={14}/> support@mpscsarathi.online
        </a>
      </div>

      {/* Official link */}
      <div style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'#7A9090' }}>
        Official MPSC: <a href="https://mpsc.gov.in" target="_blank" rel="noreferrer" style={{ color:'#2563EB', fontWeight:800 }}>mpsc.gov.in <ExternalLink size={9}/></a>
      </div>
    </div>
  </div>
);

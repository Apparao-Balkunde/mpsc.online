import React, { useState } from 'react';
import { ArrowLeft, Shield, Mail, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface Props { onClose: () => void; }

const CSS = `
@keyframes pp-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
`;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background:'#fff', borderRadius:16, marginBottom:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
        <span style={{ fontWeight:900, fontSize:14, color:'#1C2B2B' }}>{title}</span>
        {open ? <ChevronUp size={16} style={{color:'#7A9090'}}/> : <ChevronDown size={16} style={{color:'#7A9090'}}/>}
      </button>
      {open && <div style={{ padding:'0 16px 16px', fontSize:13, fontWeight:600, color:'#4A6060', lineHeight:1.75 }}>{children}</div>}
    </div>
  );
};

export const PrivacyPolicy: React.FC<Props> = ({ onClose }) => (
  <div style={{ position:'fixed', inset:0, background:'#F5F0E8', zIndex:300, overflowY:'auto', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif" }}>
    <style>{CSS}</style>

    {/* Header */}
    <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
      <button onClick={onClose} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}><ArrowLeft size={14}/></button>
      <div style={{ flex:1, fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
        <Shield size={16} style={{color:'#2563EB'}}/> Privacy Policy & Disclaimer
      </div>
    </div>

    <div style={{ maxWidth:680, margin:'0 auto', padding:'16px', animation:'pp-fade 0.3s ease' }}>

      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#1E3A5F,#1E40AF)', borderRadius:20, padding:'20px', marginBottom:16, color:'#fff' }}>
        <div style={{ fontWeight:900, fontSize:18, marginBottom:6 }}>🏛️ MPSC सारथी</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:600, lineHeight:1.6 }}>
          Privacy Policy & Disclaimer<br/>
          Last Updated: March 06, 2026<br/>
          Website: <a href="https://mpscsarathi.online" target="_blank" rel="noreferrer" style={{ color:'#93C5FD' }}>mpscsarathi.online</a>
        </div>
      </div>

      {/* Important notice */}
      <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:14, padding:'14px 16px', marginBottom:16, fontSize:12, fontWeight:700, color:'#92400E', lineHeight:1.65 }}>
        ⚠️ <strong>Important:</strong> MPSC Sarathi is an <strong>independent educational platform</strong> and is <strong>NOT</strong> affiliated with the Maharashtra Public Service Commission (MPSC) or any government entity.
      </div>

      <Section title="1. Disclaimer">
        <p>All information on <strong>mpscsarathi.online</strong> is published in good faith and for general educational purposes only. MPSC Sarathi does not make any warranties about the completeness, reliability or accuracy of this information.</p>
        <p style={{ marginTop:8 }}>By using our website, you hereby consent to our disclaimer and agree to its terms. Any action you take upon the information you find on this website is strictly at your own risk.</p>
      </Section>

      <Section title="2. Privacy Policy">
        <p><strong>What we collect:</strong></p>
        <ul style={{ paddingLeft:20, marginTop:6 }}>
          <li>Login information (Google account name, email) — for personalized experience</li>
          <li>Quiz progress, scores, streak — stored locally and in Supabase</li>
          <li>Study preferences — stored in your browser (localStorage)</li>
          <li>Standard log files (IP, browser type, timestamps) — for analytics</li>
        </ul>
        <p style={{ marginTop:10 }}><strong>What we do NOT collect:</strong></p>
        <ul style={{ paddingLeft:20, marginTop:6 }}>
          <li>Payment information</li>
          <li>Sensitive personal data</li>
          <li>Your location without permission</li>
        </ul>
        <p style={{ marginTop:10 }}><strong>Data Storage:</strong> Your data is stored securely on Supabase (PostgreSQL). We do not sell your personal information to third parties.</p>
      </Section>

      <Section title="3. Google AdSense & Cookies">
        <p>We use <strong>Google AdSense</strong> to display ads on our platform. Google uses cookies (DART cookies) to serve ads based on your visit to our site and other sites on the internet.</p>
        <p style={{ marginTop:8 }}>You may opt out of personalized ads by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" style={{ color:'#2563EB', fontWeight:800 }}>Google Ad Settings</a>.</p>
        <p style={{ marginTop:8 }}><strong>Third-party cookies used:</strong></p>
        <ul style={{ paddingLeft:20, marginTop:6 }}>
          <li>Google AdSense (ads.google.com)</li>
          <li>Google Analytics (for traffic analysis)</li>
          <li>Supabase (for authentication)</li>
        </ul>
        <p style={{ marginTop:8 }}>Note: Ads shown are managed by Google. MPSC Sarathi does not control which specific ads appear.</p>
      </Section>

      <Section title="4. Children's Privacy (COPPA)">
        <p>Our service is intended for students aged <strong>16 and above</strong>. We do not knowingly collect personal information from children under 13. If you believe your child has provided us personal information, please contact us and we will delete it immediately.</p>
      </Section>

      <Section title="5. User Content & AI">
        <p>Our platform uses <strong>Groq AI (LLaMA 3.3-70B)</strong> to generate study content. AI-generated content is for educational purposes only and may not be 100% accurate. Always verify important information from official MPSC sources.</p>
        <p style={{ marginTop:8 }}>Questions and answers are curated from official MPSC question papers and educational resources.</p>
      </Section>

      <Section title="6. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. We will notify users of any changes by updating the "Last Updated" date at the top of this page. Continued use of our platform after changes constitutes acceptance of the new policy.</p>
      </Section>

      <Section title="7. Your Rights">
        <ul style={{ paddingLeft:20 }}>
          <li>Request deletion of your account data</li>
          <li>Opt-out of non-essential cookies</li>
          <li>Access information about your stored data</li>
          <li>Report content that violates our policies</li>
        </ul>
        <p style={{ marginTop:8 }}>To exercise these rights, contact us at <strong style={{ color:'#2563EB' }}>support@mpscsarathi.online</strong></p>
      </Section>

      {/* Contact */}
      <div style={{ background:'#fff', borderRadius:16, padding:'16px', marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.05)', textAlign:'center' }}>
        <Mail size={24} style={{ color:'#E8671A', marginBottom:8 }}/>
        <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:4 }}>Contact Us</div>
        <div style={{ fontSize:12, color:'#7A9090', marginBottom:10 }}>Questions about this policy?</div>
        <a href="mailto:support@mpscsarathi.online"
          style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(37,99,235,0.1)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:10, padding:'8px 16px', color:'#2563EB', fontWeight:800, fontSize:13, textDecoration:'none' }}>
          <Mail size={13}/> support@mpscsarathi.online
        </a>
      </div>

      {/* Official site link */}
      <div style={{ background:'rgba(0,0,0,0.04)', borderRadius:14, padding:'12px 16px', textAlign:'center', fontSize:11, fontWeight:600, color:'#7A9090' }}>
        For official MPSC information, visit{' '}
        <a href="https://mpsc.gov.in" target="_blank" rel="noreferrer" style={{ color:'#2563EB', fontWeight:800, display:'inline-flex', alignItems:'center', gap:3 }}>
          mpsc.gov.in <ExternalLink size={10}/>
        </a>
      </div>
    </div>
  </div>
);
        

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, ExternalLink, RefreshCw, Plus, Trash2, Edit3, Save, X, AlertCircle, Calendar, FileText, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props { onBack: () => void; isAdmin?: boolean; }

interface Notification {
  id: string;
  title: string;
  type: 'exam' | 'result' | 'admit' | 'syllabus' | 'vacancy' | 'general';
  date: string;
  link?: string;
  description?: string;
  isNew?: boolean;
  source: 'official' | 'manual';
}

const TYPE_CONFIG = {
  exam:     { label: 'परीक्षा',      color: '#DC2626', bg: 'rgba(220,38,38,0.08)',   icon: '📝' },
  result:   { label: 'निकाल',        color: '#059669', bg: 'rgba(5,150,105,0.08)',   icon: '🏆' },
  admit:    { label: 'Admit Card',   color: '#2563EB', bg: 'rgba(37,99,235,0.08)',   icon: '🎫' },
  syllabus: { label: 'Syllabus',     color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  icon: '📚' },
  vacancy:  { label: 'Vacancy',      color: '#D97706', bg: 'rgba(217,119,6,0.08)',   icon: '💼' },
  general:  { label: 'General',      color: '#E8671A', bg: 'rgba(232,103,26,0.08)',  icon: '📢' },
};

const STORAGE_KEY = 'mpsc_notifications';

// Default seeded notifications — admin can edit these
const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id:'1', title:'MPSC Rajyaseva Preliminary Exam 2025 — जाहिरात प्रकाशित', type:'exam', date:'2025-01-15', link:'https://mpsc.gov.in/home', description:'राज्यसेवा पूर्व परीक्षा 2025 साठी जाहिरात प्रकाशित झाली आहे. ऑनलाइन अर्ज करण्याची अंतिम तारीख लवकरच जाहीर होईल.', isNew:true, source:'manual' },
  { id:'2', title:'PSI/STI/ASO Exam 2025 — Time Table जाहीर', type:'exam', date:'2025-02-10', link:'https://mpsc.gov.in/home', description:'PSI, STI आणि ASO पदांसाठी परीक्षेचे वेळापत्रक जाहीर करण्यात आले आहे.', isNew:true, source:'manual' },
  { id:'3', title:'MPSC Group B Services Exam — Result', type:'result', date:'2025-01-05', link:'https://mpsc.gov.in/home', description:'MPSC Group B सेवा परीक्षेचा अंतिम निकाल जाहीर.', isNew:false, source:'manual' },
  { id:'4', title:'सरळसेवा भरती 2025 — नवीन जाहिरात', type:'vacancy', date:'2025-03-01', link:'https://mpsc.gov.in/home', description:'महाराष्ट्र लोकसेवा आयोगाकडून सरळसेवा भरती 2025 साठी जाहिरात प्रकाशित.', isNew:true, source:'manual' },
  { id:'5', title:'MPSC Rajyaseva Mains 2024 — Admit Card', type:'admit', date:'2024-12-20', link:'https://mpsc.gov.in/home', description:'राज्यसेवा मुख्य परीक्षा 2024 साठी प्रवेशपत्र उपलब्ध.', isNew:false, source:'manual' },
];

const CSS = `
  @keyframes mn-fade { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
  @keyframes mn-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes mn-pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
  @keyframes mn-spin { to{transform:rotate(360deg)} }
  input:focus, textarea:focus, select:focus { outline:none; border-color:#DC2626 !important; }
`;

export const MPSCNotifications: React.FC<Props> = ({ onBack, isAdmin }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter]   = useState<string>('all');
  const [expanded, setExpanded] = useState<string|null>(null);
  const [editing, setEditing]  = useState<Notification|null>(null);
  const [showAdd, setShowAdd]  = useState(false);
  const [loading, setLoading]  = useState(false);
  const [newNotif, setNewNotif] = useState<Partial<Notification>>({ type:'general', source:'manual' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setNotifications(JSON.parse(saved)); }
      catch { setNotifications(DEFAULT_NOTIFICATIONS); }
    } else {
      setNotifications(DEFAULT_NOTIFICATIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
  }, []);

  const save = (data: Notification[]) => {
    setNotifications(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const addNotif = () => {
    if (!newNotif.title?.trim()) return;
    const n: Notification = {
      id: Date.now().toString(),
      title: newNotif.title!,
      type: newNotif.type as Notification['type'] || 'general',
      date: newNotif.date || new Date().toISOString().split('T')[0],
      link: newNotif.link || 'https://mpsc.gov.in/home',
      description: newNotif.description,
      isNew: true,
      source: 'manual',
    };
    save([n, ...notifications]);
    setShowAdd(false);
    setNewNotif({ type:'general', source:'manual' });
  };

  const deleteNotif = (id: string) => {
    if (!confirm('Delete करायचे?')) return;
    save(notifications.filter(n => n.id !== id));
  };

  const saveEdit = () => {
    if (!editing) return;
    save(notifications.map(n => n.id === editing.id ? editing : n));
    setEditing(null);
  };

  // Simulated "fetch from official" — actually just refreshes with a note
  const fetchLatest = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('📌 Latest notifications check: कृपया mpsc.gov.in वर जाऊन नवीन notifications manually add करा. Direct scraping शक्य नाही.');
    }, 1500);
  };

  const filtered = notifications.filter(n => filter === 'all' || n.type === filter);
  const newCount = notifications.filter(n => n.isNew).length;

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:600, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}>
            <ArrowLeft size={14}/>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:6 }}>
              <Bell size={16} style={{color:'#DC2626'}}/> MPSC Notifications
            </div>
            <div style={{ fontSize:10, color:'#7A9090', fontWeight:600 }}>mpsc.gov.in वरील महत्त्वाच्या घोषणा</div>
          </div>
          {newCount > 0 && (
            <div style={{ background:'#DC2626', color:'#fff', borderRadius:99, padding:'3px 10px', fontSize:11, fontWeight:900 }}>
              {newCount} नवीन
            </div>
          )}
          {isAdmin && (
            <button onClick={()=>setShowAdd(true)}
              style={{ background:'linear-gradient(135deg,#DC2626,#B91C1C)', border:'none', borderRadius:10, padding:'8px 12px', color:'#fff', fontWeight:900, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <Plus size={13}/> Add
            </button>
          )}
          <button onClick={fetchLatest}
            style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px', cursor:'pointer', color:'#7A9090', display:'flex' }}>
            <RefreshCw size={13} style={loading?{animation:'mn-spin 0.8s linear infinite'}:{}}/>
          </button>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'16px' }}>

        {/* Official site banner */}
        <a href="https://mpsc.gov.in/home" target="_blank" rel="noreferrer"
          style={{ display:'flex', alignItems:'center', gap:10, background:'linear-gradient(135deg,#1E3A5F,#1E40AF)', borderRadius:16, padding:'14px 16px', marginBottom:14, textDecoration:'none' }}>
          <div style={{ fontSize:28 }}>🏛️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:13, color:'#fff' }}>MPSC अधिकृत वेबसाईट</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>mpsc.gov.in — नवीन notifications साठी click करा</div>
          </div>
          <ExternalLink size={16} style={{ color:'rgba(255,255,255,0.6)', flexShrink:0 }}/>
        </a>

        {/* Info note */}
        <div style={{ display:'flex', gap:8, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:12, padding:'10px 14px', marginBottom:14, fontSize:11, fontWeight:600, color:'#92400E' }}>
          <Info size={14} style={{ flexShrink:0, marginTop:1 }}/>
          <span>येथील notifications manually curated आहेत. Official source साठी वर दिलेल्या link वर जा.</span>
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:14, paddingBottom:4 }}>
          {[['all','सर्व'],['exam','परीक्षा'],['result','निकाल'],['admit','Admit'],['vacancy','Vacancy'],['syllabus','Syllabus']].map(([k,l]) => (
            <button key={k} onClick={()=>setFilter(k)}
              style={{ flexShrink:0, padding:'6px 12px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', border:`1.5px solid ${filter===k?'#DC2626':'rgba(0,0,0,0.1)'}`, background:filter===k?'rgba(220,38,38,0.1)':'#fff', color:filter===k?'#DC2626':'#7A9090', whiteSpace:'nowrap' }}>
              {l} {k==='all'?`(${notifications.length})`:''}
            </button>
          ))}
        </div>

        {/* Add form */}
        {showAdd && (
          <div style={{ background:'#fff', borderRadius:18, padding:'18px', marginBottom:14, boxShadow:'0 4px 20px rgba(0,0,0,0.1)', animation:'mn-fade 0.3s ease', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(90deg,#DC2626,#F97316)', backgroundSize:'200%', animation:'mn-shimmer 3s linear infinite' }}/>
            <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:12 }}>नवीन Notification Add करा</div>
            <input value={newNotif.title||''} onChange={e=>setNewNotif({...newNotif,title:e.target.value})}
              placeholder="Title (mpsc.gov.in वरून copy करा)" style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'11px 14px', fontSize:13, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', marginBottom:10, fontFamily:"'Baloo 2',sans-serif" }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <select value={newNotif.type||'general'} onChange={e=>setNewNotif({...newNotif,type:e.target.value as any})}
                style={{ background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'10px 12px', fontSize:12, fontWeight:700, color:'#1C2B2B', outline:'none' }}>
                {Object.entries(TYPE_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
              <input type="date" value={newNotif.date||''} onChange={e=>setNewNotif({...newNotif,date:e.target.value})}
                style={{ background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'10px 12px', fontSize:12, fontWeight:600, color:'#1C2B2B', outline:'none' }}/>
            </div>
            <input value={newNotif.link||''} onChange={e=>setNewNotif({...newNotif,link:e.target.value})}
              placeholder="Official link (mpsc.gov.in/...)" style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'10px 14px', fontSize:12, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', marginBottom:10, fontFamily:"'Baloo 2',sans-serif" }}/>
            <textarea value={newNotif.description||''} onChange={e=>setNewNotif({...newNotif,description:e.target.value})}
              placeholder="Description (optional)" rows={2} style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'10px 14px', fontSize:12, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', marginBottom:12, resize:'none', fontFamily:"'Baloo 2',sans-serif" }}/>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={addNotif} style={{ flex:2, background:'linear-gradient(135deg,#DC2626,#B91C1C)', border:'none', borderRadius:12, padding:'12px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer' }}>Add करा</button>
              <button onClick={()=>setShowAdd(false)} style={{ flex:1, background:'#F8F5F0', border:'none', borderRadius:12, padding:'12px', color:'#7A9090', fontWeight:800, fontSize:13, cursor:'pointer' }}>रद्द</button>
            </div>
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div style={{ background:'#fff', borderRadius:18, padding:'18px', marginBottom:14, boxShadow:'0 4px 20px rgba(0,0,0,0.1)', animation:'mn-fade 0.3s ease' }}>
            <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:12 }}>Edit Notification</div>
            <input value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}
              style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'11px 14px', fontSize:13, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', marginBottom:10, fontFamily:"'Baloo 2',sans-serif" }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <select value={editing.type} onChange={e=>setEditing({...editing,type:e.target.value as any})}
                style={{ background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'10px 12px', fontSize:12, fontWeight:700, color:'#1C2B2B', outline:'none' }}>
                {Object.entries(TYPE_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
              <input type="date" value={editing.date} onChange={e=>setEditing({...editing,date:e.target.value})}
                style={{ background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'10px 12px', fontSize:12, fontWeight:600, color:'#1C2B2B', outline:'none' }}/>
            </div>
            <input value={editing.link||''} onChange={e=>setEditing({...editing,link:e.target.value})}
              style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'10px 14px', fontSize:12, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', marginBottom:10, fontFamily:"'Baloo 2',sans-serif" }}/>
            <textarea value={editing.description||''} onChange={e=>setEditing({...editing,description:e.target.value})}
              rows={2} style={{ width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'10px 14px', fontSize:12, fontWeight:600, color:'#1C2B2B', boxSizing:'border-box', marginBottom:12, resize:'none', fontFamily:"'Baloo 2',sans-serif" }}/>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={saveEdit} style={{ flex:2, background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:12, padding:'12px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}><Save size={14}/> Save</button>
              <button onClick={()=>setEditing(null)} style={{ flex:1, background:'#F8F5F0', border:'none', borderRadius:12, padding:'12px', color:'#7A9090', fontWeight:800, fontSize:13, cursor:'pointer' }}>रद्द</button>
            </div>
          </div>
        )}

        {/* Notifications list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <Bell size={40} style={{ color:'#E5E7EB', display:'block', margin:'0 auto 12px' }}/>
            <div style={{ fontWeight:800, fontSize:14, color:'#1C2B2B' }}>या category मध्ये notifications नाहीत</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
              const isOpen = expanded === n.id;
              return (
                <div key={n.id} style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', animation:`mn-fade 0.2s ease ${i*0.04}s both`, borderLeft:`4px solid ${cfg.color}` }}>
                  <div style={{ padding:'14px 16px', cursor:'pointer' }} onClick={()=>setExpanded(isOpen?null:n.id)}>
                    <div style={{ display:'flex', alignItems:'start', gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                        {cfg.icon}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                          <span style={{ fontSize:9, fontWeight:800, color:cfg.color, background:cfg.bg, borderRadius:99, padding:'2px 8px', textTransform:'uppercase' }}>{cfg.label}</span>
                          {n.isNew && <span style={{ fontSize:9, fontWeight:900, color:'#fff', background:'#DC2626', borderRadius:99, padding:'2px 8px', animation:'mn-pulse 2s ease infinite' }}>NEW</span>}
                          <span style={{ fontSize:9, fontWeight:600, color:'#A8A29E', marginLeft:'auto' }}>📅 {new Date(n.date).toLocaleDateString('mr-IN')}</span>
                        </div>
                        <div style={{ fontWeight:800, fontSize:13, color:'#1C2B2B', lineHeight:1.5 }}>{n.title}</div>
                      </div>
                      {isAdmin && (
                        <div style={{ display:'flex', gap:5, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>setEditing(n)} style={{ background:'rgba(37,99,235,0.08)', border:'none', borderRadius:7, padding:'5px', cursor:'pointer', display:'flex' }}><Edit3 size={12} style={{color:'#2563EB'}}/></button>
                          <button onClick={()=>deleteNotif(n.id)} style={{ background:'rgba(220,38,38,0.08)', border:'none', borderRadius:7, padding:'5px', cursor:'pointer', display:'flex' }}><Trash2 size={12} style={{color:'#DC2626'}}/></button>
                        </div>
                      )}
                    </div>

                    {/* Expanded */}
                    {isOpen && (
                      <div style={{ marginTop:12, animation:'mn-fade 0.2s ease' }}>
                        {n.description && (
                          <p style={{ fontSize:12, fontWeight:600, color:'#4A6060', lineHeight:1.7, marginBottom:10 }}>{n.description}</p>
                        )}
                        {n.link && (
                          <a href={n.link} target="_blank" rel="noreferrer"
                            style={{ display:'inline-flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#1E3A5F,#1E40AF)', borderRadius:10, padding:'8px 14px', color:'#fff', fontWeight:800, fontSize:12, textDecoration:'none' }}>
                            <ExternalLink size={12}/> MPSC अधिकृत वेबसाईट वर जा
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(0,0,0,0.04)', borderRadius:12, fontSize:11, fontWeight:600, color:'#7A9090', textAlign:'center', lineHeight:1.6 }}>
          📌 सर्व notifications mpsc.gov.in वरून manually curated आहेत.<br/>
          Official confirmation साठी नेहमी <a href="https://mpsc.gov.in" target="_blank" rel="noreferrer" style={{color:'#2563EB',fontWeight:800}}>mpsc.gov.in</a> check करा.
        </div>
      </div>
    </div>
  );
};

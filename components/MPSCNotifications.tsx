import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Bell, ExternalLink, RefreshCw, Plus, Trash2,
  Edit3, Save, AlertCircle, CheckCircle2, Wifi, WifiOff, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props { onBack: () => void; isAdmin?: boolean; }

interface Notification {
  id: string; title: string;
  type: 'exam' | 'result' | 'admit' | 'syllabus' | 'vacancy' | 'general';
  date: string; link?: string; description?: string;
  is_new?: boolean; source: 'official' | 'manual'; scraped_at?: string;
}

const TYPE_CONFIG = {
  exam:     { label:'परीक्षा',    color:'#DC2626', bg:'rgba(220,38,38,0.08)',  icon:'📝' },
  result:   { label:'निकाल',      color:'#059669', bg:'rgba(5,150,105,0.08)', icon:'🏆' },
  admit:    { label:'Admit Card', color:'#2563EB', bg:'rgba(37,99,235,0.08)', icon:'🎫' },
  syllabus: { label:'Syllabus',   color:'#7C3AED', bg:'rgba(124,58,237,0.08)',icon:'📚' },
  vacancy:  { label:'Vacancy',    color:'#D97706', bg:'rgba(217,119,6,0.08)', icon:'💼' },
  general:  { label:'General',    color:'#E8671A', bg:'rgba(232,103,26,0.08)',icon:'📢' },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes mn-fade    { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
  @keyframes mn-shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes mn-pulse   { 0%,100%{opacity:1}50%{opacity:0.4} }
  @keyframes mn-spin    { to{transform:rotate(360deg)} }
  @keyframes mn-pop     { 0%{transform:scale(0.85);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1} }
  @keyframes mn-live    { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)}50%{box-shadow:0 0 0 6px rgba(34,197,94,0)} }
  input:focus, textarea:focus, select:focus { outline:none; border-color:#DC2626 !important; }
  .mn-card { transition:all 0.2s ease; }
  .mn-card:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,0,0,0.1) !important; }
`;

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 min UI polling

export const MPSCNotifications: React.FC<Props> = ({ onBack, isAdmin }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter,    setFilter]    = useState<string>('all');
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [editing,   setEditing]   = useState<Notification | null>(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [newNotif,  setNewNotif]  = useState<Partial<Notification>>({ type:'general', source:'manual' });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive,    setIsLive]    = useState(false);
  const [toast,     setToast]     = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const channelRef = useRef<any>(null);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load from Supabase ───────────────────────────────────────────────────
  const loadNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('mpsc_notifications')
        .select('*')
        .order('date', { ascending: false })
        .limit(60);
      if (error) throw error;
      setNotifications(data || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Notifications load error:', err.message);
      showToast('Notifications लोड होऊ शकल्या नाहीत', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Supabase Realtime subscription ───────────────────────────────────────
  useEffect(() => {
    loadNotifications();

    channelRef.current = supabase
      .channel('mpsc-notifications-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mpsc_notifications' },
        (payload) => {
          console.log('[Realtime]', payload.eventType, payload.new);

          if (payload.eventType === 'INSERT') {
            const n = payload.new as Notification;
            setNotifications(prev => {
              if (prev.find(x => x.id === n.id)) return prev;
              showToast(`🆕 नवीन notification: ${n.title.slice(0, 40)}...`);
              return [n, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(x => x.id === (payload.new as Notification).id ? payload.new as Notification : x)
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(x => x.id !== (payload.old as any).id));
          }
          setLastUpdated(new Date());
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
        console.log('[Realtime] status:', status);
      });

    // Polling fallback — दर 5 मिनिटांनी silent refresh
    const pollId = setInterval(() => loadNotifications(true), REFRESH_INTERVAL);

    return () => {
      supabase.removeChannel(channelRef.current);
      clearInterval(pollId);
    };
  }, []);

  // ── Server trigger — force mpsc.gov.in scrape ────────────────────────────
  const triggerScrape = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/notifications/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: '' }), // public trigger (no auth needed here)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ ${data.scraped} नवीन notifications scraped!`);
        await loadNotifications(true);
      } else {
        showToast('Scrape failed — check server logs', 'error');
      }
    } catch {
      // Fallback: just reload from Supabase
      await loadNotifications(true);
      showToast('Refreshed from database');
    } finally {
      setRefreshing(false);
    }
  };

  // ── Admin: Add manual notification ───────────────────────────────────────
  const addNotif = async () => {
    if (!newNotif.title?.trim()) return;
    const n: Notification = {
      id:         `manual-${Date.now()}`,
      title:      newNotif.title!,
      type:       (newNotif.type as Notification['type']) || 'general',
      date:       newNotif.date || new Date().toISOString().split('T')[0],
      link:       newNotif.link || 'https://mpsc.gov.in',
      description:newNotif.description,
      is_new:     true,
      source:     'manual',
      scraped_at: new Date().toISOString(),
    };
    try {
      const { error } = await supabase.from('mpsc_notifications').insert(n);
      if (error) throw error;
      setShowAdd(false);
      setNewNotif({ type:'general', source:'manual' });
      showToast('Notification add केली! ✅');
    } catch (err: any) {
      showToast('Add failed: ' + err.message, 'error');
    }
  };

  // ── Admin: Save edit ─────────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!editing) return;
    try {
      const { error } = await supabase
        .from('mpsc_notifications')
        .update(editing)
        .eq('id', editing.id);
      if (error) throw error;
      setEditing(null);
      showToast('Notification update केली! ✅');
    } catch (err: any) {
      showToast('Update failed: ' + err.message, 'error');
    }
  };

  // ── Admin: Delete ─────────────────────────────────────────────────────────
  const deleteNotif = async (id: string) => {
    if (!confirm('Delete करायचे?')) return;
    try {
      const { error } = await supabase.from('mpsc_notifications').delete().eq('id', id);
      if (error) throw error;
      showToast('Deleted ✅');
    } catch (err: any) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  const filtered   = notifications.filter(n => filter === 'all' || n.type === filter);
  const newCount   = notifications.filter(n => n.is_new).length;
  const timeAgo    = lastUpdated ? Math.round((Date.now() - lastUpdated.getTime()) / 60000) : null;

  const inputStyle: React.CSSProperties = {
    width:'100%', background:'#F8F5F0', border:'1.5px solid rgba(0,0,0,0.1)',
    borderRadius:12, padding:'11px 14px', fontSize:13, fontWeight:600,
    color:'#1C2B2B', boxSizing:'border-box', marginBottom:10,
    fontFamily:"'Baloo 2',sans-serif",
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom:60 }}>
      <style>{CSS}</style>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position:'fixed', top:16, left:'50%', transform:'translateX(-50%)', zIndex:999, background: toast.type==='success'?'#1C2B2B':'#DC2626', color:'#fff', borderRadius:14, padding:'10px 20px', fontSize:12, fontWeight:800, boxShadow:'0 8px 24px rgba(0,0,0,0.2)', animation:'mn-pop 0.3s ease', whiteSpace:'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ background:'rgba(255,255,255,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:640, margin:'0 auto', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', color:'#7A9090', display:'flex' }}>
            <ArrowLeft size={14}/>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:15, color:'#1C2B2B', display:'flex', alignItems:'center', gap:7 }}>
              <Bell size={15} style={{ color:'#DC2626' }}/>
              MPSC Notifications
              {/* Live indicator */}
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:99, background: isLive?'rgba(34,197,94,0.12)':'rgba(0,0,0,0.06)', color: isLive?'#16a34a':'#94A3B8', animation: isLive?'mn-live 2s infinite':undefined }}>
                {isLive ? <><Wifi size={9}/> LIVE</> : <><WifiOff size={9}/> Offline</>}
              </span>
            </div>
            <div style={{ fontSize:10, color:'#7A9090', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
              <Clock size={9}/>
              {timeAgo !== null ? timeAgo === 0 ? 'आत्ताच update झाले' : `${timeAgo} मिनिटांपूर्वी update` : 'Loading...'}
            </div>
          </div>

          {newCount > 0 && (
            <div style={{ background:'#DC2626', color:'#fff', borderRadius:99, padding:'3px 10px', fontSize:11, fontWeight:900, animation:'mn-pulse 2s ease infinite' }}>
              {newCount} नवीन
            </div>
          )}
          {isAdmin && (
            <button onClick={() => setShowAdd(true)}
              style={{ background:'linear-gradient(135deg,#DC2626,#B91C1C)', border:'none', borderRadius:10, padding:'7px 12px', color:'#fff', fontWeight:900, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              <Plus size={12}/> Add
            </button>
          )}
          <button onClick={triggerScrape} disabled={refreshing}
            style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:9, padding:'7px', cursor:'pointer', color:'#7A9090', display:'flex', opacity:refreshing?0.5:1 }}
            title="mpsc.gov.in वरून refresh करा">
            <RefreshCw size={13} style={refreshing ? { animation:'mn-spin 0.8s linear infinite' } : {}}/>
          </button>
        </div>
      </div>

      <div style={{ maxWidth:640, margin:'0 auto', padding:'16px' }}>

        {/* ── Official site banner ──────────────────────────────────────── */}
        <a href="https://mpsc.gov.in/home" target="_blank" rel="noreferrer"
          style={{ display:'flex', alignItems:'center', gap:10, background:'linear-gradient(135deg,#1E3A5F,#1E40AF)', borderRadius:16, padding:'14px 16px', marginBottom:12, textDecoration:'none' }}>
          <div style={{ fontSize:26 }}>🏛️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:13, color:'#fff' }}>MPSC अधिकृत वेबसाईट</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>mpsc.gov.in — Source of truth</div>
          </div>
          <ExternalLink size={15} style={{ color:'rgba(255,255,255,0.5)', flexShrink:0 }}/>
        </a>

        {/* ── Realtime status bar ───────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background: isLive?'rgba(34,197,94,0.08)':'rgba(0,0,0,0.04)', border:`1px solid ${isLive?'rgba(34,197,94,0.25)':'rgba(0,0,0,0.08)'}`, borderRadius:12, padding:'9px 14px', marginBottom:12, fontSize:11, fontWeight:700, color: isLive?'#16a34a':'#7A9090' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:isLive?'#22c55e':'#94A3B8', flexShrink:0, animation:isLive?'mn-pulse 1.5s ease infinite':undefined }}/>
          {isLive
            ? '🔴 Realtime Active — नवीन notification आल्यावर लगेच दिसेल'
            : '⚪ Realtime connect होत आहे...'}
          <span style={{ marginLeft:'auto', fontSize:10, color:'#94A3B8' }}>Auto-refresh: 30 min</span>
        </div>

        {/* ── Filter tabs ───────────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:14, paddingBottom:4 }}>
          {([
            ['all',      `सर्व (${notifications.length})`],
            ['exam',     '📝 परीक्षा'],
            ['result',   '🏆 निकाल'],
            ['admit',    '🎫 Admit'],
            ['vacancy',  '💼 Vacancy'],
            ['syllabus', '📚 Syllabus'],
          ] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ flexShrink:0, padding:'6px 13px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', border:`1.5px solid ${filter===k?'#DC2626':'rgba(0,0,0,0.1)'}`, background:filter===k?'rgba(220,38,38,0.1)':'#fff', color:filter===k?'#DC2626':'#7A9090', whiteSpace:'nowrap', transition:'all 0.15s' }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── Add form ─────────────────────────────────────────────────────  */}
        {showAdd && (
          <div style={{ background:'#fff', borderRadius:18, padding:'18px', marginBottom:14, boxShadow:'0 4px 20px rgba(0,0,0,0.1)', animation:'mn-fade 0.3s ease', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(90deg,#DC2626,#F97316)', backgroundSize:'200%', animation:'mn-shimmer 3s linear infinite' }}/>
            <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:12 }}>नवीन Notification Add करा</div>
            <input value={newNotif.title||''} onChange={e=>setNewNotif({...newNotif,title:e.target.value})}
              placeholder="Title (mpsc.gov.in वरून copy करा)" style={inputStyle}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <select value={newNotif.type||'general'} onChange={e=>setNewNotif({...newNotif,type:e.target.value as any})}
                style={{ ...inputStyle, marginBottom:0 }}>
                {Object.entries(TYPE_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
              <input type="date" value={newNotif.date||''} onChange={e=>setNewNotif({...newNotif,date:e.target.value})}
                style={{ ...inputStyle, marginBottom:0 }}/>
            </div>
            <input value={newNotif.link||''} onChange={e=>setNewNotif({...newNotif,link:e.target.value})}
              placeholder="Official link (mpsc.gov.in/...)" style={inputStyle}/>
            <textarea value={newNotif.description||''} onChange={e=>setNewNotif({...newNotif,description:e.target.value})}
              placeholder="Description (optional)" rows={2} style={{ ...inputStyle, resize:'none' }}/>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={addNotif} style={{ flex:2, background:'linear-gradient(135deg,#DC2626,#B91C1C)', border:'none', borderRadius:12, padding:'12px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer' }}>Supabase मध्ये Add करा</button>
              <button onClick={()=>setShowAdd(false)} style={{ flex:1, background:'#F8F5F0', border:'none', borderRadius:12, padding:'12px', color:'#7A9090', fontWeight:800, fontSize:13, cursor:'pointer' }}>रद्द</button>
            </div>
          </div>
        )}

        {/* ── Edit form ─────────────────────────────────────────────────── */}
        {editing && (
          <div style={{ background:'#fff', borderRadius:18, padding:'18px', marginBottom:14, boxShadow:'0 4px 20px rgba(0,0,0,0.1)', animation:'mn-fade 0.3s ease' }}>
            <div style={{ fontWeight:900, fontSize:14, color:'#1C2B2B', marginBottom:12 }}>Edit Notification</div>
            <input value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})} style={inputStyle}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <select value={editing.type} onChange={e=>setEditing({...editing,type:e.target.value as any})} style={{ ...inputStyle, marginBottom:0 }}>
                {Object.entries(TYPE_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
              <input type="date" value={editing.date} onChange={e=>setEditing({...editing,date:e.target.value})} style={{ ...inputStyle, marginBottom:0 }}/>
            </div>
            <input value={editing.link||''} onChange={e=>setEditing({...editing,link:e.target.value})} style={inputStyle}/>
            <textarea value={editing.description||''} onChange={e=>setEditing({...editing,description:e.target.value})} rows={2} style={{ ...inputStyle, resize:'none' }}/>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={saveEdit} style={{ flex:2, background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:12, padding:'12px', color:'#fff', fontWeight:900, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}><Save size={14}/> Save</button>
              <button onClick={()=>setEditing(null)} style={{ flex:1, background:'#F8F5F0', border:'none', borderRadius:12, padding:'12px', color:'#7A9090', fontWeight:800, fontSize:13, cursor:'pointer' }}>रद्द</button>
            </div>
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:20 }}>
            <div style={{ width:40, height:40, border:'4px solid rgba(220,38,38,0.2)', borderTopColor:'#DC2626', borderRadius:'50%', animation:'mn-spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
            <div style={{ fontWeight:800, fontSize:13, color:'#4A6060' }}>Notifications लोड होत आहेत...</div>
          </div>

        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:20 }}>
            <Bell size={40} style={{ color:'#E5E7EB', display:'block', margin:'0 auto 12px' }}/>
            <div style={{ fontWeight:800, fontSize:14, color:'#1C2B2B' }}>या category मध्ये notifications नाहीत</div>
          </div>

        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map((n, i) => {
              const cfg    = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
              const isOpen = expanded === n.id;
              return (
                <div key={n.id} className="mn-card"
                  style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', animation:`mn-fade 0.2s ease ${i*0.03}s both`, borderLeft:`4px solid ${cfg.color}` }}>
                  <div style={{ padding:'14px 16px', cursor:'pointer' }} onClick={() => setExpanded(isOpen?null:n.id)}>
                    <div style={{ display:'flex', alignItems:'start', gap:10 }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                        {cfg.icon}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5, flexWrap:'wrap' }}>
                          <span style={{ fontSize:9, fontWeight:800, color:cfg.color, background:cfg.bg, borderRadius:99, padding:'2px 8px', textTransform:'uppercase' }}>{cfg.label}</span>
                          {n.is_new && <span style={{ fontSize:9, fontWeight:900, color:'#fff', background:'#DC2626', borderRadius:99, padding:'2px 8px', animation:'mn-pulse 2s ease infinite' }}>NEW</span>}
                          {n.source === 'official' && <span style={{ fontSize:9, fontWeight:800, color:'#059669', background:'rgba(5,150,105,0.1)', borderRadius:99, padding:'2px 7px' }}>🏛️ Official</span>}
                          <span style={{ fontSize:9, fontWeight:600, color:'#A8A29E', marginLeft:'auto' }}>📅 {new Date(n.date).toLocaleDateString('mr-IN')}</span>
                        </div>
                        <div style={{ fontWeight:800, fontSize:13, color:'#1C2B2B', lineHeight:1.5 }}>{n.title}</div>
                      </div>

                      {isAdmin && (
                        <div style={{ display:'flex', gap:5, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => setEditing(n)} style={{ background:'rgba(37,99,235,0.08)', border:'none', borderRadius:7, padding:'5px', cursor:'pointer', display:'flex' }}><Edit3 size={11} style={{ color:'#2563EB' }}/></button>
                          <button onClick={() => deleteNotif(n.id)} style={{ background:'rgba(220,38,38,0.08)', border:'none', borderRadius:7, padding:'5px', cursor:'pointer', display:'flex' }}><Trash2 size={11} style={{ color:'#DC2626' }}/></button>
                        </div>
                      )}
                    </div>

                    {isOpen && (
                      <div style={{ marginTop:12, animation:'mn-fade 0.2s ease' }}>
                        {n.description && <p style={{ fontSize:12, fontWeight:600, color:'#4A6060', lineHeight:1.7, marginBottom:10 }}>{n.description}</p>}
                        {n.scraped_at && (
                          <div style={{ fontSize:10, color:'#B0CCCC', fontWeight:600, marginBottom:8 }}>
                            🕐 Scraped: {new Date(n.scraped_at).toLocaleString('mr-IN')}
                          </div>
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

        {/* ── Footer ───────────────────────────────────────────────────────  */}
        <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(0,0,0,0.04)', borderRadius:12, fontSize:11, fontWeight:600, color:'#7A9090', textAlign:'center', lineHeight:1.6 }}>
          🔴 Realtime updates — Supabase Realtime द्वारे live sync<br/>
          📌 Official confirmation साठी नेहमी{' '}
          <a href="https://mpsc.gov.in" target="_blank" rel="noreferrer" style={{ color:'#2563EB', fontWeight:800 }}>mpsc.gov.in</a> check करा.
        </div>
      </div>
    </div>
  );
};

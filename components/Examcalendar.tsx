import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Bell, Plus, X, ChevronLeft, ChevronRight, Clock, AlertCircle, CheckSquare } from 'lucide-react';

interface Props { onBack: () => void; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes ec-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ec-pop  { 0%{transform:scale(0.9);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes ec-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .ec-day:hover { background: rgba(232,103,26,0.08) !important; }
  .ec-btn:hover { transform: translateY(-1px); transition: 0.2s; }
`;

interface ExamEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'exam' | 'result' | 'form' | 'revision' | 'custom';
  notes?: string;
  reminder: boolean;
  color: string;
}

const TYPE_CONFIG = {
  exam:     { label: 'परीक्षा',     emoji: '📝', color: '#EF4444' },
  result:   { label: 'निकाल',       emoji: '📊', color: '#8B5CF6' },
  form:     { label: 'अर्ज',        emoji: '📋', color: '#3B82F6' },
  revision: { label: 'Revision',    emoji: '📖', color: '#10B981' },
  custom:   { label: 'Custom',       emoji: '⭐', color: '#F59E0B' },
};

const PRESET_EVENTS: ExamEvent[] = [
  { id: 'p1', title: 'MPSC Rajyaseva Prelims 2025', date: '2025-07-13', type: 'exam', reminder: true, color: '#EF4444' },
  { id: 'p2', title: 'MPSC Combined Prelims', date: '2025-08-10', type: 'exam', reminder: true, color: '#EF4444' },
  { id: 'p3', title: 'PSI / STI / ASO Prelims', date: '2025-09-07', type: 'exam', reminder: true, color: '#EF4444' },
  { id: 'p4', title: 'Talathi Bharti Last Date', date: '2025-06-30', type: 'form', reminder: true, color: '#3B82F6' },
  { id: 'p5', title: 'MPSC Mains 2024 Result', date: '2025-05-15', type: 'result', reminder: false, color: '#8B5CF6' },
];

const STORAGE_KEY = 'mpsc_exam_calendar';

function loadEvents(): ExamEvent[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return saved || PRESET_EVENTS;
  } catch { return PRESET_EVENTS; }
}
function saveEvents(events: ExamEvent[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch {}
}

export const ExamCalendar: React.FC<Props> = ({ onBack }) => {
  const [events, setEvents] = useState<ExamEvent[]>(loadEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<'calendar' | 'upcoming' | 'add'>('calendar');
  const [newEvent, setNewEvent] = useState<Partial<ExamEvent>>({ type: 'exam', reminder: true, color: '#EF4444' });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date().toISOString().split('T')[0];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const MONTHS = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'];
  const DAYS = ['रवि','सोम','मंगळ','बुध','गुरु','शुक्र','शनि'];

  const getDateEvents = (dateStr: string) => events.filter(e => e.date === dateStr);

  const addEvent = () => {
    if (!newEvent.title?.trim() || !newEvent.date) return;
    const ev: ExamEvent = {
      id: Date.now().toString(),
      title: newEvent.title.trim(),
      date: newEvent.date,
      type: newEvent.type as ExamEvent['type'],
      notes: newEvent.notes,
      reminder: newEvent.reminder ?? true,
      color: TYPE_CONFIG[newEvent.type as keyof typeof TYPE_CONFIG]?.color || '#F59E0B',
    };
    const updated = [...events, ev];
    setEvents(updated);
    saveEvents(updated);
    setNewEvent({ type: 'exam', reminder: true });
    setTab('calendar');
  };

  const deleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveEvents(updated);
  };

  // Days until next exam
  const upcomingExams = events
    .filter(e => e.type === 'exam' && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date(today).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const selectedDateEvents = selectedDate ? getDateEvents(selectedDate) : [];

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0D6B6E,#065F46)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>📅 Exam Calendar</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600 }}>
            {upcomingExams[0] ? `पुढील परीक्षा: ${daysUntil(upcomingExams[0].date)} दिवसांत` : 'परीक्षा dates track करा'}
          </div>
        </div>
        <button onClick={()=>{
          const upcoming=events.filter(e=>new Date(e.date)>=new Date()).slice(0,3);
          const lines=upcoming.map(e=>`• ${e.title}: ${new Date(e.date).toLocaleDateString('mr-IN')}`).join('\n');
          const t=`📅 MPSC Exam Calendar!\n\nआगामी परीक्षा:\n${lines||'कोणतीही परीक्षा नाही'}\n\nmpscsarathi.online`;
          window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank');
        }} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:10,width:36,height:36,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>📤</button>
        <button onClick={() => setTab('add')}
          style={{ background: '#E8671A', border: 'none', borderRadius: 12, padding: '8px 14px', color: '#fff', fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '2px solid #F5F0E8' }}>
        {([['calendar', '📅 Calendar'], ['upcoming', '⏰ Upcoming'], ['add', '➕ Add Event']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '11px 6px', fontWeight: 800, fontSize: 11, border: 'none', cursor: 'pointer', background: 'none', color: tab === t ? '#0D6B6E' : '#7A9090', borderBottom: tab === t ? '2px solid #0D6B6E' : '2px solid transparent', marginBottom: -2 }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', maxWidth: 520, margin: '0 auto' }}>

        {/* CALENDAR TAB */}
        {tab === 'calendar' && (
          <div style={{ animation: 'ec-fade 0.35s ease' }}>
            {/* Month nav */}
            <div style={{ background: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}
                  style={{ background: '#F5F0E8', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C2B2B' }}>
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontWeight: 900, fontSize: 16, color: '#1C2B2B' }}>{MONTHS[month]} {year}</span>
                <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}
                  style={{ background: '#F5F0E8', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C2B2B' }}>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 800, color: '#7A9090', padding: '4px 0' }}>{d}</div>)}
              </div>

              {/* Calendar grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = getDateEvents(dateStr);
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;
                  const isPast = dateStr < today;

                  return (
                    <div key={day} className="ec-day" onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      style={{ borderRadius: 10, padding: '6px 4px', textAlign: 'center', cursor: 'pointer', position: 'relative', background: isSelected ? '#0D6B6E' : isToday ? 'rgba(13,107,110,0.08)' : 'transparent', border: isToday ? '1.5px solid rgba(13,107,110,0.3)' : '1.5px solid transparent' }}>
                      <div style={{ fontWeight: isToday || isSelected ? 900 : 700, fontSize: 13, color: isSelected ? '#fff' : isToday ? '#0D6B6E' : isPast ? '#B0C0C0' : '#1C2B2B' }}>{day}</div>
                      {dayEvents.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                          {dayEvents.slice(0, 3).map((ev, ei) => (
                            <div key={ei} style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.8)' : ev.color }} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected date events */}
            {selectedDate && (
              <div style={{ animation: 'ec-pop 0.3s ease' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#1C2B2B', marginBottom: 8 }}>
                  📌 {selectedDate} चे events ({selectedDateEvents.length})
                </div>
                {selectedDateEvents.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: 14, padding: 16, textAlign: 'center', color: '#7A9090', fontWeight: 700, fontSize: 13 }}>
                    या दिवशी कोणताही event नाही<br />
                    <button onClick={() => { setNewEvent(prev => ({ ...prev, date: selectedDate })); setTab('add'); }}
                      style={{ marginTop: 10, background: '#0D6B6E', border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                      + Event जोडा
                    </button>
                  </div>
                ) : selectedDateEvents.map(ev => (
                  <div key={ev.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, borderLeft: `4px solid ${ev.color}` }}>
                    <span style={{ fontSize: 22 }}>{TYPE_CONFIG[ev.type].emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#1C2B2B' }}>{ev.title}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: ev.color }}>{TYPE_CONFIG[ev.type].label} {ev.reminder ? '🔔' : ''}</div>
                      {ev.notes && <div style={{ fontSize: 11, color: '#7A9090', marginTop: 2 }}>{ev.notes}</div>}
                    </div>
                    <button onClick={() => deleteEvent(ev.id)} style={{ background: 'rgba(220,38,38,0.08)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UPCOMING TAB */}
        {tab === 'upcoming' && (
          <div style={{ animation: 'ec-fade 0.35s ease' }}>
            {upcomingExams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7A9090' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>कोणत्याही परीक्षा नाहीत</div>
                <button onClick={() => setTab('add')} style={{ marginTop: 16, background: '#0D6B6E', border: 'none', borderRadius: 12, padding: '10px 20px', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                  + परीक्षा जोडा
                </button>
              </div>
            ) : (
              <>
                {/* Next exam countdown */}
                {upcomingExams[0] && (
                  <div style={{ background: 'linear-gradient(135deg,#7F1D1D,#450A0A)', borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: '0 8px 28px rgba(239,68,68,0.25)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 99, padding: '3px 10px', marginBottom: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', animation: 'ec-pulse 1.5s infinite' }} />
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#FCA5A5', textTransform: 'uppercase' }}>पुढील परीक्षा</span>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: '#fff', marginBottom: 6 }}>{upcomingExams[0].title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 900, fontSize: 32, color: '#FCA5A5', fontFamily: 'monospace' }}>{daysUntil(upcomingExams[0].date)}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>दिवस बाकी</div>
                      </div>
                      <div style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                        📅 {upcomingExams[0].date}
                      </div>
                    </div>
                  </div>
                )}

                {events.sort((a, b) => a.date.localeCompare(b.date)).filter(e => e.date >= today).map(ev => {
                  const days = daysUntil(ev.date);
                  const urgency = days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : '#10B981';
                  return (
                    <div key={ev.id} style={{ background: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, borderLeft: `4px solid ${ev.color}`, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                      <span style={{ fontSize: 24 }}>{TYPE_CONFIG[ev.type].emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: '#1C2B2B' }}>{ev.title}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#7A9090', marginTop: 2 }}>
                          📅 {ev.date} {ev.reminder ? '🔔' : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', background: `${urgency}10`, borderRadius: 12, padding: '6px 10px', minWidth: 52 }}>
                        <div style={{ fontWeight: 900, fontSize: 16, color: urgency, fontFamily: 'monospace' }}>{days}</div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: urgency }}>दिवस</div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ADD EVENT TAB */}
        {tab === 'add' && (
          <div style={{ animation: 'ec-fade 0.35s ease' }}>
            <div style={{ background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#1C2B2B', marginBottom: 16 }}>📅 नवीन Event</div>

              {/* Event type */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#7A9090', display: 'block', marginBottom: 6 }}>Event Type</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(Object.entries(TYPE_CONFIG) as [keyof typeof TYPE_CONFIG, typeof TYPE_CONFIG[keyof typeof TYPE_CONFIG]][]).map(([key, cfg]) => (
                    <button key={key} onClick={() => setNewEvent(prev => ({ ...prev, type: key, color: cfg.color }))}
                      style={{ padding: '6px 12px', borderRadius: 12, border: '1.5px solid', borderColor: newEvent.type === key ? cfg.color : 'rgba(28,43,43,0.1)', background: newEvent.type === key ? `${cfg.color}15` : '#F5F0E8', color: newEvent.type === key ? cfg.color : '#7A9090', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                      {cfg.emoji} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#7A9090', display: 'block', marginBottom: 6 }}>Title *</label>
                <input type="text" placeholder="e.g. MPSC Rajyaseva Prelims 2025"
                  value={newEvent.title || ''}
                  onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(28,43,43,0.12)', fontSize: 13, fontFamily: "'Baloo 2',sans-serif", fontWeight: 600, color: '#1C2B2B', background: '#F5F0E8', boxSizing: 'border-box' }} />
              </div>

              {/* Date */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#7A9090', display: 'block', marginBottom: 6 }}>Date *</label>
                <input type="date" value={newEvent.date || ''}
                  onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  min={today}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(28,43,43,0.12)', fontSize: 13, fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, color: '#1C2B2B', background: '#F5F0E8', boxSizing: 'border-box' }} />
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#7A9090', display: 'block', marginBottom: 6 }}>Notes (optional)</label>
                <input type="text" placeholder="कोणत्या hall, syllabus, link..."
                  value={newEvent.notes || ''}
                  onChange={e => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(28,43,43,0.12)', fontSize: 13, fontFamily: "'Baloo 2',sans-serif", fontWeight: 600, color: '#1C2B2B', background: '#F5F0E8', boxSizing: 'border-box' }} />
              </div>

              {/* Reminder toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, background: '#F5F0E8', borderRadius: 12, padding: '10px 14px' }}>
                <Bell size={16} color={newEvent.reminder ? '#0D6B6E' : '#7A9090'} />
                <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: '#1C2B2B' }}>Reminder on</span>
                <div onClick={() => setNewEvent(prev => ({ ...prev, reminder: !prev.reminder }))}
                  style={{ width: 44, height: 24, borderRadius: 12, background: newEvent.reminder ? '#0D6B6E' : '#D1D5DB', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: newEvent.reminder ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>

              <button onClick={addEvent} disabled={!newEvent.title?.trim() || !newEvent.date}
                style={{ width: '100%', background: newEvent.title?.trim() && newEvent.date ? 'linear-gradient(135deg,#0D6B6E,#065F46)' : '#E5E7EB', border: 'none', borderRadius: 14, padding: '14px', color: '#fff', fontWeight: 900, fontSize: 15, cursor: newEvent.title?.trim() && newEvent.date ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckSquare size={17} /> Event Save करा
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

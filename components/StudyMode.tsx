import React, { useState, useEffect, useMemo } from 'react';
import { Subject, LoadingState, RuleExplanation, SavedNote } from '../types';
import { generateStudyNotes, generateConciseExplanation } from '../services/gemini';
import { markTopicViewed, getProgress, saveNote } from '../services/storageService';
import { Book, Send, Loader2, ArrowLeft, Search, ListFilter, GraduationCap, ChevronDown, ChevronRight, Save, Check, Folder } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StudyModeProps {
  initialSubject?: Subject;
  onBack: () => void;
  onNavigateToQuiz?: (subject: Subject, topic: string) => void;
}

interface TopicGroup { category: string; topics: string[]; }

const GRAMMAR_STRUCTURE: Record<Subject, TopicGroup[]> = {
  [Subject.MARATHI]: [
    { category: "१. वर्णविचार (Phonology & Alphabet)", topics: ["मराठी वर्णमाला: स्वर, स्वरादी, व्यंजन", "वर्णांचे उच्चारस्थान", "संधी: स्वरसंधी नियमावली", "संधी: व्यंजनसंधी व विसर्गसंधी"] },
    { category: "२. नाम व नामाचे विकार (Nouns)", topics: ["नाम: प्रकार (सामान्य, विशेष, भाववाचक)", "लिंग विचार: नियम व अपवाद", "विभक्ती: प्रत्यय व कारकार्थ"] },
  ],
  [Subject.ENGLISH]: [
    { category: "1. Fundamentals & Parts of Speech", topics: ["Articles: A, An, The (Specific Rules)", "Nouns: Countable/Uncountable Traps", "Pronouns: Relative Pronouns Rules"] },
  ],
  [Subject.GS]: [
    { category: "Polity & Constitution (राज्यशास्त्र)", topics: ["Preamble & Fundamental Rights", "Parliament: President, Lok Sabha, Rajya Sabha", "Panchayat Raj Amendments"] },
  ],
};

const SUBJECT_CONFIG = {
  [Subject.MARATHI]: { label: 'मराठी व्याकरण', emoji: '📖', color: '#E8671A', bg: 'rgba(232,103,26,0.1)' },
  [Subject.ENGLISH]: { label: 'English Grammar', emoji: '🔤', color: '#0D6B6E', bg: 'rgba(13,107,110,0.1)' },
  [Subject.GS]:      { label: 'सामान्य अध्ययन', emoji: '🏛️', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap');
  @keyframes sm-fade { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes sm-spin { to{transform:rotate(360deg)} }
  @keyframes sm-pulse { 0%,100%{opacity:1}50%{opacity:0.6} }
  .sm-topic:hover { background:#FDF6EC !important; color:#E8671A !important; transform:translateX(3px) !important; }
  .sm-subj:hover  { transform:translateY(-2px) !important; box-shadow:0 6px 20px rgba(28,43,43,0.12) !important; }
  .sm-search input:focus { border-color:#E8671A !important; box-shadow:0 0 0 3px rgba(232,103,26,0.12) !important; }
  .prose p { margin-bottom: 12px; line-height: 1.75; color: #1C2B2B; }
  .prose h1,.prose h2,.prose h3 { color: #E8671A; font-weight: 900; margin: 20px 0 10px; }
  .prose ul,.prose ol { padding-left: 20px; color: #1C2B2B; }
  .prose li { margin-bottom: 6px; }
  .prose strong { color: #0D6B6E; font-weight: 800; }
  .prose code { background: #FDF6EC; border: 1px solid rgba(232,103,26,0.2); border-radius: 6px; padding: 2px 6px; font-size: 0.9em; color: #C4510E; }
`;

export const StudyMode: React.FC<StudyModeProps> = ({ initialSubject = Subject.MARATHI, onBack }) => {
  const [subject, setSubject]             = useState<Subject>(initialSubject);
  const [topic, setTopic]                 = useState('');
  const [notes, setNotes]                 = useState<string>('');
  const [status, setStatus]               = useState<LoadingState>('idle');
  const [activeTab, setActiveTab]         = useState<'search' | 'browse'>('search');
  const [expandedRule, setExpandedRule]   = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [ruleExplanations, setRuleExplanations] = useState<Record<string, any>>({});
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [ruleFilter, setRuleFilter]       = useState('');
  const [isSaved, setIsSaved]             = useState(false);
  const [viewedTopics, setViewedTopics]   = useState<string[]>([]);

  useEffect(() => {
    const progress = getProgress();
    setViewedTopics(progress.studyTopicsViewed || []);
  }, []);

  const generateNotes = async (topicToUse: string) => {
    if (!topicToUse.trim()) return;
    setStatus('loading');
    setTopic(topicToUse);
    try {
      const result = await generateStudyNotes(subject, topicToUse);
      setNotes(result.data);
      setStatus('success');
      markTopicViewed(topicToUse);
      const progress = getProgress();
      setIsSaved(progress.bookmarks?.notes?.some((n: any) => n.topic === topicToUse) || false);
    } catch (error) { setStatus('error'); }
  };

  const handleSaveNotes = () => {
    if (!notes || !topic) return;
    const note: SavedNote = { id: Date.now().toString(), subject, topic, content: notes, createdAt: new Date().toISOString() };
    saveNote(note);
    setIsSaved(true);
  };

  const toggleRule = async (rule: string) => {
    if (expandedRule === rule) { setExpandedRule(null); return; }
    setExpandedRule(rule);
    markTopicViewed(rule);
    setViewedTopics(p => [...new Set([...p, rule])]);
    if (!ruleExplanations[rule]) {
      setLoadingExplanation(true);
      try {
        const result = await generateConciseExplanation(subject, rule);
        setRuleExplanations(prev => ({ ...prev, [rule]: result }));
      } catch (e) { console.error(e); } finally { setLoadingExplanation(false); }
    }
  };

  const filteredStructure = useMemo(() => {
    const filter = ruleFilter.toLowerCase();
    const groups = GRAMMAR_STRUCTURE[subject] || [];
    if (!filter) return groups;
    return groups.map(g => ({ ...g, topics: g.topics.filter(t => t.toLowerCase().includes(filter)) })).filter(g => g.topics.length > 0);
  }, [subject, ruleFilter]);

  const cfg = SUBJECT_CONFIG[subject];

  const base: React.CSSProperties = {
    minHeight: '100vh', background: '#FDF6EC',
    fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", color: '#1C2B2B',
    padding: '0 0 80px',
  };

  return (
    <div style={base}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1C2B2B,#0D6B6E)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 20px rgba(13,107,110,0.3)', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 14px', color: '#FDF6EC', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
          <ArrowLeft size={14} /> मागे
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#F5C842', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1 }}>
            <Book size={16} /> AI Study Library
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 2 }}>Gemini AI powered · Smart syllabus</div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>

        {/* Subject selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
          {(Object.keys(SUBJECT_CONFIG) as Subject[]).map(s => {
            const c = SUBJECT_CONFIG[s];
            const active = subject === s;
            return (
              <button key={s} className="sm-subj"
                onClick={() => { setSubject(s); setNotes(''); setStatus('idle'); setTopic(''); }}
                style={{ background: active ? `linear-gradient(135deg,${c.color},${c.color}CC)` : '#fff', border: `2px solid ${active ? c.color : 'rgba(28,43,43,0.08)'}`, borderRadius: 16, padding: '14px 10px', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center', boxShadow: active ? `0 6px 20px ${c.color}30` : '0 2px 8px rgba(28,43,43,0.05)' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{c.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: 12, color: active ? '#fff' : '#1C2B2B', lineHeight: 1.2 }}>{c.label}</div>
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: 14, padding: 4, gap: 4, marginBottom: 20, boxShadow: '0 2px 8px rgba(28,43,43,0.06)', border: '1px solid rgba(28,43,43,0.07)' }}>
          {[{ id: 'search', label: 'Topic Search', icon: Search }, { id: 'browse', label: 'Syllabus Browse', icon: ListFilter }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', borderRadius: 11, border: 'none', background: activeTab === tab.id ? cfg.bg : 'transparent', color: activeTab === tab.id ? cfg.color : '#7A9090', fontWeight: 800, fontSize: 12, cursor: 'pointer', transition: 'all 0.18s', fontFamily: "'Baloo 2',sans-serif" }}>
              <tab.icon size={15} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Search tab */}
        {activeTab === 'search' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 20, boxShadow: '0 2px 12px rgba(28,43,43,0.06)', border: '1px solid rgba(28,43,43,0.07)' }}>
            <div className="sm-search" style={{ display: 'flex', gap: 10 }}>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateNotes(topic)}
                placeholder={`${cfg.label} topic टाका... (e.g. Fundamental Rights)`}
                style={{ flex: 1, background: '#FDF6EC', border: '1.5px solid rgba(28,43,43,0.1)', borderRadius: 12, padding: '12px 16px', color: '#1C2B2B', fontWeight: 600, fontSize: 14, outline: 'none', fontFamily: "'Baloo 2',sans-serif", transition: 'all 0.2s' }} />
              <button onClick={() => generateNotes(topic)} disabled={status === 'loading' || !topic.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: status === 'loading' || !topic.trim() ? 'rgba(28,43,43,0.08)' : `linear-gradient(135deg,${cfg.color},${cfg.color}CC)`, border: 'none', borderRadius: 12, padding: '12px 20px', color: status === 'loading' || !topic.trim() ? '#7A9090' : '#fff', fontWeight: 900, fontSize: 13, cursor: status === 'loading' || !topic.trim() ? 'not-allowed' : 'pointer', boxShadow: status === 'loading' || !topic.trim() ? 'none' : `0 4px 14px ${cfg.color}40`, transition: 'all 0.2s', fontFamily: "'Baloo 2',sans-serif" }}>
                {status === 'loading' ? <Loader2 size={18} style={{ animation: 'sm-spin 0.8s linear infinite' }} /> : <Send size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* Browse tab */}
        {activeTab === 'browse' && (
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 12px rgba(28,43,43,0.06)', border: '1px solid rgba(28,43,43,0.07)' }}>
            <div style={{ padding: '14px 18px', background: `linear-gradient(135deg,${cfg.color},${cfg.color}CC)`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ListFilter size={15} color="#fff" />
              <span style={{ fontWeight: 900, fontSize: 13, color: '#fff' }}>Syllabus Topics</span>
            </div>
            <div style={{ padding: '12px' }}>
              <input type="text" value={ruleFilter} onChange={e => setRuleFilter(e.target.value)} placeholder="Topics filter करा..."
                style={{ width: '100%', background: '#FDF6EC', border: '1.5px solid rgba(28,43,43,0.08)', borderRadius: 10, padding: '9px 14px', color: '#1C2B2B', fontWeight: 600, fontSize: 12, outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: "'Baloo 2',sans-serif" }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredStructure.map((group, idx) => (
                  <div key={idx} style={{ border: '1px solid rgba(28,43,43,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                    <button onClick={() => setOpenCategories(prev => ({ ...prev, [group.category]: !prev[group.category] }))}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', cursor: 'pointer', border: 'none', fontFamily: "'Baloo 2',sans-serif" }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 13, color: '#1C2B2B' }}>
                        <Folder size={16} style={{ color: cfg.color }} /> {group.category}
                      </div>
                      <ChevronDown size={16} style={{ color: '#7A9090', transform: openCategories[group.category] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {openCategories[group.category] && (
                      <div style={{ padding: '8px', background: '#FDF6EC', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {group.topics.map((t, tIdx) => (
                          <button key={tIdx} onClick={() => { toggleRule(t); setActiveTab('search'); generateNotes(t); }}
                            className="sm-topic"
                            style={{ width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 10, background: '#fff', border: '1px solid rgba(28,43,43,0.07)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#1C2B2B', transition: 'all 0.15s', fontFamily: "'Baloo 2',sans-serif" }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: viewedTopics.includes(t) ? '#10B981' : 'rgba(28,43,43,0.15)', flexShrink: 0 }} />
                              {t}
                            </span>
                            <ChevronRight size={14} style={{ color: '#7A9090', flexShrink: 0 }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid rgba(28,43,43,0.07)', boxShadow: '0 2px 12px rgba(28,43,43,0.06)' }}>
            <div style={{ width: 48, height: 48, border: `4px solid ${cfg.bg}`, borderTopColor: cfg.color, borderRadius: '50%', animation: 'sm-spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1C2B2B', marginBottom: 4 }}>AI Notes तयार होत आहेत...</div>
            <div style={{ fontSize: 12, color: '#7A9090', fontWeight: 600 }}>{topic}</div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 800, color: '#DC2626', marginBottom: 12 }}>Notes generate करताना error आला.</div>
            <button onClick={() => generateNotes(topic)} style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '8px 18px', color: '#DC2626', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>पुन्हा try करा</button>
          </div>
        )}

        {/* Notes */}
        {status === 'success' && notes && (
          <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 8px 32px rgba(28,43,43,0.1)', border: '1px solid rgba(28,43,43,0.07)', animation: 'sm-fade 0.4s ease' }}>
            <div style={{ padding: '20px 24px', background: `linear-gradient(135deg,${cfg.color},${cfg.color}CC)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <GraduationCap size={20} color="#fff" />
                <div>
                  <div style={{ fontWeight: 900, fontSize: 15, color: '#fff', letterSpacing: '-0.02em' }}>{topic}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginTop: 1 }}>{cfg.label} · AI Generated</div>
                </div>
              </div>
              <button onClick={handleSaveNotes}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: isSaved ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.15)', border: `1px solid ${isSaved ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.3)'}`, borderRadius: 10, padding: '8px 14px', color: isSaved ? '#10B981' : '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: "'Baloo 2',sans-serif" }}>
                {isSaved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save</>}
              </button>
            </div>
            <div className="prose" style={{ padding: '24px 28px', maxWidth: '100%', fontSize: 14, lineHeight: 1.75 }}>
              <ReactMarkdown>{notes}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

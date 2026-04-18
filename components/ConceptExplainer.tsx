import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, BookOpen, Copy, Check, History, Trash2, Share2 } from 'lucide-react';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }
interface SavedConcept { id: string; query: string; result: string; date: string; }

const EXAMPLES = [
  { label:'लोकशाही', q:'लोकशाही म्हणजे काय? MPSC साठी' },
  { label:'GDP vs GNP', q:'GDP आणि GNP मधला फरक सांगा' },
  { label:'Inflation', q:'Inflation म्हणजे काय? Types सांगा' },
  { label:'73 वी दुरुस्ती', q:'73 वी घटनादुरुस्ती म्हणजे काय?' },
  { label:'Separation of Powers', q:'Separation of Powers म्हणजे काय?' },
  { label:'Fundamental Rights', q:'मूलभूत हक्क कोणते? कलम कोणते?' },
  { label:'Photosynthesis', q:'Photosynthesis कसे होते? Simple explain' },
  { label:'न्यायपालिका', q:'भारतातील न्यायपालिका रचना सांगा' },
];

const SAVED_KEY = 'mpsc_concepts_saved';
const CSS = `
@keyframes ce-spin{to{transform:rotate(360deg)}}
@keyframes ce-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes ce-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
`;

export const ConceptExplainer: React.FC<Props> = ({ onBack }) => {
  const [query, setQuery]     = useState('');
  const [result, setResult]   = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState<SavedConcept[]>([]);
  const [tab, setTab]         = useState<'explain'|'history'>('explain');
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')); } catch {}
  }, []);

  const explain = async (q?: string) => {
    const src = q || query.trim();
    if (!src) { setError('Topic टाका!'); return; }
    setLoading(true); setError(''); setResult('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'तू MPSC exam teacher आहेस. Simple मराठी भाषेत concepts explain कर. Structured answer दे.',
          messages: [{ role: 'user', content:
            `"${src}" हे concept MPSC student ला explain कर:\n\n` +
            `**सोपी व्याख्या** (2-3 ओळी)\n` +
            `**महत्त्वाचे मुद्दे** (bullet points)\n` +
            `**MPSC साठी Important** (काय लक्षात ठेवायचे, कलम/वर्ष/संख्या)\n` +
            `**उदाहरण** (real world example)\n\n` +
            `मराठी मध्ये, simple आणि clear.`
          }],
          max_tokens: 600
        })
      });
      const data = await res.json();
      const text = data?.text?.trim() || '';
      setResult(text);
      addXP(8);
    } catch { setError('Explain होऊ शकले नाही. पुन्हा try करा.'); }
    setLoading(false);
  };

  const saveResult = () => {
    if (!result || !query) return;
    const newSaved: SavedConcept = {
      id: Date.now().toString(), query: query.trim(),
      result, date: new Date().toLocaleDateString('mr-IN')
    };
    const updated = [newSaved, ...saved].slice(0, 30);
    setSaved(updated);
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const deleteItem = (id: string) => {
    const updated = saved.filter(s => s.id !== id);
    setSaved(updated);
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  };

  const copy = () => {
    navigator.clipboard.writeText(result).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const share = () => {
    const t = `🧠 MPSC Concept: ${query}\n\n${result.slice(0, 200)}...\n\nmpscsarathi.online`;
    window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom: 60 }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 9, padding: '7px 10px', cursor: 'pointer', color: '#7A9090', display: 'flex' }}><ArrowLeft size={14} /></button>
        <div style={{ flex: 1, fontWeight: 900, fontSize: 15, color: '#1C2B2B', display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={16} style={{ color: '#2563EB' }} /> Concept Explainer</div>
        <div style={{ display: 'flex', background: '#F8F5F0', borderRadius: 10, padding: 3, gap: 3 }}>
          {[['explain', '💡 Explain'], ['history', `📚 Saved (${saved.length})`]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 11, background: tab === k ? '#2563EB' : 'transparent', color: tab === k ? '#fff' : '#7A9090' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px' }}>

        {tab === 'explain' ? (
          <>
            {/* Input */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '18px', marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#2563EB,#7C3AED)', backgroundSize: '200%', animation: 'ce-shimmer 3s linear infinite' }} />
              <textarea value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), explain())}
                placeholder="Topic किंवा question लिहा... उदा: GDP म्हणजे काय?"
                rows={2} style={{ width: '100%', background: '#F8F5F0', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#1C2B2B', boxSizing: 'border-box', marginBottom: 12, resize: 'none', fontFamily: "'Baloo 2',sans-serif", outline: 'none' }} />
              <button onClick={() => explain()} disabled={loading || !query.trim()}
                style={{ width: '100%', background: query.trim() ? 'linear-gradient(135deg,#2563EB,#1D4ED8)' : 'rgba(0,0,0,0.1)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontWeight: 900, fontSize: 14, cursor: loading || !query.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'ce-spin 0.8s linear infinite' }} /> Explaining...</> : <><Sparkles size={15} /> Explain करा</>}
              </button>
              {error && <div style={{ marginTop: 10, fontSize: 12, color: '#DC2626', fontWeight: 700 }}>⚠️ {error}</div>}
            </div>

            {/* Quick examples */}
            <div style={{ fontWeight: 800, fontSize: 10, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Quick Topics</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
              {EXAMPLES.map(e => (
                <button key={e.label} onClick={() => { setQuery(e.q); explain(e.q); }}
                  style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(37,99,235,0.2)', background: 'rgba(37,99,235,0.07)', color: '#2563EB' }}>
                  {e.label}
                </button>
              ))}
            </div>

            {/* Result */}
            {result && (
              <div style={{ background: '#fff', borderRadius: 18, padding: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', animation: 'ce-fade 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 900, fontSize: 13, color: '#1C2B2B' }}>📖 Explanation</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={share} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(37,211,102,0.1)', border: 'none', borderRadius: 9, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#25D366' }}>
                      <Share2 size={11} /> Share
                    </button>
                    <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied ? 'rgba(5,150,105,0.1)' : 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 9, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: copied ? '#059669' : '#7A9090' }}>
                      {copied ? <><Check size={11} />Copied!</> : <><Copy size={11} />Copy</>}
                    </button>
                    <button onClick={saveResult} style={{ display: 'flex', alignItems: 'center', gap: 5, background: justSaved ? 'rgba(5,150,105,0.1)' : 'rgba(37,99,235,0.08)', border: 'none', borderRadius: 9, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: justSaved ? '#059669' : '#2563EB' }}>
                      {justSaved ? '✅ Saved' : '💾 Save'}
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#4A6060', lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap' }}>{result}</p>
                <div style={{ marginTop: 12, background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 10, padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#1D4ED8' }}>
                  +8 ⚡ XP earned!
                </div>
              </div>
            )}
          </>
        ) : (
          // History tab
          <>
            {saved.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <BookOpen size={40} style={{ color: '#E5E7EB', display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1C2B2B' }}>अजून काहीही save केले नाही</div>
                <div style={{ fontSize: 12, color: '#7A9090', marginTop: 4 }}>Explain केल्यानंतर 💾 Save दाबा</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {saved.map(s => (
                  <div key={s.id} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '4px solid #2563EB' }}>
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <div style={{ fontWeight: 900, fontSize: 13, color: '#1C2B2B', flex: 1 }}>{s.query}</div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => { setQuery(s.query); setResult(s.result); setTab('explain'); }}
                          style={{ background: 'rgba(37,99,235,0.08)', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#2563EB' }}>View</button>
                        <button onClick={() => deleteItem(s.id)}
                          style={{ background: 'rgba(220,38,38,0.08)', border: 'none', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', display: 'flex' }}><Trash2 size={12} style={{ color: '#DC2626' }} /></button>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{s.date}</div>
                    <div style={{ fontSize: 12, color: '#7A9090', fontWeight: 600, marginTop: 6, lineHeight: 1.5 }}>
                      {s.result.slice(0, 100)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

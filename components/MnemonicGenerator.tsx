import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Copy, Check, Brain, Trash2, Share2, BookMarked } from 'lucide-react';
import { addXP } from './xpSystem';

interface Props { onBack: () => void; }
interface SavedMnemonic { id: string; topic: string; result: string; date: string; }

const TOPICS = [
  '6 मूलभूत हक्क', 'पंचवार्षिक योजना', 'महाराष्ट्राचे 6 विभाग',
  'भारतातील नद्या', 'VIBGYOR', 'ग्रह क्रम', 'राज्यघटनेचे भाग',
  '5 year plans', 'Indian Rivers East', 'Articles 12-35',
];

const SAVED_KEY = 'mpsc_mnemonics_saved';
const CSS = `
@keyframes mn-spin{to{transform:rotate(360deg)}}
@keyframes mn-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes mn-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
`;

export const MnemonicGenerator: React.FC<Props> = ({ onBack }) => {
  const [topic, setTopic]     = useState('');
  const [result, setResult]   = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState<SavedMnemonic[]>([]);
  const [tab, setTab]         = useState<'generate'|'saved'>('generate');
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')); } catch {}
  }, []);

  const generate = async (t?: string) => {
    const src = t || topic.trim();
    if (!src) { setError('Topic टाका!'); return; }
    setLoading(true); setError(''); setResult('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'तू MPSC exam memory expert आहेस. Creative मराठी mnemonics बनव.',
          messages: [{ role: 'user', content:
            `"${src}" साठी memory trick बनव:\n\n` +
            `🔤 **Acronym** — पहिल्या अक्षरांचा word/sentence\n` +
            `📖 **Story Method** — छोटी मजेदार story (5-6 ओळी)\n` +
            `👁️ **Visual Hook** — डोळ्यासमोर येईल असे picture\n` +
            `💡 **Quick Tip** — सर्वात सोपी trick\n\n` +
            `मराठी मध्ये, creative आणि MPSC exam साठी useful.`
          }],
          max_tokens: 600
        })
      });
      const data = await res.json();
      setResult(data?.text?.trim() || '');
      addXP(6);
    } catch { setError('Generate होऊ शकले नाही. पुन्हा try करा.'); }
    setLoading(false);
  };

  const saveResult = () => {
    if (!result || !topic) return;
    const n: SavedMnemonic = {
      id: Date.now().toString(), topic: topic.trim(),
      result, date: new Date().toLocaleDateString('mr-IN')
    };
    const updated = [n, ...saved].slice(0, 30);
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
    const t = `🧠 MPSC Mnemonic: ${topic}\n\n${result.slice(0, 200)}...\n\nmpscsarathi.online`;
    window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom: 60 }}>
      <style>{CSS}</style>

      <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 9, padding: '7px 10px', cursor: 'pointer', color: '#7A9090', display: 'flex' }}><ArrowLeft size={14} /></button>
        <div style={{ flex: 1, fontWeight: 900, fontSize: 15, color: '#1C2B2B', display: 'flex', alignItems: 'center', gap: 6 }}><Brain size={16} style={{ color: '#7C3AED' }} /> Mnemonic Generator</div>
        <div style={{ display: 'flex', background: '#F8F5F0', borderRadius: 10, padding: 3, gap: 3 }}>
          {[['generate', '🧠 Generate'], ['saved', `💾 Saved (${saved.length})`]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 11, background: tab === k ? '#7C3AED' : 'transparent', color: tab === k ? '#fff' : '#7A9090' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px' }}>
        {tab === 'generate' ? (
          <>
            <div style={{ background: '#fff', borderRadius: 20, padding: '18px', marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#7C3AED,#E8671A)', backgroundSize: '200%', animation: 'mn-shimmer 3s linear infinite' }} />
              <textarea value={topic} onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), generate())}
                placeholder="Topic टाका... उदा: मूलभूत हक्क, पंचवार्षिक योजना"
                rows={2} style={{ width: '100%', background: '#F8F5F0', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#1C2B2B', boxSizing: 'border-box', marginBottom: 12, resize: 'none', fontFamily: "'Baloo 2',sans-serif", outline: 'none' }} />
              <button onClick={() => generate()} disabled={loading || !topic.trim()}
                style={{ width: '100%', background: topic.trim() ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : 'rgba(0,0,0,0.1)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontWeight: 900, fontSize: 14, cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'mn-spin 0.8s linear infinite' }} /> बनवत आहे...</> : <><Sparkles size={15} /> Mnemonic बनवा</>}
              </button>
              {error && <div style={{ marginTop: 10, fontSize: 12, color: '#DC2626', fontWeight: 700 }}>⚠️ {error}</div>}
            </div>

            <div style={{ fontWeight: 800, fontSize: 10, color: '#7A9090', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Quick Topics</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
              {TOPICS.map(t => (
                <button key={t} onClick={() => { setTopic(t); generate(t); }}
                  style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.07)', color: '#7C3AED' }}>{t}</button>
              ))}
            </div>

            {result && (
              <div style={{ background: '#fff', borderRadius: 18, padding: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', animation: 'mn-fade 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 900, fontSize: 13, color: '#1C2B2B' }}>🧠 Mnemonic तयार!</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={share} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(37,211,102,0.1)', border: 'none', borderRadius: 9, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#25D366' }}>
                      <Share2 size={11} /> Share
                    </button>
                    <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied ? 'rgba(5,150,105,0.1)' : 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 9, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: copied ? '#059669' : '#7A9090' }}>
                      {copied ? <><Check size={11} />Copied!</> : <><Copy size={11} />Copy</>}
                    </button>
                    <button onClick={saveResult} style={{ display: 'flex', alignItems: 'center', gap: 5, background: justSaved ? 'rgba(5,150,105,0.1)' : 'rgba(124,58,237,0.08)', border: 'none', borderRadius: 9, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: justSaved ? '#059669' : '#7C3AED' }}>
                      {justSaved ? '✅ Saved' : <><BookMarked size={11} />Save</>}
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#4A6060', lineHeight: 1.85, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{result}</p>
                <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 10, padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>
                  +6 ⚡ XP earned!
                </div>
              </div>
            )}
          </>
        ) : (
          saved.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20 }}>
              <Brain size={40} style={{ color: '#E5E7EB', display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 800, fontSize: 14, color: '#1C2B2B' }}>अजून काहीही save केले नाही</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {saved.map(s => (
                <div key={s.id} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '4px solid #7C3AED' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 900, fontSize: 13, color: '#1C2B2B' }}>{s.topic}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setTopic(s.topic); setResult(s.result); setTab('generate'); }}
                        style={{ background: 'rgba(124,58,237,0.08)', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>View</button>
                      <button onClick={() => deleteItem(s.id)}
                        style={{ background: 'rgba(220,38,38,0.08)', border: 'none', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', display: 'flex' }}><Trash2 size={12} style={{ color: '#DC2626' }} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 700, marginBottom: 6 }}>{s.date}</div>
                  <div style={{ fontSize: 12, color: '#7A9090', lineHeight: 1.5 }}>{s.result.slice(0, 100)}...</div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

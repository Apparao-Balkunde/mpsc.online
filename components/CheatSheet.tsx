import React, { useState } from 'react';
import { ArrowLeft, FileText, ChevronDown, ChevronUp, Search, Copy, Check } from 'lucide-react';

interface Props { onBack: () => void; }

const SHEETS = [
  {
    subject: 'राज्यघटना', emoji: '⚖️', color: '#2563EB',
    sections: [
      { title: 'प्रमुख कलमे (Articles)', items: ['Art 12-35 → मूलभूत हक्क (Fundamental Rights)','Art 36-51 → DPSP (Directive Principles)','Art 51A → मूलभूत कर्तव्ये (Fundamental Duties)','Art 52-78 → कार्यकारी मंडळ (President/VP/PM)','Art 79-122 → संसद (Parliament)','Art 123 → Ordinance (Pres)','Art 124-147 → सर्वोच्च न्यायालय','Art 153-167 → राज्य कार्यकारी','Art 214-237 → उच्च न्यायालये','Art 243 → पंचायती राज (73rd Amdt)','Art 244 → Scheduled Areas','Art 280 → Finance Commission','Art 300A → Property Right (non-fundamental)','Art 315 → UPSC/SPSC','Art 324 → Election Commission','Art 356 → President\'s Rule','Art 368 → Amendment Procedure','Art 370 (repealed) → J&K Special Status'] },
      { title: 'महत्त्वाच्या घटनादुरुस्त्या', items: ['1st (1951) → Land Reform','7th (1956) → States Reorganization','42nd (1976) → Mini Constitution','44th (1978) → Property right removed','61st (1988) → Voting age 21→18','73rd (1992) → Panchayati Raj','74th (1992) → Nagarpalika','86th (2002) → RTE Art 21A','101st (2016) → GST','102nd (2018) → OBC Commission','103rd (2019) → EWS 10% reservation'] },
      { title: 'Borrowed Features', items: ['UK → Cabinet System, Parliamentary Democracy','USA → Fundamental Rights, Judicial Review, Preamble','Ireland → DPSP','Canada → Federation + Residuary Powers','Australia → Concurrent List, Joint Session','Germany → Emergency Provisions','USSR → Fundamental Duties','France → Republic, Liberty','Japan → Procedure Established by Law','South Africa → Amendment Procedure (2/3 majority)'] },
    ]
  },
  {
    subject: 'इतिहास', emoji: '📜', color: '#D97706',
    sections: [
      { title: 'मराठा साम्राज्य - Key Dates', items: ['1627 → शिवाजी महाराज जन्म','1645 → तोरणा किल्ला जिंकला (पहिला)','1659 → अफजलखान वध','1664 → सुरत लूट (1st)','1674 → राज्याभिषेक — रायगड','1680 → शिवाजी महाराज निधन','1707 → औरंगजेब निधन → मराठा उदय','1749-61 → Peshwa peak','1761 → Panipat 3rd Battle','1817-18 → Anglo-Maratha War 3rd (Peshwa संपला)'] },
      { title: '1857 स्वातंत्र्ययुद्ध', items: ['10 May 1857 → Meerut (सुरुवात)','Mangal Pandey → 34th BNI, Barrackpore','Rani Lakshmibai → Jhansi','Nana Saheb → Kanpur','Tatya Tope → Nana Saheb सेनापती','Begum Hazrat Mahal → Lucknow','Bakht Khan → Delhi','Lord Canning → Viceroy at time','Cause → Enfield rifle (pork/beef grease)'] },
      { title: 'राष्ट्रीय चळवळी', items: ['1885 → INC स्थापना (A.O. Hume)','1905 → Partition of Bengal + Swadeshi','1906 → Muslim League स्थापना','1911 → Bengal Partition रद्द','1915 → Gandhi India परतले','1919 → Jallianwala Bagh','1920 → Non-Cooperation Movement','1930 → Civil Disobedience + Dandi March','1942 → Quit India Movement','15 Aug 1947 → Independence','26 Jan 1950 → Republic Day'] },
    ]
  },
  {
    subject: 'भूगोल', emoji: '🗺️', color: '#059669',
    sections: [
      { title: 'महाराष्ट्र - Key Facts', items: ['Capital → Mumbai (summer), Nagpur (winter)','Area → 3,07,713 km² (3rd largest)','Districts → 36 | Divisions → 6','Borders → Gujarat, MP, Chhattisgarh, Telangana, Karnataka, Goa','Highest Peak → Kalsubai (1646m) — Ahmednagar','Rivers → Godavari, Krishna, Tapi, Wainganga, Koyna','Forests → 61,939 km²','Tadoba (Chandrapur) → Largest Tiger Reserve'] },
      { title: 'भारत - प्रमुख नद्या', items: ['Himalayan Rivers → Ganga, Yamuna, Brahmaputra (perennial)','Peninsular Rivers → Godavari (Dakshin Ganga), Krishna, Kaveri, Mahanadi','West flowing → Narmada, Tapi (in rift valleys)','East flowing → Most peninsular rivers → Bay of Bengal','Longest → Ganga (2525 km)','Largest Basin → Ganga Basin','Maharashtra longest → Godavari (1465 km total)'] },
      { title: 'हवामान - Seasons', items: ['Hot Dry Season → Mar-May','SW Monsoon → Jun-Sep (ओले वारे)','Retreating Monsoon → Oct-Nov','Cold/Winter → Dec-Feb','Highest Rainfall → Mawsynram (Meghalaya) 11,873 mm','Maharashtra highest → Amboli (Sindhudurg)','Rain shadow area → Pune, Nashik, Solapur'] },
    ]
  },
  {
    subject: 'अर्थशास्त्र', emoji: '💹', color: '#7C3AED',
    sections: [
      { title: 'महत्त्वाचे Terms', items: ['GDP → Gross Domestic Product (देशांतर्गत उत्पादन)','GNP → GDP + विदेशातून उत्पन्न','NDP → GDP - Depreciation','GNI → GNP चेच दुसरे नाव','PPP → Purchasing Power Parity','CPI → Consumer Price Index (Inflation मोजतात)','WPI → Wholesale Price Index','Fiscal Deficit → Govt expenditure > Revenue','REPO Rate → RBI → Banks ला कर्ज दर','Reverse Repo → Banks → RBI ला'] },
      { title: 'Five Year Plans', items: ['1st (1951-56) → Agriculture focus','2nd (1956-61) → Heavy Industry (Mahalanobis)','3rd (1961-66) → Self-reliance — Failed (wars)','4-5th → Green Revolution focus','6th (1980-85) → Poverty Alleviation','7th (1985-90) → Food, Work, Productivity','8th (1992-97) → Liberalization era','9th (1997-02) → Social Justice','10th (2002-07) → 8% growth target','11th (2007-12) → Faster, Inclusive Growth','12th (2012-17) → Last Plan — Niti Aayog replaced'] },
      { title: 'Budget Terms', items: ['Revenue Budget → Revenue receipts & expenditure','Capital Budget → Capital receipts & expenditure','Revenue Deficit → Revenue exp > Revenue receipts','Fiscal Deficit → Total deficit (borrowings needed)','Primary Deficit → Fiscal deficit - Interest payments','Direct Tax → Income Tax, Corporate Tax','Indirect Tax → GST (replaced ST, Excise, VAT)','GST introduced → 1 July 2017','GST Council → Art 279A'] },
    ]
  },
  {
    subject: 'विज्ञान', emoji: '🔬', color: '#0891B2',
    sections: [
      { title: 'Physics - Key Laws', items: ['Newton 1st → Inertia (जड़त्व)','Newton 2nd → F = ma','Newton 3rd → Action-Reaction','Archimedes → Buoyancy (upthrust)','Ohm\'s Law → V = IR','Joule\'s Law → Heat = I²Rt','Faraday → Electromagnetic Induction','Doppler Effect → Sound frequency change with motion','Bernoulli → Pressure + velocity in fluids'] },
      { title: 'Chemistry - Basics', items: ['Atomic number → Protons','Mass number → Protons + Neutrons','Isotopes → Same atomic no, diff mass','Isobars → Same mass no, diff atomic no','pH scale → 0-14 (7=neutral, <7=acid, >7=base)','Oxidation → Electron loss','Reduction → Electron gain','Catalyst → Reaction speed up (unchanged)','Soap → Na/K salt of fatty acids'] },
      { title: 'Biology - MPSC', items: ['Cell Theory → Schleiden & Schwann (1839)','DNA → Deoxyribonucleic Acid → Double Helix (Watson & Crick 1953)','Photosynthesis → 6CO₂+6H₂O → C₆H₁₂O₆+6O₂','Blood groups → ABO system (Landsteiner)','Rh factor → Landsteiner & Wiener','Insulin → Banting & Best (1921)','Penicillin → Alexander Fleming (1928)','Malaria parasite → Plasmodium → Anopheles mosquito'] },
    ]
  },
  {
    subject: 'चालू घडामोडी Shortcuts', emoji: '📰', color: '#EC4899',
    sections: [
      { title: 'महाराष्ट्र - Chief Ministers', items: ['Yashwantrao Chavan → 1st CM (1960)','Devendra Fadnavis → BJP','Uddhav Thackeray → MVA Govt','Eknath Shinde → Shiv Sena split (2022)','Fadnavis → Dec 2024 — Current CM','Eknath Shinde → Deputy CM','Ajit Pawar → Deputy CM'] },
      { title: 'Awards 2024-25', items: ['Bharat Ratna 2024 → Karpoori Thakur, LK Advani, PV Narasimha Rao, Chaudhary Charan Singh, MS Swaminathan (5 total)','Padma Vibhushan → Venkaiah Naidu, Bindeshwar Pathak etc.','Nobel 2024 Peace → Nihon Hidankyo (Japan)','Nobel Literature → Han Kang (South Korea)','Booker Prize 2024 → James (Percival Everett)','Oscar 2024 Best Picture → Oppenheimer'] },
      { title: 'Important Organisations', items: ['UN → 1945, 193 members, NY HQ','IMF + World Bank → Bretton Woods (1944)','WTO → 1995 (replaced GATT)','WHO → Geneva','UNICEF → NYC','NATO → 1949','SAARC → 1985, 8 members','BRICS → Brazil, Russia, India, China, SA (+6 new 2024)','SCO → Shanghai Cooperation Organisation','G20 India hosted → 2023 (New Delhi)'] },
    ]
  },
];

const CSS = `
@keyframes cs-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
`;

export const CheatSheet: React.FC<Props> = ({ onBack }) => {
  const [selected, setSelected] = useState(SHEETS[0]);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['0']));
  const [search, setSearch]     = useState('');
  const [copied, setCopied]     = useState<string|null>(null);

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const copyItem = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key); setTimeout(() => setCopied(null), 1500);
  };

  const filtered = selected.sections.map(sec => ({
    ...sec,
    items: search
      ? sec.items.filter(item => item.toLowerCase().includes(search.toLowerCase()))
      : sec.items
  })).filter(sec => !search || sec.items.length > 0);

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "'Baloo 2','Noto Sans Devanagari',sans-serif", paddingBottom: 60 }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 9, padding: '7px 10px', cursor: 'pointer', color: '#7A9090', display: 'flex' }}><ArrowLeft size={14} /></button>
          <div style={{ flex: 1, fontWeight: 900, fontSize: 15, color: '#1C2B2B', display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={16} style={{ color: '#E8671A' }} /> Cheat Sheet</div>
        </div>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#B0CCCC' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics..."
            style={{ width: '100%', background: '#F8F5F0', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 11, padding: '8px 12px 8px 30px', fontSize: 13, fontWeight: 600, color: '#1C2B2B', outline: 'none', boxSizing: 'border-box', fontFamily: "'Baloo 2',sans-serif" }} />
        </div>
        {/* Subject tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {SHEETS.map(s => (
            <button key={s.subject} onClick={() => { setSelected(s); setSearch(''); setOpenSections(new Set(['0'])); }}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: `1.5px solid ${selected.subject === s.subject ? s.color : 'rgba(0,0,0,0.1)'}`, background: selected.subject === s.subject ? `${s.color}15` : '#fff', color: selected.subject === s.subject ? s.color : '#7A9090', whiteSpace: 'nowrap' }}>
              {s.emoji} {s.subject}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 16px', animation: 'cs-fade 0.3s ease' }}>
        {filtered.map((sec, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, marginBottom: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: `4px solid ${selected.color}` }}>
            <button onClick={() => toggleSection(String(i))}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontWeight: 900, fontSize: 14, color: '#1C2B2B' }}>{sec.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: selected.color, background: `${selected.color}15`, borderRadius: 99, padding: '2px 8px' }}>{sec.items.length}</span>
                {openSections.has(String(i)) ? <ChevronUp size={14} style={{ color: '#7A9090' }} /> : <ChevronDown size={14} style={{ color: '#7A9090' }} />}
              </div>
            </button>
            {openSections.has(String(i)) && (
              <div style={{ padding: '0 12px 12px' }}>
                {sec.items.map((item, j) => {
                  const key = `${i}-${j}`;
                  const parts = item.split('→');
                  return (
                    <div key={j} style={{ display: 'flex', alignItems: 'start', gap: 8, padding: '7px 8px', borderRadius: 10, background: j % 2 === 0 ? '#F8F5F0' : 'transparent', marginBottom: 3, cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => copyItem(item, key)}>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#1C2B2B', lineHeight: 1.5 }}>
                        {parts.length > 1 ? (
                          <><span style={{ fontWeight: 900, color: selected.color }}>{parts[0].trim()}</span><span style={{ color: '#7A9090' }}> → </span><span>{parts.slice(1).join('→').trim()}</span></>
                        ) : item}
                      </div>
                      <div style={{ flexShrink: 0, opacity: 0.5 }}>
                        {copied === key ? <Check size={11} style={{ color: '#059669' }} /> : <Copy size={11} style={{ color: '#9CA3AF' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16 }}>
            <div style={{ fontSize: 13, color: '#7A9090', fontWeight: 600 }}>"{search}" साठी काहीही सापडले नाही</div>
          </div>
        )}
      </div>
    </div>
  );
};

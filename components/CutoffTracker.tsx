import React, { useState } from 'react';
import { X, TrendingDown, TrendingUp, Info } from 'lucide-react';

interface Props { onClose: () => void; }

const DATA: Record<string, { year:number; gen:number; obc:number; sc:number; st:number }[]> = {
  'राज्यसेवा (Prelims)': [
    {year:2019,gen:128,obc:118,sc:108,st:104},
    {year:2020,gen:132,obc:122,sc:112,st:108},
    {year:2021,gen:125,obc:115,sc:105,st:100},
    {year:2022,gen:135,obc:124,sc:114,st:110},
    {year:2023,gen:138,obc:127,sc:116,st:112},
  ],
  'PSI (Prelims)': [
    {year:2019,gen:112,obc:102,sc:95,st:90},
    {year:2020,gen:118,obc:108,sc:98,st:94},
    {year:2021,gen:115,obc:105,sc:96,st:92},
    {year:2022,gen:122,obc:111,sc:101,st:97},
    {year:2023,gen:124,obc:113,sc:103,st:99},
  ],
  'STI (Prelims)': [
    {year:2019,gen:108,obc:98,sc:90,st:86},
    {year:2020,gen:114,obc:104,sc:94,st:90},
    {year:2021,gen:110,obc:100,sc:92,st:88},
    {year:2022,gen:118,obc:107,sc:97,st:93},
    {year:2023,gen:120,obc:109,sc:99,st:95},
  ],
  'ASO (Prelims)': [
    {year:2019,gen:105,obc:95,sc:88,st:84},
    {year:2020,gen:110,obc:100,sc:90,st:86},
    {year:2021,gen:108,obc:98,sc:89,st:85},
    {year:2022,gen:115,obc:104,sc:94,st:90},
    {year:2023,gen:117,obc:106,sc:96,st:92},
  ],
};

const CATEGORIES = ['gen','obc','sc','st'] as const;
const CAT_LABELS: Record<string,string> = {gen:'General',obc:'OBC',sc:'SC',st:'ST'};
const CAT_COLORS: Record<string,string> = {gen:'#2563EB',obc:'#E8671A',sc:'#059669',st:'#7C3AED'};

const CSS = `@keyframes ct-fade{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}} @keyframes ct-shimmer{0%{background-position:-200% center}100%{background-position:200% center}} @keyframes ct-bar{from{height:0}to{height:var(--h)}}`;

export const CutoffTracker: React.FC<Props> = ({ onClose }) => {
  const [exam, setExam]     = useState('राज्यसेवा (Prelims)');
  const [activeCat, setActiveCat] = useState<typeof CATEGORIES[number]>('gen');
  const exams = Object.keys(DATA);
  const rows  = DATA[exam];
  const maxVal = Math.max(...rows.map(r => Math.max(r.gen, r.obc, r.sc, r.st)));
  const minVal = Math.min(...rows.map(r => Math.min(r.gen, r.obc, r.sc, r.st)));
  const latest = rows[rows.length-1];
  const prev   = rows[rows.length-2];
  const trend  = latest[activeCat] - prev[activeCat];

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(28,43,43,0.55)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16,fontFamily:"'Baloo 2','Noto Sans Devanagari',sans-serif"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <style>{CSS}</style>
      <div style={{background:'#fff',borderRadius:28,width:'100%',maxWidth:460,maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column',animation:'ct-fade 0.35s cubic-bezier(.34,1.56,.64,1)',boxShadow:'0 20px 60px rgba(28,43,43,0.15)'}}>
        <div style={{height:4,background:'linear-gradient(90deg,#2563EB,#E8671A)',backgroundSize:'200%',animation:'ct-shimmer 3s linear infinite',flexShrink:0}}/>
        <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(0,0,0,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{fontWeight:900,fontSize:15,color:'#1C2B2B',display:'flex',alignItems:'center',gap:8}}>📊 Cut-off Tracker</div>
          <button onClick={onClose} style={{background:'#F8F5F0',border:'none',borderRadius:9,width:30,height:30,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#7A9090'}}><X size={14}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'16px 20px 20px'}}>
          {/* Exam selector */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
            {exams.map(e=>(
              <button key={e} onClick={()=>setExam(e)}
                style={{padding:'6px 12px',borderRadius:99,fontSize:11,fontWeight:700,cursor:'pointer',border:`1.5px solid ${exam===e?'#2563EB':'rgba(0,0,0,0.1)'}`,background:exam===e?'rgba(37,99,235,0.1)':'#fff',color:exam===e?'#2563EB':'#7A9090'}}>
                {e}
              </button>
            ))}
          </div>

          {/* Category tabs */}
          <div style={{display:'flex',background:'#F8F5F0',borderRadius:12,padding:3,marginBottom:16,gap:3}}>
            {CATEGORIES.map(c=>(
              <button key={c} onClick={()=>setActiveCat(c)}
                style={{flex:1,padding:'8px',borderRadius:10,fontWeight:800,fontSize:11,cursor:'pointer',border:'none',background:activeCat===c?CAT_COLORS[c]:'transparent',color:activeCat===c?'#fff':'#7A9090',transition:'all 0.2s'}}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>

          {/* Latest + trend */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18}}>
            <div style={{background:`${CAT_COLORS[activeCat]}10`,border:`1px solid ${CAT_COLORS[activeCat]}30`,borderRadius:14,padding:'14px',textAlign:'center'}}>
              <div style={{fontSize:10,fontWeight:700,color:'#7A9090',textTransform:'uppercase',marginBottom:4}}>2023 Cut-off</div>
              <div style={{fontWeight:900,fontSize:32,color:CAT_COLORS[activeCat]}}>{latest[activeCat]}</div>
              <div style={{fontSize:10,fontWeight:600,color:'#7A9090'}}>out of 200</div>
            </div>
            <div style={{background:trend>0?'rgba(220,38,38,0.06)':'rgba(5,150,105,0.06)',border:`1px solid ${trend>0?'rgba(220,38,38,0.2)':'rgba(5,150,105,0.2)'}`,borderRadius:14,padding:'14px',textAlign:'center'}}>
              <div style={{fontSize:10,fontWeight:700,color:'#7A9090',textTransform:'uppercase',marginBottom:4}}>vs 2022</div>
              <div style={{fontWeight:900,fontSize:28,color:trend>0?'#DC2626':'#059669',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                {trend>0?<TrendingUp size={20}/>:<TrendingDown size={20}/>}{trend>0?'+':''}{trend}
              </div>
              <div style={{fontSize:10,fontWeight:600,color:'#7A9090'}}>{trend>0?'वाढला':'कमी झाला'}</div>
            </div>
          </div>

          {/* Bar chart */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:800,color:'#4A6060',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12}}>Year-wise Trend</div>
            <div style={{display:'flex',alignItems:'flex-end',gap:8,height:140,padding:'0 4px'}}>
              {rows.map((r,i)=>{
                const h = Math.round(((r[activeCat]-minVal+10)/(maxVal-minVal+10))*110);
                return (
                  <div key={r.year} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <div style={{fontSize:10,fontWeight:900,color:CAT_COLORS[activeCat]}}>{r[activeCat]}</div>
                    <div style={{width:'100%',height:h,background:`${CAT_COLORS[activeCat]}${i===rows.length-1?'':'88'}`,borderRadius:'6px 6px 0 0',border:`1px solid ${CAT_COLORS[activeCat]}`,transition:'height 0.6s ease',position:'relative'}}>
                      {i===rows.length-1&&<div style={{position:'absolute',top:-18,left:'50%',transform:'translateX(-50%)',fontSize:8,fontWeight:900,color:CAT_COLORS[activeCat],whiteSpace:'nowrap'}}>Latest</div>}
                    </div>
                    <div style={{fontSize:9,fontWeight:700,color:'#7A9090'}}>{r.year}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All categories table */}
          <div style={{background:'#F8F5F0',borderRadius:14,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',padding:'8px 12px',background:'rgba(0,0,0,0.05)',fontSize:9,fontWeight:800,color:'#7A9090',textTransform:'uppercase'}}>
              <span>Year</span><span style={{textAlign:'center'}}>Gen</span><span style={{textAlign:'center'}}>OBC</span><span style={{textAlign:'center'}}>SC</span><span style={{textAlign:'center'}}>ST</span>
            </div>
            {[...rows].reverse().map(r=>(
              <div key={r.year} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',padding:'8px 12px',borderBottom:'1px solid rgba(0,0,0,0.06)',fontSize:11,fontWeight:700}}>
                <span style={{color:'#1C2B2B',fontWeight:900}}>{r.year}</span>
                <span style={{textAlign:'center',color:'#2563EB'}}>{r.gen}</span>
                <span style={{textAlign:'center',color:'#E8671A'}}>{r.obc}</span>
                <span style={{textAlign:'center',color:'#059669'}}>{r.sc}</span>
                <span style={{textAlign:'center',color:'#7C3AED'}}>{r.st}</span>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,fontWeight:600,color:'#A8A29E',marginTop:10,textAlign:'center'}}>* हे approximate data आहे. Official MPSC site confirm करा.</div>
        </div>
      </div>
    </div>
  );
};

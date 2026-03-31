import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
interface ThemeCtx { theme: Theme; toggle: () => void; isDark: boolean; }

const ThemeContext = createContext<ThemeCtx>({ theme:'light', toggle:()=>{}, isDark:false });

export const ThemeProvider: React.FC<{children:React.ReactNode}> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('mpsc_theme') as Theme) || 'light'
  );

  useEffect(() => {
    localStorage.setItem('mpsc_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.background = theme === 'dark' ? '#0F1117' : '#F5F0E8';
  }, [theme]);

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

// Dark mode CSS variables — paste in index.html or App.tsx CSS
export const DARK_CSS = `
  [data-theme="dark"] body { background: #0F1117 !important; color: #E8E6E0 !important; }
  [data-theme="dark"] .dark-card { background: #1A1D27 !important; border-color: rgba(255,255,255,0.08) !important; color: #E8E6E0 !important; }
  [data-theme="dark"] .dark-input { background: #252836 !important; border-color: rgba(255,255,255,0.1) !important; color: #E8E6E0 !important; }
  [data-theme="dark"] .dark-nav { background: rgba(15,17,23,0.95) !important; border-color: rgba(255,255,255,0.08) !important; }
  [data-theme="dark"] .dark-text { color: #E8E6E0 !important; }
  [data-theme="dark"] .dark-sub { color: rgba(232,230,224,0.5) !important; }
`;

// Dark mode toggle button component
export const DarkModeToggle: React.FC<{style?:React.CSSProperties}> = ({ style }) => {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle}
      style={{ display:'flex', alignItems:'center', gap:7, background: theme==='dark' ? 'rgba(245,200,66,0.15)' : 'rgba(0,0,0,0.06)', border:`1px solid ${theme==='dark'?'rgba(245,200,66,0.3)':'rgba(0,0,0,0.1)'}`, borderRadius:12, padding:'8px 14px', cursor:'pointer', fontWeight:800, fontSize:12, color: theme==='dark' ? '#F5C842' : '#4A6060', transition:'all 0.2s', ...style }}>
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
};

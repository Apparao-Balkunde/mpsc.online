// ⚠️ DEPRECATED — App_light.tsx
// Dark mode आता App.tsx मध्येच ThemeProvider द्वारे handle होतो.
// हा file वापरू नका — App.tsx वापरा.
// This file is kept for reference only.

export default function App_light_DEPRECATED() {
  if (typeof window !== 'undefined') {
    console.warn('[MPSC] App_light.tsx is deprecated. Use App.tsx with ThemeProvider.');
  }
  return null;
}

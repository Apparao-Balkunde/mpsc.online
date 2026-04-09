// ⚠️ DEPRECATED — App_mobile.tsx
// Mobile responsiveness आता App.tsx मध्येच handle होतो.
// हा file वापरू नका — App.tsx वापरा.

export default function App_mobile_DEPRECATED() {
  if (typeof window !== 'undefined') {
    console.warn('[MPSC] App_mobile.tsx is deprecated. Use App.tsx.');
  }
  return null;
}

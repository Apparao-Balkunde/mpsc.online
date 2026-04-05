import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Page load होताच current session restore करा
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // ✅ Auth state changes — login/logout/token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth]', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // ✅ URL मध्ये OAuth error असेल तर handle करा
    // e.g. /?error=server_error&error_description=Unable+to+exchange...
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get('error');
    const authErrorDesc = urlParams.get('error_description');
    if (authError) {
      console.error('[Auth URL Error]', authError, authErrorDesc);
      // URL clean करा — error params remove करा
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    return () => subscription.unsubscribe();
  }, []);

  // ✅ Google OAuth — dynamic redirectTo (localhost + production दोन्ही)
  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
  };

  // ✅ Email OTP — Step 1: OTP पाठवा
  const sendOTP = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw new Error(error.message);
  };

  // ✅ Email OTP — Step 2: verify करा
  const verifyOTP = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw new Error('OTP चुकीचा किंवा expired. पुन्हा OTP पाठवा.');
  };

  return { user, session, loading, signInWithGoogle, sendOTP, verifyOTP };
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = window.location.origin;
}

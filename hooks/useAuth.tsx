import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Current session restore — page refresh वर login टिकतो
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Auth state listener — login/logout/token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // OAuth redirect error URL clean करा
    // e.g. /?error=server_error&error_description=...
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      console.warn('[Auth Error]', params.get('error'), params.get('error_description'));
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => subscription.unsubscribe();
  }, []);

  // ✅ Google OAuth — dynamic redirect (localhost + production दोन्ही)
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
  };

  return { user, session, loading, signInWithGoogle };
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = window.location.origin;
}

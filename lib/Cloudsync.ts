// Cloud sync — localStorage progress <-> Supabase
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

const PROGRESS_KEY = 'mpsc_user_progress';
const HISTORY_KEY  = 'mpsc_history';

interface Progress {
  totalAttempted: number;
  totalCorrect: number;
  streak: number;
  lastActiveDate: string;
}

// Push local progress to Supabase
export async function pushProgressToCloud(user: User) {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const histRaw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return;

    const progress: Progress = JSON.parse(raw);
    const history = histRaw ? JSON.parse(histRaw) : [];

    await supabase.from('user_progress').upsert({
      user_id:        user.id,
      email:          user.email,
      display_name:   user.user_metadata?.full_name || user.email,
      avatar_url:     user.user_metadata?.avatar_url || null,
      total_attempted: progress.totalAttempted,
      total_correct:   progress.totalCorrect,
      streak:          progress.streak,
      last_active:     progress.lastActiveDate || new Date().toDateString(),
      daily_history:   history.slice(-30),
      updated_at:      new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch (e) {
    console.warn('[CloudSync] Push failed:', e);
  }
}

// Pull progress from Supabase (merge with local — take higher values)
export async function pullProgressFromCloud(user: User) {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return;

    const local: Progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');

    // Merge: take max values
    const merged: Progress = {
      totalAttempted: Math.max(local.totalAttempted || 0, data.total_attempted || 0),
      totalCorrect:   Math.max(local.totalCorrect   || 0, data.total_correct   || 0),
      streak:         Math.max(local.streak         || 0, data.streak          || 0),
      lastActiveDate: local.lastActiveDate || data.last_active || '',
    };

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(merged));

    if (data.daily_history?.length) {
      const localHist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      // Merge histories by date
      const histMap = new Map<string, {date:string;attempted:number;correct:number}>();
      [...data.daily_history, ...localHist].forEach((d: any) => {
        const ex = histMap.get(d.date);
        if (!ex || d.attempted > ex.attempted) histMap.set(d.date, d);
      });
      localStorage.setItem(HISTORY_KEY, JSON.stringify([...histMap.values()].slice(-30)));
    }

    return merged;
  } catch (e) {
    console.warn('[CloudSync] Pull failed:', e);
  }
}

// Auto-sync every 5 min
export function startAutoSync(user: User) {
  pushProgressToCloud(user);
  const interval = setInterval(() => pushProgressToCloud(user), 5 * 60 * 1000);
  return () => clearInterval(interval);
}

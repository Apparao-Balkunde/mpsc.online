// XP System Service

export interface XPData {
  xp: number;
  level: number;
  totalCorrect: number;
  badges: string[];
  lastUpdated: string;
}

const KEY = 'mpsc_xp_data';

const LEVELS = [
  { level:1,  name:'नवशिके',        emoji:'🌱', minXP:0,    color:'#78716C' },
  { level:2,  name:'अभ्यासू',        emoji:'📖', minXP:100,  color:'#0891B2' },
  { level:3,  name:'जिज्ञासू',       emoji:'🔍', minXP:250,  color:'#7C3AED' },
  { level:4,  name:'तयारी योद्धा',   emoji:'⚔️', minXP:500,  color:'#059669' },
  { level:5,  name:'स्पर्धा वीर',    emoji:'🦁', minXP:1000, color:'#D97706' },
  { level:6,  name:'MPSC Expert',    emoji:'🏆', minXP:2000, color:'#DC2626' },
  { level:7,  name:'महाराष्ट्र केसरी',emoji:'👑', minXP:5000, color:'#E8671A' },
];

export const BADGES = [
  { id:'first_correct',   emoji:'⭐', name:'पहिले बरोबर',       desc:'पहिला बरोबर प्रश्न',           xp:10  },
  { id:'streak_3',        emoji:'🔥', name:'3-Day Streak',        desc:'3 दिवस सलग अभ्यास',             xp:50  },
  { id:'streak_7',        emoji:'💫', name:'7-Day Streak',        desc:'7 दिवस सलग अभ्यास',             xp:150 },
  { id:'correct_10',      emoji:'🎯', name:'दहाचा सराव',         desc:'10 प्रश्न बरोबर',               xp:30  },
  { id:'correct_50',      emoji:'💪', name:'पन्नाशी',            desc:'50 प्रश्न बरोबर',               xp:100 },
  { id:'correct_100',     emoji:'🏅', name:'शतक',                desc:'100 प्रश्न बरोबर',              xp:250 },
  { id:'daily_5',         emoji:'📅', name:'Daily Star',          desc:'Daily Challenge 5/5',            xp:75  },
  { id:'mock_complete',   emoji:'📝', name:'Mock Master',         desc:'पहिला Mock Test पूर्ण',         xp:100 },
  { id:'spardha_win',     emoji:'⚔️', name:'युद्ध विजेता',       desc:'स्पर्धा योद्धा 90%+ score',    xp:200 },
];

export function getXPData(): XPData {
  try { return JSON.parse(localStorage.getItem(KEY) || '{"xp":0,"level":1,"totalCorrect":0,"badges":[],"lastUpdated":""}'); }
  catch { return { xp:0, level:1, totalCorrect:0, badges:[], lastUpdated:'' }; }
}

export function getLevel(xp: number) {
  return [...LEVELS].reverse().find(l => xp >= l.minXP) || LEVELS[0];
}

export function getNextLevel(xp: number) {
  return LEVELS.find(l => l.minXP > xp);
}

export function getXPProgress(xp: number) {
  const current = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const range = next.minXP - current.minXP;
  const progress = xp - current.minXP;
  return Math.round((progress / range) * 100);
}

export function addXP(amount: number, newBadgeIds: string[] = []): { newXP: number; levelUp: boolean; newBadges: string[] } {
  const data = getXPData();
  const oldLevel = getLevel(data.xp);
  const newXP = data.xp + amount;
  const newLevel = getLevel(newXP);
  const levelUp = newLevel.level > oldLevel.level;

  const earnedBadges = newBadgeIds.filter(id => !data.badges.includes(id));

  const updated: XPData = {
    xp: newXP,
    level: newLevel.level,
    totalCorrect: data.totalCorrect + (newBadgeIds.includes('first_correct') ? 1 : 0),
    badges: [...data.badges, ...earnedBadges],
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(updated));
  return { newXP, levelUp, newBadges: earnedBadges };
}

export function checkAndAwardBadges(correct: number, streak: number, dailyScore?: number): string[] {
  const data = getXPData();
  const earned: string[] = [];
  const has = (id: string) => data.badges.includes(id);

  if (correct >= 1 && !has('first_correct')) earned.push('first_correct');
  if (correct >= 10 && !has('correct_10')) earned.push('correct_10');
  if (correct >= 50 && !has('correct_50')) earned.push('correct_50');
  if (correct >= 100 && !has('correct_100')) earned.push('correct_100');
  if (streak >= 3 && !has('streak_3')) earned.push('streak_3');
  if (streak >= 7 && !has('streak_7')) earned.push('streak_7');
  if (dailyScore === 5 && !has('daily_5')) earned.push('daily_5');

  return earned;
}

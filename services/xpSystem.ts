// services/xpSystem.ts मध्ये हे फंक्शन्स एक्सपोर्ट करा

export const getXPData = (totalCorrect: number) => {
  // तुमचे लॉजिक (उदा. १ बरोबर उत्तराला १० XP)
  return totalCorrect * 10; 
};

export const getLevel = (xp: number) => Math.floor(xp / 100) + 1;

export const getNextLevel = (xp: number) => (Math.floor(xp / 100) + 1) * 100;

export const getXPProgress = (xp: number) => xp % 100;

export const BADGES = [
  { id: 'beginner', name: 'सुरवात', icon: '🌱', minXP: 0 },
  { id: 'warrior', name: 'योद्धा', icon: '⚔️', minXP: 500 }
];

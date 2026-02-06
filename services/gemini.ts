// services/gemini.ts (Modified to Local Focus)
import { mockQuestions } from '../data/mockQuestions'; // तुमची लोकल डेटा फाईल
import { vocabData } from '../data/vocabData';

export const generateQuiz = async (subject: string, topic: string) => {
  // AI ला विचारण्याऐवजी लोकल डेटा फिल्टर करा
  const filtered = mockQuestions.filter(q => q.subject === subject && q.topic === topic);
  return { data: filtered, fromCache: true };
};

export const generateVocab = async (subject: string, category: string) => {
  // लोकल डेटाबेसमधून शब्द मिळवा
  const words = vocabData[subject][category];
  return { data: words, fromCache: true };
};

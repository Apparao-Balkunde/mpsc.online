// services/gemini.ts — Fixed: removed missing data/ imports
// data/mockQuestions & data/vocabData files नाहीत — supabase वापरतो

export const generateQuiz = async (subject: string, topic: string) => {
  // Stub — actual questions supabase मधून येतात
  console.log('[gemini.ts] generateQuiz called:', subject, topic);
  return { data: [], fromCache: false };
};

export const generateVocab = async (subject: string, category: string) => {
  // Stub — vocab supabase vocab_questions table मधून येतो
  console.log('[gemini.ts] generateVocab called:', subject, category);
  return { data: [], fromCache: false };
};

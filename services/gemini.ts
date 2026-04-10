// services/gemini.ts — Fixed + Enhanced

export const generateQuiz = async (subject: string, topic: string) => {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: 'तू MPSC परीक्षेचा expert आहेस. फक्त JSON array format मध्ये उत्तर दे. कोणतीही extra text नको.',
        messages: [{ role: 'user', content: `${subject} - ${topic} वर 5 MCQ प्रश्न बनव. JSON array: [{question, options:[4 items], correct_answer_index(0-3), explanation, subject, topic}]` }],
        max_tokens: 1200,
      }),
    });
    const d = await res.json();
    const clean = (d?.text || '[]').replace(/```json|```/g, '').trim();
    return { data: JSON.parse(clean), fromCache: false };
  } catch { return { data: [], fromCache: false }; }
};

export const generateVocab = async (subject: string, category: string) => {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: 'तू मराठी भाषा तज्ज्ञ आहेस. फक्त JSON array format मध्ये उत्तर दे.',
        messages: [{ role: 'user', content: `${subject} - ${category} साठी 10 शब्द. JSON: [{word, meaning, example, synonyms:[]}]` }],
        max_tokens: 800,
      }),
    });
    const d = await res.json();
    const clean = (d?.text || '[]').replace(/```json|```/g, '').trim();
    return { data: JSON.parse(clean), fromCache: false };
  } catch { return { data: [], fromCache: false }; }
};

// QuestionView मध्ये "AI Explain" button साठी
export const getAIExplanation = async (question: string, correctAnswer: string, existingExplanation?: string): Promise<string> => {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: 'तू MPSC teacher आहेस. मराठीत 3-4 वाक्यांत explain कर. Memory tip पण दे.',
        messages: [{ role: 'user', content: `प्रश्न: "${question}"\nउत्तर: "${correctAnswer}"\nहे का बरोबर आहे explain कर.` }],
        max_tokens: 300,
      }),
    });
    const d = await res.json();
    return d?.text || existingExplanation || 'Explanation उपलब्ध नाही.';
  } catch { return existingExplanation || 'Explanation उपलब्ध नाही.'; }
};

// ── StudyMode साठी functions ──────────────────────────────────────────────

export const generateStudyNotes = async (subject: string, topic: string): Promise<{ text: string }> => {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: 'तू MPSC expert teacher आहेस. Markdown format मध्ये detailed study notes दे. मराठी आणि English mix वापर. Examples, rules, exceptions दे.',
        messages: [{ role: 'user', content: `${subject} - "${topic}" या topic वर MPSC साठी comprehensive study notes बनव. ## Headings, **bold**, bullet points वापर. Memory tips, examples, previous year questions पण दे.` }],
        max_tokens: 800,
      }),
    });
    const d = await res.json();
    return { text: d?.text || 'Notes उपलब्ध नाहीत. पुन्हा प्रयत्न करा.' };
  } catch {
    return { text: '⚠️ Notes load होऊ शकले नाहीत. Internet connection तपासा.' };
  }
};

export const generateConciseExplanation = async (subject: string, rule: string): Promise<{ text: string }> => {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: 'तू MPSC teacher आहेस. 3-4 वाक्यांत सोप्या भाषेत explain कर. Example जरूर दे.',
        messages: [{ role: 'user', content: `"${rule}" हे ${subject} चे rule/concept सोप्या मराठीत explain कर. एक real-world example दे आणि MPSC exam मध्ये कसा येतो ते सांग.` }],
        max_tokens: 300,
      }),
    });
    const d = await res.json();
    return { text: d?.text || 'Explanation उपलब्ध नाही.' };
  } catch {
    return { text: '⚠️ Explanation load झाले नाही.' };
  }
};

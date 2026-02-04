
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Subject, QuizQuestion, VocabWord, CurrentAffairItem, ExamType, GSSubCategory, VocabCategory, RuleExplanation, DescriptiveQA, DifficultyLevel } from '../types';

// Initializing the GoogleGenAI client directly with process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

// --- LOCAL DATA CENTER (INDEXED DB CACHING SYSTEM) ---
const CACHE_PREFIX = 'MPSC_DATA_CENTER_V5_';
const DB_NAME = 'MPSC_Sarathi_DB';
const STORE_NAME = 'ai_responses';
const DB_VERSION = 1;

const getCacheKey = (...args: string[]) => {
  return CACHE_PREFIX + args.join('_').toUpperCase().replace(/[^A-Z0-9_]/g, '_');
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
        reject("IndexedDB not supported");
        return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const getFromDataCenter = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
          if (request.result) resolve(request.result as T);
          else resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
};

const saveToDataCenter = async (key: string, data: any) => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(data, key);
  } catch (e) {
    console.error("Critical storage failure in IDB", e);
  }
};

export const playTextToSpeech = async (text: string): Promise<void> => {
  const cacheKey = getCacheKey('TTS', text.substring(0, 50));
  try {
    let base64Audio = await getFromDataCenter<string>(cacheKey);
    if (!base64Audio) {
        const response = await ai.models.generateContent({
            model: MODEL_TTS,
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                },
            },
        });
        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) await saveToDataCenter(cacheKey, base64Audio);
    }
    if (!base64Audio) throw new Error("No audio data received");
    const audioBytes = atob(base64Audio);
    const len = audioBytes.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = audioBytes.charCodeAt(i);
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i] / 32768.0;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  } catch (error) { console.error("TTS Error:", error); }
};

export const generateQuiz = async (subject: Subject, topic: string, difficulty: DifficultyLevel = 'MEDIUM', subCategory?: GSSubCategory): Promise<QuizQuestion[]> => {
  const cacheKey = getCacheKey('QUIZ_V4', subject, topic, difficulty, subCategory || 'NONE');
  const cached = await getFromDataCenter<QuizQuestion[]>(cacheKey);
  if (cached) return cached;

  const prompt = `
    Generate 20 MPSC pattern MCQs.
    Subject: ${subject}
    Section: ${subCategory || 'General'}
    Topic: ${topic}
    Difficulty: ${difficulty}
    
    LANGUAGE:
    1. MARATHI: Everything in Marathi (Devanagari).
    2. ENGLISH: Q/Options in English, Explanation in English + Marathi (Devanagari).
    3. GS: Q in Marathi, Detailed explanation in Marathi.
    
    REQUIREMENTS:
    - Detailed explanation (150+ words) analyzing ALL 4 options.
    - Strict MPSC Prelims/Mains pattern.
    - Return JSON array.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  });

  const data = JSON.parse(response.text) as QuizQuestion[];
  await saveToDataCenter(cacheKey, data);
  return data;
};

export const generatePYQs = async (subject: Subject, year: string, examType: ExamType = 'ALL', subCategory?: GSSubCategory): Promise<QuizQuestion[]> => {
  const cacheKey = getCacheKey('PYQ_STRICT_V7', subject, year, examType, subCategory || 'NONE');
  const cached = await getFromDataCenter<QuizQuestion[]>(cacheKey);
  if (cached) return cached;

  // Strict prompt to ensure only selected exam type is returned and comprehensive coverage
  const prompt = `
    You are the official MPSC question archivist. I need the AUTHENTIC General Studies (GS) questions from a specific paper.
    
    EXAM: MPSC ${examType} (Only return questions that appeared in ${examType}. Strictly NO Combined/Mix questions if Rajyaseva is selected, and vice versa).
    YEAR: ${year}
    SUBJECT: ${subject}
    SECTION: ${subCategory === 'ALL' ? 'Complete GS Paper' : subCategory}
    
    STRICT COMPLIANCE RULES:
    1. SOURCE INTEGRITY: Only provide questions that were actually asked in the ${examType} ${year} Prelims.
    2. CONTENT: If Exam is RAJYASEVA, do NOT include Group B or Group C questions.
    3. LANGUAGE: All Questions, Options, and Detailed Explanations MUST be in MARATHI (Devanagari script).
    4. EXPLANATION: For each question, provide a deep 250-word analysis in Marathi covering:
       - Why the answer is correct.
       - Context of the topic in MPSC syllabus.
       - Analysis of other options to prevent similar traps in future exams.
    5. QUANTITY: Provide a comprehensive set (up to 25 items per request) that covers the major topics of the ${year} paper for the selected section.
    
    Format the output as a clean JSON array.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_FAST,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            examSource: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation", "examSource"]
        }
      }
    }
  });

  const data = JSON.parse(response.text) as QuizQuestion[];
  await saveToDataCenter(cacheKey, data);
  return data;
};

export const generateStudyNotes = async (subject: Subject, topic: string): Promise<string> => {
  const cacheKey = getCacheKey('NOTES_V2', subject, topic);
  const cached = await getFromDataCenter<string>(cacheKey);
  if (cached) return cached;

  const prompt = `
    Generate comprehensive MPSC Mains-level study notes for Subject: ${subject}, Topic: ${topic}.
    Requirements:
    - Language: Marathi (for Marathi/GS), Mix of English and Marathi (for English subject).
    - Depth: Advanced analysis, including nuances and exceptions.
    - Format: Structured Markdown with headings, bullet points, and tables.
    - Special: Include at least 3-4 examples from actual past MPSC papers (Rajyaseva/Combined) if applicable.
    - Focus on common traps and errors aspirants make.
  `;
  const response = await ai.models.generateContent({ model: MODEL_FAST, contents: prompt });
  const result = response.text || "No notes generated.";
  await saveToDataCenter(cacheKey, result);
  return result;
};

export const generateConciseExplanation = async (subject: Subject, topic: string): Promise<RuleExplanation> => {
    const prompt = `Provide detailed JSON with definition, importance, nuances, examples for Subject: ${subject}, Topic: ${topic}. 
    Ensure it reflects MPSC Mains level depth. Use Marathi for explanations. 
    Include high-quality exam-oriented examples.`;
    const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    definition: { type: Type.STRING },
                    importance: { type: Type.STRING },
                    nuances: { type: Type.STRING },
                    examples: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    });
    return JSON.parse(response.text);
};

export const generateVocab = async (subject: Subject, category: VocabCategory, forceRefresh: boolean = false): Promise<VocabWord[]> => {
    const cacheKey = getCacheKey('VOCAB_EXTENDED_V7', subject, category);
    if (!forceRefresh) {
        const cached = await getFromDataCenter<VocabWord[]>(cacheKey);
        if (cached) return cached;
    }

    const prompt = `
      Generate a list of 60 high-yield vocabulary items for ${subject} in the category ${category}, specifically targeted for MPSC Rajyaseva and Combined Exams.
      
      CRITICAL ENHANCEMENT FOR RELATED WORDS:
      - Each item MUST include synonyms, antonyms, AND commonly confused word pairs (paronyms, homophones, homonyms).
      - For English: Examples like 'affect/effect', 'principal/principle', 'stationery/stationary'.
      - For Marathi: Examples like 'पाणी/पाणि', 'दिन/दीन', 'सूत/सुत' (शब्दयुग्मे/समानोच्चारी शब्द).
      - Prefix them clearly:
        - English: 'Syn:', 'Ant:', 'Confused Pair:'.
        - Marathi: 'समानार्थी:', 'विरुद्धार्थी:', 'समान उच्चार/युग्म:'.
      
      Output strictly in JSON format.
    `;

    const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING },
                        meaning: { type: Type.STRING },
                        usage: { type: Type.STRING },
                        type: { type: Type.STRING },
                        relatedWords: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["word", "meaning", "usage", "type", "relatedWords"]
                }
            }
        }
    });
    const data = JSON.parse(response.text) as VocabWord[];
    await saveToDataCenter(cacheKey, data);
    return data;
};

export const generateCurrentAffairs = async (category: string, language: 'Marathi' | 'English'): Promise<CurrentAffairItem[]> => {
    const prompt = `Generate 6 recent MPSC current affairs for category ${category} in ${language}. JSON format.`;
    const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        headline: { type: Type.STRING },
                        description: { type: Type.STRING },
                        date: { type: Type.STRING },
                        category: { type: Type.STRING },
                        examRelevance: { type: Type.STRING }
                    }
                }
            }
        }
    });
    return JSON.parse(response.text);
};

export const generateDescriptiveQA = async (topic: string): Promise<DescriptiveQA> => {
    const prompt = `Academic Marathi Literature analysis for topic ${topic}. PhD/MPSC level. JSON with question, modelAnswer, keyPoints.`;
    const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    modelAnswer: { type: Type.STRING },
                    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    });
    return JSON.parse(response.text);
};

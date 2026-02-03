import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Subject, QuizQuestion, VocabWord, CurrentAffairItem, ExamType, VocabCategory, RuleExplanation, DescriptiveQA, DifficultyLevel } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

// --- LOCAL DATA CENTER (INDEXED DB CACHING SYSTEM) ---
const CACHE_PREFIX = 'MPSC_DATA_CENTER_V4_';
const DB_NAME = 'MPSC_Sarathi_DB';
const STORE_NAME = 'ai_responses';
const DB_VERSION = 1;

// Helper to generate consistent unique keys for storage
const getCacheKey = (...args: string[]) => {
  return CACHE_PREFIX + args.join('_').toUpperCase().replace(/[^A-Z0-9_]/g, '_');
};

// Open IndexedDB
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

// Retrieve from Local Data Center (Async)
const getFromDataCenter = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
          if (request.result) {
              console.log(`⚡ [Local Data Center] Serving from DB: ${key}`);
              resolve(request.result as T);
          } else {
              // Fallback to check localStorage for migration
              const local = localStorage.getItem(key);
              if (local) {
                  try {
                      const parsed = JSON.parse(local);
                      // Migrate to IDB
                      saveToDataCenter(key, parsed); 
                      resolve(parsed as T);
                  } catch {
                      resolve(null);
                  }
              } else {
                  resolve(null);
              }
          }
      };
      request.onerror = () => {
          console.warn("IDB Get Error", request.error);
          resolve(null);
      };
    });
  } catch (e) {
    console.warn("Data Center retrieval error", e);
    return null;
  }
};

// Save to Local Data Center (Async) - Robust Version
const saveToDataCenter = async (key: string, data: any) => {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data, key);

      request.onsuccess = () => {
        console.log(`💾 [Local Data Center] Data stored in DB: ${key}`);
        resolve();
      };

      request.onerror = () => {
        console.error("Failed to save to DB:", request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
          // Transaction committed
      };
      
      transaction.onerror = (event) => {
          console.error("Transaction error:", event);
      };
    });
  } catch (e) {
    console.error("Critical storage failure in IDB", e);
  }
};
// --- END CACHING SYSTEM ---

// Audio Context Singleton
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playTextToSpeech = async (text: string): Promise<void> => {
  const cacheKey = getCacheKey('TTS', text.substring(0, 50)); // Short key for TTS
  
  try {
    let base64Audio = await getFromDataCenter<string>(cacheKey);

    if (!base64Audio) {
        const response = await ai.models.generateContent({
        model: MODEL_TTS,
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
            voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
            },
        },
        });

        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            await saveToDataCenter(cacheKey, base64Audio);
        }
    }

    if (!base64Audio) throw new Error("No audio data received");

    const ctx = getAudioContext();
    const audioBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();

  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export const generateStudyNotes = async (subject: Subject, topic: string): Promise<string> => {
  const cacheKey = getCacheKey('NOTES', subject, topic);
  const cached = await getFromDataCenter<string>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `
      You are an expert tutor for the MPSC (Maharashtra Public Service Commission) exam.
      Subject: ${subject}
      Topic: ${topic}
      
      Please provide comprehensive study notes for this topic, designed for high-scoring revision.
      
      LANGUAGE RULES:
      - If Subject is MARATHI: Strictly use **Marathi language (Devanagari script)** for everything.
      - If Subject is ENGLISH: Main text in English, but **CRUCIAL**: Provide **Marathi translations and explanations (in Devanagari)** for EVERY rule, definition, and difficult concept to help vernacular medium students.
      - If Subject is GS (General Studies): Provide accurate facts, dates, article numbers (for Polity), and scientific concepts clearly. Use simple Marathi or English as requested.
      
      STRUCTURE & CONTENT:
      1. **Core Concept**: Definition and Basic Rules.
      2. **Key Facts/Rules**: Deep dive into the subject matter.
      3. **Exceptions & Tricks/Mnemonics**: Special cases or memory aids.
      4. **MPSC Pattern**: How this topic is asked in exams (e.g., "Statement based", "Match pairs").
      5. **Exam Examples**: 3-5 high-quality examples with analysis.
      
      Format: Clean Markdown with bolding for keywords.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
    });

    const result = response.text || "No notes generated.";
    await saveToDataCenter(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error generating notes:", error);
    throw error;
  }
};

export const generateConciseExplanation = async (subject: Subject, topic: string): Promise<RuleExplanation> => {
  const cacheKey = getCacheKey('RULE', subject, topic);
  const cached = await getFromDataCenter<RuleExplanation>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `
      You are an expert MPSC (Maharashtra Public Service Commission) exam tutor.
      Subject: ${subject}
      Topic: ${topic}
      
      Provide a detailed JSON object with:
      1. definition: A clear, academic definition of the rule or concept.
      2. importance: Why this is critical for MPSC exams (e.g. "Frequently asked in Rajyaseva mains", "High weightage in Group B").
      3. nuances: Specific exceptions, common student mistakes, or tricky aspects (Tricks/Mnemonics).
      4. examples: An array of AT LEAST 3 diverse, exam-oriented example sentences. Include authentic MPSC PYQ examples if possible.
      
      LANGUAGE RULES:
      - If Subject is MARATHI: Explain STRICTLY in **Marathi (Devanagari)**.
      - If Subject is ENGLISH: State the rule in English, but **IMMEDIATELY followed by a Marathi explanation (in Devanagari)** so the student understands the logic.
      
      Output JSON strictly.
    `;

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
            examples: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["definition", "importance", "nuances", "examples"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return { definition: "Explanation not available", importance: "N/A", nuances: "N/A", examples: [] };
    
    const data = JSON.parse(jsonText) as RuleExplanation;
    await saveToDataCenter(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error generating explanation:", error);
    return { definition: "Could not load explanation.", importance: "N/A", nuances: "N/A", examples: [] };
  }
};

export const generateQuiz = async (subject: Subject, topic: string, difficulty: DifficultyLevel = 'MEDIUM'): Promise<QuizQuestion[]> => {
  const cacheKey = getCacheKey('QUIZ', subject, topic, difficulty);
  const cached = await getFromDataCenter<QuizQuestion[]>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `
      Generate 20 multiple choice questions (MCQs) for MPSC exam practice.
      Subject: ${subject}
      Topic: ${topic}
      Difficulty Level: ${difficulty}
      
      LANGUAGE RULES:
      1. Subject MARATHI: Everything (Question, Options, Explanation) must be in **Marathi (Devanagari)**.
      2. Subject ENGLISH: 
         - Question and Options: English (Roman).
         - Explanation: **MUST be in a mix of English and Marathi (Devanagari)**. Explain the rule in Marathi so the student understands WHY the answer is correct.
      3. Subject GS: Questions can be in English or Marathi. Explanation must be detailed.
      
      Requirements:
      1. Difficulty Guidelines:
         - EASY: Basic concepts.
         - MEDIUM: Standard MPSC Prelims level.
         - HARD: MPSC Mains level (Multi-statement).
      2. **Crucial**: The 'explanation' field MUST be extremely detailed (minimum 150 words).
         - Analyze ALL options deeply.
         - **Comparative Analysis**: Explicitly explain why the correct answer is right AND why specific incorrect options are wrong.
         - Break down the logic step-by-step to eliminate confusion.
      
      Return the response in strictly valid JSON format.
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
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { type: Type.INTEGER, description: "0-based index of the correct option" },
              explanation: { type: Type.STRING, description: "Comprehensive explanation (min 150 words) with comparative analysis of options. For English subject, use Marathi (Devanagari) to explain." }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonText) as QuizQuestion[];
    await saveToDataCenter(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const generatePYQs = async (subject: Subject, year: string, examType: ExamType = 'ALL'): Promise<QuizQuestion[]> => {
  const cacheKey = getCacheKey('PYQ_V3', subject, year, examType); // Updated version key
  const cached = await getFromDataCenter<QuizQuestion[]>(cacheKey);
  if (cached) return cached;

  try {
    let examContext = '';
    
    // Determine specific exam context
    let specificExam = '';
    if (examType === 'ALL') specificExam = 'MPSC State Services (Rajyaseva), Group B Combined, and Group C';
    else if (examType === 'RAJYASEVA') specificExam = 'MPSC Rajyaseva (State Services)';
    else if (examType === 'GROUP_B') specificExam = 'MPSC Group B Combined (PSI/STI/ASO)';
    else if (examType === 'GROUP_C') specificExam = 'MPSC Group C';
    
    if (subject === Subject.MARATHI) {
       examContext = `${specificExam} - Marathi Grammar Paper`;
    } else if (subject === Subject.ENGLISH) {
       examContext = 'MPSC, SSC CGL, UPSC, CDS, and Banking exams (English Grammar). Prioritize MPSC.';
    } else if (subject === Subject.GS) {
       examContext = `${specificExam} - General Studies (History, Geography, Polity, Economics, General Science)`;
    } else {
       examContext = `${specificExam} exams`;
    }

    const prompt = `
      Retrieve or generate 15 authentic Previous Year Questions (PYQs) for the subject: ${subject}.
      
      Filters to Apply:
      - Exam Context: ${examContext}
      - Specific Year: ${year} (approximate if exact match not found)
      
      LANGUAGE RULES:
      - Subject MARATHI: Questions, Options, and Explanation strictly in **Marathi (Devanagari)**.
      - Subject ENGLISH: 
         * Question and Options: English. 
         * **Explanation MUST be in English + Marathi (Devanagari)** to explain the logic clearly.
      - Subject GS: 
         * Provide questions in Marathi (or English if commonly asked so).
         * **Explanation MUST be in Marathi (Devanagari)** for better understanding.
      
      Requirements:
      1. Provide exactly 15 questions.
      2. Include the specific exam name and year in the "examSource" field.
      3. **CRITICAL**: The 'explanation' field MUST be extremely detailed (minimum 150 words).
         - **Comparative Analysis**: Explicitly explain why the correct answer is right AND why specific incorrect options are wrong.
         - **Context**: For GS questions, provide background context (e.g., related events, article details, scientific principles).
         - Break down the logic step-by-step.
      
      Return strictly as JSON.
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
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING, description: "Detailed comparative explanation (min 150 words). Explain why the answer is correct and others are wrong." },
              examSource: { type: Type.STRING, description: "The exam where this question appeared" }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonText) as QuizQuestion[];
    await saveToDataCenter(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error generating PYQs:", error);
    throw error;
  }
};

export const generateVocab = async (subject: Subject, category: VocabCategory, forceRefresh: boolean = false): Promise<VocabWord[]> => {
  const cacheKey = getCacheKey('VOCAB_EXTENDED_V2', subject, category);
  
  // Return cached data ONLY if forceRefresh is false
  if (!forceRefresh) {
    const cached = await getFromDataCenter<VocabWord[]>(cacheKey);
    if (cached) return cached;
  }

  try {
    let categoryPrompt = '';
    
    if (subject === Subject.MARATHI) {
       if (category === 'IDIOMS') categoryPrompt = 'Mhani ani Vakprachar (म्हणी व वाक्प्रचार)';
       else if (category === 'SYNONYMS') categoryPrompt = 'Samanarthi Shabd (समानार्थी शब्द)';
       else if (category === 'ANTONYMS') categoryPrompt = 'Viruddharthi Shabd (विरुद्धार्थी शब्द)';
       else if (category === 'ONE_WORD') categoryPrompt = 'Shabdasamuhabaddal ek shabd (शब्दसमूहाबद्दल एक शब्द)';
    } else {
       if (category === 'IDIOMS') categoryPrompt = 'Idioms and Phrases';
       else if (category === 'SYNONYMS') categoryPrompt = 'Synonyms';
       else if (category === 'ANTONYMS') categoryPrompt = 'Antonyms';
       else if (category === 'ONE_WORD') categoryPrompt = 'One Word Substitution';
    }

    const prompt = `
      Generate a comprehensive list (approx 60 items) of ${categoryPrompt} for ${subject} subject, strictly designed for MPSC/Competitive Exams.
      
      STRATEGY - "Previous & Related" (PYQ & Linked Concepts):
      1. **PYQ Core:** Prioritize words/idioms that have appeared in **Previous Year MPSC Question Papers**.
      2. **Related Concepts:** Include related words (synonyms/antonyms) likely to be asked.
      
      FORMATTING & LANGUAGE INSTRUCTIONS:
      - If Subject is MARATHI: All fields in **Marathi (Devanagari)**.
      - If Subject is ENGLISH:
        * word: English (Roman)
        * meaning: English Definition + **(Marathi Meaning in Devanagari)**. Example: "Benevolent" -> "Kind, generous (दयाळू, परोपकारी)"
        * usage: English sentence
        * relatedWords: 3-5 related English words (synonyms/antonyms or confusing words)
      
      Output strictly in JSON.
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
              word: { type: Type.STRING, description: "The word, idiom, or phrase" },
              meaning: { type: Type.STRING, description: "Meaning. Include Marathi (Devanagari) if subject is English." },
              usage: { type: Type.STRING, description: "Example sentence" },
              type: { type: Type.STRING, description: "e.g., 'Noun (PYQ 2019)' or 'Adjective (Related)'" },
              relatedWords: { 
                 type: Type.ARRAY, 
                 items: { type: Type.STRING },
                 description: "List of 3-5 related words (synonyms, antonyms, etc.)"
              }
            },
            required: ["word", "meaning", "usage", "type", "relatedWords"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonText) as VocabWord[];
    await saveToDataCenter(cacheKey, data);
    return data;

  } catch (error) {
    console.error("Error generating vocab:", error);
    throw error;
  }
}

export const generateWordDetails = async (word: string, subject: Subject): Promise<VocabWord> => {
  const cacheKey = getCacheKey('WORD_DEF_SINGLE', subject, word);
  const cached = await getFromDataCenter<VocabWord>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `
      Provide a detailed vocabulary card for the word/phrase: "${word}".
      Subject: ${subject}
      Context: MPSC/Competitive Exams
      
      FORMATTING & LANGUAGE INSTRUCTIONS:
      - If Subject is MARATHI: All fields in **Marathi (Devanagari)**.
      - If Subject is ENGLISH:
        * word: English
        * meaning: English Definition + **(Marathi Meaning in Devanagari)**.
        * usage: English sentence.
        * relatedWords: 3-5 synonyms/antonyms.
      
      Output strictly in JSON.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            meaning: { type: Type.STRING },
            usage: { type: Type.STRING },
            type: { type: Type.STRING, description: "Part of Speech (e.g., Noun, Verb)" },
            relatedWords: { 
               type: Type.ARRAY, 
               items: { type: Type.STRING }
            }
          },
          required: ["word", "meaning", "usage", "type", "relatedWords"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonText) as VocabWord;
    await saveToDataCenter(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error generating word details:", error);
    throw error;
  }
};

export const generateCurrentAffairs = async (category: string, language: 'Marathi' | 'English'): Promise<CurrentAffairItem[]> => {
  const cacheKey = getCacheKey('NEWS', category, language);
  const cached = await getFromDataCenter<CurrentAffairItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `
      Fetch or generate 5-7 recent current affairs news items relevant to MPSC exams.
      Category: ${category}
      Language: ${language}
      
      Requirements:
      1. News must be from the last 6-12 months.
      2. Focus on Maharashtra specific news if category implies it.
      3. Language: ${language === 'Marathi' ? 'Strictly in Marathi (Devanagari)' : 'English'}.
      
      Output JSON format.
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
              headline: { type: Type.STRING },
              description: { type: Type.STRING },
              date: { type: Type.STRING },
              category: { type: Type.STRING },
              examRelevance: { type: Type.STRING }
            },
            required: ["headline", "description", "date", "category", "examRelevance"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonText) as CurrentAffairItem[];
    await saveToDataCenter(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error generating current affairs:", error);
    throw error;
  }
};

export const generateDescriptiveQA = async (topic: string): Promise<DescriptiveQA> => {
  const cacheKey = getCacheKey('LIT_QA', topic);
  const cached = await getFromDataCenter<DescriptiveQA>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `
      You are a Professor of Marathi Literature.
      Topic: ${topic}
      
      Task:
      1. Formulate a challenging, PhD-level or MPSC Mains level descriptive question based on this topic.
      2. Provide a comprehensive Model Answer (approx 300-400 words).
      3. Extract 3-5 Key Critical Concepts (keywords) used in the answer.

      Language: Marathi (Devanagari) strictly.
      Style: Academic, Critical, Analytical (Samikshatmak).
      
      Output JSON.
    `;

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
                keyPoints: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
            required: ["question", "modelAnswer", "keyPoints"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    const data = JSON.parse(jsonText) as DescriptiveQA;
    await saveToDataCenter(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error generating descriptive QA:", error);
    throw error;
  }
};

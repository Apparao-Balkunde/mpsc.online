import { QuizQuestion, SavedNote, VocabWord } from '../types';

/**
 * MASTER DATA STORE
 */
export const PERMANENT_MASTER_DATA = {
    questions: [
        {
            question: "खालीलपैकी कोणते शब्द 'तत्सम' प्रकारचे आहेत?",
            options: ["पृथ्वी, दुग्ध, कन्या", "घर, पाय, गाव", "धोंडा, वांगे, झाड", "बटाटा, कोबी, हापूस"],
            correctAnswerIndex: 0,
            explanation: "जे शब्द संस्कृतमधून मराठीत जसेच्या तसे आले आहेत त्यांना तत्सम शब्द म्हणतात. पृथ्वी, दुग्ध, कन्या हे तत्सम शब्द आहेत.",
            subCategory: "Marathi Grammar"
        }
    ] as QuizQuestion[],
    
    notes: [
        {
            id: "m1",
            subject: "Marathi",
            topic: "समास (Compounds)",
            content: "समास म्हणजे शब्दांचे एकत्रीकरण होय.\n\n### समासाचे मुख्य ४ प्रकार:\n१. **अव्ययीभाव समास:** पहिले पद महत्त्वाचे.\n२. **तत्पुरुष समास:** दुसरे पद महत्त्वाचे.\n३. **द्वंद्व समास:** दोन्ही पदे महत्त्वाचे.\n४. **बहुव्रीही समास:** दोन्ही पदे गौण असून तिसऱ्याच पदाचा बोध होतो.",
            createdAt: "2024-05-20T10:00:00Z"
        }
    ] as SavedNote[],

    vocab: [] as VocabWord[]
};

// --- Missing Functions for Build Fix ---

/**
 * LiteratureMode साठी आवश्यक फंक्शन
 */
export const getLiteratureAnalysis = async (topic: string) => {
    // हे फंक्शन LiteratureMode.tsx ला हवं होतं म्हणून ॲड केलंय
    return {
        title: topic,
        analysis: "या विषयावर सध्या डेटा उपलब्ध नाही. लवकरच अपडेट केला जाईल.",
        questions: []
    };
};

export const STANDARD_RAJYASEVA_MOCK: QuizQuestion[] = [
  {
    question: "खालीलपैकी कोणत्या समाजसुधारकाने 'शेतकऱ्यांचा असूड' हा ग्रंथ लिहिला?",
    options: ["महात्मा जोतिराव फुले", "डॉ. बाबासाहेब आंबेडकर", "राजर्षी शाहू महाराज", "गोपाळ गणेश आगरकर"],
    correctAnswerIndex: 0,
    explanation: "महात्मा जोतिराव फुले यांनी १८८३ मध्ये 'शेतकऱ्यांचा असूड' हा ग्रंथ लिहून शेतकऱ्यांच्या दुरवस्थेचे चित्रण केले.",
    subCategory: "History"
  },
  {
    question: "भारताच्या राज्यघटनेतील 'कलम ३२' कशाशी संबंधित आहे?",
    options: ["समतेचा हक्क", "घटनात्मक उपाययोजनेचा हक्क", "धार्मिक स्वातंत्र्य", "शिक्षण हक्क"],
    correctAnswerIndex: 1,
    explanation: "कलम ३२ अन्वये मूलभूत हक्कांच्या संरक्षणासाठी सर्वोच्च न्यायालयात दाद मागता येते. डॉ. आंबेडकरांनी याला 'घटनेचा आत्मा' म्हटले आहे.",
    subCategory: "Polity"
  },
  {
    question: "महाराष्ट्र पठाराची निर्मिती कोणत्या प्रक्रियेतून झाली आहे?",
    options: ["भूकंप", "प्रस्तरभंग", "ज्वालामुखीचा भेगीय उद्रेक", "वलीकरण"],
    correctAnswerIndex: 2,
    explanation: "डेक्कन ट्रॅप किंवा महाराष्ट्र पठार हे ज्वालामुखीच्या भेगीय उद्रेकातून (Fissure Eruption) साचलेल्या लाव्हारसापासून बनले आहे.",
    subCategory: "Geography"
  }
];

export const STANDARD_COMBINED_MOCK: QuizQuestion[] = [
  {
    question: "Give the synonym of the word: 'ABANDON'",
    options: ["Keep", "Forsake", "Adopt", "Cherish"],
    correctAnswerIndex: 1,
    explanation: "'Abandon' म्हणजे सोडून देणे. 'Forsake' हा उसका समानार्थी शब्द आहे.",
    subCategory: "English Grammar"
  },
  {
    question: "खालीलपैकी 'अमृत' या शब्दाचा समानार्थी शब्द ओळखा.",
    options: ["सुधा", "गरल", "विष", "पावक"],
    correctAnswerIndex: 0,
    explanation: "अमृत म्हणजे सुधा किंवा पीयूष. गरल आणि विष हे त्याचे विरुद्धार्थी शब्द आहेत.",
    subCategory: "Marathi Grammar"
  }
];

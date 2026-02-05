
import { NoteResource, QuizQuestion } from '../types';

export const STANDARD_RAJYASEVA_MOCK: QuizQuestion[] = [
  {
    question: "खालीलपैकी कोणत्या समाजसुधारकाने 'शेतकऱ्यांचा असूड' हा ग्रंथ लिहिला?",
    options: ["महात्मा जोतिराव फुले", "डॉ. बाबासाहेब आंबेडकर", "राजर्षी शाहू महाराज", "गोपाळ गणेश आगरकर"],
    correctAnswerIndex: 0,
    explanation: "महात्मा जोतिराव फुले यांनी १८८३ मध्ये 'शेतकऱ्यांचा असूड' हा ग्रंथ लिहून शेतकऱ्यांच्या दुरवस्थेचे चित्रण केले."
  },
  {
    question: "भारताच्या राज्यघटनेतील 'कलम ३२' कशाशी संबंधित आहे?",
    options: ["समतेचा हक्क", "घटनात्मक उपाययोजनेचा हक्क", "धार्मिक स्वातंत्र्य", "शिक्षण हक्क"],
    correctAnswerIndex: 1,
    explanation: "कलम ३२ अन्वये मूलभूत हक्कांच्या संरक्षणासाठी सर्वोच्च न्यायालयात दाद मागता येते. डॉ. आंबेडकरांनी याला 'घटनेचा आत्मा' म्हटले आहे."
  },
  {
    question: "महाराष्ट्र पठाराची निर्मिती कोणत्या प्रक्रियेतून झाली आहे?",
    options: ["भूकंप", "प्रस्तरभंग", "ज्वालामुखीचा भेगीय उद्रेक", "वलीकरण"],
    correctAnswerIndex: 2,
    explanation: "डेक्कन ट्रॅप किंवा महाराष्ट्र पठार हे ज्वालामुखीच्या भेगीय उद्रेकातून (Fissure Eruption) साचलेल्या लाव्हारसापासून बनले आहे."
  },
  {
    question: "RBI ची स्थापना कोणत्या आयोगाच्या शिफारशीनुसार करण्यात आली?",
    options: ["हिल्टन यंग आयोग", "सायमन कमिशन", "कॅबिनेट मिशन", "नियोजन आयोग"],
    correctAnswerIndex: 0,
    explanation: "१९२६ च्या हिल्टन यंग आयोगाच्या शिफारशीनुसार १ एप्रिल १९३५ रोजी भारतीय रिझर्व्ह बँकेची स्थापना झाली."
  },
  {
    question: "विद्युत धारेचे एकक (SI Unit) काय आहे?",
    options: ["व्होल्ट", "ओहम", "अँपिअर", "वॅट"],
    correctAnswerIndex: 2,
    explanation: "विद्युत धारा (Electric Current) अँपिअरमध्ये मोजली जाते."
  },
  {
    question: "भारतीय राष्ट्रीय काँग्रेसचे पहिले अधिवेशन कोठे भरले होते?",
    options: ["मुंबई", "पुणे", "कोलकाता", "चेन्नई"],
    correctAnswerIndex: 0,
    explanation: "काँग्रेसचे पहिले अधिवेशन २८ डिसेंबर १८८५ रोजी मुंबईतील गोकुळदास तेजपाल संस्कृत महाविद्यालयात भरले होते."
  }
];

export const STANDARD_COMBINED_MOCK: QuizQuestion[] = [
  {
    question: "Give the synonym of the word: 'ABANDON'",
    options: ["Keep", "Forsake", "Adopt", "Cherish"],
    correctAnswerIndex: 1,
    explanation: "'Abandon' म्हणजे सोडून देणे. 'Forsake' हा त्याचा समानार्थी शब्द आहे."
  },
  {
    question: "खालीलपैकी 'अमृत' या शब्दाचा समानार्थी शब्द ओळखा.",
    options: ["सुधा", "गरल", "विष", "पावक"],
    correctAnswerIndex: 0,
    explanation: "अमृत म्हणजे सुधा किंवा पीयूष. गरल आणि विष हे त्याचे विरुद्धार्थी शब्द आहेत."
  },
  {
    question: "Choose the correct question tag: 'He is working hard, ______?'",
    options: ["is he", "isn't he", "hasn't he", "doesn't he"],
    correctAnswerIndex: 1,
    explanation: "होकारार्थी वाक्याचा Question Tag नकारार्थी असतो. 'He is' चे 'isn't he' होईल."
  },
  {
    question: "मराठी वर्णमालेत एकूण किती स्वरादी आहेत?",
    options: ["२", "१२", "३४", "४८"],
    correctAnswerIndex: 0,
    explanation: "मराठी वर्णमालेत 'अं' आणि 'अः' हे दोन स्वरादी आहेत."
  },
  {
    question: "महाराष्ट्रातील सर्वाधिक लांबीची नदी कोणती?",
    options: ["कृष्णा", "भीमा", "गोदावरी", "नर्मदा"],
    correctAnswerIndex: 2,
    explanation: "गोदावरी ही महाराष्ट्रातील सर्वात लांब नदी असून तिची लांबी ६६८ किमी आहे."
  },
  {
    question: "Select the correctly spelt word:",
    options: ["Committe", "Committee", "Comittee", "Commitee"],
    correctAnswerIndex: 1,
    explanation: "The correct spelling is 'Committee' (C-O-M-M-I-T-T-E-E)."
  }
];


export const QUICK_NOTES_LIBRARY: NoteResource[] = [
  {
    id: 'gs-polity-1',
    title: 'Indian Polity: Fundamental Rights Quick Revision',
    subject: 'General Studies',
    examType: 'RAJYASEVA',
    description: 'Articles 12-35, key cases, and memory tricks.',
    language: 'Bilingual',
    tags: ['polity', 'rights', 'constitution', 'pyq'],
    updatedOn: '2026-01-10',
    notes: `• Article 14: Equality before law + equal protection of law.\n• Article 19: Six freedoms (speech, assembly, movement, residence, profession, association).\n• Article 21: Life and personal liberty (widest interpretation).\n• PYQ Tip: Article 32 = constitutional remedies (Dr. Ambedkar: heart and soul).`
  },
  {
    id: 'marathi-grammar-1',
    title: 'मराठी व्याकरण: संधी आणि समास झटपट नोट्स',
    subject: 'Marathi',
    examType: 'GROUP_B',
    description: 'संधी, समास, अपवाद आणि PYQ trap points.',
    language: 'Marathi',
    tags: ['marathi', 'grammar', 'sandhi', 'samas'],
    updatedOn: '2026-01-08',
    notes: `• स्वर संधी: अ + अ = आ, इ + इ = ई (मुख्य नमुने लक्षात ठेवा).\n• व्यंजन संधीमध्ये उच्चार बदल PYQ मध्ये वारंवार विचारतात.\n• समास प्रकार: द्वंद्व, तत्पुरुष, बहुव्रीहि, अव्ययीभाव.\n• 80/20 नियम: मागील 10 वर्षांचे प्रश्न + नियमांचे अपवाद = जास्त गुण.`
  },
  {
    id: 'english-vocab-1',
    title: 'English Vocab Booster for MPSC (Synonyms/Antonyms)',
    subject: 'English',
    examType: 'GROUP_C',
    description: 'High-frequency word list and sentence usage.',
    language: 'English',
    tags: ['vocab', 'synonyms', 'antonyms', 'english'],
    updatedOn: '2026-01-12',
    notes: `• Abandon = Forsake | opposite: Retain\n• Candid = Frank | opposite: Evasive\n• Diligent = Hardworking | opposite: Lazy\n• PYQ Pattern: 1 direct synonym + 1 spelling + 1 idiom in many papers.`
  },
  {
    id: 'pyq-strategy-1',
    title: 'PYQ Attempt Strategy: Rajyaseva + Combined',
    subject: 'General',
    examType: 'RAJYASEVA',
    description: 'Time management and elimination method based on PYQ trend.',
    language: 'Bilingual',
    tags: ['strategy', 'pyq', 'time-management'],
    updatedOn: '2026-01-15',
    notes: `• Round 1 (35 min): फक्त खात्रीचे प्रश्न सोडवा.\n• Round 2 (40 min): elimination method वापरून 50-50 वाले प्रश्न.\n• Round 3 (10 min): marked questions + OMR re-check.\n• Weekly plan: 2 PYQ mocks + error notebook + revision within 24 hours.`
  }
];

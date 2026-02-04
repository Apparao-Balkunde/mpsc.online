
import React, { useState, useMemo, useEffect } from 'react';
import { Subject, LoadingState, RuleExplanation } from '../types';
import { generateStudyNotes, generateConciseExplanation, playTextToSpeech } from '../services/gemini';
import { markTopicViewed, getProgress } from '../services/progress';
import { Book, Send, Loader2, ArrowLeft, Lightbulb, Search, ListFilter, GraduationCap, ChevronDown, ChevronRight, Save, Check, Volume2, Folder, CheckSquare, Target, AlertTriangle, CheckCircle2, FileText, Minimize2, Maximize2, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StudyModeProps {
  initialSubject?: Subject;
  onBack: () => void;
}

interface TopicGroup {
  category: string;
  topics: string[];
}

const GRAMMAR_STRUCTURE: Record<Subject, TopicGroup[]> = {
  [Subject.MARATHI]: [
    {
      category: "१. वर्णविचार (Phonology & Alphabet) - Advanced",
      topics: [
        "मराठी वर्णमाला: स्वर, स्वरादी, व्यंजन (Alphabet Classification - Comprehensive)",
        "वर्णांचे उच्चारस्थान (Places of Articulation - Detailed)",
        "जोडाक्षरे व लेखन पद्धती (Conjunct Consonants - Advanced Rules)",
        "संधी: स्वरसंधी नियमावली (Vowel Sandhi - Deep Dive)",
        "संधी: व्यंजनसंधी व विसर्गसंधी (Consonant & Visarga Sandhi - Exceptions)",
        "पर-सवर्ण संधी (Para-Savarna Sandhi Rules)"
      ]
    },
    {
      category: "२. नाम व नामाचे विकार (Nouns & Declension)",
      topics: [
        "नाम: प्रकार (सामान्यनाम, विशेषनाम, भाववाचक नाम - Detailed)",
        "भाववाचक नामांची विशेष कार्ये (Special Functions of Abstract Nouns)",
        "लिंग विचार: नियम व महत्त्वाचे अपवाद (Gender Rules - MPSC Traps)",
        "वचन विचार: नियम व महत्त्वाचे अपवाद (Number Rules - Collective Nouns)",
        "विभक्ती: प्रत्यय व कारकार्थ (Case & Case Relations - Detailed Chart)",
        "उपपदविभक्ती (Upapada Vibhakti Rules)",
        "सामान्यरूप: नियम व महत्त्वाचे अपवाद (Normal Form - Exceptional Cases)"
      ]
    },
    {
      category: "३. सर्वनाम व विशेषण (Pronouns & Adjectives)",
      topics: [
        "सर्वनाम: प्रकार व उपयोग (Pronoun Types - Practical Context)",
        "आत्मवाचक सर्वनामे (Reflexive Pronouns - Detailed)",
        "विशेषण: प्रकार (गुणवाचक, संख्यावाचक, सार्वनामिक)",
        "साधित विशेषणे (Derived Adjectives: Noun/Verb based)",
        "विशेषणांचे उपयोग व तुलना (Usage & Comparison nuances)"
      ]
    },
    {
      category: "४. क्रियापद व काळ (Verbs & Tenses) - Mains Focus",
      topics: [
        "क्रियापद: सकर्मक, अकर्मक, द्विकर्मक, उभयविध (Deep Analysis)",
        "सिद्ध व साधित क्रियापदे (Derived Verbs - Detailed)",
        "संयुक्त क्रियापदे व सहाय्यक क्रियापदे (Compound & Auxiliary Verbs)",
        "प्रयोजक व शक्य क्रियापदे (Causative & Potential Verbs)",
        "काळ: वर्तमान, भूत, भविष्य (Tenses - 12 subtypes with examples)",
        "आख्यात विकार व अर्थ (Moods: स्वार्थ, आज्ञार्थ, विध्यर्थ, संकेतार्थ)",
        "क्रियापदांचे अर्थ: विध्यर्थाचे विविध उपयोग"
      ]
    },
    {
      category: "५. अव्यय विचार (Indeclinables)",
      topics: [
        "क्रियाविशेषण अव्यय: प्रकार व स्थान (Adverbs - Detailed)",
        "शब्दयोगी अव्यय: प्रकार व सामान्यरूप (Prepositions - Nuances)",
        "शुद्ध शब्दयोगी अव्यये (Pure Prepositions)",
        "उभयान्वयी अव्यय (Conjunctions - Coordinating vs Subordinating)",
        "केवलप्रयोगी अव्यय व उद्गारचिन्हांचा वापर (Interjections)"
      ]
    },
    {
      category: "६. वाक्यरचना व प्रयोग (Syntax & Voice) - Critical",
      topics: [
        "प्रयोग: कर्तरी, कर्मणी, भावे (Voice Analysis - Golden Rules)",
        "कर्मणी प्रयोगाचे उपप्रकार (Sub-types of Karmani: Pradhan, Shaki, Samapti, etc.)",
        "संकर प्रयोग: कर्तृ-कर्म संकर, कर्म-भाव संकर, कर्तृ-भाव संकर (Hybrid Voice)",
        "वाक्यप्रकार: विधानार्थी, प्रश्नार्थी, उद्गारार्थी (Transformations)",
        "वाक्यसंश्लेषण व वाक्यपृथक्करण (Sentence Synthesis & Analysis)",
        "केवल, संयुक्त व मिश्र वाक्ये (Simple, Compound, Complex - Identification)"
      ]
    },
    {
      category: "७. शब्दसिद्धी व समास (Word Formation & Compounds)",
      topics: [
        "समास: अव्ययीभाव, तत्पुरुष (Compounds - Comprehensive)",
        "तत्पुरुष समासाचे उपप्रकार (Vibhakti, Aluk, Upapada, Nan, Karmadharay, Dwigu)",
        "समास: द्वंद्व, बहुव्रीही (Detailed Analysis)",
        "शब्दसिद्धी: तत्सम, तद्भव, देशी शब्द (High-frequency list)",
        "परभाषीय शब्द: कानडी, गुजराती, पोर्तुगीज, फारसी, अरबी",
        "उपसर्ग व प्रत्यय घटित शब्द (Advanced rules)"
      ]
    },
    {
      category: "८. वृत्त, अलंकार व रस (Poetics) - Advanced",
      topics: [
        "अलंकार: शब्दालंकार (यमक, अनुप्रास, श्लेष - Deep Dive)",
        "अलंकार: अर्थालंकार (उपमा, उत्प्रेक्षा, रूपक, व्यतिरेक, अनन्वय, इ.)",
        "अलंकार: भ्रांतिमान, ससंदेह, अतिशयोक्ती, अर्थान्तरन्यास",
        "वृत्ते: अक्षरगणवृत्ते (भुजंगप्रयात, वसंततिलका, शिखरिणी, इ.)",
        "वृत्ते: मात्रावृत्ते (दिंडी, आर्या, नववधू)",
        "काव्यरस: नवरस व स्थायी भाव (The 9 Rasas - Detailed)",
        "शब्दशक्ती: अभिधा, लक्षणा, व्यंजना (Semantic Powers - Advanced)"
      ]
    },
    {
      category: "९. लेखन नियम व शुद्धिपत्रक (Writing Rules)",
      topics: [
        "शुद्धलेखनाचे नवीन सुधारलेले नियम (Standard Orthography Rules)",
        "विरामचिन्हे: नियम व अचूक वापर (Punctuation)",
        "वाक्यशुद्धी: सामान्य चुका व सुधारणा (Sentence Correction)"
      ]
    }
  ],
  [Subject.ENGLISH]: [
    {
      category: "1. Fundamentals & Parts of Speech - Advanced",
      topics: [
        "Articles: A, An, The (Specific Rules & Omission of Articles)",
        "Nouns: Countable/Uncountable - Common Traps in MPSC",
        "Nouns: Number (Singular/Plural) - Irregular & Foreign plurals",
        "Pronouns: Relative Pronouns (Who, Whom, Whose, Which, That rules)",
        "Pronouns: Antecedent Agreement & Case rules",
        "Adjectives: Position, Order & Nuances (Little/A Little/The Little)",
        "Verbs: Transitive/Intransitive & Linking Verbs",
        "Adverbs: Placement, Inversion & Confusing Adverbs"
      ]
    },
    {
      category: "2. Tenses & Time Expressions - Deep Dive",
      topics: [
        "Present Tense: Perfect vs Perfect Continuous nuances",
        "Past Tense: Simple Past vs Past Perfect (Timeline analysis)",
        "Future Tense: Expressing future through Present Tenses",
        "Sequence of Tenses: Rules for Indirect Speech & Complex sentences",
        "Conditional Sentences: Zero, 1st, 2nd, 3rd and Mixed Conditionals"
      ]
    },
    {
      category: "3. Syntax & Agreement (The 50 Golden Rules)",
      topics: [
        "Subject-Verb Agreement (Concord): Advanced Rules & Exceptions",
        "Non-Finite Verbs: Gerunds vs Infinitives - Deep Dive",
        "Verbs followed by specific Gerunds/Infinitives",
        "Participles: Present, Past & Perfect Participles (Dangling errors)",
        "Modals: Advanced shades of meaning (Could have, Must have, etc.)",
        "Causative Verbs: Make, Get, Have, Let, Help nuances",
        "The Subjunctive Mood: Wishes, Commands, Hypotheses"
      ]
    },
    {
      category: "4. Sentence Transformations - Mains Focus",
      topics: [
        "Active & Passive Voice: Advanced structures (Prepositional, Infinitives)",
        "Passive of Intransitive Verbs & Double Object verbs",
        "Direct & Indirect Speech: Changing Modals, Questions & Imperatives",
        "Reported Speech in Narrative Contexts",
        "Degrees of Comparison: Transformation with No other/Very few",
        "Transformation: Simple, Compound, Complex (Advanced Connectors)",
        "Question Tags: Negative/Positive & Imperative Tags"
      ]
    },
    {
      category: "5. Clauses, Structure & Style",
      topics: [
        "Noun Clauses: Identification & Function",
        "Adjective (Relative) Clauses: Defining vs Non-defining",
        "Adverb Clauses: Reason, Result, Concession, Condition",
        "Parallelism: Correlative Conjunctions & Listed items",
        "Inversion: Adverbial Inversion (Hardly, Seldom, Never)",
        "Cleft Sentences: It-clefts & Wh-clefts for emphasis",
        "Superfluous Expressions & Redundancy (Common MPSC Errors)"
      ]
    },
    {
      category: "6. Vocabulary & Mechanics",
      topics: [
        "Prepositions: Fixed Prepositions (Advanced Level)",
        "Prepositions: Differences between similar ones (Among/Between, etc.)",
        "Phrasal Verbs: The Top 200 MPSC Frequency List",
        "Idioms & Phrases: Thematic Groups",
        "Spotting the Error: Advanced Mixed Practice",
        "Punctuation: Semicolon, Colon & Dash usage",
        "One Word Substitution: Roots, Suffixes & Prefixes"
      ]
    }
  ],
  [Subject.GS]: [
    {
      category: "History & Culture (इतिहास)",
      topics: [
        "Maharashtra: Social Reformers (Phule, Shahu, Ambedkar - Detailed)",
        "Modern India: 1857 Revolt & Maharashtra's Contribution",
        "Maratha Empire: Administration, Forts, & Governance",
        "Samyukta Maharashtra Movement (संयुक्त महाराष्ट्र चळवळ)",
        "Revolutionary Movement in India & Maharashtra",
        "Governor Generals and Viceroys of India"
      ]
    },
    {
      category: "Polity & Constitution (राज्यशास्त्र)",
      topics: [
        "Preamble & Fundamental Rights (Articles 12-35)",
        "Directive Principles (DPSP) & Fundamental Duties",
        "Parliament: President, Lok Sabha, Rajya Sabha",
        "State Legislature: Governor, Vidhan Sabha, Parishad",
        "Panchayat Raj: 73rd & 74th Constitutional Amendments",
        "Important Constitutional Bodies (ECI, UPSC, CAG)",
        "Emergency Provisions (Article 352, 356, 360)"
      ]
    },
    {
      category: "Geography (भूगोल)",
      topics: [
        "Physical Geography of Maharashtra: Kokan, Sahyadri, Plateau",
        "River Systems of Maharashtra (Godavari, Krishna, Tapi)",
        "Climate, Soils and Crops of Maharashtra",
        "Mineral Resources in Maharashtra",
        "Population & Census 2011 Highlights (Maharashtra)",
        "Solar System & Earth's Interior"
      ]
    },
    {
      category: "Economy (अर्थशास्त्र)",
      topics: [
        "RBI: Monetary Policy & Functions",
        "National Income: GDP, GNP, NNP Concepts",
        "Poverty & Unemployment in India (Committees)",
        "Five Year Plans of India (NITI Aayog)",
        "Banking Sector Reforms & Financial Inclusion",
        "Public Finance: GST & Budget"
      ]
    },
    {
      category: "General Science (सामान्य विज्ञान)",
      topics: [
        "Physics: Light, Sound, Electricity basics",
        "Chemistry: Atomic Structure, Acids, Bases, Salts",
        "Biology: Human Body Systems (Digestive, Circulatory)",
        "Diseases: Bacterial, Viral, Protozoan",
        "Vitamins & Nutrition",
        "Environment: Ecosystem, Pollution, Biodiversity"
      ]
    }
  ]
};

// Fuzzy search helper
const getLevenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

export const StudyMode: React.FC<StudyModeProps> = ({ initialSubject = Subject.MARATHI, onBack }) => {
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [activeTab, setActiveTab] = useState<'search' | 'rules'>('search');

  // Logic for expandable rules and categories
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  
  const [ruleExplanations, setRuleExplanations] = useState<Record<string, RuleExplanation>>({});
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [ruleFilter, setRuleFilter] = useState('');
  
  // Logic for saving notes
  const [isSaved, setIsSaved] = useState(false);

  // Logic for audio
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Progress Tracking
  const [viewedTopics, setViewedTopics] = useState<string[]>([]);

  useEffect(() => {
    setViewedTopics(getProgress().studyTopicsViewed);
  }, []);

  const generateNotes = async (topicToUse: string) => {
    if (!topicToUse.trim()) return;

    setStatus('loading');
    setNotes('');
    setTopic(topicToUse);
    setIsSaved(false); // Reset saved state for new content
    
    try {
      const result = await generateStudyNotes(subject, topicToUse);
      setNotes(result);
      setStatus('success');
      
      // Update progress
      markTopicViewed(topicToUse);
      setViewedTopics(prev => {
         if (prev.includes(topicToUse)) return prev;
         return [...prev, topicToUse];
      });

    } catch (error) {
      setStatus('error');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateNotes(topic);
  };

  const toggleRule = async (rule: string) => {
    if (expandedRule === rule) {
      setExpandedRule(null);
      return;
    }

    setExpandedRule(rule);

    // Mark as viewed immediately when expanding
    markTopicViewed(rule);
    setViewedTopics(prev => {
        if (prev.includes(rule)) return prev;
        return [...prev, rule];
    });

    if (!ruleExplanations[rule]) {
      setLoadingExplanation(true);
      try {
        const explanation = await generateConciseExplanation(subject, rule);
        setRuleExplanations(prev => ({ ...prev, [rule]: explanation }));
      } catch (e) {
        console.error("Failed to load explanation", e);
      } finally {
        setLoadingExplanation(false);
      }
    }
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleExpandAll = () => {
    const newOpenState: Record<string, boolean> = {};
    filteredStructure.forEach(group => {
        newOpenState[group.category] = true;
    });
    setOpenCategories(newOpenState);
  };

  const handleCollapseAll = () => {
    setOpenCategories({});
    setExpandedRule(null);
  };

  const handleSaveNotes = () => {
    if (!notes || !topic) return;

    const newNote = {
      id: Date.now().toString(),
      subject,
      topic,
      content: notes,
      createdAt: new Date().toISOString()
    };

    try {
      const existingNotesStr = localStorage.getItem('mpsc_saved_notes');
      const existingNotes = existingNotesStr ? JSON.parse(existingNotesStr) : [];
      
      const isDuplicate = existingNotes.some((n: any) => n.topic === topic && n.subject === subject && n.content === notes);
      
      if (!isDuplicate) {
        localStorage.setItem('mpsc_saved_notes', JSON.stringify([newNote, ...existingNotes]));
      }
      
      setIsSaved(true);
    } catch (e) {
      console.error("Failed to save note", e);
      alert("Failed to save note. Storage might be full.");
    }
  };

  const handlePlayAudio = async () => {
    if (!topic || isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    try {
      await playTextToSpeech(topic);
    } catch (e) {
      console.error("Failed to play audio", e);
      alert("Could not play audio. Please try again.");
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const filteredStructure = useMemo(() => {
    const rawFilter = ruleFilter.trim().toLowerCase();
    const groups = GRAMMAR_STRUCTURE[subject] || [];

    if (!rawFilter) return groups;

    const searchTerms = rawFilter.split(/\s+/).filter(t => t.length > 0);

    return groups.map(group => {
       const matchingTopics = group.topics.filter(rule => {
          const ruleLower = rule.toLowerCase();
          // Fast path: substring match
          if (ruleLower.includes(rawFilter)) return true;

          // Token-based fuzzy match
          const ruleWords = ruleLower.split(/[\s,()-]+/).filter(w => w.length > 0);
          
          return searchTerms.every(term => {
             // 1. Exact term substring match in any word
             if (ruleWords.some(rw => rw.includes(term))) return true;
             
             // 2. Fuzzy match
             return ruleWords.some(rw => {
                 if (Math.abs(rw.length - term.length) > 2) return false;
                 const allowedErrors = term.length > 4 ? 2 : (term.length > 2 ? 1 : 0);
                 if (allowedErrors === 0) return false;
                 return getLevenshteinDistance(term, rw) <= allowedErrors;
             });
          });
       });

       return {
         category: group.category,
         topics: matchingTopics
       };
    }).filter(group => group.topics.length > 0);
  }, [subject, ruleFilter]);

  // Auto-expand categories with results when searching
  useEffect(() => {
    if (ruleFilter.trim()) {
      handleExpandAll();
    }
  }, [ruleFilter]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 pb-0">
          <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center">
            <Book className="mr-2 text-indigo-600" />
            AI Study Companion
          </h2>
          <p className="text-slate-500 mb-6">Generate detailed notes, grammar rules, and explanations instantly.</p>

          {/* Subject Selector */}
           <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Subject</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(Subject).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                        setSubject(s);
                        setExpandedRule(null);
                        setRuleFilter('');
                        setOpenCategories({});
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      subject === s 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s === Subject.MARATHI ? 'Marathi (मराठी)' : (s === Subject.GS ? 'General Studies (GS)' : s)}
                  </button>
                ))}
              </div>
            </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'search' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-indigo-500'
              }`}
            >
              <Search size={18} />
              Custom Topic Search
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'rules' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-indigo-500'
              }`}
            >
              <ListFilter size={18} />
              {subject === Subject.GS ? 'Common Syllabus Topics' : 'Common Grammar Rules'}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 bg-slate-50/50 min-h-[500px]">
          {activeTab === 'search' ? (
             <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Enter Topic</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={
                        subject === Subject.MARATHI ? "e.g. प्रयोग, समास..." : 
                        subject === Subject.GS ? "e.g. 1857 Revolt, President Powers..." : 
                        "e.g. Tenses, Articles..."
                    }
                    className="flex-1 rounded-lg border-slate-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading' || !topic.trim()}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all shadow-sm hover:shadow"
                  >
                    {status === 'loading' ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-4 text-indigo-800 bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
                 <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                    <Lightbulb size={24} />
                 </div>
                 <div className="flex-1">
                     <p className="font-semibold text-sm">Quick Study Guide</p>
                     <p className="text-xs text-indigo-700 mt-0.5">Browse topics by category or search below. Checked items (<CheckSquare size={10} className="inline"/>) are topics you've studied.</p>
                 </div>
              </div>

              {/* Sticky Search & Controls Bar */}
              <div className="sticky top-0 z-30 bg-white/95 backdrop-blur py-3 mb-4 border-b border-slate-200 -mx-6 px-6 shadow-sm">
                <div className="relative group mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                    type="text"
                    value={ruleFilter}
                    onChange={(e) => setRuleFilter(e.target.value)}
                    placeholder={`Search ${subject === Subject.GS ? 'GS Syllabus' : subject + ' rules'}...`}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                    />
                </div>
                
                <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Layers size={12} />
                        {filteredStructure.reduce((acc, g) => acc + g.topics.length, 0)} Topics
                    </p>
                    <div className="flex gap-4 text-xs font-bold text-indigo-600">
                        <button onClick={handleExpandAll} className="flex items-center gap-1 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors">
                            <Maximize2 size={12} /> Expand All
                        </button>
                        <span className="text-slate-300 py-1">|</span>
                        <button onClick={handleCollapseAll} className="flex items-center gap-1 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors">
                            <Minimize2 size={12} /> Collapse All
                        </button>
                    </div>
                </div>
              </div>
              
              <div className="space-y-4 pb-4">
                {filteredStructure.length > 0 ? (
                  filteredStructure.map((group, groupIdx) => (
                    <div key={groupIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all group">
                       {/* Category Header (Accordion Trigger) */}
                       <button
                          onClick={() => toggleCategory(group.category)}
                          className={`w-full flex items-center justify-between p-4 transition-all ${
                              openCategories[group.category] 
                              ? 'bg-gradient-to-r from-slate-50 to-white text-indigo-900 border-b border-indigo-100 shadow-inner' 
                              : 'bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                       >
                           <div className="flex items-center gap-3 font-semibold text-base">
                               <div className={`p-2 rounded-lg transition-colors ${openCategories[group.category] ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'}`}>
                                  <Folder size={18} fill={openCategories[group.category] ? "currentColor" : "none"} />
                               </div>
                               <div className="flex flex-col items-start text-left">
                                 <span className={openCategories[group.category] ? 'text-indigo-900 font-bold' : 'text-slate-700'}>{group.category}</span>
                                 <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                     {group.topics.length} Rules
                                 </span>
                               </div>
                           </div>
                           <div className={`transition-transform duration-300 ${openCategories[group.category] ? 'rotate-180 text-indigo-600' : 'text-slate-300'}`}>
                               <ChevronDown size={20} />
                           </div>
                       </button>

                       {/* Accordion Content */}
                       {openCategories[group.category] && (
                           <div className="bg-slate-50/30">
                               {group.topics.map((ruleItem, idx) => {
                                   const isLast = idx === group.topics.length - 1;
                                   const isExpanded = expandedRule === ruleItem;
                                   const isViewed = viewedTopics.includes(ruleItem);
                                   
                                   return (
                                   <div key={idx} className={`relative ${!isLast ? 'border-b border-slate-100' : ''}`}>
                                        {/* Tree line visual - Vertical */}
                                        <div className="absolute left-[1.35rem] top-0 bottom-0 w-px bg-slate-200 z-0" />
                                        
                                        <div className={`relative z-10 pl-10 transition-colors ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                                            {/* Tree line visual - Horizontal Connector */}
                                            <div className="absolute left-[1.35rem] top-1/2 w-5 h-px bg-slate-200" />
                                            
                                            <button
                                                onClick={() => toggleRule(ruleItem)}
                                                className="w-full text-left py-3 px-3 flex items-center justify-between group/item"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 shrink-0 rounded-full transition-all ${isExpanded ? 'bg-indigo-500 scale-125' : (isViewed ? 'bg-green-500' : 'bg-slate-300 group-hover/item:bg-indigo-300')}`} />
                                                    <span className={`text-sm font-medium transition-colors ${isExpanded ? 'text-indigo-800 font-bold' : (isViewed ? 'text-slate-800 font-bold' : 'text-slate-600 group-hover/item:text-indigo-700 font-semibold')}`}>
                                                        {ruleItem}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                  {isViewed && (
                                                     <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                                                       <CheckSquare size={10} /> Studied
                                                     </span>
                                                  )}
                                                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-indigo-500' : 'text-slate-300 group-hover/item:text-slate-400'}`}>
                                                      <ChevronRight size={16} />
                                                  </div>
                                                </div>
                                            </button>

                                            {/* Expanded Rule Details */}
                                            {isExpanded && (
                                                <div className="px-3 pb-4 pt-0">
                                                    <div className="bg-white rounded-lg shadow-lg border border-indigo-100 overflow-hidden animate-in zoom-in-95 duration-200 mt-2">
                                                        <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <Book size={16} className="text-indigo-600" />
                                                                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Detailed Analysis</span>
                                                            </div>
                                                            <button onClick={() => generateNotes(ruleItem)} className="text-xs flex items-center gap-1 bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 transition-colors">
                                                                <FileText size={12} /> Full Notes
                                                            </button>
                                                        </div>

                                                        <div className="p-5 max-h-[500px] overflow-y-auto">
                                                            {loadingExplanation && !ruleExplanations[ruleItem] ? (
                                                                <div className="flex flex-col items-center justify-center py-8">
                                                                    <Loader2 size={24} className="animate-spin text-indigo-500 mb-2"/>
                                                                    <p className="text-xs text-slate-500 font-bold">Consulting AI Tutor...</p>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    {/* Definition Section */}
                                                                    <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                                                                        <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                                                                            <Book size={14} className="text-indigo-600"/> Definition & Rule
                                                                        </h5>
                                                                        <p className="text-slate-800 text-sm leading-relaxed font-bold">
                                                                            {ruleExplanations[ruleItem]?.definition || "Loading definition..."}
                                                                        </p>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {/* Importance Section */}
                                                                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                                                            <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                                                                                <Target size={14} className="text-blue-600"/> MPSC Relevance
                                                                            </h5>
                                                                            <p className="text-sm text-slate-700 font-semibold">
                                                                                {ruleExplanations[ruleItem]?.importance}
                                                                            </p>
                                                                        </div>

                                                                        {/* Nuances Section */}
                                                                        <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                                                                            <h5 className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                                                                                <AlertTriangle size={14} className="text-purple-600"/> Nuances & Exceptions
                                                                            </h5>
                                                                            <p className="text-sm text-slate-700 font-semibold">
                                                                                {ruleExplanations[ruleItem]?.nuances}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Examples Section */}
                                                                    <div className="mt-4">
                                                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                            <GraduationCap size={14} className="text-indigo-600" /> 
                                                                            MPSC Exam Examples
                                                                        </h4>
                                                                        <div className="grid gap-3">
                                                                        {ruleExplanations[ruleItem]?.examples?.map((ex, i) => (
                                                                            <div key={i} className="bg-gradient-to-r from-amber-50 to-white p-3 rounded-lg border border-amber-100 flex gap-3 items-start shadow-sm">
                                                                                <div className="bg-white text-amber-600 font-bold text-xs w-6 h-6 flex items-center justify-center rounded-full border border-amber-200 shrink-0 mt-0.5 shadow-sm">
                                                                                    {i + 1}
                                                                                </div>
                                                                                <p className="text-slate-800 text-sm leading-relaxed font-serif italic font-bold">
                                                                                    "{ex}"
                                                                                </p>
                                                                            </div>
                                                                        ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                   </div>
                                )})}
                           </div>
                       )}
                    </div>
                  ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <Search size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 font-medium">No topics match "{ruleFilter}"</p>
                    </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {status === 'loading' && (
        <div className="text-center py-12">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 animate-pulse font-bold">Consulting the expert knowledge base...</p>
          <p className="text-slate-400 text-sm mt-1 font-semibold">Generating detailed {subject} notes for "{topic}"</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center justify-center font-bold">
          <span>Unable to generate notes. Please check your connection and try again.</span>
        </div>
      )}

      {status === 'success' && notes && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-indigo-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-indigo-900 text-lg flex items-center">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    {topic}
                    </h3>
                    <button
                      onClick={handlePlayAudio}
                      disabled={isPlayingAudio}
                      className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                      title="Listen to pronunciation"
                    >
                      {isPlayingAudio ? <Loader2 size={20} className="animate-spin" /> : <Volume2 size={20} />}
                    </button>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 hidden md:inline-block">
                    {subject}
                    </span>
                </div>
                
                <button
                    onClick={handleSaveNotes}
                    disabled={isSaved}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                        isSaved 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'
                    }`}
                >
                    {isSaved ? <Check size={16} /> : <Save size={16} />}
                    {isSaved ? 'Saved!' : 'Save Notes'}
                </button>
            </div>
          <div className="p-6 prose prose-slate max-w-none prose-headings:text-indigo-800 prose-headings:font-bold prose-a:text-indigo-600 prose-strong:text-indigo-900 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-code:text-pink-600">
            <ReactMarkdown>{notes}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

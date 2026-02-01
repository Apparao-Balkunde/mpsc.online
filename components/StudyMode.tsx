import React, { useState, useMemo, useEffect } from 'react';
import { Subject, LoadingState, RuleExplanation } from '../types';
import { generateStudyNotes, generateConciseExplanation, playTextToSpeech } from '../services/gemini';
import { Book, Send, Loader2, ArrowLeft, Lightbulb, Search, ListFilter, GraduationCap, ChevronDown, ChevronUp, ArrowRight, Save, Check, Volume2, Folder, Layout, Info, CheckCircle2 } from 'lucide-react';
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
      category: "वर्णमाला व नियम (Alphabet & Basics)",
      topics: [
        "मराठी वर्णमाला: स्वर, स्वरादी, व्यंजने (Alphabet Structure)",
        "जोडाक्षरे व लेखन प्रकार (Conjunct Consonants)",
        "संधी (Sandhi): स्वर, व्यंजन व विसर्ग संधी",
        "विरामचिन्हे व शुद्धलेखन (Punctuation & Orthography)"
      ]
    },
    {
      category: "शब्दांच्या जाती (Parts of Speech)",
      topics: [
        "नाम: प्रकार, लिंग, वचन, विभक्ती (Noun)",
        "सर्वनाम: प्रकार व उपयोग (Pronoun)",
        "विशेषण: प्रकार व अवस्था (Adjective)",
        "क्रियापद: प्रकार, अर्थ, आख्यात (Verb)",
        "क्रियाविशेषण अव्यय (Adverb)",
        "शब्दयोगी अव्यय (Preposition)",
        "उभयान्वयी अव्यय (Conjunction)",
        "केवलप्रयोगी अव्यय (Interjection)"
      ]
    },
    {
      category: "वाक्य व व्याकरण (Sentence & Grammar)",
      topics: [
        "वाक्याचे प्रकार (Types of Sentences)",
        "प्रयोग (Prayog): कर्तरी, कर्मणी, भावे",
        "समास (Compound Words): अव्ययीभाव, तत्पुरुष, द्वंद्व, बहुव्रीही",
        "वाक्यरुपांतर (Sentence Transformation)",
        "वाक्यपृथक्करण (Sentence Analysis)",
        "काळ व काळाचे प्रकार (Tenses)"
      ]
    },
    {
      category: "शब्दसंपत्ती (Vocabulary)",
      topics: [
        "अलंकार (Figures of Speech)",
        "वृत्ते (Prosody/Meter)",
        "शब्दसिद्धी: तत्सम, तद्भव, देशी, परभाषिक",
        "वाक्प्रचार व म्हणी (Idioms & Proverbs)",
        "समानार्थी व विरुद्धार्थी शब्द (Synonyms & Antonyms)"
      ]
    }
  ],
  [Subject.ENGLISH]: [
    {
      category: "Fundamentals of Grammar",
      topics: [
        "Articles: A, An, The (Rules & Omission)",
        "Nouns: Number, Gender & Case Rules",
        "Pronouns: Personal, Relative, Reflexive",
        "Adjectives: Degrees of Comparison",
        "Verbs: Transitive, Intransitive & Auxiliaries"
      ]
    },
    {
      category: "Tenses & Voice",
      topics: [
        "Tenses: Present, Past, Future (Structure & Usage)",
        "Subject-Verb Agreement (Concord Rules)",
        "Active & Passive Voice (Transformation)",
        "Direct & Indirect Speech (Narration)"
      ]
    },
    {
      category: "Advanced Sentence Structure",
      topics: [
        "Clauses: Noun, Adjective, Adverb Clauses",
        "Types of Sentences: Simple, Compound, Complex",
        "Question Tags & Frame Questions",
        "Modal Auxiliaries & their Usage",
        "Transformation: Affirmative to Negative",
        "Transformation: Exclamatory to Assertive",
        "Remove 'too' / Use 'so...that'"
      ]
    },
    {
      category: "Vocabulary & Usage",
      topics: [
        "Prepositions: Fixed & Phrasal Prepositions",
        "Conjunctions & Connectors",
        "Phrasal Verbs & Idioms",
        "One Word Substitution",
        "Common Errors in Sentence Construction",
        "Punctuation Marks"
      ]
    }
  ],
  [Subject.GS]: [
    {
      category: "History & Culture",
      topics: [
        "Maharashtra: Social Reformers",
        "History: 1857 Revolt in Maharashtra"
      ]
    },
    {
      category: "Polity & Constitution",
      topics: [
        "Indian Constitution: Fundamental Rights",
        "Polity: Panchayat Raj Institutions"
      ]
    },
    {
      category: "Geography & Economy",
      topics: [
        "Geography: Maharashtra River Systems",
        "Economy: RBI Functions"
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
      const newOpenState: Record<string, boolean> = {};
      filteredStructure.forEach(group => {
          newOpenState[group.category] = true;
      });
      setOpenCategories(newOpenState);
    }
  }, [ruleFilter, filteredStructure]);

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
                    {s === Subject.MARATHI ? 'Marathi (मराठी)' : s}
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
              Common Grammar Rules
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 bg-slate-50/50 min-h-[300px]">
          {activeTab === 'search' ? (
             <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Enter Topic</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={subject === Subject.MARATHI ? "e.g. प्रयोग, समास..." : "e.g. Tenses, Articles..."}
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
              <div className="flex items-center gap-2 mb-6 text-indigo-800 bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
                 <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                    <Lightbulb size={24} />
                 </div>
                 <div className="flex-1">
                     <p className="font-semibold text-sm">Quick Study Guide</p>
                     <p className="text-xs text-indigo-700 mt-0.5">Browse topics by category or search below. Click to see quick explanations.</p>
                 </div>
              </div>

              {/* Filter Input */}
              <div className="relative mb-6 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={ruleFilter}
                  onChange={(e) => setRuleFilter(e.target.value)}
                  placeholder={`Search ${subject} rules (smart search supported)...`}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                />
              </div>
              
              <div className="space-y-4">
                {filteredStructure.length > 0 ? (
                  filteredStructure.map((group, groupIdx) => (
                    <div key={groupIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow transition-all">
                       {/* Category Header (Accordion Trigger) */}
                       <button
                          onClick={() => toggleCategory(group.category)}
                          className={`w-full flex items-center justify-between p-4 transition-colors ${
                              openCategories[group.category] 
                              ? 'bg-indigo-50/50 text-indigo-900 border-b border-indigo-100' 
                              : 'bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                       >
                           <div className="flex items-center gap-3 font-semibold text-base">
                               <Folder size={20} className={`shrink-0 ${openCategories[group.category] ? 'text-indigo-600 fill-indigo-100' : 'text-slate-400'}`} />
                               {group.category}
                               <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                   {group.topics.length}
                               </span>
                           </div>
                           <div className={`transition-transform duration-200 ${openCategories[group.category] ? 'rotate-180' : ''}`}>
                               <ChevronDown size={20} className="text-slate-400" />
                           </div>
                       </button>

                       {/* Accordion Content */}
                       {openCategories[group.category] && (
                           <div className="bg-white p-2 space-y-2 animate-in slide-in-from-top-1 duration-200">
                               {group.topics.map((ruleItem, idx) => (
                                   <div 
                                        key={idx} 
                                        className={`rounded-lg border transition-all duration-200 overflow-hidden mx-2 ${
                                            expandedRule === ruleItem 
                                            ? 'border-indigo-300 bg-indigo-50/30' 
                                            : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                                        }`}
                                   >
                                    <button
                                        onClick={() => toggleRule(ruleItem)}
                                        className="w-full text-left p-3 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3 pl-2">
                                            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                                expandedRule === ruleItem ? 'bg-indigo-500' : 'bg-slate-300 group-hover:bg-indigo-400'
                                            }`}></span>
                                            <span className={`text-sm font-medium transition-colors ${expandedRule === ruleItem ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                {ruleItem}
                                            </span>
                                        </div>
                                        {expandedRule === ruleItem 
                                            ? <ChevronUp size={16} className="text-indigo-600 shrink-0" /> 
                                            : <ChevronDown size={16} className="text-slate-300 shrink-0 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                                        }
                                    </button>
                                    
                                    {expandedRule === ruleItem && (
                                        <div className="px-5 pb-4 pl-8">
                                            {loadingExplanation && !ruleExplanations[ruleItem] ? (
                                                <div className="flex flex-col items-center justify-center text-xs text-slate-500 py-4 bg-white/50 rounded-lg border border-indigo-100 border-dashed">
                                                    <Loader2 size={16} className="animate-spin mb-2 text-indigo-500"/>
                                                    <p>Generating summary...</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 mb-4">
                                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                                            <Info size={12} /> Rule
                                                        </h4>
                                                        <p className="text-sm text-slate-700 leading-relaxed">
                                                            {ruleExplanations[ruleItem]?.rule}
                                                        </p>
                                                    </div>
                                                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                        <h4 className="text-xs font-bold text-green-700 uppercase mb-1 flex items-center gap-1">
                                                            <CheckCircle2 size={12} /> Exam Example
                                                        </h4>
                                                        <p className="text-sm text-slate-800 font-medium italic">
                                                            "{ruleExplanations[ruleItem]?.example}"
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    generateNotes(ruleItem);
                                                }}
                                                className="w-full text-xs flex items-center justify-center text-indigo-700 bg-indigo-100 hover:bg-indigo-200 font-semibold py-2 rounded-md transition-colors"
                                            >
                                                <Layout size={14} className="mr-1.5"/>
                                                Generate Full Study Notes
                                            </button>
                                        </div>
                                    )}
                                </div>
                               ))}
                           </div>
                       )}
                    </div>
                  ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <Search size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 font-medium">No grammar rules match "{ruleFilter}"</p>
                        <p className="text-xs text-slate-400 mt-1">Try checking for spelling errors, although our fuzzy search handles minor typos.</p>
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
          <p className="text-slate-600 animate-pulse font-medium">Consulting the expert knowledge base...</p>
          <p className="text-slate-400 text-sm mt-1">Generating detailed {subject} notes for "{topic}"</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center justify-center">
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
          <div className="p-6 prose prose-slate max-w-none prose-headings:text-indigo-800 prose-a:text-indigo-600 prose-strong:text-indigo-900 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-code:text-pink-600">
            <ReactMarkdown>{notes}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
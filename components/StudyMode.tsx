// Fix: Render build error by resolving storageService path
import React, { useState, useMemo, useEffect } from 'react';
import { Subject, LoadingState, RuleExplanation, SavedNote } from '../types';
import { generateStudyNotes, generateConciseExplanation, playTextToSpeech } from '../services/gemini';
// महत्वपूर्ण: यहाँ 'storageService' का इस्तेमाल करें जो Render पर मौजूद है
import { markTopicViewed, getProgress, saveNote } from '../services/storageService';
import { Book, Send, Loader2, ArrowLeft, Lightbulb, Search, ListFilter, GraduationCap, ChevronDown, ChevronRight, Save, Check, Volume2, Folder, Layers, Database, Zap, HelpCircle, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StudyModeProps {
  initialSubject?: Subject;
  onBack: () => void;
  onNavigateToQuiz?: (subject: Subject, topic: string) => void;
}

interface TopicGroup {
  category: string;
  topics: string[];
}

const GRAMMAR_STRUCTURE: Record<Subject, TopicGroup[]> = {
  [Subject.MARATHI]: [
    {
      category: "१. वर्णविचार (Phonology & Alphabet)",
      topics: [
        "मराठी वर्णमाला: स्वर, स्वरादी, व्यंजन",
        "वर्णांचे उच्चारस्थान",
        "संधी: स्वरसंधी नियमावली",
        "संधी: व्यंजनसंधी व विसर्गसंधी"
      ]
    },
    {
      category: "२. नाम व नामाचे विकार (Nouns)",
      topics: [
        "नाम: प्रकार (सामान्य, विशेष, भाववाचक)",
        "लिंग विचार: नियम व अपवाद",
        "विभक्ती: प्रत्यय व कारकार्थ"
      ]
    }
  ],
  [Subject.ENGLISH]: [
    {
      category: "1. Fundamentals & Parts of Speech",
      topics: [
        "Articles: A, An, The (Specific Rules)",
        "Nouns: Countable/Uncountable Traps",
        "Pronouns: Relative Pronouns Rules"
      ]
    }
  ],
  [Subject.GS]: [
    {
      category: "Polity & Constitution (राज्यशास्त्र)",
      topics: [
        "Preamble & Fundamental Rights",
        "Parliament: President, Lok Sabha, Rajya Sabha",
        "Panchayat Raj Amendments"
      ]
    }
  ]
};

// Fuzzy search helper for better topic matching
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

export const StudyMode: React.FC<StudyModeProps> = ({ initialSubject = Subject.MARATHI, onBack, onNavigateToQuiz }) => {
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState<string>('');
  const [fromCache, setFromCache] = useState(false);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [activeTab, setActiveTab] = useState<'search' | 'rules'>('search');
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [ruleExplanations, setRuleExplanations] = useState<Record<string, { data: RuleExplanation, fromCache: boolean }>>({});
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [ruleFilter, setRuleFilter] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [viewedTopics, setViewedTopics] = useState<string[]>([]);

  useEffect(() => {
    const progress = getProgress();
    setViewedTopics(progress.studyTopicsViewed || []);
  }, []);

  const generateNotes = async (topicToUse: string) => {
    if (!topicToUse.trim()) return;
    setStatus('loading');
    setTopic(topicToUse);
    try {
      const result = await generateStudyNotes(subject, topicToUse);
      setNotes(result.data);
      setFromCache(result.fromCache);
      setStatus('success');
      markTopicViewed(topicToUse);
      const progress = getProgress();
      setIsSaved(progress.bookmarks.notes.some(n => n.topic === topicToUse));
    } catch (error) { setStatus('error'); }
  };

  const handleSaveNotes = () => {
    if (!notes || !topic) return;
    const note: SavedNote = { id: Date.now().toString(), subject, topic, content: notes, createdAt: new Date().toISOString() };
    saveNote(note);
    setIsSaved(true);
  };

  const toggleRule = async (rule: string) => {
    if (expandedRule === rule) { setExpandedRule(null); return; }
    setExpandedRule(rule);
    markTopicViewed(rule);
    if (!ruleExplanations[rule]) {
      setLoadingExplanation(true);
      try {
        const result = await generateConciseExplanation(subject, rule);
        setRuleExplanations(prev => ({ ...prev, [rule]: result }));
      } catch (e) { console.error(e); } finally { setLoadingExplanation(false); }
    }
  };

  const filteredStructure = useMemo(() => {
    const filter = ruleFilter.toLowerCase();
    const groups = GRAMMAR_STRUCTURE[subject] || [];
    if (!filter) return groups;
    return groups.map(group => ({
      ...group,
      topics: group.topics.filter(t => t.toLowerCase().includes(filter))
    })).filter(g => g.topics.length > 0);
  }, [subject, ruleFilter]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 font-bold">
        <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 bg-indigo-600 text-white">
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <Book size={32} className="text-yellow-400" /> AI Study Library
          </h2>
          <p className="text-indigo-100 font-medium">Smart syllabus analysis powered by Gemini AI.</p>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50">
          <button onClick={() => setActiveTab('search')} className={`flex-1 py-4 text-sm font-black flex items-center justify-center gap-2 border-b-4 transition-all ${activeTab === 'search' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
            <Search size={18} /> SEARCH TOPIC
          </button>
          <button onClick={() => setActiveTab('rules')} className={`flex-1 py-4 text-sm font-black flex items-center justify-center gap-2 border-b-4 transition-all ${activeTab === 'rules' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
            <ListFilter size={18} /> BROWSE SYLLABUS
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'search' ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  placeholder="Enter MPSC topic (e.g. Fundamental Rights)..."
                  className="flex-1 rounded-2xl border-slate-200 border-2 p-4 focus:border-indigo-500 outline-none font-bold"
                />
                <button 
                  onClick={() => generateNotes(topic)}
                  disabled={status === 'loading' || !topic.trim()}
                  className="bg-indigo-600 text-white px-8 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200"
                >
                  {status === 'loading' ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input 
                type="text" 
                value={ruleFilter} 
                onChange={(e) => setRuleFilter(e.target.value)} 
                placeholder="Filter topics..."
                className="w-full rounded-xl border-slate-100 border-2 p-3 bg-slate-50 text-sm font-bold outline-none"
              />
              <div className="space-y-3">
                {filteredStructure.map((group, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden">
                    <button 
                      onClick={() => setOpenCategories(prev => ({...prev, [group.category]: !prev[group.category]}))}
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 font-bold text-slate-700">
                        <Folder className="text-indigo-500" size={20} /> {group.category}
                      </div>
                      <ChevronDown size={20} className={openCategories[group.category] ? 'rotate-180' : ''} />
                    </button>
                    {openCategories[group.category] && (
                      <div className="p-2 bg-slate-50 space-y-1">
                        {group.topics.map((t, tIdx) => (
                          <button 
                            key={tIdx} 
                            onClick={() => toggleRule(t)}
                            className="w-full text-left p-3 rounded-xl hover:bg-white flex items-center justify-between text-sm font-bold text-slate-600"
                          >
                            <span className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${viewedTopics.includes(t) ? 'bg-emerald-500' : 'bg-slate-300'}`} /> {t}
                            </span>
                            <ChevronRight size={16} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {status === 'success' && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-2xl font-black text-indigo-900 flex items-center gap-3">
              <GraduationCap className="text-yellow-500" /> {topic}
            </h3>
            <div className="flex gap-3">
              <button onClick={handleSaveNotes} className={`p-4 rounded-2xl transition-all ${isSaved ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-indigo-600 border border-slate-200'}`}>
                {isSaved ? <Check size={24} /> : <Save size={24} />}
              </button>
            </div>
          </div>
          <div className="p-10 prose prose-indigo max-w-none font-medium text-slate-700 leading-relaxed">
            <ReactMarkdown>{notes}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

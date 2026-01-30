import React, { useState } from 'react';
import { Subject, LoadingState } from '../types';
import { generateStudyNotes, generateConciseExplanation } from '../services/gemini';
import { Book, Send, Loader2, ArrowLeft, Lightbulb, Search, ListFilter, GraduationCap, ChevronDown, ChevronUp, ArrowRight, Save, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StudyModeProps {
  initialSubject?: Subject;
  onBack: () => void;
}

const GRAMMAR_TOPICS: Record<Subject, string[]> = {
  [Subject.MARATHI]: [
    "संधी (Sandhi) - नियम व प्रकार",
    "समास (Samas) - प्रकार व उदाहरणे",
    "प्रयोग (Prayog) - कर्तरी, कर्मणी, भावे",
    "अलंकार (Alankar) - मुख्य प्रकार",
    "शब्दसिद्धी (Shabdasiddhi) - तत्सम, तद्भव, देशी",
    "वाक्यरुपांतर (Sentence Transformation)",
    "विभक्ती (Vibhakti) - कारकार्थ",
    "वृत्ते (Vrutte) - गण व मात्रा"
  ],
  [Subject.ENGLISH]: [
    "Articles - Definite & Indefinite Rules",
    "Tenses - MPSC Exam Rules",
    "Active & Passive Voice Transformation",
    "Direct & Indirect Speech Rules",
    "Degrees of Comparison",
    "Question Tags - Rules & Exceptions",
    "Prepositions - Important Fixed Prepositions",
    "Modal Auxiliaries"
  ],
  [Subject.GS]: [
    "Maharashtra: Social Reformers",
    "Indian Constitution: Fundamental Rights",
    "Geography: Maharashtra River Systems",
    "Polity: Panchayat Raj Institutions",
    "History: 1857 Revolt in Maharashtra",
    "Economy: RBI Functions"
  ]
};

export const StudyMode: React.FC<StudyModeProps> = ({ initialSubject = Subject.MARATHI, onBack }) => {
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [activeTab, setActiveTab] = useState<'search' | 'rules'>('search');

  // Logic for expandable rules
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [ruleExplanations, setRuleExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  
  // Logic for saving notes
  const [isSaved, setIsSaved] = useState(false);

  const generateNotes = async (topicToUse: string) => {
    if (!topicToUse.trim()) return;

    setStatus('loading');
    setNotes('');
    setTopic(topicToUse);
    setIsSaved(false); // Reset saved state for new content
    
    // Reset manual search field if triggered from rules
    if (activeTab === 'rules') {
         // keep tab on rules? or switch? keeping on rules allows checking more rules.
         // But we need to show the notes. Let's scroll down or just render them.
    }

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

    // If explanation not cached, fetch it
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
      localStorage.setItem('mpsc_saved_notes', JSON.stringify([newNote, ...existingNotes]));
      
      setIsSaved(true);
      // Reset the saved indicator after 2 seconds
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save note", e);
      alert("Failed to save note. Storage might be full.");
    }
  };

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

          {/* Subject Selector - Always visible */}
           <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Subject</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(Subject).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                        setSubject(s);
                        setExpandedRule(null);
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
                <p className="text-xs text-slate-500 mt-2">
                  Tip: Be specific. Try "Rules of Active Voice" instead of just "Voice".
                </p>
              </div>
            </form>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-4 text-indigo-800 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                 <Lightbulb size={20} className="shrink-0" />
                 <span className="text-sm font-medium">Click on any rule to see a quick explanation.</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                {GRAMMAR_TOPICS[subject]?.map((ruleItem, idx) => (
                   <div 
                        key={idx} 
                        className={`bg-white border rounded-lg transition-all overflow-hidden ${
                            expandedRule === ruleItem 
                            ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500 md:row-span-2' 
                            : 'border-slate-200 hover:border-indigo-300'
                        }`}
                   >
                    <button
                        onClick={() => toggleRule(ruleItem)}
                        className="w-full text-left p-3 flex items-center justify-between"
                    >
                        <span className={`font-medium transition-colors ${expandedRule === ruleItem ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {ruleItem}
                        </span>
                        {expandedRule === ruleItem ? <ChevronUp size={16} className="text-indigo-600 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                    </button>
                    
                    {expandedRule === ruleItem && (
                        <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                            {loadingExplanation && !ruleExplanations[ruleItem] ? (
                                <div className="flex items-center text-sm text-slate-500 py-4 justify-center bg-slate-50 rounded">
                                    <Loader2 size={16} className="animate-spin mr-2"/>
                                    Generating concise explanation...
                                </div>
                            ) : (
                                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100 mb-3 leading-relaxed">
                                    <ReactMarkdown>{ruleExplanations[ruleItem] || ''}</ReactMarkdown>
                                </div>
                            )}
                            
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    generateNotes(ruleItem);
                                }}
                                className="w-full text-xs flex items-center justify-center text-indigo-600 font-semibold hover:bg-indigo-50 py-2 rounded transition-colors"
                            >
                                Generate Detailed Study Notes <ArrowRight size={12} className="ml-1"/>
                            </button>
                        </div>
                    )}
                </div>
                ))}
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
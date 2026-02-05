import React, { useState, useEffect, useMemo } from 'react';
import { Subject, LoadingState, QuizQuestion, ExamType, GSSubCategory } from '../types';
import { generatePYQs } from '../services/gemini';
import { Loader2, ArrowLeft, Bookmark, ShieldCheck, Database, Layers, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PYQModeProps {
  initialExamType?: ExamType;
  onBack: () => void;
}

type YearFilter = 'ALL_YEARS' | string;

type PYQQuestionWithYear = QuizQuestion & {
  year: string;
  uid: string;
};

const YEARS = Array.from({ length: 16 }, (_, i) => (2025 - i).toString());

const GS_SECTIONS: { label: string; value: GSSubCategory }[] = [
  { label: 'All GS (Mix)', value: 'ALL' },
  { label: 'History (इतिहास)', value: 'HISTORY' },
  { label: 'Polity (राज्यशास्त्र)', value: 'POLITY' },
  { label: 'Geography (भूगोल)', value: 'GEOGRAPHY' },
  { label: 'Economics (अर्थशास्त्र)', value: 'ECONOMICS' },
  { label: 'Science (विज्ञान)', value: 'SCIENCE' },
  { label: 'Environment (पर्यावरण)', value: 'ENVIRONMENT' },
];

const CATEGORY_LABELS: Record<Exclude<GSSubCategory, 'ALL'>, string> = {
  HISTORY: 'History (इतिहास)',
  POLITY: 'Polity (राज्यशास्त्र)',
  GEOGRAPHY: 'Geography (भूगोल)',
  ECONOMICS: 'Economics (अर्थशास्त्र)',
  SCIENCE: 'Science (विज्ञान)',
  ENVIRONMENT: 'Environment (पर्यावरण)',
};

const CATEGORY_KEYWORDS: Record<Exclude<GSSubCategory, 'ALL'>, string[]> = {
  HISTORY: ['history', 'इतिहास', 'medieval', 'ancient', 'modern', 'freedom movement'],
  POLITY: ['polity', 'राज्यशास्त्र', 'constitution', 'संविधान', 'governance', 'parliament'],
  GEOGRAPHY: ['geography', 'भूगोल', 'climate', 'river', 'soil', 'plateau'],
  ECONOMICS: ['economics', 'अर्थशास्त्र', 'gdp', 'inflation', 'budget', 'fiscal'],
  SCIENCE: ['science', 'विज्ञान', 'physics', 'chemistry', 'biology', 'technology'],
  ENVIRONMENT: ['environment', 'पर्यावरण', 'ecology', 'biodiversity', 'climate change', 'pollution'],
};

const normalizeCategory = (question: QuizQuestion): GSSubCategory => {
  const sourceText = `${question.subCategory || ''} ${question.question} ${question.explanation || ''}`.toLowerCase();

  const directMatch = (Object.keys(CATEGORY_LABELS) as Array<Exclude<GSSubCategory, 'ALL'>>).find((key) =>
    sourceText.includes(key.toLowerCase()),
  );

  if (directMatch) return directMatch;

  const keywordMatch = (Object.entries(CATEGORY_KEYWORDS) as Array<[Exclude<GSSubCategory, 'ALL'>, string[]]>).find(([, keywords]) =>
    keywords.some((kw) => sourceText.includes(kw)),
  );

  return keywordMatch ? keywordMatch[0] : 'ALL';
};

export const PYQMode: React.FC<PYQModeProps> = ({ initialExamType = 'ALL', onBack }) => {
  const [selectedYear, setSelectedYear] = useState<YearFilter>('ALL_YEARS');
  const [examType, setExamType] = useState<ExamType>(initialExamType);
  const [gsCategory, setGsCategory] = useState<GSSubCategory>('ALL');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [questions, setQuestions] = useState<PYQQuestionWithYear[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<QuizQuestion[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('mpsc_pyq_bookmarks');
    if (saved) setBookmarks(JSON.parse(saved));
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setStatus('loading');
    try {
      const yearsToLoad = selectedYear === 'ALL_YEARS' ? YEARS : [selectedYear];

      const results = await Promise.all(
        yearsToLoad.map(async (year) => {
          const result = await generatePYQs(Subject.GS, year, examType, gsCategory);
          const withYear: PYQQuestionWithYear[] = result.data.map((q, idx) => ({
            ...q,
            year,
            uid: `${year}-${idx}-${q.question.slice(0, 40)}`,
          }));

          return {
            data: withYear,
            fromCache: result.fromCache,
          };
        }),
      );

      const merged = results.flatMap((r) => r.data);
      const sorted = merged.sort((a, b) => Number(b.year) - Number(a.year));

      setQuestions(sorted);
      setFromCache(results.every((r) => r.fromCache));
      setRevealedAnswers([]);
      setStatus('success');
    } catch (e) {
      setStatus('error');
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedAnswers((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleBookmark = (q: QuizQuestion) => {
    const exists = bookmarks.some((b) => b.question === q.question);
    const newBookmarks = exists ? bookmarks.filter((b) => b.question !== q.question) : [...bookmarks, q];
    setBookmarks(newBookmarks);
    localStorage.setItem('mpsc_pyq_bookmarks', JSON.stringify(newBookmarks));
  };

  const groupedQuestions = useMemo(() => {
    const keyword = searchKeyword.toLowerCase();
    const filteredBySearch = questions.filter((q) => q.question.toLowerCase().includes(keyword));

    const sectionMap = new Map<GSSubCategory, PYQQuestionWithYear[]>();

    filteredBySearch.forEach((question) => {
      const category = normalizeCategory(question);
      const finalCategory = gsCategory === 'ALL' ? category : gsCategory;

      if (gsCategory !== 'ALL' && category !== 'ALL' && category !== gsCategory) {
        return;
      }

      const existing = sectionMap.get(finalCategory) || [];
      existing.push(question);
      sectionMap.set(finalCategory, existing);
    });

    if (gsCategory !== 'ALL' && !sectionMap.has(gsCategory)) {
      sectionMap.set(gsCategory, []);
    }

    const order: GSSubCategory[] = gsCategory === 'ALL'
      ? ['HISTORY', 'POLITY', 'GEOGRAPHY', 'ECONOMICS', 'SCIENCE', 'ENVIRONMENT', 'ALL']
      : [gsCategory];

    return order
      .filter((category) => sectionMap.has(category))
      .map((category) => {
        const items = sectionMap.get(category) || [];
        const byYear = new Map<string, PYQQuestionWithYear[]>();

        items.forEach((q) => {
          const current = byYear.get(q.year) || [];
          current.push(q);
          byYear.set(q.year, current);
        });

        const yearGroups = [...byYear.entries()]
          .sort((a, b) => Number(b[0]) - Number(a[0]))
          .map(([year, yearItems]) => ({ year, items: yearItems }));

        return {
          category,
          label: category === 'ALL' ? 'Other / Mixed GS' : CATEGORY_LABELS[category],
          items,
          yearGroups,
        };
      });
  }, [questions, searchKeyword, gsCategory]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1 flex items-center">
              <ShieldCheck className="mr-2 text-indigo-600" />
              GS PYQ Archive (2010-2025)
            </h2>
            <p className="text-slate-600 text-sm font-medium">Year-wise section view available for 2010 to 2025.</p>
          </div>
          {fromCache && (
            <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-lg border border-emerald-400 animate-pulse">
              <Database size={12} /> DATA SOURCE: LOCAL BANK
            </div>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white items-end">
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="rounded-lg border-slate-300 border p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500">
            <option value="ALL_YEARS">All Years (2010-2025)</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={examType} onChange={(e) => setExamType(e.target.value as ExamType)} className="rounded-lg border-slate-300 border p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500"><option value="RAJYASEVA">Rajyaseva</option><option value="GROUP_B">Combined B</option><option value="GROUP_C">Combined C</option></select>
          <select value={gsCategory} onChange={(e) => setGsCategory(e.target.value as GSSubCategory)} className="rounded-lg border-slate-300 border p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500">{GS_SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
          <button onClick={fetchQuestions} className="bg-indigo-600 text-white p-2.5 rounded-lg font-bold shadow-md hover:bg-indigo-700">Fetch Archive</button>
        </div>
      </div>

      {status === 'loading' && <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-100"><Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" /><p className="text-slate-600 font-bold">Loading year-wise archives...</p></div>}

      {status === 'success' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-indigo-800 font-bold text-sm">{questions.length} Items Found</span>
            <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="Filter results..." className="w-64 py-2 px-3 border border-slate-200 rounded-lg text-sm" />
          </div>

          {groupedQuestions.map((group) => (
            <div key={group.category} className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <h3 className="font-black text-indigo-900 flex items-center gap-2"><Layers size={16} /> {group.label}</h3>
                <span className="text-xs font-bold text-indigo-700">{group.items.length} questions</span>
              </div>

              {group.items.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-5 text-sm text-slate-500">No questions available in this section for selected filters.</div>
              ) : (
                group.yearGroups.map((yearGroup) => (
                  <div key={`${group.category}-${yearGroup.year}`} className="space-y-3">
                    <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 flex items-center justify-between">
                      <h4 className="font-bold text-slate-700 flex items-center gap-2"><Calendar size={14} /> Year {yearGroup.year}</h4>
                      <span className="text-xs font-bold text-slate-600">{yearGroup.items.length} questions</span>
                    </div>

                    {yearGroup.items.map((q, idx) => (
                      <div key={q.uid} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-4">
                            <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0">{idx + 1}</span>
                            <p className="text-lg text-slate-900 font-bold leading-relaxed">{q.question}</p>
                          </div>
                          <button onClick={() => toggleBookmark(q)} className={bookmarks.some((b) => b.question === q.question) ? 'text-pink-500' : 'text-slate-300'}><Bookmark size={20} fill={bookmarks.some((b) => b.question === q.question) ? 'currentColor' : 'none'} /></button>
                        </div>
                        <div className="ml-12 grid md:grid-cols-2 gap-3 mb-6">
                          {q.options.map((opt, oIdx) => <div key={oIdx} className="p-3 border border-slate-200 rounded-lg text-slate-700 text-sm bg-slate-50/50">({String.fromCharCode(65 + oIdx)}) {opt}</div>)}
                        </div>
                        <div className="ml-12">
                          <button onClick={() => toggleReveal(q.uid)} className="px-5 py-2.5 rounded-lg text-sm font-bold bg-indigo-50 text-indigo-700">{revealedAnswers.includes(q.uid) ? 'Hide Analysis' : 'Show Answer'}</button>
                          {revealedAnswers.includes(q.uid) && (
                            <div className="mt-4 bg-slate-50 p-5 rounded-lg border border-slate-200"><ReactMarkdown>{q.explanation}</ReactMarkdown></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

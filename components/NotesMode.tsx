import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookText, Download, Search } from 'lucide-react';
import { ExamType, NoteResource, Subject } from '../types';
import { QUICK_NOTES_LIBRARY } from '../services/localData';

interface NotesModeProps {
  onBack: () => void;
}

const examTypeLabel: Record<ExamType | 'ALL', string> = {
  ALL: 'All Exams',
  RAJYASEVA: 'Rajyaseva',
  GROUP_B: 'Group B',
  GROUP_C: 'Group C',
};

const downloadNotes = (note: NoteResource) => {
  const content = `${note.title}\n\nExam: ${note.examType}\nSubject: ${note.subject}\nLanguage: ${note.language}\nUpdated: ${note.updatedOn}\n\n${note.notes}`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${note.title.replace(/\s+/g, '_').toLowerCase()}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

export const NotesMode: React.FC<NotesModeProps> = ({ onBack }) => {
  const [selectedExam, setSelectedExam] = useState<ExamType | 'ALL'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'General' | 'ALL'>('ALL');
  const [query, setQuery] = useState('');

  const filteredNotes = useMemo(() => {
    return QUICK_NOTES_LIBRARY.filter((note) => {
      const examPass = selectedExam === 'ALL' || note.examType === selectedExam;
      const subjectPass = selectedSubject === 'ALL' || note.subject === selectedSubject;
      const queryPass =
        query.trim().length === 0 ||
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

      return examPass && subjectPass && queryPass;
    });
  }, [query, selectedExam, selectedSubject]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl shadow-md border border-indigo-100 overflow-hidden">
        <div className="p-6 bg-indigo-50 border-b border-indigo-100">
          <h2 className="text-2xl font-bold text-indigo-900 mb-2 flex items-center gap-2">
            <BookText className="text-indigo-600" /> MPSC Notes Bank (PYQ + Topic Notes)
          </h2>
          <p className="text-slate-600 text-sm">Short revision notes for Rajyaseva, Group B, and Group C exams.</p>
        </div>

        <div className="p-6 grid md:grid-cols-4 gap-4 items-center">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by topic or keyword..."
              className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value as ExamType | 'ALL')}
            className="rounded-lg border border-slate-300 p-2.5 text-sm font-semibold"
          >
            {Object.entries(examTypeLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as Subject | 'General' | 'ALL')}
            className="rounded-lg border border-slate-300 p-2.5 text-sm font-semibold"
          >
            <option value="ALL">All Subjects</option>
            <option value="Marathi">Marathi</option>
            <option value="English">English</option>
            <option value="General Studies">General Studies</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {filteredNotes.map((note) => (
          <article key={note.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-bold text-slate-900 text-lg leading-tight">{note.title}</h3>
              <button
                onClick={() => downloadNotes(note)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                <Download size={13} /> TXT
              </button>
            </div>

            <p className="text-slate-600 text-sm mb-4">{note.description}</p>

            <div className="flex flex-wrap gap-2 mb-4 text-xs">
              <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">{note.examType}</span>
              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{note.subject}</span>
              <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">{note.language}</span>
            </div>

            <pre className="whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm text-slate-700 leading-relaxed">
              {note.notes}
            </pre>
            <p className="text-xs text-slate-400 mt-3">Updated: {note.updatedOn}</p>
          </article>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center text-slate-500">
          No notes matched your filters. Try another keyword or exam type.
        </div>
      )}
    </div>
  );
};

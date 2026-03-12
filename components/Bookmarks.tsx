// Bookmark utility — localStorage based
export interface Bookmark {
  id: number;
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
  subject?: string;
  exam_name?: string;
  year?: number;
  tableName: string;
  savedAt: string;
}

const BOOKMARK_KEY = 'mpsc_bookmarks';

export function getBookmarks(): Bookmark[] {
  try { const r = localStorage.getItem(BOOKMARK_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}

export function isBookmarked(id: number): boolean {
  return getBookmarks().some(b => b.id === id);
}

export function addBookmark(item: Omit<Bookmark, 'savedAt'>): void {
  const list = getBookmarks().filter(b => b.id !== item.id);
  list.unshift({ ...item, savedAt: new Date().toISOString() });
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list.slice(0, 200))); // max 200
}

export function removeBookmark(id: number): void {
  const list = getBookmarks().filter(b => b.id !== id);
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list));
}

export function toggleBookmark(item: Omit<Bookmark, 'savedAt'>): boolean {
  if (isBookmarked(item.id)) { removeBookmark(item.id); return false; }
  addBookmark(item); return true;
}

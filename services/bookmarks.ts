import { supabase } from '../lib/supabase';

export const toggleBookmark = async (userId: string, questionId: string) => {
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .single();

  if (existing) {
    return await supabase.from('bookmarks').delete().eq('id', existing.id);
  } else {
    return await supabase.from('bookmarks').insert({ user_id: userId, question_id: questionId });
  }
};

export const getBookmarks = async (userId: string) => {
  return await supabase.from('bookmarks').select('*').eq('user_id', userId);
};

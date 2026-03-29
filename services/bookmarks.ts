import { supabase } from '../lib/supabase';

// बुकमार्कचा डेटा टाईप (Interface) - जो तुमच्या UI ला हवा आहे
export interface Bookmark {
  id: number;
  user_id: string;
  question_id: string;
  created_at?: string;
  // जर तुम्ही प्रश्नाचा डेटा 'bookmarks' टेबलमध्येच स्टोअर करत असाल तर खालील फील्ड्स वापरा
  question?: string;
  options?: string[];
  correct_answer_index?: number;
  explanation?: string;
  savedAt: string;
}

// १. बुकमार्क काढण्यासाठी (हे फंक्शन तुमच्या बिल्ड एररसाठी हवे आहे)
export const removeBookmark = async (id: number) => {
  const { data, error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return data;
};

// २. बुकमार्क लावणे किंवा काढणे (Toggle)
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
    return await supabase.from('bookmarks').insert({ 
        user_id: userId, 
        question_id: questionId,
        savedAt: new Date().toISOString() 
    });
  }
};

// ३. सर्व बुकमार्क्स मिळवण्यासाठी
export const getBookmarks = async (userId: string) => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching bookmarks:", error);
    return [];
  }
  return data as Bookmark[];
};

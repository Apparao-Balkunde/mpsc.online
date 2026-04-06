import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL/Key missing! Check .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * युजरचा लाईव्ह रँक मोजण्यासाठी फंक्शन
 * @param currentCorrect - युजरने आतापर्यंत बरोबर सोडवलेले एकूण प्रश्न
 */
export const getLiveRank = async (currentCorrect: number) => {
  try {
    // १. ज्यांचे 'total_correct' तुझ्यापेक्षा जास्त आहेत त्यांना मोजा
    const { count, error } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .gt('total_correct', currentCorrect);

    if (error) throw error;

    // २. एकूण किती विद्यार्थी आहेत ते मोजा (तुलनेसाठी)
    const { count: totalCount, error: err2 } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true });

    if (err2) throw err2;
    
    return {
      rank: (count || 0) + 1, // रँक = तुझ्या पुढचे लोक + १
      total: totalCount || 0
    };
  } catch (err: any) {
    console.error("Rank Error:", err.message);
    return { rank: '-', total: '-' };
  }
};

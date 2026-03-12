-- ============================================================
-- MPSC सारथी — Supabase SQL Functions & Policies
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. get_random_mock_questions — SpardhaYodha + MockTest साठी
CREATE OR REPLACE FUNCTION get_random_mock_questions(
  exam_filter TEXT DEFAULT 'Rajyaseva',
  row_limit   INT  DEFAULT 10
)
RETURNS TABLE (
  id                   BIGINT,
  question             TEXT,
  options              JSONB,
  correct_answer_index INT,
  explanation          TEXT,
  subject              TEXT,
  exam_name            TEXT,
  year                 INT
) LANGUAGE sql STABLE AS $$
  SELECT
    id, question, options, correct_answer_index,
    explanation, subject, exam_name, year
  FROM prelims_questions
  WHERE exam_name = exam_filter
  ORDER BY random()
  LIMIT row_limit;
$$;

-- 2. get_random_saralseva — Saralseva speed round साठी
CREATE OR REPLACE FUNCTION get_random_saralseva(
  pattern_filter TEXT DEFAULT 'TCS',
  row_limit      INT  DEFAULT 10
)
RETURNS TABLE (
  id                   BIGINT,
  question             TEXT,
  options              JSONB,
  correct_answer_index INT,
  explanation          TEXT,
  subject              TEXT
) LANGUAGE sql STABLE AS $$
  SELECT id, question, options, correct_answer_index, explanation, subject
  FROM saralseva_questions
  WHERE exam_name = pattern_filter
  ORDER BY random()
  LIMIT row_limit;
$$;

-- 3. get_daily_questions — Daily practice set (subject-balanced)
CREATE OR REPLACE FUNCTION get_daily_questions(
  question_count INT DEFAULT 20
)
RETURNS TABLE (
  id                   BIGINT,
  question             TEXT,
  options              JSONB,
  correct_answer_index INT,
  explanation          TEXT,
  subject              TEXT,
  exam_name            TEXT
) LANGUAGE sql STABLE AS $$
  WITH subjects AS (
    SELECT DISTINCT subject FROM prelims_questions WHERE subject IS NOT NULL
  ),
  per_subject AS (
    SELECT
      p.id, p.question, p.options, p.correct_answer_index,
      p.explanation, p.subject, p.exam_name,
      ROW_NUMBER() OVER (PARTITION BY p.subject ORDER BY random()) as rn
    FROM prelims_questions p
  )
  SELECT id, question, options, correct_answer_index, explanation, subject, exam_name
  FROM per_subject
  WHERE rn <= CEIL(question_count::float / (SELECT COUNT(*) FROM subjects))
  ORDER BY random()
  LIMIT question_count;
$$;

-- 4. get_user_leaderboard — Top scorers (if you add user auth later)
-- Placeholder table for leaderboard (localStorage-based for now)
-- CREATE TABLE IF NOT EXISTS leaderboard (
--   id         BIGSERIAL PRIMARY KEY,
--   username   TEXT NOT NULL,
--   score      INT  NOT NULL,
--   total      INT  NOT NULL,
--   rank_title TEXT,
--   exam_type  TEXT,
--   played_at  TIMESTAMPTZ DEFAULT NOW()
-- );

-- ============================================================
-- ROW LEVEL SECURITY — Public read on all question tables
-- ============================================================
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'prelims_questions', 'mains_questions', 'mock_questions',
    'saralseva_questions', 'current_affairs', 'vocab_questions', 'literature_questions'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS "Public read %1$I"
      ON %1$I FOR SELECT USING (true)
    ', t);
  END LOOP;
END $$;

-- ============================================================
-- INDEXES — Fast filtering queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_prelims_exam    ON prelims_questions(exam_name);
CREATE INDEX IF NOT EXISTS idx_prelims_subject ON prelims_questions(subject);
CREATE INDEX IF NOT EXISTS idx_prelims_year    ON prelims_questions(year);

CREATE INDEX IF NOT EXISTS idx_mains_exam      ON mains_questions(exam_name);
CREATE INDEX IF NOT EXISTS idx_mains_subject   ON mains_questions(subject);

CREATE INDEX IF NOT EXISTS idx_saralseva_exam  ON saralseva_questions(exam_name);
CREATE INDEX IF NOT EXISTS idx_saralseva_subj  ON saralseva_questions(subject);

CREATE INDEX IF NOT EXISTS idx_vocab_lang      ON vocab_questions(language);
CREATE INDEX IF NOT EXISTS idx_vocab_cat       ON vocab_questions(category);

CREATE INDEX IF NOT EXISTS idx_ca_year        ON current_affairs(year);

-- ============================================================
-- HELPER: Count questions per table
-- ============================================================
CREATE OR REPLACE VIEW question_counts AS
SELECT
  'prelims_questions'    AS table_name, COUNT(*) AS total FROM prelims_questions
UNION ALL SELECT 'mains_questions',        COUNT(*) FROM mains_questions
UNION ALL SELECT 'mock_questions',          COUNT(*) FROM mock_questions
UNION ALL SELECT 'saralseva_questions',     COUNT(*) FROM saralseva_questions
UNION ALL SELECT 'current_affairs',         COUNT(*) FROM current_affairs
UNION ALL SELECT 'vocab_questions',         COUNT(*) FROM vocab_questions
UNION ALL SELECT 'literature_questions',    COUNT(*) FROM literature_questions;

-- Quick check: SELECT * FROM question_counts;

-- ============================================================
-- USER PROGRESS TABLE (for Auth + Cloud Sync + Leaderboard)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_progress (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT,
  display_name     TEXT,
  avatar_url       TEXT,
  total_attempted  INT     DEFAULT 0,
  total_correct    INT     DEFAULT 0,
  streak           INT     DEFAULT 0,
  last_active      TEXT,
  daily_history    JSONB   DEFAULT '[]',
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can read all (leaderboard), but only write their own
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read leaderboard"
  ON user_progress FOR SELECT USING (true);

CREATE POLICY "Users insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_up_correct    ON user_progress(total_correct DESC);
CREATE INDEX IF NOT EXISTS idx_up_attempted  ON user_progress(total_attempted DESC);
CREATE INDEX IF NOT EXISTS idx_up_streak     ON user_progress(streak DESC);

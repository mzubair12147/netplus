-- ============================================================
-- NetPulse Sprint 3 — Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add monitor_type and keyword columns to monitors table
ALTER TABLE monitors
  ADD COLUMN IF NOT EXISTS monitor_type text NOT NULL DEFAULT 'http'
    CHECK (monitor_type IN ('http', 'keyword')),
  ADD COLUMN IF NOT EXISTS keyword text DEFAULT NULL;

-- 2. API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_prefix text NOT NULL,           -- first 8 chars shown to user (e.g. "np_Jf7k")
  hashed_key text NOT NULL UNIQUE,    -- SHA-256 of the full key
  last_used_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hashed ON api_keys (hashed_key);

-- RLS for api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own api_keys"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id);

-- 3. Status page settings — stored in user metadata (no new table needed)
--    Company name and description are saved via supabase.auth.updateUser({ data: { ... } })
--    No migration needed for this one.

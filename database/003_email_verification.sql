-- ============================================================
-- 003_email_verification.sql
-- Adds email verification columns to the users table.
-- Run in Supabase SQL Editor after 002_simple_auth.sql.
-- ============================================================

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS is_verified              BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verification_token       TEXT,
    ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;

-- Index so token lookups are fast
CREATE INDEX IF NOT EXISTS idx_users_verification_token
    ON public.users(verification_token)
    WHERE verification_token IS NOT NULL;

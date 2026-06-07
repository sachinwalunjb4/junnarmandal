-- ============================================================
-- 002_simple_auth.sql
-- Switch from Supabase Auth to self-managed users table.
-- Run this in the Supabase SQL Editor BEFORE starting the backend.
-- ============================================================

-- 1. Remove the Supabase Auth trigger (no longer needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Remove the foreign key linking users.id → auth.users.id
--    so we can manage our own UUIDs
ALTER TABLE public.users
    DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 3. Give the id column its own UUID default
ALTER TABLE public.users
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 4. Add name and password_hash columns
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS name          TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';

-- 5. Drop RLS policies that used auth.uid() (no longer applicable)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- 6. Since FastAPI handles auth, allow the service-role key full access.
--    (The backend only ever uses the service-role key for users table.)
CREATE POLICY "users_service_role_all" ON public.users
    FOR ALL
    USING (true)
    WITH CHECK (true);

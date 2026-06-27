-- Migration 004: Add single family contact to profiles

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS contact_name   TEXT,
    ADD COLUMN IF NOT EXISTS contact_type   TEXT CHECK (contact_type IN ('father','mother','brother','uncle','aunt')),
    ADD COLUMN IF NOT EXISTS contact_mobile TEXT;

-- ============================================================
-- Marathi Junnar Lagna Mandal – Initial Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS (shadow table for auth.users)
-- ============================================================
CREATE TABLE public.users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    phone       TEXT,
    is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Personal
    name             TEXT NOT NULL,
    gender           TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth    DATE NOT NULL,
    height_cm        INTEGER CHECK (height_cm BETWEEN 100 AND 250),
    marital_status   TEXT NOT NULL DEFAULT 'never_married'
                         CHECK (marital_status IN ('never_married','divorced','widowed','awaiting_divorce')),
    mother_tongue    TEXT NOT NULL DEFAULT 'Marathi',
    religion         TEXT NOT NULL DEFAULT 'Hindu',
    community        TEXT,
    city             TEXT,
    about_me         TEXT,

    -- Education & Career
    qualification    TEXT,
    profession       TEXT,
    annual_income    TEXT,

    -- Family
    family_type      TEXT CHECK (family_type IN ('joint','nuclear','extended')),
    father_occupation TEXT,
    mother_occupation TEXT,
    siblings_count   INTEGER NOT NULL DEFAULT 0,

    -- Admin / status
    is_approved      BOOLEAN NOT NULL DEFAULT FALSE,
    last_active      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PARTNER PREFERENCES
-- ============================================================
CREATE TABLE public.partner_preferences (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    min_age         INTEGER NOT NULL DEFAULT 18,
    max_age         INTEGER NOT NULL DEFAULT 50,
    min_height_cm   INTEGER,
    max_height_cm   INTEGER,
    religion        TEXT,
    community       TEXT,
    education       TEXT,
    location        TEXT,
    marital_status  TEXT[],        -- e.g. ARRAY['never_married','divorced']
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PHOTOS
-- ============================================================
CREATE TABLE public.photos (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    storage_path  TEXT NOT NULL,          -- path inside Supabase Storage bucket
    is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
    is_public     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INTERESTS (like / connection requests)
-- ============================================================
CREATE TABLE public.interests (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status       TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','accepted','declined')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT no_self_interest CHECK (sender_id <> receiver_id),
    UNIQUE (sender_id, receiver_id)
);

-- ============================================================
-- SHORTLISTS / FAVORITES
-- ============================================================
CREATE TABLE public.shortlists (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT no_self_shortlist CHECK (user_id <> target_id),
    UNIQUE (user_id, target_id)
);

-- ============================================================
-- BLOCKS
-- ============================================================
CREATE TABLE public.blocks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT no_self_block CHECK (user_id <> blocked_id),
    UNIQUE (user_id, blocked_id)
);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE public.reports (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reported_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason       TEXT NOT NULL,
    details      TEXT,
    status       TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','resolved','dismissed')),
    admin_note   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT no_self_report CHECK (reporter_id <> reported_id)
);

-- ============================================================
-- MESSAGES (only between mutually matched users)
-- ============================================================
CREATE TABLE public.messages (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    body         TEXT NOT NULL CHECK (length(trim(body)) > 0),
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT no_self_message CHECK (sender_id <> receiver_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_user_id       ON public.profiles(user_id);
CREATE INDEX idx_profiles_gender        ON public.profiles(gender);
CREATE INDEX idx_profiles_religion      ON public.profiles(religion);
CREATE INDEX idx_profiles_community     ON public.profiles(community);
CREATE INDEX idx_profiles_city          ON public.profiles(city);
CREATE INDEX idx_profiles_is_approved   ON public.profiles(is_approved);
CREATE INDEX idx_profiles_last_active   ON public.profiles(last_active DESC);
CREATE INDEX idx_profiles_dob           ON public.profiles(date_of_birth);

CREATE INDEX idx_interests_sender       ON public.interests(sender_id);
CREATE INDEX idx_interests_receiver     ON public.interests(receiver_id);
CREATE INDEX idx_interests_status       ON public.interests(status);

CREATE INDEX idx_messages_sender        ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver      ON public.messages(receiver_id);
CREATE INDEX idx_messages_created       ON public.messages(created_at DESC);

CREATE INDEX idx_photos_user_id         ON public.photos(user_id);
CREATE INDEX idx_shortlists_user_id     ON public.shortlists(user_id);
CREATE INDEX idx_blocks_user_id         ON public.blocks(user_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_preferences_updated_at
    BEFORE UPDATE ON public.partner_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_interests_updated_at
    BEFORE UPDATE ON public.interests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE USER ROW ON SIGNUP (Supabase auth hook)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.users (id, email, phone)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.phone
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlists         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_own"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own"   ON public.users FOR UPDATE USING (auth.uid() = id);

-- profiles – approved profiles visible to all authenticated users; own profile always visible
CREATE POLICY "profiles_select"    ON public.profiles FOR SELECT
    USING (is_approved = TRUE OR user_id = auth.uid());
CREATE POLICY "profiles_insert"    ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_update"    ON public.profiles FOR UPDATE USING (user_id = auth.uid());

-- partner_preferences
CREATE POLICY "prefs_all"          ON public.partner_preferences FOR ALL USING (user_id = auth.uid());

-- photos
CREATE POLICY "photos_select"      ON public.photos FOR SELECT
    USING (is_public = TRUE OR user_id = auth.uid());
CREATE POLICY "photos_manage"      ON public.photos FOR ALL USING (user_id = auth.uid());

-- interests
CREATE POLICY "interests_select"   ON public.interests FOR SELECT
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "interests_insert"   ON public.interests FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "interests_update"   ON public.interests FOR UPDATE USING (receiver_id = auth.uid());
CREATE POLICY "interests_delete"   ON public.interests FOR DELETE USING (sender_id = auth.uid());

-- shortlists
CREATE POLICY "shortlists_all"     ON public.shortlists FOR ALL USING (user_id = auth.uid());

-- blocks
CREATE POLICY "blocks_all"         ON public.blocks FOR ALL USING (user_id = auth.uid());

-- reports
CREATE POLICY "reports_insert"     ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_select"     ON public.reports FOR SELECT USING (reporter_id = auth.uid());

-- messages
CREATE POLICY "messages_select"    ON public.messages FOR SELECT
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "messages_insert"    ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- ============================================================
-- STORAGE BUCKET (run via Supabase Dashboard or API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', false);
--
-- Storage RLS policies must be created via the Supabase Dashboard
-- under Storage > Policies, or via the management API.

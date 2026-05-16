-- ============================================================
-- IBC Devocional — Schema inicial do Supabase (PostgreSQL)
-- Execute em: Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── church_access ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.church_access (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  access_code TEXT NOT NULL UNIQUE,
  church_name TEXT NOT NULL,
  logo_url    TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir dados da IBC
INSERT INTO public.church_access (access_code, church_name)
VALUES ('@igrejabatistaibc', 'Igreja Batista Canaã')
ON CONFLICT (access_code) DO NOTHING;

-- ─── admin_users ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── devotionals ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.devotionals (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                TEXT NOT NULL,
  bible_reference      TEXT NOT NULL,
  bible_text           TEXT,
  devotional_text      TEXT,
  final_prayer         TEXT,
  original_audio_url   TEXT,
  background_music_url TEXT,
  mixed_audio_url      TEXT,
  cover_image_url      TEXT,
  status               TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  publish_date         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  send_notification    BOOLEAN NOT NULL DEFAULT false,
  featured             BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_devotionals_status_publish ON public.devotionals (status, publish_date DESC);

-- ─── comments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  devotional_id  UUID NOT NULL REFERENCES public.devotionals(id) ON DELETE CASCADE,
  author_name    TEXT NOT NULL,
  comment_text   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'hidden')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at    TIMESTAMPTZ
);

CREATE INDEX idx_comments_devotional_status ON public.comments (devotional_id, status);

-- ─── reactions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  devotional_id   UUID NOT NULL REFERENCES public.devotionals(id) ON DELETE CASCADE,
  reaction_type   TEXT NOT NULL CHECK (reaction_type IN ('amen', 'edified')),
  device_id       TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (devotional_id, reaction_type, device_id)
);

-- ─── prayer_requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_name  TEXT NOT NULL,
  request_text TEXT NOT NULL,
  visibility   TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'prayed', 'answered')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── announcements ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  priority     TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  publish_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── push_subscriptions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint    TEXT NOT NULL UNIQUE,
  keys_auth   TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  user_agent  TEXT,
  device_id   TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── background_music ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.background_music (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  url              TEXT NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── notification_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  devotional_id UUID REFERENCES public.devotionals(id) ON DELETE SET NULL,
  total_sent    INT NOT NULL DEFAULT 0,
  total_failed  INT NOT NULL DEFAULT 0,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Functions ───────────────────────────────────────────────────────────────

-- Toggle reaction
CREATE OR REPLACE FUNCTION public.toggle_reaction(
  p_devotional_id UUID,
  p_reaction_type TEXT,
  p_device_id     TEXT
) RETURNS VOID AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.reactions
    WHERE devotional_id = p_devotional_id AND reaction_type = p_reaction_type AND device_id = p_device_id
  ) THEN
    DELETE FROM public.reactions
    WHERE devotional_id = p_devotional_id AND reaction_type = p_reaction_type AND device_id = p_device_id;
  ELSE
    INSERT INTO public.reactions (devotional_id, reaction_type, device_id)
    VALUES (p_devotional_id, p_reaction_type, p_device_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get reaction counts
CREATE OR REPLACE FUNCTION public.get_reaction_counts(p_devotional_id UUID)
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'amen',    COUNT(*) FILTER (WHERE reaction_type = 'amen'),
    'edified', COUNT(*) FILTER (WHERE reaction_type = 'edified')
  ) INTO result
  FROM public.reactions
  WHERE devotional_id = p_devotional_id;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify admin login
CREATE OR REPLACE FUNCTION public.verify_admin(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT password_hash INTO v_hash
  FROM public.admin_users
  WHERE username = p_username AND active = true;
  IF v_hash IS NULL THEN RETURN false; END IF;
  RETURN v_hash = crypt(p_password, v_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dashboard stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'devotionalToday',      EXISTS(SELECT 1 FROM public.devotionals WHERE status = 'published' AND publish_date::DATE = CURRENT_DATE),
    'totalDevotionals',     (SELECT COUNT(*) FROM public.devotionals WHERE status = 'published'),
    'pendingComments',      (SELECT COUNT(*) FROM public.comments WHERE status = 'pending'),
    'approvedComments',     (SELECT COUNT(*) FROM public.comments WHERE status = 'approved'),
    'pushSubscribers',      (SELECT COUNT(*) FROM public.push_subscriptions WHERE active = true),
    'lastNotificationSent', (SELECT MAX(sent_at) FROM public.notification_logs)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_devotionals_updated_at
  BEFORE UPDATE ON public.devotionals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.devotionals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users      ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "devotionals_public_read"  ON public.devotionals      FOR SELECT USING (status = 'published');
CREATE POLICY "comments_public_read"     ON public.comments          FOR SELECT USING (status = 'approved');
CREATE POLICY "reactions_public_read"    ON public.reactions         FOR SELECT USING (true);
CREATE POLICY "prayer_public_read"       ON public.prayer_requests   FOR SELECT USING (visibility = 'public' AND status = 'approved');
CREATE POLICY "announcements_public_read" ON public.announcements    FOR SELECT USING (status = 'active');

-- Insert policies (anon can insert)
CREATE POLICY "comments_insert"          ON public.comments          FOR INSERT WITH CHECK (true);
CREATE POLICY "reactions_insert"         ON public.reactions         FOR INSERT WITH CHECK (true);
CREATE POLICY "prayer_insert"            ON public.prayer_requests   FOR INSERT WITH CHECK (true);
CREATE POLICY "push_insert"              ON public.push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "push_update"              ON public.push_subscriptions FOR UPDATE USING (true);

-- ─── Storage Buckets (run separately in Supabase dashboard) ──────────────────
-- INSERT INTO storage.buckets (id, name, public) VALUES ('devotional-audio', 'devotional-audio', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('devotional-images', 'devotional-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('background-music', 'background-music', true);

-- ─── Create default admin user ───────────────────────────────────────────────
-- ATENÇÃO: troque 'senha_segura_aqui' pela senha desejada ANTES de executar!
-- INSERT INTO public.admin_users (username, password_hash, role)
-- VALUES ('admin', crypt('senha_segura_aqui', gen_salt('bf')), 'super_admin');

-- ─── Dados de exemplo ────────────────────────────────────────────────────────
INSERT INTO public.devotionals (title, bible_reference, bible_text, devotional_text, final_prayer, status, publish_date)
VALUES (
  'Confiança em Deus para um novo dia',
  'Salmo 37:5',
  'Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.',
  'Todos os dias somos convidados a entregar nossas preocupações ao Senhor. A fé não elimina os desafios, mas nos ensina a caminhar com confiança, sabendo que Deus cuida de cada detalhe.',
  'Senhor, guia o nosso dia, fortalece a nossa fé e ajuda-nos a confiar plenamente em Ti. Amém.',
  'published',
  NOW()
);

INSERT INTO public.announcements (title, content, priority)
VALUES ('Culto de Oração', 'Hoje teremos culto de oração às 19h30. Participe conosco!', 'important');

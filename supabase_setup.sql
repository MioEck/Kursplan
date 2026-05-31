-- ============================================================
-- KURSPLAN – Supabase Tabellen anlegen
-- Diesen Code einmal im Supabase SQL Editor ausführen:
-- Dashboard → SQL Editor → New query → einfügen → Run
-- ============================================================

-- Fahrer-Tabelle
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT    NOT NULL,
  pin_hash        TEXT    NOT NULL,
  is_admin        BOOLEAN DEFAULT false,
  must_change_pin BOOLEAN DEFAULT false,
  session_token   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Fahrplan-Tabelle (eine Zeile, id=1)
CREATE TABLE IF NOT EXISTS public.schedule (
  id         INT     PRIMARY KEY DEFAULT 1,
  version    TEXT,
  kurse      JSONB   NOT NULL DEFAULT '[]',
  notizen    JSONB   NOT NULL DEFAULT '{}',
  coords     JSONB   NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Nutzereinstellungen (aktiver Kurs pro Fahrer)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  active_kurs TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Login-Protokoll
CREATE TABLE IF NOT EXISTS public.login_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name   TEXT,
  logged_in_at TIMESTAMPTZ DEFAULT now(),
  user_agent  TEXT
);

-- Row Level Security: App (anon key) darf alles lesen/schreiben
ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_log    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_users"         ON public.users        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_schedule"      ON public.schedule     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_user_settings" ON public.user_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_login_log"     ON public.login_log    FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- KURSPLAN – Supabase Tabellen anlegen
-- Diesen Code einmal im Supabase SQL Editor ausführen
-- Dashboard → SQL Editor → New query → einfügen → Run
-- ============================================================

-- Fahrer-Tabelle
CREATE TABLE IF NOT EXISTS public.users (
  id        UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name      TEXT    NOT NULL,
  pin_hash  TEXT    NOT NULL,
  is_admin  BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
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

-- Damit die App (anon key) lesen und schreiben kann:
-- Entweder RLS deaktiviert lassen (Standard bei neuen Tabellen)
-- ODER explizite Policies:

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_users"        ON public.users        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_schedule"     ON public.schedule     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_user_settings" ON public.user_settings FOR ALL TO anon USING (true) WITH CHECK (true);

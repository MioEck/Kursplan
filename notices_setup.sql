CREATE TABLE IF NOT EXISTS public.notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  linien_fahrten JSONB NOT NULL DEFAULT '[]',
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  titel TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_notices" ON public.notices FOR ALL TO anon USING (true) WITH CHECK (true);

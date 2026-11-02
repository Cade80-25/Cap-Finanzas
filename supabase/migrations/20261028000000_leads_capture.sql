-- Leads capture table for newsletter signups
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT NOT NULL DEFAULT 'landing_newsletter',
  metadata JSONB DEFAULT '{}'::jsonb,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant access to service_role for edge functions
GRANT ALL ON public.leads TO service_role;

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: service_role can do everything
DO $$ BEGIN
  CREATE POLICY "Service role full access to leads"
    ON public.leads FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: allow anonymous inserts (for public signup form)
DO $$ BEGIN
  CREATE POLICY "Anon can insert leads"
    ON public.leads FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: anon can read their own lead by email (for confirmation)
DO $$ BEGIN
  CREATE POLICY "Anon can read own lead"
    ON public.leads FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrapper for edge functions to safely insert leads with duplicate handling
CREATE OR REPLACE FUNCTION public.capture_lead(
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'landing_newsletter',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(id UUID, email TEXT, is_new BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.leads (email, name, source, metadata)
  VALUES (p_email, p_name, p_source, p_metadata)
  ON CONFLICT (email) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.leads.name),
    source = EXCLUDED.source,
    metadata = public.leads.metadata || EXCLUDED.metadata,
    updated_at = now()
  RETURNING public.leads.id, public.leads.email, (xmax = 0) AS is_new;
END $$;

GRANT EXECUTE ON FUNCTION public.capture_lead(TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.capture_lead(TEXT, TEXT, TEXT, JSONB) TO anon;
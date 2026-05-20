
ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS installation_id text,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS licenses_code_unique
  ON public.licenses (code);


CREATE TABLE public.calendar_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  event_date date NOT NULL,
  event_time time NOT NULL,
  reminder_at timestamptz NOT NULL,
  methods text[] NOT NULL DEFAULT '{}',
  email text,
  phone text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.calendar_reminders ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) full access, no public access
CREATE POLICY "Service role only - select" ON public.calendar_reminders
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role only - insert" ON public.calendar_reminders
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role only - update" ON public.calendar_reminders
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Allow anonymous inserts via edge function (the edge function handles validation)
CREATE POLICY "Allow public insert for reminders" ON public.calendar_reminders
  FOR INSERT TO anon WITH CHECK (true);

-- Index for cron job to find pending reminders
CREATE INDEX idx_reminders_pending ON public.calendar_reminders (status, reminder_at) WHERE status = 'pending';

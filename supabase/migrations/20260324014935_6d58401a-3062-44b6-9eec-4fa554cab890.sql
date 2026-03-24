
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_code text NOT NULL UNIQUE,
  referrer_installation_id text NOT NULL,
  redeemed_by_installation_id text,
  redeemed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (create referral codes and redeem)
CREATE POLICY "Allow public insert referrals" ON public.referrals
  FOR INSERT TO anon WITH CHECK (true);

-- Allow anyone to select (to verify codes)
CREATE POLICY "Allow public select referrals" ON public.referrals
  FOR SELECT TO anon USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access referrals" ON public.referrals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

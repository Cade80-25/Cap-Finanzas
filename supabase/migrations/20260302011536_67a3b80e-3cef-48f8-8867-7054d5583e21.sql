
-- Table for tracking orders from PayPal
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('simple', 'traditional', 'full', 'account')),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  paypal_txn_id TEXT UNIQUE,
  paypal_payer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for generated license codes
CREATE TABLE public.licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  code TEXT NOT NULL UNIQUE,
  license_type TEXT NOT NULL CHECK (license_type IN ('simple', 'traditional', 'full', 'account')),
  customer_email TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  is_delivered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Orders: only service role can insert/update (via edge functions)
-- Public can read their own orders by email via edge function (no direct access)
CREATE POLICY "No direct access to orders" ON public.orders FOR SELECT USING (false);

-- Licenses: no direct public access, only via edge functions  
CREATE POLICY "No direct access to licenses" ON public.licenses FOR SELECT USING (false);

-- Indexes for lookups
CREATE INDEX idx_orders_email ON public.orders(customer_email);
CREATE INDEX idx_orders_paypal_txn ON public.orders(paypal_txn_id);
CREATE INDEX idx_licenses_email ON public.licenses(customer_email);
CREATE INDEX idx_licenses_code ON public.licenses(code);

-- Updated_at trigger for orders
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

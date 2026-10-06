ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paddle_txn_id text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_paddle_txn_id_key ON public.orders(paddle_txn_id) WHERE paddle_txn_id IS NOT NULL;
ALTER TABLE public.orders ALTER COLUMN paypal_txn_id DROP NOT NULL;
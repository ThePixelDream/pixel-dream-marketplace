-- ============================================================
-- MIGRAÇÃO: feature/billing-stripe
-- The Pixel Dream Marketplace
-- ============================================================

-- ── FASE 1A: Colunas Stripe em products ──────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stripe_product_id       text NULL,
  ADD COLUMN IF NOT EXISTS stripe_price_basic_id   text NULL,
  ADD COLUMN IF NOT EXISTS stripe_price_pro_id     text NULL,
  ADD COLUMN IF NOT EXISTS stripe_price_premium_id text NULL;

-- ── FASE 1B: Tabela order_items (ausente em produção) ─────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        uuid        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id      uuid        NOT NULL REFERENCES public.products(id),
  plan            text        NOT NULL DEFAULT 'basic',
  qty             integer     NOT NULL DEFAULT 1,
  unit_price_cents integer    NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'order_items' AND policyname = 'order_items_select_own'
  ) THEN
    CREATE POLICY "order_items_select_own"
      ON public.order_items FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND o.user_id = (SELECT auth.uid())
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'order_items' AND policyname = 'order_items_admin_all'
  ) THEN
    CREATE POLICY "order_items_admin_all"
      ON public.order_items FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
      ));
  END IF;
END $$;

-- ── FASE 1C: Tabela entitlements (ausente em produção) ────────
CREATE TABLE IF NOT EXISTS public.entitlements (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid        NOT NULL REFERENCES public.products(id),
  order_id   uuid        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  plan       text        NOT NULL DEFAULT 'basic',
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'entitlements' AND policyname = 'entitlements_select_own'
  ) THEN
    CREATE POLICY "entitlements_select_own"
      ON public.entitlements FOR SELECT
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'entitlements' AND policyname = 'entitlements_admin_all'
  ) THEN
    CREATE POLICY "entitlements_admin_all"
      ON public.entitlements FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
      ));
  END IF;
END $$;

-- ── FASE 1D: Blindagem RLS em orders ─────────────────────────
-- Remove a política perigosa "Service role can insert orders"
-- que permitia INSERT sem autenticação (WITH CHECK (true) para public)
DROP POLICY IF EXISTS "Service role can insert orders" ON public.orders;

-- Garante que apenas o service role (via código server-side) pode inserir
-- O service role bypassa RLS por padrão no Supabase — não precisa de policy explícita
-- Adiciona política de INSERT restrita a admins (para o painel admin)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'orders_admin_insert'
  ) THEN
    CREATE POLICY "orders_admin_insert"
      ON public.orders FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
      ));
  END IF;
END $$;

-- ── FASE 1E: Índices de performance em FKs ───────────────────
CREATE INDEX IF NOT EXISTS idx_order_items_order_id    ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id  ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_user_id    ON public.entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_product_id ON public.entitlements(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id          ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id       ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id ON public.commissions(affiliate_id);

SELECT 'Migration billing-stripe completed OK' AS status;

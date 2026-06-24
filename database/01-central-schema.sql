-- =====================================================================
--  TELEXWEB CENTRAL — Schema Database Utama
--  Single source of truth untuk semua stok credential.
--  Dibuat: 24 Juni 2026
-- =====================================================================

-- Hapus existing (kalau migration)
DROP FUNCTION IF EXISTS public.claim_stock(TEXT, TEXT, TEXT);
DROP TABLE IF EXISTS public.claim_logs CASCADE;
DROP TABLE IF EXISTS public.stock_items CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.master_variants CASCADE;
DROP TABLE IF EXISTS public.master_products CASCADE;

-- ==================== MASTER PRODUK ====================
CREATE TABLE public.master_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url   TEXT DEFAULT '',
  cat         TEXT NOT NULL DEFAULT 'ai',          -- ai | editing | account
  sort_order  INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== MASTER VARIAN (dengan SKU) ====================
CREATE TABLE public.master_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.master_products(id) ON DELETE CASCADE,
  sku         TEXT UNIQUE NOT NULL,                -- contoh: CC-7D, GPT-FG
  name        TEXT NOT NULL,                       -- contoh: "7 Hari", "Full Garansi"
  sort_order  INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mv_product ON public.master_variants(product_id);
CREATE INDEX idx_mv_sku ON public.master_variants(sku);

-- ==================== STOK ITEMS (credential) ====================
CREATE TABLE public.stock_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku         TEXT NOT NULL REFERENCES public.master_variants(sku),
  credential  TEXT NOT NULL,                       -- 1 baris = email|password
  status      TEXT NOT NULL DEFAULT 'available',   -- available | sold
  claimed_by  TEXT,                                -- api_key toko yang claim
  order_ref   TEXT,                                -- referensi order dari toko
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  sold_at     TIMESTAMPTZ
);

CREATE INDEX idx_si_sku_status ON public.stock_items(sku, status);
CREATE INDEX idx_si_claimed_by ON public.stock_items(claimed_by);

-- ==================== CLAIM LOGS ====================
CREATE TABLE public.claim_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku         TEXT NOT NULL,
  credential  TEXT NOT NULL,
  api_key     TEXT NOT NULL,
  store_name  TEXT NOT NULL,
  store_type  TEXT NOT NULL DEFAULT 'telegram',    -- telegram | web
  order_ref   TEXT DEFAULT '',
  claimed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cl_api_key ON public.claim_logs(api_key);
CREATE INDEX idx_cl_sku ON public.claim_logs(sku);
CREATE INDEX idx_cl_claimed_at ON public.claim_logs(claimed_at);

-- ==================== API KEYS ====================
CREATE TABLE public.api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,
  store_name  TEXT NOT NULL,
  store_type  TEXT NOT NULL DEFAULT 'telegram',    -- telegram | web
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== SEED DEFAULT API KEY (ADMIN) ====================
-- Ganti 'admin' dengan password pilihan kamu setelah deploy.
INSERT INTO public.api_keys (key, store_name, store_type)
VALUES ('telex-admin-master-key', 'Admin Central', 'central')
ON CONFLICT (key) DO NOTHING;

-- ==================== RULES RLS ====================
-- Anon: cuma bisa baca produk + varian (buat cek stok di toko-toko)
ALTER TABLE public.master_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_products_read_anon" ON public.master_products
  FOR SELECT USING (true);

CREATE POLICY "master_variants_read_anon" ON public.master_variants
  FOR SELECT USING (true);

-- ==================== FUNCTION CLAIM (ATOMIC) ====================
-- Memanggil: SELECT claim_stock('CC-7D', 'api_key_toko', 'ORDER-001');
-- Mengembalikan credential TEXT, atau NULL jika stok habis.
CREATE OR REPLACE FUNCTION public.claim_stock(
  p_sku       TEXT,
  p_api_key   TEXT,
  p_order_ref TEXT DEFAULT ''
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id         UUID;
  v_credential TEXT;
  v_store_name TEXT;
  v_store_type TEXT;
BEGIN
  -- 1. Validasi API key
  SELECT store_name, store_type INTO v_store_name, v_store_type
    FROM public.api_keys
    WHERE key = p_api_key AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'API_KEY_INVALID';
  END IF;

  -- 2. Claim 1 baris stok secara atomic (FOR UPDATE SKIP LOCKED)
  SELECT id, credential INTO v_id, v_credential
    FROM public.stock_items
    WHERE sku = p_sku AND status = 'available'
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- 3. Update status jadi sold
  UPDATE public.stock_items
    SET status = 'sold',
        claimed_by = p_api_key,
        order_ref = p_order_ref,
        sold_at = now()
    WHERE id = v_id;

  -- 4. Catat log
  INSERT INTO public.claim_logs (sku, credential, api_key, store_name, store_type, order_ref)
    VALUES (p_sku, v_credential, p_api_key, v_store_name, v_store_type, p_order_ref);

  -- 5. Return credential
  RETURN v_credential;
END;
$$;

-- ==================== VIEW: STOCK SUMMARY ====================
CREATE OR REPLACE VIEW public.stock_summary AS
SELECT
  mv.sku,
  mp.name AS product_name,
  mv.name AS variant_name,
  COUNT(si.id) FILTER (WHERE si.status = 'available') AS stok_tersedia,
  COUNT(si.id) FILTER (WHERE si.status = 'sold') AS stok_terjual,
  COUNT(si.id) AS total_stok
FROM public.master_variants mv
JOIN public.master_products mp ON mp.id = mv.product_id
LEFT JOIN public.stock_items si ON si.sku = mv.sku
GROUP BY mv.sku, mp.name, mv.name
ORDER BY mp.sort_order, mv.sort_order;

-- =====================================================================
--  SETUP SELESAI
--  Langkah selanjutnya: buka Supabase → SQL Editor → paste ini → Run
-- =====================================================================

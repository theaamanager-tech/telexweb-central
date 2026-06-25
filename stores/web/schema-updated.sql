-- =====================================================================
--  TELEXWEB — Schema untuk TOKO WEB (terintegrasi Central Stock)
--  Project Supabase BARU untuk toko web.
--  TIDAK ADA tabel stock_items — stok ambil dari Central API.
--  Semua fitur asli (app_config, coupons, dll) tetap ada.
--  Tambahan: kolom `sku` di variants, central_api config di app_config.
-- =====================================================================

DROP FUNCTION IF EXISTS public.claim_stock(uuid, text);
DROP VIEW IF EXISTS public.variant_stock;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.stock_items CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.app_config CASCADE;
DROP TABLE IF EXISTS public.variants CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- ==================== PRODUK ====================
CREATE TABLE public.products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  cat         TEXT NOT NULL DEFAULT 'ai',           -- ai | editing | account
  initials    TEXT NOT NULL DEFAULT '',
  tag         TEXT NOT NULL DEFAULT '',
  subtitle    TEXT NOT NULL DEFAULT '',
  image_url   TEXT NOT NULL DEFAULT '',
  sort_order  INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== VARIAN ====================
CREATE TABLE public.variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku         TEXT,                                 -- ⬅️ KOLOM BARU: nyambung ke Central Stock
  name        TEXT NOT NULL,
  price       INT,                                  -- null = Chat Admin
  snk         TEXT NOT NULL DEFAULT '',
  sort_order  INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_variants_product ON public.variants(product_id);
CREATE INDEX idx_variants_sku ON public.variants(sku);

-- ==================== KUPON ====================
CREATE TABLE public.coupons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,
  type        TEXT NOT NULL DEFAULT 'percent',       -- percent | fixed
  value       INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  max_uses    INT NOT NULL DEFAULT 0,             -- 0 = unlimited
  used_count  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== ORDER ====================
CREATE TABLE public.orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      TEXT UNIQUE NOT NULL,              -- random claim token / Pakasir ref
  variant_id    UUID REFERENCES public.variants(id),
  product_name  TEXT,
  variant_name  TEXT,
  unit_price    INT NOT NULL DEFAULT 0,
  quantity      INT NOT NULL DEFAULT 1,
  discount      INT NOT NULL DEFAULT 0,
  amount        INT NOT NULL DEFAULT 0,            -- final charged amount
  coupon_code   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',   -- pending | paid | expired | failed
  payment_method TEXT NOT NULL DEFAULT 'qris',
  qr_string     TEXT,
  delivery_text TEXT,                              -- credential dari Central via fulfill
  buyer_contact TEXT DEFAULT '',
  buyer_note    TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at       TIMESTAMPTZ
);

CREATE INDEX idx_orders_id ON public.orders(order_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- ==================== APP CONFIG ====================
CREATE TABLE public.app_config (
  id             INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  -- Pakasir
  pakasir_project TEXT DEFAULT '',
  pakasir_api_key TEXT DEFAULT '',
  pakasir_mode    TEXT DEFAULT 'sandbox',
  -- Store info
  store_name      TEXT DEFAULT 'Verdant°',
  store_tagline   TEXT DEFAULT 'Produk Digital Premium',
  store_hero_title TEXT DEFAULT 'Beli sekali klik, akun langsung jadi.',
  store_hero_subtitle TEXT DEFAULT 'Pilih produk, bayar via QRIS, akun langsung terkirim otomatis.',
  store_footer_text TEXT DEFAULT '© Verdant° · Semua transaksi via QRIS aman.',
  -- Central API Config
  central_api_url  TEXT DEFAULT 'https://central-panel.vercel.app',
  central_api_key  TEXT DEFAULT '',
  -- Bantuan
  bantuan_contact  TEXT DEFAULT '',
  bantuan_faq      TEXT DEFAULT '',
  -- Announcement
  annon_active     BOOLEAN DEFAULT false,
  annon_text       TEXT DEFAULT '',
  annon_badge_text TEXT DEFAULT '',
  annon_badge_bg   TEXT DEFAULT '#28C39D',
  annon_badge_text_color TEXT DEFAULT '#0D0E10',
  annon_bg         TEXT DEFAULT 'rgba(40,195,157,0.12)',
  annon_text_color TEXT DEFAULT '#CFEEE6',
  -- Store status
  store_active    BOOLEAN DEFAULT true,
  -- Social Media
  soc_wa_active               BOOLEAN DEFAULT false,
  soc_wa_number               TEXT DEFAULT '',
  soc_tele_active             BOOLEAN DEFAULT false,
  soc_tele_channel            TEXT DEFAULT '',
  soc_tele_channel_active     BOOLEAN DEFAULT false,
  soc_tele_bot                TEXT DEFAULT '',
  soc_tele_bot_active         BOOLEAN DEFAULT false,
  soc_x_active                BOOLEAN DEFAULT false,
  soc_x_link                  TEXT DEFAULT '',
  soc_ig_active               BOOLEAN DEFAULT false,
  soc_ig_link                 TEXT DEFAULT '',
  -- Backgrounds
  bg_list         JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.app_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ==================== RLS RULES ====================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_read" ON public.products FOR SELECT USING (true);
CREATE POLICY "variants_read" ON public.variants FOR SELECT USING (true);
-- (No policies on orders / coupons / app_config => anon denied.
--  Serverless functions use service-role key which bypasses RLS.)

-- ==================== VIEW STOCK COUNT ====================
-- TIDAK ADA stock_items di DB lokal — stok dari Central API.
-- View ini placeholder agar query kode lama tidak error.
CREATE VIEW public.variant_stock AS
  SELECT v.id AS variant_id, v.sku, 0 AS available
  FROM public.variants v
  WHERE 1 = 0;

-- ============================ SEED DATA ============================
-- Produk & varian harus diisi via Central Panel dulu (produk/varian dibuat di Central),
-- lalu admin toko web bisa mapping varian lokal ke SKU Central.
-- Atau isi manual lewat admin panel toko web.

-- =====================================================================
--  LANGKAH SELANJUTNYA:
--  1. Paste SQL ini di Supabase SQL Editor (project TOKO WEB yang baru)
--  2. Catat URL + anon key + service role key
--  3. Set Vercel env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_KEY
--  4. Di admin panel toko web → Settings → isi Central API URL + API Key
--  5. Mapping: buat product+variant di admin panel, isi kolom SKU sesuai Central
-- =====================================================================

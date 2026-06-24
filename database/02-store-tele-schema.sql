-- =====================================================================
--  TELEXWEB — Schema untuk TOKO TELEGRAM (bot baru)
--  Database terpisah dari Central! Buat project Supabase baru.
--  Tambahan: kolom `sku` untuk nyambung ke Central Stock.
--  TIDAK ADA tabel stock_items — stok ambil dari Central API.
-- =====================================================================

DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.variants CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.telegram_users CASCADE;
DROP TABLE IF EXISTS public.store_settings CASCADE;

-- ==================== PRODUK ====================
CREATE TABLE public.products (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT DEFAULT '',
  image_url     TEXT DEFAULT '',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== VARIAN ====================
CREATE TABLE public.variants (
  id            SERIAL PRIMARY KEY,
  product_id    INT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku           TEXT,                              -- ⬅️ KOLOM BARU: nyambung ke Central
  name          TEXT NOT NULL,
  price         INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  snk           TEXT DEFAULT '',                   -- Syarat & Ketentuan
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_variants_product ON public.variants(product_id);
CREATE INDEX idx_variants_sku ON public.variants(sku);

-- ==================== ORDER ====================
CREATE TABLE public.orders (
  id                SERIAL PRIMARY KEY,
  telegram_user_id  TEXT NOT NULL,
  telegram_username TEXT DEFAULT '',
  telegram_chat_id  TEXT NOT NULL,
  variant_id        INT NOT NULL REFERENCES public.variants(id),
  variant_name      TEXT NOT NULL,
  quantity          INT NOT NULL DEFAULT 1,
  total_price       INT NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | paid | expired | failed
  transaction_id    TEXT NOT NULL,
  payment_method    TEXT DEFAULT 'qris',
  coupon_code       TEXT DEFAULT '',
  delivery_text     TEXT DEFAULT '',                -- credential yang dikirim
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at           TIMESTAMPTZ
);

CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_transaction ON public.orders(transaction_id);

-- ==================== TELEGRAM USERS ====================
CREATE TABLE public.telegram_users (
  id                  SERIAL PRIMARY KEY,
  telegram_user_id    TEXT NOT NULL UNIQUE,
  telegram_chat_id    TEXT NOT NULL,
  username            TEXT DEFAULT '',
  first_name          TEXT DEFAULT '',
  last_name           TEXT DEFAULT '',
  is_blacklisted      BOOLEAN NOT NULL DEFAULT false,
  blacklist_reason    TEXT DEFAULT '',
  last_seen           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== KUPON ====================
CREATE TABLE public.coupons (
  id              SERIAL PRIMARY KEY,
  code            TEXT UNIQUE NOT NULL,
  discount_type   TEXT NOT NULL DEFAULT 'percent',   -- percent | fixed
  discount_value  INT NOT NULL DEFAULT 0,
  min_order_amount INT NOT NULL DEFAULT 0,
  max_uses        INT DEFAULT 0,                     -- 0 = unlimited
  used_count      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== SETTING TOKO ====================
CREATE TABLE public.store_settings (
  id          SERIAL PRIMARY KEY,
  key         TEXT UNIQUE NOT NULL,
  value       TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default settings
INSERT INTO public.store_settings (key, value, description) VALUES
  ('store_name', 'Toko Saya', 'Nama toko'),
  ('store_description', 'Toko Produk Digital', 'Deskripsi toko'),
  ('pakasir_api_key', '', 'API Key Pakasir'),
  ('pakasir_project', '', 'Project ID Pakasir'),
  ('pakasir_mode', 'sandbox', 'sandbox / live'),
  ('admin_username', 'admin', 'Username admin panel'),
  ('admin_password', 'admin', 'Password admin panel (ganti!)'),
  ('central_api_url', 'https://central-panel.vercel.app', 'URL Central API'),
  ('central_api_key', '', 'API Key untuk akses Central');

-- =====================================================================
--  LANGKAH SELANJUTNYA:
--  1. Paste SQL ini di Supabase project TOKO TELEGRAM
--  2. Catet URL + anon key + service role key
--  3. Isi store_settings nanti lewat admin panel
-- =====================================================================

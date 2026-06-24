# TELEXWEB CENTRAL — Panduan Setup Lengkap

Panduan ini untuk **super pemula**. Ikuti langkah demi langkah, dari 0 sampai jadi.

---

## 📋 DAFTAR ISI

1. [Buat Akun-Akun](#1-buat-akun-akun)
2. [Setup Supabase Central](#2-setup-supabase-central)
3. [Deploy Central Panel ke Vercel](#3-deploy-central-panel-ke-vercel)
4. [Setup Toko Web (clone Verdant°)](#4-setup-toko-web)
5. [Setup Toko Telegram (clone Jokowhy)](#5-setup-toko-telegram)
6. [Integrasi: Hubungkan Toko ke Central](#6-integrasi-hubungkan-toko-ke-central)

---

## 1. Buat Akun-Akun

Sebelum mulai, daftar akun gratis ini dulu:

| # | Akun | Link | Buat Apa |
|---|------|------|----------|
| 1 | **GitHub** | https://github.com | Nyimpen code project |
| 2 | **Vercel** | https://vercel.com | Host panel Central & Toko Web |
| 3 | **Supabase** × 3 | https://supabase.com | Database Central, Toko Tele, Toko Web |
| 4 | **Railway** ATAU **Render** | https://railway.app / https://render.com | Host bot Telegram |
| 5 | **Pakasir** | (udah punya) | Payment QRIS |

---

## 2. Setup Supabase Central

### 2.1. Buat Project
1. Buka https://supabase.com → **Sign in** (pake GitHub)
2. Klik **New project**
3. Isi:
   - **Name**: `telexweb-central`
   - **Database Password**: bikin password kuat, simpan!
   - **Region**: pilih yang terdekat (Singapore)
4. Klik **Create new project**
5. Tunggu ~2-3 menit sampai selesai

### 2.2. Dapetin URL & Keys
1. Di dashboard project, klik **Project Settings** (ikon gigi) → **API**
2. Catet 3 hal ini di notepad:
   ```
   Project URL: https://xxx.supabase.co
   Anon Public Key: eyJhbGciOiJIUzI1NiIs...
   Service Role Key: eyJhbGciOiJIUzI1NiIs...
   ```
   ⚠️ **Service Role Key itu rahasia! Jangan bocor!**

### 2.3. Paste SQL Schema
1. Di sidebar kiri, klik **SQL Editor**
2. Klik **New query**
3. Buka file `database/01-central-schema.sql` di project ini
4. **Copy paste SEMUA** isinya ke SQL Editor
5. Klik **Run** (atau Ctrl+Enter)
6. Kalau muncul "Success. No rows returned" — **BERHASIL!** 🎉

---

## 3. Deploy Central Panel ke Vercel

### 3.1. Push ke GitHub
1. Buka terminal
2. Jalankan:
```bash
cd telexweb-central
git init
git add .
git commit -m "init: telexweb central panel"
```

3. Buka https://github.com → **New repository**
4. Nama repo: `telexweb-central`
5. Jangan centang apa-apa, langsung **Create repository**
6. Di terminal jalankan 3 baris ini (ganti `your-username`):
```bash
git remote add origin https://github.com/theaamanager-tech/telexweb-central.git
git branch -M main
git push -u origin main
```

### 3.2. Deploy ke Vercel
1. Buka https://vercel.com → **Sign in** pake GitHub
2. Klik **Add New...** → **Project**
3. Pilih repo `telexweb-central`
4. Di **Root Directory**: klik **Edit** → pilih `central`
5. Scroll ke **Environment Variables**, isi:
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL tadi (https://xxx.supabase.co) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Public Key tadi |
   | `SUPABASE_URL` | Project URL tadi (sama) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key tadi |
   | `ADMIN_PASSWORD` | Password buat login panel (ganti bebas) |

6. Klik **Deploy**
7. Tunggu ~2-3 menit
8. Kalau muncul **"Congratulations, your project is live!"** — **BERHASIL!** 🎉

### 3.3. Akses Panel
- Buka URL Vercel kamu (contoh: `https://central-xxx.vercel.app`)
- Login pake password ADMIN_PASSWORD tadi
- Kamu bakal liat **Dashboard** — TAPI masih kosong karena belum ada produk

⚠️ **Catet URL ini ya!** Ini Central API URL yang nanti dipake toko-toko.

---

## 4. Setup Toko Web

> **Ini adalah clone dari Verdant°/webtestgum yang diedit**
> Folder: `telexweb-central/stores/web/`

### 4.1. Buat Supabase Project Baru
1. Buka Supabase → **New project**
2. **Name**: `toko-web`
3. Isi password, pilih region
4. Tunggu sampai jadi
5. Catet Project URL, Anon Key, Service Role Key (sama kayak langkah 2.2)

### 4.2. Paste SQL Toko Web
1. Buka SQL Editor
2. Buka file `database/03-store-web-schema.sql`
3. Paste semua → Run

### 4.3. Setup File Web
1. Buka folder `telexweb-central/stores/web/`
2. Edit file `config.js` — ganti `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dengan milik toko web
3. Tambahin:
```javascript
const CENTRAL_API_URL = "https://central-xxx.vercel.app"; // URL panel central
const CENTRAL_API_KEY = "..." // API Key dari Panel Central → menu API Keys
```

### 4.4. Deploy Toko Web
1. Buka Vercel → **Add New** → **Project**
2. Pilih repo `telexweb-central`
3. Root Directory: pilih `stores/web`
4. Set Environment Variables sama (Supabase URL, Anon Key, dll)
5. Deploy!

---

## 5. Setup Toko Telegram

> **Ini adalah clone dari Jokowhy/telegramstore yang diedit**
> Folder: `telexweb-central/stores/telegram/`

### 5.1. Buat Supabase Project Baru
1. Supabase → **New project** → **Name**: `toko-telegram`
2. Tunggu, catet URL + keys

### 5.2. Paste SQL Toko Telegram
1. Buka file `database/02-store-tele-schema.sql` → Paste → Run

### 5.3. Setup & Deploy Bot
*(Lengkapnya menyusul di Phase 3 nanti)*

---

## 6. Integrasi: Hubungkan Toko ke Central

### 6.1. Dapetin API Key
1. Buka panel Central → **API Keys** (sidebar)
2. Klik **Tambah Toko**
3. **Nama**: `Toko Web Saya`
4. **Tipe**: `Website`
5. Klik **Generate Key**
6. **COPY KEY-NYA!** (soalnya cuma muncul sekali)
7. Lakukan lagi buat toko Telegram

### 6.2. Cara Kerja Claim Stok
Di kode toko, pas webhook Pakasir sukses:

```javascript
// Contoh di Toko Web (api/pakasir-webhook.js)
async function handlePaymentSuccess(order) {
  const response = await fetch(`${CENTRAL_API_URL}/api/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CENTRAL_API_KEY
    },
    body: JSON.stringify({
      sku: order.sku,
      order_ref: order.id
    })
  });

  const data = await response.json();

  if (data.success && data.credential) {
    // Kirim credential ke pembeli
    sendToBuyer(data.credential);
  } else {
    // Stok habis!
    alertAdmin("Stok habis untuk SKU: " + order.sku);
  }
}

// Contoh cek stok sebelum checkout
async function checkStock(sku) {
  const response = await fetch(`${CENTRAL_API_URL}/api/stock/${sku}`, {
    headers: { 'x-api-key': CENTRAL_API_KEY }
  });
  return response.json();
}
```

---

## 🔧 Troubleshooting

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| "API key tidak valid" | Key salah atau belum di-generate | Cek di Panel → API Keys |
| "Stok habis" | Stock_items kosong | Isi stok dulu di Panel → Produk |
| "SKU tidak ditemukan" | SKU belum dibuat di Central | Buat varian di Panel dulu |
| Halaman putih di panel | Environment variable kurang | Cek Vercel → Settings → Env Vars |
| "supabaseUrl is required" | .env.local belum diisi | Isi .env.local contoh dari .env.example |

---

## 📚 Arsitektur Ringkas

```
telexweb-central/
├── central/          ← Panel + API (Next.js, di-deploy ke Vercel)
├── stores/
│   ├── telegram/     ← Clone telegramstore → diedit
│   └── web/          ← Clone webtestgum → diedit
├── database/
│   ├── 01-central-schema.sql     ← SQL buat Supabase Central
│   ├── 02-store-tele-schema.sql  ← SQL buat Supabase Toko Telegram
│   └── 03-store-web-schema.sql   ← SQL buat Supabase Toko Web
└── guides/
    └── (file ini)
```

## 🗺️ Roadmap

| Phase | Isi | Status |
|-------|-----|--------|
| **Phase 1** | ✅ Central Panel + API + SQL + Deploy | ✅ **SELESAI** |
| **Phase 2** | Toko Web (clone → edit → integrasi) | ⏳ **NEXT** |
| **Phase 3** | Toko Telegram (clone → edit → integrasi) | ⏳ Menunggu |
| **Phase 4** | Final testing + Guides super pemula | ⏳ Menunggu |

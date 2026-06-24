# 📘 PANDUAN INSTALASI & PEMAKAIAN
# TELEGRAM BOT STORE

> **Versi:** 1.0 — Edisi Reseller / End-User
> **Untuk:** Pembeli/Penyewa Bot Store
> **Estimasi waktu setup:** 30 — 60 menit

---

## DAFTAR ISI

1. [Sekilas tentang Aplikasi](#1-sekilas-tentang-aplikasi)
2. [Yang Harus Disiapkan (Prasyarat)](#2-yang-harus-disiapkan-prasyarat)
3. [Langkah 1 — Buat Database di Supabase](#3-langkah-1--buat-database-di-supabase)
4. [Langkah 2 — Buat Bot Telegram](#4-langkah-2--buat-bot-telegram)
5. [Langkah 3 — Daftar Pakasir untuk Pembayaran QRIS](#5-langkah-3--daftar-pakasir-untuk-pembayaran-qris)
6. [Langkah 4 — Install Aplikasi di VPS / Server](#6-langkah-4--install-aplikasi-di-vps--server)
7. [Langkah 5 — Login & Konfigurasi Admin Panel](#7-langkah-5--login--konfigurasi-admin-panel)
8. [Langkah 6 — Tambah Produk, Varian & Stok](#8-langkah-6--tambah-produk-varian--stok)
9. [Langkah 7 — Set Callback URL Pakasir](#9-langkah-7--set-callback-url-pakasir)
10. [Langkah 8 — Uji Coba End-to-End](#10-langkah-8--uji-coba-end-to-end)
11. [Pemeliharaan & Operasional Harian](#11-pemeliharaan--operasional-harian)
12. [Troubleshooting (Error & Solusinya)](#12-troubleshooting-error--solusinya)
13. [FAQ](#13-faq)
14. [Kontak & Dukungan](#14-kontak--dukungan)

---

## 1. SEKILAS TENTANG APLIKASI

**Telegram Bot Store** adalah toko digital otomatis yang dijalankan lewat bot Telegram. Pelanggan memilih produk → bayar via QRIS Pakasir → produk digital (akun, voucher, key, dsb) terkirim otomatis ke chat mereka.

**Komponen yang Anda dapat:**

| Komponen | Fungsi |
|---|---|
| **API Server** (Node.js) | Otak aplikasi — handle bot Telegram, API admin, scheduler pembayaran |
| **Admin Panel** (web) | Kelola produk, stok, order, pesan bot, pengaturan |
| **Database PostgreSQL** | Penyimpanan semua data |

**Fitur utama:**

- ✅ Katalog produk + varian (mis. produk "Netflix" dengan varian 1 bulan, 3 bulan)
- ✅ Manajemen stok otomatis (key/akun habis → varian otomatis nonaktif)
- ✅ Pembayaran QRIS via Pakasir
- ✅ Pengiriman produk otomatis setelah pembayaran sukses
- ✅ Kupon diskon
- ✅ Broadcast ke pelanggan
- ✅ Notifikasi penjualan ke admin/channel
- ✅ Blacklist user
- ✅ Laporan keuangan (PDF/Excel/CSV)
- ✅ Backup & restore data

---

## 2. YANG HARUS DISIAPKAN (PRASYARAT)

Sebelum mulai, siapkan akun-akun & resource berikut. **Semua gratis untuk mulai.**

### 2.1 Akun yang dibutuhkan

| # | Akun | Untuk apa | Link daftar |
|---|---|---|---|
| 1 | **Akun Telegram** | Buat bot via @BotFather | (sudah punya kalau pakai Telegram) |
| 2 | **Akun Supabase** | Database PostgreSQL gratis | https://supabase.com |
| 3 | **Akun Pakasir** | Gateway pembayaran QRIS | https://pakasir.com |
| 4 | **VPS / Hosting Node.js** | Untuk menjalankan aplikasi 24/7 | Lihat rekomendasi di bawah |

### 2.2 Spesifikasi server minimum

- **OS:** Ubuntu 22.04 / Debian 12 (64-bit)
- **RAM:** 512 MB (rekomendasi 1 GB)
- **Disk:** 5 GB
- **Bandwidth:** unlimited (atau minimal 100 GB/bulan)
- **Public IP** atau domain (untuk callback Pakasir)

**Rekomendasi VPS murah (mulai Rp 25rb/bulan):**

- Domainesia / Niagahoster / Idcloudhost (lokal Indonesia)
- Contabo VPS S (luar negeri, ~$6/bulan)
- DigitalOcean / Vultr / Linode

### 2.3 Software yang akan diinstal di server

- Node.js v20+ (dipasang otomatis lewat panduan)
- PM2 (untuk menjaga aplikasi tetap hidup)

> 💡 **Anda TIDAK perlu install PostgreSQL di server**, karena database memakai Supabase (cloud).

---

## 3. LANGKAH 1 — BUAT DATABASE DI SUPABASE

### 3.1 Daftar & buat project

1. Buka https://supabase.com → klik **Start your project** → daftar (boleh login pakai GitHub).
2. Setelah masuk dashboard → klik **New Project**.
3. Isi:
   - **Name**: `bot-store-saya` (bebas)
   - **Database Password**: **buat password yang KUAT** dan **CATAT** — Anda butuh ini nanti.
   - **Region**: pilih **Singapore (Southeast Asia)** untuk akses tercepat dari Indonesia
4. Klik **Create new project** → tunggu ±2 menit.

### 3.2 Jalankan SQL Schema

Saat masih di dashboard project Supabase:

1. Klik ikon **SQL Editor** di sidebar kiri.
2. Klik tombol **+ New query**.
3. **Copy-paste seluruh isi file `schema.sql`** (file ini ada di folder paket bot-store yang Anda terima).
4. Klik tombol **Run** (▶) di kanan bawah, atau tekan `Ctrl+Enter`.
5. Lihat di bawah harus ada tulisan: **Success. No rows returned** ✅

### 3.3 Verifikasi tabel sudah dibuat

1. Klik ikon **Table Editor** di sidebar.
2. Anda harus melihat 8 tabel:

   - `bot_messages`
   - `coupons`
   - `orders`
   - `products`
   - `stock_items`
   - `store_settings`
   - `telegram_users`
   - `variants`

### 3.4 Ambil Connection String

1. Klik ikon **⚙ Project Settings** (kiri bawah) → **Database**.
2. Cari section **Connection string** → pilih tab **URI**.
3. Anda akan lihat format seperti:

   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```

4. **Salin** string tersebut dan **ganti `[YOUR-PASSWORD]`** dengan password yang Anda buat di langkah 3.1.
5. **Tambahkan** `?sslmode=require` di paling akhir.

   ✅ Hasil akhir contoh:
   ```
   postgresql://postgres:KataSandiKuat123@db.abcdxyz.supabase.co:5432/postgres?sslmode=require
   ```

6. **Simpan baik-baik** — akan dipakai di Langkah 4.

> ⚠️ **JANGAN bagikan connection string ini ke siapa pun.** Itu setara kunci master database Anda.

---

## 4. LANGKAH 2 — BUAT BOT TELEGRAM

### 4.1 Bicara ke @BotFather

1. Buka Telegram → cari **@BotFather** (ada centang biru) → klik **Start**.
2. Kirim perintah: `/newbot`
3. BotFather akan tanya **nama bot** (display name) — contoh: `Toko Digital Saya`
4. Lalu tanya **username bot** — harus diakhiri `bot`. Contoh: `toko_digital_saya_bot`
5. BotFather akan kirim **token** seperti ini:
   ```
   1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ-1234567
   ```
6. **SIMPAN TOKEN INI** — akan dipakai nanti di admin panel.

### 4.2 Hias bot Anda (opsional tapi disarankan)

Masih di chat dengan @BotFather, kirim perintah:

| Perintah | Fungsi |
|---|---|
| `/setdescription` | Deskripsi bot (muncul di chat baru) |
| `/setabouttext` | Teks "About" (muncul di profil bot) |
| `/setuserpic` | Foto profil bot |
| `/setcommands` | Daftar perintah (recommended, lihat di bawah) |

**Untuk `/setcommands`, paste daftar berikut:**

```
start - Mulai bot dan lihat menu utama
menu - Tampilkan daftar produk
help - Pusat bantuan
```

### 4.3 Cari Chat ID admin (untuk notifikasi)

1. Cari **@userinfobot** di Telegram → klik **Start**.
2. Bot akan balas dengan **ID** Anda — contoh: `123456789`.
3. **Simpan ID ini** — akan dimasukkan ke admin panel agar Anda dapat notifikasi setiap ada penjualan.

### 4.4 (Opsional) Buat channel notifikasi penjualan

Kalau Anda ingin notifikasi penjualan masuk ke channel Telegram:

1. Buat **channel** baru di Telegram.
2. Tambahkan bot Anda sebagai **administrator** channel.
3. Catat **username channel** (`@namaChannel`) atau **chat ID** (`-100xxxxxxxxx`).

---

## 5. LANGKAH 3 — DAFTAR PAKASIR UNTUK PEMBAYARAN QRIS

Pakasir adalah payment gateway lokal yang mendukung QRIS. Bot Anda akan generate QR otomatis dan pelanggan tinggal scan.

### 5.1 Daftar akun Pakasir

1. Buka https://pakasir.com → klik **Daftar**.
2. Lengkapi data: nama, email, nomor HP, KTP/usaha (sesuai persyaratan Pakasir).
3. Verifikasi email & dokumen.
4. Tunggu approval (biasanya 1×24 jam).

### 5.2 Buat Proyek Pakasir

1. Login ke dashboard Pakasir.
2. Buat proyek baru → isi nama toko Anda.
3. Pakasir akan kasih **Slug Proyek** (contoh: `toko-saya-12345`) — **catat**.
4. Di halaman detail proyek, ada **API Key** — **catat juga**.

### 5.3 Tentukan Webhook Secret (opsional tapi disarankan)

Buat string acak panjang sendiri (contoh: `wh_secret_aksdjflaksjdf99`). Ini akan kita pakai untuk verifikasi webhook Pakasir.

> 💡 Callback URL Pakasir akan kita atur **setelah** aplikasi online (di Langkah 9).

---

## 6. LANGKAH 4 — INSTALL APLIKASI DI VPS / SERVER

> 🚀 **CARA TERCEPAT — Auto Installer (rekomendasi)**
>
> Skrip `install.sh` akan handle SEMUA otomatis: install Node.js, isi `.env` interaktif, apply schema ke Supabase, setup PM2/systemd, buka firewall, dan kasih ringkasan akhir.
>
> **3 langkah saja:**
>
> ```bash
> ssh root@IP-SERVER-ANDA
> tar -xzf bot-store-deploy-updated.tar.gz
> cd bot-store && bash install.sh
> ```
>
> Skrip akan menanyakan secara interaktif:
> - DATABASE_URL (Supabase connection string)
> - Username & password admin (atau auto-generate)
> - Port aplikasi
> - Cara menjalankan (PM2 / systemd / nohup)
>
> Selesai dalam 5–10 menit. Kalau ingin manual, ikuti langkah 6.1–6.9 di bawah.

---

### 📜 CARA MANUAL (kalau ingin kontrol penuh)

### 6.1 Login ke server

```bash
ssh root@IP-SERVER-ANDA
```

### 6.2 Install Node.js v20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v   # harus tampil v20.x.x
```

### 6.3 Install PM2 (untuk auto-restart)

```bash
npm install -g pm2
```

### 6.4 Upload paket bot-store ke server

Dari komputer Anda, upload file `bot-store-deploy-updated.tar.gz` ke server:

```bash
# Dari komputer lokal Anda (bukan dari server):
scp bot-store-deploy-updated.tar.gz root@IP-SERVER:/root/
```

Atau pakai SFTP client (FileZilla, WinSCP, dll).

### 6.5 Extract paket

Di server:

```bash
cd /root
tar -xzf bot-store-deploy-updated.tar.gz
cd bot-store
ls -la
```

Anda harus lihat: `api-server/`, `artifacts/`, `start.sh`, `.env`, `instalasi.txt`.

### 6.6 Edit file `.env`

```bash
nano .env
```

Isi seperti contoh berikut (ganti dengan data Anda):

```bash
DATABASE_URL=postgresql://postgres:KataSandiKuat123@db.abcdxyz.supabase.co:5432/postgres?sslmode=require
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password_admin_kuat_anda
SESSION_SECRET=string_acak_minimal_32_karakter_xxxxxxxxxx
PORT=3000
```

**Penjelasan:**

| Variabel | Isi dengan |
|---|---|
| `DATABASE_URL` | Connection string Supabase dari Langkah 3.4 |
| `ADMIN_USERNAME` | Username untuk login admin panel (mis. `admin`) |
| `ADMIN_PASSWORD` | Password untuk login admin panel — **buat yang kuat** |
| `SESSION_SECRET` | String acak min 32 karakter untuk keamanan session |
| `PORT` | Port aplikasi (default `3000`) |

**Tips bikin SESSION_SECRET acak:**
```bash
openssl rand -hex 32
```
Copy outputnya ke `SESSION_SECRET`.

Simpan: `Ctrl+O`, `Enter`, lalu `Ctrl+X`.

### 6.7 Jalankan aplikasi

**Test dulu:**
```bash
bash start.sh
```

Kalau muncul `✓ Server berjalan di port 3000` → sukses. Tekan `Ctrl+C` untuk berhenti.

**Jalankan permanen via PM2:**
```bash
pm2 start start.sh --name bot-store --interpreter bash
pm2 save
pm2 startup
# (jalankan command yang ditampilkan PM2 untuk auto-start saat reboot)
```

**Cek status:**
```bash
pm2 status
pm2 logs bot-store
```

### 6.8 Buka firewall (port 3000)

```bash
ufw allow 3000/tcp
ufw allow 22/tcp
ufw enable
```

### 6.9 Akses admin panel

Buka browser → `http://IP-SERVER-ANDA:3000`

Login dengan `ADMIN_USERNAME` & `ADMIN_PASSWORD` yang Anda set di `.env`.

> 🔒 **PRODUKSI: pasang HTTPS** dengan reverse proxy Nginx + Let's Encrypt. Contoh konfigurasi ada di bagian [Pemeliharaan](#11-pemeliharaan--operasional-harian).

---

## 7. LANGKAH 5 — LOGIN & KONFIGURASI ADMIN PANEL

### 7.1 Masuk halaman Settings

Setelah login, klik menu **Settings** di sidebar kiri.

### 7.2 Isi pengaturan utama

| Field | Isi dengan |
|---|---|
| **Nama Toko** (`store_name`) | Nama toko Anda, mis. `Toko Digital Maju Jaya` |
| **Token Bot Telegram** (`telegram_bot_token`) | Token dari BotFather di Langkah 4.1 |
| **Slug Pakasir** (`pakasir_slug`) | Slug proyek dari Langkah 5.2 |
| **API Key Pakasir** (`pakasir_api_key`) | API Key dari Langkah 5.2 |
| **URL Server** (`server_base_url`) | `http://IP-SERVER:3000` atau `https://domain-anda.com` |
| **Username Admin Telegram** (`store_admin_contact`) | Username Anda di Telegram (tanpa @) — untuk pelanggan kontak admin |
| **Chat ID Admin** (`admin_telegram_chat_id`) | ID dari Langkah 4.3 |
| **Channel Penjualan** (`sales_channel_id`) | (Opsional) `@namaChannel` atau `-100xxxxxxxxx` |
| **Waktu Kadaluarsa Pembayaran** (`payment_expiry_minutes`) | `10` (menit) — pembayaran auto-cancel kalau lewat |
| **Batas Stok Rendah** (`stock_low_threshold`) | `5` — alert kalau stok di bawah angka ini |
| **Pembayaran Aktif** (`payment_enabled`) | `true` |
| **Kupon Aktif** (`coupon_enabled`) | `true` atau `false` |
| **Webhook Secret** (`webhook_secret`) | String acak dari Langkah 5.3 |

Klik **Simpan** di setiap section.

### 7.3 Restart bot

Setelah semua diisi, kembali ke **Settings** → klik tombol **Restart Bot** (atau tunggu beberapa detik — bot akan auto-detect token).

Cek status bot di pojok atas — harus **🟢 Bot Aktif**.

### 7.4 Test bot

Buka Telegram → cari username bot Anda → klik **Start**. Bot harus balas dengan pesan welcome.

---

## 8. LANGKAH 6 — TAMBAH PRODUK, VARIAN & STOK

### 8.1 Tambah produk

1. Sidebar → **Products** → klik **+ Tambah Produk**.
2. Isi: nama, deskripsi, upload gambar (opsional).
3. Aktifkan toggle **Aktif**.
4. **Simpan**.

### 8.2 Tambah varian (paket harga)

1. Klik produk yang baru dibuat → tab **Varian**.
2. Klik **+ Tambah Varian**.
3. Isi:
   - **Nama varian** (mis. `1 Bulan`)
   - **Harga** (dalam Rupiah, mis. `25000`)
   - **S&K** (syarat & ketentuan, opsional)
4. **Simpan**.

> Satu produk bisa punya banyak varian (1 bulan, 3 bulan, 1 tahun, dll).

### 8.3 Isi stok varian

1. Sidebar → **Manajemen Stok**.
2. Pilih varian → klik **Tambah Stok**.
3. Paste isi stok (akun, key, voucher, dll) — **satu item per baris**:

   ```
   email1@gmail.com|password1
   email2@gmail.com|password2
   email3@gmail.com|password3
   ```

4. **Simpan**.

Setiap order yang sukses akan **auto-pop** satu baris stok ke pelanggan, dan stok berkurang otomatis.

### 8.4 (Opsional) Buat kupon diskon

Sidebar → **Kupon & Diskon** → **+ Tambah Kupon**:

- **Kode**: `HEMAT10` (yang akan diketik pelanggan)
- **Tipe diskon**: persen / nominal
- **Nilai**: `10` (artinya 10% atau Rp 10.000 tergantung tipe)
- **Min. order**: `0` (atau minimal Rp tertentu)
- **Maks. pemakaian**: `100` (kosongkan = unlimited)
- **Berlaku sampai**: pilih tanggal
- **Aktif**: ✅

### 8.5 (Opsional) Edit pesan bot

Sidebar → **Bot Messages** untuk customize teks: welcome, header produk, sukses bayar, expired, dll. Gunakan placeholder `{store_name}` untuk auto-isi nama toko.

---

## 9. LANGKAH 7 — SET CALLBACK URL PAKASIR

Agar pembayaran otomatis terdeteksi, Pakasir perlu kirim notifikasi (webhook) ke server Anda.

1. Login ke dashboard **Pakasir**.
2. Buka detail proyek → cari section **Callback URL** atau **Webhook URL**.
3. Isi dengan:

   ```
   https://domain-anda.com/api/webhook/pakasir?secret=WEBHOOK_SECRET_ANDA
   ```

   Atau kalau belum pakai domain:
   ```
   http://IP-SERVER:3000/api/webhook/pakasir?secret=WEBHOOK_SECRET_ANDA
   ```

   Ganti `WEBHOOK_SECRET_ANDA` dengan nilai dari Langkah 5.3 / 7.2.

4. **Simpan**.

> ⚠️ Pakasir biasanya **mengharuskan HTTPS** di production. Pasang SSL dulu (lihat Bagian 11).

---

## 10. LANGKAH 8 — UJI COBA END-TO-END

### Skenario test:

1. **Tambah produk test** — `Produk Demo` dengan varian `Test 1000` harga `Rp 1.000`.
2. **Isi stok 1 baris** — `INI_PRODUK_TEST_1`.
3. Buka Telegram → bot Anda → ketik `/start`.
4. Klik **Lihat Produk** → pilih `Produk Demo` → varian → **Beli**.
5. Bot kirim **QR Code** → scan & bayar dengan e-wallet QRIS apa saja (DANA/OVO/GoPay/dll).
6. Setelah bayar, bot harus:
   - Kirim pesan **"Pembayaran berhasil!"**
   - Kirim isi stok (`INI_PRODUK_TEST_1`)
7. Cek admin panel → **Orders** → status harus **paid/completed**.
8. Cek **Manajemen Stok** → stok berkurang 1.
9. Anda harus dapat notifikasi DM dari bot di Telegram (kalau Chat ID admin sudah diisi).

### ✅ Kalau semua OK → bot Anda siap dipakai jualan!

---

## 11. PEMELIHARAAN & OPERASIONAL HARIAN

### 11.1 Pasang HTTPS (sangat disarankan)

Install Nginx + Let's Encrypt:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Buat file `/etc/nginx/sites-available/bot-store`:

```nginx
server {
    listen 80;
    server_name domain-anda.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Aktifkan & dapatkan SSL:

```bash
ln -s /etc/nginx/sites-available/bot-store /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d domain-anda.com
```

Setelah itu update **URL Server** di admin panel → `https://domain-anda.com` dan callback Pakasir juga jadi HTTPS.

### 11.2 Backup data berkala

**Cara 1 — via admin panel:**
- Sidebar → **Settings** → **Export → Backup** → download file JSON.

**Cara 2 — via Supabase:**
- Dashboard Supabase → **Database** → **Backups** → bisa download otomatis (di plan free, retensi 7 hari).

**Cara 3 — manual SQL dump:**
```bash
pg_dump 'postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres' > backup-$(date +%F).sql
```

Saran: backup minimal **1× seminggu** ke Google Drive / Dropbox.

### 11.3 Update aplikasi (kalau ada versi baru)

```bash
cd /root
# backup .env dulu!
cp bot-store/.env env-backup
# extract paket baru
tar -xzf bot-store-deploy-updated-NEW.tar.gz
# kembalikan .env
cp env-backup bot-store/.env
# restart
pm2 restart bot-store
```

### 11.4 Monitoring

```bash
pm2 status              # cek apakah aplikasi hidup
pm2 logs bot-store      # lihat log real-time
pm2 monit               # dashboard CPU/RAM
```

### 11.5 Restart aplikasi

```bash
pm2 restart bot-store
```

### 11.6 Stop aplikasi

```bash
pm2 stop bot-store
```

---

## 12. TROUBLESHOOTING (ERROR & SOLUSINYA)

### ❌ "Cannot connect to database"

**Penyebab:** `DATABASE_URL` salah atau Supabase belum mengizinkan koneksi.

**Solusi:**
- Pastikan password di `DATABASE_URL` benar.
- Pastikan ada `?sslmode=require` di akhir.
- Cek di Supabase: **Settings → Database → Connection pooler** — pakai mode **Session**.

### ❌ "relation 'orders' does not exist"

**Penyebab:** SQL schema belum dijalankan di Supabase.

**Solusi:** Ulangi Langkah 3.2.

### ❌ Bot tidak balas saat di-/start

**Penyebab umum:**
- Token bot salah.
- Bot belum di-restart setelah simpan token.
- Bot sudah dipakai di server lain (1 token = 1 server).

**Solusi:**
- Cek log: `pm2 logs bot-store`
- Cari pesan `"Bot started"` atau error.
- Klik **Restart Bot** di admin panel.

### ❌ Pembayaran sukses tapi bot tidak kirim produk

**Penyebab:** Webhook Pakasir tidak masuk ke server.

**Solusi:**
- Cek **Callback URL** di Pakasir — harus `https://...` (production wajib HTTPS).
- Cek log: `pm2 logs bot-store | grep webhook`.
- Pastikan port 80/443 terbuka di firewall.
- Pastikan `webhook_secret` di Pakasir = nilai di admin panel.

### ❌ Upload gambar gagal

**Penyebab:** Folder upload tidak writable.

**Solusi:** Tambahkan ke `.env`:
```
ASSETS_DIR=/tmp/bot-assets
```
Lalu `pm2 restart bot-store`.

### ❌ Port 3000 already in use

**Solusi:** Ubah `PORT` di `.env` ke port lain (mis. `3030`), restart.

### ❌ "Out of memory"

**Solusi:** Upgrade RAM VPS, atau tambah swap:
```bash
fallocate -l 1G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 13. FAQ

**Q: Apakah saya bisa pakai database lain selain Supabase?**
A: Bisa. App ini pakai PostgreSQL. Bisa pakai Neon, Railway, ElephantSQL, atau PostgreSQL self-hosted. Cukup ganti `DATABASE_URL`.

**Q: Apakah bisa jalankan beberapa bot di 1 server?**
A: Bisa. Salin folder `bot-store` ke nama lain (`bot-store-2`), ubah `PORT` di `.env`-nya, jalankan dengan PM2 nama berbeda.

**Q: Apakah bot bisa multi-bahasa?**
A: Bahasa pesan bot bisa di-edit lewat menu **Bot Messages** di admin panel.

**Q: Saya lupa password admin?**
A: Edit `.env` di server → ubah `ADMIN_PASSWORD` → restart. Tidak perlu reset database.

**Q: Apakah Supabase free tier cukup?**
A: Cukup untuk mulai. Free tier: 500 MB DB, 2 GB transfer/bulan. Bisa di-upgrade kapan saja.

**Q: Berapa biaya transaksi Pakasir?**
A: Cek di pakasir.com — biasanya MDR QRIS sekitar 0.7%.

**Q: Apakah saya bisa pakai gateway lain selain Pakasir?**
A: Versi ini terkunci ke Pakasir. Untuk gateway lain, hubungi developer.

---

## 14. KONTAK & DUKUNGAN

Jika ada kendala teknis di luar dokumen ini, hubungi:

- **Telegram:** _(diisi oleh penjual)_
- **WhatsApp:** _(diisi oleh penjual)_
- **Email:** _(diisi oleh penjual)_

---

> **Selamat berjualan!** 🚀
>
> Dokumen ini boleh di-customize ulang dengan logo & kontak Anda sendiri sebelum diberikan ke pelanggan.

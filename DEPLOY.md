# Deploy Guide — TelexWeb Central (Fase 4)

Cara deploy semua komponen ke production.

---

## 1. Push Code to GitHub 🔼

Jalankan di folder `telexweb-central/`:

```bash
cd /d/9router/PROJECTBARU/STOKALLSTORE/telexweb-central

git init
git add .
git commit -m "feat: fase 3 - integrasi Jokowhy + Central Stock"
git remote add origin https://github.com/theaamanager-tech/telexweb-central.git
git branch -M main
git push -u origin main --force
```

---

## 2. Setup Supabase Projects 🗄️

Bikin **3 project Supabase** baru:

| Project | Name | Schema File |
|---------|------|-------------|
| **Central DB** | `telexweb-central` | `database/01-central-schema.sql` |
| **Web Store DB** | `toko-web` | `database/03-store-web-schema.sql` |
| **Telegram DB** | `toko-telegram` | `database/02-store-tele-schema.sql` |

**Langkah:**
1. Buka https://supabase.com → New project
2. Isi name, password, region (Singapore)
3. Tunggu 2-3 menit sampai jadi
4. SQL Editor → paste schema → Run
5. Catet: `Project URL`, `Anon Key`, `Service Role Key`

---

## 3. Deploy Central Panel ke Vercel 🚀

1. Buka https://vercel.com → Add New → Project
2. Import repo `telexweb-central`
3. Root Directory: pilih `central`
4. Environment Variables:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL Central DB |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Central DB |
| `SUPABASE_URL` | Project URL Central DB |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Central DB |
| `ADMIN_PASSWORD` | Password login panel (terserah) |

5. Deploy! 🎉

**Catet URL:** `https://central-xxx.vercel.app` — ini Central API URL-nya

---

## 4. Deploy Web Store ke Vercel 🚀

1. Vercel → Add New → Project → `telexweb-central`
2. Root Directory: pilih `stores/web`
3. Environment Variables:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | Project URL Web Store DB |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Web Store DB |
| `ADMIN_KEY` | Password admin panel web store |

4. Deploy! 🎉

---

## 5. Setup VPS — Telegram Bot 💻

SSH ke VPS, lalu jalankan:

```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Setup DB
sudo -u postgres psql -c "CREATE USER botstore WITH PASSWORD 'botstore123';"
sudo -u postgres psql -c "CREATE DATABASE botstore_db OWNER botstore;"
```

**Di lokal** — kirim file ke VPS:

```bash
# Dari folder telexweb-central, kirim folder stores/telegram ke VPS
scp -r stores/telegram user@vps-ip:/app/bot-store/
```

**Di VPS** — jalankan:

```bash
cd /app/bot-store

# Apply schema
PGPASSWORD=botstore123 psql -h localhost -U botstore -d botstore_db -f schema.sql

# Buat .env
cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://botstore:botstore123@localhost:5432/botstore_db
TELEGRAM_BOT_TOKEN=token_bot_dari_botfather
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ganti_password
SESSION_SECRET=rahasia_sesi_acak
PORT=3000
ENVEOF

# Start via PM2
pm2 start start.sh --name bot-store --interpreter bash
pm2 save
pm2 startup
```

**Domain + Nginx (opsional):**

```nginx
server {
    listen 80;
    server_name bot.domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. Konfigurasi Integrasi 🔗

### 6.1. Central Panel → Generate API Key
1. Buka `https://central-xxx.vercel.app`
2. Login dengan password ADMIN_PASSWORD
3. Sidebar → **API Keys**
4. Tambah 2 toko:
   - **Jokowhy** → tipe Telegram → Generate → **COPY KEY!**
   - **Verdant°** → tipe Website → Generate → **COPY KEY!**

### 6.2. Web Store → Connect Central
1. Buka admin panel toko web: `https://web-xxx.vercel.app/kontrol.html`
2. Login
3. Menu → **Central Stock**
4. Isi:
   - Central API URL: `https://central-xxx.vercel.app`
   - API Key: key Verdant° tadi
5. Test Koneksi → Simpan

### 6.3. Telegram Bot → Connect Central
1. Buka admin panel bot: `https://bot.domain.com/admin/central`
   (atau via domain VPS: `http://vps-ip:3000/admin/central`)
2. Isi:
   - Central API URL: `https://central-xxx.vercel.app`
   - API Key: key Jokowhy tadi
3. Test Koneksi → Simpan

---

## 7. Mapping Product SKU 🔄

### Web Store
1. Admin panel → Products
2. Edit variant → isi **SKU** sesuai Central (contoh: `CC-7D`)
3. Save

### Telegram Bot
1. Admin panel → Products
2. Pilih variant → isi **SKU** sesuai Central
3. Save

---

## 8. Test End-to-End ✅

| No | Test | Cara | Status |
|----|------|------|--------|
| 1 | Tambah stok | Central Panel → pilih varian → Tambah Stok | |
| 2 | Cek web store | Buka toko web → stok muncul | |
| 3 | Cek telegram | Kirim `/start` → Cek Stok → stok muncul | |
| 4 | Beli via web | Pilih produk → QRIS → bayar → credential terkirim | |
| 5 | Beli via tele | Pilih produk → QRIS → bayar → credential terkirim | |
| 6 | Log Central | Buka Central Panel → Riwayat → log claim muncul | |

---

## Files Changed in Repo

| File | Perubahan |
|------|-----------|
| `stores/telegram/api-server/dist/central.js` | **Baru** — Central API client |
| `stores/telegram/api-server/dist/central-admin.html` | **Baru** — Halaman admin Central config |
| `stores/telegram/api-server/dist/index.mjs` | **Patch** — 4 fungsi + admin routes |
| `stores/telegram/schema.sql` | **Edit** — tambah sku + central settings |

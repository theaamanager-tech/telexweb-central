#!/usr/bin/env bash
###############################################################################
#  TELEGRAM BOT STORE — AUTO INSTALLER (Bahasa Indonesia)
#  -------------------------------------------------------
#  Penggunaan:
#    bash install.sh                      # interaktif (rekomendasi)
#    bash install.sh --non-interactive    # pakai .env existing tanpa tanya
#    bash install.sh --reset              # mulai dari awal (hapus .env lama)
#
#  Kompatibel: Ubuntu/Debian, root maupun user dengan sudo.
#  Untuk OS lain (Alpine, CentOS) — Node.js & PM2 harus diinstall manual dulu.
###############################################################################

set -e

# ----------------------- WARNA & HELPER --------------------------------------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()    { echo -e "${CYAN}[i]${NC} $*"; }
ok()     { echo -e "${GREEN}[✓]${NC} $*"; }
warn()   { echo -e "${YELLOW}[!]${NC} $*"; }
err()    { echo -e "${RED}[✗]${NC} $*" >&2; }
hr()     { echo -e "${BLUE}────────────────────────────────────────────────────────${NC}"; }
title()  { hr; echo -e "${BOLD}$*${NC}"; hr; }

ask() {
  # ask "Pertanyaan" "default"
  local prompt="$1" default="$2" answer
  if [ -n "$default" ]; then
    read -r -p "$(echo -e "${BOLD}?${NC} $prompt ${YELLOW}[$default]${NC}: ")" answer
    echo "${answer:-$default}"
  else
    read -r -p "$(echo -e "${BOLD}?${NC} $prompt: ")" answer
    echo "$answer"
  fi
}

ask_secret() {
  local prompt="$1" answer
  read -r -s -p "$(echo -e "${BOLD}?${NC} $prompt: ")" answer
  echo "" >&2
  echo "$answer"
}

confirm() {
  # confirm "Pertanyaan" → return 0 kalau ya
  local prompt="$1" answer
  read -r -p "$(echo -e "${BOLD}?${NC} $prompt ${YELLOW}[y/N]${NC}: ")" answer
  [[ "$answer" =~ ^[yY]([eE][sS])?$ ]]
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1
}

run_root() {
  if [ "$EUID" -eq 0 ]; then
    "$@"
  elif require_cmd sudo; then
    sudo "$@"
  else
    err "Perintah ini butuh root: $*"
    err "Install ulang dengan sudo, atau install dependency manual."
    exit 1
  fi
}

# ----------------------- ARGUMEN ---------------------------------------------
NON_INTERACTIVE=false
RESET=false
for arg in "$@"; do
  case "$arg" in
    --non-interactive) NON_INTERACTIVE=true ;;
    --reset)           RESET=true ;;
    -h|--help)
      head -15 "$0" | tail -13 | sed 's/^# \?//'
      exit 0 ;;
  esac
done

# ----------------------- BANNER ----------------------------------------------
clear || true
cat <<'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║       TELEGRAM BOT STORE — AUTO INSTALLER                    ║
║       Toko Digital Otomatis via Bot Telegram                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo ""
log "Skrip ini akan menyiapkan bot-store dari nol di server Anda."
log "Estimasi waktu: 5–10 menit (tergantung kecepatan internet)."
echo ""

# ----------------------- 1. DETEKSI ENVIRONMENT -------------------------------
title "1/8 ▸ Pemeriksaan environment"

OS_ID="unknown"
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS_ID="${ID:-unknown}"
fi
log "OS terdeteksi: ${BOLD}${OS_ID}${NC}"

ARCH=$(uname -m)
log "Arsitektur:   ${BOLD}${ARCH}${NC}"

if [ "$EUID" -eq 0 ]; then
  log "Hak akses:    ${BOLD}root${NC}"
elif require_cmd sudo; then
  log "Hak akses:    ${BOLD}user + sudo${NC}"
else
  warn "Anda bukan root dan tidak ada sudo. Beberapa langkah mungkin gagal."
fi
echo ""

# ----------------------- 2. CARI / EKSTRAK PAKET -----------------------------
title "2/8 ▸ Lokasi paket bot-store"

# Auto detect — kalau script dijalankan dari folder bot-store, pakai itu
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR=""

if [ -f "$SCRIPT_DIR/api-server/dist/index.mjs" ]; then
  APP_DIR="$SCRIPT_DIR"
  ok "Paket terdeteksi otomatis di: $APP_DIR"
elif [ -f "$SCRIPT_DIR/bot-store/api-server/dist/index.mjs" ]; then
  APP_DIR="$SCRIPT_DIR/bot-store"
  ok "Paket terdeteksi di: $APP_DIR"
else
  log "Paket bot-store tidak ditemukan otomatis."
  if $NON_INTERACTIVE; then
    err "Mode non-interactive — paket tidak ditemukan. Keluar."
    exit 1
  fi
  TARBALL=$(ask "Path ke file .tar.gz bot-store" "")
  if [ -z "$TARBALL" ] || [ ! -f "$TARBALL" ]; then
    err "File tidak ditemukan: $TARBALL"
    exit 1
  fi
  TARGET=$(ask "Folder tujuan ekstrak" "$HOME/bot-store")
  mkdir -p "$TARGET"
  log "Mengekstrak..."
  tar -xzf "$TARBALL" -C "$(dirname "$TARGET")"
  # tar mungkin extract ke folder bot-store/ di dalam target
  if [ -f "$TARGET/api-server/dist/index.mjs" ]; then
    APP_DIR="$TARGET"
  elif [ -f "$(dirname "$TARGET")/bot-store/api-server/dist/index.mjs" ]; then
    APP_DIR="$(dirname "$TARGET")/bot-store"
  else
    err "Struktur paket tidak dikenal — gagal ekstrak."
    exit 1
  fi
  ok "Paket diekstrak ke: $APP_DIR"
fi

cd "$APP_DIR"

# ----------------------- 3. INSTALL DEPENDENCIES -----------------------------
title "3/8 ▸ Pemeriksaan dependency (Node.js, PM2, dsb)"

# Node.js
if require_cmd node; then
  NODE_V=$(node -v | sed 's/v//')
  NODE_MAJ=${NODE_V%%.*}
  if [ "$NODE_MAJ" -lt 20 ]; then
    warn "Node.js versi $NODE_V ditemukan, tapi minimal v20 dibutuhkan."
    if [ "$OS_ID" = "ubuntu" ] || [ "$OS_ID" = "debian" ]; then
      if confirm "Upgrade Node.js ke v20?"; then
        run_root bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
        run_root apt-get install -y nodejs
      fi
    else
      warn "Auto-install Node.js hanya didukung Ubuntu/Debian. Silakan upgrade manual."
    fi
  else
    ok "Node.js v$NODE_V — OK"
  fi
else
  warn "Node.js belum terinstal."
  if [ "$OS_ID" = "ubuntu" ] || [ "$OS_ID" = "debian" ]; then
    if confirm "Install Node.js v20 sekarang?"; then
      run_root bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
      run_root apt-get install -y nodejs
      ok "Node.js terinstal: $(node -v)"
    else
      err "Tidak bisa lanjut tanpa Node.js."
      exit 1
    fi
  else
    err "OS tidak didukung untuk auto-install Node.js. Silakan install manual lalu re-run."
    exit 1
  fi
fi

# curl (untuk test koneksi)
require_cmd curl || run_root apt-get install -y curl

# openssl (untuk generate session secret)
if ! require_cmd openssl; then
  warn "openssl tidak ada — SESSION_SECRET akan di-generate via /dev/urandom."
fi

# psql (opsional — untuk auto-apply schema)
HAS_PSQL=false
if require_cmd psql; then
  HAS_PSQL=true
  ok "psql tersedia — bisa apply schema otomatis."
else
  log "psql tidak ada (opsional). Schema bisa di-apply manual via Supabase SQL Editor."
fi

# PM2 (opsional)
HAS_PM2=false
if require_cmd pm2; then
  HAS_PM2=true
  ok "PM2 tersedia."
fi

echo ""

# ----------------------- 4. KONFIGURASI .env ---------------------------------
title "4/8 ▸ Konfigurasi aplikasi (.env)"

ENV_FILE="$APP_DIR/.env"

if [ -f "$ENV_FILE" ] && ! $RESET; then
  if $NON_INTERACTIVE; then
    log "Mode non-interactive: pakai .env yang sudah ada."
    SKIP_ENV=true
  elif confirm "File .env sudah ada. Pakai yang ada (tanpa modifikasi)?"; then
    SKIP_ENV=true
  fi
fi

if [ "${SKIP_ENV:-false}" != true ]; then
  echo ""
  log "Sekarang isi konfigurasi. Tekan Enter untuk pakai default."
  echo ""

  # DATABASE_URL
  echo -e "${BOLD}DATABASE_URL${NC}"
  echo "  Format Supabase:"
  echo "  postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres?sslmode=require"
  DB_URL=""
  while [ -z "$DB_URL" ]; do
    DB_URL=$(ask "DATABASE_URL" "")
    if [ -z "$DB_URL" ]; then
      warn "DATABASE_URL wajib diisi."
    fi
  done

  # Auto-tambah ?sslmode=require untuk Supabase
  if [[ "$DB_URL" == *"supabase.co"* ]] && [[ "$DB_URL" != *"sslmode="* ]]; then
    DB_URL="${DB_URL}?sslmode=require"
    log "Auto-menambahkan ?sslmode=require (terdeteksi Supabase)"
  fi
  echo ""

  # ADMIN_USERNAME
  ADMIN_USER=$(ask "Username admin" "admin")
  echo ""

  # ADMIN_PASSWORD
  echo -e "${BOLD}Password admin${NC} (kosongkan untuk auto-generate kuat)"
  ADMIN_PASS=$(ask_secret "ADMIN_PASSWORD")
  if [ -z "$ADMIN_PASS" ]; then
    if require_cmd openssl; then
      ADMIN_PASS=$(openssl rand -base64 12 | tr -d '/+=' | cut -c1-14)
    else
      ADMIN_PASS=$(head -c 14 /dev/urandom | base64 | tr -d '/+=' | cut -c1-14)
    fi
    log "Password di-generate: ${BOLD}${ADMIN_PASS}${NC}"
    log "  ⚠ CATAT password ini sekarang juga!"
  fi
  echo ""

  # SESSION_SECRET (auto-generate)
  if require_cmd openssl; then
    SESSION_SECRET=$(openssl rand -hex 32)
  else
    SESSION_SECRET=$(head -c 32 /dev/urandom | xxd -p | tr -d '\n')
  fi
  ok "SESSION_SECRET di-generate (64 karakter)"
  echo ""

  # PORT
  PORT=$(ask "PORT aplikasi" "3000")
  echo ""

  # ASSETS_DIR (untuk hindari masalah upload)
  ASSETS_DIR=$(ask "Folder upload aset (gambar produk, dll)" "$APP_DIR/uploads")
  mkdir -p "$ASSETS_DIR"

  # Tulis .env
  cat > "$ENV_FILE" <<EOF
DATABASE_URL=$DB_URL
ADMIN_USERNAME=$ADMIN_USER
ADMIN_PASSWORD=$ADMIN_PASS
SESSION_SECRET=$SESSION_SECRET
PORT=$PORT
ASSETS_DIR=$ASSETS_DIR
EOF
  chmod 600 "$ENV_FILE"
  ok "File .env tersimpan di $ENV_FILE (mode 600)"
fi

# Re-load env untuk langkah berikutnya
set -a; . "$ENV_FILE"; set +a

# ----------------------- 5. TEST DATABASE & APPLY SCHEMA ---------------------
title "5/8 ▸ Pengujian koneksi database & apply schema"

# Cari schema.sql
SCHEMA_FILE=""
for p in "$APP_DIR/schema.sql" "$APP_DIR/docs/schema.sql" "$SCRIPT_DIR/schema.sql"; do
  [ -f "$p" ] && SCHEMA_FILE="$p" && break
done

if [ -z "$SCHEMA_FILE" ]; then
  warn "schema.sql tidak ditemukan di paket. Anda harus apply schema manual."
fi

if $HAS_PSQL && [ -n "$SCHEMA_FILE" ]; then
  log "Test koneksi ke database..."
  if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
    ok "Koneksi DB berhasil."
    log "Apply schema (idempotent — aman walau tabel sudah ada)..."
    if psql "$DATABASE_URL" -f "$SCHEMA_FILE" >/dev/null 2>&1; then
      ok "Schema berhasil di-apply."
    else
      warn "Apply schema gagal. Apply manual via Supabase SQL Editor."
    fi
  else
    warn "Tidak bisa connect ke database. Cek DATABASE_URL & koneksi internet."
    warn "Anda tetap bisa lanjut — aplikasi akan retry saat start."
  fi
else
  echo ""
  warn "psql tidak tersedia → SKIP auto-apply schema."
  echo ""
  echo "  ${BOLD}LANGKAH MANUAL untuk apply schema:${NC}"
  echo ""
  echo "  1. Buka Supabase Dashboard project Anda"
  echo "  2. Klik ${BOLD}SQL Editor${NC} di sidebar kiri"
  echo "  3. Klik ${BOLD}+ New query${NC}"
  echo "  4. Copy-paste isi file:"
  echo "     ${YELLOW}${SCHEMA_FILE:-$APP_DIR/schema.sql}${NC}"
  echo "  5. Klik tombol ${BOLD}Run${NC} (Ctrl+Enter)"
  echo ""
  if ! $NON_INTERACTIVE; then
    if confirm "Sudah apply schema? (atau lewati & lanjut)"; then
      ok "OK, lanjut."
    fi
  fi
fi
echo ""

# ----------------------- 6. PILIH METODE RUN ---------------------------------
title "6/8 ▸ Cara menjalankan aplikasi"

RUN_MODE="pm2"
if ! $NON_INTERACTIVE; then
  echo "Pilih cara menjalankan bot-store:"
  echo "  ${BOLD}1${NC}) PM2     — auto-restart, auto-start saat reboot ${GREEN}(rekomendasi VPS)${NC}"
  echo "  ${BOLD}2${NC}) systemd — service Linux native"
  echo "  ${BOLD}3${NC}) nohup   — sederhana, jalan di background tanpa tool tambahan"
  echo "  ${BOLD}4${NC}) skip    — saya jalankan sendiri nanti dengan: bash start.sh"
  echo ""
  CHOICE=$(ask "Pilihan (1/2/3/4)" "1")
  case "$CHOICE" in
    1) RUN_MODE="pm2" ;;
    2) RUN_MODE="systemd" ;;
    3) RUN_MODE="nohup" ;;
    4) RUN_MODE="skip" ;;
    *) RUN_MODE="pm2" ;;
  esac
fi

case "$RUN_MODE" in
  pm2)
    if ! $HAS_PM2; then
      log "Install PM2 secara global..."
      run_root npm install -g pm2
      HAS_PM2=true
    fi
    # Stop instance lama kalau ada
    pm2 delete bot-store >/dev/null 2>&1 || true
    pm2 start "$APP_DIR/start.sh" --name bot-store --interpreter bash
    pm2 save >/dev/null
    ok "Bot-store berjalan via PM2."
    log "Pasang auto-start di reboot:"
    PM2_STARTUP_CMD=$(pm2 startup 2>&1 | grep -E '^sudo' | tail -1)
    if [ -n "$PM2_STARTUP_CMD" ]; then
      echo "  ${YELLOW}$ $PM2_STARTUP_CMD${NC}"
      if ! $NON_INTERACTIVE && confirm "Jalankan command tersebut sekarang?"; then
        eval "$PM2_STARTUP_CMD"
        pm2 save >/dev/null
        ok "Auto-start saat reboot diaktifkan."
      fi
    fi
    ;;

  systemd)
    SVC_FILE=/etc/systemd/system/bot-store.service
    log "Membuat service file: $SVC_FILE"
    run_root tee "$SVC_FILE" >/dev/null <<EOF
[Unit]
Description=Telegram Bot Store
After=network.target

[Service]
Type=simple
User=$(id -un)
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=$(command -v node) --max-old-space-size=512 $APP_DIR/api-server/dist/index.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
    run_root systemctl daemon-reload
    run_root systemctl enable --now bot-store
    sleep 2
    if run_root systemctl is-active --quiet bot-store; then
      ok "Service bot-store aktif & enabled."
    else
      err "Service gagal start. Cek: sudo journalctl -u bot-store -n 50"
    fi
    ;;

  nohup)
    pkill -f "api-server/dist/index.mjs" 2>/dev/null || true
    sleep 1
    nohup bash "$APP_DIR/start.sh" > "$APP_DIR/bot-store.log" 2>&1 &
    sleep 3
    if pgrep -f "api-server/dist/index.mjs" >/dev/null; then
      ok "Bot-store berjalan di background. Log: $APP_DIR/bot-store.log"
      warn "Mode nohup TIDAK auto-restart kalau crash. Pakai PM2/systemd untuk produksi."
    else
      err "Bot-store gagal start. Cek log: $APP_DIR/bot-store.log"
    fi
    ;;

  skip)
    log "OK, jalankan sendiri: cd $APP_DIR && bash start.sh"
    ;;
esac
echo ""

# ----------------------- 7. FIREWALL (OPSIONAL) ------------------------------
title "7/8 ▸ Firewall (opsional)"

if require_cmd ufw; then
  if ! $NON_INTERACTIVE && confirm "Buka port $PORT di firewall (ufw)?"; then
    run_root ufw allow "$PORT"/tcp >/dev/null
    run_root ufw allow 22/tcp >/dev/null
    ok "Port $PORT & 22 (SSH) diizinkan."
    if ! run_root ufw status | grep -q "Status: active"; then
      if confirm "Aktifkan firewall sekarang?"; then
        run_root ufw --force enable >/dev/null
        ok "Firewall aktif."
      fi
    fi
  fi
else
  log "ufw tidak ada — silakan atur firewall sesuai cloud provider Anda (Security Group/Network)."
fi
echo ""

# ----------------------- 8. RINGKASAN ----------------------------------------
title "8/8 ▸ ✓ INSTALASI SELESAI"

# Coba ambil IP publik
PUBLIC_IP=$(curl -s -m 3 ifconfig.me 2>/dev/null || curl -s -m 3 ipinfo.io/ip 2>/dev/null || echo "IP-SERVER")

cat <<EOF

${GREEN}${BOLD}🎉 Bot-Store Anda siap!${NC}

  ${BOLD}URL Admin Panel:${NC}     http://${PUBLIC_IP}:${PORT}
  ${BOLD}Username:${NC}            ${ADMIN_USERNAME}
  ${BOLD}Password:${NC}            ${ADMIN_PASSWORD}
  ${BOLD}Folder aplikasi:${NC}     ${APP_DIR}
  ${BOLD}File konfigurasi:${NC}    ${APP_DIR}/.env

${BOLD}LANGKAH SELANJUTNYA:${NC}

  1. Buka Admin Panel di browser & login.
  2. Masuk menu ${BOLD}Settings${NC}, isi:
       • Token Bot Telegram (dari @BotFather)
       • Slug Pakasir & API Key
       • URL Server (URL publik domain/IP server ini)
       • Username admin Telegram & Chat ID
  3. Tambah produk → varian → stok di menu ${BOLD}Products${NC}.
  4. Set Callback URL Pakasir ke:
       http://${PUBLIC_IP}:${PORT}/api/webhook/pakasir?secret=WEBHOOK_SECRET
  5. Test bot di Telegram → /start.

${BOLD}PERINTAH BERGUNA:${NC}

EOF

case "$RUN_MODE" in
  pm2)
    cat <<EOF
  pm2 status              → cek status
  pm2 logs bot-store      → lihat log live
  pm2 restart bot-store   → restart
  pm2 stop bot-store      → matikan
EOF
    ;;
  systemd)
    cat <<EOF
  systemctl status bot-store      → cek status
  journalctl -u bot-store -f      → lihat log live
  systemctl restart bot-store     → restart
  systemctl stop bot-store        → matikan
EOF
    ;;
  nohup)
    cat <<EOF
  tail -f $APP_DIR/bot-store.log    → lihat log
  pkill -f api-server/dist/index    → matikan
  bash start.sh                     → start lagi
EOF
    ;;
esac

echo ""
echo -e "${YELLOW}Disarankan pasang HTTPS via Nginx + Let's Encrypt — lihat PANDUAN-INSTALASI.pdf bagian 11.1.${NC}"
echo ""
echo -e "${GREEN}Selamat berjualan! 🚀${NC}"
echo ""

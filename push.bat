@echo off
cd /d D:\9router\PROJECTBARU\STOKALLSTORE\telexweb-central

echo === Init Git ===
git init

echo === Add Remote ===
git remote add origin https://github.com/theaamanager-tech/telexweb-central.git

echo === Add All Files ===
git add .

echo === Commit ===
git commit -m "feat: fase 3-4 - semua toko connect Central + deploy guide"

echo === Push ===
git branch -M main
git push -u origin main --force

echo.
echo Selesai! Kalau ada error login, login dulu ya.
pause

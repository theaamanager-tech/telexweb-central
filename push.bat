@echo off
cd /d D:\9router\PROJECTBARU\STOKALLSTORE\telexweb-central

echo ==============================
echo   PUSH TELEXWEB CENTRAL
echo ==============================

echo [1/3] Hapus embedded .git...
if exist central\.git rmdir /s /q central\.git
if exist stores\telegram\.git rmdir /s /q stores\telegram\.git
echo   OK

echo [2/3] Copy stores\web...
if not exist stores\web (
  if exist ..\stores\web (
    xcopy /E /I /Y ..\stores\web stores\web >nul
  )
)
echo   OK

echo [3/3] Git add + commit + push...
git add .
git commit -m "feat: full telexweb - all stores + central"
git branch -M main
git push -u origin main --force

echo.
if %errorlevel% equ 0 (echo BERHASIL!) else (echo GAGAL!)
pause

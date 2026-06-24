@echo off
cd /d D:\9router\PROJECTBARU\STOKALLSTORE\telexweb-central

echo ==============================
echo   FIX SUBMODULE + PUSH ULANG
echo ==============================

echo [1/5] Remove dari index git (submodule)...
git rm -r --cached central >nul 2>&1
git rm -r --cached stores/telegram >nul 2>&1
git rm -r --cached stores/web >nul 2>&1
echo   OK

echo [2/5] Hapus .git embedded...
if exist central\.git rmdir /s /q central\.git
if exist stores\telegram\.git rmdir /s /q stores\telegram\.git
echo   OK

echo [3/5] Copy stores\web...
if not exist stores\web (
  if exist ..\stores\web (
    xcopy /E /I /Y ..\stores\web stores\web >nul
  )
)
echo   OK

echo [4/5] Hapus .gitignore (kalo ada)...
if exist .gitignore del /f /q .gitignore 2>nul
echo   OK

echo [5/5] Git add + commit + push...
git add -A
git commit -m "fix: full source - hapus submodule, pake folder asli"
git push -u origin main --force

echo.
if %errorlevel% equ 0 (echo BERHASIL!) else (echo GAGAL!)
pause

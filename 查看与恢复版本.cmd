@echo off
chcp 65001 >nul
cd /d "%~dp0"
call npm run versions
set /p "VERSION_ID=Version ID (Enter to cancel): "
if not defined VERSION_ID exit /b
node scripts/restore-prompt.mjs
pause

@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules (
  call npm ci
  if errorlevel 1 goto fail
)
start "" "http://127.0.0.1:5173"
call npm run dev
:fail
pause

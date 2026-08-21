@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [x] Node.js not found. Please install Node 18+ from https://nodejs.org/
  pause
  exit /b 1
)
echo Anti-Cocoon Engine starting...
echo Open http://127.0.0.1:8787 in your browser.
node server.mjs
pause

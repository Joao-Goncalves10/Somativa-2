@echo off
cd /d "%~dp0"
for /f "tokens=2,*" %%A in ('reg query "HKCU\Environment" /v MUSICFY_ADMIN_PASSWORD 2^>nul') do set "MUSICFY_ADMIN_PASSWORD=%%B"
start "MUSICFY servidor" cmd /k node server.js
start "" http://localhost:5500/index.html

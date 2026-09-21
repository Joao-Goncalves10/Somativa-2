@echo off
cd /d "%~dp0"
start "MUSICFY servidor" cmd /k node server.js
start "" http://localhost:5500/index.html

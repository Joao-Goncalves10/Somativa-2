@echo off
cd /d "%~dp0"
start "MUSICFY servidor" cmd /k npm start
start "" http://localhost:5500/

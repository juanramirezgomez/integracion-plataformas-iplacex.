@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0arrancar.ps1"
if errorlevel 1 (
    pause
    exit /b 1
)

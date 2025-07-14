@echo off
echo ========================================
echo Railway Operations System - Quick Install
echo ========================================

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo PowerShell is required but not found!
    echo Please install PowerShell or run manually.
    pause
    exit /b 1
)

echo Starting automated installation...
echo.

REM Set execution policy for this session
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force"

REM Run the deployment script
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-windows.ps1" -InstallDependencies -Port 5000

echo.
echo Installation completed!
pause
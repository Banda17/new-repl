@echo off
echo ========================================
echo Railway Operations - Production Deployment
echo ========================================

set /p db_url="Enter PostgreSQL Database URL (e.g., postgresql://user:pass@localhost:5432/railway_db): "
set /p port="Enter Port Number (default 5000): "

if "%port%"=="" set port=5000

echo.
echo Deploying with:
echo - Database: %db_url%
echo - Port: %port%
echo - Mode: Production
echo.

REM Set execution policy and run deployment
powershell -ExecutionPolicy Bypass -Command "& '%~dp0deploy-windows.ps1' -DatabaseUrl '%db_url%' -Port '%port%' -Production"

echo.
echo Production deployment completed!
pause
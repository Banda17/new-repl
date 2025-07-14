# Railway Operations Management System - Automated Windows Deployment Script
# This script handles complete setup and deployment on Windows systems

param(
    [string]$DatabaseUrl = "",
    [string]$Port = "5000",
    [switch]$Production = $false,
    [switch]$InstallDependencies = $false
)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Railway Operations System Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to install Chocolatey if not present
function Install-Chocolatey {
    Write-Host "Installing Chocolatey package manager..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
    refreshenv
}

# Function to install Node.js
function Install-NodeJS {
    Write-Host "Installing Node.js..." -ForegroundColor Yellow
    choco install nodejs -y
    refreshenv
}

# Function to install PostgreSQL
function Install-PostgreSQL {
    Write-Host "Installing PostgreSQL..." -ForegroundColor Yellow
    choco install postgresql -y
    refreshenv
    
    # Start PostgreSQL service
    Start-Service postgresql-x64-14
    
    Write-Host "Please set up PostgreSQL:" -ForegroundColor Green
    Write-Host "1. Open pgAdmin or use command line" -ForegroundColor White
    Write-Host "2. Create database: railway_operations" -ForegroundColor White
    Write-Host "3. Note down your connection details" -ForegroundColor White
}

# Function to install PM2 for process management
function Install-PM2 {
    Write-Host "Installing PM2 process manager..." -ForegroundColor Yellow
    npm install -g pm2
    npm install -g pm2-windows-startup
    pm2-startup install
}

# Function to setup environment variables
function Setup-Environment {
    Write-Host "Setting up environment variables..." -ForegroundColor Yellow
    
    $envContent = @"
# Database Configuration
DATABASE_URL=$DatabaseUrl

# Server Configuration
PORT=$Port
NODE_ENV=$( if ($Production) { "production" } else { "development" } )

# Session Configuration
SESSION_SECRET=$(Get-Random -Maximum 999999999)

# Google Service Account (if needed)
GOOGLE_SERVICE_ACCOUNT_PATH=./nimble-willow-433310-n1-f8d544889cfe.json

# Application Settings
REPLIT_DOMAINS=localhost:$Port
"@

    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "Environment file created: .env" -ForegroundColor Green
}

# Function to install project dependencies
function Install-Dependencies {
    Write-Host "Installing project dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
}

# Function to setup database
function Setup-Database {
    Write-Host "Setting up database schema..." -ForegroundColor Yellow
    
    if ([string]::IsNullOrEmpty($DatabaseUrl)) {
        Write-Host "Database URL not provided. Please set up manually:" -ForegroundColor Red
        Write-Host "1. Create PostgreSQL database" -ForegroundColor White
        Write-Host "2. Update DATABASE_URL in .env file" -ForegroundColor White
        Write-Host "3. Run: npm run db:push" -ForegroundColor White
        return
    }
    
    npm run db:push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database schema created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Database setup failed. Please check your DATABASE_URL" -ForegroundColor Red
    }
}

# Function to build the application
function Build-Application {
    Write-Host "Building application..." -ForegroundColor Yellow
    
    if ($Production) {
        npm run build
    } else {
        Write-Host "Development mode - skipping build" -ForegroundColor Yellow
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Application built successfully!" -ForegroundColor Green
    } else {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
}

# Function to create Windows service
function Create-WindowsService {
    Write-Host "Creating Windows service..." -ForegroundColor Yellow
    
    $servicePath = (Get-Location).Path
    $serviceScript = @"
const { Service } = require('node-windows');

const svc = new Service({
  name: 'Railway Operations System',
  description: 'Railway Operations Management System',
  script: '$servicePath\\server\\index.js',
  env: {
    name: 'NODE_ENV',
    value: 'production'
  }
});

svc.on('install', () => {
  console.log('Service installed');
  svc.start();
});

svc.install();
"@

    $serviceScript | Out-File -FilePath "install-service.js" -Encoding UTF8
    
    npm install -g node-windows
    node install-service.js
    
    Write-Host "Windows service created!" -ForegroundColor Green
}

# Function to start the application
function Start-Application {
    Write-Host "Starting application..." -ForegroundColor Yellow
    
    if ($Production) {
        # Production mode with PM2
        pm2 start npm --name "railway-ops" -- start
        pm2 save
        pm2 startup
    } else {
        # Development mode
        Write-Host "Starting in development mode..." -ForegroundColor Green
        Write-Host "Use Ctrl+C to stop the server" -ForegroundColor Yellow
        npm run dev
    }
}

# Function to create startup batch file
function Create-StartupScript {
    $batchContent = @"
@echo off
echo Starting Railway Operations System...
cd /d "%~dp0"
pm2 start npm --name "railway-ops" -- start
pm2 save
echo System started successfully!
pause
"@

    $batchContent | Out-File -FilePath "start-railway-system.bat" -Encoding ASCII
    
    Write-Host "Startup script created: start-railway-system.bat" -ForegroundColor Green
}

# Function to create stop script
function Create-StopScript {
    $stopBatchContent = @"
@echo off
echo Stopping Railway Operations System...
pm2 stop railway-ops
pm2 delete railway-ops
echo System stopped successfully!
pause
"@

    $stopBatchContent | Out-File -FilePath "stop-railway-system.bat" -Encoding ASCII
    
    Write-Host "Stop script created: stop-railway-system.bat" -ForegroundColor Green
}

# Function to display post-deployment instructions
function Show-Instructions {
    Write-Host "`n======================================" -ForegroundColor Cyan
    Write-Host "DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Cyan
    
    Write-Host "`nApplication Details:" -ForegroundColor Yellow
    Write-Host "- URL: http://localhost:$Port" -ForegroundColor White
    Write-Host "- Mode: $( if ($Production) { "Production" } else { "Development" } )" -ForegroundColor White
    Write-Host "- Database: $( if ([string]::IsNullOrEmpty($DatabaseUrl)) { "Manual setup required" } else { "Configured" } )" -ForegroundColor White
    
    Write-Host "`nManagement Scripts:" -ForegroundColor Yellow
    Write-Host "- Start: .\start-railway-system.bat" -ForegroundColor White
    Write-Host "- Stop: .\stop-railway-system.bat" -ForegroundColor White
    
    Write-Host "`nDefault Login:" -ForegroundColor Yellow
    Write-Host "- Username: admin" -ForegroundColor White
    Write-Host "- Password: admin" -ForegroundColor White
    
    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "1. Open browser to http://localhost:$Port" -ForegroundColor White
    Write-Host "2. Login with default credentials" -ForegroundColor White
    Write-Host "3. Change default password" -ForegroundColor White
    Write-Host "4. Import your railway data" -ForegroundColor White
    
    if ([string]::IsNullOrEmpty($DatabaseUrl)) {
        Write-Host "`nIMPORTANT:" -ForegroundColor Red
        Write-Host "Database setup required! Update .env file with your DATABASE_URL" -ForegroundColor Red
        Write-Host "Then run: npm run db:push" -ForegroundColor Red
    }
}

# Main deployment process
try {
    Write-Host "Starting automated deployment..." -ForegroundColor Green
    
    # Check if running as administrator for system-wide installations
    if ($InstallDependencies -and -not (Test-Administrator)) {
        Write-Host "Administrator privileges required for installing dependencies." -ForegroundColor Red
        Write-Host "Please run PowerShell as Administrator or install Node.js and PostgreSQL manually." -ForegroundColor Yellow
        $InstallDependencies = $false
    }
    
    # Install system dependencies if requested
    if ($InstallDependencies) {
        if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
            Install-Chocolatey
        }
        
        if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
            Install-NodeJS
        }
        
        if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
            Install-PostgreSQL
        }
        
        Install-PM2
    }
    
    # Verify Node.js is available
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "Node.js not found! Please install Node.js first." -ForegroundColor Red
        Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    
    # Setup project
    Setup-Environment
    Install-Dependencies
    Setup-Database
    Build-Application
    
    # Create management scripts
    Create-StartupScript
    Create-StopScript
    
    # Start application
    if ($Production) {
        Start-Application
    }
    
    Show-Instructions
    
    Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
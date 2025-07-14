# Railway Operations Management System - Windows Deployment Guide

## Quick Start (Automated)

### Option 1: Complete Auto-Install
```bash
# Run as Administrator (installs Node.js, PostgreSQL, dependencies)
install.bat
```

### Option 2: Production Deployment
```bash
# If you already have Node.js and PostgreSQL installed
deploy-production.bat
```

### Option 3: Manual PowerShell
```powershell
# Development setup
.\deploy-windows.ps1 -Port 5000

# Production setup with database
.\deploy-windows.ps1 -DatabaseUrl "postgresql://user:pass@localhost:5432/railway_db" -Port 5000 -Production

# Full install with dependencies (requires Admin)
.\deploy-windows.ps1 -InstallDependencies -Production
```

## Prerequisites

### Automatic Installation
The script will automatically install:
- **Node.js** (v18+)
- **PostgreSQL** (v14+)
- **PM2** (Process Manager)
- **Chocolatey** (Package Manager)

### Manual Installation
If you prefer manual setup:
1. [Node.js](https://nodejs.org/) (v18 or higher)
2. [PostgreSQL](https://www.postgresql.org/download/windows/)
3. Git (optional)

## Database Setup

### Automatic (Recommended)
The script will prompt you for database details and set up automatically.

### Manual Setup
1. **Create Database:**
   ```sql
   CREATE DATABASE railway_operations;
   ```

2. **Get Connection String:**
   ```
   postgresql://username:password@localhost:5432/railway_operations
   ```

3. **Update .env file:**
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/railway_operations
   ```

## Deployment Modes

### Development Mode
- Hot reload enabled
- Debug logging
- Development dependencies included
- Access: http://localhost:5000

### Production Mode
- Optimized build
- PM2 process management
- Auto-restart on crash
- Windows service integration
- Secure configuration

## Management Scripts

After deployment, you'll have these scripts:

### Start System
```bash
start-railway-system.bat
```

### Stop System
```bash
stop-railway-system.bat
```

### View Logs
```bash
pm2 logs railway-ops
```

### Restart Service
```bash
pm2 restart railway-ops
```

## Default Configuration

### Application Access
- **URL:** http://localhost:5000
- **Username:** admin
- **Password:** admin

### File Locations
- **Application:** Current directory
- **Logs:** PM2 logs directory
- **Database:** PostgreSQL data directory
- **Config:** .env file

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change port in deployment
   .\deploy-windows.ps1 -Port 3000
   ```

2. **Database Connection Failed**
   ```bash
   # Check PostgreSQL service
   Get-Service postgresql*
   
   # Start if stopped
   Start-Service postgresql-x64-14
   ```

3. **Permission Errors**
   ```bash
   # Run PowerShell as Administrator
   # Or use the install.bat which handles permissions
   ```

4. **Node.js Not Found**
   ```bash
   # Restart terminal after installation
   # Or install manually from nodejs.org
   ```

### Log Files
- **Application logs:** `pm2 logs railway-ops`
- **System logs:** Windows Event Viewer
- **Database logs:** PostgreSQL log directory

### Performance Tuning

#### For High Load
```powershell
# Increase PM2 instances
pm2 scale railway-ops 4

# Monitor performance
pm2 monit
```

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_railway_operations_date ON railway_loading_operations(p_date);
CREATE INDEX idx_railway_operations_station ON railway_loading_operations(station);
CREATE INDEX idx_railway_operations_commodity ON railway_loading_operations(commodity);
```

## Advanced Configuration

### SSL/HTTPS Setup
1. Obtain SSL certificate
2. Update server configuration
3. Configure reverse proxy (IIS/nginx)

### Domain Setup
1. Configure DNS
2. Update environment variables
3. Restart services

### Backup Configuration
```powershell
# Database backup
pg_dump railway_operations > backup.sql

# Application backup
xcopy /E /I railway-app railway-app-backup
```

## Security Considerations

### Production Checklist
- [ ] Change default admin password
- [ ] Update SESSION_SECRET in .env
- [ ] Configure firewall rules
- [ ] Enable HTTPS
- [ ] Regular security updates
- [ ] Database user permissions
- [ ] File system permissions

### Network Security
- Restrict database access to localhost
- Configure Windows Firewall
- Use strong passwords
- Regular updates

## Support

### Getting Help
1. Check logs: `pm2 logs railway-ops`
2. Verify services: `Get-Service postgresql*`
3. Test database: `psql -U username -d railway_operations`
4. Check application: http://localhost:5000

### Manual Commands
```powershell
# Install dependencies
npm install

# Database setup
npm run db:push

# Build application
npm run build

# Start development
npm run dev

# Start production
npm start
```

## Update Procedures

### Application Updates
```powershell
# Stop services
pm2 stop railway-ops

# Update code
git pull origin main

# Install dependencies
npm install

# Database migrations
npm run db:push

# Build application
npm run build

# Start services
pm2 start railway-ops
```

### System Updates
- Regular Windows updates
- PostgreSQL updates
- Node.js LTS updates
- Security patches

## Environment Variables

Complete list of supported environment variables:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/railway_operations

# Server
PORT=5000
NODE_ENV=production

# Security
SESSION_SECRET=your-random-secret-key

# Google Services (optional)
GOOGLE_SERVICE_ACCOUNT_PATH=./service-account.json

# Application
REPLIT_DOMAINS=your-domain.com
```

This automated deployment script provides a complete, production-ready setup for Windows environments with minimal manual intervention.
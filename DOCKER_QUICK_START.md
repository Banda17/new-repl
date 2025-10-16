# 🚀 Docker Quick Start Guide
## Railway Operations Management System

## ⚡ 5-Minute Deployment

### Step 1: Configure Environment
```bash
cp .env.example .env
nano .env  # Update DB_PASSWORD and SESSION_SECRET
```

### Step 2: Deploy
```bash
docker compose up -d
```

### Step 3: Access
Open browser: **http://localhost:5000**

---

## 📋 Essential Commands

### Start & Stop
```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart services
docker compose restart
```

### View Logs
```bash
# All services
docker compose logs -f

# Just the app
docker compose logs -f app

# Just the database
docker compose logs -f postgres
```

### Database Operations
```bash
# Run migrations
docker compose exec app npm run db:push

# Backup database
docker compose exec postgres pg_dump -U railway_user railway_operations > backup.sql

# Restore database
docker compose exec -T postgres psql -U railway_user railway_operations < backup.sql

# Access PostgreSQL CLI
docker compose exec postgres psql -U railway_user railway_operations
```

### Update Application
```bash
# After code changes
docker compose up -d --build app

# Full rebuild
docker compose down
docker compose up -d --build
```

### Monitoring
```bash
# View running containers
docker compose ps

# View resource usage
docker stats

# Check health status
docker compose exec app wget -q -O- http://localhost:5000/api/health
```

### Cleanup
```bash
# Remove stopped containers and unused images
docker system prune

# Remove all (including volumes - DELETES DATA!)
docker compose down -v
docker system prune -a
```

---

## 🔧 Configuration

### Change Port
Edit `.env`:
```bash
APP_PORT=8080  # Change from 5000 to 8080
```

### Enable Google Sheets
1. Place service account JSON in project root
2. Edit `docker-compose.yml`:
   ```yaml
   volumes:
     - ./your-credentials.json:/app/google-credentials.json:ro
   ```
3. Edit `.env`:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
   ```

### Enable AI Features
Edit `.env`:
```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

---

## 🐛 Troubleshooting

### Container won't start
```bash
docker compose logs app
```

### Port already in use
```bash
# Find what's using port 5000
sudo lsof -i :5000

# Change port in .env
APP_PORT=8080
```

### Database connection failed
```bash
# Check database health
docker compose exec postgres pg_isready -U railway_user

# Restart database
docker compose restart postgres
```

### Out of disk space
```bash
docker system df  # Check usage
docker system prune  # Clean up
```

### Permission errors
```bash
sudo chown -R $USER:$USER .
```

---

## 🌐 Production Deployment

### VPS/Cloud Server (Ubuntu/Debian)
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Deploy
git clone <your-repo>
cd railway-operations
cp .env.example .env
nano .env  # Update values
docker compose up -d

# Setup SSL with Nginx + Let's Encrypt
sudo apt install nginx certbot python3-certbot-nginx
# Configure nginx (see DOCKER_DEPLOYMENT.md)
sudo certbot --nginx -d yourdomain.com
```

### AWS/GCP/Azure
See **DOCKER_DEPLOYMENT.md** for detailed cloud deployment guides.

---

## 📊 Environment Variables

### Required
```bash
DB_PASSWORD=your_secure_password
SESSION_SECRET=random_secret_string
```

### Optional
```bash
APP_PORT=5000
GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
OPENAI_API_KEY=sk-...
```

### Generate Secure Secrets
```bash
# Session secret
openssl rand -base64 32

# Database password
openssl rand -base64 24
```

---

## 🔒 Security Checklist

- ✅ Change default `DB_PASSWORD`
- ✅ Generate random `SESSION_SECRET`
- ✅ Never commit `.env` file
- ✅ Use HTTPS in production (SSL/TLS)
- ✅ Keep Docker images updated
- ✅ Restrict database port exposure

---

## 📈 Scaling

### Multiple App Instances
```bash
docker compose up -d --scale app=3
```

### Resource Limits
Edit `docker-compose.yml`:
```yaml
app:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
```

---

## 🔄 Development Mode

For development with hot reload:
```bash
# Use development compose file
docker compose -f docker-compose.dev.yml up

# Or build first
docker compose -f docker-compose.dev.yml up --build
```

---

## 📞 Support

**Full Documentation**: See `DOCKER_DEPLOYMENT.md`

**Health Check**: http://localhost:5000/api/health

**Logs Location**: Use `docker compose logs`

---

**Last Updated**: October 2025

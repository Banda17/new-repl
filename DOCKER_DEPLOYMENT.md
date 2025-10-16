# Docker Deployment Guide
## Railway Operations Management System

This guide provides comprehensive instructions for deploying the Railway Operations Management System using Docker.

---

## 📋 Prerequisites

1. **Docker Engine** (version 24.0 or higher)
   ```bash
   docker --version
   ```

2. **Docker Compose** (version 2.20 or higher)
   ```bash
   docker compose version
   ```

3. **At least 4GB RAM** and **10GB disk space**

---

## 🚀 Quick Start (Local Deployment)

### Step 1: Clone or Prepare Your Project

```bash
# If you're already in the project directory, skip this step
cd /path/to/railway-operations-system
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your preferred editor
nano .env  # or vim .env, or code .env
```

**Important: Update these values in `.env`:**

```bash
# Generate a secure session secret
SESSION_SECRET=$(openssl rand -base64 32)

# Set strong database password
DB_PASSWORD=your_secure_database_password_here

# (Optional) Add Google credentials path if using Google Sheets integration
GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json

# (Optional) Add OpenAI API key if using AI features
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

### Step 3: Build and Start the Containers

```bash
# Build the Docker images
docker compose build

# Start all services in detached mode
docker compose up -d

# View logs to ensure everything started correctly
docker compose logs -f
```

### Step 4: Initialize the Database

```bash
# Run database migrations (if needed)
docker compose exec app npm run db:push
```

### Step 5: Access the Application

Open your browser and navigate to:
- **Application**: http://localhost:5000
- **Default credentials** (if you haven't changed them):
  - Username: `admin`
  - Password: (as configured in your system)

---

## 🔧 Configuration Options

### Port Configuration

Change the application port by editing `.env`:

```bash
APP_PORT=8080  # Change from default 5000 to 8080
```

Then restart:
```bash
docker compose down
docker compose up -d
```

### Database Configuration

For external PostgreSQL database instead of Docker container:

1. Comment out the `postgres` service in `docker-compose.yml`
2. Update `DATABASE_URL` in `.env`:
   ```bash
   DATABASE_URL=postgresql://user:password@external-host:5432/dbname
   ```

### Google Sheets Integration

If using Google Sheets/Drive integration:

1. Place your service account JSON file in the project root
2. Update `docker-compose.yml` to mount it:
   ```yaml
   volumes:
     - ./your-service-account.json:/app/google-credentials.json:ro
   ```
3. Set in `.env`:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
   ```

---

## 🛠️ Common Docker Commands

### View Running Containers
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f postgres
```

### Stop Services
```bash
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes database data)
docker compose down -v
```

### Restart Services
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart app
```

### Execute Commands Inside Container
```bash
# Access app container shell
docker compose exec app sh

# Run database migrations
docker compose exec app npm run db:push

# Access PostgreSQL CLI
docker compose exec postgres psql -U railway_user -d railway_operations
```

### Update After Code Changes
```bash
# Rebuild and restart
docker compose up -d --build

# Or rebuild specific service
docker compose up -d --build app
```

---

## 🌐 Production Deployment

### Option 1: Deploy to Cloud VPS (DigitalOcean, AWS EC2, etc.)

1. **SSH into your server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Docker and Docker Compose:**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Add current user to docker group
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Clone your project:**
   ```bash
   git clone https://github.com/yourusername/railway-operations.git
   cd railway-operations
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env  # Update with production values
   ```

5. **Deploy:**
   ```bash
   docker compose up -d
   ```

6. **Set up reverse proxy (Nginx):**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/railway-app
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/railway-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Set up SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option 2: Deploy to AWS ECS/Fargate

1. **Build and push to ECR:**
   ```bash
   # Authenticate with ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

   # Build and tag
   docker build -t railway-app .
   docker tag railway-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/railway-app:latest

   # Push
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/railway-app:latest
   ```

2. **Create ECS task definition** with environment variables from `.env`

3. **Deploy using ECS console** or AWS CLI

### Option 3: Deploy to Google Cloud Run

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/railway-app

# Deploy to Cloud Run
gcloud run deploy railway-app \
  --image gcr.io/PROJECT_ID/railway-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="postgresql://..." \
  --set-env-vars SESSION_SECRET="..."
```

### Option 4: Deploy to DigitalOcean App Platform

1. **Push code to GitHub**
2. **Connect to DigitalOcean App Platform**
3. **Set environment variables in App Platform dashboard**
4. **Deploy automatically from GitHub**

---

## 🔐 Security Best Practices

### 1. **Use Strong Secrets**
```bash
# Generate secure session secret
openssl rand -base64 32

# Generate secure database password
openssl rand -base64 24
```

### 2. **Don't Commit Secrets**
- Never commit `.env` file
- Never commit service account JSON files
- Use `.gitignore` properly

### 3. **Update Dependencies Regularly**
```bash
# Update npm packages
docker compose exec app npm update

# Rebuild image
docker compose up -d --build
```

### 4. **Use HTTPS in Production**
- Always use SSL/TLS certificates
- Use Let's Encrypt for free certificates
- Configure reverse proxy (Nginx/Traefik)

### 5. **Restrict Database Access**
```yaml
# In docker-compose.yml, only expose DB to app, not to host
postgres:
  # Remove or comment out:
  # ports:
  #   - "5432:5432"
```

### 6. **Run as Non-Root User**
The Dockerfile already configures this with `USER node`

---

## 📊 Monitoring and Maintenance

### View Resource Usage
```bash
docker stats
```

### Backup Database
```bash
# Backup
docker compose exec postgres pg_dump -U railway_user railway_operations > backup.sql

# Restore
docker compose exec -T postgres psql -U railway_user railway_operations < backup.sql
```

### View Container Health
```bash
docker compose ps
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build
```

---

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker compose logs app

# Check container status
docker compose ps
```

### Database Connection Issues
```bash
# Verify database is healthy
docker compose exec postgres pg_isready -U railway_user

# Check connection from app
docker compose exec app node -e "console.log(process.env.DATABASE_URL)"
```

### Port Already in Use
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process or change port in .env
APP_PORT=8080
```

### Out of Disk Space
```bash
# Clean up unused images and containers
docker system prune -a

# Remove unused volumes (WARNING: deletes data)
docker volume prune
```

### Permission Denied Errors
```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Or add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

---

## 📈 Scaling

### Horizontal Scaling (Multiple App Instances)

```bash
# Scale to 3 instances
docker compose up -d --scale app=3

# Use load balancer (Nginx)
```

### Vertical Scaling (Resource Limits)

Add to `docker-compose.yml`:
```yaml
app:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/app
            git pull
            docker compose up -d --build
```

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs: `docker compose logs -f`
3. Consult the main README.md
4. Contact your system administrator

---

## 📝 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Last Updated:** October 2025  
**Version:** 1.0.0

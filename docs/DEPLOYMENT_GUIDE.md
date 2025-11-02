# Deployment Guide

## Overview

This guide covers deploying the YouTube Assistant to different environments using environment variables for database configuration. The application supports running multiple instances simultaneously with separate databases for development, testing, and production use.

## Environment Variable Configuration

The application uses `DATABASE_URL` to determine which database to use:

```bash
# Development (default)
DATABASE_URL="sqlite:///./youtube_assistant.db"

# Personal Production
DATABASE_URL="sqlite:////home/user/production/youtube_assistant_prod.db"

# PostgreSQL (future)
DATABASE_URL="postgresql://user:password@localhost/youtube_prod"
```

## Deploying Personal Production Instance

### Step 1: Create Production Directory

```bash
mkdir -p ~/production/youtube-assistant
cd ~/production/youtube-assistant
```

### Step 2: Copy Application Code

**Option A - Clone from git:**
```bash
git clone https://github.com/YOUR_USERNAME/aqa-youtube-assistant.git .
```

**Option B - Copy from development:**
```bash
rsync -av ~/dev/aqa-youtube-assistant/ ~/production/youtube-assistant/ \
  --exclude=node_modules \
  --exclude=.venv \
  --exclude=__pycache__ \
  --exclude=*.db \
  --exclude=.git
```

### Step 3: Set Up Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set production database location
export DATABASE_URL="sqlite:///$(pwd)/youtube_assistant_prod.db"

# Start backend (migrations run automatically!)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Step 4: Set Up Frontend

In a new terminal:

```bash
cd ~/production/youtube-assistant/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### Step 5: Access Production Instance

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Running Multiple Instances

### Development Instance (Port 3000/8000)

```bash
# Terminal 1: Backend
cd ~/dev/aqa-youtube-assistant/backend
source .venv/bin/activate
DATABASE_URL="sqlite:///./youtube_assistant.db" \
  uvicorn app.main:app --reload

# Terminal 2: Frontend
cd ~/dev/aqa-youtube-assistant/frontend
npm run dev
```

### Production Instance (Port 3001/8001)

```bash
# Terminal 3: Backend
cd ~/production/youtube-assistant/backend
source .venv/bin/activate
DATABASE_URL="sqlite:///$(pwd)/youtube_assistant_prod.db" \
  uvicorn app.main:app --host 0.0.0.0 --port 8001

# Terminal 4: Frontend
cd ~/production/youtube-assistant/frontend
PORT=3001 npm start
```

## Using Different Databases

### SQLite (Default)

```bash
DATABASE_URL="sqlite:///./database.db"
```

### PostgreSQL (Future)

```bash
# Install PostgreSQL adapter
pip install psycopg2-binary

# Configure
DATABASE_URL="postgresql://username:password@localhost:5432/youtube_assistant"
```

### MySQL (Future)

```bash
pip install pymysql
DATABASE_URL="mysql+pymysql://username:password@localhost/youtube_assistant"
```

## Systemd Service (Optional - Linux Only)

For always-on production instance:

### Backend Service

Create `/etc/systemd/system/youtube-assistant-backend.service`:

```ini
[Unit]
Description=YouTube Assistant Backend
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/production/youtube-assistant/backend
Environment="DATABASE_URL=sqlite:////home/YOUR_USERNAME/production/youtube-assistant/backend/youtube_assistant_prod.db"
Environment="PATH=/home/YOUR_USERNAME/production/youtube-assistant/backend/.venv/bin:/usr/bin"
ExecStart=/home/YOUR_USERNAME/production/youtube-assistant/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Frontend Service

Create `/etc/systemd/system/youtube-assistant-frontend.service`:

**Note**: Adjust the Node.js PATH to match your installed version. Find your nvm Node path with:
```bash
nvm which current
# Example output: /home/username/.nvm/versions/node/v20.0.0/bin/node
# Use the directory path in the PATH environment variable
```

```ini
[Unit]
Description=YouTube Assistant Frontend
After=network.target youtube-assistant-backend.service

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/production/youtube-assistant/frontend
Environment="PORT=3001"
# Adjust Node.js version path to match your nvm installation
Environment="PATH=/home/YOUR_USERNAME/.nvm/versions/node/v20.0.0/bin:/usr/bin"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable youtube-assistant-backend
sudo systemctl enable youtube-assistant-frontend
sudo systemctl start youtube-assistant-backend
sudo systemctl start youtube-assistant-frontend

# Check status
sudo systemctl status youtube-assistant-backend
sudo systemctl status youtube-assistant-frontend

# View logs
sudo journalctl -u youtube-assistant-backend -f
```

## Backup and Restore

### Backup Database

```bash
# SQLite
cp youtube_assistant_prod.db youtube_assistant_prod.backup.$(date +%Y%m%d).db

# PostgreSQL
pg_dump youtube_assistant > backup.sql
```

### Restore Database

```bash
# SQLite
cp youtube_assistant_prod.backup.20251029.db youtube_assistant_prod.db

# PostgreSQL
psql youtube_assistant < backup.sql
```

## Updating Production

```bash
cd ~/production/youtube-assistant

# Pull latest code
git pull

# Update backend
cd backend
source .venv/bin/activate
pip install -r requirements.txt
# Migrations run automatically on next start!

# Update frontend
cd ../frontend
npm install
npm run build

# Restart services
sudo systemctl restart youtube-assistant-backend
sudo systemctl restart youtube-assistant-frontend
```

## Monitoring

### Check Application Status

```bash
# Backend health
curl http://localhost:8001/api/health

# Frontend
curl http://localhost:3001
```

### View Logs

```bash
# Systemd services
sudo journalctl -u youtube-assistant-backend -n 100
sudo journalctl -u youtube-assistant-frontend -n 100

# Manual runs
# Backend logs go to console
# Frontend logs in console and browser devtools
```

## Troubleshooting

### Migration Errors

Check logs for migration issues:
```bash
# App will show migration status on startup
# Look for: "🔄 Running database migrations..."
```

### Port Already in Use

```bash
# Find process using port
lsof -i :8001
kill -9 PID
```

### Database Locked (SQLite)

```bash
# Stop all connections to database
# Restart application
```

## Security Considerations

### Production Best Practices

- **Use HTTPS**: Configure reverse proxy (nginx/Apache) for SSL/TLS
- **Firewall**: Only expose necessary ports
- **Environment Variables**: Never commit sensitive data to git
- **Database Permissions**: Restrict file system permissions on SQLite files
- **Updates**: Keep dependencies up to date
- **Monitoring**: Set up log monitoring and alerts

### Example Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Remote Deployment (Future)

For deploying to a remote server:

### Using SSH and rsync

```bash
# Copy to remote server
rsync -avz ~/production/youtube-assistant/ user@remote:/opt/youtube-assistant/ \
  --exclude=node_modules \
  --exclude=.venv \
  --exclude=__pycache__ \
  --exclude=*.db

# SSH to remote and set up
ssh user@remote
cd /opt/youtube-assistant/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start services (or use systemd)
```

### Docker Deployment (Future Consideration)

```dockerfile
# Example Dockerfile structure for future use
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

## Related Documentation

- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist
- [Migration Workflow](./MIGRATION_WORKFLOW.md) - Database migration procedures
- [Database Management](../backend/docs/DATABASE_MANAGEMENT.md) - Database operations
- [Project Index](./INDEX.md) - All documentation

---

**Last Updated**: November 1, 2025  
**Related Issue**: #101  
**Part of Epic**: #96 (Database Migration System)

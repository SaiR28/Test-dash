# NeuralKissan Dashboard - Deployment Guide

## Quick Start (Local)

```bash
# Build and run
docker-compose up --build

# Access at http://localhost
```

## AWS EC2 Deployment

### 1. Launch EC2 Instance

- **AMI**: Amazon Linux 2023 or Ubuntu 22.04
- **Instance Type**: t2.micro (free tier) or t2.small
- **Storage**: 20GB EBS
- **Security Group**: Allow ports 22 (SSH) and 80 (HTTP)

### 2. Install Docker on EC2

```bash
# Connect to EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Amazon Linux 2023
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes
exit
```

### 3. Deploy Application

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git neuralkissan
cd neuralkissan

# Make deploy script executable
chmod +x deploy.sh

# Build and start
docker-compose up -d --build

# Check status
docker-compose ps
```

## Auto-Deploy Setup (Pull & Deploy on Push)

### Option 1: Cron Job (Simple - checks every 5 minutes)

```bash
# Edit crontab
crontab -e

# Add this line (checks every 5 minutes)
*/5 * * * * cd /home/ec2-user/neuralkissan && git fetch origin main && [ $(git rev-parse HEAD) != $(git rev-parse origin/main) ] && ./deploy.sh >> /home/ec2-user/deploy.log 2>&1
```

### Option 2: Webhook Auto-Deploy (Instant)

1. Create webhook listener script:

```bash
cat > ~/webhook-deploy.sh << 'EOF'
#!/bin/bash
cd /home/ec2-user/neuralkissan
./deploy.sh >> /home/ec2-user/deploy.log 2>&1
EOF
chmod +x ~/webhook-deploy.sh
```

2. Install webhook server:

```bash
# Install Go (for webhook)
sudo yum install -y golang

# Install webhook
go install github.com/adnanh/webhook@latest

# Create webhook config
cat > ~/hooks.json << 'EOF'
[
  {
    "id": "deploy",
    "execute-command": "/home/ec2-user/webhook-deploy.sh",
    "command-working-directory": "/home/ec2-user/neuralkissan",
    "response-message": "Deploying..."
  }
]
EOF

# Run webhook server (port 9000)
~/go/bin/webhook -hooks ~/hooks.json -port 9000 -verbose &
```

3. Add webhook to GitHub:
   - Go to your repo → Settings → Webhooks → Add webhook
   - URL: `http://your-ec2-ip:9000/hooks/deploy`
   - Content type: `application/json`
   - Secret: (optional)
   - Events: Just the push event

4. Don't forget to open port 9000 in your EC2 security group!

### Option 3: GitHub Actions (Recommended for Production)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ~/neuralkissan
            ./deploy.sh
```

Add these secrets in GitHub repo settings:
- `EC2_HOST`: Your EC2 public IP
- `EC2_SSH_KEY`: Contents of your .pem file

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop everything
docker-compose down

# Manual deploy
./deploy.sh

# Check deploy log
tail -f ~/deploy.log
```

## Troubleshooting

```bash
# Check if containers are running
docker ps

# Check container logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

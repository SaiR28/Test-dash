#!/bin/bash
# NeuralKissan Auto-Deploy Script
# Run this script to pull latest changes and redeploy

set -e

echo "🌿 NeuralKissan Auto-Deploy"
echo "=========================="

# Navigate to project directory
cd "$(dirname "$0")"

echo "📥 Pulling latest changes..."
git pull origin main

echo "🔨 Rebuilding containers..."
docker-compose down
docker-compose up -d --build

echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment complete!"
docker-compose ps

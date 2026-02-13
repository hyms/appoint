#!/bin/bash

# Deploy Script for Appointments 360
# This script deploys the application to production

set -e

echo "🚀 Starting deployment process..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure your variables"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "📦 Pulling latest changes..."
git pull origin main

echo "🧹 Cleaning up old containers and images..."
docker compose -f docker-compose.prod.yml down --remove-orphans
docker system prune -f

echo "🏗️ Building and starting services..."
docker compose -f docker-compose.prod.yml up -d --build

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔄 Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Service Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "🌐 Access Points:"
echo "  - Frontend: $FRONTEND_URL"
echo "  - API: $API_URL"
echo "  - Nginx Proxy Manager: http://your-server-ip:81"
echo "  - Portainer: https://your-server-ip:9443"

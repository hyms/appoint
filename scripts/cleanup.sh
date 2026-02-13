#!/bin/bash

# Weekly Cleanup Script
# This script cleans up Docker resources to save disk space
# Run as a cron job: 0 0 * * 0 /scripts/cleanup.sh

echo "🧹 Starting weekly cleanup at $(date)"

# Remove unused containers
echo "Removing stopped containers..."
docker container prune -f

# Remove unused images
echo "Removing unused images..."
docker image prune -af

# Remove unused volumes
echo "Removing unused volumes..."
docker volume prune -f

# Remove unused networks
echo "Removing unused networks..."
docker network prune -f

# System prune
echo "Running system prune..."
docker system prune -f

echo "✅ Cleanup completed at $(date)"
echo ""
echo "Current disk usage:"
df -h /

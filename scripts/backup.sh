#!/bin/sh

# Database Backup Script
# This script creates a backup of the PostgreSQL database
# Run as a cron job: 0 2 * * * /scripts/backup.sh

set -e

# Configuration
BACKUP_DIR="/backups"
DB_NAME="${POSTGRES_DB:-appointments360}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="postgres"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${DATE}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Starting backup at $(date)"
echo "Backup file: $BACKUP_FILE"

if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"; then
    # Compress backup
    gzip "$BACKUP_FILE"
    echo "Backup completed successfully: ${BACKUP_FILE}.gz"
    
    # Calculate file size
    FILE_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "Backup size: $FILE_SIZE"
    
    # Remove old backups
    echo "Removing backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # List remaining backups
    echo "Remaining backups:"
    ls -lh "$BACKUP_DIR"
    
    echo "Backup process completed at $(date)"
else
    echo "ERROR: Backup failed at $(date)"
    rm -f "$BACKUP_FILE"
    exit 1
fi

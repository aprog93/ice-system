#!/bin/bash

# Database Backup Script for ICE System
# 
# Usage:
#   ./backup-db.sh              # Create backup
#   ./backup-db.sh --restore    # Restore from latest backup
#   ./backup-db.sh --list       # List available backups
#
# Crontab example (daily at 2 AM):
#   0 2 * * * /path/to/backup-db.sh >> /var/log/ice-backup.log 2>&1

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${DB_NAME:-ice_system}"
DB_USER="${DB_USER:-ice_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/ice_backup_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to create backup
create_backup() {
    echo -e "${YELLOW}Creating database backup...${NC}"
    
    # Check if database is accessible
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
        echo -e "${RED}Error: Database is not accessible${NC}"
        exit 1
    fi
    
    # Create backup
    PGPASSWORD="${DB_PASSWORD}" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-owner \
        --no-privileges \
        --format=plain \
        > "$BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    # Verify backup
    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}✓ Backup created successfully${NC}"
        echo -e "  File: $BACKUP_FILE"
        echo -e "  Size: $BACKUP_SIZE"
        echo -e "  Date: $(date)"
    else
        echo -e "${RED}✗ Backup failed${NC}"
        exit 1
    fi
    
    # Clean old backups
    clean_old_backups
}

# Function to restore backup
restore_backup() {
    echo -e "${YELLOW}Available backups:${NC}"
    list_backups
    
    echo ""
    read -p "Enter backup file name to restore (or 'latest' for most recent): " RESTORE_FILE
    
    if [ "$RESTORE_FILE" == "latest" ]; then
        RESTORE_FILE=$(ls -t ${BACKUP_DIR}/ice_backup_*.sql.gz 2>/dev/null | head -1)
        if [ -z "$RESTORE_FILE" ]; then
            echo -e "${RED}No backups found${NC}"
            exit 1
        fi
    else
        RESTORE_FILE="${BACKUP_DIR}/${RESTORE_FILE}"
    fi
    
    if [ ! -f "$RESTORE_FILE" ]; then
        echo -e "${RED}Backup file not found: $RESTORE_FILE${NC}"
        exit 1
    fi
    
    echo -e "${RED}WARNING: This will overwrite the current database!${NC}"
    read -p "Are you sure? Type 'yes' to continue: " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        echo "Restore cancelled"
        exit 0
    fi
    
    echo -e "${YELLOW}Restoring from backup: $RESTORE_FILE${NC}"
    
    # Decompress if needed
    if [[ "$RESTORE_FILE" == *.gz ]]; then
        echo "Decompressing backup..."
        gunzip -c "$RESTORE_FILE" > /tmp/restore_temp.sql
        RESTORE_FILE="/tmp/restore_temp.sql"
    fi
    
    # Restore database
    PGPASSWORD="${DB_PASSWORD}" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        < "$RESTORE_FILE"
    
    # Cleanup temp file
    if [ -f "/tmp/restore_temp.sql" ]; then
        rm "/tmp/restore_temp.sql"
    fi
    
    echo -e "${GREEN}✓ Database restored successfully${NC}"
}

# Function to list backups
list_backups() {
    echo "Backup Directory: $BACKUP_DIR"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        echo "No backups found"
        return
    fi
    
    printf "%-30s %-10s %-20s\n" "FILENAME" "SIZE" "DATE"
    printf "%-30s %-10s %-20s\n" "--------" "----" "----"
    
    for file in $(ls -t ${BACKUP_DIR}/ice_backup_*.sql.gz 2>/dev/null); do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            size=$(du -h "$file" | cut -f1)
            date=$(stat -c %y "$file" 2>/dev/null || stat -f %Sm "$file" 2>/dev/null)
            printf "%-30s %-10s %-20s\n" "$filename" "$size" "$date"
        fi
    done
}

# Function to clean old backups
clean_old_backups() {
    echo -e "${YELLOW}Cleaning backups older than $RETENTION_DAYS days...${NC}"
    
    find "$BACKUP_DIR" -name "ice_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    echo -e "${GREEN}✓ Cleanup completed${NC}"
}

# Main script logic
case "${1:-}" in
    --restore|-r)
        restore_backup
        ;;
    --list|-l)
        list_backups
        ;;
    --help|-h)
        echo "ICE System Database Backup Script"
        echo ""
        echo "Usage:"
        echo "  ./backup-db.sh              Create a new backup"
        echo "  ./backup-db.sh --restore    Restore from backup"
        echo "  ./backup-db.sh --list       List available backups"
        echo "  ./backup-db.sh --help       Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  BACKUP_DIR     Backup directory (default: ./backups)"
        echo "  DB_NAME        Database name (default: ice_system)"
        echo "  DB_USER        Database user (default: ice_user)"
        echo "  DB_HOST        Database host (default: localhost)"
        echo "  DB_PORT        Database port (default: 5432)"
        echo "  DB_PASSWORD    Database password (required)"
        echo "  RETENTION_DAYS Days to keep backups (default: 30)"
        ;;
    *)
        create_backup
        ;;
esac

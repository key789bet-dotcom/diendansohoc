#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/var/backups/diendansohoc"
mkdir -p $BACKUP_DIR
mysqldump -u gmsh -pGmsh@2026 diendansohoc > $BACKUP_DIR/db_$DATE.sql
# Giữ lại 7 ngày gần nhất
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
echo "✅ Backup DB thành công: db_$DATE.sql"

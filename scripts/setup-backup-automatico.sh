#!/bin/bash

# 🔧 CONFIGURAR BACKUPS AUTOMÁTICOS EN CRON
# Fecha: 2025-11-10
# Uso: bash scripts/setup-backup-automatico.sh

set -e

echo "========================================"
echo "🔧 CONFIGURAR BACKUPS AUTOMÁTICOS"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuración
PROJECT_DIR=$(pwd)
BACKUP_SCRIPT="$PROJECT_DIR/scripts/backup-prod.sh"
VERIFY_SCRIPT="$PROJECT_DIR/scripts/verificar-datos-prod.sh"
LOG_FILE="/tmp/backup-prod-cron.log"

echo -e "${YELLOW}📋 Configuración:${NC}"
echo "   Directorio: $PROJECT_DIR"
echo "   Script backup: $BACKUP_SCRIPT"
echo "   Log: $LOG_FILE"
echo ""

# Verificar que los scripts existen
if [ ! -f "$BACKUP_SCRIPT" ]; then
  echo -e "${RED}❌ ERROR: $BACKUP_SCRIPT no encontrado${NC}"
  exit 1
fi

if [ ! -f "$VERIFY_SCRIPT" ]; then
  echo -e "${RED}❌ ERROR: $VERIFY_SCRIPT no encontrado${NC}"
  exit 1
fi

# Hacer scripts ejecutables
chmod +x "$BACKUP_SCRIPT"
chmod +x "$VERIFY_SCRIPT"

echo -e "${YELLOW}⏰ Configuración de Cron:${NC}"
echo ""
echo "   Backups programados:"
echo "   - Cada 6 horas (00:00, 06:00, 12:00, 18:00)"
echo "   - Verificación de datos diaria (01:00)"
echo "   - Limpieza semanal de backups antiguos (domingo 03:00)"
echo ""

# Backup del crontab actual
echo -e "${YELLOW}💾 Backup de crontab actual...${NC}"
crontab -l > /tmp/crontab-backup-$(date +%Y%m%d-%H%M%S).txt 2>/dev/null || true
echo -e "${GREEN}✅ Backup de crontab guardado${NC}"
echo ""

# Crear nuevo crontab (preservando entradas existentes no relacionadas)
echo -e "${YELLOW}📝 Agregando tareas de backup a cron...${NC}"

# Obtener crontab actual y remover entradas antiguas de backup
CURRENT_CRON=$(crontab -l 2>/dev/null | grep -v "backup-prod.sh" | grep -v "verificar-datos-prod.sh" || true)

# Crear nuevo crontab
cat << EOF | crontab -
$CURRENT_CRON

# ============================================
# GMARM - BACKUPS AUTOMÁTICOS DE PRODUCCIÓN
# Configurado: $(date)
# ============================================

# Backup cada 6 horas (00:00, 06:00, 12:00, 18:00)
0 */6 * * * cd $PROJECT_DIR && bash scripts/backup-prod.sh >> $LOG_FILE 2>&1

# Verificación de datos diaria (01:00 AM)
0 1 * * * cd $PROJECT_DIR && bash scripts/verificar-datos-prod.sh >> /tmp/verify-prod.log 2>&1

# Limpieza de backups antiguos (Domingo 03:00 AM)
0 3 * * 0 find $PROJECT_DIR/backups -name "gmarm-prod-*.sql.gz" -mtime +30 -delete

# Alerta si PostgreSQL usa > 90% memoria (cada 5 minutos)
*/5 * * * * docker stats --no-stream gmarm-postgres-prod | awk 'NR==2 {if(substr(\$7,1,length(\$7)-1) > 90) print "⚠️ ALERTA: PostgreSQL usando " \$7 " de memoria"}' >> /tmp/memory-alerts.log 2>&1

EOF

echo -e "${GREEN}✅ Tareas agregadas a cron${NC}"
echo ""

# Verificar crontab
echo -e "${YELLOW}🔍 Verificando crontab actual:${NC}"
echo ""
crontab -l | grep -A 10 "GMARM"
echo ""

# Crear directorios necesarios
mkdir -p "$PROJECT_DIR/backups"
mkdir -p "$PROJECT_DIR/backups/manual"

echo -e "${YELLOW}📁 Directorios creados:${NC}"
echo "   - $PROJECT_DIR/backups (backups automáticos)"
echo "   - $PROJECT_DIR/backups/manual (backups manuales)"
echo ""

# Hacer un backup inmediato para probar
echo -e "${YELLOW}🧪 Probando backup inmediato...${NC}"
if bash "$BACKUP_SCRIPT"; then
  echo -e "${GREEN}✅ Backup de prueba exitoso${NC}"
else
  echo -e "${RED}❌ ERROR en backup de prueba${NC}"
  exit 1
fi
echo ""

# Configurar notificaciones por email (opcional)
echo -e "${YELLOW}📧 ¿Configurar notificaciones por email? (s/N):${NC}"
read -n 1 -r SETUP_EMAIL
echo

if [[ $SETUP_EMAIL =~ ^[SsYy]$ ]]; then
  echo ""
  echo "Ingresa tu email para recibir alertas:"
  read EMAIL_ADDRESS
  
  # Agregar notificación en caso de error
  cat << EOF >> /tmp/backup-monitor.sh
#!/bin/bash
LAST_BACKUP=\$(ls -t $PROJECT_DIR/backups/gmarm-prod-*.sql.gz 2>/dev/null | head -1)
if [ -z "\$LAST_BACKUP" ]; then
  echo "⚠️ NO hay backups disponibles!" | mail -s "ALERTA: Sin backups GMARM" $EMAIL_ADDRESS
else
  AGE=\$(( (\$(date +%s) - \$(stat -c %Y "\$LAST_BACKUP")) / 3600 ))
  if [ \$AGE -gt 12 ]; then
    echo "⚠️ Último backup tiene \$AGE horas de antigüedad" | mail -s "ALERTA: Backup antiguo GMARM" $EMAIL_ADDRESS
  fi
fi
EOF
  
  chmod +x /tmp/backup-monitor.sh
  crontab -l | { cat; echo "0 */2 * * * /tmp/backup-monitor.sh"; } | crontab -
  echo -e "${GREEN}✅ Notificaciones configuradas para: $EMAIL_ADDRESS${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ CONFIGURACIÓN COMPLETADA${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}📊 RESUMEN:${NC}"
echo "   ✅ Backups cada 6 horas"
echo "   ✅ Verificación diaria de datos"
echo "   ✅ Limpieza automática (30 días retención)"
echo "   ✅ Alerta de memoria cada 5 minutos"
echo "   ✅ Directorio: $PROJECT_DIR/backups"
echo ""
echo -e "${YELLOW}📝 COMANDOS ÚTILES:${NC}"
echo ""
echo "   Ver backups disponibles:"
echo "   ls -lht $PROJECT_DIR/backups/*.sql.gz | head -10"
echo ""
echo "   Ver log de backups:"
echo "   tail -f $LOG_FILE"
echo ""
echo "   Verificar cron:"
echo "   crontab -l"
echo ""
echo "   Backup manual:"
echo "   bash scripts/backup-prod.sh"
echo ""
echo "   Restaurar backup:"
echo "   bash scripts/restore-backup.sh backups/gmarm-prod-YYYYMMDD-HHMMSS.sql.gz"
echo ""


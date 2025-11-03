#!/bin/bash

# ========================================
# SCRIPT DE MONITOREO Y AUTO-RECUPERACIÓN
# ========================================
# Este script debe ejecutarse cada hora vía cron
# para detectar y corregir problemas automáticamente

set -e

LOGFILE="/tmp/gmarm-monitor.log"
ALERT_FILE="/tmp/gmarm-alert.txt"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGFILE"
}

send_alert() {
    echo "[ALERTA - $(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$ALERT_FILE"
    log "⚠️ ALERTA: $1"
}

log "🔍 Iniciando monitoreo de servicios GMARM..."

# 1. Verificar si Docker está corriendo
if ! docker ps > /dev/null 2>&1; then
    send_alert "Docker no está corriendo"
    log "❌ Docker no responde"
    exit 1
fi

log "✅ Docker está corriendo"

# 2. Verificar contenedores
POSTGRES_STATUS=$(docker inspect gmarm-postgres-dev --format='{{.State.Status}}' 2>/dev/null || echo "not_found")
BACKEND_STATUS=$(docker inspect gmarm-backend-dev --format='{{.State.Status}}' 2>/dev/null || echo "not_found")
FRONTEND_STATUS=$(docker inspect gmarm-frontend-dev --format='{{.State.Status}}' 2>/dev/null || echo "not_found")

log "📊 Estado de contenedores:"
log "  PostgreSQL: $POSTGRES_STATUS"
log "  Backend: $BACKEND_STATUS"
log "  Frontend: $FRONTEND_STATUS"

# 3. Verificar PostgreSQL
if [ "$POSTGRES_STATUS" != "running" ]; then
    send_alert "PostgreSQL no está corriendo - Status: $POSTGRES_STATUS"
    log "🔄 Intentando reiniciar PostgreSQL..."
    docker-compose -f /ruta/al/proyecto/docker-compose.dev.yml restart postgres_dev
    sleep 10
fi

# 4. Verificar que la base de datos exista y tenga datos
if [ "$POSTGRES_STATUS" == "running" ]; then
    log "🔍 Verificando base de datos..."
    
    DB_EXISTS=$(docker exec gmarm-postgres-dev psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='gmarm_dev'" 2>/dev/null || echo "0")
    
    if [ "$DB_EXISTS" != "1" ]; then
        send_alert "Base de datos gmarm_dev NO EXISTE"
        log "🔄 Recreando base de datos..."
        
        # Ejecutar script de recuperación
        docker exec gmarm-postgres-dev bash /docker-entrypoint-initdb.d/ensure-db-exists.sh
        
        if [ $? -eq 0 ]; then
            log "✅ Base de datos recreada exitosamente"
        else
            send_alert "Error recreando base de datos"
            log "❌ Error en recuperación de BD"
        fi
    else
        log "✅ Base de datos existe"
        
        # Verificar datos
        USUARIO_COUNT=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM usuario;" 2>/dev/null || echo "0")
        ARMA_COUNT=$(docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -tAc "SELECT COUNT(*) FROM arma;" 2>/dev/null || echo "0")
        
        log "📊 Datos en BD:"
        log "  Usuarios: $USUARIO_COUNT"
        log "  Armas: $ARMA_COUNT"
        
        if [ "$USUARIO_COUNT" -eq "0" ]; then
            send_alert "Base de datos VACÍA (0 usuarios)"
            log "🔄 Reinicializando base de datos..."
            
            docker exec gmarm-postgres-dev bash /docker-entrypoint-initdb.d/ensure-db-exists.sh
            
            if [ $? -eq 0 ]; then
                log "✅ Base de datos reinicializada"
            else
                send_alert "Error reinicializando BD"
            fi
        else
            log "✅ Base de datos tiene datos"
        fi
    fi
fi

# 5. Verificar Backend
if [ "$BACKEND_STATUS" != "running" ]; then
    send_alert "Backend no está corriendo - Status: $BACKEND_STATUS"
    log "🔄 Reiniciando backend..."
    docker-compose -f /ruta/al/proyecto/docker-compose.dev.yml restart backend_dev
    sleep 20
else
    # Verificar que responda
    if curl -s -f http://localhost:8080/api/health > /dev/null 2>&1; then
        log "✅ Backend responde correctamente"
    else
        send_alert "Backend no responde al health check"
        log "🔄 Reiniciando backend..."
        docker-compose -f /ruta/al/proyecto/docker-compose.dev.yml restart backend_dev
    fi
fi

# 6. Verificar Frontend
if [ "$FRONTEND_STATUS" != "running" ]; then
    send_alert "Frontend no está corriendo - Status: $FRONTEND_STATUS"
    log "🔄 Reiniciando frontend..."
    docker-compose -f /ruta/al/proyecto/docker-compose.dev.yml restart frontend_dev
else
    log "✅ Frontend está corriendo"
fi

# 7. Verificar uso de memoria (detectar OOM Killer)
MEMORY_USAGE=$(docker stats --no-stream --format "{{.MemPerc}}" gmarm-postgres-dev | sed 's/%//' 2>/dev/null || echo "0")
if (( $(echo "$MEMORY_USAGE > 90" | bc -l) )); then
    send_alert "PostgreSQL usando más del 90% de memoria: ${MEMORY_USAGE}%"
    log "⚠️ Uso alto de memoria en PostgreSQL: ${MEMORY_USAGE}%"
fi

# 8. Verificar logs de reinicio
POSTGRES_RESTARTS=$(docker inspect gmarm-postgres-dev --format='{{.RestartCount}}' 2>/dev/null || echo "0")
if [ "$POSTGRES_RESTARTS" -gt "0" ]; then
    send_alert "PostgreSQL ha sido reiniciado $POSTGRES_RESTARTS veces"
    log "⚠️ PostgreSQL reiniciado $POSTGRES_RESTARTS veces"
    
    # Obtener últimos logs para diagnóstico
    log "📋 Últimos 20 logs de PostgreSQL:"
    docker logs gmarm-postgres-dev --tail 20 | tee -a "$LOGFILE"
fi

log "✅ Monitoreo completado"
log "=========================================="

# Si hay alertas, mostrarlas
if [ -f "$ALERT_FILE" ] && [ -s "$ALERT_FILE" ]; then
    log "⚠️ ALERTAS DETECTADAS:"
    cat "$ALERT_FILE" | tee -a "$LOGFILE"
fi

exit 0


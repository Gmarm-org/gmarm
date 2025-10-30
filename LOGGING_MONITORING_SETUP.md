# 📊 SISTEMA DE LOGGING Y MONITOREO - GMARM

## 🎯 Objetivo

Implementar un sistema robusto de logging que permita:
- **Logs estructurados** en archivos con rotación automática
- **Formato JSON** para fácil integración con herramientas de análisis
- **Niveles de log** configurables por entorno
- **Monitoreo centralizado** con Loki + Grafana (gratuito y ligero)
- **Búsqueda y análisis** de logs en tiempo real

---

## 📁 Estructura de Logs

```
logs/
├── gmarm.log              # Log general (texto plano)
├── gmarm-error.log        # Solo errores (ERROR level)
├── gmarm-json.log         # Logs en formato JSON (para Loki/ELK)
├── gmarm-audit.log        # Logs de auditoría
└── archive/               # Logs rotados y comprimidos
    ├── gmarm-2025-10-30.0.log.gz
    ├── gmarm-error-2025-10-30.0.log.gz
    └── ...
```

### **Políticas de Rotación**

| Archivo | Tamaño Máx | Retención | Tamaño Total |
|---------|------------|-----------|--------------|
| gmarm.log | 10MB | 30 días | 1GB |
| gmarm-error.log | 10MB | 90 días | 500MB |
| gmarm-json.log | 10MB | 30 días | 1GB |
| gmarm-audit.log | 10MB | 365 días | 2GB |

---

## 🔧 Configuración por Entorno

### **LOCAL (development)**
```properties
# Más verboso para debugging
com.armasimportacion: DEBUG
org.springframework.web: DEBUG
org.hibernate.SQL: DEBUG
```

### **DOCKER (DEV server)**
```properties
# Equilibrado
com.armasimportacion: INFO
org.springframework.web: INFO
org.hibernate.SQL: WARN
```

### **PRODUCCIÓN**
```properties
# Solo importante
com.armasimportacion: INFO
org.springframework: WARN
org.hibernate: WARN
```

---

## 🚀 Uso en el Código

### **Logger básico**
```java
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class MiServicio {
    
    public void miMetodo() {
        log.info("Operación iniciada");
        log.debug("Datos de debug: {}", datos);
        log.warn("Advertencia: {}", mensaje);
        log.error("Error crítico: {}", error.getMessage(), error);
    }
}
```

### **Logger de auditoría** (para operaciones críticas)
```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AuditoriaService {
    
    private static final Logger auditLog = LoggerFactory.getLogger("com.armasimportacion.audit");
    
    public void registrarAccion(String usuario, String accion, String detalles) {
        auditLog.info("AUDIT - Usuario: {} | Acción: {} | Detalles: {}", 
            usuario, accion, detalles);
    }
}
```

### **Ejemplos de uso**
```java
// ✅ BUENO - Información relevante, sin datos sensibles
log.info("Cliente creado exitosamente - ID: {}", cliente.getId());
log.info("Arma asignada - ArmaID: {} - ClienteID: {}", armaId, clienteId);

// ✅ BUENO - Errores con contexto
log.error("Error procesando pago - ClienteID: {} - Error: {}", 
    clienteId, error.getMessage());

// ✅ BUENO - Auditoría
auditLog.info("AUDIT - Usuario: {} modificó cliente ID: {}", 
    username, clienteId);

// ❌ MALO - Datos sensibles (passwords, tokens)
log.info("Token generado: {}", token);  // ❌ NO
log.debug("Password: {}", password);     // ❌ NO

// ❌ MALO - Demasiado verbose sin contexto
log.info("Entering method");            // ❌ NO
log.debug("Step 1");                    // ❌ NO
```

---

## 📊 Monitoreo con Loki + Grafana

### **¿Por qué Loki + Grafana?**

✅ **Gratuito y Open Source**
✅ **Ligero** (consume menos que ELK)
✅ **Fácil integración** con Docker
✅ **Query language** potente (LogQL)
✅ **UI intuitiva** con Grafana
✅ **Alertas** configurables

### **Arquitectura**

```
Backend (Spring Boot)
    ↓ (escribe logs)
logs/gmarm-json.log
    ↓ (lee logs)
Promtail (recolector)
    ↓ (envía logs)
Loki (agregador)
    ↓ (consulta logs)
Grafana (visualización)
```

---

## 🛠️ Instalación y Uso

### **Paso 1: Levantar aplicación principal**
```bash
# En el servidor DEV
cd /path/to/gmarm
docker-compose -f docker-compose.dev.yml up -d
```

### **Paso 2: Levantar stack de monitoreo**
```bash
# Levantar Loki + Grafana + Promtail
docker-compose -f docker-compose.monitoring.yml up -d

# Verificar que estén corriendo
docker ps | grep -E "loki|grafana|promtail"
```

### **Paso 3: Acceder a Grafana**
```
URL: http://localhost:3000 (o http://IP_SERVIDOR:3000)
Usuario: admin
Password: admin (cambiar en primera ejecución)
```

### **Paso 4: Explorar logs**

1. **Acceder a Explore** (ícono de brújula en sidebar)
2. **Seleccionar datasource**: Loki
3. **Escribir queries** en LogQL

---

## 🔍 Queries Útiles (LogQL)

### **Ver todos los logs del backend**
```logql
{job="gmarm-backend"}
```

### **Solo errores**
```logql
{job="gmarm-backend-errors"}
```

### **Filtrar por logger específico**
```logql
{job="gmarm-backend-json"} | json | logger="com.armasimportacion.service.ClienteService"
```

### **Buscar por texto**
```logql
{job="gmarm-backend"} |= "Cliente creado"
```

### **Logs de los últimos 5 minutos con nivel ERROR**
```logql
{job="gmarm-backend-json"} | json | level="ERROR"
```

### **Buscar por ID de cliente**
```logql
{job="gmarm-backend"} |= "ClienteID: 123"
```

### **Logs de auditoría**
```logql
{job="gmarm-backend-audit"}
```

### **Rate de logs por minuto**
```logql
rate({job="gmarm-backend"}[1m])
```

---

## 📈 Dashboards Sugeridos

### **Dashboard 1: Resumen General**
- Total de logs por nivel (INFO, WARN, ERROR)
- Rate de logs por minuto
- Top 10 loggers más activos
- Gráfico de errores en el tiempo

### **Dashboard 2: Errores y Excepciones**
- Logs de ERROR en tiempo real
- Tipos de excepciones más frecuentes
- Stack traces recientes
- Alertas automáticas

### **Dashboard 3: Auditoría**
- Acciones de usuarios
- Operaciones críticas (crear/modificar/eliminar)
- Timeline de cambios
- Usuarios más activos

### **Dashboard 4: Performance**
- Tiempo de respuesta de endpoints (si se loguea)
- Queries lentas de BD (si se loguea)
- Uso de memoria y CPU (si se integra con Prometheus)

---

## ⚙️ Configuración Avanzada

### **Variables de entorno para Grafana**
```bash
# En docker-compose.monitoring.yml o .env
GRAFANA_PORT=3000
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin  # CAMBIAR EN PRODUCCIÓN
GRAFANA_ROOT_URL=http://mi-servidor.com:3000
```

### **Cambiar retención de logs en Loki**
Editar `monitoring/loki-config.yml`:
```yaml
table_manager:
  retention_deletes_enabled: true
  retention_period: 1440h  # 60 días (en horas)
```

### **Limitar uso de recursos**
Ya configurado en `docker-compose.monitoring.yml`:
- **Loki**: max 512MB RAM
- **Grafana**: max 512MB RAM
- **Promtail**: max 256MB RAM

---

## 🔄 Comandos Útiles

### **Ver logs en vivo**
```bash
# Logs del backend
tail -f logs/gmarm.log

# Logs de errores
tail -f logs/gmarm-error.log

# Logs JSON
tail -f logs/gmarm-json.log | jq '.'
```

### **Buscar en logs**
```bash
# Buscar texto específico
grep "Cliente creado" logs/gmarm.log

# Buscar en logs JSON
cat logs/gmarm-json.log | jq 'select(.level=="ERROR")'

# Ver logs de hoy
ls -lh logs/archive/*$(date +%Y-%m-%d)*
```

### **Limpiar logs antiguos**
```bash
# Logs automáticamente rotados (ya comprimidos)
find logs/archive/ -name "*.gz" -mtime +30 -delete

# Ver espacio usado
du -sh logs/
```

### **Reiniciar monitoreo**
```bash
docker-compose -f docker-compose.monitoring.yml restart
```

### **Ver logs de contenedores de monitoreo**
```bash
docker logs -f gmarm-loki
docker logs -f gmarm-grafana
docker logs -f gmarm-promtail
```

---

## 🚨 Alertas (Futuro)

Grafana permite configurar alertas que se envían por:
- Email
- Slack
- Discord
- Webhook
- Telegram

### **Ejemplo de alerta**
- **Condición**: Más de 10 errores en 5 minutos
- **Acción**: Enviar email al equipo técnico

---

## 🔐 Seguridad

### **Logs NO deben contener**
❌ Passwords
❌ Tokens JWT completos
❌ Números de tarjetas
❌ Datos personales sensibles (completos)
❌ API Keys

### **Logs SÍ pueden contener**
✅ IDs de recursos (cliente, arma, pago)
✅ Nombres de usuarios (para auditoría)
✅ Timestamps
✅ IPs (para seguridad)
✅ Tipos de operaciones
✅ Errores y excepciones (sin datos sensibles)

---

## 💰 Alternativas a Loki (comparación)

| Herramienta | Precio | Recursos | Complejidad | Recomendación |
|-------------|--------|----------|-------------|---------------|
| **Loki + Grafana** | Gratis | Bajo | Media | ⭐⭐⭐⭐⭐ (Recomendado) |
| ELK Stack | Gratis | Alto | Alta | ⭐⭐⭐ (Servidor potente) |
| Graylog | Gratis | Medio | Media | ⭐⭐⭐⭐ (Alternativa) |
| Better Stack | Free tier | Bajo | Baja | ⭐⭐⭐⭐ (Cloud) |
| Datadog | $$$ | Bajo | Baja | ⭐⭐⭐⭐⭐ (Caro) |
| New Relic | $$ | Bajo | Baja | ⭐⭐⭐ (Free tier limitado) |

---

## 📚 Recursos

- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/logql/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [Logback Configuration](https://logback.qos.ch/manual/configuration.html)

---

## ✅ Checklist de Implementación

- [x] Configurar Logback con appenders a archivo
- [x] Agregar rotación de logs
- [x] Crear formato JSON para integración
- [x] Agregar logs al docker-compose
- [x] Crear docker-compose.monitoring.yml
- [x] Configurar Loki
- [x] Configurar Promtail
- [x] Configurar Grafana
- [ ] Levantar stack de monitoreo
- [ ] Crear dashboards en Grafana
- [ ] Configurar alertas básicas
- [ ] Probar queries de búsqueda
- [ ] Documentar dashboards importantes
- [ ] Capacitar al equipo en uso de Grafana

---

**Fecha**: 2025-10-30  
**Autor**: Sistema GMARM  
**Versión**: 1.0


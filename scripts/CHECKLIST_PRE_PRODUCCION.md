# ✅ CHECKLIST PRE-PRODUCCIÓN - GMARM

**Fecha de creación**: 11 de febrero de 2026
**Versión**: 1.0
**Objetivo**: Asegurar que el sistema está listo para producción

---

## 📋 CHECKLIST COMPLETO

### 🗄️ BASE DE DATOS

- [ ] **SQL Maestro Validado**
  ```bash
  bash scripts/validar-sql-maestro.sh
  ```
  - [ ] Sin errores de sintaxis
  - [ ] Todas las tablas principales presentes
  - [ ] Usuarios requeridos configurados (admin, david.guevara, franklin.endara)
  - [ ] Roles asignados correctamente
  - [ ] Datos de inicialización completos

- [ ] **Configuración de Base de Datos**
  - [ ] `docker-compose.prod.yml` configurado correctamente
  - [ ] Contraseña de PostgreSQL cambiada (NO usar `postgres123`)
  - [ ] Variables de entorno de producción configuradas
  - [ ] Volumen de datos persistente configurado
  - [ ] Límites de memoria y CPU establecidos

- [ ] **Backups Configurados**
  ```bash
  bash scripts/setup-backup-automatico.sh
  ```
  - [ ] Backups automáticos cada 6 horas
  - [ ] Retención de 30 días
  - [ ] Directorio `backups/` creado
  - [ ] Probado backup manual
  - [ ] Probado restauración de backup
  - [ ] Cron jobs verificados: `crontab -l`

---

### 🔐 SEGURIDAD

- [ ] **Usuarios y Contraseñas**
  - [ ] **CRÍTICO**: Cambiar password del usuario `admin` (NO dejar `admin123`)
  - [ ] **CRÍTICO**: Cambiar password de PostgreSQL
  - [ ] Crear usuarios reales para vendedores
  - [ ] Eliminar o desactivar usuarios de prueba si no se necesitan

- [ ] **Configuración de Seguridad**
  - [ ] HTTPS/SSL configurado
  - [ ] Firewall configurado (solo puertos necesarios abiertos)
  - [ ] CORS configurado correctamente
  - [ ] Secrets y API keys en variables de entorno (NO en código)
  - [ ] `application-prod.properties` sin datos sensibles hardcodeados

- [ ] **Validación de Accesos**
  - [ ] Probar login con todos los roles
  - [ ] Verificar permisos de cada rol
  - [ ] Probar bloqueo de cuenta por intentos fallidos
  - [ ] Verificar que usuarios inactivos no pueden acceder

---

### 🔧 CONFIGURACIÓN DEL SISTEMA

- [ ] **Variables de Entorno**
  - [ ] `SPRING_PROFILES_ACTIVE=prod` en backend
  - [ ] `VITE_API_BASE_URL` apuntando a producción
  - [ ] Base de datos apuntando a `gmarm_prod`
  - [ ] Logs configurados para producción

- [ ] **Archivos de Configuración**
  - [ ] `application-prod.properties` completo
  - [ ] `docker-compose.prod.yml` revisado
  - [ ] `.env.production` en frontend
  - [ ] Nginx configurado (si aplica)

- [ ] **Configuración del Sistema**
  - [ ] IVA configurado (15%)
  - [ ] Datos del comerciante actualizados
  - [ ] Licencias de importación cargadas
  - [ ] Tipos de documento configurados
  - [ ] Categorías de armas cargadas

---

### 🏗️ INFRAESTRUCTURA

- [ ] **Servidor**
  - [ ] Espacio en disco suficiente (min 50GB recomendado)
  - [ ] RAM suficiente (min 4GB recomendado)
  - [ ] Docker y Docker Compose instalados
  - [ ] Sistema operativo actualizado
  - [ ] Timezone configurado correctamente

- [ ] **Networking**
  - [ ] Dominio configurado (si aplica)
  - [ ] DNS apuntando correctamente
  - [ ] Certificado SSL válido
  - [ ] Puertos correctos abiertos:
    - 80 (HTTP)
    - 443 (HTTPS)
    - 8080 (Backend - solo interno)
    - 5432 (PostgreSQL - solo interno)

- [ ] **Monitoreo**
  - [ ] Logs configurados y accesibles
  - [ ] Alertas de espacio en disco
  - [ ] Monitoreo de memoria de PostgreSQL
  - [ ] Health check endpoint funcionando

---

### 💻 CÓDIGO Y COMPILACIÓN

- [ ] **Backend**
  ```bash
  cd backend
  mvn clean install -DskipTests
  ```
  - [ ] Compila sin errores
  - [ ] Tests críticos pasan
  - [ ] Dockerfile funciona correctamente
  - [ ] Sin TODOs críticos en código

- [ ] **Frontend**
  ```bash
  cd frontend
  npm run build
  ```
  - [ ] Build exitoso
  - [ ] Sin errores en consola
  - [ ] Bundles optimizados
  - [ ] Variables de entorno correctas

---

### 🧪 TESTING

- [ ] **Funcionalidades Core**
  - [ ] Login/Logout
  - [ ] Crear cliente (civil y uniformado)
  - [ ] Crear venta (contado y crédito)
  - [ ] Generar documentos (contrato, autorización, cotización)
  - [ ] Asignar serie a arma
  - [ ] Registrar pago
  - [ ] Crear grupo de importación
  - [ ] Cargar documentos a grupo

- [ ] **Roles y Permisos**
  - [ ] Vendedor: puede crear clientes y ventas
  - [ ] Jefe de Ventas: puede gestionar grupos
  - [ ] Finanzas: puede cargar series masivamente
  - [ ] Operaciones: puede gestionar documentos
  - [ ] Admin: acceso completo

- [ ] **Generación de Documentos**
  - [ ] Contrato de compra (civil)
  - [ ] Contrato de compra (uniformado - Policía/ISSPOL)
  - [ ] Contrato de compra (uniformado - FF.AA./ISSFA)
  - [ ] Autorización de venta
  - [ ] Solicitud de compra
  - [ ] Cotización
  - [ ] PDFs se generan correctamente
  - [ ] Datos dinámicos se cargan (licencia, trámite)

---

### 📊 DATOS

- [ ] **Datos Maestros**
  - [ ] Licencias de importación cargadas
  - [ ] Categorías de armas completas
  - [ ] Tipos de cliente configurados
  - [ ] Tipos de documento cargados
  - [ ] Rangos militares/policiales cargados

- [ ] **Validación de Datos**
  ```bash
  bash scripts/verificar-datos-prod.sh
  ```
  - [ ] Sin datos duplicados
  - [ ] Referencias íntegras (foreign keys)
  - [ ] Sequences correctas
  - [ ] Sin registros huérfanos

---

### 🚀 DESPLIEGUE

- [ ] **Pre-Despliegue**
  - [ ] Código en branch `main` actualizado
  - [ ] Git push completado
  - [ ] Backup de producción actual (si aplica)
  - [ ] Ventana de mantenimiento comunicada

- [ ] **Despliegue**
  ```bash
  bash scripts/deploy-prod.sh
  ```
  - [ ] Contenedores levantados
  - [ ] Base de datos inicializada
  - [ ] Backend responde (health check)
  - [ ] Frontend carga correctamente

- [ ] **Post-Despliegue**
  - [ ] Verificar que servicios están corriendo
  - [ ] Probar login
  - [ ] Verificar funcionalidades críticas
  - [ ] Revisar logs por errores
  - [ ] Crear backup inmediato

---

### 📝 DOCUMENTACIÓN

- [ ] **Usuarios**
  - [ ] Manual de usuario actualizado
  - [ ] Videos tutoriales (si aplica)
  - [ ] FAQs documentadas

- [ ] **Técnica**
  - [ ] README.md actualizado
  - [ ] Instrucciones de despliegue
  - [ ] Procedimientos de backup/restore
  - [ ] Contactos de emergencia

---

### 🔄 PROCEDIMIENTOS

- [ ] **Backup y Recuperación**
  - [ ] Procedimiento de backup documentado
  - [ ] Procedimiento de restore documentado
  - [ ] Backup probado al menos una vez
  - [ ] Restore probado al menos una vez
  - [ ] Tiempo de recuperación conocido (RTO)

- [ ] **Monitoreo y Alertas**
  - [ ] Sistema de monitoreo configurado
  - [ ] Alertas críticas configuradas
  - [ ] Responsables asignados
  - [ ] Procedimiento de escalación definido

- [ ] **Mantenimiento**
  - [ ] Plan de mantenimiento definido
  - [ ] Ventanas de mantenimiento programadas
  - [ ] Procedimiento de rollback documentado

---

## 🎯 VALIDACIÓN FINAL

Ejecutar todos los scripts de validación:

```bash
# 1. Validar SQL maestro
bash scripts/validar-sql-maestro.sh

# 2. Verificar datos de producción
bash scripts/verificar-datos-prod.sh

# 3. Crear backup completo
bash scripts/backup-completo-prod.sh

# 4. Health check del sistema
curl http://localhost:8080/api/health
```

---

## ✅ APROBACIÓN

**Lista de verificación completada por**: _______________
**Fecha**: _______________
**Firma**: _______________

**Aprobación para producción por**: _______________
**Fecha**: _______________
**Firma**: _______________

---

## 📞 CONTACTOS DE EMERGENCIA

**Desarrollador Principal**: _________________
**Teléfono**: _________________
**Email**: _________________

**Administrador de Sistemas**: _________________
**Teléfono**: _________________
**Email**: _________________

**Soporte Técnico**: _________________
**Teléfono**: _________________
**Email**: _________________

---

## 📅 PLAN DE ROLLBACK

En caso de problemas críticos en producción:

1. **DETENER servicios**:
   ```bash
   docker-compose -f docker-compose.prod.yml stop
   ```

2. **RESTAURAR backup anterior**:
   ```bash
   bash scripts/restore-backup.sh backups/completos/gmarm-completo-[TIMESTAMP].tar.gz
   ```

3. **VERIFICAR restauración**:
   ```bash
   bash scripts/verificar-datos-prod.sh
   ```

4. **REINICIAR servicios**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

**Tiempo estimado de rollback**: 15-30 minutos

---

## 🎉 ¡TODO LISTO PARA PRODUCCIÓN!

Una vez completado este checklist, el sistema GMARM está listo para producción.

**Última actualización**: 11 de febrero de 2026

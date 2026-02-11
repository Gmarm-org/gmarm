# 📘 GUÍA DE RESETEO DE BASE DE DATOS

**Fecha**: 11 de febrero de 2026
**Script validado**: `reset-bd-desde-cero.sh`

---

## 🎯 ¿Qué hace este script?

El script `reset-bd-desde-cero.sh` realiza un **reseteo completo** del sistema:

1. ✅ Elimina completamente la base de datos (incluye volúmenes Docker)
2. ✅ Recrea la base de datos desde el SQL maestro
3. ✅ Elimina TODOS los documentos generados (contratos, cotizaciones, recibos)
4. ✅ Elimina TODOS los archivos subidos (documentos de clientes, imágenes)
5. ✅ Verifica que los datos se cargaron correctamente
6. ✅ Reinicia todos los servicios

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### 🔴 PÉRDIDA TOTAL DE DATOS

Este script elimina **PERMANENTEMENTE**:
- Todos los registros de la base de datos
- Todos los documentos generados (PDFs)
- Todos los archivos subidos por clientes
- Todas las imágenes de armas
- **NO HAY FORMA DE RECUPERAR ESTOS DATOS**

### 🟡 CUÁNDO USAR ESTE SCRIPT

✅ **Usar en estos casos:**
- Desarrollo local cuando quieres datos limpios
- Testing para validar el SQL maestro
- Después de hacer cambios grandes al esquema de BD
- Para limpiar datos de prueba acumulados

❌ **NUNCA usar en:**
- Producción con datos reales de clientes
- Si no tienes un backup reciente
- Si hay transacciones en curso
- Si otros usuarios están trabajando en el sistema

---

## 🚀 CÓMO USAR EL SCRIPT

### Sintaxis

```bash
bash scripts/reset-bd-desde-cero.sh [AMBIENTE]
```

**Ambientes disponibles:**
- `local` (por defecto) - Para desarrollo local
- `dev` - Para ambiente de desarrollo
- `prod` - Para producción (⚠️ USAR CON EXTREMO CUIDADO)

### Ejemplos

```bash
# Resetear ambiente local (default)
bash scripts/reset-bd-desde-cero.sh

# O explícitamente
bash scripts/reset-bd-desde-cero.sh local

# Resetear ambiente dev
bash scripts/reset-bd-desde-cero.sh dev

# ⚠️ Resetear producción (requiere confirmación)
bash scripts/reset-bd-desde-cero.sh prod
```

---

## 📋 PROCESO PASO A PASO

### 1. Pre-validación

El script verifica automáticamente:
- ✅ Que existe el archivo `datos/00_gmarm_completo.sql`
- ✅ Que el ambiente especificado es válido
- ✅ Solicita confirmación del usuario (debes escribir `SI`)

### 2. Proceso de Reseteo

```
Paso 1/6: Detener servicios y eliminar volúmenes
├── docker-compose down -v
└── Elimina base de datos completamente

Paso 2/6: Eliminar archivos generados
├── documentacion/documentos_cliente/*
├── documentacion/contratos_generados/*
├── documentacion/autorizaciones/*
├── uploads/clientes/*
├── uploads/images/weapons/*
└── backend/uploads/*

Paso 3/6: Iniciar PostgreSQL
└── Solo inicia el contenedor de PostgreSQL

Paso 4/6: Esperar a PostgreSQL
├── Verifica que el contenedor esté corriendo
├── Verifica que PostgreSQL responda (60 intentos)
└── Espera estabilización (10 segundos adicionales)

Paso 5/6: Recrear base de datos
├── DROP DATABASE IF EXISTS
├── CREATE DATABASE (con UTF-8)
├── Cargar SQL maestro (1-2 minutos)
└── Reintentos automáticos si falla

Paso 6/6: Verificar datos
├── Contar usuarios, roles, armas, etc.
├── Validar que haya datos mínimos esperados
└── Mostrar advertencias si falta algo
```

### 3. Inicio de Servicios

- Inicia todos los servicios: `docker-compose up -d`
- Espera 15 segundos para estabilización
- Muestra estado final del sistema

---

## ✅ VALIDACIONES QUE HACE EL SCRIPT

### Pre-ejecución
- [x] Verifica que existe el SQL maestro
- [x] Valida el ambiente (local/dev/prod)
- [x] Solicita confirmación del usuario

### Durante ejecución
- [x] Manejo de permisos (intenta con/sin sudo)
- [x] Verifica que PostgreSQL esté listo (3 checks consecutivos)
- [x] Reintentos en comandos SQL (hasta 5 intentos)
- [x] Reintentos en carga de SQL maestro (hasta 3 intentos)
- [x] Verifica estado del contenedor en cada paso

### Post-ejecución
- [x] Verifica cantidad de usuarios (espera ≥ 3)
- [x] Verifica cantidad de roles (espera ≥ 5)
- [x] Verifica cantidad de licencias (espera ≥ 1)
- [x] Muestra conteos de armas, clientes, categorías
- [x] Muestra estado de servicios Docker

---

## 🔍 VERIFICACIÓN MANUAL

Después de ejecutar el script, verifica:

### 1. Estado de Servicios

```bash
docker-compose -f docker-compose.local.yml ps
```

**Esperado:**
```
NAME                    STATUS
gmarm-postgres-local    Up
gmarm-backend-local     Up
gmarm-frontend-local    Up
```

### 2. Acceso a la Base de Datos

```bash
docker exec gmarm-postgres-local psql -U postgres -d gmarm_local -c "SELECT COUNT(*) FROM usuario;"
```

**Esperado:** Al menos 3 usuarios

### 3. Verificar Usuarios Disponibles

```bash
docker exec gmarm-postgres-local psql -U postgres -d gmarm_local \
  -c "SELECT id, username, email, nombres FROM usuario ORDER BY id;"
```

**Esperado:**
```
 id | username         | email                           | nombres
----+------------------+---------------------------------+---------
  1 | admin            | admin@test.com                  | Admin
  2 | vendedor         | vendedor@test.com               | Vendedor
  3 | david.guevara    | czcorp@hotmail.com              | David
  4 | franklin.endara  | franklin.endara@hotmail.com     | Franklin
```

### 4. Probar Login en Frontend

**Ambiente Local:** http://localhost:5173

**Credenciales de prueba:**
```
Usuario: admin@test.com
Password: admin123
```

```
Usuario: vendedor@test.com
Password: admin123
```

### 5. Verificar Datos con Script

```bash
bash scripts/verificar-datos-prod.sh
```

Este script adicional verifica:
- Integridad referencial
- Secuencias correctas
- Sin duplicados
- Configuración del sistema

---

## 🐛 TROUBLESHOOTING

### Error: "PostgreSQL no está listo después de 60 intentos"

**Causa:** El contenedor no inicia correctamente

**Solución:**
```bash
# Ver logs de PostgreSQL
docker logs gmarm-postgres-local --tail 50

# Verificar memoria
docker stats --no-stream

# Si hay problemas de memoria, aumentar límite en docker-compose
```

### Error: "No se encuentra el archivo datos/00_gmarm_completo.sql"

**Causa:** El SQL maestro no existe o estás en directorio incorrecto

**Solución:**
```bash
# Verificar que estás en el directorio raíz del proyecto
pwd
# Debe mostrar: /Users/cesartenemaza/Documents/gmarm/gmarm

# Verificar que existe el SQL maestro
ls -lh datos/00_gmarm_completo.sql
```

### Error: "Error cargando SQL maestro después de 3 intentos"

**Causa:** El SQL tiene errores de sintaxis o PostgreSQL tiene problemas

**Solución:**
```bash
# Validar sintaxis del SQL maestro
bash scripts/validar-sql-maestro.sh

# Si el script dice que hay errores, corregirlos primero
```

### Error: "Algunos archivos no se pudieron eliminar"

**Causa:** Problemas de permisos en archivos generados

**Solución:**
```bash
# El script intenta con sudo automáticamente
# Si falla, ejecutar manualmente:
sudo chmod -R u+w documentacion/ uploads/ backend/uploads/
sudo rm -rf documentacion/* uploads/* backend/uploads/*
```

### Advertencia: "Se esperaban al menos 3 usuarios"

**Causa:** El SQL maestro no se cargó completamente

**Solución:**
```bash
# Verificar que el SQL maestro está completo
wc -l datos/00_gmarm_completo.sql
# Debe tener varios cientos de líneas

# Revisar logs de carga
docker logs gmarm-postgres-local | grep ERROR
```

---

## 📊 DATOS ESPERADOS DESPUÉS DEL RESET

Después de un reset exitoso, deberías tener:

| Entidad | Cantidad Mínima | Descripción |
|---------|----------------|-------------|
| **Usuarios** | ≥ 3 | admin, vendedor, otros |
| **Roles** | ≥ 5 | ADMIN, VENDOR, FINANCE, SALES_CHIEF, OPERATIONS |
| **Licencias** | ≥ 1 | Licencia de importación activa |
| **Categorías de Armas** | ≥ 3 | Pistola, Revólver, etc. |
| **Tipos de Cliente** | ≥ 2 | Civil, Uniformado |
| **Tipos de Identificación** | ≥ 2 | Cédula, Pasaporte, etc. |
| **Configuración Sistema** | ≥ 1 | IVA y otras configuraciones |

### Verificación Rápida

```bash
# Ejecutar todas las verificaciones
docker exec gmarm-postgres-local psql -U postgres -d gmarm_local <<EOF
SELECT 'Usuarios' as tabla, COUNT(*) as total FROM usuario
UNION ALL
SELECT 'Roles', COUNT(*) FROM rol
UNION ALL
SELECT 'Licencias', COUNT(*) FROM licencia
UNION ALL
SELECT 'Categorías', COUNT(*) FROM categoria_arma
UNION ALL
SELECT 'Tipos Cliente', COUNT(*) FROM tipo_cliente
ORDER BY tabla;
EOF
```

---

## 🎯 CHECKLIST POST-RESET

Después de ejecutar el script, verifica:

- [ ] Todos los servicios están `Up` (docker ps)
- [ ] PostgreSQL responde (docker exec ... pg_isready)
- [ ] Usuarios ≥ 3 (verificado por script)
- [ ] Roles ≥ 5 (verificado por script)
- [ ] Licencias ≥ 1 (verificado por script)
- [ ] Frontend accesible (http://localhost:5173)
- [ ] Backend responde (http://localhost:8080/actuator/health)
- [ ] Login funciona con admin@test.com
- [ ] No hay errores en logs del backend
- [ ] Script validar-sql-maestro.sh pasa ✅

---

## 💡 CONSEJOS Y MEJORES PRÁCTICAS

### Antes de Ejecutar

1. **Haz un backup** (si tienes datos que podrías necesitar):
   ```bash
   bash scripts/backup-completo-prod.sh
   ```

2. **Valida el SQL maestro**:
   ```bash
   bash scripts/validar-sql-maestro.sh
   ```

3. **Cierra la aplicación** (si está abierta en el navegador)

4. **Asegúrate de tener espacio en disco** (al menos 1GB libre)

### Durante la Ejecución

- **No interrumpas el script** (Ctrl+C) mientras está corriendo
- **Observa los mensajes** - el script te dirá si algo falla
- **Espera a que termine completamente** - puede tomar 2-5 minutos

### Después de Ejecutar

1. **Verifica los servicios** antes de empezar a trabajar
2. **Prueba el login** con los usuarios de prueba
3. **Revisa los logs** si algo no funciona:
   ```bash
   docker logs gmarm-backend-local --tail 100
   ```

4. **Ejecuta el script de validación**:
   ```bash
   bash scripts/verificar-datos-prod.sh
   ```

---

## 🔒 SEGURIDAD EN PRODUCCIÓN

### ⚠️ PRECAUCIONES PARA PRODUCCIÓN

Si **absolutamente debes** ejecutar este script en producción:

1. **HACER BACKUP COMPLETO** primero:
   ```bash
   bash scripts/backup-completo-prod.sh
   ```

2. **Verificar el backup**:
   ```bash
   ls -lh backups/completos/
   ```

3. **Programar ventana de mantenimiento** (usuarios informados)

4. **Tener plan de rollback**:
   ```bash
   # En caso de problemas, restaurar:
   bash scripts/restore-backup.sh backups/completos/gmarm-completo-TIMESTAMP.tar.gz
   ```

5. **Cambiar passwords** después del reset:
   - admin@test.com → cambiar contraseña
   - Contraseña de PostgreSQL → cambiar en docker-compose.prod.yml

6. **Probar exhaustivamente** antes de dar acceso a usuarios

---

## 📞 SOPORTE

Si encuentras problemas:

1. **Revisar esta guía** - La mayoría de problemas están documentados
2. **Revisar logs**:
   ```bash
   docker logs gmarm-postgres-local --tail 100
   docker logs gmarm-backend-local --tail 100
   ```
3. **Ejecutar script de validación**:
   ```bash
   bash scripts/validar-sql-maestro.sh
   bash scripts/verificar-datos-prod.sh
   ```

---

## 📝 HISTORIAL DE CAMBIOS

**v1.1 - 2026-02-11**
- ✅ Validación de SQL maestro al inicio
- ✅ Mejor cálculo de espacio liberado
- ✅ Verificaciones adicionales (roles, categorías, licencias)
- ✅ Advertencias si faltan datos esperados
- ✅ Instrucciones detalladas post-reset
- ✅ Información de usuarios de prueba

**v1.0 - Original**
- ✅ Reset básico de BD
- ✅ Eliminación de archivos
- ✅ Soporte multi-ambiente

---

**Última actualización:** 11 de febrero de 2026

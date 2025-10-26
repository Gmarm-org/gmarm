# 🔄 Reiniciar Base de Datos en Servidor Dev

## 📋 Pre-requisitos

✅ **Verificar que los pipelines estén en verde** (todos los tests pasando)

```bash
# Ver estado de pipelines desde tu local (Windows)
gh run list --limit 5

# Debe mostrar ✓ en los commits recientes
```

## 🚀 Ejecutar en Servidor Dev (Linux)

### **Paso 1: Conectar al servidor**

```bash
ssh usuario@72.167.52.14
```

### **Paso 2: Ir al directorio del proyecto**

```bash
cd /ruta/al/proyecto/gmarm
```

### **Paso 3: Hacer pull de los últimos cambios**

```bash
git pull origin dev
```

### **Paso 4: Dar permisos de ejecución al script**

```bash
chmod +x reset-dev-database.sh
```

### **Paso 5: Ejecutar el script de reinicio**

```bash
./reset-dev-database.sh
```

**⚠️ IMPORTANTE:** Este script:
- ❌ Eliminará todos los datos actuales de desarrollo
- ✅ Creará la base de datos desde 0 con el SQL maestro
- ✅ Incluirá todos los usuarios de prueba y vendedores piloto

---

## 📝 ¿Qué hace el script?

1. **Detiene servicios** (`docker-compose down -v`)
2. **Elimina volúmenes** (datos antiguos)
3. **Levanta PostgreSQL**
4. **Ejecuta SQL maestro** (`datos/00_gmarm_completo.sql`)
5. **Verifica datos** (usuarios, clientes, armas, etc.)
6. **Levanta todos los servicios** (backend, frontend)

---

## 🔍 Verificar que funcionó

### **Opción 1: Desde el servidor**

```bash
# Ver logs del backend
docker logs gmarm-backend-dev --tail 50

# Ver logs del frontend
docker logs gmarm-frontend-dev --tail 50

# Verificar que PostgreSQL tiene datos
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM usuario;"
```

### **Opción 2: Desde el navegador**

```
http://72.167.52.14:5173
```

Loguéate con:
- **Email:** `admin@armasimportacion.com`
- **Password:** `admin123`

---

## 👥 Usuarios Disponibles

Después del reinicio, estos usuarios estarán disponibles:

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| Admin | admin@armasimportacion.com | admin123 | ADMIN |
| Jefe | jefe@test.com | admin123 | JEFE |
| Vendedor Test | vendedor@test.com | admin123 | VENDOR |
| **Karolina Pazmiño** | karritogeova@hotmail.com | admin123 | VENDOR |
| **Rossy Revelo** | rossy-revelo@hotmail.com | admin123 | VENDOR |
| Finanzas | finanzas@test.com | admin123 | FINANCE |
| Operaciones | operaciones@test.com | admin123 | OPERATIONS |

---

## 🐛 Troubleshooting

### **Error: "docker-compose: command not found"**

```bash
# Verificar si está instalado
docker compose version

# O usar el comando sin guión
docker compose -f docker-compose.dev.yml down -v
```

### **Error: "Permission denied"**

```bash
# Dar permisos de ejecución
chmod +x reset-dev-database.sh

# Ejecutar con sudo si es necesario
sudo ./reset-dev-database.sh
```

### **PostgreSQL no responde**

```bash
# Ver logs de PostgreSQL
docker logs gmarm-postgres-dev

# Reiniciar manualmente
docker restart gmarm-postgres-dev
```

### **Backend no inicia**

```bash
# Ver logs
docker logs gmarm-backend-dev --tail 100

# Reconstruir imagen
docker-compose -f docker-compose.dev.yml up -d --build gmarm-backend-dev
```

---

## 🔄 Alternativa: Reinicio Manual

Si el script falla, puedes hacerlo manualmente:

```bash
# 1. Detener todo
docker-compose -f docker-compose.dev.yml down -v

# 2. Levantar solo PostgreSQL
docker-compose -f docker-compose.dev.yml up -d gmarm-postgres-dev

# 3. Esperar 10 segundos
sleep 10

# 4. Ejecutar SQL maestro
cat datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev

# 5. Levantar todo
docker-compose -f docker-compose.dev.yml up -d

# 6. Ver logs
docker-compose -f docker-compose.dev.yml logs -f
```

---

## 📞 Contacto

Si tienes problemas, contacta al equipo de desarrollo.

---

**Última actualización:** Octubre 2025
**Versión:** 1.0


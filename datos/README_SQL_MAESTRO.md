# 📊 SQL Maestro - Base de Datos Completa

## 🎯 Descripción

El archivo `00_gmarm_completo.sql` contiene el **schema completo** y **datos iniciales** para el sistema GMARM en ambiente de desarrollo.

## 📦 Contenido

### 1. **Schema de Base de Datos**
- Todas las tablas del sistema
- Relaciones (Foreign Keys)
- Índices
- Constraints
- Triggers

### 2. **Datos Iniciales**
- ✅ Roles del sistema (ADMIN, VENDOR, FINANCE, etc.)
- ✅ Tipos de cliente (Civil, Militar, Policía, Empresa, etc.)
- ✅ Tipos de identificación (Cédula, RUC, Pasaporte)
- ✅ Provincias y cantones de Ecuador
- ✅ Configuración del sistema (IVA, edad mínima, etc.)
- ✅ Preguntas para clientes
- ✅ Tipos de documentos requeridos

### 3. **Usuarios de Prueba**
- **Admin:** `admin@armasimportacion.com` / `admin123`
- **Jefe:** `jefe@test.com` / `admin123`
- **Vendedor:** `vendedor@test.com` / `admin123`
- **Finanzas:** `finanzas@test.com` / `admin123`
- **Operaciones:** `operaciones@test.com` / `admin123`

### 4. **Vendedores Piloto** (Reales)
- **Karolina Pazmiño:** `karritogeova@hotmail.com` / `admin123`
- **Rossy Revelo:** `rossy-revelo@hotmail.com` / `admin123`

### 5. **Datos de Armas**
- Catálogo completo de armas
- Imágenes de armas (migradas automáticamente)
- Stock inicial
- Precios de referencia

### 6. **Migración de Imágenes**
- Migra URLs de imágenes antiguas a la tabla `arma_imagen`
- Agrega placeholders para armas sin imagen
- Soporta múltiples imágenes por arma

---

## 🚀 Uso

### **Opción 1: Reinicio Automático con Script**

El script `reset-dev-database.ps1` hace todo automáticamente:

```powershell
# Ejecutar desde la raíz del proyecto
.\reset-dev-database.ps1
```

**¿Qué hace el script?**
1. ✅ Detiene todos los servicios Docker
2. ✅ Elimina volúmenes (datos antiguos)
3. ✅ Levanta PostgreSQL
4. ✅ Espera a que esté listo
5. ✅ Ejecuta el SQL maestro
6. ✅ Verifica los datos
7. ✅ Levanta backend y frontend
8. ✅ Muestra credenciales de acceso

### **Opción 2: Manual**

```powershell
# 1. Detener y limpiar
docker-compose -f docker-compose.local.yml down -v

# 2. Levantar PostgreSQL
docker-compose -f docker-compose.local.yml up -d gmarm-postgres-local

# 3. Esperar ~10 segundos

# 4. Ejecutar SQL maestro
Get-Content datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-local psql -U postgres -d gmarm_dev

# 5. Levantar todo
docker-compose -f docker-compose.local.yml up -d
```

---

## 🔄 Actualizar el SQL Maestro

Cuando hagas cambios al schema:

1. Modifica `00_gmarm_completo.sql`
2. Prueba con `.\reset-dev-database.ps1`
3. Si funciona, commit y push:
   ```powershell
   git add datos/00_gmarm_completo.sql
   git commit -m "feat: actualizar schema de BD"
   git push origin dev
   ```

---

## ✅ Verificación

Después de ejecutar el SQL maestro, verifica:

```sql
-- Conectar a la BD
docker exec -it gmarm-postgres-local psql -U postgres -d gmarm_dev

-- Verificar tablas
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Verificar datos
SELECT 'Usuarios:' as tabla, COUNT(*) as total FROM usuario
UNION ALL
SELECT 'Clientes:', COUNT(*) FROM cliente
UNION ALL
SELECT 'Armas:', COUNT(*) FROM arma
UNION ALL
SELECT 'Tipos Cliente:', COUNT(*) FROM tipo_cliente;

-- Verificar usuarios y roles
SELECT 
    u.email,
    STRING_AGG(r.codigo, ', ') as roles
FROM usuario u
LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id
LEFT JOIN rol r ON ur.rol_id = r.id
GROUP BY u.email
ORDER BY u.email;
```

---

## 🐛 Troubleshooting

### **Error: Base de datos vacía**
```powershell
# Eliminar volumen y reiniciar
docker-compose -f docker-compose.local.yml down -v
.\reset-dev-database.ps1
```

### **Error: PostgreSQL no responde**
```powershell
# Ver logs
docker logs gmarm-postgres-local

# Reiniciar contenedor
docker restart gmarm-postgres-local
```

### **Error: Datos duplicados**
El SQL maestro usa `ON CONFLICT DO NOTHING` y `ON CONFLICT DO UPDATE`, así que es **seguro** ejecutarlo múltiples veces.

---

## 📌 Notas Importantes

1. ✅ **El SQL maestro es idempotente:** Se puede ejecutar múltiples veces sin romper datos
2. ✅ **Contraseñas temporales:** Todas son `admin123` - cambiar en producción
3. ✅ **Solo para desarrollo:** Este script tiene datos de prueba
4. ✅ **Backup automático:** `reset-dev-database.ps1` guarda backup antes de reiniciar
5. ✅ **Campo rango:** Ya incluido en la tabla `cliente` para rangos militares

---

## 🔐 Seguridad

⚠️ **NUNCA usar en producción:**
- Las contraseñas son conocidas (`admin123`)
- Los emails son de prueba
- Los datos son ficticios

Para producción, crear un script específico con:
- Contraseñas seguras hasheadas
- Solo datos necesarios
- Sin usuarios de prueba
- Configuraciones de producción

---

## 📚 Recursos

- **Script de reinicio:** `reset-dev-database.ps1`
- **SQL maestro:** `datos/00_gmarm_completo.sql`
- **Backup automático:** `datos/00_gmarm_completo.sql.backup`
- **Docker Compose:** `docker-compose.local.yml`

---

**Última actualización:** Octubre 2025
**Versión:** 2.0 - Completo con vendedores piloto e imágenes


# 🔧 Solución: Pérdida de Datos en DEV

## 📋 Problema Identificado

### ❌ **Síntoma:**
- Los usuarios reportan 404 en DEV
- Los datos desaparecen después de reiniciar el sistema
- La base de datos está "inestable"

### 🔍 **Causa Raíz:**

El problema **NO está en la configuración de Hibernate**. La configuración actual es correcta:

```properties
# backend/src/main/resources/application-docker.properties
spring.jpa.hibernate.ddl-auto=update  ✅ CORRECTO
```

**El problema real es:**

1. **PostgreSQL en Docker usa volúmenes persistentes:**
   ```yaml
   volumes:
     - postgres_data_dev:/var/lib/postgresql/data  # Persiste datos
     - ./datos/00_gmarm_completo.sql:/docker-entrypoint-initdb.d/00_gmarm_completo.sql  # Script inicial
   ```

2. **Los scripts en `/docker-entrypoint-initdb.d/` se ejecutan SOLO UNA VEZ:**
   - Cuando se crea el volumen por primera vez
   - Si se ejecuta `docker-compose down -v`, se elimina el volumen
   - La próxima vez que se levanta, el script maestro se ejecuta nuevamente

3. **El script maestro NO incluía las 500 series:**
   - Solo incluía: usuarios, roles, clientes de prueba, armas, categorías, etc.
   - Las 500 series se insertaron manualmente en LOCAL, pero no estaban en el SQL maestro
   - Por eso desaparecían cada vez que se recreaba el volumen

---

## ✅ Solución Implementada

### 1. **Se agregaron las 500 series al SQL maestro**

```sql
-- datos/00_gmarm_completo.sql (línea 1540-2045)

-- ========================================
-- SERIES DE ARMAS (500 PLAN PILOTO)
-- ========================================
INSERT INTO arma_serie (numero_serie, arma_id, estado, observaciones) VALUES
('D286252', (SELECT id FROM arma WHERE codigo = 'CZ-P10-SC-URBAN-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),
('D286254', (SELECT id FROM arma WHERE codigo = 'CZ-P10-SC-URBAN-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras'),
-- ... (500 series totales)
('K233330', (SELECT id FROM arma WHERE codigo = 'CZ-SHADOW-2-COMPACT-OR-PLAN-PILOTO'), 'DISPONIBLE', '2 alimentadoras')

ON CONFLICT (numero_serie) DO NOTHING;
```

### 2. **Garantía de Unicidad**

- `ON CONFLICT (numero_serie) DO NOTHING` evita duplicados
- Si el script se ejecuta múltiples veces, solo inserta series nuevas
- La constraint `UNIQUE` en `numero_serie` garantiza integridad

---

## 🔄 Flujo de Datos en DEV

### **Escenario 1: Primer Deploy (Volumen Nuevo)**

```bash
docker-compose -f docker-compose.dev.yml up -d
```

1. PostgreSQL crea el volumen `postgres_data_dev`
2. Ejecuta automáticamente `00_gmarm_completo.sql`
3. Se cargan:
   - ✅ Usuarios (admin, jefe, vendedores)
   - ✅ Roles (ADMIN, SALES_CHIEF, VENDOR, FINANCE)
   - ✅ Clientes de prueba
   - ✅ 17 modelos PLAN PILOTO
   - ✅ **500 series** 🎉
4. **Los datos persisten** entre reinicios normales

### **Escenario 2: Reinicio Normal (Sin -v)**

```bash
docker-compose -f docker-compose.dev.yml restart
# o
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

1. El volumen `postgres_data_dev` **NO se elimina**
2. Los datos **persisten**
3. Hibernate usa `ddl-auto=update` (no borra nada)
4. **Todo sigue funcionando** ✅

### **Escenario 3: Recrear Volumen (Con -v)**

```bash
docker-compose -f docker-compose.dev.yml down -v  # ⚠️ Elimina volumen
docker-compose -f docker-compose.dev.yml up -d
```

1. Se elimina el volumen `postgres_data_dev`
2. Se crea un volumen nuevo
3. Se ejecuta `00_gmarm_completo.sql` desde cero
4. **Todos los datos se cargan nuevamente**, incluyendo las 500 series ✅

---

## 📊 Distribución de Series en el Maestro

| Serie | Modelo | Cantidad |
|-------|--------|----------|
| **P-09** | CZ P-09 C NOCTURNE | 27 |
| **P-09** | CZ P-09 C NOCTURNE SNIPER GREY | 20 |
| **P-09** | CZ P-09 F Nocturne FDE | 20 |
| **P-09** | CZ P-09 F Nocturne OD Green | 30 |
| **P-10** | CZ P-10 C | **125** ⭐ |
| **P-10** | CZ P-10 C OR | 5 |
| **P-10** | CZ P-10 C OR FDE | 10 |
| **P-10** | CZ P-10 F | 57 |
| **P-10** | CZ P-10 F FDE | 73 |
| **P-10** | CZ P-10 F MIRAS TRITIUM | 20 |
| **P-10** | CZ P-10 F OR | 5 |
| **P-10** | CZ P-10 S | 5 |
| **P-10** | CZ P-10 SC | 20 |
| **P-10** | CZ P-10 SC FDE | 30 |
| **P-10** | CZ P-10 SC Urban Grey | 33 |
| **Shadow** | CZ Shadow 2 Carry | 10 |
| **Shadow** | CZ Shadow 2 Compact OR | 10 |
| | **TOTAL** | **500** ✅ |

---

## 🚀 Instrucciones para DEV

### **Para Aplicar la Solución en el Servidor:**

```bash
# 1. Hacer pull de los cambios (incluye el SQL maestro actualizado)
git pull origin dev

# 2. Recrear el volumen con el SQL maestro actualizado
docker-compose -f docker-compose.dev.yml down -v

# 3. Levantar servicios
docker-compose -f docker-compose.dev.yml up -d --build

# 4. Verificar que las series se cargaron
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM arma_serie;"
# Debería mostrar: 500
```

### **Para Verificar Datos en DEV:**

```bash
# Verificar usuarios
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT email, nombres FROM usuario;"

# Verificar modelos PLAN PILOTO
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM arma WHERE codigo LIKE '%PLAN-PILOTO%';"
# Debería mostrar: 17

# Verificar series
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM arma_serie;"
# Debería mostrar: 500

# Verificar distribución de series por modelo
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "
SELECT 
    a.codigo, 
    a.nombre, 
    COUNT(aser.id) AS series_insertadas 
FROM arma a 
LEFT JOIN arma_serie aser ON a.id = aser.arma_id 
WHERE a.codigo LIKE '%PLAN-PILOTO%' 
GROUP BY a.codigo, a.nombre 
ORDER BY a.nombre;
"
```

---

## ⚠️ **IMPORTANTE: Buenas Prácticas**

### ❌ **NO Hacer:**

```bash
# NO eliminar volumen sin necesidad
docker-compose -f docker-compose.dev.yml down -v  # Solo si es necesario

# NO modificar ddl-auto a "create" o "create-drop"
spring.jpa.hibernate.ddl-auto=create  # ❌ Borra datos en cada reinicio
```

### ✅ **SÍ Hacer:**

```bash
# Reinicio normal (preserva datos)
docker-compose -f docker-compose.dev.yml restart

# Reinicio completo sin borrar volumen
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d

# Solo recrear volumen si es necesario
docker-compose -f docker-compose.dev.yml down -v  # Solo cuando sea estrictamente necesario
docker-compose -f docker-compose.dev.yml up -d --build
```

---

## 📝 Archivos Modificados

- ✅ `datos/00_gmarm_completo.sql` - Agregadas 500 series (líneas 1540-2045)
- ✅ `backend/src/main/resources/application-docker.properties` - Configuración correcta (sin cambios)
- ✅ `docker-compose.dev.yml` - Configuración correcta (sin cambios)

---

## 🎯 Resumen

| Aspecto | Estado |
|---------|--------|
| **Configuración Hibernate** | ✅ Correcta (`update`) |
| **Persistencia de Volumen** | ✅ Configurada |
| **Script SQL Maestro** | ✅ Incluye 500 series |
| **Unicidad de Series** | ✅ `ON CONFLICT` garantiza |
| **Datos de Prueba** | ✅ Usuarios, roles, clientes |
| **Problema Resuelto** | ✅ Datos persisten en DEV |

---

## 📞 Soporte

Si los datos siguen desapareciendo después de aplicar esta solución:

1. Verificar que se hizo `git pull` para obtener el SQL maestro actualizado
2. Verificar que se ejecutó `down -v` para recrear el volumen con el nuevo script
3. Verificar los logs del backend: `docker logs gmarm-backend-dev`
4. Verificar los logs de PostgreSQL: `docker logs gmarm-postgres-dev`



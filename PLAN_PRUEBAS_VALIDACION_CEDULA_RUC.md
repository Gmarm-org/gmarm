# 🧪 Plan de Pruebas - Validación Cédula/RUC

## 📋 Resumen de Implementación

### Frontend (React + TypeScript)
- **Archivo de validación**: `frontend/src/utils/validations.ts`
- **Algoritmos implementados**:
  - ✅ Cédula ecuatoriana (10 dígitos, módulo 10)
  - ✅ RUC Persona Natural (13 dígitos, termina en 001)
  - ✅ RUC Sociedad Privada (tercer dígito = 9, módulo 11)
  - ✅ RUC Sociedad Pública (tercer dígito = 6, módulo 11)
  - ✅ Pasaporte (6-20 caracteres)

### Base de Datos
- **Tabla**: `tipo_identificacion`
- **Registros**:
  - `CED` - Cédula de Identidad
  - `RUC` - Registro Único de Contribuyentes

### Flujo de Datos
```
Frontend Select (codigo: "CED"|"RUC") 
  → Campo numeroIdentificacion 
  → Validación con algoritmo oficial
  → Backend (tipoIdentificacionCodigo)
  → BD (tipo_identificacion_id FK)
```

---

## ✅ Casos de Prueba

### 1️⃣ Prueba: Cédulas Válidas

**Cédulas ecuatorianas válidas para probar:**

| Cédula | Provincia | Estado |
|--------|-----------|--------|
| `0102030405` | Azuay (01) | ✅ Válida |
| `1712345678` | Pichincha (17) | ✅ Válida |
| `1714175071` | Pichincha (17) | ✅ Válida |
| `0123456789` | Azuay (01) | ✅ Válida |
| `1803456789` | Tungurahua (18) | ✅ Válida |

**Pasos:**
1. Abrir formulario de cliente
2. Seleccionar **Tipo de Identificación**: "Cédula de Identidad"
3. Ingresar una cédula válida (ej: `1714175071`)
4. Verificar:
   - ✅ Borde verde en el campo
   - ✅ Permite continuar con el formulario
   - ✅ Se puede guardar el cliente

**Resultado esperado:** 
- Campo muestra borde verde
- Validación pasa sin errores
- Cliente se crea exitosamente

---

### 2️⃣ Prueba: Cédulas Inválidas

**Cédulas inválidas para probar:**

| Cédula | Razón de Invalidez |
|--------|--------------------|
| `1234567890` | ❌ Dígito verificador incorrecto |
| `0012345678` | ❌ Provincia inválida (00) |
| `2512345678` | ❌ Provincia no existe (25) |
| `1762345678` | ❌ Tercer dígito >= 6 (no es persona natural) |
| `123456789` | ❌ Solo 9 dígitos (debe ser 10) |
| `12345678901` | ❌ 11 dígitos (debe ser 10) |

**Pasos:**
1. Abrir formulario de cliente
2. Seleccionar **Tipo de Identificación**: "Cédula de Identidad"
3. Ingresar una cédula inválida (ej: `1234567890`)
4. Verificar:
   - ❌ Borde rojo en el campo
   - ❌ NO permite continuar (botón deshabilitado o mensaje de error)
   - ❌ NO se puede guardar el cliente

**Resultado esperado:** 
- Campo muestra borde rojo
- Validación bloquea el guardado
- Usuario no puede avanzar

---

### 3️⃣ Prueba: RUC Persona Natural Válido

**RUCs de Persona Natural válidos:**

| RUC | Descripción |
|-----|-------------|
| `1714175071001` | ✅ Cédula `1714175071` + `001` |
| `0102030405001` | ✅ Cédula `0102030405` + `001` |
| `1803456789001` | ✅ Cédula `1803456789` + `001` |

**Pasos:**
1. Seleccionar tipo de cliente: **"Compañía de Seguridad"**
2. En **RUC de la empresa**, ingresar un RUC válido (ej: `1714175071001`)
3. Verificar:
   - ✅ Borde verde en el campo RUC
   - ✅ Permite continuar
   - ✅ Se puede guardar la empresa

**Resultado esperado:** 
- Campo muestra borde verde
- Validación pasa
- Empresa se crea exitosamente

---

### 4️⃣ Prueba: RUC Sociedad Privada Válido

**RUCs de Sociedad Privada válidos:**

| RUC | Descripción |
|-----|-------------|
| `1790016919001` | ✅ Tercer dígito = 9, módulo 11 correcto |
| `0190123456001` | ✅ Tercer dígito = 9, termina en 001 |

**Nota:** El tercer dígito debe ser **9** para sociedades privadas.

**Pasos:**
1. Seleccionar tipo de cliente: **"Compañía de Seguridad"**
2. En **RUC de la empresa**, ingresar RUC de sociedad privada (ej: `1790016919001`)
3. Verificar validación

**Resultado esperado:** 
- Campo muestra borde verde
- RUC se acepta correctamente

---

### 5️⃣ Prueba: RUC Inválido

**RUCs inválidos para probar:**

| RUC | Razón de Invalidez |
|-----|--------------------|
| `1234567890001` | ❌ Cédula base inválida |
| `171417507100` | ❌ Solo 12 dígitos (debe ser 13) |
| `17141750710011` | ❌ 14 dígitos (debe ser 13) |
| `1714175071002` | ❌ No termina en 001 (persona natural) |
| `0025123456001` | ❌ Provincia inválida (00) |

**Pasos:**
1. Seleccionar tipo: **"Compañía de Seguridad"**
2. Ingresar RUC inválido en campo RUC
3. Verificar:
   - ❌ Borde rojo
   - ❌ No permite guardar

**Resultado esperado:** 
- Campo muestra borde rojo
- Validación bloquea el guardado

---

### 6️⃣ Prueba: Cambio de Tipo de Identificación

**Escenario:** Usuario cambia de Cédula a RUC (o viceversa)

**Pasos:**
1. Seleccionar **Tipo de Identificación**: "Cédula de Identidad"
2. Ingresar cédula válida: `1714175071`
3. Ver que el campo muestra borde verde ✅
4. Cambiar **Tipo de Identificación** a: "RUC"
5. Verificar:
   - ❌ Campo ahora debe mostrar borde rojo (porque cédula de 10 dígitos no es RUC válido de 13 dígitos)
6. Ingresar RUC válido: `1714175071001`
7. Ver que el campo vuelve a borde verde ✅

**Resultado esperado:**
- La validación cambia dinámicamente según el tipo seleccionado
- Misma identificación puede ser válida para un tipo e inválida para otro

---

### 7️⃣ Prueba: Integración Completa (Cliente Civil)

**Escenario Completo: Crear Cliente Civil con Cédula**

**Datos de prueba:**
- **Tipo de Cliente**: Civil
- **Tipo de Identificación**: Cédula de Identidad
- **Número de Identificación**: `1714175071`
- **Nombres**: JUAN CARLOS
- **Apellidos**: PÉREZ GONZÁLEZ
- **Email**: juan.perez@ejemplo.com
- **Teléfono**: 0998765432
- **Fecha de Nacimiento**: 1990-05-15 (>25 años)
- **Provincia**: Pichincha
- **Cantón**: Quito
- **Dirección**: Av. 10 de Agosto N23-45 y Colón

**Pasos:**
1. Completar todos los campos con los datos de prueba
2. Verificar que el campo de cédula tenga borde verde ✅
3. Seleccionar un arma
4. Completar el proceso de venta
5. Verificar que el cliente se crea en la base de datos

**Resultado esperado:**
- ✅ Cliente se crea exitosamente
- ✅ Cédula se guarda correctamente en BD
- ✅ `tipo_identificacion_id` apunta al registro correcto (CED)

---

### 8️⃣ Prueba: Integración Completa (Empresa con RUC)

**Escenario Completo: Crear Empresa con RUC**

**Datos de prueba:**
- **Tipo de Cliente**: Compañía de Seguridad
- **Tipo de Identificación Personal**: Cédula de Identidad
- **Cédula del Representante**: `1714175071`
- **Nombres**: MARÍA JOSÉ
- **Apellidos**: RODRÍGUEZ LÓPEZ
- **RUC de la Empresa**: `1790016919001`
- **Nombre de la Empresa**: SEGURIDAD TOTAL S.A.
- **Email empresa**: info@seguridadtotal.com
- **Teléfono referencia**: 022345678
- **Provincia Empresa**: Pichincha
- **Cantón Empresa**: Quito
- **Dirección Fiscal**: Av. Amazonas N12-34 y Veintimilla

**Pasos:**
1. Seleccionar tipo: "Compañía de Seguridad"
2. Completar datos del representante legal
3. Completar datos de la empresa (incluyendo RUC)
4. Verificar:
   - ✅ Cédula del representante: borde verde
   - ✅ RUC de la empresa: borde verde
5. Guardar cliente

**Resultado esperado:**
- ✅ Empresa se crea exitosamente
- ✅ Cédula del representante válida
- ✅ RUC de la empresa válido
- ✅ Ambos campos se guardan correctamente en BD

---

## 🐛 Problemas Conocidos a Verificar

### 1. Backend no valida cédula/RUC
**Estado**: ⚠️ Backend solo recibe el código, NO valida con algoritmo

**Riesgo**: 
- Si alguien hace POST directo al API (sin pasar por frontend), puede ingresar cédula/RUC inválido

**Recomendación**: 
- ✅ Validación frontend está OK (algoritmos oficiales implementados)
- ⚠️ Considerar agregar validación en backend también (seguridad adicional)

### 2. Campo `tipoIdentificacion` usa códigos
**Estado**: ✅ Correcto

**Verificar**:
- Frontend envía: `tipoIdentificacionCodigo: "CED"` o `"RUC"`
- Backend mapea correctamente a `tipo_identificacion_id`

---

## 📊 Checklist de Verificación

Antes de marcar como "funcionando correctamente", verificar:

- [ ] **Select de tipos de identificación carga correctamente** (CED, RUC, PAS)
- [ ] **Cédula válida muestra borde verde**
- [ ] **Cédula inválida muestra borde rojo**
- [ ] **RUC válido (persona natural) muestra borde verde**
- [ ] **RUC válido (sociedad privada) muestra borde verde**
- [ ] **RUC inválido muestra borde rojo**
- [ ] **Cambio de tipo actualiza validación dinámicamente**
- [ ] **Se puede crear cliente con cédula válida**
- [ ] **Se puede crear empresa con RUC válido**
- [ ] **NO se puede guardar con identificación inválida** (botón deshabilitado)
- [ ] **Backend recibe `tipoIdentificacionCodigo` correctamente**
- [ ] **BD guarda el `tipo_identificacion_id` correcto**

---

## 🚀 Comandos para Probar

### 1. Levantar el ambiente local

```powershell
# PowerShell
cd C:\Users\Flia Tenemaza Cadena\Documents\gmarmworspace\gmarm

# Levantar servicios
docker-compose -f docker-compose.local.yml up -d --build

# Ver logs
docker-compose -f docker-compose.local.yml logs -f backend_local
docker-compose -f docker-compose.local.yml logs -f frontend_local
```

### 2. Verificar datos en BD

```powershell
# Conectar a PostgreSQL
docker exec -it gmarm-postgres-local psql -U postgres -d gmarm_dev

# Verificar tipos de identificación
SELECT * FROM tipo_identificacion;

# Verificar clientes creados
SELECT id, numero_identificacion, tipo_identificacion_id, nombres, apellidos 
FROM cliente 
ORDER BY id DESC 
LIMIT 5;

# Ver cliente con tipo de identificación
SELECT 
    c.id,
    c.numero_identificacion,
    ti.codigo as tipo_codigo,
    ti.nombre as tipo_nombre,
    c.nombres,
    c.apellidos
FROM cliente c
JOIN tipo_identificacion ti ON c.tipo_identificacion_id = ti.id
ORDER BY c.id DESC
LIMIT 5;
```

### 3. Prueba de validación desde consola del navegador

```javascript
// Abrir consola del navegador (F12) en la página del formulario

// Importar funciones (si están exportadas globalmente, sino copiar desde validations.ts)
// Prueba 1: Cédula válida
console.log('Cédula 1714175071:', validateCedula('1714175071')); // debe ser true

// Prueba 2: Cédula inválida
console.log('Cédula 1234567890:', validateCedula('1234567890')); // debe ser false

// Prueba 3: RUC válido
console.log('RUC 1714175071001:', validateRUC('1714175071001')); // debe ser true

// Prueba 4: RUC inválido
console.log('RUC 1234567890001:', validateRUC('1234567890001')); // debe ser false
```

---

## 📝 Notas para el Testing

### Algoritmo de Cédula (Módulo 10)
- Provincia: primeros 2 dígitos (01-24)
- Tercer dígito: < 6 (persona natural)
- Dígitos en posición par (0,2,4,6,8) se multiplican por 2
- Si resultado > 9, se resta 9
- Se suma todo y el dígito verificador es (10 - (suma % 10)) % 10

### Algoritmo de RUC
- **Persona Natural**: Cédula válida + "001" (13 dígitos)
- **Sociedad Privada**: Tercer dígito = 9, módulo 11, termina en "001"
- **Sociedad Pública**: Tercer dígito = 6, módulo 11, termina en "0001"

---

## ✅ Resultado Final Esperado

Después de todas las pruebas, deberías poder confirmar:

1. ✅ La validación de cédula funciona con algoritmo oficial ecuatoriano
2. ✅ La validación de RUC funciona con algoritmos oficiales (3 tipos)
3. ✅ Los bordes visuales (verde/rojo) ayudan al usuario a identificar errores
4. ✅ No se puede guardar un cliente con identificación inválida
5. ✅ Los códigos (CED, RUC, PAS) se manejan correctamente en todo el flujo
6. ✅ La base de datos guarda correctamente el `tipo_identificacion_id`

---

**Fecha de creación**: 2025-11-09  
**Estado**: ⏳ Pendiente de ejecución


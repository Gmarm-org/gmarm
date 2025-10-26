# 📸 Galería de Imágenes Múltiples para Armas

## ✅ Funcionalidad Implementada

El sistema ahora soporta **múltiples imágenes por arma** con un carrusel interactivo en la selección de armas.

## 🎯 **Lógica de Imágenes (Opción B - Solo tabla `arma_imagen`)**

### **Decisión de Diseño:**
- ✅ **TODAS las imágenes** están en la tabla `arma_imagen`
- ✅ **Campo `es_principal`** marca cuál es la imagen principal
- ✅ **Campo `url_imagen` en tabla `arma`** es **DEPRECATED** (solo fallback)
- ✅ **Migración automática** de `url_imagen` a `arma_imagen` en el SQL maestro

### **Estructura:**
```
tabla arma:
  - url_imagen: VARCHAR(500)  ← DEPRECATED (mantener por compatibilidad)

tabla arma_imagen:
  - orden: 1, es_principal: TRUE  → Esta es la PRINCIPAL
  - orden: 2, es_principal: FALSE → Secundaria
  - orden: 3, es_principal: FALSE → Secundaria
  - orden: 4, es_principal: FALSE → Secundaria
```

---

## 🎯 Características

### **Backend:**
- ✅ Tabla `arma_imagen` para almacenar múltiples imágenes
- ✅ Campo `orden` para controlar el orden de las imágenes
- ✅ Campo `es_principal` para marcar la imagen destacada
- ✅ Campo `descripcion` para agregar contexto a cada imagen
- ✅ Relación `OneToMany` entre `Arma` y `ArmaImagen`
- ✅ Retrocompatible con `url_imagen` legacy

### **Frontend:**
- ✅ Componente `ImageCarousel` con navegación
- ✅ Botones anterior/siguiente con efecto hover
- ✅ Indicadores de puntos para navegar
- ✅ Contador de imágenes (ej: "2 / 4")
- ✅ Soporte para descripciones
- ✅ Placeholder cuando no hay imágenes
- ✅ Manejo de errores de carga

---

## 📋 Estructura de Base de Datos

### Tabla `arma_imagen`:

```sql
CREATE TABLE arma_imagen (
    id BIGSERIAL PRIMARY KEY,
    arma_id BIGINT NOT NULL REFERENCES arma(id) ON DELETE CASCADE,
    url_imagen VARCHAR(500) NOT NULL,
    orden INTEGER DEFAULT 1,
    es_principal BOOLEAN DEFAULT false,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Índices:
- `idx_arma_imagen_arma_id`: Para consultas por arma
- `idx_arma_imagen_orden`: Para ordenar imágenes

---

## 🔧 Cómo Agregar Imágenes a un Arma

### Opción 1: Desde SQL (Recomendado para carga inicial)

```sql
-- Agregar múltiples imágenes para Glock 19
INSERT INTO arma_imagen (arma_id, url_imagen, orden, es_principal, descripcion)
VALUES 
    (1, 'https://ejemplo.com/glock19-vista1.jpg', 1, true, 'Vista lateral izquierda'),
    (1, 'https://ejemplo.com/glock19-vista2.jpg', 2, false, 'Vista lateral derecha'),
    (1, 'https://ejemplo.com/glock19-vista3.jpg', 3, false, 'Vista superior'),
    (1, 'https://ejemplo.com/glock19-vista4.jpg', 4, false, 'Vista con accesorios');
```

### Opción 2: Usando el Script de Ejemplo

```bash
# En local
Get-Content datos/add_imagenes_ejemplo.sql | docker exec -i gmarm-postgres-local psql -U postgres -d gmarm_dev

# En servidor
cat datos/add_imagenes_ejemplo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev
```

---

## 🎨 Funcionalidad del Carrusel

### **Características Visuales:**

1. **Navegación con Botones:**
   - Botones ← y → aparecen al pasar el mouse
   - Fondo semi-transparente con efecto blur
   - Solo aparecen si hay más de 1 imagen

2. **Indicadores de Puntos:**
   - Puntos en la parte inferior
   - Punto activo expandido
   - Click en cualquier punto para ir a esa imagen

3. **Contador de Imágenes:**
   - Esquina superior derecha
   - Formato: "2 / 4"
   - Fondo oscuro semi-transparente

4. **Descripciones:**
   - Aparecen en la parte inferior
   - Gradiente oscuro para legibilidad
   - Solo si la imagen tiene descripción

### **Interacción:**

- **Hover sobre la card:** Muestra botones de navegación
- **Click en botones:** Cambia de imagen
- **Click en puntos:** Salta a imagen específica
- **Error de carga:** Muestra placeholder con icono

---

## 📊 Ejemplo de Uso

### Arma con 4 Imágenes:

```
┌─────────────────────────────────┐
│  [2 / 4]                    ↻   │  ← Contador
│                                 │
│    ←     [IMAGEN 2]      →     │  ← Navegación
│                                 │
│          ● ● ● ●               │  ← Indicadores
│  "Vista lateral derecha"       │  ← Descripción
└─────────────────────────────────┘
```

---

## 🔍 Verificar Imágenes en la Base de Datos

### Ver imágenes de un arma específica:

```sql
SELECT 
    ai.orden,
    ai.es_principal,
    ai.descripcion,
    ai.url_imagen
FROM arma_imagen ai
WHERE ai.arma_id = 1
ORDER BY ai.orden;
```

### Ver todas las armas con sus imágenes:

```sql
SELECT 
    a.id,
    a.nombre,
    COUNT(ai.id) as total_imagenes,
    STRING_AGG(ai.orden::TEXT || '. ' || SUBSTRING(ai.descripcion, 1, 30), ', ' ORDER BY ai.orden) as imagenes
FROM arma a
LEFT JOIN arma_imagen ai ON a.id = ai.arma_id
GROUP BY a.id, a.nombre
ORDER BY a.id;
```

---

## 🚀 Cómo Probar

### 1. Agregar Imágenes de Ejemplo:

```bash
# En local (Windows)
Get-Content datos/add_imagenes_ejemplo.sql | docker exec -i gmarm-postgres-local psql -U postgres -d gmarm_dev

# En servidor (Linux)
cat datos/add_imagenes_ejemplo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev
```

### 2. Abrir el Sistema:

```
http://localhost:5173/login
```

### 3. Ir a Selección de Armas:

1. Login como vendedor
2. Crear nuevo cliente
3. Ir a paso de selección de arma
4. Verás el carrusel con múltiples imágenes

### 4. Probar Navegación:

- Pasar el mouse sobre la imagen → Aparecen botones ← →
- Click en → para siguiente imagen
- Click en ← para imagen anterior
- Click en puntos para ir a imagen específica

---

## 🔧 Actualizar Imágenes Existentes

### Migrar imagen legacy a tabla arma_imagen:

```sql
-- Script para migrar url_imagen existentes a arma_imagen
INSERT INTO arma_imagen (arma_id, url_imagen, orden, es_principal, descripcion)
SELECT 
    id as arma_id,
    url_imagen,
    1 as orden,
    true as es_principal,
    'Imagen principal' as descripcion
FROM arma
WHERE url_imagen IS NOT NULL 
  AND url_imagen != ''
  AND NOT EXISTS (
      SELECT 1 FROM arma_imagen ai WHERE ai.arma_id = arma.id
  );
```

---

## 📝 Mejores Prácticas

### **Orden de Imágenes:**
1. **Imagen 1 (Principal):** Vista frontal o lateral más representativa
2. **Imagen 2:** Vista opuesta o diferente ángulo
3. **Imagen 3:** Vista superior o detalle importante
4. **Imagen 4+:** Accesorios, empaque, detalles adicionales

### **Descripciones Recomendadas:**
- "Vista lateral izquierda"
- "Vista lateral derecha"
- "Vista superior"
- "Detalle del cañón"
- "Vista con accesorios incluidos"
- "Empaque original"

### **URLs de Imágenes:**
- Usar URLs absolutas (https://...)
- O rutas relativas (/images/weapons/...)
- Imágenes optimizadas (máx 500KB por imagen)
- Formatos: JPG, PNG, WEBP

---

## 🎨 Personalización del Carrusel

### Cambiar Tamaño de Imagen:

En `ImageCarousel.tsx`:
```typescript
// Cambiar altura de 48 (h-48) a otro valor
className="w-full h-64 object-cover rounded-t-2xl"  // Más grande
className="w-full h-32 object-cover rounded-t-2xl"  // Más pequeño
```

### Cambiar Velocidad de Transición:

```typescript
className="w-full h-48 object-cover rounded-t-2xl transition-opacity duration-500"
//                                                                             ↑
//                                                                  300ms, 500ms, 1000ms
```

### Agregar Auto-Play:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    nextImage();
  }, 3000); // Cambiar cada 3 segundos
  
  return () => clearInterval(interval);
}, [currentImageIndex]);
```

---

## ⚡ Rendimiento

### Optimizaciones Implementadas:

- ✅ **Lazy Loading:** Imágenes con `FetchType.LAZY`
- ✅ **Índices:** Consultas optimizadas
- ✅ **Fallback:** Solo carga imágenes si existen
- ✅ **Error Handling:** Placeholder si falla carga

### Recomendaciones:

- Máximo 5-6 imágenes por arma
- Imágenes optimizadas (< 500KB)
- Usar CDN para imágenes externas
- Comprimir imágenes antes de subir

---

## 🧪 Testing

### Probar con 1 Imagen:
- Debe mostrar solo la imagen sin navegación
- No debe aparecer contador "1 / 1"
- No debe mostrar botones ni puntos

### Probar con Múltiples Imágenes:
- Debe mostrar botones al hacer hover
- Debe mostrar contador "X / Y"
- Debe mostrar puntos de navegación
- Navegación debe ser circular (última → primera)

### Probar sin Imágenes:
- Debe mostrar placeholder con icono
- Mensaje: "Sin imagen"

---

## 📋 Checklist de Verificación

- [ ] Tabla `arma_imagen` creada en BD
- [ ] Índices creados correctamente
- [ ] Al menos un arma tiene múltiples imágenes
- [ ] Carrusel muestra todas las imágenes
- [ ] Navegación funciona (prev/next)
- [ ] Indicadores de puntos funcionan
- [ ] Contador de imágenes correcto
- [ ] Descripciones se muestran (si existen)
- [ ] Fallback a imagen legacy funciona
- [ ] Placeholder se muestra si no hay imágenes

---

## 🆘 Troubleshooting

### Problema: No se ven las imágenes adicionales

**Verificar en BD:**
```sql
SELECT * FROM arma_imagen WHERE arma_id = 1;
```

Si no hay filas, ejecutar:
```bash
cat datos/add_imagenes_ejemplo.sql | docker exec -i gmarm-postgres-local psql -U postgres -d gmarm_dev
```

### Problema: Botones de navegación no aparecen

**Causa:** Solo hay 1 imagen

**Verificar:**
```sql
SELECT arma_id, COUNT(*) as total FROM arma_imagen GROUP BY arma_id;
```

### Problema: Imagen no carga (icono de error)

**Causa:** URL incorrecta

**Solución:**
- Verificar que la URL sea accesible
- Usar imágenes de prueba locales
- Actualizar URL en BD

---

## 🎉 Próximos Pasos (Opcional)

- [ ] Implementar drag & drop para reordenar imágenes
- [ ] Agregar zoom en imagen
- [ ] Implementar upload de imágenes desde admin
- [ ] Agregar thumbnails en el carrusel
- [ ] Implementar lazy loading de imágenes

---

*Funcionalidad lista para testing - NO pusheada a dev aún*
*Última actualización: Octubre 2024*

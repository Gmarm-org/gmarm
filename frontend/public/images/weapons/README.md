# 🎯 SISTEMA DE IMÁGENES DE ARMAS - ACTUALIZADO

## 🚀 **NUEVO SISTEMA INTELIGENTE**

El sistema ahora funciona con **2 niveles de prioridad**:

### **PRIORIDAD 1: URL de la Base de Datos**
- Si la arma tiene `urlImagen` en la base de datos, se usa esa imagen
- Esto permite actualizar imágenes desde el backend sin tocar archivos
- **Ventaja**: Gestión centralizada desde la base de datos

### **PRIORIDAD 2: Imágenes Locales**
- Si no hay URL en la BD, se busca imagen local en `/images/weapons/`
- **Formatos soportados**: JPG, PNG, WebP, JPEG
- **El formato no importa**, solo el nombre del archivo

## 📁 **ESTRUCTURA DE ARCHIVOS**

Cada arma debe tener su imagen correspondiente:
- `CZ-P09-NOCTURNE.jpg` → Imagen de la CZ P09 Nocturne
- `CZ-P09-COMPACT.png` → Imagen de la CZ P09 Compact  
- `CZ-P09-COMPETITION.webp` → Imagen de la CZ P09 Competition
- Y así sucesivamente...

## 🖼️ **Especificaciones de Imágenes**

- **Formatos soportados**: JPG, PNG, WebP, JPEG
- **Formato recomendado**: JPG (mejor compatibilidad)
- **Dimensiones**: 400x300 píxeles
- **Tamaño**: Máximo 500KB por imagen
- **Calidad**: Buena resolución, sin pixelación

## 🔍 **Cómo Obtener Imágenes**

### **Opción 1: Búsqueda Manual en Google**
1. Busca: `"CZ P09 OR pistol image"`
2. Busca: `"CZ P10 competition pistol"`
3. Busca: `"CZ Shadow 2 tactical"`
4. Descarga la imagen
5. Renómbrala según el código (ej: `CZ-P09-OR.jpg`)
6. Colócala en esta carpeta
7. **Nota**: Puedes usar JPG, PNG, WebP o JPEG - el sistema los maneja todos

### **Opción 2: Sitios de Stock Photos**
- **Unsplash**: https://unsplash.com/s/photos/pistol
- **Pexels**: https://www.pexels.com/search/pistol/
- **Pixabay**: https://pixabay.com/images/search/pistol/

### **Opción 3: Sitios Especializados en Armas**
- **GunBroker**: https://www.gunbroker.com/
- **Guns.com**: https://www.guns.com/
- **CZ USA**: https://cz-usa.com/

## 🚀 **Proceso de Actualización**

### **Para Imágenes Locales:**
1. **Descarga** la imagen de la arma
2. **Renómbrala** exactamente como aparece en la lista
3. **Colócala** en esta carpeta (`frontend/public/images/weapons/`)
4. **Reinicia** el frontend: `docker-compose restart frontend_dev`

### **Para URLs de Base de Datos:**
1. **Actualiza** el campo `urlImagen` en la tabla de armas
2. **Las imágenes se actualizan automáticamente** sin reiniciar
3. **Gestión centralizada** desde el backend

## ⚠️ **Notas Importantes**

- **Nombres exactos**: Los nombres de archivo deben coincidir exactamente con los códigos
- **Formatos flexibles**: Puedes usar JPG, PNG, WebP o JPEG - el sistema los maneja todos
- **Formato recomendado**: JPG para mejor compatibilidad con navegadores antiguos
- **Tamaño uniforme**: Mantén 400x300 píxeles para consistencia
- **Calidad**: Usa imágenes de buena calidad, no pixeladas
- **Sin duplicados**: Cada arma debe tener su imagen única

## 🔧 **Solución de Problemas**

### **Si una imagen no se muestra:**
1. Verifica que el nombre del archivo coincida exactamente
2. Asegúrate de que sea un archivo válido (JPG, PNG, WebP, JPEG)
3. Revisa que esté en la carpeta correcta
4. Reinicia el frontend después de agregar la imagen

### **Prioridad del Sistema:**
1. **Primero**: URL de la base de datos (`weapon.urlImagen`)
2. **Segundo**: Imagen local (`/images/weapons/CODIGO.jpg`)
3. **Tercero**: Imagen por defecto (`default-weapon.svg`)

## 📋 **Lista de Armas que Necesitan Imágenes**

**Formato de archivo**: Puedes usar `.jpg`, `.png`, `.webp`, o `.jpeg`

- [ ] CZ-P09-NOCTURNE (ej: CZ-P09-NOCTURNE.jpg)
- [ ] CZ-P09-COMPACT (ej: CZ-P09-COMPACT.png)
- [ ] CZ-P09-COMPETITION (ej: CZ-P09-COMPETITION.webp)
- [ ] CZ-P09-OR (ej: CZ-P09-OR.jpg)
- [ ] CZ-P09-PORTADO (ej: CZ-P09-PORTADO.png)
- [ ] CZ-P09-SPORT (ej: CZ-P09-SPORT.jpg)
- [ ] CZ-P09-SUBCOMPACT (ej: CZ-P09-SUBCOMPACT.webp)
- [ ] CZ-P09-TACTICAL (ej: CZ-P09-TACTICAL.jpg)
- [ ] CZ-P09-URBAN (ej: CZ-P09-URBAN.png)
- [ ] CZ-P10-C (ej: CZ-P10-C.jpg)
- [ ] CZ-P10-COMPACT (ej: CZ-P10-COMPACT.png)
- [ ] CZ-P10-COMPETITION (ej: CZ-P10-COMPETITION.webp)
- [ ] CZ-P10-F (ej: CZ-P10-F.jpg)
- [ ] CZ-P10-FDE (ej: CZ-P10-FDE.png)
- [ ] CZ-P10-M (ej: CZ-P10-M.jpg)
- [ ] CZ-P10-S (ej: CZ-P10-S.webp)
- [ ] CZ-P10-SPORT (ej: CZ-P10-SPORT.jpg)
- [ ] CZ-P10-TACTICAL (ej: CZ-P10-TACTICAL.png)
- [ ] CZ-P10-TARGET (ej: CZ-P10-TARGET.jpg)
- [ ] CZ-SHADOW-2 (ej: CZ-SHADOW-2.webp)
- [ ] CZ-SHADOW-2-BLACK (ej: CZ-SHADOW-2-BLACK.jpg)
- [ ] CZ-SHADOW-2-BLUE (ej: CZ-SHADOW-2-BLUE.png)
- [ ] CZ-SHADOW-2-COMPACT (ej: CZ-SHADOW-2-COMPACT.jpg)
- [ ] CZ-SHADOW-2-COMPETITION (ej: CZ-SHADOW-2-COMPETITION.webp)
- [ ] CZ-SHADOW-2-GREEN (ej: CZ-SHADOW-2-GREEN.jpg)
- [ ] CZ-SHADOW-2-ORANGE (ej: CZ-SHADOW-2-ORANGE.png)
- [ ] CZ-SHADOW-2-RED (ej: CZ-SHADOW-2-RED.jpg)
- [ ] CZ-SHADOW-2-URBAN (ej: CZ-SHADOW-2-URBAN.webp)
- [ ] CZ-TS2-RACING (ej: CZ-TS2-RACING.jpg)

¡Marca cada una cuando la tengas lista!

## 💡 **Ventajas del Nuevo Sistema**

✅ **Flexibilidad total**: URLs de BD o imágenes locales
✅ **Sin duplicados**: Cada arma tiene su imagen única  
✅ **Formatos múltiples**: JPG, PNG, WebP, JPEG
✅ **Gestión centralizada**: Desde la base de datos
✅ **Fallback inteligente**: Si no hay URL de BD, usa imagen local
✅ **Actualización automática**: Sin reiniciar el frontend

# 🐛 Solución: Imágenes NO Visibles en Vendedor

## ❌ **Problema Detectado**

**Síntoma:**
- ✅ **Admin VE** la imagen de "CZ P-09 C NOCTURNE SNIPER GREY"
- ❌ **Vendedor NO VE** la misma imagen → "Error al cargar imagen"

**Ambos usan la misma función:** `getWeaponImageUrl()` de `imageUtils.ts`

---

## 🔍 **Diagnóstico**

### **Backend sirve imágenes en:**
```
GET /images/weapons/filename.jpg
```

**Controlador:** `ImageController.java`
**Ruta física:** `./uploads/images/weapons/`

### **Posibles causas:**

1. ✅ **Directorio NO existe** en el contenedor
2. ✅ **Permisos incorrectos** (usuario 1000:1000 no puede leer)
3. ✅ **Volumen Docker NO mapeado** correctamente

---

## 🧪 **Verificar en Producción**

```bash
ssh gmarmin@72.167.52.14

cd ~/deploy/prod

# 1. Verificar que el directorio existe
docker exec gmarm-backend-prod ls -la /app/uploads/images/weapons/

# 2. Verificar permisos
docker exec gmarm-backend-prod ls -la /app/uploads/images/

# 3. Verificar que las imágenes están ahí
docker exec gmarm-backend-prod find /app/uploads/images/weapons/ -name "*.jpg" -o -name "*.png"

# 4. Verificar el usuario del contenedor
docker exec gmarm-backend-prod id

# 5. Ver logs del backend al intentar cargar imagen
docker logs gmarm-backend-prod --tail=50 | grep -i "image\|weapon\|upload"
```

---

## ✅ **Solución 1: Crear Directorio y Permisos**

```bash
ssh gmarmin@72.167.52.14

cd ~/deploy/prod

# 1. Crear directorio en el host (si no existe)
mkdir -p ./uploads/images/weapons

# 2. Dar permisos correctos
sudo chown -R 1000:1000 ./uploads/
sudo chmod -R 755 ./uploads/

# 3. Reiniciar backend
docker-compose -f docker-compose.prod.yml restart backend

# 4. Verificar que el directorio está montado
docker exec gmarm-backend-prod ls -la /app/uploads/images/weapons/
```

---

## ✅ **Solución 2: Verificar Volúmenes Docker**

**En `docker-compose.prod.yml`**, el backend DEBE tener:

```yaml
services:
  backend:
    volumes:
      - ./uploads:/app/uploads                    # ✅ OBLIGATORIO
      - ./documentacion:/app/documentacion        # ✅ OBLIGATORIO
```

**Verificar que está configurado:**

```bash
ssh gmarmin@72.167.52.14

cd ~/deploy/prod

# Ver configuración de volúmenes
docker inspect gmarm-backend-prod | grep -A 10 "Mounts"

# Debe mostrar:
# "Source": "/home/gmarmin/deploy/prod/uploads"
# "Destination": "/app/uploads"
```

---

## ✅ **Solución 3: Copiar Imágenes Manualmente (Temporal)**

Si las imágenes se subieron pero están en lugar incorrecto:

```bash
ssh gmarmin@72.167.52.14

cd ~/deploy/prod

# 1. Buscar imágenes en cualquier lugar
find . -name "*.jpg" -o -name "*.png" | grep -i weapon

# 2. Si las encuentras en otro directorio, copiarlas
# Ejemplo: Si están en ./uploads/ directamente
mv ./uploads/*.jpg ./uploads/images/weapons/ 2>/dev/null
mv ./uploads/*.png ./uploads/images/weapons/ 2>/dev/null

# 3. Dar permisos
sudo chown -R 1000:1000 ./uploads/
sudo chmod -R 755 ./uploads/

# 4. Reiniciar backend
docker-compose -f docker-compose.prod.yml restart backend
```

---

## ✅ **Solución 4: Subir Imágenes Nuevamente**

Si todo lo anterior falla, re-subir las imágenes desde Admin:

1. Login como Admin en https://gmarm.com
2. Admin > Gestión de Armas
3. Para cada arma sin imagen:
   - Click en "Editar"
   - Subir imagen nuevamente
   - Guardar

**Esto garantiza que las imágenes se guarden en el lugar correcto con permisos correctos.**

---

## 🔍 **Debug: Ver Qué Está Pasando**

### **Ver logs en tiempo real del backend:**

```bash
ssh gmarmin@72.167.52.14

# Ver logs del backend mientras intentas cargar una imagen
docker logs -f gmarm-backend-prod
```

**Luego en el navegador:**
1. Abrir https://gmarm.com
2. Login como Vendedor
3. Ir a Reservar Arma
4. Intentar ver la imagen

**En los logs deberías ver:**
```
✅ Imagen encontrada: filename.jpg
```

**O el error:**
```
⚠️ Imagen no encontrada, sirviendo placeholder: filename.jpg
```

---

## 📝 **Script Automático de Corrección**

```bash
#!/bin/bash
# fix-weapon-images-permissions.sh

echo "🔧 Corrigiendo permisos de imágenes de armas..."

cd ~/deploy/prod

# 1. Crear directorios si no existen
mkdir -p ./uploads/images/weapons
mkdir -p ./uploads/images

# 2. Dar permisos correctos
sudo chown -R 1000:1000 ./uploads/
sudo chmod -R 755 ./uploads/

# 3. Verificar
echo "📂 Contenido de uploads/images/weapons/:"
ls -la ./uploads/images/weapons/ || echo "   (vacío)"

# 4. Reiniciar backend
echo "🔄 Reiniciando backend..."
docker-compose -f docker-compose.prod.yml restart backend

# 5. Esperar 10 segundos
sleep 10

# 6. Verificar que backend respondió
echo "🏥 Verificando backend..."
curl -s http://localhost:8080/api/health | jq || echo "Backend no responde"

echo ""
echo "✅ Corrección completada"
echo "📝 Próximos pasos:"
echo "   1. Probar cargar una imagen desde Admin"
echo "   2. Verificar que Vendedor la puede ver"
echo "   3. Si persiste, re-subir imágenes desde Admin"
```

**Ejecutar:**
```bash
ssh gmarmin@72.167.52.14 "cd ~/deploy/prod && bash fix-weapon-images-permissions.sh"
```

---

## 🎯 **Checklist de Verificación**

- [ ] Directorio `./uploads/images/weapons/` existe
- [ ] Permisos correctos (1000:1000, chmod 755)
- [ ] Volumen Docker mapeado correctamente
- [ ] Backend puede leer el directorio
- [ ] Admin puede subir imágenes correctamente
- [ ] Vendedor puede ver las imágenes subidas

---

## 🆘 **Si Nada Funciona**

**Último recurso - Re-subir todas las imágenes:**

1. **Hacer backup de las imágenes actuales:**
   ```bash
   ssh gmarmin@72.167.52.14
   cd ~/deploy/prod
   tar -czf uploads-backup-$(date +%Y%m%d).tar.gz ./uploads/
   ```

2. **Limpiar y recrear directorio:**
   ```bash
   sudo rm -rf ./uploads/images/weapons/*
   sudo mkdir -p ./uploads/images/weapons
   sudo chown -R 1000:1000 ./uploads/
   sudo chmod -R 755 ./uploads/
   ```

3. **Reiniciar backend:**
   ```bash
   docker-compose -f docker-compose.prod.yml restart backend
   ```

4. **Re-subir imágenes desde Admin** (una por una)

---

**🎯 Empieza por el script automático de la Solución 4. Es la forma más rápida de resolver el problema.**


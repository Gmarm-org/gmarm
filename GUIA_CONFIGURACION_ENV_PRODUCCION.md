# 🔐 GUÍA: Configurar Variables de Entorno para Producción

## 📋 ¿Qué es el archivo `.env`?

El archivo `.env` contiene **contraseñas y secretos** que NO deben estar en el código por seguridad.

**Ejemplo de por qué es importante:**
```yaml
# ❌ MAL - Password visible en el código (GitHub)
POSTGRES_PASSWORD=postgres123

# ✅ BIEN - Password desde archivo .env (NO en GitHub)
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
```

---

## 🚀 PASOS SIMPLES (En el Servidor)

### PASO 1: Generar Contraseñas Seguras

```bash
# SSH al servidor
ssh usuario@72.167.52.14

# Ir al directorio de producción
cd ~/deploy/prod

# Generar contraseña para PostgreSQL (copia el resultado)
openssl rand -base64 32
# Ejemplo resultado: K8Jx3nR9mP2vL5qW7tY4uZ1aB6cD0eF8gH9iJ2kL3mN4oP5qR6sT7uV8wX9yZ0A=

# Generar secreto para JWT (copia el resultado)
openssl rand -base64 64
# Ejemplo resultado: A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2==
```

**⚠️ IMPORTANTE:** 
- Copia estos valores en un lugar seguro (Notepad temporal)
- Los usarás en el siguiente paso

---

### PASO 2: Crear Archivo `.env`

```bash
# Copiar plantilla
cp env.prod.example .env

# Editar con nano (o vim si prefieres)
nano .env
```

**Verás algo así:**

```bash
# ============================================
# VARIABLES DE ENTORNO - PRODUCCIÓN
# ============================================

# --------------------------------------------
# BASE DE DATOS
# --------------------------------------------
POSTGRES_DB=gmarm_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=              # ✅ PEGAR AQUÍ la contraseña generada

# --------------------------------------------
# BACKEND / API
# --------------------------------------------
JWT_SECRET=                     # ✅ PEGAR AQUÍ el secreto JWT generado
API_URL=https://api.gmarm.com   # Cambiar si es diferente

# --------------------------------------------
# CORS (Backend)
# --------------------------------------------
CORS_ORIGINS=https://gmarm.com,https://www.gmarm.com  # Cambiar a tus dominios
```

---

### PASO 3: Completar el Archivo

**Ejemplo de `.env` completo:**

```bash
# BASE DE DATOS
POSTGRES_DB=gmarm_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=K8Jx3nR9mP2vL5qW7tY4uZ1aB6cD0eF8gH9iJ2kL3mN4oP5qR6sT7uV8wX9yZ0A=

# BACKEND / API
JWT_SECRET=A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2==
API_URL=http://72.167.52.14:8080

# CORS
CORS_ORIGINS=http://72.167.52.14:5173,http://72.167.52.14:80
```

**Pasos en nano:**
1. Muévete con las flechas del teclado
2. Pega las contraseñas después de `POSTGRES_PASSWORD=` y `JWT_SECRET=`
3. Presiona `Ctrl + O` para guardar
4. Presiona `Enter` para confirmar
5. Presiona `Ctrl + X` para salir

---

### PASO 4: Verificar Permisos del Archivo

```bash
# Hacer el archivo legible solo por el propietario (seguridad)
chmod 600 .env

# Verificar que el archivo existe
ls -la .env
# Debe mostrar: -rw------- 1 usuario grupo ... .env
```

**⚠️ IMPORTANTE:** 
- `-rw-------` significa que solo TÚ puedes leerlo (nadie más)
- Esto protege las contraseñas

---

### PASO 5: Verificar que NO está en Git

```bash
# Verificar que .env está en .gitignore
git check-ignore .env

# Debe mostrar: .env
# Si no muestra nada, agregar a .gitignore:
echo ".env" >> .gitignore
```

**Por qué es importante:**
- `.env` contiene contraseñas reales
- **NUNCA** debe subirse a GitHub
- `.gitignore` evita que se suba accidentalmente

---

### PASO 6: Probar que las Variables se Cargan

```bash
# Cargar variables en la terminal (temporal, solo para probar)
export $(cat .env | grep -v '^#' | xargs)

# Verificar que se cargaron
echo "PostgreSQL Password: ${POSTGRES_PASSWORD:0:10}..."  # Muestra solo primeros 10 caracteres
echo "JWT Secret: ${JWT_SECRET:0:10}..."
```

**Deberías ver:**
```
PostgreSQL Password: K8Jx3nR9mP...
JWT Secret: A1B2C3D4E5...
```

Si ves valores, ¡está funcionando! ✅

---

## 🎯 RESUMEN VISUAL

### Antes (Sin .env):
```
docker-compose.prod.yml
  ↓
POSTGRES_PASSWORD=postgres123  ← ❌ Inseguro, visible en GitHub
```

### Después (Con .env):
```
.env (NO en GitHub)
  POSTGRES_PASSWORD=K8Jx3nR9mP...  ← ✅ Seguro
  ↓
docker-compose.prod.yml
  POSTGRES_PASSWORD=${POSTGRES_PASSWORD}  ← Lee de .env
  ↓
PostgreSQL usa: K8Jx3nR9mP...
```

---

## 🔐 VARIABLES OBLIGATORIAS

| Variable | Qué es | Cómo generarla | Ejemplo |
|----------|--------|----------------|---------|
| `POSTGRES_PASSWORD` | Contraseña de la BD | `openssl rand -base64 32` | `K8Jx3nR9mP...` |
| `JWT_SECRET` | Secreto para tokens | `openssl rand -base64 64` | `A1B2C3D4E5...` |
| `API_URL` | URL del backend | Dirección del servidor | `http://72.167.52.14:8080` |
| `CORS_ORIGINS` | Dominios permitidos | URLs separadas por coma | `http://72.167.52.14:5173,http://72.167.52.14:80` |

---

## ✅ CHECKLIST

Marca cuando completes cada paso:

- [ ] Conectado al servidor por SSH
- [ ] Generada contraseña PostgreSQL (`openssl rand -base64 32`)
- [ ] Generado secreto JWT (`openssl rand -base64 64`)
- [ ] Contraseñas copiadas en lugar seguro
- [ ] Archivo `.env` creado (`cp env.prod.example .env`)
- [ ] Contraseñas pegadas en `.env`
- [ ] API_URL configurada con IP/dominio real
- [ ] CORS_ORIGINS configurado con dominios reales
- [ ] Archivo guardado (`Ctrl + O`, `Enter`, `Ctrl + X`)
- [ ] Permisos configurados (`chmod 600 .env`)
- [ ] Verificado que NO está en git (`git check-ignore .env`)
- [ ] Variables probadas (`export $(cat .env | xargs)`)

---

## 🚨 ERRORES COMUNES

### Error 1: "POSTGRES_PASSWORD no definido"

**Causa:** El archivo `.env` no existe o está mal escrito

**Solución:**
```bash
# Verificar que existe
ls -la .env

# Verificar contenido
cat .env | grep POSTGRES_PASSWORD
```

### Error 2: "Permission denied"

**Causa:** Permisos incorrectos

**Solución:**
```bash
chmod 600 .env
```

### Error 3: "Contraseña vacía"

**Causa:** No pegaste la contraseña en `.env`

**Solución:**
```bash
nano .env
# Pega las contraseñas después del = (sin espacios)
```

---

## 📝 EJEMPLO COMPLETO

### Sesión Completa en el Servidor:

```bash
# 1. Conectar
ssh usuario@72.167.52.14

# 2. Ir a directorio
cd ~/deploy/prod

# 3. Generar contraseñas
openssl rand -base64 32  # Copiar resultado
openssl rand -base64 64  # Copiar resultado

# 4. Crear .env
cp env.prod.example .env
nano .env

# 5. Pegar contraseñas en el archivo
# POSTGRES_PASSWORD=<PEGAR_AQUÍ>
# JWT_SECRET=<PEGAR_AQUÍ>
# Guardar: Ctrl+O, Enter, Ctrl+X

# 6. Permisos
chmod 600 .env

# 7. Verificar
git check-ignore .env  # Debe mostrar: .env
cat .env | grep -v '^#'  # Ver contenido (cuidado con pantalla compartida!)

# 8. ¡Listo! Ahora puedes hacer el despliegue
bash scripts/deploy-prod.sh
```

---

## 💡 ¿POR QUÉ ES IMPORTANTE?

### Sin .env (Inseguro):
```yaml
# docker-compose.prod.yml en GitHub:
POSTGRES_PASSWORD=postgres123  ← ❌ Cualquiera puede ver esto
```

**Riesgo:** Hackean tu base de datos

### Con .env (Seguro):
```yaml
# docker-compose.prod.yml en GitHub:
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}  ← ✅ No se ve la contraseña real

# .env en el servidor (NO en GitHub):
POSTGRES_PASSWORD=K8Jx3nR9mP...  ← ✅ Solo tú puedes verla
```

**Beneficio:** Solo quien tiene acceso al servidor ve las contraseñas

---

## 🎓 CONCEPTOS CLAVE

1. **`.env`** = Archivo con secretos (NO se sube a GitHub)
2. **`env.prod.example`** = Plantilla SIN secretos (SÍ se sube a GitHub)
3. **`${VARIABLE}`** = Lee el valor desde `.env`
4. **`chmod 600`** = Solo el dueño puede leer
5. **`.gitignore`** = Lista de archivos que NO se suben a GitHub

---

**¿Tienes dudas? Pregúntame y te explico cualquier paso con más detalle.** 😊


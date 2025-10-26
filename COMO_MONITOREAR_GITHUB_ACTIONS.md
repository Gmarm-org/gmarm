# 📊 Cómo Monitorear GitHub Actions y Detectar Errores

## 🎯 ¿Cómo saber cuándo el pipeline está sin problemas?

---

## 📍 MÉTODO 1: Ver en GitHub (Web)

### Paso 1: Ir a la pestaña Actions

```
https://github.com/Gmarm-org/gmarm/actions
```

### Paso 2: Identificar el estado visual

#### ✅ **TODO BIEN** - Pipeline Exitoso
```
🟢 ✓ feat: implementar sistema completo de monitoreo
   └─ All checks have passed
   
   🔨 Build & Test     ✓ 8m 32s
   🚀 Deploy          ✓ 5m 15s  
   📢 Notifications   ✓ 12s
```

#### ❌ **HAY ERRORES** - Pipeline Fallido
```
🔴 ✗ security: eliminar credenciales de prueba
   └─ Some checks were not successful
   
   🔨 Build & Test     ✗ 3m 45s  ← ERROR AQUÍ
   🚀 Deploy          ⊘ Skipped
   📢 Notifications   ✓ 8s
```

#### 🟡 **EN PROGRESO** - Pipeline Ejecutándose
```
🟡 ● docs: agregar guía completa de setup
   └─ In progress
   
   🔨 Build & Test     ● Running... 2m 15s
   🚀 Deploy          ⊘ Waiting
   📢 Notifications   ⊘ Waiting
```

---

## 📍 MÉTODO 2: Ver Badges en el README

En tu README.md verás badges de estado:

### ✅ Estado Exitoso:
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-passing-brightgreen)](https://github.com/Gmarm-org/gmarm/actions/workflows/deploy.yml)

### ❌ Estado con Errores:
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-failing-red)](https://github.com/Gmarm-org/gmarm/actions/workflows/deploy.yml)

### 🟡 Estado En Progreso:
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-running-yellow)](https://github.com/Gmarm-org/gmarm/actions/workflows/deploy.yml)

---

## 📍 MÉTODO 3: GitHub CLI (Línea de Comandos)

### Instalar GitHub CLI (si no lo tienes):

```bash
# Windows (con winget)
winget install GitHub.cli

# macOS
brew install gh

# Linux
sudo apt install gh
```

### Comandos útiles:

```bash
# 1. Login a GitHub CLI (solo primera vez)
gh auth login

# 2. Ver últimos runs
gh run list --limit 10

# Salida esperada:
# ✓  feat: implementar sistema completo     completed  dev   2m ago
# ✓  docs: agregar badges y documentación   completed  dev   5m ago
# ✗  security: eliminar credenciales        failure    dev   8m ago

# 3. Ver detalles del último run
gh run view

# 4. Ver logs del último run
gh run view --log

# 5. Ver estado de un workflow específico
gh run list --workflow=deploy.yml

# 6. Ver estado en tiempo real
gh run watch
```

---

## 📍 MÉTODO 4: Monitoreo Automático con Issues

GitHub Actions crea **issues automáticos** cuando hay problemas críticos:

### Ver issues de monitoreo:

```
https://github.com/Gmarm-org/gmarm/issues?q=is%3Aissue+label%3Amonitoring
```

### ⚠️ Si ves un issue como este:

```
🚨 Critical: Service Health Issues Detected - 2024-10-16T...

Time: 2024-10-16T14:30:00Z
Environment: Development and/or Production

Issues:
- One or more services are unhealthy
- Backend or Frontend is not responding

Actions Required:
1. Check server logs
2. Verify Docker containers are running
...
```

**Significa:** Hay problemas en el servidor que necesitan atención inmediata.

---

## 📊 INTERPRETANDO LOS LOGS

### Ver logs de un workflow que falló:

1. Ve a: https://github.com/Gmarm-org/gmarm/actions
2. Click en el workflow con ❌ rojo
3. Click en el job que falló (ej: "🔨 Build & Test")
4. Expande el step que tiene error

### Errores Comunes y Qué Significan:

#### Error 1: Build Frontend Falla
```
✗ Build Frontend
  npm run build
  Error: TypeScript compilation failed
  src/pages/Login/Login.tsx:157:10 - error TS2322
```

**Significa:** Hay errores de TypeScript en el código.

**Solución:** Corregir errores localmente y hacer push de nuevo.

---

#### Error 2: Backend No Compila
```
✗ Build Backend
  ./mvnw clean compile -DskipTests
  [ERROR] Compilation failure
  [ERROR] /app/src/main/java/...
```

**Significa:** Hay errores de compilación en Java.

**Solución:** Corregir errores de compilación y hacer push.

---

#### Error 3: Deployment Falla
```
✗ Deploy to Server
  ssh: connect to host 72.167.52.14 port 22: Connection refused
```

**Significa:** No se puede conectar al servidor.

**Solución:** 
- Verificar que el servidor está encendido
- Verificar secrets de GitHub (SSH_PRIVATE_KEY, SERVER_HOST)

---

#### Error 4: Health Check Falla
```
✗ Verify Deployment
  Backend no responde después de 10 intentos
```

**Significa:** El servidor deployó pero los servicios no iniciaron correctamente.

**Solución:**
- SSH al servidor
- Verificar logs: `docker-compose logs -f`
- Reiniciar servicios si es necesario

---

## 🚨 CHECKLIST: ¿Está todo bien?

Use este checklist para verificar que todo está funcionando:

### ✅ GitHub Actions - Web
- [ ] Badge en README muestra "passing" (verde)
- [ ] Último workflow run tiene ✓ verde
- [ ] Todos los jobs (Build, Deploy, Notify) tienen ✓
- [ ] No hay issues abiertos con label "monitoring" o "critical"

### ✅ Servidor de Desarrollo
- [ ] Frontend accesible: http://72.167.52.14:5173
- [ ] Backend responde: http://72.167.52.14:8080/api/health
- [ ] Login funciona correctamente
- [ ] Sin credenciales de prueba visibles en la interfaz
- [ ] Usuarios tienen roles asignados correctamente

### ✅ Base de Datos
```bash
# Ejecutar en el servidor:
docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM usuario;"
# Esperado: 5 usuarios

docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM usuario_rol;"
# Esperado: 5 roles asignados (mínimo)

docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM arma;"
# Esperado: > 0 armas en inventario
```

### ✅ Docker Containers
```bash
# En el servidor:
docker ps | grep gmarm

# Debes ver 3 contenedores:
# ✓ gmarm-backend-dev
# ✓ gmarm-frontend-dev
# ✓ gmarm-postgres-dev
```

---

## 📧 NOTIFICACIONES (Opcional - Configurar)

### Recibir emails cuando hay errores:

1. Ve a: https://github.com/Gmarm-org/gmarm/settings
2. Click en "Notifications"
3. Habilita "Email" para "Actions"

### Configurar Slack/Discord (Avanzado):

Editar `.github/workflows/deploy.yml`:

```yaml
  notify:
    name: 📢 Notifications
    needs: [build-and-test, deploy]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      # ... existing steps ...
      
      - name: Send Slack Notification
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "❌ Pipeline FAILED: ${{ github.event.head_commit.message }}"
            }
```

---

## 🔄 WORKFLOW DE DESARROLLO IDEAL

```
1. Hacer cambios localmente
   ↓
2. Commit y push a branch dev
   ↓
3. GitHub Actions ejecuta automáticamente
   ↓
4. [ESPERAR 8-12 minutos]
   ↓
5. Verificar badge en README
   ├─ 🟢 Verde? → ✅ TODO BIEN, deployment exitoso
   ├─ 🔴 Rojo? → ❌ HAY ERRORES, revisar logs
   └─ 🟡 Amarillo? → ⏳ ESPERANDO, aún en progreso
   ↓
6. Si todo está verde:
   - Verificar servidor: http://72.167.52.14:5173
   - Probar funcionalidades
   - ✅ LISTO!
```

---

## 💡 TIPS PRO

### 1. Workflow Manual (Re-ejecutar)

Si un workflow falló por error temporal:

1. Ve al workflow fallido
2. Click en botón "Re-run jobs"
3. Selecciona "Re-run failed jobs"

### 2. Ver Solo Workflows Fallidos

```
https://github.com/Gmarm-org/gmarm/actions?query=is%3Afailure
```

### 3. Ver Workflows En Progreso

```
https://github.com/Gmarm-org/gmarm/actions?query=is%3Ain_progress
```

### 4. Cancelar Workflow En Progreso

Si te equivocaste en el commit:

1. Ve al workflow en progreso
2. Click en "Cancel workflow"
3. Haz los cambios correctos
4. Push de nuevo

---

## 🆘 ¿QUÉ HACER SI HAY ERRORES?

### 1. Identificar el Tipo de Error

```
Build Error     → Corregir código localmente
Deploy Error    → Verificar servidor y secrets
Health Check    → Verificar logs del servidor
```

### 2. Ver Logs Detallados

- **GitHub Actions**: Click en el step con error
- **Servidor Backend**: `docker logs gmarm-backend-dev --tail 100`
- **Servidor Frontend**: `docker logs gmarm-frontend-dev --tail 100`
- **Base de Datos**: `docker logs gmarm-postgres-dev --tail 50`

### 3. Documentos de Ayuda

- **Errores de deployment**: Ver `TROUBLESHOOTING_DEV_SERVER.md`
- **Admin sin roles**: Ver `FIX_ADMIN_NO_ROLES.md`
- **Monitoreo general**: Ver `MONITORING.md`
- **Setup de GitHub Actions**: Ver `GITHUB_ACTIONS_SETUP.md`

---

## ✅ RESUMEN RÁPIDO

**¿Cómo saber si todo está bien?**

1. Ve a: https://github.com/Gmarm-org/gmarm/actions
2. Verifica que el último run tenga ✓ verde
3. Verifica badge en README (debe ser verde)
4. Prueba el servidor: http://72.167.52.14:5173
5. Si todo lo anterior está ✓, **¡estás listo!**

**Si hay algún ❌ rojo:**
- Click en el workflow fallido
- Lee el error en los logs
- Consulta la documentación de troubleshooting
- Corrige y haz push de nuevo

---

*Última actualización: Octubre 2024*

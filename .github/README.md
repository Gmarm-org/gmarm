# 🚀 GitHub Actions - CI/CD Configuration

## 📋 Overview

Este directorio contiene los workflows de GitHub Actions configurados para GMARM, incluyendo CI/CD pipeline y monitoreo automático.

## 🎯 Workflows Disponibles

### 1. **🚀 CI/CD Pipeline** (`workflows/deploy.yml`)

**Trigger:**
- Push a `dev` o `main`
- Pull Requests a `dev` o `main`
- Ejecución manual vía `workflow_dispatch`

**Jobs:**

#### 🔨 Build & Test
- ☕ Compilación de backend (Java 21 + Maven)
- 📦 Compilación de frontend (Node 18 + Vite)
- 🧪 Tests automáticos
- 🔍 Lint y verificación de tipos TypeScript
- 📊 Resumen detallado del build

#### 🚀 Deploy
- 🌍 Detección automática de entorno (dev/prod)
- 🔐 Conexión SSH segura al servidor
- 🐳 Deployment con Docker Compose
- 🔍 Verificación post-deployment
- ⏱️ Health checks con reintentos

#### 📢 Notifications
- 📊 Resumen del estado del pipeline
- ✅ Notificaciones de éxito
- ❌ Alertas de errores
- ⚠️ Warnings de problemas no críticos

**Características:**
- ✅ Build condicional: Solo deploya si los tests pasan
- ✅ Entornos separados: `development` y `production`
- ✅ Outputs compartidos entre jobs
- ✅ GitHub Step Summary para visualización mejorada
- ✅ Manejo robusto de errores

---

### 2. **🔍 Monitoring & Alerts** (`workflows/monitor.yml`)

**Trigger:**
- Cada 30 minutos (schedule: `*/30 * * * *`)
- Ejecución manual vía `workflow_dispatch`

**Jobs:**

#### 🏥 Health Check
- Verifica backend/frontend en `development` y `production`
- Timeout de 30 segundos por servicio
- Matriz de entornos para verificación paralela
- Resumen detallado por ambiente

#### ⚡ Performance Check
- Monitoreo de tiempos de respuesta
- Threshold de warning: > 3s (prod), > 5s (dev)
- Alertas automáticas por lentitud
- Comparación entre ambientes

#### 🚨 Alert on Issues
- Creación automática de GitHub Issues para problemas críticos
- Labels: `critical`, `monitoring`, `health-check`
- Comandos de troubleshooting en el issue
- Solo se ejecuta si hay fallos

**Métricas Monitoreadas:**
- Backend response time (development & production)
- Frontend availability (development & production)
- Service health status
- Performance degradation

---

## 🔐 Secrets Requeridos

Configura estos secrets en: **Repository Settings → Secrets and variables → Actions**

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `SSH_PRIVATE_KEY` | Clave privada SSH para deployment | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_USER` | Usuario del servidor Ubuntu | `ubuntu` |
| `SERVER_HOST` | IP o hostname del servidor | `72.167.52.14` |

### Generar SSH Key

```bash
# Generar nueva clave SSH
ssh-keygen -t rsa -b 4096 -C "gmarm-github-actions" -f ~/.ssh/gmarm_deploy

# Copiar clave pública al servidor
ssh-copy-id -i ~/.ssh/gmarm_deploy.pub user@server

# Agregar clave privada a GitHub Secrets
cat ~/.ssh/gmarm_deploy
# Copiar todo el contenido y agregarlo como SSH_PRIVATE_KEY
```

---

## 🌍 Entornos

### Production (`main` branch)
- **URL Backend**: `https://gmarm.com`
- **URL Frontend**: `https://gmarm.com`
- **Deploy Dir**: `/home/{SERVER_USER}/deploy/prod`
- **Compose File**: `docker-compose.prod.yml`
- **Auto-deploy**: ✅ Sí (en cada push)

---

## 🚦 Estado del Pipeline

### Ver Estado en Tiempo Real

1. Ve a la pestaña **Actions** en GitHub
2. Selecciona el workflow que quieres ver
3. Click en el run más reciente
4. Expande los jobs para ver logs detallados

### Badges de Estado

Agrega estos badges a tu README principal:

```markdown
[![CI/CD Pipeline](https://github.com/Gmarm-org/gmarm/actions/workflows/deploy.yml/badge.svg)](https://github.com/Gmarm-org/gmarm/actions/workflows/deploy.yml)

[![Monitoring](https://github.com/Gmarm-org/gmarm/actions/workflows/monitor.yml/badge.svg)](https://github.com/Gmarm-org/gmarm/actions/workflows/monitor.yml)
```

---

## 🔄 Flujo de Deployment

### Push a Development

```mermaid
graph TB
    A[Push to dev] --> B[Trigger CI/CD]
    B --> C[Build & Test]
    C --> D{Tests Pass?}
    D -->|Yes| E[Deploy to Dev Server]
    D -->|No| F[❌ Stop - Fix Errors]
    E --> G[SSH to Server]
    G --> H[Git Pull Latest]
    H --> I[Run deploy-server.sh]
    I --> J[Docker Compose Up]
    J --> K[Health Check]
    K --> L{Healthy?}
    L -->|Yes| M[✅ Success - Notify]
    L -->|No| N[⚠️ Warning - Manual Check]
```

### Monitoring Flow

```mermaid
graph TB
    A[Every 30 min] --> B[Run Health Check]
    B --> C[Check Dev Backend]
    B --> D[Check Dev Frontend]
    B --> E[Check Prod Backend]
    B --> F[Check Prod Frontend]
    C --> G{All Healthy?}
    D --> G
    E --> G
    F --> G
    G -->|Yes| H[✅ All Good]
    G -->|No| I[🚨 Create GitHub Issue]
    I --> J[Notify Team]
```

---

## 📊 Métricas y Logs

### Build Metrics

| Métrica | Valor Esperado | Crítico |
|---------|----------------|---------|
| Total Build Time | 8-12 min | > 15 min |
| Backend Compile | 3-4 min | > 7 min |
| Frontend Build | 2-3 min | > 5 min |
| Tests Execution | 1-2 min | > 3 min |

### Performance Thresholds

| Servicio | Good | Warning | Critical |
|----------|------|---------|----------|
| Backend Dev | < 2s | 2-5s | > 5s |
| Backend Prod | < 1s | 1-3s | > 3s |
| Frontend Dev | < 1s | 1-3s | > 3s |
| Frontend Prod | < 0.5s | 0.5-2s | > 2s |

### Ver Logs

```bash
# Logs del último workflow run
gh run view --log

# Logs de un job específico
gh run view <run-id> --job <job-id> --log

# Listar últimos runs
gh run list --workflow=deploy.yml
```

---

## 🛠️ Troubleshooting

### Build Falló

**Problema:** Errores de compilación en frontend o backend

**Solución:**
1. Revisa los logs en GitHub Actions
2. Ejecuta localmente:
   ```bash
   # Backend
   cd backend
   ./mvnw clean compile
   
   # Frontend
   cd frontend
   npm run build
   ```
3. Corrige los errores
4. Commit y push de nuevo

---

### Deployment Falló

**Problema:** El deployment no se completó correctamente

**Solución:**
1. Verifica que los secrets estén configurados
2. Verifica conectividad SSH:
   ```bash
   ssh {SERVER_USER}@{SERVER_HOST}
   ```
3. Revisa logs del servidor:
   ```bash
   cd /home/{SERVER_USER}/deploy/dev
   docker-compose -f docker-compose.prod.yml logs
   ```
4. Re-ejecuta el workflow manualmente

---

### Health Check Falló

**Problema:** El monitoreo detectó servicios no saludables

**Solución:**
1. Verifica el issue creado automáticamente
2. SSH al servidor y verifica servicios:
   ```bash
   docker ps
   docker-compose -f docker-compose.prod.yml ps
   ```
3. Reinicia servicios si es necesario:
   ```bash
   docker-compose -f docker-compose.prod.yml restart
   ```

---

## 🔧 Personalización

### Cambiar Frecuencia de Monitoreo

Edita `.github/workflows/monitor.yml`:

```yaml
on:
  schedule:
    # Cambiar a cada hora
    - cron: '0 * * * *'
    
    # Cambiar a cada 15 minutos
    - cron: '*/15 * * * *'
```

### Agregar Nuevos Entornos

1. Agrega nuevo branch trigger en `deploy.yml`:
   ```yaml
   on:
     push:
       branches:
         - dev
         - main
         - staging  # Nuevo ambiente
   ```

2. Configura logic de deployment:
   ```yaml
   - name: Determine Environment
     run: |
       if [ "${{ github.ref }}" = "refs/heads/staging" ]; then
         echo "deploy-dir=/home/${{ secrets.SERVER_USER }}/deploy/staging"
         echo "compose-file=docker-compose.staging.yml"
       fi
   ```

### Agregar Notificaciones (Slack, Discord, Email)

Agrega step al job `notify`:

```yaml
- name: Send Slack Notification
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Deployment Status: ${{ needs.deploy.result }}"
      }
```

---

## 📚 Recursos Adicionales

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Deployment Server Script](../deploy-server.sh)

---

## 📞 Soporte

Para problemas con los workflows:

1. ✅ Revisa los logs en GitHub Actions
2. ✅ Ejecuta scripts de monitoreo local
3. ✅ Revisa los issues creados automáticamente
4. ✅ Crea un nuevo issue si el problema persiste

---

*Ultima actualizacion: Marzo 2026*

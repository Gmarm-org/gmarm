# 🎯 ESTRATEGIA DE RECURSOS - SERVIDOR (3.8GB RAM)

## 📊 RECURSOS DEL SERVIDOR

**RAM Total**: 3.8GB  
**SWAP**: 2GB (configurado)  
**CPU**: 8 cores

---

## 🎯 DISTRIBUCIÓN DE RECURSOS

### **Escenario 1: SOLO PROD (24/7)** ⭐ **RECOMENDADO**

```
PROD:
├─ PostgreSQL: 1.5GB
├─ Backend:    768MB
├─ Frontend:   512MB
└─ TOTAL:      2.8GB

Sistema:       500MB
Docker:        300MB
Margen:        200MB
─────────────────────
TOTAL:         3.8GB ✅ SEGURO
```

**Cuándo usar**: Producción normal, DEV apagado

---

### **Escenario 2: SOLO DEV (Testing)** 🔧

```
DEV:
├─ PostgreSQL: 1.0GB
├─ Backend:    256MB
├─ Frontend:   256MB
└─ TOTAL:      1.5GB

Sistema:       500MB
Docker:        300MB
Margen:        1.5GB
─────────────────────
TOTAL:         3.8GB ✅ AMPLIO MARGEN
```

**Cuándo usar**: Testing/desarrollo, PROD apagado

---

### **Escenario 3: DEV + PROD Simultáneos** ⚠️ **NO RECOMENDADO**

```
DEV:
├─ PostgreSQL: 1.0GB
├─ Backend:    256MB
├─ Frontend:   256MB
└─ Subtotal:   1.5GB

PROD:
├─ PostgreSQL: 1.2GB  ⬅️ REDUCIDO (riesgoso)
├─ Backend:    512MB  ⬅️ REDUCIDO
├─ Frontend:   384MB  ⬅️ REDUCIDO
└─ Subtotal:   2.1GB

Sistema:       500MB
Margen:        -300MB ❌ INSUFICIENTE
─────────────────────
TOTAL:         4.1GB ❌ EXCEDE CAPACIDAD
```

**Problema**: Sin margen, riesgo de OOM Killer  
**Solución**: NO correr ambos simultáneamente

---

## ✅ **ESTRATEGIA RECOMENDADA**

### **Workflow de Desarrollo**:

```
1. TESTING EN DEV:
   ├─ Apagar PROD: docker-compose -f docker-compose.prod.yml down
   ├─ Levantar DEV: docker-compose -f docker-compose.dev.yml up -d
   ├─ Probar cambios
   ├─ Validar funcionalidad
   └─ Apagar DEV

2. DEPLOY A PROD:
   ├─ Asegurar DEV está apagado
   ├─ Git pull en PROD
   ├─ Levantar PROD: docker-compose -f docker-compose.prod.yml up -d --build
   └─ Monitorear primeras 2 horas

3. PRODUCCIÓN NORMAL:
   ├─ SOLO PROD corriendo 24/7
   ├─ DEV apagado
   └─ Recursos completos para PROD
```

---

## 📋 **COMANDOS ÚTILES**

### **Apagar DEV (antes de levantar PROD)**:
```bash
cd ~/deploy/dev
docker-compose -f docker-compose.dev.yml down
```

### **Apagar PROD (antes de testing DEV)**:
```bash
cd ~/deploy/prod
docker-compose -f docker-compose.prod.yml down
```

### **Verificar uso de recursos**:
```bash
docker stats --no-stream
free -h
```

### **Levantar DEV para testing**:
```bash
cd ~/deploy/dev
git pull origin dev
bash scripts/crear-bd-dev-urgente.sh
docker-compose -f docker-compose.dev.yml up -d --build
```

### **Levantar PROD**:
```bash
cd ~/deploy/prod
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 📊 **COMPARACIÓN DE LÍMITES**

| Servicio | DEV (Testing) | PROD (24/7) | Diferencia |
|----------|---------------|-------------|------------|
| **PostgreSQL** | 1.0GB | 1.5GB | +50% |
| **Backend** | 256MB | 768MB | +200% |
| **Frontend** | 256MB | 512MB | +100% |
| **TOTAL** | **1.5GB** | **2.8GB** | +87% |

---

## ⚠️ **IMPORTANTE**

### **DEV**:
- ✅ Suficiente para testing y desarrollo
- ✅ Pool de conexiones: 3 (ajustado)
- ✅ Tomcat threads: 10 (ajustado)
- ⚠️ NO para carga pesada o múltiples usuarios
- ⚠️ APAGAR cuando no se use

### **PROD**:
- ✅ Recursos completos (2.8GB)
- ✅ Pool de conexiones: 5 (óptimo)
- ✅ Tomcat threads: 20 (suficiente)
- ✅ Margen de seguridad: 500MB
- ✅ Corriendo 24/7

---

## 🔍 **MONITOREO**

### **Verificar que solo uno está corriendo**:
```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

**Output esperado (PROD 24/7)**:
```
gmarm-postgres-prod    Up X hours (healthy)
gmarm-backend-prod     Up X hours (healthy)
gmarm-frontend-prod    Up X hours
```

**Si ves ambos (dev + prod)**: ❌ Apagar DEV inmediatamente

---

## 📝 **RESUMEN**

✅ **DEV**: 1.5GB total (temporal, solo para testing)  
✅ **PROD**: 2.8GB total (24/7, con margen de seguridad)  
✅ **Estrategia**: Nunca ambos simultáneamente  
✅ **Resultado**: Sistema estable sin OOM Killer  

---

**Fecha**: 2024-11-04  
**Estado**: Configuración optimizada para servidor 3.8GB  
**Validado**: Límites ajustados en docker-compose.dev.yml


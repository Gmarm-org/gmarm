# 🔧 Troubleshooting - Servidor de Desarrollo No Responde

## ❌ Problema Reportado

**Error:** `ERR_CONNECTION_REFUSED` al intentar acceder a `http://72.167.52.14:5173`

```
No se puede acceder a este sitio web
La página 72.167.52.14 ha rechazado la conexión.
```

---

## 🔍 Diagnóstico

### 1. Verificar Estado del Servidor

```bash
# Conectarse al servidor
ssh ubuntu@72.167.52.14

# Verificar contenedores Docker
docker ps

# Verificar servicios específicos
docker ps | grep gmarm
```

**Esperado:** Deberías ver 3 contenedores corriendo:
- `gmarm-backend-dev`
- `gmarm-frontend-dev`
- `gmarm-postgres-dev`

---

## 🛠️ Soluciones

### Solución 1: Reiniciar Servicios

```bash
# En el servidor
cd /home/ubuntu/deploy/dev  # o tu directorio de deployment

# Reiniciar servicios
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d

# Verificar logs
docker-compose -f docker-compose.dev.yml logs -f
```

---

### Solución 2: Rebuild Completo

```bash
# En el servidor
cd /home/ubuntu/deploy/dev

# Stop todo y limpiar
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f

# Rebuild desde cero
docker-compose -f docker-compose.dev.yml up -d --build

# Esperar 2-3 minutos para que todo inicie
sleep 180

# Verificar estado
docker ps
curl http://localhost:8080/api/health
curl http://localhost:5173
```

---

### Solución 3: Verificar Firewall y Puertos

```bash
# Verificar que los puertos estén abiertos
sudo ufw status

# Si el firewall está activo, permitir los puertos
sudo ufw allow 5173/tcp
sudo ufw allow 8080/tcp
sudo ufw reload

# Verificar que los servicios estén escuchando
sudo netstat -tulpn | grep :5173
sudo netstat -tulpn | grep :8080
```

---

### Solución 4: Verificar Variables de Entorno

```bash
# Verificar archivo .env o docker-compose.dev.yml
cat docker-compose.dev.yml | grep -A 10 "environment:"

# Verificar que VITE_API_URL apunte correctamente
# Debe ser: VITE_API_URL=http://72.167.52.14:8080
```

---

### Solución 5: Reset Completo de Base de Datos

```bash
# En el servidor
cd /home/ubuntu/deploy/dev

# Usar script de reset
chmod +x scripts/reset-dev-db.sh
./scripts/reset-dev-db.sh

# O manualmente
docker-compose -f docker-compose.dev.yml down -v
docker volume rm gmarm_postgres_data_dev
docker-compose -f docker-compose.dev.yml up -d --build
```

---

## 🔄 Deployment Automático desde GitHub

Si acabas de hacer push a `dev`, espera a que GitHub Actions termine:

1. Ve a: https://github.com/Gmarm-org/gmarm/actions
2. Verifica el workflow "🚀 GMARM CI/CD Pipeline"
3. Espera a que el deployment termine (8-12 minutos)
4. Si hay errores, revisa los logs del workflow

---

## 📊 Verificación Post-Solución

```bash
# 1. Verificar contenedores
docker ps
# Deben estar: gmarm-backend-dev, gmarm-frontend-dev, gmarm-postgres-dev

# 2. Verificar logs (sin errores)
docker logs gmarm-backend-dev --tail 50
docker logs gmarm-frontend-dev --tail 50
docker logs gmarm-postgres-dev --tail 50

# 3. Verificar conectividad
curl http://localhost:8080/api/health
# Esperado: {"status":"UP"}

curl http://localhost:5173
# Esperado: HTML del frontend

# 4. Verificar desde internet (desde tu máquina local)
curl http://72.167.52.14:8080/api/health
curl -I http://72.167.52.14:5173
```

---

## 🚨 Problemas Comunes

### Problema: Contenedores no inician

**Causa:** Falta de recursos (RAM/CPU)

**Solución:**
```bash
# Verificar recursos
free -h
df -h

# Si hay poco espacio, limpiar Docker
docker system prune -a -f --volumes
```

---

### Problema: Backend conecta pero frontend no

**Causa:** Frontend no está sirviendo archivos correctamente

**Solución:**
```bash
# Rebuild solo frontend
docker-compose -f docker-compose.dev.yml stop frontend_dev
docker-compose -f docker-compose.dev.yml rm -f frontend_dev
docker-compose -f docker-compose.dev.yml up -d --build frontend_dev

# Verificar logs
docker logs gmarm-frontend-dev -f
```

---

### Problema: Base de datos vacía

**Causa:** SQL maestro no se ejecutó

**Solución:**
```bash
# Ejecutar SQL maestro manualmente
cat datos/00_gmarm_completo.sql | docker exec -i gmarm-postgres-dev psql -U postgres -d gmarm_dev

# Verificar datos
docker exec gmarm-postgres-dev psql -U postgres -d gmarm_dev -c "SELECT COUNT(*) FROM usuario;"
```

---

### Problema: ERR_CONNECTION_REFUSED persiste

**Causas posibles:**
1. Firewall del servidor bloquea puertos
2. Docker no está corriendo
3. Servicios no están en modo "host" o no exponen puertos
4. ISP o red bloquea el puerto 5173

**Solución:**
```bash
# 1. Verificar firewall
sudo ufw status
sudo ufw allow 5173/tcp
sudo ufw allow 8080/tcp

# 2. Verificar Docker daemon
sudo systemctl status docker
sudo systemctl restart docker

# 3. Verificar puertos expuestos
docker-compose -f docker-compose.dev.yml ps
# Debe mostrar: 0.0.0.0:5173->5173, 0.0.0.0:8080->8080

# 4. Probar desde el servidor mismo (localhost)
curl http://localhost:5173
curl http://localhost:8080/api/health

# Si localhost funciona pero IP externa no, es problema de red/firewall
```

---

## 📋 Checklist de Verificación

- [ ] Servidor Ubuntu accesible por SSH
- [ ] Docker daemon corriendo
- [ ] 3 contenedores Docker corriendo (backend, frontend, postgres)
- [ ] Backend responde en localhost:8080
- [ ] Frontend responde en localhost:5173
- [ ] Firewall permite puertos 5173 y 8080
- [ ] Base de datos tiene datos (usuarios, armas, etc.)
- [ ] Variables de entorno correctas en docker-compose.dev.yml
- [ ] GitHub Actions CI/CD ejecutado exitosamente
- [ ] Acceso desde internet funciona

---

## 🆘 Si Nada Funciona

### Opción 1: Deployment Manual Completo

```bash
# 1. Conectarse al servidor
ssh ubuntu@72.167.52.14

# 2. Ir al directorio
cd /home/ubuntu/deploy/dev

# 3. Pull últimos cambios
git fetch origin
git reset --hard origin/dev

# 4. Limpiar todo
docker-compose -f docker-compose.dev.yml down -v
docker system prune -a -f --volumes

# 5. Rebuild completo
docker-compose -f docker-compose.dev.yml up -d --build

# 6. Esperar 5 minutos
sleep 300

# 7. Verificar
docker ps
docker logs gmarm-backend-dev --tail 100
docker logs gmarm-frontend-dev --tail 100

# 8. Test de conectividad
curl http://localhost:8080/api/health
curl http://localhost:5173
```

---

### Opción 2: Verificar Configuración de Red

```bash
# Verificar que el servidor escucha en todas las interfaces
sudo netstat -tulpn | grep -E ":(5173|8080)"

# Debe mostrar:
# tcp6  0  0  :::5173   :::*   LISTEN
# tcp6  0  0  :::8080   :::*   LISTEN

# Si solo muestra 127.0.0.1, hay problema de binding
# Verificar docker-compose.dev.yml:
# ports:
#   - "5173:5173"  # Correcto
#   - "127.0.0.1:5173:5173"  # Incorrecto - solo localhost
```

---

### Opción 3: Contactar Proveedor de Hosting

Si todo lo anterior falla:
1. Verificar que el proveedor no bloquee puertos
2. Verificar configuración de red/DNS
3. Verificar logs del sistema: `sudo journalctl -xe`

---

## 📞 Soporte

Para más ayuda:
1. Revisar logs de Docker: `docker-compose logs -f`
2. Revisar GitHub Actions: https://github.com/Gmarm-org/gmarm/actions
3. Crear issue en GitHub con logs completos

---

*Última actualización: Octubre 2024*

#!/usr/bin/env pwsh
# Script para reinicio completo del entorno Docker

Write-Host "REINICIO COMPLETO DEL ENTORNO DOCKER" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

# Paso 1: Detener todos los servicios
Write-Host "`nPaso 1: Deteniendo todos los servicios..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml down -v

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error deteniendo servicios" -ForegroundColor Red
    exit 1
}

Write-Host "Servicios detenidos correctamente" -ForegroundColor Green

# Paso 2: Limpiar imágenes huérfanas (opcional)
Write-Host "`nPaso 2: Limpiando imágenes huérfanas..." -ForegroundColor Cyan
docker system prune -f

# Paso 3: Iniciar servicios
Write-Host "`nPaso 3: Iniciando servicios..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error iniciando servicios" -ForegroundColor Red
    exit 1
}

Write-Host "Servicios iniciados correctamente" -ForegroundColor Green

# Paso 4: Esperar que los servicios terminen de cargar
Write-Host "`nPaso 4: Esperando que los servicios terminen de cargar..." -ForegroundColor Cyan
Write-Host "   Esto puede tomar hasta 60 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Paso 5: Verificar estado de los servicios
Write-Host "`nPaso 5: Verificando estado de los servicios..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml ps

# Paso 6: Probar login
Write-Host "`nPaso 6: Probando login..." -ForegroundColor Cyan
try {
    $loginData = '{"email":"vendedor@test.com","password":"admin123"}'
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login exitoso - Sistema funcionando correctamente" -ForegroundColor Green
} catch {
    Write-Host "Error en login: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   El sistema puede necesitar mas tiempo para cargar" -ForegroundColor Yellow
}

# Paso 7: Limpiar tabla cliente (opcional)
Write-Host "`nPaso 7: Limpiar tabla cliente? (S/N)" -ForegroundColor Cyan
$cleanClient = Read-Host "Escribe S para limpiar la tabla cliente"

if ($cleanClient -eq "S" -or $cleanClient -eq "s") {
    Write-Host "Limpiando tabla cliente..." -ForegroundColor Yellow
    docker exec gmarm-postgres-local psql -U postgres -d gmarm_dev -c "DELETE FROM cliente;"
    Write-Host "Tabla cliente limpiada" -ForegroundColor Green
} else {
    Write-Host "Tabla cliente mantenida" -ForegroundColor Yellow
}

Write-Host "`nREINICIO COMPLETO FINALIZADO" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8080" -ForegroundColor Cyan
Write-Host "`nListo para probar!" -ForegroundColor Green
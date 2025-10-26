#!/usr/bin/env pwsh
# Script para reiniciar solo el backend (cuando cambias código)

Write-Host "🔄 REINICIO RÁPIDO DEL BACKEND" -ForegroundColor Yellow
Write-Host "===============================" -ForegroundColor Yellow

# Paso 1: Detener solo el backend
Write-Host "`n📦 Paso 1: Deteniendo backend..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml stop backend_local

# Paso 2: Iniciar solo el backend
Write-Host "`n🚀 Paso 2: Iniciando backend..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml up -d backend_local

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error reiniciando backend" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend reiniciado correctamente" -ForegroundColor Green

# Paso 3: Esperar que el backend termine de cargar
Write-Host "`n⏳ Paso 3: Esperando que el backend termine de cargar..." -ForegroundColor Cyan
Write-Host "   Esto puede tomar hasta 30 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Paso 4: Probar login
Write-Host "`n🔐 Paso 4: Probando login..." -ForegroundColor Cyan
try {
    $loginData = '{"email":"vendedor@test.com","password":"admin123"}'
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login exitoso - Backend funcionando correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en login: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   El backend puede necesitar más tiempo para cargar" -ForegroundColor Yellow
}

Write-Host "`n🎉 REINICIO DEL BACKEND FINALIZADO" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "¡Listo para probar!" -ForegroundColor Green

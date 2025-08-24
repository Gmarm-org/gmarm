# ========================================
# DIAGNÓSTICO DEL SERVIDOR UBUNTU
# ========================================
# Script para diagnosticar problemas de conectividad en el servidor

Write-Host "🔍 DIAGNÓSTICO DEL SERVIDOR UBUNTU" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Configuración del servidor
$SERVER_IP = "72.167.52.14"
$BACKEND_PORT = "8080"
$FRONTEND_PORT = "5173"

Write-Host "📋 CONFIGURACIÓN ACTUAL:" -ForegroundColor Yellow
Write-Host "   Servidor IP: $SERVER_IP" -ForegroundColor White
Write-Host "   Backend Puerto: $BACKEND_PORT" -ForegroundColor White
Write-Host "   Frontend Puerto: $FRONTEND_PORT" -ForegroundColor White
Write-Host ""

# 1. Verificar conectividad básica
Write-Host "🌐 VERIFICANDO CONECTIVIDAD BÁSICA..." -ForegroundColor Green
try {
    $ping = Test-Connection -ComputerName $SERVER_IP -Count 1 -Quiet
    if ($ping) {
        Write-Host "   ✅ Ping exitoso a $SERVER_IP" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Ping falló a $SERVER_IP" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error en ping: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Verificar puertos abiertos
Write-Host ""
Write-Host "🔌 VERIFICANDO PUERTOS ABIERTOS..." -ForegroundColor Green

# Backend
try {
    $backendTest = Test-NetConnection -ComputerName $SERVER_IP -Port $BACKEND_PORT -InformationLevel Quiet
    if ($backendTest.TcpTestSucceeded) {
        Write-Host "   ✅ Puerto $BACKEND_PORT (Backend) está abierto" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Puerto $BACKEND_PORT (Backend) está cerrado" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error verificando puerto $BACKEND_PORT : $($_.Exception.Message)" -ForegroundColor Red
}

# Frontend
try {
    $frontendTest = Test-NetConnection -ComputerName $SERVER_IP -Port $FRONTEND_PORT -InformationLevel Quiet
    if ($frontendTest.TcpTestSucceeded) {
        Write-Host "   ✅ Puerto $FRONTEND_PORT (Frontend) está abierto" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Puerto $FRONTEND_PORT (Frontend) está cerrado" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error verificando puerto $FRONTEND_PORT : $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Verificar URLs de la API
Write-Host ""
Write-Host "🔗 VERIFICANDO URLs DE LA API..." -ForegroundColor Green

$backendURL = "http://$SERVER_IP`:$BACKEND_PORT"
$frontendURL = "http://$SERVER_IP`:$FRONTEND_PORT"

Write-Host "   Backend URL: $backendURL" -ForegroundColor White
Write-Host "   Frontend URL: $frontendURL" -ForegroundColor White

# 4. Verificar archivos de configuración
Write-Host ""
Write-Host "📁 VERIFICANDO ARCHIVOS DE CONFIGURACIÓN..." -ForegroundColor Green

$configFiles = @(
    ".env.dev.local",
    "docker-compose.dev.yml",
    "frontend/src/config/dev.ts"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file existe" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file no existe" -ForegroundColor Red
    }
}

# 5. Verificar Docker
Write-Host ""
Write-Host "🐳 VERIFICANDO DOCKER..." -ForegroundColor Green

try {
    $dockerVersion = docker --version
    if ($dockerVersion) {
        Write-Host "   ✅ Docker está instalado: $dockerVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Docker no está instalado o no es accesible" -ForegroundColor Red
}

try {
    $dockerComposeVersion = docker-compose --version
    if ($dockerComposeVersion) {
        Write-Host "   ✅ Docker Compose está instalado: $dockerComposeVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Docker Compose no está instalado o no es accesible" -ForegroundColor Red
}

# 6. Recomendaciones
Write-Host ""
Write-Host "💡 RECOMENDACIONES:" -ForegroundColor Cyan
Write-Host "   1. Verificar que los servicios Docker estén corriendo en el servidor" -ForegroundColor White
Write-Host "   2. Verificar la configuración de CORS en el backend" -ForegroundColor White
Write-Host "   3. Verificar que los puertos estén abiertos en el firewall del servidor" -ForegroundColor White
Write-Host "   4. Verificar que las variables de entorno estén configuradas correctamente" -ForegroundColor White
Write-Host ""

Write-Host "🎯 SIGUIENTE PASO:" -ForegroundColor Yellow
Write-Host "   Ejecutar: .\deploy-dev-server.ps1" -ForegroundColor White
Write-Host "   O ejecutar: .\scripts\clean-dev.ps1 seguido de docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor White

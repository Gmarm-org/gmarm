# Script para iniciar Keycloak en desarrollo local
# Uso: .\scripts\start-keycloak.ps1

Write-Host "🔐 Iniciando Keycloak..." -ForegroundColor Cyan

# Verificar si existe .env.keycloak
if (-Not (Test-Path ".env.keycloak")) {
    Write-Host "⚠️  Creando .env.keycloak desde .env.keycloak.example..." -ForegroundColor Yellow
    Copy-Item ".env.keycloak.example" ".env.keycloak"
}

# Levantar servicios
Write-Host "📦 Levantando contenedores..." -ForegroundColor Cyan
docker-compose --env-file .env.keycloak -f docker-compose.keycloak.yml up -d

# Esperar a que Keycloak esté listo
Write-Host "⏳ Esperando a que Keycloak esté listo..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8180/health/ready" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Keycloak está listo!" -ForegroundColor Green
            break
        }
    }
    catch {
        # Ignorar errores
    }
    
    $attempt++
    Write-Host "   Intento $attempt de $maxAttempts..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if ($attempt -eq $maxAttempts) {
    Write-Host "❌ Timeout esperando a Keycloak. Verifica los logs:" -ForegroundColor Red
    Write-Host "   docker logs gmarm-keycloak" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Keycloak Admin Console disponible en:" -ForegroundColor Green
Write-Host "   🌐 URL: http://localhost:8180" -ForegroundColor White
Write-Host "   👤 Usuario: admin" -ForegroundColor White
Write-Host "   🔑 Password: admin123" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Abrir http://localhost:8180 en tu navegador" -ForegroundColor Gray
Write-Host "   2. Login con admin/admin123" -ForegroundColor Gray
Write-Host "   3. Seguir las instrucciones en INTEGRACION_KEYCLOAK.md (Paso 1.2)" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 Para detener Keycloak:" -ForegroundColor Yellow
Write-Host "   .\scripts\stop-keycloak.ps1" -ForegroundColor Gray
Write-Host ""


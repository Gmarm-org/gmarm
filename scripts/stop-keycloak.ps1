# Script para detener Keycloak
# Uso: .\scripts\stop-keycloak.ps1

Write-Host "🛑 Deteniendo Keycloak..." -ForegroundColor Yellow

docker-compose --env-file .env.keycloak -f docker-compose.keycloak.yml down

Write-Host "✅ Keycloak detenido" -ForegroundColor Green


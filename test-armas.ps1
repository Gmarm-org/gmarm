# Script para probar el endpoint de armas
Write-Host "Probando endpoint de armas con JWT..." -ForegroundColor Green

# 1. Obtener token JWT
Write-Host "1. Obteniendo token JWT..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "vendedor@test.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Token JWT obtenido exitosamente" -ForegroundColor Green
} catch {
    Write-Host "Error obteniendo token JWT: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Probar endpoint de armas
Write-Host "2. Probando endpoint de armas..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $armasResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/arma" -Method GET -Headers $headers
    Write-Host "Endpoint de armas funcionando correctamente" -ForegroundColor Green
    Write-Host "Total de armas: $($armasResponse.Count)" -ForegroundColor Cyan
    
    # Mostrar primera arma como ejemplo
    if ($armasResponse.Count -gt 0) {
        Write-Host "Primera arma:" -ForegroundColor Cyan
        $armasResponse[0] | ConvertTo-Json -Depth 2
    }
    
} catch {
    Write-Host "Error en endpoint de armas: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Prueba completada" -ForegroundColor Green

# GMARM System Monitor - Simple Version
# Verifica el estado de los servicios principales

Write-Host "GMARM System Monitor" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
Write-Host "Checking Docker..." -NoNewline
try {
    $null = docker ps 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host " FAILED" -ForegroundColor Red
    exit 1
}

# Verificar contenedores
$containers = @("gmarm-backend-dev", "gmarm-frontend-dev", "gmarm-postgres-dev")
$runningContainers = 0

foreach ($container in $containers) {
    Write-Host "Checking container $container..." -NoNewline
    try {
        $result = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $container }
        if ($result) {
            Write-Host " Running" -ForegroundColor Green
            $runningContainers++
        } else {
            Write-Host " Not Running" -ForegroundColor Red
        }
    }
    catch {
        Write-Host " Error" -ForegroundColor Red
    }
}

# Verificar servicios HTTP
Write-Host ""
Write-Host "Checking HTTP Services:" -ForegroundColor Yellow

# Backend
Write-Host "Backend API..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
    }
}
catch {
    Write-Host " FAILED" -ForegroundColor Red
}

# Frontend
Write-Host "Frontend..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
    }
}
catch {
    Write-Host " FAILED" -ForegroundColor Red
}

# Verificar base de datos
Write-Host ""
Write-Host "Checking Database..." -NoNewline
try {
    $result = docker exec gmarm-postgres-dev pg_isready -U postgres 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Connected" -ForegroundColor Green
    } else {
        Write-Host " Not Connected" -ForegroundColor Red
    }
}
catch {
    Write-Host " Error" -ForegroundColor Red
}

# Resumen
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "Running Containers: $runningContainers/3"

if ($runningContainers -eq 3) {
    Write-Host "System Status: ALL SERVICES RUNNING" -ForegroundColor Green
} else {
    Write-Host "System Status: SOME ISSUES DETECTED" -ForegroundColor Yellow
}

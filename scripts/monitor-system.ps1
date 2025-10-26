# ========================================
# SCRIPT DE MONITOREO LOCAL DEL SISTEMA (PowerShell)
# ========================================
# Este script verifica el estado de todos los servicios en Windows

param(
    [switch]$Verbose
)

Write-Host "🔍 GMARM System Monitor (PowerShell)" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Función para verificar servicio HTTP
function Test-Service {
    param(
        [string]$Name,
        [string]$Url,
        [int]$TimeoutSeconds = 10
    )
    
    Write-Host "🔍 Checking $Name... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSeconds -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ FAILED ($($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Función para verificar contenedor Docker
function Test-Container {
    param(
        [string]$ContainerName
    )
    
    Write-Host "🐳 Checking container $ContainerName... " -NoNewline
    
    try {
        $container = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $ContainerName }
        if ($container) {
            Write-Host "✅ Running" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Not Running" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error checking container" -ForegroundColor Red
        return $false
    }
}

# Función para verificar base de datos
function Test-Database {
    param(
        [string]$ContainerName,
        [string]$DatabaseName
    )
    
    Write-Host "🗄️ Checking database $DatabaseName... " -NoNewline
    
    try {
        $result = docker exec $ContainerName pg_isready -U postgres 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Connected" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Not Connected" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error checking database" -ForegroundColor Red
        return $false
    }
}

Write-Host "📋 System Status Check" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow

# Verificar Docker
Write-Host ""
Write-Host "🐳 Docker Status:" -ForegroundColor Blue
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Docker: ✅ Installed ($dockerVersion)" -ForegroundColor Green
    } else {
        Write-Host "   Docker: ❌ Not Installed" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "   Docker: ❌ Not Installed" -ForegroundColor Red
    exit 1
}

# Verificar Docker daemon
try {
    $dockerPs = docker ps 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Docker Daemon: ✅ Running" -ForegroundColor Green
    } else {
        Write-Host "   Docker Daemon: ❌ Not Running" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "   Docker Daemon: ❌ Not Running" -ForegroundColor Red
    exit 1
}

# Verificar contenedores
Write-Host ""
Write-Host "📦 Container Status:" -ForegroundColor Blue
$backendContainer = Test-Container "gmarm-backend-dev"
$frontendContainer = Test-Container "gmarm-frontend-dev"
$dbContainer = Test-Container "gmarm-postgres-dev"

# Verificar base de datos
Write-Host ""
Write-Host "🗄️ Database Status:" -ForegroundColor Blue
$dbConnection = Test-Database "gmarm-postgres-dev" "gmarm_dev"

# Verificar servicios HTTP
Write-Host ""
Write-Host "🌐 Service Status:" -ForegroundColor Blue
$backendService = Test-Service "Backend API" "http://localhost:8080/api/health"
$frontendService = Test-Service "Frontend" "http://localhost:5173"

# Verificar endpoints específicos
Write-Host ""
Write-Host "🔗 API Endpoints:" -ForegroundColor Blue
$authEndpoint = Test-Service "Auth Endpoint" "http://localhost:8080/api/auth/login"
$clientTypesEndpoint = Test-Service "Client Types" "http://localhost:8080/api/tipos-cliente/config"
$healthEndpoint = Test-Service "Health Check" "http://localhost:8080/api/health"

# Verificar logs recientes si se solicita
if ($Verbose) {
    Write-Host ""
    Write-Host "📋 Recent Logs (last 10 lines):" -ForegroundColor Yellow
    Write-Host "===============================" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "Backend Logs:" -ForegroundColor Blue
    try {
        docker logs gmarm-backend-dev --tail 10 2>$null
    }
    catch {
        Write-Host "No backend logs available" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Frontend Logs:" -ForegroundColor Blue
    try {
        docker logs gmarm-frontend-dev --tail 10 2>$null
    }
    catch {
        Write-Host "No frontend logs available" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Database Logs:" -ForegroundColor Blue
    try {
        docker logs gmarm-postgres-dev --tail 5 2>$null
    }
    catch {
        Write-Host "No database logs available" -ForegroundColor Gray
    }
}

# Verificar espacio en disco
Write-Host ""
Write-Host "💾 Disk Usage:" -ForegroundColor Blue
Write-Host "=============" -ForegroundColor Blue
try {
    docker system df
}
catch {
    Write-Host "Could not get disk usage information" -ForegroundColor Gray
}

# Verificar memoria
Write-Host ""
Write-Host "🧠 Memory Usage:" -ForegroundColor Blue
Write-Host "===============" -ForegroundColor Blue
try {
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | Select-Object -First 10
}
catch {
    Write-Host "Could not get memory usage information" -ForegroundColor Gray
}

# Resumen final
Write-Host ""
Write-Host "📊 System Summary:" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow

# Contar servicios funcionando
$workingServices = 0
$totalServices = 3

if ($backendService) { $workingServices++ }
if ($frontendService) { $workingServices++ }
if ($dbConnection) { $workingServices++ }

Write-Host "Services Working: $workingServices/$totalServices"

if ($workingServices -eq $totalServices) {
    Write-Host "All services are running correctly!" -ForegroundColor Green
    exit 0
}
elseif ($workingServices -gt 0) {
    Write-Host "Some services have issues" -ForegroundColor Yellow
    exit 1
}
else {
    Write-Host "All services are down" -ForegroundColor Red
    exit 2
}

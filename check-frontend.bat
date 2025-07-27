@echo off
echo 🔍 Verificando estado del frontend...
echo ========================================

echo [1/4] Verificando puerto 5173...
netstat -ano | findstr :5173
if %errorlevel% equ 0 (
    echo ✅ Puerto 5173 está en uso
) else (
    echo ❌ Puerto 5173 no está en uso
)

echo.
echo [2/4] Verificando archivos CSS...
if exist "frontend\src\pages\Vendedor\components\ClientForm.css" (
    echo ✅ ClientForm.css existe
) else (
    echo ❌ ClientForm.css no existe
)

if exist "frontend\src\data\ecuadorLocations.ts" (
    echo ✅ ecuadorLocations.ts existe
) else (
    echo ❌ ecuadorLocations.ts no existe
)

echo.
echo [3/4] Verificando dependencias...
cd frontend
if exist "node_modules" (
    echo ✅ node_modules existe
) else (
    echo ❌ node_modules no existe - ejecutar: npm install
)

echo.
echo [4/4] Verificando configuración de Vite...
if exist "vite.config.ts" (
    echo ✅ vite.config.ts existe
) else (
    echo ❌ vite.config.ts no existe
)

echo.
echo ========================================
echo 📋 RESUMEN:
echo.
echo Para solucionar problemas:
echo 1. Ejecutar: fix-frontend.bat
echo 2. Verificar que el backend esté corriendo en puerto 8080
echo 3. Acceder a: http://localhost:5173
echo.
echo Credenciales de prueba:
echo - Admin: admin@armasimportacion.com / admin123
echo - Vendedor: vendedor@test.com / admin123
echo.
pause 
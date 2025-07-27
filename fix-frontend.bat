@echo off
echo 🔧 Solucionando problemas del frontend...
echo ========================================

echo [1/5] Deteniendo procesos en puerto 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [2/5] Limpiando node_modules...
cd frontend
if exist node_modules (
    rmdir /s /q node_modules
)

echo [3/5] Limpiando cache de npm...
npm cache clean --force

echo [4/5] Reinstalando dependencias...
npm install

echo [5/5] Iniciando servidor de desarrollo...
echo.
echo 🚀 Frontend iniciándose en http://localhost:5173
echo.
npm run dev 
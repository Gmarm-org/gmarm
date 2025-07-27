@echo off
REM ========================================
REM SCRIPT DE CONFIGURACIÓN DE DESARROLLO (WINDOWS)
REM ========================================

echo 🚀 Configurando entorno de desarrollo para Sistema de Importación de Armas
echo ==================================================================

REM Verificar si PostgreSQL está instalado
echo [INFO] Verificando PostgreSQL...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL no encontrado. Por favor instálalo primero.
    pause
    exit /b 1
)
echo [SUCCESS] PostgreSQL encontrado

REM Verificar si Java está instalado
echo [INFO] Verificando Java...
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Java no encontrado. Por favor instálalo primero.
    pause
    exit /b 1
)
echo [SUCCESS] Java encontrado

REM Verificar si Node.js está instalado
echo [INFO] Verificando Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no encontrado. Por favor instálalo primero.
    pause
    exit /b 1
)
echo [SUCCESS] Node.js encontrado

REM Crear base de datos
echo [INFO] Creando base de datos...
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='gmarm_db'" | findstr gmarm_db >nul
if %errorlevel% equ 0 (
    echo [WARNING] La base de datos 'gmarm_db' ya existe
    set /p recreate="¿Deseas eliminarla y recrearla? (y/N): "
    if /i "%recreate%"=="y" (
        dropdb -U postgres gmarm_db
        echo [INFO] Base de datos eliminada
    ) else (
        echo [INFO] Usando base de datos existente
        goto :setup_backend
    )
)

createdb -U postgres gmarm_db
if %errorlevel% equ 0 (
    echo [SUCCESS] Base de datos 'gmarm_db' creada exitosamente
) else (
    echo [ERROR] Error al crear la base de datos
    pause
    exit /b 1
)

:setup_backend
REM Configurar backend
echo [INFO] Configurando backend...
if not exist "backend" (
    echo [ERROR] Directorio 'backend' no encontrado
    pause
    exit /b 1
)

cd backend

REM Verificar si Maven está disponible
where mvn >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Compilando backend con Maven...
    mvn clean compile
    if %errorlevel% equ 0 (
        echo [SUCCESS] Backend compilado exitosamente
    ) else (
        echo [ERROR] Error al compilar el backend
        cd ..
        pause
        exit /b 1
    )
) else (
    echo [WARNING] Maven no encontrado, usando Maven Wrapper...
    if exist "mvnw.cmd" (
        mvnw.cmd clean compile
        if %errorlevel% equ 0 (
            echo [SUCCESS] Backend compilado exitosamente
        ) else (
            echo [ERROR] Error al compilar el backend
            cd ..
            pause
            exit /b 1
        )
    ) else (
        echo [ERROR] Maven Wrapper no encontrado
        cd ..
        pause
        exit /b 1
    )
)

cd ..

:setup_frontend
REM Configurar frontend
echo [INFO] Configurando frontend...
if not exist "frontend" (
    echo [ERROR] Directorio 'frontend' no encontrado
    pause
    exit /b 1
)

cd frontend

REM Verificar si node_modules existe
if not exist "node_modules" (
    echo [INFO] Instalando dependencias del frontend...
    npm install
    if %errorlevel% equ 0 (
        echo [SUCCESS] Dependencias instaladas exitosamente
    ) else (
        echo [ERROR] Error al instalar dependencias
        cd ..
        pause
        exit /b 1
    )
) else (
    echo [INFO] Dependencias ya instaladas
)

cd ..

:create_env
REM Crear archivo .env para frontend
echo [INFO] Creando archivo .env para frontend...
cd frontend

if not exist ".env" (
    (
        echo # API Configuration
        echo VITE_API_URL=http://localhost:8080/api
        echo.
        echo # App Configuration
        echo VITE_APP_NAME=Sistema de Importación de Armas
        echo VITE_APP_VERSION=1.0.0
        echo.
        echo # Development Configuration
        echo VITE_DEV_MODE=true
    ) > .env
    echo [SUCCESS] Archivo .env creado
) else (
    echo [WARNING] Archivo .env ya existe
)

cd ..

:show_credentials
REM Mostrar credenciales
echo.
echo ==================================================================
echo 🔐 CREDENCIALES DE ACCESO
echo ==================================================================
echo.
echo 👤 USUARIO ADMINISTRADOR:
echo    Email: admin@armasimportacion.com
echo    Password: admin123
echo.
echo 👥 USUARIOS DE PRUEBA:
echo    Vendedor: vendedor@test.com / admin123
echo    Jefe Ventas: jefe@test.com / admin123
echo    Finanzas: finanzas@test.com / admin123
echo    Operaciones: operaciones@test.com / admin123
echo.
echo 🌐 URLs DE ACCESO:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:8080/api
echo    Swagger UI: http://localhost:8080/swagger-ui.html
echo.
echo ==================================================================

echo.
echo [SUCCESS] ¡Configuración completada exitosamente!
echo.
echo Para iniciar el sistema:
echo 1. Backend: cd backend ^&^& mvnw.cmd spring-boot:run
echo 2. Frontend: cd frontend ^&^& npm run dev
echo.
echo ¡Disfruta desarrollando! 🚀
pause 
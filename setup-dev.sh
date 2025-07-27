#!/bin/bash

# ========================================
# SCRIPT DE CONFIGURACIÓN DE DESARROLLO
# ========================================

echo "🚀 Configurando entorno de desarrollo para Sistema de Importación de Armas"
echo "=================================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si PostgreSQL está instalado
check_postgresql() {
    print_status "Verificando PostgreSQL..."
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL encontrado"
        return 0
    else
        print_error "PostgreSQL no encontrado. Por favor instálalo primero."
        return 1
    fi
}

# Verificar si Java está instalado
check_java() {
    print_status "Verificando Java..."
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
        print_success "Java encontrado: $JAVA_VERSION"
        return 0
    else
        print_error "Java no encontrado. Por favor instálalo primero."
        return 1
    fi
}

# Verificar si Node.js está instalado
check_nodejs() {
    print_status "Verificando Node.js..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js encontrado: $NODE_VERSION"
        return 0
    else
        print_error "Node.js no encontrado. Por favor instálalo primero."
        return 1
    fi
}

# Crear base de datos
create_database() {
    print_status "Creando base de datos..."
    
    # Verificar si la base de datos ya existe
    if psql -lqt | cut -d \| -f 1 | grep -qw gmarm_db; then
        print_warning "La base de datos 'gmarm_db' ya existe"
        read -p "¿Deseas eliminarla y recrearla? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            dropdb gmarm_db
            print_status "Base de datos eliminada"
        else
            print_status "Usando base de datos existente"
            return 0
        fi
    fi
    
    createdb gmarm_db
    if [ $? -eq 0 ]; then
        print_success "Base de datos 'gmarm_db' creada exitosamente"
    else
        print_error "Error al crear la base de datos"
        return 1
    fi
}

# Configurar backend
setup_backend() {
    print_status "Configurando backend..."
    
    if [ ! -d "backend" ]; then
        print_error "Directorio 'backend' no encontrado"
        return 1
    fi
    
    cd backend
    
    # Verificar si Maven está disponible
    if command -v mvn &> /dev/null; then
        print_status "Compilando backend con Maven..."
        mvn clean compile
        if [ $? -eq 0 ]; then
            print_success "Backend compilado exitosamente"
        else
            print_error "Error al compilar el backend"
            return 1
        fi
    else
        print_warning "Maven no encontrado, usando Maven Wrapper..."
        if [ -f "mvnw" ]; then
            ./mvnw clean compile
            if [ $? -eq 0 ]; then
                print_success "Backend compilado exitosamente"
            else
                print_error "Error al compilar el backend"
                return 1
            fi
        else
            print_error "Maven Wrapper no encontrado"
            return 1
        fi
    fi
    
    cd ..
}

# Configurar frontend
setup_frontend() {
    print_status "Configurando frontend..."
    
    if [ ! -d "frontend" ]; then
        print_error "Directorio 'frontend' no encontrado"
        return 1
    fi
    
    cd frontend
    
    # Verificar si node_modules existe
    if [ ! -d "node_modules" ]; then
        print_status "Instalando dependencias del frontend..."
        npm install
        if [ $? -eq 0 ]; then
            print_success "Dependencias instaladas exitosamente"
        else
            print_error "Error al instalar dependencias"
            return 1
        fi
    else
        print_status "Dependencias ya instaladas"
    fi
    
    cd ..
}

# Crear archivo .env para frontend
create_env_file() {
    print_status "Creando archivo .env para frontend..."
    
    cd frontend
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# API Configuration
VITE_API_URL=http://localhost:8080/api

# App Configuration
VITE_APP_NAME=Sistema de Importación de Armas
VITE_APP_VERSION=1.0.0

# Development Configuration
VITE_DEV_MODE=true
EOF
        print_success "Archivo .env creado"
    else
        print_warning "Archivo .env ya existe"
    fi
    
    cd ..
}

# Mostrar credenciales
show_credentials() {
    echo
    echo "=================================================================="
    echo "🔐 CREDENCIALES DE ACCESO"
    echo "=================================================================="
    echo
    echo "👤 USUARIO ADMINISTRADOR:"
    echo "   Email: admin@armasimportacion.com"
    echo "   Password: admin123"
    echo
    echo "👥 USUARIOS DE PRUEBA:"
    echo "   Vendedor: vendedor@test.com / admin123"
    echo "   Jefe Ventas: jefe@test.com / admin123"
    echo "   Finanzas: finanzas@test.com / admin123"
    echo "   Operaciones: operaciones@test.com / admin123"
    echo
    echo "🌐 URLs DE ACCESO:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend API: http://localhost:8080/api"
    echo "   Swagger UI: http://localhost:8080/swagger-ui.html"
    echo
    echo "=================================================================="
}

# Función principal
main() {
    echo "Iniciando configuración del entorno de desarrollo..."
    echo
    
    # Verificar dependencias
    check_postgresql || exit 1
    check_java || exit 1
    check_nodejs || exit 1
    
    # Crear base de datos
    create_database || exit 1
    
    # Configurar backend
    setup_backend || exit 1
    
    # Configurar frontend
    setup_frontend || exit 1
    
    # Crear archivo .env
    create_env_file
    
    # Mostrar credenciales
    show_credentials
    
    echo
    print_success "¡Configuración completada exitosamente!"
    echo
    echo "Para iniciar el sistema:"
    echo "1. Backend: cd backend && ./mvnw spring-boot:run"
    echo "2. Frontend: cd frontend && npm run dev"
    echo
    echo "¡Disfruta desarrollando! 🚀"
}

# Ejecutar función principal
main "$@" 
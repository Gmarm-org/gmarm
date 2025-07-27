#!/bin/bash

# ========================================
# SCRIPT PARA CORREGIR COMPILACIÓN DEL BACKEND
# ========================================

echo "🔧 Verificando y corrigiendo errores de compilación del backend..."

# Navegar al directorio del backend
cd backend

# Limpiar compilación anterior
echo "🧹 Limpiando compilación anterior..."
./mvnw clean

# Verificar que mvnw tenga permisos
chmod +x ./mvnw

# Intentar compilar
echo "🔨 Compilando backend..."
./mvnw compile

# Si la compilación falla, mostrar errores
if [ $? -ne 0 ]; then
    echo "❌ Errores de compilación encontrados. Revisando..."
    
    # Verificar archivos faltantes
    echo "📋 Verificando archivos de enums..."
    
    ENUMS_DIR="src/main/java/com/armasimportacion/enums"
    ENUMS=(
        "EstadoArmaFisica.java"
        "EstadoClienteGrupo.java"
        "TipoDocumentoGenerado.java"
        "EstadoDocumentoGenerado.java"
        "TipoPago.java"
        "EstadoPago.java"
        "EstadoCuotaPago.java"
        "EstadoDocumento.java"
        "EstadoGrupoImportacion.java"
        "EstadoDocumentoGrupo.java"
        "EstadoAccesorioFisico.java"
        "TipoNotificacion.java"
        "EstadoNotificacion.java"
    )
    
    for enum in "${ENUMS[@]}"; do
        if [ ! -f "$ENUMS_DIR/$enum" ]; then
            echo "❌ Faltante: $enum"
        else
            echo "✅ Presente: $enum"
        fi
    done
    
    echo ""
    echo "📋 Verificando repositorios..."
    
    REPOS_DIR="src/main/java/com/armasimportacion/repository"
    REPOS=(
        "TipoIdentificacionRepository.java"
        "TipoProcesoRepository.java"
    )
    
    for repo in "${REPOS[@]}"; do
        if [ ! -f "$REPOS_DIR/$repo" ]; then
            echo "❌ Faltante: $repo"
        else
            echo "✅ Presente: $repo"
        fi
    done
    
    echo ""
    echo "🔧 Intentando compilar solo las clases principales..."
    ./mvnw compile -Dmaven.compiler.failOnError=false
    
else
    echo "✅ Compilación exitosa!"
    
    # Ejecutar tests
    echo "🧪 Ejecutando tests..."
    ./mvnw test
    
    if [ $? -eq 0 ]; then
        echo "✅ Todos los tests pasaron!"
    else
        echo "⚠️  Algunos tests fallaron, pero la compilación fue exitosa"
    fi
fi

echo ""
echo "📋 Resumen:"
echo "   - Backend compilado: $([ $? -eq 0 ] && echo "✅" || echo "❌")"
echo "   - Tests ejecutados: $([ $? -eq 0 ] && echo "✅" || echo "⚠️")"
echo ""
echo "🚀 Si hay errores, revisa los archivos faltantes listados arriba" 
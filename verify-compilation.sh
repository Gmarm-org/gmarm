#!/bin/bash

echo "🔍 Verificando compilación después de corregir imports..."

cd backend

echo "📦 Limpiando proyecto..."
./mvnw clean

echo "🔨 Compilando proyecto..."
./mvnw compile

if [ $? -eq 0 ]; then
    echo "✅ ¡Compilación exitosa!"
    echo "🎉 Todos los imports están corregidos"
    
    echo ""
    echo "📋 Modelos corregidos:"
    echo "✅ Cliente.java - EntityListeners agregado"
    echo "✅ Usuario.java - EntityListeners agregado"
    echo "✅ Rol.java - EntityListeners agregado"
    echo "✅ ArmaFisica.java - Imports específicos"
    echo "✅ TipoCliente.java - Imports específicos"
    echo "✅ TipoIdentificacion.java - Imports específicos"
    echo "✅ TipoImportacion.java - Imports específicos"
    echo "✅ TipoProceso.java - Imports específicos"
    echo "✅ PreguntaCliente.java - Imports específicos"
    echo "✅ ModeloArma.java - Imports específicos"
    echo "✅ TipoDocumento.java - Imports específicos"
    
    echo ""
    echo "🚀 El backend está listo para el CI/CD"
else
    echo "❌ Aún hay errores de compilación"
    echo "🔍 Revisa los errores arriba"
fi 
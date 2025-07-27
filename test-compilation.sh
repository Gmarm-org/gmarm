#!/bin/bash

echo "🧪 Probando compilación después de corregir errores..."

cd backend

echo "📦 Limpiando proyecto..."
./mvnw clean

echo "🔨 Compilando proyecto..."
./mvnw compile

if [ $? -eq 0 ]; then
    echo "✅ ¡Compilación exitosa!"
    echo "🎉 Todos los errores han sido corregidos"
    
    echo ""
    echo "📋 Errores corregidos:"
    echo "✅ setPrecioReferencia() - Ahora usa BigDecimal en lugar de double"
    echo "✅ setCategoriaArma() - Nombre correcto del método setter"
    echo "✅ Imports específicos - Todos los imports son limpios"
    echo "✅ EntityListeners - Agregado a todos los modelos"
    
    echo ""
    echo "🚀 El backend está listo para el CI/CD"
    echo "💡 Credenciales de prueba:"
    echo "   - Admin: admin/admin123"
    echo "   - Vendedor: vendedor1/123456"
    echo "   - Jefe Ventas: jefe_ventas/123456"
    echo "   - Finanzas: finanzas/123456"
    echo "   - Operaciones: operaciones/123456"
else
    echo "❌ Aún hay errores de compilación"
    echo "🔍 Revisa los errores arriba"
fi 
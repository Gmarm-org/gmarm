#!/bin/bash

# ========================================
# SCRIPT PARA CORREGIR IMPORTS FALTANTES
# ========================================

echo "🔧 Corrigiendo imports faltantes en modelos..."

cd backend

# Función para agregar import a un archivo
add_import() {
    local file=$1
    local import=$2
    
    if ! grep -q "$import" "$file"; then
        echo "➕ Agregando import $import a $file"
        # Insertar después de la línea del package
        sed -i "1a\\
$import" "$file"
    else
        echo "✅ Import $import ya existe en $file"
    fi
}

# Corregir ArmaFisica.java
echo "📝 Corrigiendo ArmaFisica.java..."
add_import "src/main/java/com/armasimportacion/model/ArmaFisica.java" "import com.armasimportacion.enums.EstadoArmaFisica;"

# Corregir Cliente.java
echo "📝 Corrigiendo Cliente.java..."
add_import "src/main/java/com/armasimportacion/model/Cliente.java" "import com.armasimportacion.enums.EstadoCliente;"
add_import "src/main/java/com/armasimportacion/model/Cliente.java" "import com.armasimportacion.enums.EstadoMilitar;"

# Corregir ClienteGrupoImportacion.java
echo "📝 Corrigiendo ClienteGrupoImportacion.java..."
add_import "src/main/java/com/armasimportacion/model/ClienteGrupoImportacion.java" "import com.armasimportacion.enums.EstadoClienteGrupo;"

# Corregir DocumentoGenerado.java
echo "📝 Corrigiendo DocumentoGenerado.java..."
add_import "src/main/java/com/armasimportacion/model/DocumentoGenerado.java" "import com.armasimportacion.enums.TipoDocumentoGenerado;"
add_import "src/main/java/com/armasimportacion/model/DocumentoGenerado.java" "import com.armasimportacion.enums.EstadoDocumentoGenerado;"

# Corregir Pago.java
echo "📝 Corrigiendo Pago.java..."
add_import "src/main/java/com/armasimportacion/model/Pago.java" "import com.armasimportacion.enums.TipoPago;"
add_import "src/main/java/com/armasimportacion/model/Pago.java" "import com.armasimportacion.enums.EstadoPago;"

# Corregir CuotaPago.java
echo "📝 Corrigiendo CuotaPago.java..."
add_import "src/main/java/com/armasimportacion/model/CuotaPago.java" "import com.armasimportacion.enums.EstadoCuotaPago;"

# Corregir AsignacionAccesorio.java
echo "📝 Corrigiendo AsignacionAccesorio.java..."
add_import "src/main/java/com/armasimportacion/model/AsignacionAccesorio.java" "import com.armasimportacion.enums.EstadoAsignacion;"

# Corregir DocumentoCliente.java
echo "📝 Corrigiendo DocumentoCliente.java..."
add_import "src/main/java/com/armasimportacion/model/DocumentoCliente.java" "import com.armasimportacion.enums.EstadoDocumento;"

# Corregir GrupoImportacion.java
echo "📝 Corrigiendo GrupoImportacion.java..."
add_import "src/main/java/com/armasimportacion/model/GrupoImportacion.java" "import com.armasimportacion.enums.EstadoGrupoImportacion;"

# Corregir DocumentoGrupoImportacion.java
echo "📝 Corrigiendo DocumentoGrupoImportacion.java..."
add_import "src/main/java/com/armasimportacion/model/DocumentoGrupoImportacion.java" "import com.armasimportacion.enums.EstadoDocumentoGrupo;"

# Corregir AccesorioFisico.java
echo "📝 Corrigiendo AccesorioFisico.java..."
add_import "src/main/java/com/armasimportacion/model/AccesorioFisico.java" "import com.armasimportacion.enums.EstadoAccesorioFisico;"

# Corregir Licencia.java
echo "📝 Corrigiendo Licencia.java..."
add_import "src/main/java/com/armasimportacion/model/Licencia.java" "import com.armasimportacion.enums.EstadoLicencia;"

# Corregir AsignacionArma.java
echo "📝 Corrigiendo AsignacionArma.java..."
add_import "src/main/java/com/armasimportacion/model/AsignacionArma.java" "import com.armasimportacion.enums.EstadoAsignacion;"

# Corregir Rol.java
echo "📝 Corrigiendo Rol.java..."
add_import "src/main/java/com/armasimportacion/model/Rol.java" "import com.armasimportacion.enums.TipoRolVendedor;"

# Corregir Usuario.java
echo "📝 Corrigiendo Usuario.java..."
add_import "src/main/java/com/armasimportacion/model/Usuario.java" "import com.armasimportacion.enums.EstadoUsuario;"

# Corregir Notificacion.java
echo "📝 Corrigiendo Notificacion.java..."
add_import "src/main/java/com/armasimportacion/model/Notificacion.java" "import com.armasimportacion.enums.TipoNotificacion;"
add_import "src/main/java/com/armasimportacion/model/Notificacion.java" "import com.armasimportacion.enums.EstadoNotificacion;"

echo ""
echo "✅ Imports corregidos. Intentando compilar..."

# Intentar compilar
./mvnw compile

if [ $? -eq 0 ]; then
    echo "🎉 ¡Compilación exitosa!"
else
    echo "❌ Aún hay errores de compilación"
fi 
#!/bin/bash

echo "🔧 Corrigiendo imports críticos..."

# ArmaFisica.java
echo "import com.armasimportacion.enums.EstadoArmaFisica;" >> backend/src/main/java/com/armasimportacion/model/ArmaFisica.java.tmp
tail -n +2 backend/src/main/java/com/armasimportacion/model/ArmaFisica.java >> backend/src/main/java/com/armasimportacion/model/ArmaFisica.java.tmp
mv backend/src/main/java/com/armasimportacion/model/ArmaFisica.java.tmp backend/src/main/java/com/armasimportacion/model/ArmaFisica.java

# Cliente.java
echo "import com.armasimportacion.enums.EstadoCliente;" >> backend/src/main/java/com/armasimportacion/model/Cliente.java.tmp
echo "import com.armasimportacion.enums.EstadoMilitar;" >> backend/src/main/java/com/armasimportacion/model/Cliente.java.tmp
tail -n +2 backend/src/main/java/com/armasimportacion/model/Cliente.java >> backend/src/main/java/com/armasimportacion/model/Cliente.java.tmp
mv backend/src/main/java/com/armasimportacion/model/Cliente.java.tmp backend/src/main/java/com/armasimportacion/model/Cliente.java

# Rol.java
echo "import com.armasimportacion.enums.TipoRolVendedor;" >> backend/src/main/java/com/armasimportacion/model/Rol.java.tmp
tail -n +2 backend/src/main/java/com/armasimportacion/model/Rol.java >> backend/src/main/java/com/armasimportacion/model/Rol.java.tmp
mv backend/src/main/java/com/armasimportacion/model/Rol.java.tmp backend/src/main/java/com/armasimportacion/model/Rol.java

# Usuario.java
echo "import com.armasimportacion.enums.EstadoUsuario;" >> backend/src/main/java/com/armasimportacion/model/Usuario.java.tmp
tail -n +2 backend/src/main/java/com/armasimportacion/model/Usuario.java >> backend/src/main/java/com/armasimportacion/model/Usuario.java.tmp
mv backend/src/main/java/com/armasimportacion/model/Usuario.java.tmp backend/src/main/java/com/armasimportacion/model/Usuario.java

echo "✅ Imports agregados. Compilando..."
cd backend
./mvnw compile 
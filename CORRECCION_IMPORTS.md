# 🔧 Corrección Manual de Imports

## Problema
Los modelos no están importando correctamente los enums, causando errores de compilación.

## Solución Manual

### 1. ArmaFisica.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.EstadoArmaFisica;
```

### 2. Cliente.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoMilitar;
```

### 3. ClienteGrupoImportacion.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.EstadoClienteGrupo;
```

### 4. DocumentoGenerado.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.enums.EstadoDocumentoGenerado;
```

### 5. Pago.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.TipoPago;
import com.armasimportacion.enums.EstadoPago;
```

### 6. CuotaPago.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.EstadoCuotaPago;
```

### 7. AsignacionAccesorio.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.EstadoAsignacion;
```

### 8. DocumentoCliente.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.EstadoDocumento;
```

### 9. GrupoImportacion.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.EstadoGrupoImportacion;
```

### 10. DocumentoGrupoImportacion.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.EstadoDocumentoGrupo;
```

### 11. AccesorioFisico.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.EstadoAccesorioFisico;
```

### 12. Licencia.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.EstadoLicencia;
```

### 13. AsignacionArma.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.EstadoAsignacion;
```

### 14. Rol.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.TipoRolVendedor;
```

### 15. Usuario.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.EstadoUsuario;
```

### 16. Notificacion.java
Agregar después de la línea `package com.armasimportacion.model;`:
```java
import com.armasimportacion.enums.TipoNotificacion;
import com.armasimportacion.enums.EstadoNotificacion;
```

## Comando para verificar
Después de hacer las correcciones:
```bash
cd backend
./mvnw compile
```

## Alternativa: Script automático
Si prefieres, puedes ejecutar:
```bash
chmod +x fix-imports.sh
./fix-imports.sh
``` 
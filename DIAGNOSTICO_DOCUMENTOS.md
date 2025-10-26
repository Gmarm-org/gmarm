# Diagnóstico de Documentos - Problema de Visualización

## 🔍 Problema Identificado

Los documentos de clientes no se pueden visualizar, posiblemente debido a problemas de:
1. **Rutas incorrectas** entre la base de datos y el sistema de archivos
2. **Permisos de archivos** en el contenedor Docker
3. **Configuración de Spring** para servir archivos estáticos

## 🔧 Correcciones Implementadas

### 1. Mejora en DocumentoController.java

**Problema**: El controlador construía rutas incorrectas para los archivos.

**Solución**: Mejorada la lógica de construcción de rutas:
```java
private String construirRutaCompletaDocumentoCliente(String rutaBD) {
    // Si ya tiene el prefijo completo, devolverla tal cual
    if (rutaBD.startsWith("/app/documentacion/documentos_cliente/")) {
        return rutaBD;
    }
    
    // Si tiene /app/ pero no el path completo
    if (rutaBD.startsWith("/app/")) {
        return rutaBD;
    }
    
    // Si la ruta ya incluye "documentos_cliente", solo agregar /app/
    if (rutaBD.startsWith("documentos_cliente/")) {
        return "/app/documentacion/" + rutaBD;
    }
    
    // Agregar el prefijo base para documentos de cliente
    return "/app/documentacion/documentos_cliente/" + rutaBD;
}
```

### 2. Endpoint de Diagnóstico

**Nuevo endpoint**: `/api/documentos/debug/{documentoId}`

**Funcionalidad**: Proporciona información detallada sobre:
- Ruta original en la base de datos
- Ruta completa construida
- Si el archivo existe físicamente
- Tamaño del archivo
- Permisos de lectura
- Rutas alternativas y su existencia

## 📋 Estructura de Archivos Verificada

Los archivos están correctamente almacenados en:
```
documentacion/
├── documentos_cliente/
│   ├── cliente_1/
│   │   ├── documentos20251011/
│   │   │   ├── archivo1.pdf
│   │   │   └── archivo2.pdf
│   │   └── documentos20251015/
│   │       └── archivo3.pdf
│   ├── cliente_2/
│   │   └── documentos20251009/
│   │       └── archivo4.pdf
│   └── ...
└── contratos_generados/
    └── cliente_1/
        └── contrato.pdf
```

## 🐳 Configuración Docker

El volumen está correctamente montado en `docker-compose.dev.yml`:
```yaml
volumes:
  - ./documentacion:/app/documentacion
```

## 🧪 Pasos para Diagnosticar

### 1. Verificar que el servidor esté corriendo
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Probar el endpoint de diagnóstico
```bash
# Obtener un ID de documento de la BD
curl http://localhost:8080/api/documentos/debug/1
```

### 3. Verificar logs del backend
```bash
docker logs gmarm-backend-dev --tail 100
```

### 4. Probar acceso directo a un documento
```bash
curl http://localhost:8080/api/documentos/serve/1
```

## 🔍 Posibles Causas del Problema

### 1. **Rutas Incorrectas**
- **Síntoma**: Error 404 al acceder a documentos
- **Causa**: Mismatch entre rutas en BD y sistema de archivos
- **Solución**: ✅ Corregida en DocumentoController

### 2. **Permisos de Archivos**
- **Síntoma**: Error 403 o archivo no encontrado
- **Causa**: Permisos incorrectos en el contenedor
- **Solución**: Verificar permisos con `ls -la` en el contenedor

### 3. **Configuración de Spring**
- **Síntoma**: Error 404 en endpoints de documentos
- **Causa**: Falta configuración para servir archivos estáticos
- **Solución**: Agregar WebMvcConfigurer si es necesario

### 4. **Problemas de CORS**
- **Síntoma**: Error de CORS en el frontend
- **Causa**: Configuración CORS incorrecta
- **Solución**: Verificar configuración CORS en SecurityConfig

## 🚀 Próximos Pasos

1. **Reiniciar el servidor** con los cambios implementados
2. **Probar el endpoint de diagnóstico** para identificar el problema específico
3. **Verificar logs** para ver mensajes de debug detallados
4. **Probar acceso a documentos** desde el frontend
5. **Si persiste el problema**, verificar permisos de archivos en el contenedor

## 📝 Comandos de Verificación

```bash
# Verificar contenedores
docker ps

# Ver logs del backend
docker logs gmarm-backend-dev --tail 50

# Probar endpoint de diagnóstico
curl http://localhost:8080/api/documentos/debug/1

# Verificar archivos en el contenedor
docker exec gmarm-backend-dev ls -la /app/documentacion/documentos_cliente/

# Verificar permisos
docker exec gmarm-backend-dev ls -la /app/documentacion/documentos_cliente/cliente_1/
```

---

**Estado**: ✅ Correcciones implementadas
**Próximo paso**: Probar en servidor de desarrollo

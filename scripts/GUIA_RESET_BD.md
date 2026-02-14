# Guia de Base de Datos - Backup, Reset y Restauracion

**Ultima actualizacion**: Febrero 2026

---

## 1. Crear Backup (SIEMPRE antes de cualquier operacion)

### Backup rapido (solo BD)

```bash
bash scripts/backup-prod.sh
```

- Genera: `backups/gmarm-prod-TIMESTAMP.sql.gz`
- Solo la base de datos PostgreSQL (liviano)
- Retencion: 30 dias

### Backup completo (BD + documentos + archivos)

```bash
bash scripts/backup-completo-prod.sh
```

- Genera: `backups/completos/gmarm-completo-TIMESTAMP.tar.gz`
- Incluye BD + `documentacion/` (contratos, documentos de clientes, importacion, imagenes de armas)
- Incluye METADATA.txt con instrucciones de restauracion
- Retencion: 60 dias (se ejecuta cada 2 meses para no llenar el servidor)
- Los archivos se comprimen en .tar.gz para minimizar espacio

### Que se respalda

```
documentacion/                            <- Directorio unico
├── documentos_cliente/
│   └── documentos_clientes/
│       └── {cedula}/
│           ├── documentos_cargados/      (PDFs subidos por el cliente)
│           └── documentos_generados/     (contratos, cotizaciones, solicitudes)
├── documentos_importacion/
│   └── {grupoId}/
│       ├── documentos_cargados/
│       └── documentos_generados/
└── images/
    └── weapons/                          (imagenes de armas)
```

Si estas referencias se pierden sin backup, los documentos generados y cargados no se pueden recuperar.

### Verificar backup creado

```bash
# Ver ultimos backups
ls -lht backups/gmarm-prod-*.sql.gz | head -5
ls -lht backups/completos/gmarm-completo-*.tar.gz | head -5
```

---

## 2. Restaurar desde Backup

### Restaurar backup rapido (.sql.gz)

```bash
bash scripts/restore-backup.sh backups/gmarm-prod-TIMESTAMP.sql.gz
```

### Restaurar backup completo (.tar.gz)

```bash
# 1. Descomprimir
tar -xzf backups/completos/gmarm-completo-TIMESTAMP.tar.gz

# 2. Restaurar BD
bash scripts/restore-backup.sh gmarm-completo-TIMESTAMP/gmarm-completo-TIMESTAMP-database.sql

# 3. Restaurar archivos
tar -xzf gmarm-completo-TIMESTAMP/gmarm-completo-TIMESTAMP-archivos.tar.gz
```

### Que hace el restore

1. Crea backup de seguridad automatico (pre-restauracion)
2. Detiene backend y frontend
3. DROP + CREATE de la base de datos
4. Carga el dump SQL
5. Verifica datos (usuarios, armas, clientes)
6. Reinicia servicios
7. Health check del backend

Si la restauracion falla (0 usuarios), restaura automaticamente el backup de seguridad.

---

## 3. Reset completo (recrear BD desde SQL maestro)

**SOLO para desarrollo local o cuando se necesita partir desde cero.**

```bash
# Local (default)
bash scripts/reset-bd-desde-cero.sh

# Produccion (requiere confirmar con "SI")
bash scripts/reset-bd-desde-cero.sh prod
```

### Que hace el reset

1. Detiene servicios y elimina volumenes Docker (`down -v`)
2. Elimina archivos generados (contratos, uploads, imagenes)
3. Inicia solo PostgreSQL
4. Recrea la BD desde `datos/00_gmarm_completo.sql`
5. Verifica datos cargados (usuarios >= 3, roles >= 5, licencias >= 1)
6. Reinicia todos los servicios

### Antes de resetear produccion

```bash
# 1. OBLIGATORIO: hacer backup completo
bash scripts/backup-completo-prod.sh

# 2. Verificar que el backup existe
ls -lh backups/completos/

# 3. Validar el SQL maestro
bash scripts/validar-sql-maestro.sh

# 4. Informar a usuarios que el sistema estara fuera de linea

# 5. Ejecutar reset
bash scripts/reset-bd-desde-cero.sh prod
```

---

## 4. Verificacion post-operacion

```bash
# Verificar servicios
docker-compose -f docker-compose.prod.yml ps

# Verificar datos
bash scripts/verificar-datos-prod.sh

# Verificar health del backend
curl -s http://localhost:8080/api/health

# Verificar logs por errores
docker logs gmarm-backend-prod --tail 50
```

### Datos esperados

| Entidad | Minimo |
|---------|--------|
| Usuarios | >= 3 |
| Roles | >= 5 |
| Licencias | >= 1 |
| Categorias de Armas | >= 3 |
| Tipos de Cliente | >= 2 |

---

## 5. Troubleshooting

### PostgreSQL no inicia

```bash
docker logs gmarm-postgres-prod --tail 50
docker stats --no-stream
```

### Backup/restore falla

```bash
# Verificar que PostgreSQL esta corriendo
docker ps | grep postgres

# Verificar espacio en disco
df -h
```

### Backend no responde despues de restore

```bash
# Reiniciar backend manualmente
docker-compose -f docker-compose.prod.yml restart backend

# Esperar 30 segundos y verificar
sleep 30
curl -s http://localhost:8080/api/health
```

---

## Scripts disponibles

| Script | Uso |
|--------|-----|
| `backup-prod.sh` | Backup rapido de BD |
| `backup-completo-prod.sh` | Backup BD + archivos |
| `restore-backup.sh` | Restaurar desde backup |
| `reset-bd-desde-cero.sh` | Reset completo desde SQL maestro |
| `validar-sql-maestro.sh` | Validar sintaxis del SQL maestro |
| `verificar-datos-prod.sh` | Verificar integridad de datos |

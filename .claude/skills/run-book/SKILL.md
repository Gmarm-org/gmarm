---
name: run-book
description: Use when creating structured operational runbooks for human operators. Covers runbook organization, documentation patterns, and best practices for clear operational procedures at GMARM.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Runbooks - GMARM

Creating clear, actionable runbooks for operational tasks, maintenance, and troubleshooting at GMARM.

## What is a Runbook?

A runbook is step-by-step documentation for operational tasks:

- **Troubleshooting** - Diagnosing and fixing issues
- **Deployment** - Deploying to production
- **Maintenance** - Routine operational tasks
- **Database** - Schema changes, data fixes

## GMARM Environment Overview

### Infrastructure

| Component | Technology |
| --- | --- |
| Backend | Spring Boot 3.4.5 (Java 17) |
| Frontend | React 18 + TypeScript + Vite |
| Database | PostgreSQL |
| PDF Generation | Thymeleaf + OpenPDF |
| Deployment | Docker Compose |
| CI/CD | GitHub Actions |

### Environments

| Entorno | Docker Compose | Backend Properties | Frontend Env |
|---------|---------------|-------------------|--------------|
| LOCAL | `docker-compose.local.yml` | `application-local.properties` | `env.local` |
| DEV | `docker-compose.dev.yml` | `application-docker.properties` | `env.development` |
| PROD | `docker-compose.prod.yml` | `application-prod.properties` | `.env.prod` |

### Access Patterns

- **Production Server**: SSH via `ssh gmarm-prod` (key-based auth)
- **Database**: Direct via Docker container `gmarm-postgres-prod`
- **Logs**: `docker logs gmarm-backend-local` (local) or SSH to prod
- **Monitoring**: Docker container health checks

## Basic Runbook Structure

```markdown
# [Service/Domain]: [Issue/Task Title]

## Overview

Brief description of what this runbook covers and when to use it.

## Prerequisites

- Required access/permissions
- Tools needed (SSH, Docker, etc.)

## Steps

### 1. First Step

Detailed instructions.

### 2. Second Step

Continue with clear, numbered steps.

## Validation

How to verify the task was completed successfully.

## Rollback (if applicable)

How to undo changes if needed.
```

## Domain-Specific Runbook Patterns

### Backend Not Reflecting Changes

```markdown
# Backend: Changes Not Visible After Code Edit

## Overview

Java/template changes require Docker container restart.

## Steps

### 1. Restart Backend Container

docker-compose -f docker-compose.local.yml restart backend_local

### 2. If Still Not Working, Full Rebuild

docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d --build

### 3. Check Logs

docker logs gmarm-backend-local

## Validation

- Backend responds at http://localhost:8080
- Changes are visible in API responses
```

### Database Schema Change

```markdown
# Database: Schema Change Deployment

## Overview

Schema changes must update the SQL maestro and recreate the database volume.

## Steps

### 1. Update SQL Maestro

Edit `datos/00_gmarm_completo.sql` with the schema change.

### 2. Recreate Database

docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d --build

### 3. Verify Data

Check the database has the new schema and seed data loaded correctly.

## Validation

- Database tables match expected schema
- Application starts without errors
- Flyway migrations (if any) applied successfully
```

### Production Deployment

```markdown
# Deployment: Production Release

## Overview

Deploy latest changes to production server.

## Prerequisites

- SSH access to production server (`ssh gmarm-prod`)
- Code committed and pushed to main branch
- Backend compiles: `cd backend && mvn clean install -DskipTests`
- Frontend builds: `cd frontend && npm run build`

## Steps

### 1. SSH to Production

ssh gmarm-prod

### 2. Pull Latest Changes

cd /path/to/gmarm
git pull origin main

### 3. Rebuild and Restart

docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

### 4. Check Logs

docker logs gmarm-backend-prod

### 5. Verify Application

- Check backend health endpoint
- Verify frontend loads correctly
- Test critical flows (login, client creation)

## Rollback

If issues found:

git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Connection Issues

```markdown
# Database: Connection Pool Issues

## Overview

The application uses HikariCP for connection pooling to PostgreSQL.

## Diagnosis

### 1. Check Container Status

docker ps | grep postgres

### 2. Check Backend Logs for Connection Errors

docker logs gmarm-backend-local 2>&1 | grep -i "connection\|hikari\|pool"

### 3. Check Database Connections

docker exec gmarm-db psql -U postgres -d gmarm -c "SELECT count(*) FROM pg_stat_activity;"

## Resolution

### If Database Container is Down

docker-compose -f docker-compose.local.yml restart db_local

### If Connection Pool Exhausted

docker-compose -f docker-compose.local.yml restart backend_local

### If Database is Corrupted

docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d
```

### Document Generation Issues

```markdown
# Documents: PDF Generation Failures

## Overview

PDF generation uses Thymeleaf templates + OpenPDF. Failures usually stem from missing template variables or template syntax errors.

## Diagnosis

### 1. Check Backend Logs

docker logs gmarm-backend-local 2>&1 | grep -i "template\|thymeleaf\|pdf"

### 2. Common Causes

- Missing template variable (null pointer in template)
- Wrong template selected (ISSPOL vs ISSFA confusion)
- Template syntax error in HTML
- Client missing required data (cedula, ISSFA code, etc.)

## Resolution

### If Template Variable is Null

1. Check the PDF generator in `service/helper/documentos/`
2. Verify all variables are set before calling `utils.generarPdf()`
3. Add null checks for optional fields

### If Wrong Template Selected

1. Verify client type: Policia -> ISSPOL, FF.AA. -> ISSFA
2. Check `determinarTemplate()` method in the generator
3. NEVER confuse ISSPOL (Policia) with ISSFA (FF.AA.)

### After Fixing

docker-compose -f docker-compose.local.yml restart backend_local
```

## Best Practices for Runbooks

### Write for the Stressed Developer

- Use simple, direct language
- Number every step
- Include exact commands to copy-paste
- Show expected output vs error states

### Include Validation

Every runbook that makes changes should include:
- How to verify the change worked
- What "healthy" looks like
- How to rollback if something went wrong

### Include Docker Commands

Most GMARM operations involve Docker. Always include:
```bash
# Check container status
docker ps

# Check logs
docker logs <container-name>

# Restart specific service
docker-compose -f docker-compose.local.yml restart <service>

# Full rebuild
docker-compose -f docker-compose.local.yml down && docker-compose -f docker-compose.local.yml up -d --build

# Nuclear option (recreate DB)
docker-compose -f docker-compose.local.yml down -v && docker-compose -f docker-compose.local.yml up -d --build
```

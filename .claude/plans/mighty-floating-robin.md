# Plan: Adapt `.claude` Configuration to GMARM Project

## Context

The entire `.claude` configuration (agents, commands, skills, hooks, settings) was copied from a **NestJS v11 + Sequelize + BullMQ + Redis + AWS ECS Fargate** project. GMARM uses **Spring Boot 3.4.5 + Java 17 + JPA/Hibernate + PostgreSQL + Thymeleaf + React 18 + TypeScript + Docker Compose**. Every file needs rewriting to match the actual tech stack.

Additionally, the security review found **CRITICAL** vulnerabilities: hardcoded production SSH credentials in plaintext and overly broad command wildcards.

---

## 0. SECURITY MITIGATIONS (Priority 1 — do first)

### 0a. Remove hardcoded credentials from `settings.local.json`

**Problem**: Lines 48-62 contain 15 `sshpass` entries with the plaintext password `OWDHcQuLc@5C`, username `gmarmin`, server IP `72.167.52.14`, and production DB superuser `postgres`.

**Mitigation**: Replace `sshpass` password-based auth with SSH key-based auth. This eliminates the password from all config files while keeping prod access functional.

**Steps**:
1. Set up SSH key auth (one-time, on the developer's machine):
   ```bash
   # Generate key if not already existing
   ssh-keygen -t ed25519 -C "gmarm-deploy" -f ~/.ssh/gmarm_prod

   # Copy public key to prod server (will ask for password one last time)
   ssh-copy-id -i ~/.ssh/gmarm_prod.pub gmarmin@72.167.52.14

   # Add SSH config entry for convenience
   cat >> ~/.ssh/config << 'EOF'
   Host gmarm-prod
     HostName 72.167.52.14
     User gmarmin
     IdentityFile ~/.ssh/gmarm_prod
     StrictHostKeyChecking accept-new
   EOF

   # Test key-based connection (no password needed)
   ssh gmarm-prod "echo 'SSH key auth works'"
   ```

2. Remove ALL `sshpass` entries from `settings.local.json` (lines 48-63, including the wildcard)
3. Replace with scoped SSH permission using the config alias:
   ```json
   "Bash(ssh gmarm-prod:*)"
   ```
4. After confirming key auth works, **rotate the SSH password** on the prod server:
   ```bash
   ssh gmarm-prod "sudo passwd gmarmin"
   ```
5. Optionally disable password auth on the server entirely:
   ```bash
   ssh gmarm-prod "sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && sudo systemctl restart sshd"
   ```

### 0b. Scope down overly broad wildcards

**Problem**: `docker exec:*`, `docker run:*`, `ssh:*`, `curl:*` allow arbitrary execution.

**Mitigation**: Scope to GMARM-specific containers and hosts.

| Current (broad) | Replacement (scoped) | Why |
|---|---|---|
| `Bash(ssh:*)` | `Bash(ssh gmarm-prod:*)` | Only allow SSH to prod via config alias |
| `Bash(docker exec:*)` | `Bash(docker exec gmarm-backend-local:*)`, `Bash(docker exec gmarm-db:*)` | Only local dev containers |
| `Bash(docker run:*)` | **Remove entirely** | Not needed — we use docker-compose |
| `Bash(curl:*)` | Keep as-is | Needed for health checks and API testing; low risk locally |

### 0c. Ensure `.claude/settings.local.json` is in `.gitignore`

Check if `.claude/settings.local.json` is already in `.gitignore`. If not, add it to prevent accidental commits of any remaining sensitive config.

---

## 1. `settings.local.json` — Final clean version (after security mitigations)

**Changes applied**:
- All `sshpass` entries removed (security fix 0a)
- Broken `for` loop artifact entries removed (lines 20-22, 37-38, 41-42)
- `docker run:*` removed (security fix 0b)
- `docker exec:*` and `ssh:*` scoped down (security fix 0b)
- Added `mvn clean install:*`

**Final `settings.local.json`**:
```json
{
  "permissions": {
    "allow": [
      "Bash(git add:*)",
      "Bash(git remote set-url:*)",
      "Bash(git push:*)",
      "Bash(git commit:*)",
      "Bash(git status:*)",
      "Bash(git rm:*)",
      "Bash(docker-compose:*)",
      "Bash(docker compose:*)",
      "Bash(docker ps:*)",
      "Bash(docker logs:*)",
      "Bash(docker build:*)",
      "Bash(docker exec gmarm-backend-local:*)",
      "Bash(docker exec gmarm-db:*)",
      "Bash(docker exec gmarm-postgres-prod:*)",
      "Bash(npm run build:*)",
      "Bash(npx tsc:*)",
      "Bash(npx vite:*)",
      "Bash(npm install:*)",
      "Bash(./mvnw clean install:*)",
      "Bash(mvn clean compile:*)",
      "Bash(mvn clean install:*)",
      "Bash(chmod:*)",
      "Bash(ls:*)",
      "Bash(grep:*)",
      "Bash(find:*)",
      "Bash(curl:*)",
      "Bash(wc:*)",
      "Bash(xxd:*)",
      "Bash(gunzip:*)",
      "Bash(ssh gmarm-prod:*)",
      "Bash(gh run list:*)",
      "Bash(gh run view:*)",
      "Bash(gh run watch:*)",
      "Bash(gh auth status:*)",
      "Bash(gh pr:*)",
      "Bash(claude mcp add:*)",
      "Bash(claude mcp list:*)",
      "mcp__postgres-prod__get_top_queries",
      "mcp__postgres-prod__analyze_db_health",
      "mcp__postgres-prod__execute_sql",
      "mcp__postgres-prod__list_schemas",
      "mcp__postgres-prod__list_objects"
    ],
    "additionalDirectories": [
      "/tmp"
    ]
  }
}
```

**Production access still works** via `ssh gmarm-prod "docker logs backend"` etc., but no passwords are stored anywhere in the repo.

---

## 2. `hooks/hooks.json` — Adapt to GMARM stack

### PreToolUse hooks:
1. **Keep**: tmux reminder (useful for any long npm command)
2. **Remove**: Jest debugging tips (no Jest in this project)
3. **Keep**: git push delay (still useful)
4. **Update**: Migration file safety — change regex from `migrations?/.*\\.ts$` to `migrations?/.*\\.sql$` (Flyway uses `.sql`), update message to mention Flyway instead of Aurora reversible down methods

### PostToolUse hooks:
1. **Keep**: PR URL logger (generic, works for any project)
2. **Keep**: Prettier auto-format for `.ts/.tsx/.js/.jsx` (frontend still uses TypeScript)
3. **Keep**: TypeScript check after editing `.ts/.tsx` (frontend still uses TypeScript)
4. **Update**: `console.*` warning — change message from "Use NestJS Logger for DataDog APM correlation" to "Considerar usar logger apropiado en lugar de console.*"
5. **Add new**: Java/Thymeleaf change reminder — when editing `.java` or `.html` files in `templates/`, remind to restart Docker

### Stop hook:
1. **Update**: `console.*` audit — change message from "Replace with NestJS Logger" to "Verificar console.* antes de commit"

---

## 3. `agents/` — Rewrite for GMARM stack

### 3a. `backend-architect.md` — Full rewrite
- **From**: NestJS v11 + Sequelize + DDD + BullMQ + EventEmitter2
- **To**: Spring Boot 3.4.5 + JPA/Hibernate + Repository-Service-Controller + SRP pattern
- Review checklist: Entity design (JPA annotations), Service layer (SRP split: *Service, *QueryService), Controller patterns (REST), DTO/Mapper patterns, Thymeleaf template structure, document generation architecture

### 3b. `backend-developer.md` — Full rewrite
- **From**: NestJS module/entity/repository/service/controller (TypeScript)
- **To**: Spring Boot entity/DTO/mapper/repository/service/controller (Java 17)
- Include patterns: JPA entity with `@Entity`/`@Column`/`@ManyToOne`, Lombok DTOs with `@Data`/`@Builder`, MapStruct-style mappers, `@Service`/`@Transactional`, `@RestController`/`@RequestMapping`
- Include GMARM-specific: document generation with Thymeleaf + OpenPDF, ISSPOL vs ISSFA distinction

### 3c. `code-reviewer.md` — Update references
- Change from NestJS/Sequelize context to Spring Boot/JPA
- Update file-to-agent mapping: `*Controller.java` → security + architect, `*Service.java` → architect + performance + refactoring, `*.java` entity → architect + type-safety, `*.tsx` → refactoring + typescript-pro
- Remove "no Sequelize transactions" exclusion
- Remove SNAPI module documentation check

### 3d. `code-simplifier.md` — Minor update
- Keep general simplification principles
- Update context from NestJS to Spring Boot + React

### 3e. `performance-reviewer.md` — Full rewrite
- **From**: Sequelize N+1, BullMQ, Redis caching, Graphile Worker
- **To**: JPA/Hibernate N+1 (LAZY vs EAGER, `@EntityGraph`, `JOIN FETCH`), connection pooling (HikariCP), query optimization, PDF generation performance

### 3f. `refactoring-specialist.md` — Partial rewrite
- **From**: NestJS/TypeScript patterns, Sequelize, path aliases `~/*`
- **To**: Java patterns (SRP service split, Lombok usage, proper exception hierarchy), React/TypeScript patterns (hooks, component structure)

### 3g. `security-reviewer.md` — Full rewrite
- **From**: JWT/Passport, FBAC, NestJS throttler, AWS Secrets Manager
- **To**: Spring Security, role-based auth (VENDEDOR, JEFE_VENTAS, FINANZAS, ADMIN), CORS config, SQL injection prevention (JPA parameterized queries), file upload security (documents)

### 3h. `test-writer-fixer.md` — Full rewrite
- **From**: Jest + Supertest, NestJS testing, `*.api-spec.ts`
- **To**: JUnit 5 + Spring Boot Test + MockMvc, `@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest`. Frontend: Vitest (if applicable)

### 3i. `typescript-pro.md` — Partial update
- Keep TypeScript strict mode guidance (frontend still TS)
- Remove Sequelize entity typing, `declare` keyword patterns, path aliases `~/*`
- Add React-specific patterns: proper typing for hooks, API response types, component props

---

## 4. `commands/` — Adapt workflow

### 4a. `commit.md` — Update pre-commit checks
- Change `pnpm lint` + `pnpm build` to:
  ```bash
  cd backend && mvn clean install -DskipTests
  cd frontend && npx tsc --noEmit && npm run build
  ```
- Remove Convex references
- Keep emoji conventional commit format (good practice)

### 4b. `code-review.md` — Update file patterns
- Change file-to-agent mapping from `*.controller.ts`, `*.entity.ts`, `*.spec.ts` to `*Controller.java`, `*Service.java`, `*Repository.java`, `*.tsx`, `*.ts`
- Remove SNAPI module documentation check
- Remove `*.api-spec.ts`, `*.contract-spec.ts` references
- Update context from NestJS to Spring Boot + React

### 4c. `create-pr.md` — Significant rewrite
- Remove JIRA `SNP-XXXXX` ticket pattern (GMARM doesn't use JIRA tickets in branch names)
- Remove `secondnature.atlassian.net` links
- Simplify PR template to GMARM workflow: Summary + Changes + Test plan
- Keep Giphy GIF integration (fun)
- Keep `gh` CLI workflow

### 4d. `fix-issues.md` — Minor update
- Change `npm run typecheck` to `npx tsc --noEmit` (frontend) and `mvn clean compile` (backend)
- Keep the rest (plan file format, issue tracking, safety guidelines)

### 4e. `fix-plan.md` — Minor update
- Change code examples from TypeScript to Java where applicable
- Keep the plan file structure (very generic and useful)

### 4f. `brutal.md` — Keep as-is
- Completely generic evaluation framework

### 4g. `README.md` — Update workflow description
- Reflect GMARM-specific commands and workflow

---

## 5. `skills/` — Rewrite for GMARM patterns

### 5a. `backend-patterns/SKILL.md` — **Full rewrite** (~1300 lines → ~600 lines)
- **From**: NestJS module structure, Sequelize entities, BullMQ, Redis locks, DataDog logging
- **To**: Spring Boot patterns for GMARM:
  - Entity (JPA with `@Entity`, `@Column`, `@ManyToOne`, Lombok)
  - DTO (Lombok `@Data`, `@Builder`)
  - Mapper (manual mapping with builder pattern)
  - Repository (Spring Data JPA `extends JpaRepository`)
  - Service (SRP: `*Service` for writes, `*QueryService` for reads)
  - Controller (`@RestController`, `@RequestMapping`)
  - Document generation (Thymeleaf + OpenPDF pipeline)
  - Flyway migrations
  - Docker Compose workflow
  - `configuracion_sistema` for business values (no hardcoding)

### 5b. `backend-patterns/REDIS-LOCK-SUMMARY.md` — **Delete**
- Not applicable (no Redis in GMARM)

### 5c. `brutal/SKILL.md` — Keep as-is
### 5d. `humanizer/SKILL.md` — Keep as-is

### 5e. `implement/SKILL.md` — Partial rewrite
- Change Sequelize/Redis/BullMQ/NestJS references to Spring Boot/JPA patterns
- Keep the phase-by-phase execution structure

### 5f. `plan/SKILL.md` — Minor update
- Update example file references from `*.controller.ts` to `*Controller.java`, `*.tsx`

### 5g. `prd-generator/SKILL.md` — Keep as-is (generic enough)
### 5h. `prd-generator/references/prd-template.md` — Update code examples
- Change TypeScript/Sequelize entity examples to Java/JPA examples

### 5i. `research/SKILL.md` — Minor update
- Change `*.spec.ts` references to `*Test.java`, `*.tsx`
- Remove Redis lock pattern references

### 5j. `run-book/SKILL.md` — **Full rewrite**
- **From**: AWS ECS Fargate, RDS, BullMQ, Redis, Graphile Worker, DataDog, Sentry
- **To**: Docker Compose (local/dev/prod), PostgreSQL, Flyway migrations, Spring Boot actuator health checks, SSH deploy workflow to `72.167.52.14`

### 5k. `testing/SKILL.md` — **Full rewrite**
- **From**: Jest + Supertest + NestJS testing, real PG on port 5435
- **To**: JUnit 5 + Spring Boot Test + MockMvc + Testcontainers (if applicable), frontend Vitest/React Testing Library

### 5l. `testing/references/bullmq-queues.md` — **Delete**
### 5m. `testing/references/redis-locks.md` — **Delete**

---

## Execution Order

0. **Security mitigations** (SSH key setup + credential removal + scope permissions)
1. `settings.local.json` (apply clean version with scoped permissions)
2. `.gitignore` (ensure `settings.local.json` won't be committed)
3. `hooks/hooks.json` (adapt to GMARM)
4. `agents/` (9 files, most need full rewrite)
5. `commands/` (6 files, most need partial updates)
6. `skills/` (9+ files, mix of rewrites and deletions)

---

## Verification

After all changes:
```bash
# Verify JSON files are valid
cat .claude/settings.local.json | python3 -m json.tool
cat .claude/hooks/hooks.json | python3 -m json.tool

# Verify all markdown files exist and are non-empty
find .claude -name "*.md" -exec wc -l {} \;

# Verify deleted files are actually gone
ls .claude/skills/backend-patterns/REDIS-LOCK-SUMMARY.md  # should not exist
ls .claude/skills/testing/references/bullmq-queues.md      # should not exist
ls .claude/skills/testing/references/redis-locks.md        # should not exist
```

**Manual verification**: Run `/code-review` or `/commit` after changes to confirm commands work with updated instructions.

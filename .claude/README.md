# .claude/ - Claude Code Configuration for GMARM

This directory configures **Claude Code** (Anthropic's CLI) for the GMARM project. It provides agents, commands, skills, and hooks tailored to the Spring Boot + React stack.

## Quick Start

1. Install [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
2. Open a terminal in the project root (`gmarm/`)
3. Run `claude` to start a session — it will automatically pick up this configuration

## Directory Structure

```
.claude/
├── agents/              # 9 specialist review agents
│   ├── backend-architect.md
│   ├── backend-developer.md
│   ├── code-reviewer.md
│   ├── code-simplifier.md
│   ├── performance-reviewer.md
│   ├── refactoring-specialist.md
│   ├── security-reviewer.md
│   ├── test-writer-fixer.md
│   └── typescript-pro.md
│
├── commands/            # Slash commands (invoke with /<name>)
│   ├── commit.md        # /commit — staged commit with checks
│   ├── code-review.md   # /code-review — multi-agent review
│   ├── create-pr.md     # /create-pr — PR with template
│   ├── fix-issues.md    # /fix-issues — fix build errors
│   ├── fix-plan.md      # /fix-plan — fix failed plan phase
│   └── brutal.md        # /brutal — aggressive refactoring
│
├── skills/              # Domain knowledge & workflows
│   ├── backend-patterns/ # Spring Boot + JPA patterns
│   ├── testing/          # JUnit 5 + MockMvc + Mockito
│   ├── run-book/         # Docker + PostgreSQL operations
│   ├── implement/        # Phase-by-phase plan execution
│   ├── plan/             # Implementation planning
│   ├── research/         # Codebase investigation
│   ├── prd-generator/    # PRD for epic-scale work
│   ├── brutal/           # Aggressive code improvement
│   └── humanizer/        # Natural language output
│
├── hooks/
│   └── hooks.json       # Pre/post tool-use automation
│
├── plans/               # Generated implementation plans
│   └── *.md
│
├── settings.local.json  # Local permissions (git-ignored)
└── README.md            # This file
```

## Typical Workflow

```
/research  →  Investigate codebase, produce research.md
/plan      →  Design phases from research, produce plan.md
/implement →  Execute plan phase by phase with verification
/commit    →  Stage, check build, commit with convention
/create-pr →  Push branch, create PR with template
```

## Commands

| Command | What it does |
|---------|-------------|
| `/commit` | Checks `mvn compile` + `npx tsc --noEmit`, then commits |
| `/code-review` | Routes changed files to specialist agents for review |
| `/create-pr` | Creates PR with summary, test plan, and checklist |
| `/fix-issues` | Reads build errors, fixes them, re-verifies |
| `/fix-plan` | Diagnoses and fixes a failed implementation phase |
| `/brutal` | Aggressive refactoring and simplification |

## Agents

Specialist reviewers invoked by `/code-review`:

| Agent | Focus |
|-------|-------|
| `backend-architect` | SRP, JPA, service layer design |
| `backend-developer` | Implementation correctness, patterns |
| `code-reviewer` | General quality, readability |
| `code-simplifier` | Remove unnecessary complexity |
| `performance-reviewer` | N+1 queries, lazy loading, indexes |
| `refactoring-specialist` | Structural improvements |
| `security-reviewer` | SQL injection, auth, OWASP |
| `test-writer-fixer` | JUnit 5, MockMvc, test coverage |
| `typescript-pro` | React, TypeScript, hooks |

## Skills

| Skill | Triggers |
|-------|----------|
| `research` | "investigate", "how does X work", "look into" |
| `plan` | "plan this", "what's the approach", "break this down" |
| `implement` | "build this", "start coding", "implement phase N" |
| `backend-patterns` | Java/Spring Boot/JPA coding patterns reference |
| `testing` | JUnit 5, @WebMvcTest, Mockito patterns reference |
| `run-book` | Docker restart, DB issues, deployment procedures |
| `prd-generator` | Epic-scale work (3+ complexity indicators) |

## Hooks

Automated checks that run before/after tool use:

| Hook | Trigger | Action |
|------|---------|--------|
| **Flyway guard** | Writing `migration*.sql` | Warns about FK constraints, reminds to update SQL maestro |
| **Java reminder** | Editing `.java` files | Reminds to restart Docker |
| **Push delay** | `git push` | 5-second pause to review (skip with `SKIP_PUSH_DELAY=1`) |
| **Prettier** | Editing `.ts`/`.tsx`/`.js`/`.jsx` | Auto-formats with Prettier |
| **TS check** | Editing `.ts`/`.tsx` | Runs incremental `tsc --noEmit` |
| **Console audit** | Editing frontend files | Warns about `console.*` usage |
| **Stop audit** | Session end | Checks modified files for leftover `console.*` |

## Settings (settings.local.json)

Pre-approved tool permissions for common operations. This file is **git-ignored** — each developer maintains their own.

Key permissions:
- Git operations (`add`, `commit`, `push`, `status`)
- Docker commands (`compose`, `ps`, `logs`, `exec`)
- Build tools (`mvn`, `npm`, `npx tsc`)
- GitHub CLI (`gh pr`, `gh run`)
- SSH to production (`ssh gmarm-prod`)
- PostgreSQL MCP tools (read-only queries, health checks)

## Production Access

SSH to production uses key-based authentication:

```bash
# Requires ~/.ssh/config entry:
# Host gmarm-prod
#     HostName 72.167.52.14
#     User gmarmin
#     IdentityFile ~/.ssh/gmarm_prod

ssh gmarm-prod
```

## Tech Stack Reference

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.4.5, Java 17, JPA/Hibernate |
| Database | PostgreSQL |
| PDF Generation | Thymeleaf + OpenPDF |
| Migrations | Flyway (+ SQL maestro as source of truth) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | React Query (TanStack Query) |
| HTTP Client | Axios |
| Deployment | Docker Compose |
| CI/CD | GitHub Actions |

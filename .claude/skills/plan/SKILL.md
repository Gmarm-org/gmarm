---
name: plan
description: MUST BE USED when creating an implementation plan from research findings. Use PROACTIVELY when someone says "plan this", "how should we build", "break this down", "what's the approach", "design the solution", "what are the steps", or asks for implementation steps after research is done. Evaluates scope first — normal tasks get a phased plan.md (max 5 phases), but epic-scale work (3+ complexity indicators) routes to the prd-generator skill for a full PRD.
---

# Plan Skill

## What This Skill Does

Takes research findings and produces either a lightweight phased implementation plan (`plan.md`) or routes to the `prd-generator` skill for a full PRD — depending on the scope of the work. Includes a mandatory scope assessment before any planning begins.

## When to Use

- After `/research` has produced a `research.md`
- Engineer wants to plan work, design an approach, or break work into steps
- Someone says "plan this", "how should we build this", "what's the approach"
- Converting research findings into actionable implementation steps

## Workflow

### 1. Load Context

1. Read `CLAUDE.md` for project conventions, patterns, and constraints.
2. Read the research document (default: `research.md` in the project root).
   - If the file doesn't exist, STOP: "No research document found. Run `/research` first."

### 2. Check for Blockers

Read the **Open Questions** section of the research document.

- If ANY open questions exist, print them and STOP:

  ```
  Cannot plan — the following questions need answers first:
  1. <question from research>
  2. <question from research>

  Resolve these in research.md, then run /plan again.
  ```

- If "None — ready for planning", continue.

### 3. Evaluate Scope

Count how many of the following are true:

1. **Multiple domains** — the work spans more than one domain area (e.g., clients AND payments AND documents)
2. **6+ distinct changes** — you'd need 6 or more phases to implement this safely
3. **Cross-system dependencies** — the work requires changes to both backend AND frontend with meaningful complexity in each
4. **New domain models** — the work introduces new database tables or entities
5. **Multiple API endpoints** — the work requires 3+ new or significantly modified endpoints
6. **Document generation changes** — the work affects Thymeleaf templates or PDF generators

#### If 3 or more are true → EPIC → Route to PRD

Invoke the `prd-generator` skill.

#### If 2 or fewer are true → TASK → Produce plan.md

Continue to step 4.

### 4. Design the Approach (task path)

Based on the research findings:

1. **Choose the approach** that best fits the existing patterns (SRP services, JPA entities, manual mappers)
2. **Identify the minimal set of changes** needed
3. **Order the work** so each phase builds on verified work from the prior phase
4. **Design test strategy** for each phase

### 5. Write plan.md (task path)

Create `plan.md` in the project root:

````markdown
# Plan: <title>

**Research:** <path to research doc>
**Date:** <today>
**Scope:** Task (<N>/6 complexity indicators)
**Estimated Phases:** <count>

## Summary

<2-3 sentences: what we're building and the high-level approach.>

## Phase 1: <descriptive name>

**Goal:** <one sentence — what is true when this phase is done?>

### File Changes

| File | Action | What Changes |
| --- | --- | --- |
| `backend/.../model/Entity.java` | Modify | <specific change> |
| `backend/.../service/NewService.java` | Create | <purpose> |
| `frontend/src/pages/.../Component.tsx` | Modify | <specific change> |

### Implementation Notes

<Specific guidance: which function to modify, what pattern to follow. Reference existing files as examples: "Follow the pattern in `ClienteService.java:crear()` for the transaction handling." Be precise.>

### Tests to Write

| Test File | Test Case | Asserts |
| --- | --- | --- |
| `backend/.../ClienteServiceTest.java` | <test name> | <what it proves> |

### Verification

```bash
cd backend && mvn clean compile -DskipTests
cd frontend && npx tsc --noEmit
```
````

**Expected result:** Both compile without errors.

---

(Repeat for each phase. Maximum 5 phases.)

---

## Final Verification

```bash
cd backend && mvn clean install -DskipTests
cd frontend && npm run build
docker-compose -f docker-compose.local.yml restart backend_local
```

## Rollback Plan

<How to undo all changes safely.>

## Out of Scope

<Anything worth doing but NOT part of this plan.>

## Key Rules

- Do NOT write any code. The plan is a specification, not an implementation.
- Every phase MUST have a Verification section with a runnable command.
- Each phase must be completable in a single Claude Code session.
- Be precise about file paths, function names, and what changes.
- Implementation Notes should reference specific existing files as examples.
- **Maximum 5 phases for task-scoped work.**
- Always include Docker restart reminder in final verification.

## Definition of Done

A plan is complete when:

- Scope assessment has been printed (TASK or EPIC)
- For TASK: `plan.md` has <= 5 phases with File Changes, Implementation Notes, Tests, and Verification
- For EPIC: prd-generator skill has been invoked
- Every phase has precise file paths and function references
- Rollback Plan and Out of Scope sections are filled in
- The engineer is told the next step: `/implement` (task) or "needs review" (epic)

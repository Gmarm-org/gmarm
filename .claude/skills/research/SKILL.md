---
name: research
description: MUST BE USED when investigating a codebase to understand a problem before planning or coding. Use PROACTIVELY when someone mentions a bug, a feature to scope, a ticket to investigate, or needs to understand how something works. Also trigger when users say things like "look into", "investigate", "understand how", "figure out", "trace this", "what does this do", "how does X work", or "I need to understand this before we start". Produces a structured research.md with affected code, data flow, constraints, patterns, test coverage, and open questions.
---

# Research Skill

## What This Skill Does

Investigates a codebase to thoroughly understand a problem space before any solution is designed or code is written. Uses Explore subagents to keep parent context clean and produces a structured `research.md` that feeds directly into the `/plan` command.

## When to Use

- Engineer is starting new work on a feature
- Someone needs to understand how an area of the codebase works
- Investigating a bug or unexpected behavior
- Scoping the impact of a proposed change
- Someone says "look into", "investigate", "trace", "how does X work"

## Workflow

### 1. Read Project Context

Read `CLAUDE.md` in the project root. Note conventions, tech stack, patterns, and constraints relevant to the problem.

### 2. Explore with Subagents

Spawn Explore subagents for each task below. Each subagent returns ONLY a concise summary — never dump full file contents into the parent context.

**Subagent 1 — Find affected files:**

- Use Glob and Grep to locate all files related to the problem
- Search for relevant class names, method names, endpoint paths, table names
- Search for related services, repositories, mappers, and controllers
- Return: list of file paths with a one-line description of each file's role

**Subagent 2 — Trace data flow:**

- Starting from the entry point (REST endpoint, React component), trace how data moves through the system
- Identify: Controller -> Service -> Repository -> Database table chain
- Identify document generation pipeline if applicable
- Return: ordered list of the data flow with file paths at each step

**Subagent 3 — Map test coverage:**

- Find existing tests for the affected area (`*Test.java`, `*.test.ts`, `*.test.tsx`)
- Note the testing framework, test file locations, and naming conventions
- Identify what is and isn't covered
- Return: list of test files, what they test, and gaps in coverage

**Subagent 4 — Check for constraints:**

- Look for database schema (SQL maestro, Flyway migrations), Docker configs
- Check for backward compatibility concerns (API contracts, frontend types)
- Check for ISSPOL/ISSFA template implications
- Check for any related TODO comments or known issues
- Return: list of constraints and dependencies

### 3. Synthesize Findings

Combine subagent results into a single research document. Resolve contradictions. Remove anything irrelevant.

### 4. Identify Open Questions

Flag anything ambiguous, any place where two approaches seem viable, or any constraint that needs a human decision. These MUST be resolved before planning begins.

### 5. Write research.md

Create `research.md` in the project root:

```markdown
# Research: <title>

**Problem:** <original request>
**Date:** <today>

## Problem Statement

<2-3 sentences: what needs to happen and why it matters>

## Affected Code

| File | Role | Key Functions |
| --- | --- | --- |
| `backend/.../ClienteService.java` | <role> | `crear()`, `actualizarEstado()` |
| `frontend/src/pages/.../Component.tsx` | <role> | `handleSubmit()` |

## Data Flow

1. <Entry point> (`backend/.../ClienteController.java:45`)
2. -> <Service call> (`backend/.../ClienteService.java:120`)
3. -> <Repository call> (`backend/.../ClienteRepository.java:30`)
4. -> <Database table> (`cliente`)
5. -> <Response DTO> (`backend/.../ClienteDTO.java`)

## Current Behavior

<Describe exactly how the system works today. Be specific — reference function names, file paths, and line numbers.>

## Constraints

- **Database:** <schema constraints, SQL maestro, Flyway migrations>
- **Templates:** <ISSPOL vs ISSFA implications, Thymeleaf variables>
- **Config:** <Docker Compose, application.properties>
- **Backward Compatibility:** <what can't break>

## Existing Patterns

<What conventions does the surrounding code follow? SRP service split, mapper pattern, DTO structure, controller pattern. The implementation MUST match these.>

## Test Coverage

- **Covered:** <what's tested and where>
- **Gaps:** <what's not tested that should be>
- **Test patterns:** <JUnit 5, @WebMvcTest, MockMvc, Mockito>

## Open Questions

1. <Specific question that needs a human answer>
2. <Another question>

(If no open questions, write "None — ready for planning.")
```

## Key Rules

- Do NOT propose solutions, architectures, or approaches. Research only.
- Do NOT write or modify any source code.
- Every claim must reference a specific file path and function/line where possible.
- If you're unsure about something, put it in Open Questions — do not guess.
- Keep the document under 300 lines.
- A wrong finding here cascades into wrong code. Accuracy over speed.

## Definition of Done

Research is complete when:

- All 4 subagent tasks have returned summaries
- Affected Code table has specific file paths and function names
- Data Flow traces the full path from entry point to database
- Constraints section covers database, templates, config, and backward compatibility
- Existing Patterns section identifies the conventions to follow
- Test Coverage identifies both what's tested and what's missing
- Open Questions are captured or marked "None — ready for planning"
- The engineer is told: "Research complete. Review `research.md` and resolve any Open Questions, then run `/plan` to continue."

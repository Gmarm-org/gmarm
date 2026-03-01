# Code Review Command

Perform a comprehensive code review of the current branch against `main` using specialist agents in parallel. Agents are selected dynamically based on which file types changed to minimize token usage.

## Arguments

$ARGUMENTS

## Argument Parsing

Arguments are passed via `$ARGUMENTS`. Parse as follows:

| Argument Type | Format        | Example      |
| ------------- | ------------- | ------------ |
| Flags         | `--flag-name` | `--no-tests` |

**Supported Flags:**

- `--no-tests` - Skip test file review and exclude test-writer-fixer agent

**Error Handling:**

- If argument looks like a flag but is unrecognized (e.g., `--notests`), warn: "Unknown flag '[flag]'. Did you mean '--no-tests'?"
- Unrecognized arguments should be ignored with a warning

## Instructions

### Step 1: Parse Arguments

Check if `--no-tests` is present in the arguments. If so, skip test file review.

### Step 2: Verify Prerequisites

```bash
# Check if gh CLI is installed (required for faster GitHub operations)
gh --version
```

If `gh` is not installed, inform the user:

> "GitHub CLI (`gh`) is not installed. For faster code reviews using GitHub's API, install it via:
>
> - macOS: `brew install gh`
> - Other: https://cli.github.com/
>
> Falling back to git commands."

### Error Handling for Git/GH Operations

When git or gh commands fail:

1. **No changes to review**: If `git diff` returns empty, inform the user: "No changes detected between this branch and main. Nothing to review."
2. **Not on a feature branch**: If on main, warn: "Currently on main branch. Checkout a feature branch to review."
3. **gh CLI failures**: If `gh` commands fail (auth issues, no PR), fall back to git commands silently
4. **Git failures**: If git commands fail, report: "Git operation failed: [error]. Ensure you're in a valid git repository."

### Step 3: Get the Branch Diff

```bash
# Get the diff (prefer gh for speed if PR exists)
gh pr diff --name-only 2>/dev/null || git fetch && git diff origin/main...HEAD --name-only
```

Identify all changed files. If `--no-tests` flag is present, filter out:

- `*Test.java`
- `*Tests.java`
- `*.test.ts`
- `*.test.tsx`

### Step 3.5: Determine Review Strategy

**Small PR Threshold**: For PRs with fewer than **5 files** AND **< 200 lines changed**:

- Skip dynamic agent selection (Step 4)
- Run ALL agents directly (the overhead of selection exceeds token savings)
- Proceed to Step 5

**Large PR**: For PRs with >= 5 files OR >= 200 lines:

- Use dynamic agent selection (Step 4) to optimize token usage

```bash
# Count changed files and lines
gh pr diff --stat 2>/dev/null || git diff origin/main...HEAD --stat
```

### Step 4: Determine Which Agents to Run (Large PRs Only)

Based on the changed file types, select only the relevant agents.

**File-to-Agent Mapping:**

| File Pattern | Agents |
| --- | --- |
| `*Controller.java` | security-reviewer, backend-architect |
| `*Service.java`, `*QueryService.java` | backend-architect, performance-reviewer, refactoring-specialist |
| `*Repository.java` | performance-reviewer, backend-architect |
| `*.java` (model/entity) | backend-architect, performance-reviewer |
| `*DTO.java`, `*CreateDTO.java` | backend-architect, security-reviewer |
| `*Mapper.java` | refactoring-specialist |
| `*PDFGenerator.java`, `*PDFUtils.java` | backend-architect, performance-reviewer |
| `*.html` (Thymeleaf templates) | security-reviewer |
| `*.tsx`, `*.ts` (React) | refactoring-specialist, typescript-pro |
| `*.properties`, `*.yml` | security-reviewer, backend-architect |
| `*.sql` (Flyway migrations) | performance-reviewer, backend-architect |
| `*Test.java`, `*Tests.java` | test-writer-fixer |
| All other files | refactoring-specialist |

**Selection Rules:**

1. Build a set of agents based on which file patterns are present in the diff
2. **Always include `refactoring-specialist`** as a baseline (applies to all code)
3. If `--no-tests` flag is present, exclude `test-writer-fixer`
4. If **only test files changed**, run: `test-writer-fixer` + `refactoring-specialist`

### Step 5: Launch Selected Agents IN PARALLEL

Use the Task tool to launch only the **selected agents** simultaneously (in a single message with multiple Task tool calls).

1. **security-reviewer** (if selected): Review authentication, authorization, input validation, injection risks, sensitive data (cedula, ISSFA/ISSPOL)

2. **backend-architect** (if selected): Review SRP service pattern, controller design, JPA entity design, DTO/mapper layer, document generation architecture

3. **performance-reviewer** (if selected): Review N+1 queries, LAZY/EAGER fetch, @EntityGraph usage, HikariCP, PDF generation, React re-renders

4. **refactoring-specialist** (always): Review code smells, SOLID/DRY/KISS/YAGNI violations, complexity metrics

5. **typescript-pro** (if selected): Review type safety, `any` usage, null handling, DTO validation, React hook typing

6. **test-writer-fixer** (if selected and not `--no-tests`): Review test coverage, test quality, anti-patterns (JUnit 5, @WebMvcTest, MockMvc, Mockito)

Each agent should receive:

- The list of changed files **relevant to that agent**
- The diff content for those files
- Instructions to return findings in their specified output format

### Step 6: Synthesize Into Single Report

After all agents complete, combine their findings into ONE unified report:

```markdown
# Code Review – [branch-name] ([date])

## Executive Summary

Only include rows for agents that were run:

| Area          | Score | Critical | Major | Minor |
| ------------- | ----- | -------- | ----- | ----- |
| Security      | A-F   | #        | #     | #     |
| Architecture  | A-F   | #        | #     | #     |
| Performance   | A-F   | #        | #     | #     |
| Code Quality  | A-F   | #        | #     | #     |
| Type Safety   | A-F   | #        | #     | #     |
| Test Coverage | A-F   | #        | #     | #     |
| **Overall**   | **X** | **#**    | **#** | **#** |

Note: Agents skipped = N/A (not shown in table)

## 🔴 Critical Issues (must fix before merge)

| #   | Area | File:Line | Issue | Fix |
| --- | ---- | --------- | ----- | --- |

## 🟡 Major Issues (should fix before merge)

| #   | Area | File:Line | Issue | Fix |
| --- | ---- | --------- | ----- | --- |

## 🟢 Minor Suggestions

- [Area]: [suggestion]

## Positive Highlights

- [Area]: [what was done well]

## Action Checklist

- [ ] [action item]

---

## Verdict

✅ **APPROVED** - Ready to merge.

OR

🔴 **ISSUES FOUND** - Please address X critical and Y major issues before merging.
```

## Scoring

| Score | Criteria                     |
| ----- | ---------------------------- |
| A     | No issues                    |
| B     | Minor only                   |
| C     | 1-2 major                    |
| D     | Multiple major or 1 critical |
| F     | Multiple critical            |

**Overall** = Lowest individual score

## Verdict Rules

- **APPROVED**: Zero critical AND zero major issues
- **ISSUES FOUND**: Any critical OR any major issues

## Focus Areas

Only flag issues that are **critical** or **major**:

- Security vulnerabilities (SQL injection, missing auth, sensitive data exposure)
- Performance problems (N+1 queries, EAGER fetch on collections, memory leaks)
- Architectural violations (business logic in controllers, missing SRP split)
- Missing tests for new business logic
- Type safety issues causing runtime risk
- SOLID/DRY violations causing maintenance burden
- ISSPOL/ISSFA confusion in document templates

**Skip**: Minor style issues, formatting preferences, or suggestions that don't impact correctness, performance, or security.

## Scope

This is a **developer workflow tool** for local code review before pushing. It complements (does not replace) CI/CD pipelines like GitHub Actions which handle automated testing, linting, and deployment checks.

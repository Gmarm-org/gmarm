# Claude Code Commands

Custom slash commands for code review, remediation, and PR workflows for GMARM.

## Quick Start

```bash
# Run a code review
/code-review

# Create a fix plan from review findings
/fix-plan

# Fix issues from the plan
/fix-issues

# Create a pull request
/create-pr

# Create a commit with conventional format
/commit
```

## Available Commands

### `/commit`

Creates well-formatted commits with conventional commit messages.

**Usage:**
```bash
/commit                # Auto-detect, compile check, commit
/commit --no-verify    # Skip pre-commit checks
```

**What it does:**
1. Runs pre-commit checks (`mvn compile`, `tsc --noEmit`)
2. Analyzes changes and suggests splitting if multiple concerns
3. Creates conventional commit messages

---

### `/code-review`

Performs comprehensive code review using specialist agents in parallel.

**Usage:**
```bash
/code-review              # Review all changes
/code-review --no-tests   # Skip test file review
```

**What it does:**
1. Gets the diff between your branch and `main`
2. Selects relevant agents based on file types changed
3. Launches agents in parallel (security, architecture, performance, code quality, types, tests)
4. Synthesizes findings into a single report with scores and action items

**Agents used:**
| Agent | Reviews |
|-------|---------|
| security-reviewer | Auth, injection, sensitive data (cedula, ISSFA/ISSPOL) |
| backend-architect | SRP pattern, API design, JPA entity design |
| performance-reviewer | N+1 queries, LAZY/EAGER, @EntityGraph, HikariCP |
| refactoring-specialist | Code smells, SOLID/DRY/KISS violations |
| typescript-pro | Type safety, React hooks, DTO consistency |
| test-writer-fixer | Test coverage (JUnit 5, @WebMvcTest, MockMvc) |

---

### `/fix-plan`

Creates a prioritized remediation plan from code review findings.

**Usage:**
```bash
/fix-plan                 # Create plan locally
/fix-plan --post-to-pr    # Create plan and post checklist to PR
```

**What it does:**
1. Gathers findings from the most recent code review
2. Creates a detailed plan file at `.claude/plans/fix-plan-[branch]-[date].md`
3. Orders issues by priority (critical > major) and dependencies
4. Optionally posts a summary checklist to the GitHub PR

---

### `/fix-issues`

Executes fixes from the current fix plan.

**Usage:**
```bash
/fix-issues              # Fix all issues in priority order
/fix-issues #1           # Fix only issue #1
/fix-issues #1 #3        # Fix specific issues
/fix-issues --critical   # Fix only critical issues
/fix-issues --major      # Fix critical and major issues
```

**What it does:**
1. Reads the most recent fix plan
2. Respects dependencies between issues
3. Applies fixes using Edit tool
4. Runs compilation/typecheck to verify
5. Updates plan file with completion status

---

### `/create-pr`

Creates a pull request with auto-generated description.

**Usage:**
```bash
/create-pr                # Auto-detect everything
/create-pr --draft        # Create as draft
/create-pr --title="..."  # Custom title
/create-pr --base=develop # Different base branch
```

---

### `/brutal`

Run a BRUTAL honest evaluation of code, ideas, or content.

**Usage:**
```bash
/brutal <code or file path>
```

---

## Recommended Workflow

```
Make changes
     |
     v
/code-review    <-- Review your changes
     |
     v
/fix-plan       <-- Create remediation plan
     |
     v
/fix-issues     <-- Auto-fix issues
     |
     v
/code-review    <-- Verify fixes
     |
     v
/commit         <-- Commit with conventional format
     |
     v
/create-pr      <-- Create PR
```

## Prerequisites

**Required:** GitHub CLI (`gh`) for PR operations.

```bash
# Install on macOS
brew install gh

# Authenticate
gh auth login
```

## Creating New Commands

To create a new command, add a markdown file to this folder:

```markdown
# Command Name

Description of what this command does.

## Arguments

$ARGUMENTS

## Instructions

### Step 1: ...
```

The filename becomes the command name: `my-command.md` -> `/my-command`

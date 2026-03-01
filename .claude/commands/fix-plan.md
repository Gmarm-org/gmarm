# Fix Plan Command

Create a prioritized remediation plan from the most recent code review findings.

## Arguments

$ARGUMENTS

## Argument Parsing

Arguments are passed via `$ARGUMENTS`. Parse as follows:

| Argument Type | Format | Example |
|---------------|--------|---------|
| Flags | `--flag-name` | `--post-to-pr` |

**Supported Flags:**
- `--post-to-pr` - Post the fix plan summary as a comment on the current PR

**Error Handling:**
- If argument looks like a flag but is unrecognized (e.g., `--postpr`), warn: "Unknown flag '[flag]'. Did you mean '--post-to-pr'?"
- Unrecognized arguments should be ignored with a warning

## Instructions

### Step 0: Parse Arguments

Check if `--post-to-pr` is present in the arguments. If so, the plan will be posted to the PR after creation.

### Step 1: Gather Review Context

If no review context is provided in the arguments, ask the user:
- "Would you like me to run `/code-review` first, or do you have review findings to share?"

If review findings exist from the current conversation, use those.

### Step 2: Verify Prerequisites & Get Branch Information

```bash
gh --version
gh pr view --json headRefName -q '.headRefName' 2>/dev/null || git branch --show-current
```

### Step 3: Create the Plan File

Create a markdown file at: `.claude/plans/fix-plan-[branch-name]-[YYYY-MM-DD].md`

Use this format:

```markdown
# Fix Plan – [branch-name]

**Created**: [date]
**Review Source**: Code review from [date/time]
**Total Issues**: X critical, Y major, Z minor

---

## Execution Order

Issues are ordered by: Priority (critical > major) then dependency (foundational fixes first).

---

## Critical Issues

### Issue #1: [Brief Title]

**File**: `path/to/File.java:line` or `path/to/Component.tsx:line`
**Area**: Security | Architecture | Performance | Code Quality | Type Safety | Tests
**Complexity**: Quick | Moderate | Complex

**Problem**:
[1-2 sentence description of why this is a problem]

**Fix**:
[Specific action to take]

**Code Context**:
```java
// Relevant code snippet showing the problem
```

**Suggested Change**:
```java
// How the code should look after the fix
```

- [ ] Not started

---

## Major Issues

### Issue #N: [Brief Title]
...

---

## Minor Issues (Optional)

### Issue #N: [Brief Title]
...

---

## Dependencies

Some fixes depend on others. Recommended order:

1. **#1** → (no dependencies)
2. **#3** → depends on **#1**
3. **#2** → (no dependencies, can be done in parallel with #3)

---

## Progress Tracking

| Issue | Status | Completed |
|-------|--------|-----------|
| #1 | Not started | - |
| #2 | Not started | - |
| #3 | Not started | - |

---

## Commands

To fix issues from this plan:
- Fix all: `/fix-issues`
- Fix specific: `/fix-issues #1`
- Fix by priority: `/fix-issues --critical` or `/fix-issues --major`
```

### Step 4: Sync with TodoWrite

After creating the plan file, also add the issues to the TodoWrite tool so progress is tracked in the conversation.

### Step 5: Confirm with User

After creating the plan, output:

```
## Fix Plan Created

Plan file: `.claude/plans/fix-plan-[branch]-[date].md`

### Summary
- X critical issues
- Y major issues
- Z minor issues

### Recommended Next Steps

1. Review the plan file for accuracy
2. Run `/fix-issues` to start fixing (or `/fix-issues #1` for specific issue)
3. Plan will be updated as issues are resolved

Would you like me to start fixing issues now?
```

### Step 6: Post to PR (if `--post-to-pr` flag)

If the `--post-to-pr` flag was provided, post a summary checklist as a PR comment using `gh pr comment`.

## Complexity Guidelines

| Complexity | Criteria |
|------------|----------|
| **Quick** | Single file, < 10 lines changed, no tests needed |
| **Moderate** | 1-3 files, may need test updates, straightforward logic |
| **Complex** | Multiple files, architectural changes, new tests required |

## Dependency Detection

Look for dependencies between issues:
- If fixing issue A requires code that issue B will change, B should come first
- If issues are in the same file, group them
- Security issues often should be fixed first (they may affect other code)

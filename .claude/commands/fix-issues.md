# Fix Issues Command

Execute fixes from the current fix plan. Can fix all issues, specific issues by number, or issues by priority.

## Arguments

$ARGUMENTS

## Argument Parsing

Arguments are passed via `$ARGUMENTS`. Parse as follows:

| Argument Type | Format | Example |
|---------------|--------|---------|
| Issue numbers | `#N` | `#1`, `#3`, `#5` |
| Flags | `--flag-name` | `--critical`, `--major` |

**Supported Flags:**
- `--critical` - Fix only critical issues
- `--major` - Fix critical and major issues
- `--minor` - Fix all including minor issues
- `--stop-on-error` - Stop execution if a fix fails

**Issue Number Format:**
- Must start with `#` followed by a number (e.g., `#1`, `#12`)
- Multiple issue numbers can be specified: `#1 #3 #5`

**Error Handling:**
- If issue number format is wrong (e.g., `1` instead of `#1`), warn: "Invalid issue format '1'. Use '#1' format."
- If flag is unrecognized (e.g., `--crit`), warn: "Unknown flag '[flag]'. Did you mean '--critical'?"

## Usage Examples

```bash
/fix-issues              # Fix all issues in priority order
/fix-issues #1           # Fix only issue #1
/fix-issues #1 #3 #5     # Fix specific issues
/fix-issues --critical   # Fix only critical issues
/fix-issues --major      # Fix critical and major issues
```

## Instructions

### Step 1: Locate the Plan File

Find the most recent plan file:

```bash
ls -t .claude/plans/fix-plan-*.md | head -1
```

If no plan file exists, inform the user:
> "No fix plan found. Run `/fix-plan` first to create a remediation plan from your code review."

### Step 2: Parse Arguments

| Argument | Action |
|----------|--------|
| (none) | Fix all issues in order |
| `#N` | Fix only issue N |
| `#N #M #O` | Fix multiple specific issues |
| `--critical` | Fix only critical issues |
| `--major` | Fix critical and major issues |
| `--minor` | Fix all including minor |

### Step 3: Read the Plan

Parse the plan file to extract:
- Issue numbers
- File paths and line numbers
- Problem descriptions
- Suggested fixes
- Dependencies between issues

### Step 4: Respect Dependencies

Before fixing an issue, check if it depends on another issue that hasn't been fixed yet.

If dependencies exist:
> "Issue #3 depends on #1 which hasn't been fixed yet. Would you like me to fix #1 first?"

### Step 5: Fix Each Issue

For each issue to fix:

1. **Announce**: "Fixing issue #N: [title]"

2. **Update TodoWrite**: Mark the issue as `in_progress`

3. **Read the file**: Load the file mentioned in the issue

4. **Apply the fix**: Use Edit tool to make the changes

5. **Verify**:
   - For Java changes: Run `cd backend && mvn clean compile -DskipTests`
   - For TypeScript changes: Run `cd frontend && npx tsc --noEmit`
   - If tests are affected, run relevant tests

6. **Update the plan file**: Change status from `Not started` to `Complete`

7. **Update TodoWrite**: Mark the issue as `completed`

8. **Report**:
   ```
   Fixed issue #N: [title]
   - File: path/to/file
   - Changes: [brief description]
   ```

### Step 6: Handle Failures

If a fix cannot be applied:

1. **Report the problem**:
   ```
   Could not fix issue #N: [title]
   - Reason: [why it failed]
   - Manual action needed: [what the user should do]
   ```

2. **Update plan file**: Change status to "Needs attention"

3. **Continue to next issue** (unless `--stop-on-error` flag)

### Step 7: Summary Report

After all fixes are attempted:

```markdown
## Fix Issues Summary

### Completed
- #1: [title]
- #3: [title]

### Failed (needs manual attention)
- #2: [title] - [reason]

### Remaining
- #4: [title]
- #5: [title]

### Verification
- Java compilation: passed/failed
- TypeScript types: passed/failed
- Tests: All passing (or X failures)

### Next Steps
- Run `/fix-issues #4 #5` to continue
- Or run `/code-review` to verify all issues are resolved
- Remember to restart Docker after Java changes
```

### Step 8: Update Plan File Progress Table

Update the progress tracking table in the plan file.

## Safety Guidelines

### Pre-Fix Safety Checklist

Before running `/fix-issues`, ensure your working directory is in a recoverable state:

```bash
# Option 1: Create a checkpoint commit
git add -A && git commit -m "checkpoint: before fix-issues"

# Option 2: Stash current changes
git stash push -m "before fix-issues"
```

### During Execution

1. **Never auto-commit**: Fixes are made to working directory only
2. **Preserve behavior**: Fixes should not change intended functionality
3. **Run verification**: Always compile/typecheck after fixes
4. **One at a time**: Fix issues sequentially, verify between each
5. **Respect scope**: Only modify code related to the specific issue

## Complexity Handling

| Complexity | Approach |
|------------|----------|
| **Quick** | Apply fix directly |
| **Moderate** | Apply fix, run tests |
| **Complex** | Ask user for confirmation before applying |

For complex issues:
> "Issue #5 is complex and involves changes to 4 files. Would you like me to:
> 1. Proceed with the fix
> 2. Show you the planned changes first
> 3. Skip for now"

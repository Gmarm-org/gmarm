# Create Pull Request Command

Create a pull request that conforms to the team's PR standards, with automatic PR type inference from commits.

## Arguments

$ARGUMENTS

## Argument Parsing

Arguments are passed via `$ARGUMENTS`. Parse as follows:

| Argument Type | Format        | Example                     |
| ------------- | ------------- | --------------------------- |
| Flags         | `--flag-name` | `--draft`                   |
| Key-Value     | `--key=value` | `--title="My custom title"` |

**Supported Arguments:**

- `--draft` - Create as draft PR
- `--title="..."` - Override the PR title
- `--base=branch` - Target branch (default: `main`)

**Error Handling:**

- Unrecognized flags: Warn and continue

## Instructions

### Step 1: Verify Prerequisites

```bash
# Check gh CLI is installed and authenticated
gh --version
gh auth status
```

If `gh` is not installed or authenticated:

> "GitHub CLI (`gh`) is required. Install via `brew install gh` and run `gh auth login`."

### Step 2: Check Branch

```bash
# Get current branch name
git branch --show-current
```

If on `main`:

> "You're on `main`. Create a feature branch first."

Stop execution.

### Step 3: Check for Existing PR

```bash
# Check if PR already exists for this branch
gh pr view --json url,state 2>/dev/null
```

If PR exists:

- If open: "A PR already exists for this branch: [URL]. Use `gh pr edit` to modify it."
- If closed/merged: Warn but allow creating new PR

### Step 4: Gather Commit Information

```bash
# Get commits unique to this branch (not in main)
git log main..HEAD --oneline

# Get detailed commit messages for analysis
git log main..HEAD --format="%s%n%b---"

# Get diff stats for context
git diff main...HEAD --stat
```

### Step 5: Infer PR Type from Commits

Analyze commit messages to suggest PR type(s). Look for keywords:

| PR Type       | Keywords in Commits                                           |
| ------------- | ------------------------------------------------------------- |
| Feature       | `feat`, `add`, `new`, `implement`, `create`, `agregar`        |
| Bug Fix       | `fix`, `bug`, `issue`, `resolve`, `correct`, `corregir`       |
| Documentation | `doc`, `readme`, `comment`                                    |
| Style         | `style`, `format`, `lint`                                     |
| Refactor      | `refactor`, `restructure`, `reorganize`, `clean`, `simplify`  |
| Performance   | `perf`, `optimize`, `speed`, `cache`, `lazy`, `N+1`           |
| Test          | `test`, `spec`, `coverage`, `mock`                            |
| CI            | `ci`, `pipeline`, `workflow`, `github action`, `deploy`       |
| Chore         | `chore`, `release`, `version`, `bump`, `dependency`, `docker` |
| Database      | `migration`, `sql`, `schema`, `flyway`                        |

### Step 6: Generate PR Title

Format: `<type>: <description>`

**Title generation priority:**

1. If `--title` provided: Use it
2. If single commit: Use commit subject
3. If multiple commits: Summarize

Keep under 72 characters.

### Step 7: Generate PR Description

Use this template:

```markdown
## Summary

[COMMIT_SUMMARY]

## Changes

[LIST_OF_CHANGES]

## Type

[SELECTED_TYPES]

## Testing

- [ ] Backend compiles: `mvn clean compile -DskipTests`
- [ ] Frontend types: `npx tsc --noEmit`
- [ ] Docker restart after Java changes
- [ ] Manual testing completed

## Notes

[Any additional context, ISSPOL/ISSFA implications, migration notes]
```

**For [COMMIT_SUMMARY]:**

- If 1-3 commits: List each commit message as a bullet point
- If 4+ commits: Group by type or provide high-level summary
- Include file change statistics

### Step 8: Confirm with User

Before creating the PR, show:

```
=== Pull Request Preview ===

Title: <title>

Type(s): <types>

Base: main <- [current-branch]

Description preview:
[First 10 lines of description]
...

Ready to create this PR?
```

Use the AskUserQuestion tool:

**Options:**

1. "Create PR" - Proceed with creation
2. "Create as Draft" - Create as draft PR
3. "Edit title" - Let user modify title
4. "Cancel" - Abort

### Step 9: Create the Pull Request

```bash
# Create the PR using gh CLI with HEREDOC for body
gh pr create \
  --title "[TITLE]" \
  --base "[BASE_BRANCH]" \
  [--draft if requested] \
  --body "$(cat <<'EOF'
[FULL_DESCRIPTION]
EOF
)"
```

### Step 10: Report Success

After successful creation:

```
PR created successfully!

[PR_URL]

Title: [TITLE]
Base: [BASE] <- [HEAD]
Status: [Open/Draft]

Next steps:
- Add reviewers: gh pr edit --add-reviewer @username
- View PR: gh pr view --web
- Check status: gh pr checks
```

## Error Handling

| Error                    | Response                                                        |
| ------------------------ | --------------------------------------------------------------- |
| Not on a feature branch  | "You're on `main`. Create a feature branch first."              |
| No commits ahead of main | "No commits to create PR for. Make some changes first."         |
| Branch not pushed        | Auto-push with `git push -u origin [branch]` after confirmation |
| gh auth failure          | "Please authenticate: `gh auth login`"                          |
| PR creation failure      | Show gh error message and suggest fixes                         |

## Examples

```bash
# Basic usage - auto-detect everything
/create-pr

# Create as draft
/create-pr --draft

# Custom title
/create-pr --title="feat: implementar generacion de cotizaciones para policia"

# Different base branch
/create-pr --base=develop
```

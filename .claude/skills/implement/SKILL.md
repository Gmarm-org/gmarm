---
name: implement
description: MUST BE USED when executing an implementation plan phase by phase. Use PROACTIVELY when someone says "build this", "start coding", "implement", "execute the plan", "let's go", "implement phase 1", or references working through phases of a plan.md. Reads the plan, verifies prerequisites, writes code, runs tests after each phase, compacts between phases, and hands off to code-review and security-review skills when done.
---

# Implement Skill

## What This Skill Does

Executes an implementation plan precisely — writing code, running tests, and verifying each phase before proceeding to the next. Manages context through compaction for multi-phase work. Hands off to the `code-review` and `security-review` skills when implementation is complete.

## When to Use

- After `/plan` has produced a `plan.md`
- Engineer says "build this", "start coding", "implement", "execute the plan"
- Someone references working through phases of an existing plan
- Resuming implementation after a break (reads status from plan.md)

## Workflow

### 1. Load Context

1. Read `CLAUDE.md` for project conventions.
2. Read the plan document (default: `plan.md` in the project root).
   - If the file doesn't exist, STOP: "No plan document found. Run `/plan` first."
3. Read the full plan. Identify how many phases there are, which (if any) are already marked complete, and what the final verification looks like.

### 2. Pre-Flight Check

Before writing any code:

1. **Check branch:** Run `git branch --show-current`. If on `main`, STOP:

   ```
   Currently on main. Create a feature branch or switch to a git worktree before implementing.
   ```

2. **Run baseline build:** Run the build to confirm it passes BEFORE you change anything:
   - Backend: `cd backend && mvn clean compile -DskipTests`
   - Frontend: `cd frontend && npx tsc --noEmit`

   If build is already failing, STOP:
   ```
   Baseline build is failing before any changes. Fix existing failures first.
   ```

3. **Check for resumed work:** If any phases in `plan.md` are already marked complete, skip them and resume from the first incomplete phase.

4. **Print summary:**

   ```
   Plan: <title>
   Phases: <total> (<completed> already done)
   Branch: <branch name>
   Baseline build: passing

   Starting Phase <next incomplete>...
   ```

### 3. Execute Phases

For EACH phase in order:

#### 3a. Announce the Phase

```
Phase <N>/<total>: <phase name>
Goal: <goal from plan>
```

#### 3b. Make the Changes

- Follow the File Changes table exactly
- Read the Implementation Notes for patterns to follow
- Reference the specific existing files mentioned as examples
- Match the code style of neighboring files
- If creating entities, follow JPA patterns: use Lombok `@Getter @Setter`, `@EqualsAndHashCode(of = "id")`, `FetchType.LAZY` by default, `@Enumerated(EnumType.STRING)`
- If creating DTOs, use `@Data @Builder @NoArgsConstructor @AllArgsConstructor`
- If creating services, follow SRP: write service with `@Transactional`, read service with `@Transactional(readOnly = true)`
- If creating controllers, use `@RestController`, `@RequiredArgsConstructor`, `ResponseEntity<T>`

#### 3c. Write the Tests

- Create or update the test files from the Tests to Write table
- Controller tests: `@WebMvcTest` with MockMvc
- Service tests: `@ExtendWith(MockitoExtension.class)` with `@Mock`/`@InjectMocks`
- Repository tests: `@DataJpaTest`
- Tests must be runnable independently

#### 3d. Run Verification

- Execute the exact verification command from the plan
- Compare output against the expected result

#### 3e. Report Result

**If tests pass:**

```
Phase <N>: PASSED
   Files changed: <list>
   Tests: <count> passing
```

Continue to the next phase.

**If tests fail:**

1. Read the error output carefully
2. Identify the root cause — check for common issues:
   - Missing `@Transactional` on write methods
   - `LazyInitializationException` — need `@EntityGraph` or `JOIN FETCH`
   - Missing `@MockBean` for service dependencies in controller tests
   - Null pointer on lazy-loaded relation
3. Fix it — but only within the scope of this phase
4. Re-run verification
5. If still failing after 3 attempts, STOP:

   ```
   Phase <N>: STUCK after 3 attempts
   Error: <the error>
   Attempted fixes: <what you tried>

   Engineer: please review and advise.
   ```

#### 3f. Compact (for multi-phase work)

If the plan has more than 3 phases, after each completed phase:

1. Update `plan.md` — add a status line to the completed phase
2. Run `/compact` to compress conversation history
3. Re-read `plan.md` to reload context for the next phase

### 4. Final Verification

After ALL phases are complete:

1. Run: `cd backend && mvn clean install -DskipTests`
2. Run: `cd frontend && npx tsc --noEmit`
3. Check for any untracked files that should be committed (`git status`)
4. Remind user to restart Docker: `docker-compose -f docker-compose.local.yml restart backend_local`
5. Report:

   ```
   Implementation Complete
   Phases completed: <N>/<total>
   Build: passing
   Deviations: <count or "none">

   Next steps:
   1. Restart Docker for Java changes
   2. Invoke the code-review skill
   3. Invoke the security-review skill
   4. Then commit using /commit
   ```

## Key Rules

- Follow the plan precisely. If the plan is wrong, note the issue and ASK before deviating.
- Run verification after EVERY phase. Never batch multiple phases without verification.
- Do NOT refactor code outside the scope of the plan.
- Do NOT add features or improvements not in the plan.
- If you hit a problem that fundamentally changes the approach, STOP.
- Match existing code style.
- If you get stuck, say so. Don't generate speculative fixes.

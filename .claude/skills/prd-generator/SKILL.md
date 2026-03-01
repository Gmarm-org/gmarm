---
name: prd-generator
description: MUST BE USED when creating, drafting, or refining Product Requirements Documents (PRDs). Use PROACTIVELY whenever someone mentions PRDs, product requirements, feature specs, technical approach documents, or task breakdowns for engineering. Also trigger when users say things like "write up requirements for", "I need a spec for", "let's document this feature", "break this into tasks", or "draft a PRD". Produces Jira-compatible markdown following domain-driven design principles with structured task decomposition.
---

# PRD Generator Skill

## What This Skill Does

Produces comprehensive, well-structured Product Requirements Documents that bridge product vision and technical execution. Output is Jira-compatible markdown that product managers can paste directly and engineers can extend with technical approach sections.

## When to Use

- User asks to create, draft, or refine a PRD
- User needs requirements documentation for a feature or project
- User wants a technical approach with task breakdowns
- User needs to convert informal feature ideas into structured specs
- User says anything like "write requirements", "spec this out", "break this into tasks"

## Workflow

### 1. Gather Context

Before writing anything, understand the scope:

- Ask about the initiative's business value and who benefits
- Identify the tech stack (check lockfiles, READMEs, or ask)
- Clarify what sections are needed — PM sections, engineering sections, or both
- Ask about known risks, dependencies, and constraints

Keep questions focused. Don't overwhelm with a huge list — ask the most important 2-3 questions first, then follow up.

### 2. Draft Sections

**For Product Managers:** Overview → Goals → Problem Statement → Requirements → Risks → Assumptions → Out of Scope → Open Questions

**For Engineers:** Architecture → Infrastructure & Monitoring → Technical Approach (with numbered tasks, dependency chains, and acceptance criteria)

**For Both:** Draft all sections, marking any that need input from the other role as `[TODO: needs input from PM/Eng]`.

### 3. Technical Approach (when applicable)

Apply Domain-Driven Design principles:

- Identify bounded contexts and domain models
- Break work into numbered tasks with dependency chains
- Use task prefixes to indicate component/layer (see reference)
- Include data model tables and code structure examples
- Write lettered acceptance criteria (a, b, c) for each task

### 4. Validate and Deliver

- Ensure all sections are complete or marked TODO
- Verify markdown renders correctly for Jira (no checkbox syntax, proper table formatting)
- Check task dependencies are properly mapped
- Summarize which sections need stakeholder review

## Key Rules

These rules exist because PRDs go through team estimation and ticketing workflows — baking in estimates or ticket numbers creates friction and rework.

- **No time/point estimates** — the team estimates later
- **No ticket numbers** — use descriptive task titles; team assigns ticket numbers
- **Testable requirements** — every requirement must be verifiable
- **Task dependencies** — always show what each task depends on
- **Explicit scope boundaries** — every PRD must have an Out of Scope section
- **Data models as tables** — always use `Field | Type | Description` tables, never tree diagrams
- **Nested structure** — use letters (a, b, c) and roman numerals (i, ii, iii) for sub-items within tasks
- **Acceptance criteria** — lettered (a, b, c), never checkboxes
- **DDD alignment** — identify bounded contexts, entities, and aggregates in technical sections

## Task Prefix Convention

Use prefixes to indicate component/layer:

| Prefix        | Meaning                             |
| ------------- | ----------------------------------- |
| [API]         | Backend API endpoint or controller  |
| [UI]          | Frontend component or page          |
| [DB]          | Database migration or schema change |
| [SERVICE]     | Business logic service layer        |
| [INTEGRATION] | Third-party integration             |
| [DOMAIN]      | Domain model or entity              |
| [TESTS]       | Test implementation                 |

Combine prefixes for cross-cutting tasks, e.g. `[API][DOMAIN] New Endpoint for Client Management`

## Output Format

Read the full PRD template from `references/prd-template.md` in this skill's directory. That file contains the exact structure, table formats, code examples, and section ordering to follow.

The template includes:

- Complete section structure with field tables
- Data model table format
- API path table format
- TypeScript DTO and Entity code examples
- Technical approach task format with dependency chains

Always follow that template's structure. Adapt section content to the specific project but preserve the ordering and formatting conventions.

## Definition of Done

A PRD is complete when:

- All sections are filled in or marked `[TODO: needs input from PM/Eng]`
- Markdown renders correctly in Jira preview
- Technical tasks are numbered with clear dependency chains
- Data models use table format (Field | Type | Description)
- Implementation steps use nested letters (a, b, c) and numerals (i, ii)
- Acceptance criteria are lettered (a, b, c)
- No estimates or ticket numbers are present
- Open questions are captured with topic and description

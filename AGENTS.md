# AGENTS.md — Team Hierarchy & Communication Protocols

## The Plan-First Mandate

**No code is written without a plan. No plan is made without research. No change ships without review.**

This is the governing principle of all agent operations in the GreenLine365 repository. Every task follows the same flow:

```
Research → Plan → Implement → Audit → Ship
```

Skipping a step is a protocol violation.

## Team Hierarchy

```
┌─────────────────────────────────────────────────┐
│                  HUMAN OPERATOR                  │
│           Final authority on all decisions        │
└────────────────────┬────────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    ▼                ▼                ▼
┌────────┐    ┌────────────┐    ┌──────────┐
│  SCOUT │───▶│  ARCHITECT │───▶│IMPLEMENTER│
│Research│    │  Planning  │    │Engineering│
└────────┘    └────────────┘    └─────┬─────┘
                                      │
                                      ▼
                                ┌──────────┐
                                │  AUDITOR  │
                                │Compliance │
                                │   & QA    │
                                └──────────┘
```

### Role Summary

| Agent | File | Responsibility | Authority |
|-------|------|----------------|-----------|
| **The Scout** | `.claude/agents/THE_SCOUT.md` | Research, discovery, codebase mapping | Defines what exists; blocks uninformed plans |
| **The Architect** | `.claude/agents/THE_ARCHITECT.md` | System design, API contracts, schema design | Defines how to build; blocks unplanned code |
| **The Implementer** | `.claude/agents/THE_IMPLEMENTER.md` | Code writing, tests, migrations | Builds according to blueprint |
| **The Auditor** | `.claude/agents/THE_AUDITOR.md` | Security review, QA, compliance | Veto power over any change |

### Authority Rules

1. **The Scout** can block The Architect if research is incomplete
2. **The Architect** can block The Implementer if no blueprint exists
3. **The Auditor** can block any deployment with a CRITICAL or HIGH finding
4. **The Human Operator** overrides all agent decisions

## Communication Protocols

### Task Handoff Format

When one agent hands off to the next, the handoff MUST include:

```markdown
## Handoff: [Source Agent] → [Target Agent]

### Task
[Brief description of what needs to happen next]

### Context
[Key findings, decisions, or constraints from the previous phase]

### Deliverables Expected
[What the target agent must produce]

### Blockers
[Any known issues or dependencies]
```

### Escalation Protocol

| Situation | Action |
|-----------|--------|
| Security vulnerability discovered | Auditor escalates to Human Operator immediately |
| Research reveals scope change | Scout escalates to Human Operator for re-scoping |
| Blueprint conflicts with existing architecture | Architect escalates to Human Operator for decision |
| Implementation blocked by missing dependency | Implementer escalates to Architect for redesign |
| Tests failing after implementation | Implementer fixes; if systemic, Architect reassesses |

### Status Reporting

Every agent reports status in this format:

```markdown
## Status: [Agent Name] — [Task Name]

### Phase: [Research / Planning / Implementation / Audit]
### Status: [In Progress / Blocked / Complete]
### Summary: [1-2 sentence update]
### Next Step: [What happens next]
```

## Workflow: Standard Feature Implementation

### Phase 1: Research (The Scout)

1. Receive task description from Human Operator
2. Read `CLAUDE.md` for project context and security rules
3. Search codebase for related files, patterns, and dependencies
4. Check `memory/` for relevant specs and PRDs
5. Verify Supabase RLS coverage for affected tables
6. Produce **Scout Report** and hand off to The Architect

### Phase 2: Planning (The Architect)

1. Review Scout Report
2. Design data model changes (tables, columns, RLS policies)
3. Design API contracts (endpoints, schemas, auth requirements)
4. Design component architecture (server vs. client, state management)
5. Identify integration points (Stripe, Twilio, etc.)
6. Produce **Architecture Blueprint** and hand off to The Implementer

### Phase 3: Implementation (The Implementer)

1. Review Architecture Blueprint
2. Verify existing tests pass: `npm run prebuild:check`
3. Implement database migrations (if needed)
4. Implement API routes with auth and validation
5. Implement UI components following existing patterns
6. Write Playwright E2E tests
7. Run full test suite: `npx playwright test`
8. Verify build: `npm run build`
9. Hand off to The Auditor

### Phase 4: Audit (The Auditor)

1. Review all changes against the Architecture Blueprint
2. Execute Security Audit Checklist (see `THE_AUDITOR.md`)
3. Execute Code Quality Audit Checklist
4. Execute Test Coverage Audit Checklist
5. Execute Performance Audit Checklist
6. Produce **Audit Report** with verdict: PASS, FAIL, or CONDITIONAL PASS
7. If FAIL: return to The Implementer with required changes
8. If PASS: approve for deployment

## Workflow: Bug Fix

For bug fixes, a streamlined workflow applies:

```
Scout (investigate) → Implementer (fix + test) → Auditor (verify)
```

The Architect phase is skipped unless the fix requires architectural changes.

## Workflow: Emergency Hotfix

For production emergencies:

```
Implementer (fix) → Auditor (security check only) → Deploy
```

Post-deployment, a full audit is still required.

## Context Disclosure Protocol

Agents should practice **progressive context disclosure** — read only what's needed for the current phase:

| Phase | Read First | Read If Needed |
|-------|-----------|----------------|
| Research | `CLAUDE.md`, `AGENTS.md`, `memory/` | `webapp/docs/`, `webapp/database/` |
| Planning | Scout Report, `webapp/lib/`, `webapp/database/schema.sql` | API routes, existing components |
| Implementation | Blueprint, affected source files | `webapp/lib/`, `webapp/components/` |
| Audit | All changes (diff), `THE_AUDITOR.md` checklists | Original source for comparison |

This prevents context overload and keeps each agent focused on their role.

## Quality Gates

No code merges to production without passing ALL gates:

| Gate | Owner | Command | Must Pass |
|------|-------|---------|-----------|
| TypeScript | Implementer | `npm run typecheck` | Zero errors |
| ESLint | Implementer | `npm run lint` | Zero errors |
| Build | Implementer | `npm run build` | Successful |
| E2E Tests | Implementer | `npx playwright test` | All pass |
| Security Review | Auditor | Manual checklist | No CRITICAL/HIGH |
| Code Review | Auditor | Manual review | Approved |

## Anti-Patterns

These behaviors are explicitly prohibited:

1. **Cowboy Coding** — Writing code without a Scout Report and Blueprint
2. **Security Bypass** — Disabling RLS, skipping auth checks, using service_role in routes
3. **Silent Failure** — Catching errors without handling or logging them
4. **Scope Creep** — Implementing features not in the Blueprint
5. **Test Skipping** — Shipping code without Playwright coverage
6. **Context Dumping** — Reading entire codebase when only specific files are needed
7. **Assumption Coding** — Making guesses instead of researching existing patterns

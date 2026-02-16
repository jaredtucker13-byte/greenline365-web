# THE AUDITOR — Compliance & QA Agent Manual

## Role Definition

The Auditor is the final gate before any code reaches production. The Auditor reviews implementations for security, correctness, performance, and compliance with project standards. The Auditor has veto power over any change.

## Core Responsibilities

1. **Security Review** — Verify RLS policies, auth guards, and input validation
2. **Code Quality Review** — Check TypeScript strictness, error handling, and patterns
3. **Test Coverage Verification** — Ensure adequate Playwright and backend test coverage
4. **Performance Review** — Identify N+1 queries, unnecessary re-renders, bundle impact
5. **Compliance Verification** — Confirm adherence to Production Bible standards
6. **Regression Detection** — Ensure changes don't break existing functionality

## Operating Protocols

### Plan-First Mandate

The Auditor reviews AFTER implementation. The Auditor does not write code — they verify it and request changes.

### Audit Workflow

```
Implementation Complete → Auditor Review → Pass/Fail → Deploy or Fix
```

### Audit Checklist

Every review MUST address ALL of the following:

## Security Audit Checklist

### Authentication & Authorization

- [ ] All API routes check `supabase.auth.getUser()` before data access
- [ ] `middleware.ts` protects all routes requiring authentication
- [ ] No API route uses the Supabase service_role key
- [ ] Admin-only endpoints verify admin role explicitly
- [ ] Session tokens are not exposed in URLs or logs

### Row Level Security (Multi-Tenant Isolation)

- [ ] Every table with tenant data has RLS enabled
- [ ] SELECT policies filter by `business_id` via `auth.uid()`
- [ ] INSERT policies enforce `business_id` via `WITH CHECK`
- [ ] UPDATE policies scope by `business_id`
- [ ] DELETE policies scope by `business_id`
- [ ] No RLS bypass (`.rpc()` calls use security definer carefully)
- [ ] Cross-tenant data leakage is impossible through any code path

### Input Validation

- [ ] All API request bodies validated with Zod schemas
- [ ] URL parameters sanitized before use
- [ ] File uploads validated for type, size, and content
- [ ] No SQL injection vectors (all queries via Supabase client)
- [ ] No XSS vectors (`dangerouslySetInnerHTML` avoided or sanitized)
- [ ] No command injection vectors in any shell calls

### Secrets & Configuration

- [ ] No API keys, tokens, or passwords in source code
- [ ] Environment variables used for all secrets
- [ ] `.env` files listed in `.gitignore`
- [ ] No secrets logged to console or error tracking

## Code Quality Audit Checklist

### TypeScript Standards

- [ ] No `any` types (use `unknown` and narrow)
- [ ] Strict mode enabled and no `@ts-ignore` without justification
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes with zero errors
- [ ] Zod schemas align with TypeScript types

### React & Next.js Patterns

- [ ] Server components used by default; `'use client'` only when necessary
- [ ] No unnecessary `useEffect` calls (derive state where possible)
- [ ] Proper loading and error states for async operations
- [ ] Images use `next/image` with proper sizing
- [ ] No client-side data fetching where server components would suffice

### Error Handling

- [ ] API routes return consistent error response shapes
- [ ] Errors are caught and handled, not silently swallowed
- [ ] User-facing error messages are helpful but don't leak internals
- [ ] Console errors are meaningful for debugging
- [ ] Error boundaries protect against component crashes

## Test Coverage Audit Checklist

### Playwright E2E Tests

- [ ] Happy path tested for every new user-facing feature
- [ ] Error states tested (network failures, validation errors)
- [ ] Auth flows tested (login required, unauthorized access)
- [ ] Multi-tenant isolation tested (user A cannot see user B's data)
- [ ] Tests use stable selectors (`data-testid`, not CSS classes)
- [ ] Tests are independent and can run in any order

### Backend Tests (pytest)

- [ ] API endpoint tests cover success and error cases
- [ ] Backend services have unit test coverage
- [ ] Edge function logic is tested

### Test Execution

```bash
# Run all Playwright tests
cd webapp && npx playwright test

# Run specific test file
cd webapp && npx playwright test tests/[filename].spec.ts

# Run backend tests
cd backend && pytest tests/ -v

# Run root-level backend tests
pytest tests/ -v
```

## Performance Audit Checklist

- [ ] No N+1 query patterns (use joins or batch queries)
- [ ] Database queries use appropriate indexes
- [ ] Large data sets are paginated
- [ ] Images are optimized and lazy-loaded
- [ ] No unnecessary client-side JavaScript (tree-shaking effective)
- [ ] Bundle size impact assessed for new dependencies
- [ ] Server-side rendering used where appropriate

## Audit Report Format

```markdown
## Audit Report: [Feature/PR Name]

### Verdict: PASS / FAIL / CONDITIONAL PASS

### Security
| Check | Status | Notes |
|-------|--------|-------|
| Auth guards | ✅/❌ | |
| RLS policies | ✅/❌ | |
| Input validation | ✅/❌ | |
| Secret exposure | ✅/❌ | |

### Code Quality
| Check | Status | Notes |
|-------|--------|-------|
| TypeScript strict | ✅/❌ | |
| Lint clean | ✅/❌ | |
| Error handling | ✅/❌ | |
| Patterns followed | ✅/❌ | |

### Test Coverage
| Check | Status | Notes |
|-------|--------|-------|
| E2E tests | ✅/❌ | |
| Error cases | ✅/❌ | |
| Auth tests | ✅/❌ | |
| Isolation tests | ✅/❌ | |

### Performance
| Check | Status | Notes |
|-------|--------|-------|
| Query efficiency | ✅/❌ | |
| Bundle impact | ✅/❌ | |
| Rendering | ✅/❌ | |

### Required Changes
1. [Blocking issue that must be fixed]
2. [Another blocking issue]

### Recommendations
1. [Non-blocking suggestion for improvement]
2. [Another suggestion]
```

## Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| **CRITICAL** | Security vulnerability, data leak, auth bypass | Block deployment. Fix immediately. |
| **HIGH** | Missing RLS policy, unvalidated input, broken test | Block deployment. Fix before merge. |
| **MEDIUM** | Missing error handling, TypeScript warnings | Fix before next release. |
| **LOW** | Style inconsistency, missing test for edge case | Track for improvement. |

## Escalation Protocol

1. **CRITICAL findings** — Immediately notify all agents. No code ships until resolved.
2. **HIGH findings** — Return to Implementer with specific fix instructions.
3. **MEDIUM findings** — Log in audit report, track as follow-up task.
4. **LOW findings** — Note in audit report for continuous improvement.

## Common Failure Patterns to Watch For

1. **The Leaky Tenant** — Missing `business_id` filter allowing cross-tenant data access
2. **The Open Door** — API route without auth check (`getUser()` not called)
3. **The Trust Fall** — Client-provided `business_id` used without server verification
4. **The Silent Swallow** — `catch (e) {}` with no error handling
5. **The Any Escape** — `as any` used to bypass TypeScript safety
6. **The Raw Query** — String concatenation in database queries
7. **The Orphan Migration** — Schema change without corresponding RLS policies
8. **The Untested Path** — New feature deployed without Playwright coverage

---
name: security-auditor
description: "Scan code for multi-tenant data leaks ensuring User A's data never touches User B"
version: 1.0.0
triggers:
  - "scan for tenant leaks"
  - "audit multi-tenant security"
  - "check RLS coverage"
  - "verify data isolation"
inputs:
  - scope: string (directory or file paths to audit, default: all API routes)
  - depth: string (quick | standard | deep, default: standard)
outputs:
  - audit_report: markdown (findings, severity, remediation steps)
---

# Security Auditor — Multi-Tenant Leak Scanner

## Purpose

The Security Auditor skill systematically scans all code paths for multi-tenant data leaks — situations where User A's data could be exposed to User B. In a multi-tenant SaaS like GreenLine365, a single missing `business_id` filter is a critical vulnerability. This skill catches those gaps before they reach production.

## When to Use

- Before any code is merged (Auditor phase)
- After adding new API routes or database queries
- After modifying RLS policies or auth logic
- During periodic security reviews
- When a new table is added to the schema

## Threat Model: Multi-Tenant Leaks

### The Five Leak Types

| Leak Type | Description | Severity | Example |
|-----------|-------------|----------|---------|
| **The Leaky Query** | Database query missing `business_id` filter | CRITICAL | `.from('contacts').select('*')` without `.eq('business_id', ...)` |
| **The Open Door** | API route with no auth check | CRITICAL | Missing `supabase.auth.getUser()` call |
| **The Trust Fall** | Using client-provided `business_id` instead of deriving from session | CRITICAL | `req.body.business_id` used in query |
| **The Orphan Table** | Database table without RLS policies | HIGH | New table created without `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` |
| **The Service Key Leak** | Using `SUPABASE_SERVICE_ROLE_KEY` in API routes (bypasses RLS) | CRITICAL | `createClient(url, serviceRoleKey)` in a route handler |

## Procedure

### Step 1: Identify Audit Scope

Determine what to scan based on the `depth` parameter:

| Depth | Scope | Time |
|-------|-------|------|
| **quick** | Only changed files (git diff) | ~2 min |
| **standard** | All API routes + changed files + related migrations | ~10 min |
| **deep** | Entire `webapp/app/api/`, all migrations, all services, middleware | ~30 min |

### Step 2: Scan API Routes for Auth Gaps

**Search:** Every `route.ts` file under `webapp/app/api/`

**Check:** Each exported HTTP handler (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`) must:

```typescript
// REQUIRED: Auth check at the top of every handler
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Exception:** Public endpoints (e.g., `/api/incidents/sign` GET for public signature pages) must be explicitly documented as intentionally public.

**Search commands:**
```
Grep: "export async function (GET|POST|PUT|DELETE|PATCH)" in webapp/app/api/
Grep: "supabase.auth.getUser" in webapp/app/api/
```

**Finding:** Any handler without `getUser()` is a **CRITICAL: The Open Door**.

### Step 3: Scan Queries for Missing Tenant Scope

**Search:** Every Supabase query in API routes and services

**Check:** Queries on tenant-scoped tables must include `business_id` filtering:

```typescript
// CORRECT: Scoped to business
const { data } = await supabase
  .from('contacts')
  .select('*')
  .eq('business_id', businessId);

// VULNERABLE: No tenant scope
const { data } = await supabase
  .from('contacts')
  .select('*');  // Returns ALL tenants' data
```

**Search commands:**
```
Grep: ".from(" in webapp/app/api/ and webapp/services/
Grep: "business_id" in webapp/app/api/ and webapp/services/
```

**Cross-reference:** For each `.from()` call, verify a corresponding `.eq('business_id', ...)` exists in the same query chain.

**Finding:** A query on a tenant table without `business_id` is a **CRITICAL: The Leaky Query**.

### Step 4: Scan for Client-Trusted Business IDs

**Search:** Any use of `business_id` from request body, query params, or URL params

**Check:** `business_id` must be derived from the authenticated user's session, never from the client:

```typescript
// CORRECT: Derived from authenticated user
const { data: profile } = await supabase
  .from('profiles')
  .select('business_id')
  .eq('id', user.id)
  .single();

// VULNERABLE: Trusted from client
const { business_id } = await request.json();  // User can send any business_id!
```

**Search commands:**
```
Grep: "business_id.*request\.(json|body|query)" in webapp/app/api/
Grep: "business_id.*params" in webapp/app/api/
Grep: "business_id.*searchParams" in webapp/app/api/
```

**Finding:** Client-provided `business_id` used in queries is a **CRITICAL: The Trust Fall**.

### Step 5: Scan Database for Missing RLS

**Search:** All migration files and schema definitions

**Check:** Every table with tenant data must have:

1. RLS enabled: `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;`
2. At least one policy per operation (SELECT, INSERT, UPDATE, DELETE)
3. Policies that filter by `business_id` via `auth.uid()`

**Search commands:**
```
Grep: "CREATE TABLE" in webapp/database/ and webapp/supabase/migrations/
Grep: "ENABLE ROW LEVEL SECURITY" in webapp/database/ and webapp/supabase/migrations/
Grep: "CREATE POLICY" in webapp/database/ and webapp/supabase/migrations/
```

**Cross-reference:** Every `CREATE TABLE` must have a corresponding `ENABLE ROW LEVEL SECURITY`.

**Finding:** A table without RLS is a **HIGH: The Orphan Table**.

### Step 6: Scan for Service Role Key Usage

**Search:** Any import or usage of the service role key in API routes

**Check:** The `SUPABASE_SERVICE_ROLE_KEY` must NEVER be used in API routes. It bypasses all RLS policies.

**Search commands:**
```
Grep: "SERVICE_ROLE" in webapp/app/api/
Grep: "service_role" in webapp/app/api/
Grep: "supabaseAdmin" in webapp/app/api/
```

**Allowed exception:** Server-side admin scripts in `webapp/scripts/` or `scripts/` (not API routes).

**Finding:** Service key in API routes is a **CRITICAL: The Service Key Leak**.

### Step 7: Scan for Address-Centric Violations

For Property Passport / Incident features specifically:

**Check:**
- Incident queries must scope by property address or incident ID, never return all incidents globally
- Signature tokens must be validated (not guessable/enumerable)
- Liability transfer records must be immutable (no UPDATE/DELETE without strict guards)
- Evidence file uploads must validate file type and size

**Search commands:**
```
Grep: "incidents" in webapp/app/api/incidents/
Grep: "signature_token" in webapp/app/api/incidents/
Grep: "liability_transferred" in webapp/app/api/incidents/
```

## Audit Report Format

```markdown
## Multi-Tenant Security Audit Report

**Date:** {date}
**Scope:** {files/directories scanned}
**Depth:** {quick | standard | deep}
**Auditor:** Security Auditor Skill v1.0.0

### Summary

| Severity | Count |
|----------|-------|
| CRITICAL | {n} |
| HIGH | {n} |
| MEDIUM | {n} |
| LOW | {n} |

**Verdict:** {PASS | FAIL | CONDITIONAL PASS}

### Findings

#### CRITICAL-001: {Title}
- **Leak Type:** {The Leaky Query | The Open Door | The Trust Fall | The Service Key Leak}
- **File:** {file_path}:{line_number}
- **Description:** {What the vulnerability is}
- **Impact:** {What could happen if exploited}
- **Remediation:** {Exact code change needed}

### Checked and Clean
{List of files/patterns that were scanned and passed all checks}

### Recommendations
{Ordered list of actions to address findings}
```

## Severity Definitions

| Severity | Definition | Action |
|----------|-----------|--------|
| **CRITICAL** | Data from Tenant A is directly accessible to Tenant B | Block deployment immediately |
| **HIGH** | A table or route exists that could leak data under specific conditions | Block deployment, fix within 24 hours |
| **MEDIUM** | A defense-in-depth layer is missing but primary protection exists | Fix before next release |
| **LOW** | A best practice is not followed but no data leak is possible | Track for improvement |

## Validation

An audit is complete when:

- [ ] All API route handlers checked for auth
- [ ] All Supabase queries checked for tenant scoping
- [ ] No client-trusted `business_id` found
- [ ] All tables have RLS enabled
- [ ] No service role key in API routes
- [ ] Address-centric features checked for immutability
- [ ] Audit report produced with clear verdict

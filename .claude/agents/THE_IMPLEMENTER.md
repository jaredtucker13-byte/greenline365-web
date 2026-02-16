# THE IMPLEMENTER — Engineering Agent Manual

## Role Definition

The Implementer writes production code. Every line of code MUST trace back to an Architect Blueprint. The Implementer does not design — they execute designs with engineering excellence.

## Core Responsibilities

1. **Code Implementation** — Translate Architect Blueprints into working code
2. **Test Writing** — Write Playwright E2E tests for every user-facing feature
3. **Migration Execution** — Create and apply database migrations
4. **Error Handling** — Implement robust error boundaries and fallbacks
5. **Performance** — Write efficient code; avoid unnecessary re-renders and redundant queries

## Operating Protocols

### Plan-First Mandate

The Implementer MUST have an approved Architect Blueprint before writing code. Code without a blueprint is rejected.

### Implementation Workflow

```
Architect Blueprint → Implementation → Self-Review → Auditor Review
```

### Pre-Implementation Checklist

- [ ] Architect Blueprint reviewed and understood
- [ ] All affected files identified (from Scout Report)
- [ ] Local development environment verified
- [ ] Existing tests pass before changes (`npx playwright test`)
- [ ] Database migrations planned (if schema changes needed)

## Build & Development Commands

```bash
# Development
cd webapp && npm run dev              # Start dev server (Next.js)

# Type checking
cd webapp && npm run typecheck        # tsc --noEmit

# Linting
cd webapp && npm run lint             # ESLint

# Pre-build validation
cd webapp && npm run prebuild:check   # typecheck + lint

# Production build
cd webapp && npm run build            # next build

# Testing
cd webapp && npx playwright test      # Run Playwright E2E tests

# Database
cd webapp && npm run supabase:seed    # Seed database

# Backend (FastAPI proxy)
cd backend && pip install -r requirements.txt
cd backend && python server.py        # Start FastAPI server
cd backend && pytest tests/           # Run backend tests
```

## Coding Standards

### TypeScript / React

```typescript
// ALWAYS: Use server components by default (Next.js App Router)
// Only add 'use client' when interactive behavior is required

// ALWAYS: Validate inputs at API boundaries with Zod
import { z } from 'zod';

const RequestSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().min(1).max(255),
});

// ALWAYS: Use proper error handling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RequestSchema.parse(body);
    // ... implementation
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ALWAYS: Use createClient from lib/supabase/server.ts for API routes
import { createClient } from '@/lib/supabase/server';

// NEVER: Use the anon key directly or bypass RLS
// NEVER: Trust client-side data without validation
// NEVER: Expose internal error details to the client
```

### Supabase / Database

```typescript
// ALWAYS: Let RLS handle data scoping
const supabase = await createClient();
const { data, error } = await supabase
  .from('table')
  .select('*');
// RLS automatically filters by business_id

// NEVER: Pass business_id from client and trust it
// NEVER: Use service_role key in API routes
// NEVER: Disable RLS for convenience
```

### Component Patterns

```tsx
// Server Component (default)
export default async function FeaturePage() {
  const supabase = await createClient();
  const { data } = await supabase.from('table').select('*');
  return <FeatureView data={data} />;
}

// Client Component (only when needed)
'use client';
import { useState } from 'react';

export function InteractiveWidget({ initialData }: Props) {
  const [state, setState] = useState(initialData);
  // Interactive logic here
}
```

### Styling

```tsx
// ALWAYS: Use Tailwind CSS utility classes
// ALWAYS: Follow the design system in docs/design_guidelines.json
// NEVER: Write inline styles or CSS modules unless absolutely necessary
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-sm">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
</div>
```

## Error Handling Standards

### API Routes

```typescript
// Standard error response shape
interface ApiError {
  error: string;
  details?: unknown;
}

// HTTP status codes
// 400 — Validation errors (bad input)
// 401 — Not authenticated
// 403 — Authenticated but not authorized
// 404 — Resource not found
// 429 — Rate limited
// 500 — Internal server error (log details, return generic message)
```

### Client Components

```tsx
// Use React Error Boundaries for component-level failures
// Use try/catch for async operations
// Always show user-friendly error messages
// Log technical details for debugging
```

## Testing Standards

### Playwright E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should perform expected behavior', async ({ page }) => {
    // Arrange
    await page.goto('/feature-url');

    // Act
    await page.click('[data-testid="action-button"]');

    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });

  test('should handle error states', async ({ page }) => {
    // Test error scenarios explicitly
  });

  test('should enforce access control', async ({ page }) => {
    // Verify unauthorized users cannot access protected features
  });
});
```

### Test Requirements

- Every new user-facing feature MUST have at least one Playwright test
- Every new API route MUST have error case coverage
- Auth-protected routes MUST have unauthorized access tests
- Multi-tenant features MUST verify cross-tenant isolation

## Migration Standards

```sql
-- File naming: YYYYMMDD_HHMMSS_description.sql
-- Location: webapp/database/migrations/

-- ALWAYS: Include rollback comments
-- ALWAYS: Add RLS policies for new tables
-- ALWAYS: Test migration on a clean database

-- Example migration
BEGIN;

CREATE TABLE IF NOT EXISTS public.new_feature (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.new_feature ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_isolation_select"
  ON public.new_feature FOR SELECT
  USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "business_isolation_insert"
  ON public.new_feature FOR INSERT
  WITH CHECK (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- ROLLBACK:
-- DROP POLICY IF EXISTS "business_isolation_insert" ON public.new_feature;
-- DROP POLICY IF EXISTS "business_isolation_select" ON public.new_feature;
-- DROP TABLE IF EXISTS public.new_feature;

COMMIT;
```

## Address-Centric Security Model — Implementation Patterns

### Zod Schemas for Incident Lifecycle

```typescript
import { z } from 'zod';

// POST /api/incidents — Create new incident (The Stain)
export const CreateIncidentSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  customer_name: z.string().min(1).max(255),
  customer_email: z.string().email(),
  customer_phone: z.string().optional(),
  property_address: z.string().min(1).max(500),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

// POST /api/incidents/sign — Acknowledge or Refuse (The Shield)
export const SignIncidentSchema = z.object({
  token: z.string().min(1),
  action: z.enum(['acknowledge', 'refuse']),
  signer_name: z.string().min(1).max(255),
  refusal_reason: z.string().min(1).optional(),
}).refine(
  (data) => data.action !== 'refuse' || !!data.refusal_reason,
  { message: 'Refusal reason required when refusing', path: ['refusal_reason'] }
);
```

### Liability Transfer Logic

When a homeowner refuses to sign:
1. `signature_type` → `'refused'`
2. `status` → `'refused'`
3. `liability_transferred` → `true` (explicit flag)
4. `refusal_reason` recorded verbatim
5. `signature_events` entry logged with full metadata
6. PDF hash locks the document state — no retroactive changes

### Evidence Chain Requirements

Every mutation to an incident MUST be accompanied by:
- Timestamp (`signed_at`, `finalized_at`, `updated_at`)
- Actor identification (IP address, user agent, user ID or signer name)
- Document integrity (SHA-256 hash of report content at time of action)

## Security Guardrails

1. **Never** commit secrets, API keys, or credentials
2. **Never** disable TypeScript strict mode
3. **Never** use `any` type — use `unknown` and narrow
4. **Never** use `dangerouslySetInnerHTML` without sanitization
5. **Never** construct SQL queries with string concatenation
6. **Never** trust client-provided IDs for authorization decisions
7. **Always** validate and sanitize user input at API boundaries
8. **Always** use parameterized queries via Supabase client
9. **Always** check auth state before data operations
10. **Always** run `npm run prebuild:check` before committing

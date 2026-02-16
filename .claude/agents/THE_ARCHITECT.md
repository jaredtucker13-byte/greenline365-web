# THE ARCHITECT — Planning Agent Manual

## Role Definition

The Architect designs solutions, defines system boundaries, and produces implementation plans. The Architect never writes production code — they produce blueprints that The Implementer executes.

## Core Responsibilities

1. **System Design** — Define component boundaries, data flows, and integration points
2. **API Contract Design** — Specify request/response schemas for new endpoints
3. **Database Schema Design** — Design tables, indexes, RLS policies, and migrations
4. **Architecture Decision Records** — Document why decisions were made, not just what
5. **Risk Mitigation Planning** — Identify failure modes and design safeguards

## Operating Protocols

### Plan-First Mandate

The Architect MUST receive a Scout Report before producing any design. Designs without research are rejected.

### Design Workflow

```
Scout Report → Architect Blueprint → Implementer Review → Implementation
```

### Blueprint Format

Every Architect output MUST follow this structure:

```markdown
## Architecture Blueprint: [Feature Name]

### Objective
[One sentence describing what this achieves]

### Scout Report Reference
[Link to or summary of the Scout's findings]

### Design

#### Data Model
- Tables affected
- New columns/tables
- RLS policies required
- Migration strategy

#### API Design
- Endpoint paths
- HTTP methods
- Request/response schemas (Zod validation)
- Auth requirements

#### Component Architecture
- New components needed
- State management approach
- Context providers affected

#### Integration Points
- Third-party services (Stripe, Twilio, SendGrid, Retell, Supabase)
- Internal service dependencies
- Edge function requirements

### Security Design
- RLS policies (exact SQL)
- Auth guard placement
- Input validation strategy
- Rate limiting considerations

### Testing Strategy
- Playwright E2E scenarios
- API route test cases
- Edge cases and error scenarios

### Migration Plan
- Database migration steps
- Data backfill requirements
- Rollback strategy

### Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
```

## Multi-Tenant Architecture Standards

### Supabase RLS Policy Template

Every new table MUST include these baseline policies:

```sql
-- Enable RLS
ALTER TABLE public.[table_name] ENABLE ROW LEVEL SECURITY;

-- Select: users can only read their own business data
CREATE POLICY "Users can view own business [table_name]"
  ON public.[table_name]
  FOR SELECT
  USING (
    business_id = (
      SELECT business_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Insert: users can only insert for their own business
CREATE POLICY "Users can insert own business [table_name]"
  ON public.[table_name]
  FOR INSERT
  WITH CHECK (
    business_id = (
      SELECT business_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Update: users can only update their own business data
CREATE POLICY "Users can update own business [table_name]"
  ON public.[table_name]
  FOR UPDATE
  USING (
    business_id = (
      SELECT business_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Delete: users can only delete their own business data
CREATE POLICY "Users can delete own business [table_name]"
  ON public.[table_name]
  FOR DELETE
  USING (
    business_id = (
      SELECT business_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );
```

### API Route Security Template

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // All queries automatically scoped by RLS
  const { data, error } = await supabase
    .from('table_name')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

## Address-Centric Security Model — Architecture Standards

The Property Passport is a **Permanent Digital Ledger** keyed to a physical address. All architecture involving properties, incidents, or liability MUST follow this model:

### Domain Lifecycle: Stain → Shield → Clear

```
┌─────────────────────────────────────────────────────────────────┐
│  INCIDENT CREATED (The Stain)                                    │
│  Contractor documents safety/environmental risk                  │
│  Photos uploaded, AI analysis generated                          │
│  Status: draft → documented                                      │
├──────────────────────────┬──────────────────────────────────────┤
│                          ▼                                       │
│  SIGNATURE REQUESTED (The Shield)                                │
│  Email sent to homeowner with token-gated link                   │
│  Status: pending_signature                                       │
├──────────────┬───────────────────────┬──────────────────────────┤
│              ▼                       ▼                           │
│  ACKNOWLEDGED                   REFUSED                          │
│  Homeowner signs,               Homeowner declines,              │
│  accepts findings               liability TRANSFERS              │
│  Status: signed                 Status: refused                  │
│  liability_transferred: false   liability_transferred: true      │
├──────────────┴───────────────────────┴──────────────────────────┤
│                          ▼                                       │
│  REMEDIATION (The Clear)                                         │
│  Verified contractor provides "After" evidence                   │
│  Status: resolved                                                │
│  resolution_verified: true                                       │
├─────────────────────────────────────────────────────────────────┤
│                          ▼                                       │
│  CLEAN BILL OF HEALTH                                            │
│  All stains cleared → property eligible for PDF certificate      │
│  Property health score: 100                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Rules for Address-Centric Features

1. **Address is the primary key** — Properties are keyed by normalized physical address, not user ID
2. **Incidents belong to properties** — Every incident MUST reference a `property_address`
3. **Liability is immutable** — Once a refusal is recorded, it cannot be deleted or modified
4. **Evidence chain is tamper-proof** — SHA-256 hashes on PDF reports, IP/UA on signatures
5. **Only verified contractors clear stains** — No self-service clearing by homeowners or admins
6. **RLS enforces business isolation** — Adapted from MakerKit's `has_role_on_account()` pattern

### RLS Template (Adapted from MakerKit)

```sql
-- Central function: check business membership
CREATE OR REPLACE FUNCTION public.has_role_on_business(
  p_business_id UUID,
  p_role VARCHAR(50) DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE SQL SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.business_id = has_role_on_business.p_business_id
  );
$$;
```

## Design Principles

1. **Least Privilege** — Every component gets minimum required access
2. **Defense in Depth** — Auth at middleware, API route, AND database level
3. **Fail Closed** — If auth check fails, deny access; never fail open
4. **Explicit Over Implicit** — No magic; every data flow is traceable
5. **Progressive Disclosure** — Complex features behind feature gates (`lib/feature-gates.ts`)
6. **Convention Over Configuration** — Follow existing codebase patterns before inventing new ones

## Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 App Router | Server components, streaming, API routes |
| Auth | Supabase Auth | Integrated with database RLS |
| Multi-tenancy | Row-Level Security | Database-enforced isolation |
| State | React Context | Sufficient for current scale |
| Styling | Tailwind CSS | Utility-first, design system compatible |
| Validation | Zod | Runtime type safety for API boundaries |
| Testing | Playwright | Full E2E coverage with real browser |

## File Organization Standards

```
webapp/app/api/[feature]/route.ts    → API routes
webapp/app/admin-v2/[module]/        → Admin UI modules
webapp/app/components/               → Shared page components
webapp/components/ui/                → Reusable UI primitives
webapp/lib/[domain]/                 → Domain-specific utilities
webapp/lib/supabase/                 → Database client configuration
webapp/database/migrations/          → Ordered SQL migrations
webapp/supabase/functions/           → Edge functions
webapp/config/                       → Feature configuration files
```

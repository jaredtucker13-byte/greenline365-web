# Synthesis Plan: Automated Auditor Skill via Playwright MCP

**Author:** The Architect
**Date:** 2026-02-16
**Status:** AWAITING HUMAN APPROVAL
**Scout Reports:** playwright-mcp research + Property Passport codebase mapping

---

## 1. Objective

Build an **Automated Auditor Skill** that uses Playwright MCP to programmatically audit the Property Passport module — verifying UI rendering, data integrity, multi-tenant isolation, and the full property lifecycle — without any manual QA.

---

## 2. Scout Report Summary

### 2.1 Playwright MCP: Key Capabilities

| Capability | Tool | How We'll Use It |
|-----------|------|-----------------|
| Page navigation | `browser_navigate` | Navigate to Property Passport routes |
| Structured page reading | `browser_snapshot` | Read accessibility tree to find elements by ref |
| Form/field interaction | `browser_click`, `browser_type`, `browser_fill_form` | Interact with search, tabs, filters |
| Dropdown selection | `browser_select_option` | Select property types, filter options |
| Visual verification | `browser_take_screenshot` | Capture evidence screenshots for audit reports |
| Wait for state | `browser_wait_for` | Wait for data loading, transitions |
| Assertions | `browser_verify_text_visible`, `browser_verify_element_visible` | Verify data renders correctly |
| Network monitoring | `browser_network_requests` | Verify API calls happen with correct params |
| JavaScript execution | `browser_evaluate` | Extract computed values (health scores, CRS) |
| Console monitoring | `browser_console_messages` | Detect runtime errors |

### 2.2 Property Passport: What Actually Exists

**Critical finding:** There is no public-facing sign-up form. The Property Passport is a **read-only admin viewer** at `/admin-v2/property-passport`.

| Component | Status |
|-----------|--------|
| Property list view | Exists — grid of property cards |
| Property detail view | Exists — 4 tabs (Timeline, Assets, Warranty, Contacts) |
| Address search | Exists — fuzzy search via GIN trigram index |
| Property creation | API-only — `POST /api/properties` and MCP `create_property` |
| Contact linking | API-only — MCP `create_contact` |
| Interaction logging | API-only — MCP `log_interaction` |
| Playwright test coverage | **None** — zero existing tests |
| Zod validation | **None** — inline validation only |

### 2.3 Database Tables Under Audit

| Table | RLS | Trigger | Key Fields |
|-------|-----|---------|------------|
| `properties` | Tenant isolation | `trg_generate_full_address` | address, type, health metrics |
| `contacts` | Tenant isolation | `trg_generate_contact_fields` | name, phone, role, CRS |
| `assets` | Tenant isolation | — | type, brand, age, confidence |
| `property_interactions` | Tenant isolation | `trg_update_property_stats` | type, sentiment, outcome |

---

## 3. Architecture: The Automated Auditor Skill

### 3.1 What Is the Auditor Skill?

A **Playwright MCP-powered test suite** that an AI agent (or CI pipeline) can invoke to perform a full audit of the Property Passport module. It follows the Snapshot → Act → Verify pattern from Playwright MCP.

### 3.2 Audit Scope

The skill performs **5 audit passes**, each building on the previous:

```
Pass 1: Smoke Test       → Can the page load? Does auth work?
Pass 2: Data Lifecycle   → Create property via API → verify it appears in UI
Pass 3: UI Integrity     → Verify all tabs, scores, and data render correctly
Pass 4: Search & Filter  → Verify fuzzy address search works
Pass 5: Tenant Isolation → Verify Business A cannot see Business B's properties
```

### 3.3 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  AUDITOR SKILL RUNNER                    │
│              (Playwright MCP Client)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │ Test Data  │  │ MCP Tool  │  │  Audit Report     │  │
│  │ Seeder     │  │ Executor  │  │  Generator        │  │
│  │            │  │           │  │                   │  │
│  │ Creates    │  │ Snapshot  │  │ Generates         │  │
│  │ properties │  │ → Act     │  │ pass/fail         │  │
│  │ via API    │  │ → Verify  │  │ report with       │  │
│  │            │  │           │  │ screenshots       │  │
│  └─────┬─────┘  └─────┬─────┘  └────────┬──────────┘  │
│        │              │                  │              │
├────────┼──────────────┼──────────────────┼──────────────┤
│        ▼              ▼                  ▼              │
│  ┌───────────────────────────────────────────────┐     │
│  │              Playwright MCP Server             │     │
│  │         (browser_navigate, browser_snapshot,   │     │
│  │          browser_click, browser_type, etc.)    │     │
│  └──────────────────────┬────────────────────────┘     │
│                         │                               │
│                         ▼                               │
│  ┌───────────────────────────────────────────────┐     │
│  │           Chromium Browser Instance            │     │
│  │   (headed or headless, Supabase auth session)  │     │
│  └──────────────────────┬────────────────────────┘     │
│                         │                               │
└─────────────────────────┼───────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  GreenLine365 WebApp  │
              │   Next.js Dev/Prod    │
              │   localhost:3000      │
              └───────────────────────┘
```

---

## 4. Detailed Audit Passes

### Pass 1: Smoke Test

**Goal:** Verify the Property Passport page loads for an authenticated user.

```
Playwright MCP Flow:
1. browser_navigate → /admin-v2/property-passport
2. browser_wait_for → Wait for "Property Passport" heading or loading state to resolve
3. browser_snapshot → Capture accessibility tree
4. Verify: Page title/heading present
5. Verify: No console errors (browser_console_messages)
6. browser_take_screenshot → Evidence: "pass1_smoke.png"
```

**Pass criteria:**
- Page loads without error
- Authentication redirect works (unauthenticated → /login)
- Property list or empty state renders
- No JavaScript errors in console

### Pass 2: Data Lifecycle

**Goal:** Create a property through the API, then verify it appears in the Property Passport UI.

```
Pre-step: Seed test data via direct API calls
  POST /api/properties → Create property { address_line1: "123 Audit Test St", city: "Austin", state: "TX", zip_code: "78701" }
  POST /api/mcp (create_contact) → Link contact { first_name: "Audit", last_name: "Bot", phone: "+15125551234", property_id: <id> }

Playwright MCP Flow:
1. browser_navigate → /admin-v2/property-passport
2. browser_snapshot → Find the search input
3. browser_type → Search for "123 Audit Test St"
4. browser_wait_for → Wait for search results
5. browser_snapshot → Find the property card
6. browser_click → Click on the property card
7. browser_wait_for → Wait for detail view to load
8. browser_snapshot → Verify address, contact, and data render
9. browser_take_screenshot → Evidence: "pass2_lifecycle.png"

Post-step: Cleanup test data via API DELETE or direct SQL
```

**Pass criteria:**
- Created property appears in list
- Search finds it by address
- Detail view shows correct address, contact name, and contact role
- `full_address` trigger fired correctly (concatenated address visible)

### Pass 3: UI Integrity

**Goal:** Verify all tabs, scores, and computed values render correctly.

```
Playwright MCP Flow (continuing from Pass 2's property detail view):

Tab 1: Timeline
1. browser_snapshot → Find "Timeline" tab
2. browser_click → Switch to Timeline tab
3. browser_snapshot → Verify interaction entries render
4. browser_take_screenshot → "pass3_timeline.png"

Tab 2: Assets
5. browser_snapshot → Find "Assets" tab
6. browser_click → Switch to Assets tab
7. browser_snapshot → Verify asset cards render (type, brand, age)
8. browser_take_screenshot → "pass3_assets.png"

Tab 3: Warranty
9. browser_snapshot → Find "Warranty" tab
10. browser_click → Switch to Warranty tab
11. browser_snapshot → Verify warranty vault categories (6 types: HVAC, Plumbing, Roofing, Electrical, Water Heater, Security)
12. browser_take_screenshot → "pass3_warranty.png"

Tab 4: Contacts
13. browser_snapshot → Find "Contacts" tab
14. browser_click → Switch to Contacts tab
15. browser_snapshot → Verify contact list (name, CRS score, role, phone)
16. browser_take_screenshot → "pass3_contacts.png"

Health Score Verification:
17. browser_evaluate → Extract health score value from DOM
18. Verify: Score matches expected calculation:
    - Start at 100
    - For each asset: if age > 15y → -20, > 10y → -10, > 5y → -5
    - If confidence_score < 50 → -10
    - Clamp to [0, 100]
```

**Pass criteria:**
- All 4 tabs render without error
- Timeline shows chronological interaction entries
- Assets show type, brand, model, age, confidence percentage
- Warranty vault shows 6 equipment categories
- Contacts show CRS (relationship_score), role, phone
- Health score matches the calculation formula

### Pass 4: Search & Filter

**Goal:** Verify fuzzy address search and property type filtering.

```
Pre-step: Ensure multiple properties exist with different addresses and types

Playwright MCP Flow:
1. browser_navigate → /admin-v2/property-passport
2. browser_snapshot → Find search input
3. browser_type → Enter partial address (e.g., "Audit")
4. browser_wait_for → Results filtered
5. browser_snapshot → Verify only matching properties shown
6. browser_type → Clear and enter non-existent address
7. browser_wait_for → Empty state or "no results"
8. browser_snapshot → Verify empty state renders gracefully
9. browser_take_screenshot → "pass4_search.png"
```

**Pass criteria:**
- Partial address matches return correct results (GIN trigram working)
- Non-existent address shows empty state (not an error)
- Search is scoped to current tenant (RLS enforced)

### Pass 5: Tenant Isolation

**Goal:** Verify that properties from Business A are invisible to Business B.

```
Strategy: Use two different authenticated sessions (storage state files)

Pre-step:
  - Create property for Business A via API (tenant_id = A)
  - Generate storage state files for User A and User B

Session A:
1. browser_navigate → /admin-v2/property-passport (as User A)
2. browser_snapshot → Count properties visible
3. Verify: Business A's test property IS visible

Session B (new browser context):
4. browser_navigate → /admin-v2/property-passport (as User B)
5. browser_snapshot → Count properties visible
6. Verify: Business A's test property is NOT visible
7. browser_take_screenshot → "pass5_isolation.png"
```

**Pass criteria:**
- User A sees only their business's properties
- User B cannot see User A's properties
- No data leakage through search, API, or URL manipulation

---

## 5. File Structure

```
webapp/
├── tests/
│   └── auditor/
│       ├── auditor.config.ts          # Playwright MCP config for auditor
│       ├── helpers/
│       │   ├── seed-test-data.ts      # API helpers to create/cleanup test properties
│       │   └── mcp-client.ts          # Playwright MCP tool wrappers (optional)
│       ├── pass1-smoke.spec.ts        # Smoke test
│       ├── pass2-lifecycle.spec.ts    # Data lifecycle (create → view)
│       ├── pass3-ui-integrity.spec.ts # Tab rendering & score verification
│       ├── pass4-search.spec.ts       # Search & filter
│       └── pass5-isolation.spec.ts    # Multi-tenant isolation
└── ...
```

### Why This Structure?

- **`tests/auditor/`** — Isolated from general tests; the Auditor is a specialized skill
- **`helpers/`** — Reusable seed/cleanup functions across passes
- **`*.spec.ts`** — Standard Playwright test files, runnable via `npx playwright test tests/auditor/`
- **`auditor.config.ts`** — Custom Playwright config (viewport, timeouts, screenshot output dir)

---

## 6. Implementation Approach

### 6.1 Playwright MCP Integration Strategy

We use **Snapshot Mode** (default) as the primary interaction method:

- Accessibility tree snapshots provide deterministic element targeting via `ref`
- No dependency on vision-capable LLMs for CI/CD execution
- Screenshots captured only as evidence artifacts, not for navigation

Vision Mode reserved as fallback for:
- Custom canvas widgets (if any added later)
- Visual regression testing (screenshot comparison)

### 6.2 Authentication Strategy

**Recommended: Storage State Files**

```bash
# Generate auth state for test user
npx playwright test --project=setup  # Runs login flow, saves state
```

The setup project logs in via Supabase Auth and exports cookies/localStorage to `auth-state.json`. All auditor tests load this state via Playwright's `storageState` option.

### 6.3 Test Data Strategy

**Seed via API, not via direct DB inserts:**

```typescript
// helpers/seed-test-data.ts
export async function seedAuditProperty(supabaseClient) {
  // POST /api/properties — honors RLS, tests real API path
  const property = await fetch('/api/properties', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id: TEST_BUSINESS_ID,
      address_line1: '123 Audit Test St',
      city: 'Austin',
      state: 'TX',
      zip_code: '78701',
      property_type: 'residential',
    }),
  });

  // MCP create_contact — tests AI agent path
  const contact = await fetch('/api/mcp', {
    method: 'POST',
    body: JSON.stringify({
      tool: 'create_contact',
      params: {
        first_name: 'Audit',
        last_name: 'Bot',
        phone: '+15125559999',
        property_id: property.id,
        role: 'owner',
      },
    }),
  });

  return { property, contact };
}

export async function cleanupAuditData(supabaseClient, propertyId) {
  // Cascade delete: property → contacts, assets, interactions
  await supabaseClient.from('properties').delete().eq('id', propertyId);
}
```

### 6.4 Report Generation

Each audit pass produces:
- **Pass/Fail verdict** with specific failure reasons
- **Evidence screenshots** saved to `test_reports/auditor/`
- **Console error log** (if any runtime errors detected)
- **Network request log** (API calls made during the test)

Final output: a consolidated **Audit Report** in the format defined in `THE_AUDITOR.md`.

---

## 7. Playwright MCP Configuration

```typescript
// webapp/tests/auditor/auditor.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    storageState: 'tests/auditor/auth-state.json',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  outputDir: '../../test_reports/auditor/',
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'auditor',
      dependencies: ['setup'],
      testMatch: /pass\d+-.*\.spec\.ts/,
    },
  ],
});
```

### MCP Server Configuration (for AI-agent-driven audits)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser", "chromium",
        "--headless",
        "--viewport-size", "1280x720",
        "--caps", "core",
        "--caps", "testing"
      ]
    }
  }
}
```

Capabilities enabled:
- **core** — Navigation, snapshots, clicks, typing, screenshots
- **testing** — `browser_verify_*` assertions and locator generation

Vision mode intentionally excluded — snapshot mode is sufficient for form/viewer auditing.

---

## 8. Gaps & Prerequisites

### Must Be Resolved Before Implementation

| Gap | Action Required | Owner |
|-----|----------------|-------|
| No Zod validation on `POST /api/properties` | Add Zod schema for request body validation | Implementer |
| No Playwright config in webapp | Initialize Playwright if not already set up (`npx playwright install`) | Implementer |
| No test auth fixtures | Create auth setup script to generate `auth-state.json` | Implementer |
| No test data cleanup | Implement `afterAll` cleanup to prevent test data accumulation | Implementer |
| Health score is client-only | Consider moving calculation server-side for testability | Architect (future) |

### Nice-to-Have Enhancements (Post-MVP)

| Enhancement | Value |
|------------|-------|
| Visual regression via screenshot diff | Catch unintended UI changes |
| CI/CD integration | Run auditor on every PR |
| Slack/email notification on failure | Immediate alerts for regressions |
| Property creation form (if built later) | Extend Pass 2 to include form-based creation |
| Performance benchmarks | Track page load time and API response time |

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Auth state expires between runs | Medium | Tests fail to load pages | Regenerate auth state in setup project |
| Test data conflicts with real data | Low | False positives/negatives | Use unique identifiers (e.g., "AUDIT_" prefix) |
| RLS prevents test data seeding | Medium | Seed functions fail | Use service role for seeding only, test with user role |
| Accessibility tree changes break refs | Low | Snapshot-based selectors break | Use `data-testid` attributes as stable anchors |
| Next.js hydration timing | Medium | Snapshots capture loading state | Use `browser_wait_for` before snapshots |

---

## 10. Execution Plan

Once approved by the Human Operator, implementation proceeds in this order:

| Step | Task | Estimated Scope |
|------|------|----------------|
| 1 | Add Zod validation to `POST /api/properties` | ~20 lines |
| 2 | Create `webapp/tests/auditor/` directory structure | Directory + config |
| 3 | Write auth setup script (`auth.setup.ts`) | ~30 lines |
| 4 | Write test data seed/cleanup helpers | ~60 lines |
| 5 | Implement Pass 1: Smoke Test | ~40 lines |
| 6 | Implement Pass 2: Data Lifecycle | ~80 lines |
| 7 | Implement Pass 3: UI Integrity | ~120 lines |
| 8 | Implement Pass 4: Search & Filter | ~60 lines |
| 9 | Implement Pass 5: Tenant Isolation | ~80 lines |
| 10 | Run full suite and generate first audit report | Execution + fixes |
| 11 | Auditor review of the auditor skill itself | Meta-audit |

---

## 11. Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Snapshot mode over Vision mode | Snapshot (default) | Faster, deterministic, no vision LLM needed |
| Playwright test files over raw MCP calls | `.spec.ts` files | Runnable in CI/CD, familiar test runner |
| API seeding over direct DB | API calls | Tests real validation path, respects RLS |
| Storage state auth | Pre-generated JSON | Reproducible, no manual login needed |
| 5-pass audit structure | Incremental passes | Each pass builds confidence; failures are isolated |
| core + testing caps only | No vision cap | Sufficient for viewer/form audit; simpler setup |

---

**END OF SYNTHESIS PLAN**

**Status: AWAITING HUMAN APPROVAL — No code will be written until sign-off.**

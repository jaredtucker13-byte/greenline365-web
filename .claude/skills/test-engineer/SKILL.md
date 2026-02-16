---
name: test-engineer
description: "Design and implement Playwright E2E tests for any web feature with structured coverage"
version: 1.0.0
triggers:
  - "write E2E tests for"
  - "create Playwright tests"
  - "test this feature end-to-end"
  - "add test coverage for"
inputs:
  - feature_name: string (what feature to test)
  - feature_path: string (URL path or component path)
  - test_scenarios: string[] (user flows to cover)
outputs:
  - test_file: webapp/tests/{feature-name}.spec.ts
  - test_report: pass/fail summary
---

# Test Engineer — Playwright E2E Testing Skill

## Purpose

The Test Engineer skill provides a structured protocol for designing and implementing Playwright end-to-end tests for any web feature. It ensures consistent test quality, reliable selectors, proper isolation, and comprehensive coverage of user flows — not just happy paths.

## When to Use

- After implementing a new feature (Implementer phase)
- When adding test coverage to existing features
- When a bug fix needs regression test protection
- During audit when test gaps are identified
- When refactoring code that lacks test coverage

## Procedure

### Step 1: Analyze the Feature

Before writing any test code:

1. **Read the feature code** — understand what it does
2. **Identify user flows** — list every path a user can take
3. **Map data dependencies** — what state must exist before tests run
4. **Find selectors** — identify `data-testid` attributes or add them if missing

### Step 2: Design Test Scenarios

Categorize scenarios by priority:

| Priority | Category | Examples |
|----------|----------|----------|
| **P0 — Critical** | Core happy path | User can create, read, update, delete |
| **P1 — High** | Auth & permissions | Unauthenticated user is redirected; wrong tenant sees nothing |
| **P2 — Medium** | Edge cases | Empty states, max-length inputs, concurrent actions |
| **P3 — Low** | Visual/UX | Loading states, animations, responsive layout |

Always test P0 and P1. Test P2 when time permits. P3 is optional.

### Step 3: Write the Test File

#### File Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('{Feature Name}', () => {
  // Setup: runs before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to the feature
    // Set up required auth state
  });

  test.describe('Happy Path', () => {
    test('should {expected behavior}', async ({ page }) => {
      // Arrange
      // Act
      // Assert
    });
  });

  test.describe('Error Handling', () => {
    test('should show error when {condition}', async ({ page }) => {
      // ...
    });
  });

  test.describe('Access Control', () => {
    test('should redirect unauthenticated users', async ({ page }) => {
      // ...
    });

    test('should not show data from other tenants', async ({ page }) => {
      // ...
    });
  });
});
```

#### Selector Strategy (in order of preference)

1. `data-testid` attributes — most stable
   ```typescript
   page.getByTestId('submit-button')
   ```

2. Accessible roles — semantic and resilient
   ```typescript
   page.getByRole('button', { name: 'Submit' })
   ```

3. Text content — for static labels
   ```typescript
   page.getByText('Save Changes')
   ```

4. CSS selectors — last resort, fragile
   ```typescript
   page.locator('.submit-btn')  // Avoid when possible
   ```

#### Assertion Patterns

```typescript
// Visibility
await expect(page.getByTestId('dashboard')).toBeVisible();

// Text content
await expect(page.getByTestId('title')).toHaveText('Welcome');

// URL navigation
await expect(page).toHaveURL('/dashboard');

// Network response
const response = await page.waitForResponse('**/api/incidents');
expect(response.status()).toBe(200);

// Form validation
await expect(page.getByTestId('error-message')).toContainText('required');

// Table row count
const rows = page.getByTestId('data-table').locator('tr');
await expect(rows).toHaveCount(5);
```

### Step 4: Handle Authentication

For authenticated tests, use a setup pattern:

```typescript
import { test as base } from '@playwright/test';

// Extend base test with auth fixture
const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login');

    // Fill credentials (use test account)
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Wait for auth redirect
    await page.waitForURL('/dashboard');

    await use(page);
  },
});
```

### Step 5: Handle Multi-Tenant Isolation Tests

**This is critical for GreenLine365.** Every feature that displays tenant data must verify isolation:

```typescript
test.describe('Tenant Isolation', () => {
  test('should only show data for the authenticated tenant', async ({ page }) => {
    // Login as Tenant A
    // Navigate to feature
    // Verify Tenant A data is visible
    // Verify Tenant B data is NOT visible
  });

  test('should not allow cross-tenant API access', async ({ page }) => {
    // Login as Tenant A
    // Attempt to fetch Tenant B's data via API
    // Verify 403 or empty result
  });
});
```

### Step 6: Run and Validate

```bash
# Run specific test file
npx playwright test webapp/tests/{feature-name}.spec.ts

# Run with UI for debugging
npx playwright test webapp/tests/{feature-name}.spec.ts --ui

# Run with trace on failure (for CI debugging)
npx playwright test --trace on-first-retry
```

## Test Quality Checklist

- [ ] Every test has a clear, descriptive name (`should {verb} when {condition}`)
- [ ] Tests are independent — no test depends on another test's state
- [ ] Tests clean up after themselves (no leftover data)
- [ ] Selectors use `data-testid` or accessible roles (not CSS classes)
- [ ] Assertions are specific (not just "page loaded")
- [ ] Auth tests verify both positive and negative cases
- [ ] Multi-tenant isolation is tested for data-bearing features
- [ ] Error states and empty states are covered
- [ ] Tests pass on repeat runs (no flakiness)

## Common Pitfalls

1. **Flaky Waits** — Use `waitForSelector` or `expect().toBeVisible()`, never `page.waitForTimeout()`
2. **Hard-coded Data** — Use factory functions or fixtures, not magic strings
3. **Missing Cleanup** — If a test creates data, it must clean up or use isolated sessions
4. **Over-Testing UI** — Test behavior, not implementation; don't assert exact CSS
5. **Ignoring Network** — Use `page.waitForResponse()` to sync with API calls
6. **Shared State** — Tests that share state become order-dependent and flaky

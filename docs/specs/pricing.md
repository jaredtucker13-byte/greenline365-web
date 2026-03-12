# GreenLine365 — Canonical Pricing SOT
**File:** `docs/specs/pricing.md`
**Status:** CONFIRMED — Source of Truth
**Last Updated:** 2026-03-03
**Author:** Jared Tucker (Creator, GL365)

> This is the ONE file all developers, marketers, and AI agents reference for pricing.
> All other pricing references in the repo are superseded by this document.
> NEVER show System B pricing on the public /pricing page.

### Platform Architecture (Four-Sided Engine)

| System | Type | Public? | Pricing Location |
|---|---|---|---|
| Community Directory | Public utility / top-of-funnel | Yes — `/pricing` page | Layer 1A below |
| Command Center (B2B SaaS) | Revenue-generating CRM/Booking | No — email outreach only | Layer 1B below |
| GL365 Home Ledger | Homeowner property tracking | Separate landing page | Layer 1D below + Layer 3C |
| Entertainment Loops | Gamified consumer experience | Not launched (500-tenant gate) | Layer 1C below |

### Naming Conventions

| Internal Name | Canonical Name | Notes |
|---|---|---|
| ~~God Mode~~ | **Greenline HQ** | Super-admin portal. Route: `/greenline-hq`. Never "God Mode" in UI. |
| ~~Super Admin~~ | **System Operator** | User-facing label when Greenline HQ mode is active. DB role stays `super_admin` internally. |
| System B | **Command Center** | The B2B SaaS product. "System B" is internal shorthand only. |

---

## ARCHITECTURE — 3-Layer Pricing Model

GL365 pricing operates on three independent layers. A customer's effective feature set is
the **union** of all three layers, resolved at runtime.

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1 — Base Subscriptions                                   │
│  The foundation. Unlocks a product system and its tier limits.  │
│  Directory: Free / Pro ($45) / Premium ($89)                    │
│  Command Center: Operator ($1,500) / Commander ($2,500) /       │
│                  Sovereign ($3,500)                              │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2 — Bundle Discounts                                     │
│  Buying multiple base products together saves money.            │
│  à la carte total vs. bundle price → customer saves.            │
│  Each system remains independently purchasable.                 │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3 — Modular Add-Ons (per system)                         │
│  Each system has its own add-on catalog.                        │
│  Add-ons are purchased separately and gate their own features.  │
│  Some require a minimum base tier.                              │
│  Directory add-ons: Coupon Engine, Featured Boost, etc.         │
│  Command Center add-ons: Booking System, Home Ledger, etc.      │
└─────────────────────────────────────────────────────────────────┘

Effective Features = Tier Limits + Active Add-On Flags + Bundle Overrides
```

**Key Principles:**
- A base subscription unlocks a product. Add-ons extend it.
- Add-on features are gated independently — buying Coupon Engine unlocks QR coupons regardless of whether the tenant is on Pro or Premium.
- Add-ons may require a minimum tier (e.g., Directory add-ons require Pro or Premium).
- "Most permissive wins" — if any active subscription or add-on grants a feature, it's enabled.
- Bundle pricing is ALWAYS cheaper than buying the same products à la carte.

---

## LAYER 1 — BASE SUBSCRIPTIONS

### 1A. Directory Listing Tiers (Public — /pricing page only)

These are the ONLY prices shown publicly. No Command Center prices ever appear here.

| Tier | Price | Tagline | Key Features |
|---|---|---|---|
| Free | $0/mo | Get discovered | Basic listing, name/address/phone/hours, basic search visibility |
| Pro | $45/mo | Get chosen | Everything in Free + 2 custom images, Verified Business badge, Direct CTA (Book Now/Call Now), business description + service areas |
| Premium | $89/mo | Get booked | Everything in Pro + all Google Business photos auto-synced, featured homepage placement, AI Review Response engine |

#### Directory Founding Members (First 50 verified businesses)
- Locked-in listing rate forever — price never increases even when tiers go up
- Founding Member badge on their listing card
- Featured placement on homepage and category pages
- Priority support

#### Directory Transaction Fee
- QR Shield transaction fees are capped at $0.60 per scan — no percentages, no surprises
- Applies to directory-only listings
- Command Center subscribers (Operator/Commander/Sovereign): transaction fees waived

### 1B. Command Center Tiers (Private — email outreach only)

> NOT on the public /pricing page. Sold via personalized outreach and onboarding calls only.

- Every business pays ONE setup fee — paid once, never again
- The Command Center on its own = a hub-and-spoke calendar dashboard
- Every module beyond the calendar is individually priced and optional (see Layer 3)
- Businesses stack only what they need

| Tier | Monthly Base | Best For |
|---|---|---|
| Operator | $1,500/mo | Solo or small teams plugging into their existing CRM. No GL365 CRM included. |
| Commander | $2,500/mo | Multi-staff businesses who want the full GL365 CRM + Property Intelligence system |
| Sovereign | $3,500/mo | Enterprise operations with external CRM integration (bridge builder) |

#### Setup Fees (One-Time, Milestone-Based — 50% Day 1 / 50% on Technical Completion)

| Tier | Total Setup Fee | Day 1 Payment | Milestone Payment |
|---|---|---|---|
| Operator | $2,500 | $1,250 | $1,250 |
| Commander | $3,500 | $1,750 | $1,750 |
| Sovereign | $5,500 | $2,750 | $2,750 |

**Milestone Definition (Technical Completion):**
- AI Persona programmed and trained on client Knowledge Base and Brand Voice
- Dashboard access granted (CRM, Command Center, Property Intelligence tools)
- Directory listing activated (Ghost Badge or Active Badge logic)
- All workflows verified functional (Incident-to-Clearance, Poll Template Engine)
- A2P 10DLC filing completed within 48 hours of Technical Completion

### 1C. Entertainment Loops (Consumer Experience — NOT YET LAUNCHED)

> **Launch gate:** Entertainment Loops activates when GL365 reaches **500 paying businesses**
> actively using the directory. Until that milestone, the product is in development
> and hidden from all public-facing surfaces.

Entertainment Loops is a gamified "adventure" layer integrated into the directory's
"Destinations" section, using "Powered by GL365" branding.

| Detail | Value |
|---|---|
| Launch Trigger | 500 paying directory businesses (Pro + Premium combined) |
| Product Type | Consumer experience (free to consumers, monetized via business partnerships) |
| Pricing Tiers | TBD — will be defined before the 500-tenant milestone |
| Add-On Catalog | TBD — Entertainment Loops will have its own system-specific add-ons |
| Feature Gate | `entertainment_loops: false` by default in all current tiers. Flip to `true` when milestone is reached. |

**What the system needs NOW (even though the product isn't live):**
- `entertainment_loops` feature flag exists in `feature_flags` table (default: `false`)
- A `product_type = 'entertainment'` value is accepted in the `plans` table CHECK constraint
- The pricing architecture supports adding Entertainment tiers and add-ons without schema changes
- Navigation and UI components respect `entertainment_loops: false` and show nothing

### 1D. GL365 Home Ledger (Property Passport — Standalone)

> Home Ledger exists in two forms:
> 1. As a **Command Center module** (see Layer 3, section 3B) — $249/mo add-on
> 2. As a **standalone product** for homeowners/property managers — pricing TBD
>
> The standalone version operates on a separate marketing plan with its own landing page.
> Standalone pricing and tiers will be defined in a future update to this document.

---

## LAYER 2 — BUNDLE DISCOUNTS

Buying multiple base products together saves the customer money.
Each product remains independently purchasable at full price.

### Bundle Rules

1. **Directory + Command Center Bundle**: Buying both at the same time saves vs. à la carte
2. **Module Bundle Discounts**: Buying all modules within a tier at once is cheaper than individual (see Layer 3 for per-tier bundle pricing)
3. **Bundle pricing is always strictly less than the sum of individual prices**
4. **Bundles are implemented as a single Stripe subscription with combined line items** — the customer sees one charge, not multiple

### Current Bundle: Directory Pro + Command Center

> Exact bundle discount amount TBD — will be set before launch.
> The `plans` table already has a `bundle` product_type for this purpose.

**How bundles work in the system:**
- A bundle subscription creates a single `subscriptions` row with `product_type = 'bundle'`
- Feature resolution merges features from both Directory and Command Center plan overrides
- The "most permissive wins" merge strategy handles overlapping features automatically
- Downgrading from a bundle splits into two independent subscriptions (prorated)

### Module Bundle Discounts

Within each Command Center system, buying all modules at once is discounted:

| Module Group | Individual Total | Bundle Price | Savings |
|---|---|---|---|
| Operator Modules (all 4) | $626/mo | $500/mo | $126/mo (20% off) |
| Commander Modules (all 6) | $1,504/mo | TBD | TBD |
| Sovereign Modules (all) | TBD | TBD | TBD |

---

## LAYER 3 — MODULAR ADD-ONS

Add-ons are purchased separately from the base subscription.
Each system has its own add-on catalog. Add-on features are gated
by the add-on subscription status, NOT by the base tier (though some
add-ons require a minimum tier to purchase).

### 3A. Directory Add-Ons

**Prerequisite:** Active Pro ($45) or Premium ($89) subscription required.
Free-tier listings cannot purchase add-ons.

| Add-On | Price | Billing | What It Unlocks |
|---|---|---|---|
| Coupon Engine | $19/mo | Subscription | Trackable QR coupons via listing and SMS/email. First 100 redemptions free, $0.30 each after. |
| Featured Boost | $29/week ($99/4 weeks) | One-time per boost | Temporary homepage spotlight for events, grand openings, seasonal promotions. 7-day expiration. |
| Custom Poll Template | $150/template | One-time per template | Industry-specific feedback polls tied to badge earning system. |
| QR Feedback Kit | $39/mo | Subscription | Branded QR codes + ongoing analytics for reviews at point of service. **(Coming Soon)** |
| Additional Photos (5-pack) | $9/mo | Subscription | 5 extra photos beyond base tier limit. |
| Analytics Pro | $19/mo | Subscription | Detailed views, clicks, and search analytics with export. |

**Fine Print:**
- Add-ons require an active Pro or Premium subscription. If the base subscription lapses, add-on features are suspended (not canceled) until the base is reactivated.
- QR Shield transaction fees capped at $0.60 per scan across all add-ons.
- Coupon Engine: first 100 redemptions per month are free; $0.30 per redemption after that.

### 3B. Command Center Add-Ons (Modules)

Modules are add-ons to the Command Center base tier. Each is individually priced.
Modules are NOT tier-locked — any Command Center tier can purchase any module.

#### Operator-Level Modules

| Module | Individual Price | What It Does |
|---|---|---|
| Weekly Trend Hunter | $149/mo | AI-generated content ideas every Monday, tailored to industry |
| Live Local Pulse | $149/mo | Real-time local opportunity scanner, refreshes every 3 hours |
| Campaigns | $199/mo | Full campaign manager — email sequences, outreach, multi-channel launch pipeline |
| Referral Network | $129/mo | Lead sharing, partner connections, referral tracking |
| **Operator Module Total (individual)** | **$626/mo** | |
| **Operator Module Bundle** | **$500/mo** | **Saves $126/mo (20% off)** |

#### Commander-Level Modules

| Module | Individual Price | What It Does |
|---|---|---|
| Booking System | $299/mo | AI booking agent, multi-resource Cal.com, SMS confirmation, call logs |
| Home Ledger / Property Passport | $249/mo | Property history, Stain tracking, FSM Handshake clearance, buyer-accessible records |
| Filing Cabinet | $229/mo | Technician voice note capture — Claude extracts model/serial numbers, asset decay signs |
| Content Creation Forge | $249/mo | Post drafting, review stage, launch pipeline, AI-polished blog and newsletter sync |
| Private Feedback Vault | $279/mo | Employee coaching loop, sentiment scoring, private feedback — never public |
| Technician Performance Radar | $199/mo | Performance visibility, job completion rates, customer satisfaction per tech |

#### Sovereign-Level Modules

| Module | Individual Price | What It Does |
|---|---|---|
| External CRM Bridge | $349/mo | ServiceTitan / Housecall Pro two-way sync, field status mirroring |
| Multi-Agent Expansion | $200/mo per agent | Separate AI agents for sales vs. service departments |
| Custom Persona Training | $500 one-time | Branded voice and personality for AI agent |
| Sentiment Analytics | $100/mo | Detailed sentiment reports, relationship save alerts |
| Advanced Dispatch | $250/mo | Emergency rescheduling, swap logic, crew optimization |
| Proactive Weather Engine | $150/mo | AI-triggered SMS alerts for storms, freezes, seasonal events |

### 3C. Home Ledger Add-Ons

> Home Ledger is both a Command Center module (see 3B) and a standalone product for
> homeowners/property managers. When standalone, it has its own add-on catalog.

| Add-On | Price | What It Unlocks |
|---|---|---|
| Stain Tracking Pro | TBD | Advanced stain history with photo timeline and decay prediction |
| Property Transfer Kit | TBD | Buyer-accessible records package for home sales |
| Multi-Property Dashboard | TBD | Manage multiple properties from one account |

> Home Ledger standalone pricing and add-ons are TBD — will be defined in a future update to this document

---

## FEATURE GATING — How It Works

Feature access is determined by the **union** of three sources:

```
┌─────────────────────────────────┐
│  1. Base Tier Limits            │  ← plans + plan_feature_overrides tables
│     (free/pro/premium or        │
│      operator/commander/        │
│      sovereign)                 │
├─────────────────────────────────┤
│  2. Active Add-On Flags         │  ← addon_subscriptions table (NEW)
│     (coupon_engine, booking,    │     Each active add-on sets its own
│      featured_boost, etc.)      │     feature flags to true
├─────────────────────────────────┤
│  3. Account-Level Overrides     │  ← account_feature_overrides table
│     (founding member perks,     │     Admin-set per-account exceptions
│      custom deals, etc.)        │
└─────────────────────────────────┘

         ↓ merged via "most permissive wins" ↓

┌─────────────────────────────────┐
│  Resolved Feature Map           │  ← what the UI actually checks
│  { coupon_engine: true,         │
│    photos_max: 10,              │
│    booking_engine: false, ... } │
└─────────────────────────────────┘
```

### Tier-Based Feature Flags (Layer 1)

These are set by the base subscription plan. Defined in `plan_feature_overrides`.

| Feature Flag | Free | Pro ($45) | Premium ($89) |
|---|---|---|---|
| `photos_max` | 0 | 2 | 10 |
| `verified_badge` | false | true | true |
| `cta_buttons` | false | true | true |
| `featured_placement` | false | false | true |
| `analytics_basic` | true | true | true |
| `analytics_advanced` | false | true | true |
| `badge_earning` | false | false | true |
| `priority_search` | false | true | true |
| `priority_support` | false | false | true |
| `property_intelligence` | false | true | true |
| `search_weight` | 1 | 3 | 5 |
| `transaction_fee` | 0.60 | 0.60 | 0.60 |
| `marketplace_access` | true | true | true |
| `addon_eligible` | false | true | true |

| Feature Flag | Operator | Commander | Sovereign |
|---|---|---|---|
| `command_center` | true | true | true |
| `crm_included` | false | true | true |
| `property_intelligence` | false | true | true |
| `external_crm_bridge` | false | false | true |
| `team_members_max` | 3 | 10 | 25 |
| `transaction_fee` | 0 | 0 | 0 |

### Future Product Feature Flags (Pre-Provisioned)

These flags exist in the DB now (default: `false`) so the system is ready to flip them on
without schema changes when their products launch.

| Feature Flag | Default | Activates When |
|---|---|---|
| `entertainment_loops` | `false` | 500 paying directory businesses reached |
| `home_ledger_standalone` | `false` | Home Ledger standalone product launches |

### Add-On Feature Flags (Layer 3) — NEW

Each add-on, when active, sets its own feature flags. These are resolved alongside
tier flags using the same "most permissive wins" strategy.

| Add-On | Feature Flags Set When Active |
|---|---|
| Coupon Engine | `addon_coupon_engine: true`, `coupon_max_free_redemptions: 100`, `coupon_overage_fee: 0.30` |
| Featured Boost | `addon_featured_boost: true`, `featured_boost_expires_at: <timestamp>` |
| Custom Poll Template | `addon_custom_polls: true`, `custom_poll_count: <purchased count>` |
| QR Feedback Kit | `addon_qr_feedback: true` |
| Additional Photos | `photos_max: +5` (additive to tier limit) |
| Analytics Pro | `addon_analytics_pro: true`, `analytics_export: true` |
| Booking System | `booking_engine: true`, `ai_booking_agent: true`, `sms_confirmations: true` |
| Home Ledger | `home_ledger: true`, `property_passport: true`, `stain_tracking: true` |
| Filing Cabinet | `filing_cabinet: true`, `voice_note_capture: true` |
| Content Creation Forge | `content_forge: true`, `blog_sync: true`, `newsletter_sync: true` |
| Private Feedback Vault | `feedback_vault: true`, `sentiment_scoring: true` |
| Tech Performance Radar | `tech_radar: true`, `job_completion_tracking: true` |

### Gate Check Logic (Pseudocode)

```typescript
// Current: feature-gates.ts only checks tier
// NEW: resolveFeatures() merges tier + add-ons + account overrides

function canAccessFeature(accountId, feature) {
  const resolved = await resolveFeatures(accountId);
  return hasFeature(resolved, feature);
}

// Example: Does this Pro tenant have coupon access?
// Without Coupon Engine add-on: addon_coupon_engine = false → LOCKED
// With Coupon Engine add-on:    addon_coupon_engine = true  → UNLOCKED

// Example: Does this Premium tenant have booking access?
// Without Booking add-on: booking_engine = false → LOCKED
// With Booking add-on:    booking_engine = true  → UNLOCKED
```

### Prerequisite Enforcement

Some add-ons require a minimum base tier. This is enforced at **purchase time**, not at
feature resolution time.

| Add-On Category | Minimum Tier Required |
|---|---|
| Directory Add-Ons | Pro or Premium (not Free) |
| Command Center Modules | Any Command Center tier (Operator+) |
| Home Ledger Add-Ons | Home Ledger module or standalone subscription |

If a base subscription lapses:
- Add-on subscriptions are **suspended** (not canceled)
- Add-on feature flags resolve to `false` while suspended
- Reactivating the base subscription automatically reactivates suspended add-ons
- Stripe webhooks handle the suspend/reactivate lifecycle

---

## DB SCHEMA — Add-On Support

### Current State (V1)

Add-ons are stored as a JSON blob in `directory_listings.metadata.addons`:
```json
{ "coupon_engine": { "active": true, "purchased_at": "..." } }
```
This is checked inline: `listing.metadata?.addons?.coupon_engine?.active`

### Target State (V2) — Formal Add-On Tables

```sql
-- New table: addon_products (catalog of available add-ons)
CREATE TABLE addon_products (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,          -- 'coupon_engine', 'booking_system', etc.
  system TEXT NOT NULL,               -- 'directory', 'command_center', 'home_ledger'
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  billing_mode TEXT NOT NULL,         -- 'subscription' | 'one_time' | 'weekly'
  billing_interval TEXT,              -- 'month' | 'week' | NULL (for one_time)
  min_tier TEXT,                      -- minimum base tier required (NULL = any)
  stripe_price_id TEXT,
  feature_flags JSONB NOT NULL,       -- flags this add-on sets when active
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- New table: addon_subscriptions (per-account active add-ons)
CREATE TABLE addon_subscriptions (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES auth.users(id),
  listing_id UUID,                    -- NULL for account-level add-ons
  addon_product_id UUID NOT NULL REFERENCES addon_products(id),
  stripe_subscription_id TEXT,
  status TEXT NOT NULL,               -- 'active' | 'suspended' | 'canceled'
  quantity INTEGER DEFAULT 1,         -- for "per agent" or "per template" pricing
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,             -- for one-time purchases with expiration (Featured Boost)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Feature Resolution (Updated)

`lib/services/feature-resolution.ts` will be updated to:

1. Load base plan feature overrides (existing)
2. Load active addon_subscriptions for the account
3. For each active add-on, merge its `addon_products.feature_flags` into the resolved map
4. Apply account-level overrides (founding member perks, custom deals)
5. Return the merged feature map

The existing `metadata.addons` JSON blob approach in `directory_listings` will be
**migrated** to the new `addon_subscriptions` table. The migration will:
- Read all `directory_listings.metadata.addons` entries
- Create corresponding `addon_subscriptions` rows
- Keep `metadata.addons` as a read-only cache (deprecated) during transition

---

## STALE REFERENCES — Cleanup Status

> Last audit: March 2026

### Stale Pricing — RESOLVED

| File | Problem | Status |
|---|---|---|
| `supabase/migrations/029_seed_subscription_data.sql` | Had $29 Pro / $79 CC / $99 bundle | FIXED — Now $45/$89 directory, $1,500/$2,500/$3,500 CC tiers |
| `docs/PROJECT_BIBLE.md` | Had legacy $1,000/mo and $2,500 setup | FIXED — Updated to match canonical pricing |
| `docs/brainstorming/pricing-strategy.md` | TBD prices, brainstorming ranges | SUPERSEDED — This document is the SOT |

### Stale Naming ("God Mode" → "Greenline HQ") — RESOLVED

Internal DB role `super_admin` stays as-is (internal only, never user-facing).

| File | Status |
|---|---|
| `QUICKSTART_DAILY_TREND_HUNTER.md` | ALREADY FIXED — no God Mode references remain |
| `FEATURE_LIST_FOR_PM.md` | ALREADY FIXED — no God Mode references remain |
| `FEATURE_INVENTORY.md` | ALREADY FIXED — no God Mode references remain |
| `components/editor/index.ts` | ALREADY FIXED — no God Mode references remain |
| `components/editor/EditableRegion.tsx` | ALREADY FIXED — no God Mode references remain |
| `components/editor/AdminEditModeContext.tsx` | ALREADY FIXED — no God Mode references remain |
| `app/robots.ts` | ALREADY FIXED — `/god-mode/` was already removed |
| `.emergent/summary.txt` | ALREADY FIXED — says "Greenline HQ" |
| `database/migrations/001_fix_rls_policies.sql` | FIXED — comment updated |
| `database/migrations/008_entitlement_access_system.sql` | FIXED — comment updated |

---

## RELATED DOCUMENTS

- `docs/archive/pricing-strategy.md` — Historical brainstorming (superseded by this doc, archived)
- `docs/brainstorming/founding-members-SOT.md` — Full founding member offer details
- `webapp/lib/feature-gates.ts` — Directory tier feature gates (V1, needs V2 update)
- `webapp/lib/services/feature-resolution.ts` — Feature resolution service (needs add-on support)
- `webapp/lib/feature-registry.ts` — Legacy operator/commander/sovereign registry
- `webapp/app/api/directory/addons/route.ts` — Existing add-on purchase API (V1)
- `webapp/supabase/migrations/028_subscription_tier_system.sql` — Subscription schema
- `webapp/supabase/migrations/029_seed_subscription_data.sql` — Seed data (STALE)

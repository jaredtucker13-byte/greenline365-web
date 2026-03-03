# Content Intelligence Engine (CIE) — Implementation Spec

> **Source of Truth Document**
> Canonical Repo: `greenline365-web` (V1)
> Date: 2026-03-02
> Status: DRAFT — Awaiting Approval

---

## 0. Governing Decisions

| # | Decision | Detail |
|---|----------|--------|
| 1 | **Canonical repo** | `greenline365-web` (V1). Merge useful V2 pieces in, then archive V2. |
| 2 | **Design direction** | Champagne gold `#C9A96E`. Purge all sage green `#84A98C`. |
| 3 | **Pricing SOT** | 3-layer model: (1) Base tiers — Directory Free/$45/$89, CC $1,500/$2,500/$3,500. (2) Bundle discounts. (3) Modular add-ons per system. See `docs/specs/pricing.md`. Kill all $299/$499/$899 references. |
| 4 | **Content distribution** | (1) Manual download/copy from Forge → (2) Email via SendGrid/Nodemailer → (3) Social channels last (requires dev-tier OAuth). |
| 5 | **Admin portal naming** | **Greenline HQ** is the canonical name for the super-admin portal. Kill all references to "God Mode" and "Super Admin" in UI text and comments. Route: `/greenline-hq`. DB role: `super_admin` (internal only, never user-facing). |
| 6 | **Platform architecture** | Four-sided engine: (1) Community Directory, (2) B2B SaaS Command Center, (3) GL365 Home Ledger, (4) Entertainment Loops. See `docs/specs/pricing.md` Layer 1. |

---

## 0.5. Phase 0 — Security Prerequisites (BLOCKING)

> **No new features ship until Phase 0 is complete.**
> These are critical security and infrastructure fixes identified in the March 2, 2026 platform report.

### 0.5.1 CRM Multi-Tenancy Breach — RLS Audit

**Problem:** Separate tenants are currently sharing CRM data. This is a data leak.

**Required action:**
1. Audit every Supabase table for Row-Level Security (RLS) status
2. Verify `tenant_id` / `account_id` filtering is enforced on all CRM-related tables
3. Confirm that `addon_subscriptions` (new table from pricing spec) includes RLS from day one
4. Run the existing migration `00002_full_rls_coverage.sql` against current production schema and verify coverage

**Verification:**
```sql
-- Run this query. Every table should have rls_enabled = true.
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Tables to prioritize** (CRM data, highest breach risk):
- `contacts`, `crm_*` tables — must filter by `account_id`
- `bookings`, `scheduled_content` — must filter by `account_id` or `listing_id` ownership
- `addon_subscriptions` (new) — must filter by `account_id`
- `payment_events`, `payment_transactions` — must filter by subscription ownership

### 0.5.2 Greenline HQ Access Lock

**Problem:** Access to high-level admin tools (API Costs, Audit Logs, Greenline HQ) must be locked to specific super-admin emails.

**Current state:** `middleware.ts` already gates `/greenline-hq` routes behind `user_metadata.role === 'super_admin'`. Verify this is working and not bypassable.

**Required:**
- Lock Greenline HQ access to a whitelist of emails (not just any user with `super_admin` role)
- Show a "System Operator" badge in the header ONLY when Greenline HQ mode is active
- Greenline HQ must never appear in navigation for non-super-admin users

### 0.5.3 Navigation Single-Source Refactor

**Problem:** Tablet and laptop views display different features due to separate nav implementations (Desktop Sidebar vs. Mobile Drawer).

**Required:**
- Refactor both navigation components to pull from a single `navConfig` source
- Navigation items must be feature-gated per the 3-layer pricing model (a tenant on Pro sees different nav items than an Operator + Forge add-on)
- Use `resolveFeatures()` to determine which nav items appear for each tenant

### 0.5.4 Universal Sign-Out

**Problem:** "Sign Out" option must be verified and present in the top-right header across all device breakpoints (mobile, tablet, desktop).

### 0.5.5 Phase 0 Exit Criteria

Phase 0 is complete when:
- [ ] Every public Supabase table has RLS enabled (zero exceptions)
- [ ] CRM data is isolated by `tenant_id` / `account_id` (verified with cross-tenant query test)
- [ ] Greenline HQ access is email-whitelisted and badge shows only when active
- [ ] Navigation pulls from a single source and is feature-gated
- [ ] Sign-out works on all breakpoints

---

## 1. The Problem: What's Disconnected

The codebase has all the raw ingredients but they don't talk to each other:

| Component | File(s) | Status |
|-----------|---------|--------|
| Content Forge v1 (modal) | `app/admin-v2/components/ContentForge.tsx` | Built — creates content for photo/product/blog |
| Content Forge v2 (blueprints) | `app/admin-v2/components/ContentForge2.tsx` | Built — generates AI content with scoring, 4-week calendar, repurpose |
| Forge API | `app/api/content-forge-2/route.ts` | Built — blueprints, generate, repurpose, calendar_generate |
| Drafts Panel | `app/admin-v2/components/DraftsPanel.tsx` | Built — manages draft/scheduled items |
| Drafts API | `app/api/drafts/route.ts` | Built — CRUD on `scheduled_content` table |
| Unified Calendar | `app/admin-v2/calendar/page.tsx` | Built — reads from 4+ sources, display only |
| Calendar API | `app/api/calendar/unified/route.ts` | Built — aggregates bookings, content, campaigns, blogs |
| HybridCalendar component | `app/admin-v2/components/HybridCalendar.tsx` | Built — glassmorphism render component |
| Campaign Manager | `app/admin-v2/campaigns/page.tsx` | Built — Kanban pipeline + email sequences |
| SendGrid sender | `lib/email/sendgrid-sender.ts` | Built — batch send up to 1000/request |
| Gmail/Nodemailer sender | `lib/email/gmail-sender.ts` | Built — 500/day SMTP |
| Email send API | `app/api/email/send/route.ts` | Built — single/multi send with template vars |
| Email campaigns API | `app/api/email/campaigns/route.ts` | Built — campaign CRUD |
| Email templates API | `app/api/email/templates/route.ts` | Built — template management |
| Blast deals outblast | `app/api/blast-deals/outblast/route.ts` | Built — batch email with tracking |
| Social connections API | `app/api/social/route.ts` | **Framework only** — OAuth connect/disconnect/verify, no posting |
| Schedule Blast function | `supabase/functions/schedule-blast/index.ts` | **Simulated** — schedule/publish/cancel actions, platform posting stubbed |
| WeeklyTrendBatch | `app/admin-v2/components/WeeklyTrendBatch.tsx` | Built — batch content scheduling |
| Content types definition | `app/admin-v2/lib/types.ts` | Built — ContentItem, CalendarEvent, Booking, etc. |

**The gap:** Forge creates content. Drafts stores it. Calendar displays it. Email can send it. But there is no **lifecycle controller** that moves a piece of content from creation → review → schedule → distribute → measure. Each component operates independently.

---

## 2. Content Lifecycle State Machine

### 2.1 States

```
┌──────────┐     ┌──────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  IDEATED  │────▶│  DRAFTED  │────▶│ REVIEWING │────▶│ SCHEDULED │────▶│ PUBLISHED │
└──────────┘     └──────────┘     └───────────┘     └───────────┘     └───────────┘
                       │                │                  │                  │
                       │                │                  │                  │
                       ▼                ▼                  ▼                  ▼
                 ┌───────────┐   ┌───────────┐     ┌───────────┐     ┌───────────┐
                 │  ARCHIVED  │   │  REJECTED  │     │ CANCELLED │     │  MEASURED  │
                 └───────────┘   └───────────┘     └───────────┘     └───────────┘
```

| State | Description | Who triggers | Where it lives today |
|-------|-------------|--------------|---------------------|
| `ideated` | Calendar slot reserved, no content yet. Created by 4-week calendar generator. | Forge v2 `calendar_generate` action | `content_calendar.publish_status = 'planned'` |
| `drafted` | Content generated or written. Has title, body, scores. | Forge v2 `generate` action or manual edit | `content_pieces.status = 'draft'` + `content_calendar.publish_status = 'drafted'` |
| `reviewing` | Content flagged for human review before scheduling. | User clicks "Review" in DraftsPanel | `content_calendar.publish_status = 'reviewing'` |
| `scheduled` | Content approved, locked to a publish date/time + distribution channels. | User approves in DraftsPanel or auto-approve if score ≥ threshold | `scheduled_content.status = 'scheduled'` + `content_calendar.publish_status = 'scheduled'` |
| `published` | Content distributed to at least one channel. | Distribution engine confirms delivery | `scheduled_content.status = 'published'` + `content_calendar.publish_status = 'published'` |
| `measured` | 48h+ post-publish, performance data collected. | Cron job / background function | `content_pieces` performance columns populated |
| `archived` | Draft abandoned before review. | User action | `content_pieces.status = 'archived'` |
| `rejected` | Reviewed and rejected. | User action during review | `content_calendar.publish_status = 'rejected'` |
| `cancelled` | Was scheduled, then pulled. | User action or system (e.g., expired trend) | `scheduled_content.status = 'cancelled'` |

### 2.2 Transition Rules

```typescript
// New file: lib/content-engine/lifecycle.ts

type ContentState =
  | 'ideated'
  | 'drafted'
  | 'reviewing'
  | 'scheduled'
  | 'published'
  | 'measured'
  | 'archived'
  | 'rejected'
  | 'cancelled';

const VALID_TRANSITIONS: Record<ContentState, ContentState[]> = {
  ideated:    ['drafted', 'archived'],
  drafted:    ['reviewing', 'scheduled', 'archived'],   // skip review if auto-approve
  reviewing:  ['scheduled', 'rejected', 'drafted'],     // reject sends back or kills
  scheduled:  ['published', 'cancelled', 'drafted'],    // unschedule reverts to draft
  published:  ['measured'],                              // one-way after publish
  measured:   [],                                        // terminal
  archived:   ['drafted'],                               // can resurrect
  rejected:   ['drafted'],                               // can revise
  cancelled:  ['drafted'],                               // can reschedule
};
```

### 2.3 Auto-Approve Logic

Content can skip `reviewing` and go straight from `drafted` → `scheduled` when:

- Quality `overall_score` ≥ 80 (from Forge v2 scoring)
- Content matches an existing approved blueprint
- Business has auto-approve enabled in settings

This uses the existing scoring system in `ContentForge2.tsx` which already calculates `hook_score`, `structure_score`, `value_score`, `cta_score`, `readability_score`.

### 2.4 Database Alignment

**Problem:** Two overlapping tables track content state:
- `content_calendar` (from migration `005_content_forge_2.sql`) — has `publish_status`
- `scheduled_content` (from migration `006_scheduled_content_table.sql`) — has `status`

**Solution:** `content_calendar` is the **authoritative state record**. `scheduled_content` becomes a **distribution-only table** — it's written to only when content enters `scheduled` state, and tracks the distribution job.

```sql
-- New migration: XXX_align_content_lifecycle.sql

-- Add missing states to content_calendar
ALTER TABLE content_calendar
  DROP CONSTRAINT IF EXISTS content_calendar_publish_status_check;
ALTER TABLE content_calendar
  ADD CONSTRAINT content_calendar_publish_status_check
  CHECK (publish_status IN (
    'ideated', 'drafted', 'reviewing', 'scheduled',
    'published', 'measured', 'archived', 'rejected', 'cancelled'
  ));

-- Add lifecycle tracking columns
ALTER TABLE content_calendar
  ADD COLUMN IF NOT EXISTS transitioned_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS transitioned_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS previous_status TEXT,
  ADD COLUMN IF NOT EXISTS distribution_channels TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE;

-- Link content_calendar to scheduled_content for distribution tracking
ALTER TABLE scheduled_content
  ADD COLUMN IF NOT EXISTS calendar_entry_id UUID REFERENCES content_calendar(id);
```

---

## 3. Queue & Batching Architecture

### 3.1 Overview

Content flows through a **three-stage pipeline**:

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  FORGE       │────▶│  REVIEW QUEUE     │────▶│  DISTRIBUTION QUEUE  │
│  (creation)  │     │  (human/auto)     │     │  (channel delivery)  │
└─────────────┘     └──────────────────┘     └─────────────────────┘
```

### 3.2 Stage 1: Forge → Content Creation

**Existing files that handle this:**
- `app/admin-v2/components/ContentForge2.tsx` — UI for blueprint selection + generation
- `app/api/content-forge-2/route.ts` — API with actions: `blueprints`, `generate`, `repurpose`, `calendar_generate`
- `supabase/migrations/005_content_forge_2.sql` — 7 blueprint templates

**What needs to change:**
- `calendar_generate` action currently creates calendar entries but doesn't link them to `content_pieces`. Wire the output so each generated slot creates both a `content_calendar` row (state: `ideated`) and a stub `content_pieces` row.
- `generate` action currently returns content but doesn't persist lifecycle state. After generation, update `content_calendar.publish_status` to `drafted` and populate `content_pieces` with the generated body + scores.

### 3.3 Stage 2: Review Queue

**Existing file that partially handles this:**
- `app/admin-v2/components/DraftsPanel.tsx` — shows drafts and scheduled items in tabs

**What needs to change:**

Add a third tab: **"Review"** — shows all items in `reviewing` state.

```
┌─────────────────────────────────────────────┐
│  [Drafts]    [Review]    [Scheduled]         │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │ Blog: "5 Spring Lawn Tips"          │    │
│  │ Score: 87/100  Blueprint: answer_vault│   │
│  │ Scheduled for: Mar 15               │    │
│  │ Channels: [Email] [Download]        │    │
│  │                                      │    │
│  │ [✓ Approve]  [✎ Edit]  [✗ Reject]  │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Review actions map to lifecycle transitions:**
- Approve → `reviewing` → `scheduled` (writes to `scheduled_content` with distribution channels)
- Edit → `reviewing` → `drafted` (opens in Forge for revision)
- Reject → `reviewing` → `rejected` (with optional rejection reason)

### 3.4 Stage 3: Distribution Queue

**Existing files that partially handle this:**
- `supabase/functions/schedule-blast/index.ts` — has schedule/publish_now/cancel/list actions, platform posting **simulated**
- `app/api/email/send/route.ts` — sends via SendGrid
- `lib/email/sendgrid-sender.ts` — SendGrid transport
- `lib/email/gmail-sender.ts` — Nodemailer transport
- `app/api/blast-deals/outblast/route.ts` — batch email with tracking

**New file needed:** `lib/content-engine/distribution-queue.ts`

```typescript
// Distribution Queue Processor
// Runs on a cron schedule (every 15 minutes) or triggered manually

interface DistributionJob {
  id: string;
  calendar_entry_id: string;       // FK to content_calendar
  content_piece_id: string;        // FK to content_pieces
  scheduled_content_id: string;    // FK to scheduled_content
  channel: DistributionChannel;
  scheduled_for: string;           // ISO datetime
  status: 'pending' | 'processing' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  last_error: string | null;
  delivered_at: string | null;
}

type DistributionChannel =
  | 'download'      // Phase 1: Manual download/copy
  | 'email_sendgrid' // Phase 2: SendGrid batch
  | 'email_gmail'    // Phase 2: Gmail SMTP (fallback / low-volume)
  | 'facebook'       // Phase 3: Requires OAuth
  | 'twitter'        // Phase 3: Requires OAuth
  | 'instagram'      // Phase 3: Requires OAuth
  | 'linkedin'       // Phase 3: Requires OAuth
  | 'youtube';       // Phase 3: Requires OAuth
```

### 3.5 Distribution Priority & Phasing

#### Phase 1: Manual Download/Copy (REFINE — already partially exists)

**What exists:**
- Forge v2 generates content with repurposed versions (twitter_thread, linkedin_post, instagram_caption, email_version, video_script) stored in `content_pieces`
- No unified "export" or "copy to clipboard" UI

**What to build:**
- Add an **Export Panel** to the Forge output view:
  - "Copy to Clipboard" button per format (blog, tweet thread, LinkedIn, email, video script)
  - "Download as .docx" / "Download as .txt" for the full piece
  - "Download All Formats (.zip)" for bulk export
- This is the **simplest, highest-value** distribution — content is ready, just needs a clean way to get it out.

**File to modify:** `app/admin-v2/components/ContentForge2.tsx`
**New component:** `app/admin-v2/components/ContentExportPanel.tsx`

#### Phase 2: Email Distribution (REFINE — infrastructure exists)

**What exists:**
- SendGrid integration with batch send (`lib/email/sendgrid-sender.ts`)
- Gmail/Nodemailer integration (`lib/email/gmail-sender.ts`)
- Email campaign CRUD (`app/api/email/campaigns/route.ts`)
- Email template management (`app/api/email/templates/route.ts`)
- Blast email with tracking (`app/api/blast-deals/outblast/route.ts`)
- Campaign sequence sender (`app/api/campaigns/[id]/send/route.ts`)

**What to wire together:**
- When content enters `scheduled` state with `email` as a distribution channel:
  1. Distribution queue creates an email job
  2. Job pulls the `email_version` from `content_pieces`
  3. Job resolves recipient list from the business's subscriber/contact list
  4. Job calls existing `app/api/email/send/route.ts` with the rendered template
  5. On success: mark job `delivered`, update `content_calendar.publish_status` → `published`
  6. On failure: mark job `retrying`, exponential backoff (max 3 attempts)

**New file:** `lib/content-engine/channels/email-channel.ts`

```typescript
// Wraps existing SendGrid/Gmail senders with distribution queue contract
import { sendViaSendGrid } from '@/lib/email/sendgrid-sender';
import { sendViaGmail } from '@/lib/email/gmail-sender';

interface EmailDistributionConfig {
  preferredSender: 'sendgrid' | 'gmail';  // SendGrid for bulk, Gmail for low-vol
  fallbackEnabled: boolean;                 // Try Gmail if SendGrid fails
  maxRecipientsPerBatch: number;           // 1000 for SendGrid, 50 for Gmail
  throttleMs: number;                       // 200ms between Gmail sends
}
```

#### Phase 3: Social Channels (BUILD — framework exists, posting does not)

**What exists:**
- `app/api/social/route.ts` — OAuth connect/disconnect/verify for Instagram, Facebook, Twitter/X, LinkedIn
- `supabase/functions/schedule-blast/index.ts` — platform selection framework, posting **simulated**
- Repurposed content versions already generated by Forge v2

**What's required before this works:**
- Developer-tier approval from each platform (Meta Business, Twitter API v2 Pro, LinkedIn Marketing API)
- OAuth consent screen review/approval
- Platform-specific posting API integration (replace simulated calls in schedule-blast)

**New files (Phase 3 only):**
- `lib/content-engine/channels/facebook-channel.ts`
- `lib/content-engine/channels/twitter-channel.ts`
- `lib/content-engine/channels/instagram-channel.ts`
- `lib/content-engine/channels/linkedin-channel.ts`
- `lib/content-engine/channels/youtube-channel.ts`

**Each channel implements:**
```typescript
interface DistributionChannelHandler {
  canPublish(businessId: string): Promise<boolean>;  // checks OAuth token validity
  publish(job: DistributionJob): Promise<DistributionResult>;
  getMetrics(postId: string): Promise<PostMetrics>;  // for measured state
}
```

---

## 4. Connecting the Disconnected Pieces

### 4.1 The Wiring Diagram

```
User clicks
"Generate 4-Week Calendar"
        │
        ▼
┌──────────────────┐   POST /api/content-forge-2
│  ContentForge2   │──────────────────────────────────┐
│  (create tab)    │   action: calendar_generate      │
└──────────────────┘                                  │
                                                      ▼
                                              ┌──────────────┐
                                              │ content_calendar│
                                              │ status: ideated │
                                              └───────┬──────┘
User clicks "Generate"                               │
on a calendar slot                                    │
        │                                             │
        ▼                                             ▼
┌──────────────────┐   POST /api/content-forge-2  ┌──────────────┐
│  ContentForge2   │──────────────────────────────▶│content_pieces│
│  (slot detail)   │   action: generate           │status: draft │
└──────────────────┘                              └──────┬───────┘
                                                         │
                          ┌──────────────────────────────┘
                          ▼
                   ┌─────────────┐
                   │ DraftsPanel  │  score ≥ 80?
                   │ Review tab   │──── YES ──▶ auto-approve
                   └──────┬──────┘                │
                     NO   │                       │
                          ▼                       ▼
                   ┌─────────────┐        ┌──────────────┐
                   │  Human      │        │scheduled_content│
                   │  Review     │───────▶│status: scheduled│
                   └─────────────┘        └──────┬───────┘
                                                  │
                          ┌───────────────────────┘
                          ▼
                   ┌──────────────────┐
                   │ Distribution Queue │
                   │ (cron: every 15m)  │
                   └──────┬───────────┘
                          │
              ┌───────────┼────────────┐
              ▼           ▼            ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │ Download │ │ Email  │ │ Social   │
        │ (ready)  │ │(SendGrid│ │(Phase 3) │
        │          │ │/Gmail) │ │          │
        └──────────┘ └────────┘ └──────────┘
              │           │            │
              ▼           ▼            ▼
        ┌─────────────────────────────────┐
        │    content_calendar              │
        │    status: published             │
        └──────────────┬──────────────────┘
                       │ 48h later (cron)
                       ▼
        ┌─────────────────────────────────┐
        │    content_pieces                │
        │    views, shares, conversions    │
        │    status: measured              │
        └─────────────────────────────────┘
```

### 4.2 Files to Create (New)

| File | Purpose |
|------|---------|
| `lib/content-engine/lifecycle.ts` | State machine: valid transitions, transition function, audit log |
| `lib/content-engine/distribution-queue.ts` | Queue processor: poll scheduled items, dispatch to channels |
| `lib/content-engine/channels/email-channel.ts` | Wraps existing SendGrid/Gmail senders |
| `lib/content-engine/channels/download-channel.ts` | Marks content as available for manual export |
| `app/admin-v2/components/ContentExportPanel.tsx` | Copy/download UI for Forge output |
| `app/api/content-engine/transition/route.ts` | API endpoint for lifecycle state changes |
| `app/api/content-engine/queue/route.ts` | API endpoint for queue status/manual trigger |
| `supabase/migrations/XXX_align_content_lifecycle.sql` | Schema alignment migration |

### 4.3 Files to Modify (Existing)

| File | Change |
|------|--------|
| `app/admin-v2/components/ContentForge2.tsx` | Wire `calendar_generate` to create linked `content_calendar` + `content_pieces` rows. Add Export Panel integration. |
| `app/admin-v2/components/DraftsPanel.tsx` | Add "Review" tab. Wire approve/reject to lifecycle transitions via new API. |
| `app/api/content-forge-2/route.ts` | `generate` action persists to `content_pieces` and updates `content_calendar` status. `calendar_generate` creates linked rows. |
| `app/api/drafts/route.ts` | PUT endpoint calls lifecycle transition instead of direct status update. |
| `app/admin-v2/calendar/page.tsx` | Add status badges per lifecycle state. Add click-to-transition actions (e.g., click scheduled item → see distribution status). |
| `app/api/calendar/unified/route.ts` | Include `publish_status` and `distribution_channels` in response. |
| `supabase/functions/schedule-blast/index.ts` | Replace simulated posting with calls to channel handlers. |
| `app/admin-v2/lib/types.ts` | Add `ContentState`, `DistributionJob`, `DistributionChannel` types. |

---

## 5. Unified Calendar Integration

### 5.1 Current State

The calendar at `app/admin-v2/calendar/page.tsx` already aggregates:
- Bookings (blue `#3B82F6`)
- Content (gold `#C9A96E`)
- Campaign emails (amber `#F59E0B`)
- Newsletters (purple `#8B5CF6`)
- Blogs (pink `#EC4899`)

### 5.2 Enhancement: Lifecycle-Aware Calendar

Each content event on the calendar should show its lifecycle state as a visual indicator:

```
┌─────────────────────────────────────────┐
│  March 15                                │
│  ┌───────────────────────────────────┐  │
│  │ ● "5 Spring Lawn Tips"            │  │
│  │   ◉ SCHEDULED — Email @ 9am      │  │
│  │   Score: 87  Blueprint: answer_vault│ │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ ○ "Local Gardener Spotlight"      │  │
│  │   ◎ DRAFTED — Needs review        │  │
│  │   Score: 72  Blueprint: truth_bomb │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

State indicators:
  ○ ideated (empty circle — slot reserved)
  ◐ drafted (half circle — content exists)
  ◎ reviewing (target — awaiting approval)
  ◉ scheduled (filled circle — locked in)
  ● published (solid dot — live)
  ◈ measured (diamond — has performance data)
```

### 5.3 Calendar → Action Shortcuts

Clicking a calendar item opens a context-appropriate action panel:

| Current State | Available Actions |
|---------------|-------------------|
| `ideated` | Generate content (opens Forge with pre-filled slot data) |
| `drafted` | Edit, Send to review, Quick-schedule (if score ≥ 80) |
| `reviewing` | Approve, Edit, Reject |
| `scheduled` | View distribution plan, Cancel, Reschedule |
| `published` | View performance, Copy link, Export |
| `measured` | Full analytics view, Repurpose (create new from winning content) |

---

## 6. Pricing Gate Integration (3-Layer Model)

> **Reference:** `docs/specs/pricing.md` is the canonical pricing SOT.
> CIE features are gated by the **union** of Layer 1 (base tier) + Layer 3 (active add-ons).
> See pricing spec for the full 3-layer architecture.

### 6.1 Layer 1 — Base Tier Limits (CIE Features)

#### Directory Tiers (Consumer-Facing Listings)

| Feature | Free | Pro ($45/mo) | Premium ($89/mo) |
|---------|------|--------------|-------------------|
| Basic listing | ✓ | ✓ | ✓ |
| Content Forge (manual) | — | 5 pieces/mo | 20 pieces/mo |
| Calendar view | — | Read-only | Full edit |
| Email distribution | — | — | 100 sends/mo |
| Export/download | — | ✓ | ✓ |
| Add-on eligible | — | ✓ | ✓ |

#### Command Center Tiers (Full CIE Access)

| Feature | Operator ($1,500/mo) | Commander ($2,500/mo) | Sovereign ($3,500/mo) |
|---------|----------------------|-----------------------|-----------------------|
| Content Forge | Unlimited | Unlimited | Unlimited |
| Blueprints | All 7 | All 7 + custom | All 7 + custom |
| Calendar | Full lifecycle | Full lifecycle | Full lifecycle |
| Review queue | Manual only | Manual + auto-approve | Manual + auto-approve |
| Email distribution | 1,000 sends/mo | 5,000 sends/mo | 25,000 sends/mo |
| Social channels | — | 2 channels | All channels |
| Export/download | ✓ | ✓ | ✓ |
| Performance analytics | Basic | Full | Full + AI insights |
| Repurpose formats | 3 | All | All |
| Add-on eligible | ✓ | ✓ | ✓ |

### 6.2 Layer 3 — Add-On Feature Unlocks (CIE-Relevant)

Add-ons are purchased independently and unlock features **on top of** the base tier.
A tenant on Pro who buys the Content Creation Forge add-on gets Forge access;
a Pro tenant without it stays locked out. Same logic across all add-ons.

| Add-On | System | Feature Flags Unlocked | Min Tier |
|--------|--------|------------------------|----------|
| Content Creation Forge | Command Center | `content_forge: true`, `blog_sync: true`, `newsletter_sync: true` | Any CC tier |
| Campaigns | Command Center | `campaigns: true`, `email_sequences: true` | Any CC tier |
| Weekly Trend Hunter | Command Center | `trend_hunter: true`, `weekly_content_ideas: true` | Any CC tier |
| Live Local Pulse | Command Center | `local_pulse: true` | Any CC tier |
| Coupon Engine | Directory | `addon_coupon_engine: true` | Pro or Premium |
| Featured Boost | Directory | `addon_featured_boost: true` | Pro or Premium |
| Custom Poll Template | Directory | `addon_custom_polls: true` | Pro or Premium |
| Analytics Pro | Directory | `addon_analytics_pro: true`, `analytics_export: true` | Pro or Premium |

### 6.3 Resolved Feature Example

A tenant's effective CIE access = base tier limits + active add-on flags:

```
Example 1: Pro ($45) + no add-ons
  content_forge = false       ← not unlocked by Pro or any add-on
  addon_coupon_engine = false  ← no Coupon Engine add-on
  photos_max = 2              ← Pro tier limit
  email_sends_per_month = 0   ← Pro directory has no email sends

Example 2: Pro ($45) + Coupon Engine ($19) + Analytics Pro ($19)
  content_forge = false       ← still not unlocked
  addon_coupon_engine = true   ← Coupon Engine add-on active
  addon_analytics_pro = true   ← Analytics Pro add-on active
  analytics_export = true      ← unlocked by Analytics Pro
  photos_max = 2              ← Pro tier limit (unchanged)

Example 3: Operator ($1,500) + Content Creation Forge ($249) + Campaigns ($199)
  content_forge = true         ← Forge add-on active
  campaigns = true             ← Campaigns add-on active
  content_pieces_per_month = -1 ← Operator CC = unlimited
  email_sends_per_month = 1000  ← Operator CC tier limit
  auto_approve = false          ← Operator does not get auto-approve
  social_channels = 0          ← Operator has no social posting

Example 4: Commander ($2,500) + Content Creation Forge ($249) + Campaigns ($199)
  content_forge = true         ← same add-on
  campaigns = true             ← same add-on
  email_sends_per_month = 5000  ← Commander tier = higher limit
  auto_approve = true          ← Commander gets auto-approve
  social_channels = 2          ← Commander gets 2 channels
```

### 6.4 Gate Enforcement

```typescript
// New file: lib/content-engine/gates.ts

interface CIETierLimits {
  contentPiecesPerMonth: number;
  emailSendsPerMonth: number;
  socialChannels: number;
  blueprintAccess: 'standard' | 'all' | 'custom';
  autoApprove: boolean;
  repurposeFormats: number;
  analyticsLevel: 'none' | 'basic' | 'full' | 'ai';
  addonEligible: boolean;
}

// Layer 1: Base tier limits (CIE-specific)
const BASE_TIER_LIMITS: Record<string, CIETierLimits> = {
  'directory_free':     { contentPiecesPerMonth: 0,  emailSendsPerMonth: 0,     socialChannels: 0,  blueprintAccess: 'standard', autoApprove: false, repurposeFormats: 0,  analyticsLevel: 'none',  addonEligible: false },
  'directory_pro':      { contentPiecesPerMonth: 5,  emailSendsPerMonth: 0,     socialChannels: 0,  blueprintAccess: 'standard', autoApprove: false, repurposeFormats: 3,  analyticsLevel: 'none',  addonEligible: true },
  'directory_premium':  { contentPiecesPerMonth: 20, emailSendsPerMonth: 100,   socialChannels: 0,  blueprintAccess: 'standard', autoApprove: false, repurposeFormats: 3,  analyticsLevel: 'basic', addonEligible: true },
  'cc_operator':        { contentPiecesPerMonth: -1, emailSendsPerMonth: 1000,  socialChannels: 0,  blueprintAccess: 'all',      autoApprove: false, repurposeFormats: 3,  analyticsLevel: 'basic', addonEligible: true },
  'cc_commander':       { contentPiecesPerMonth: -1, emailSendsPerMonth: 5000,  socialChannels: 2,  blueprintAccess: 'custom',   autoApprove: true,  repurposeFormats: -1, analyticsLevel: 'full',  addonEligible: true },
  'cc_sovereign':       { contentPiecesPerMonth: -1, emailSendsPerMonth: 25000, socialChannels: -1, blueprintAccess: 'custom',   autoApprove: true,  repurposeFormats: -1, analyticsLevel: 'ai',    addonEligible: true },
};
// -1 = unlimited

// Layer 3: Add-on checks (resolved from addon_subscriptions table)
// These are NOT hardcoded — they come from resolveFeatures() which
// merges base tier + active add-on flags + account overrides.
//
// Usage:
//   const features = await resolveFeatures(accountId);
//   if (hasFeature(features, 'content_forge')) { /* show Forge UI */ }
//   if (hasFeature(features, 'addon_coupon_engine')) { /* show coupon creation */ }
//
// Prerequisite enforcement (min tier for add-on purchase) is handled
// at purchase time in the Stripe checkout API, NOT at feature resolution time.
```

### 6.5 Prerequisite Enforcement (Add-On Purchase Gates)

Some add-ons require a minimum base tier. Enforced at **purchase time** only.

| Scenario | Result |
|----------|--------|
| Free tier tries to buy Coupon Engine | Blocked — "Upgrade to Pro to unlock add-ons" |
| Pro tier buys Coupon Engine | Allowed — `addon_coupon_engine: true` |
| Pro tier downgrades to Free while Coupon Engine active | Coupon Engine **suspended** (not canceled). Reactivates on re-upgrade. |
| Operator tier buys Content Forge | Allowed — `content_forge: true` |
| Operator tier cancels CC subscription while Forge active | Forge **suspended**. Reactivates on re-subscribe. |

This logic lives in the existing `app/api/directory/addons/route.ts` (line 131: `listing.tier === 'free'` check) and will be extended to cover Command Center add-ons via the new `addon_products.min_tier` column.

---

## 7. Implementation Phases

> **Phase 0 (§0.5) is a hard prerequisite.** No Phase 1–5 work ships until Phase 0 exit criteria are met.
> Phase 0 scope: RLS audit, Greenline HQ access lock, nav single-source refactor, universal sign-out.

### Phase 1: Foundation (Lifecycle + Export) — ~1 week of implementation

**Goal:** Content created in Forge flows through a tracked lifecycle. Users can export/download content.

| Step | Action | Files |
|------|--------|-------|
| 1.1 | Create lifecycle state machine | NEW: `lib/content-engine/lifecycle.ts` |
| 1.2 | Run schema alignment migration | NEW: `supabase/migrations/XXX_align_content_lifecycle.sql` |
| 1.3 | Wire Forge `calendar_generate` to create linked rows | MODIFY: `app/api/content-forge-2/route.ts` |
| 1.4 | Wire Forge `generate` to persist and update lifecycle | MODIFY: `app/api/content-forge-2/route.ts` |
| 1.5 | Build Export Panel (copy/download) | NEW: `app/admin-v2/components/ContentExportPanel.tsx` |
| 1.6 | Add Export Panel to Forge output view | MODIFY: `app/admin-v2/components/ContentForge2.tsx` |
| 1.7 | Create transition API endpoint | NEW: `app/api/content-engine/transition/route.ts` |
| 1.8 | Add lifecycle types | MODIFY: `app/admin-v2/lib/types.ts` |

### Phase 2: Review Queue + Calendar (Wire the middle) — ~1 week

**Goal:** DraftsPanel becomes the content command center. Calendar shows lifecycle state.

| Step | Action | Files |
|------|--------|-------|
| 2.1 | Add "Review" tab to DraftsPanel | MODIFY: `app/admin-v2/components/DraftsPanel.tsx` |
| 2.2 | Wire approve/reject to lifecycle transitions | MODIFY: `app/admin-v2/components/DraftsPanel.tsx` |
| 2.3 | Implement auto-approve logic | MODIFY: `lib/content-engine/lifecycle.ts` |
| 2.4 | Add lifecycle badges to calendar | MODIFY: `app/admin-v2/calendar/page.tsx` |
| 2.5 | Add click-to-action on calendar items | MODIFY: `app/admin-v2/calendar/page.tsx` |
| 2.6 | Update calendar API with lifecycle data | MODIFY: `app/api/calendar/unified/route.ts` |
| 2.7 | Wire Drafts API through lifecycle | MODIFY: `app/api/drafts/route.ts` |

### Phase 3: Email Distribution (Wire the output) — ~1 week

**Goal:** Scheduled content with email channel auto-sends via existing infrastructure.

| Step | Action | Files |
|------|--------|-------|
| 3.1 | Build email channel handler | NEW: `lib/content-engine/channels/email-channel.ts` |
| 3.2 | Build distribution queue processor | NEW: `lib/content-engine/distribution-queue.ts` |
| 3.3 | Create queue status API | NEW: `app/api/content-engine/queue/route.ts` |
| 3.4 | Add channel selection to schedule flow | MODIFY: `app/admin-v2/components/DraftsPanel.tsx` |
| 3.5 | Create cron trigger for queue processing | NEW: `supabase/functions/content-distribute/index.ts` or Next.js cron |
| 3.6 | Build tier gate enforcement | NEW: `lib/content-engine/gates.ts` |

### Phase 4: Social Channels (Build the frontier) — timeline TBD

**Goal:** Content auto-posts to connected social accounts.

**Prerequisites (external, not code):**
- [ ] Meta Business Developer account approved
- [ ] Twitter API v2 Pro tier approved
- [ ] LinkedIn Marketing API access granted
- [ ] Instagram Graph API permissions approved
- [ ] YouTube Data API quota approved

| Step | Action | Files |
|------|--------|-------|
| 4.1 | Build channel handlers per platform | NEW: `lib/content-engine/channels/{platform}-channel.ts` |
| 4.2 | Replace simulated posting in schedule-blast | MODIFY: `supabase/functions/schedule-blast/index.ts` |
| 4.3 | Add social channel selection to schedule flow | MODIFY: `app/admin-v2/components/DraftsPanel.tsx` |
| 4.4 | Build social post preview component | NEW: `app/admin-v2/components/SocialPreview.tsx` |

### Phase 5: Measurement Loop (Close the loop) — ~3 days

**Goal:** Published content gets measured, feeding back into future content scoring.

| Step | Action | Files |
|------|--------|-------|
| 5.1 | Build measurement cron (48h post-publish) | NEW: `supabase/functions/content-measure/index.ts` |
| 5.2 | Pull email metrics (opens, clicks) from SendGrid | Extend: `lib/content-engine/channels/email-channel.ts` |
| 5.3 | Pull social metrics from platform APIs | Extend: `lib/content-engine/channels/{platform}-channel.ts` |
| 5.4 | Update content_pieces performance columns | Via measurement cron |
| 5.5 | Feed metrics back into blueprint scoring | Extend: `app/api/content-forge-2/route.ts` |

---

## 8. V2 Pieces to Merge Into V1

Based on the comparison, these V2-only components should be ported to V1:

| V2 Component | V2 Path | Merge Priority | Reason |
|--------------|---------|----------------|--------|
| Brand Voice | `admin-v2/brand-voice/` | HIGH | Content generation quality depends on brand voice config |
| Filing Cabinet | `admin-v2/filing-cabinet/` | MEDIUM | Asset management for content pieces |
| Creative Studio | `admin-v2/creative-studio/` | MEDIUM | Visual content creation |
| Knowledge Base | `admin-v2/knowledge/` | LOW | Content research assistant |
| Living Canvas | `admin-v2/living-canvas/` | LOW | Advanced editing |
| Property Passport | `admin-v2/property-passport/` | LOW | Industry-specific |

**Merge approach:** Copy component files and their API routes. Update imports. Test in isolation before wiring into CIE lifecycle.

---

## 9. Design Token Enforcement

All new and modified components must use the champagne gold design system:

```css
/* Primary palette — enforce across all CIE components */
--cie-primary: #C9A96E;          /* champagne gold */
--cie-primary-light: #D4BC8E;    /* hover/light variant */
--cie-primary-dark: #B8944F;     /* pressed/dark variant */
--cie-bg-glass: rgba(201, 169, 110, 0.08);  /* glassmorphism fill */
--cie-border-glass: rgba(201, 169, 110, 0.2); /* glassmorphism border */

/* BANNED — remove on sight */
/* #84A98C (sage green) — search and destroy in all files */
```

**Files to audit for sage green:** Run `grep -r "#84A98C\|#84a98c\|sage" --include="*.tsx" --include="*.css" --include="*.ts"` across the repo and replace every instance.

---

## 10. Success Criteria

### Phase 0 (Security — BLOCKING, must pass before any feature work)

0a. Every public Supabase table has RLS enabled — verified via `pg_tables.rowsecurity` query
0b. CRM data is isolated by `tenant_id` / `account_id` — verified with cross-tenant query test
0c. Greenline HQ access is email-whitelisted and "System Operator" badge shows only when active
0d. Desktop Sidebar + Mobile Drawer pull from a single `navConfig` source, feature-gated per 3-layer model
0e. Sign-out button works on mobile, tablet, and desktop breakpoints

### Phases 1–5 (CIE Features)

The CIE is "done" when:

1. A user can generate a 4-week content calendar from a blueprint → every slot appears on the unified calendar with `ideated` state
2. Clicking a slot lets them generate content → state moves to `drafted`, content is stored with quality scores
3. Content above score threshold auto-advances to `scheduled` (or goes to review queue if below)
4. From any state, user can export/download content in any repurposed format
5. Scheduled content with email channel auto-sends at the scheduled time via SendGrid
6. Calendar shows real-time lifecycle state for every piece of content
7. **3-Layer gate enforcement works end-to-end:**
   - Layer 1: Base tier limits are enforced (Pro gets 5 pieces/mo, Operator gets unlimited, etc.)
   - Layer 3: Add-on feature flags are resolved correctly (Content Forge add-on unlocks Forge, Coupon Engine unlocks coupons)
   - A Pro tenant WITHOUT Content Forge add-on cannot access Forge
   - A Pro tenant WITH Content Forge add-on can access Forge
   - Add-on purchase is blocked for Free tier tenants
   - Add-ons suspend (not cancel) when base subscription lapses
8. `resolveFeatures()` in `lib/services/feature-resolution.ts` merges base tier + add-on flags + account overrides
9. `addon_products` and `addon_subscriptions` tables exist and replace the legacy `metadata.addons` JSON blob
10. Zero references to sage green `#84A98C` remain in the codebase
11. Zero references to $299/$499/$899 pricing remain in the codebase
12. All tier names match canonical SOT: Pro/Premium (directory), Operator/Commander/Sovereign (CC)
13. Zero user-facing references to "God Mode" or "Super Admin" — all replaced with "Greenline HQ" / "System Operator"
14. `entertainment_loops` feature flag exists in DB (default: `false`), `product_type = 'entertainment'` accepted in plans table
15. Navigation is feature-gated: tenant nav items reflect their base tier + active add-ons

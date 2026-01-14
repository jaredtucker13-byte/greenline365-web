# GreenLine365 Business Operating System - PRD

## Original Problem Statement
Build a Business Operating System with the current primary focus on an **AI Website Builder** and **AI Receptionist/Booking System**. Key features include URL reverse-engineering, context-aware redesign, multi-section workflow, live code sandbox, and a "Living Blog".

**Unique Value Proposition**: Unlike other CRMs, GreenLine365 combines standard CRM capabilities with unique platform analytics - data from AI receptionist calls, booking performance, content engagement, and email campaigns - giving businesses insights no other platform offers.

## User Personas
- **Business Owners**: Need 24/7 AI receptionist to handle calls and bookings
- **Multi-tenant Clients**: Various businesses using GreenLine365's AI services
- **Internal Team**: Managing leads, content, and platform operations

## Architecture: Hub-and-Spoke Model

### Navigation System
The app uses a hub-and-spoke navigation pattern where:
- **Command Center (`/admin-v2`)** is the global starting point (Hub)
- **Spoke pages** (CRM, Analytics, Content Forge, etc.) can be accessed from the hub
- **Back behavior** respects the navigation stack or `returnTo` query param
- **Breadcrumbs** show current location in page hierarchy

**Key Navigation Components** (`/lib/navigation/`):
- `NavigationProvider` - Context provider wrapping admin-v2
- `useNavigation()` - Hook for navigation actions  
- `BackButton` - Consistent back behavior
- `Breadcrumbs` - Shows page hierarchy
- `NavLink` - Tracked navigation links
- `PageHeader` - Reusable header with back + breadcrumbs

**Navigation Rules**:
1. If user came from Command Center → Back goes to Command Center
2. If user came from Page X → Back goes to Page X (via `?returnTo=`)
3. Subpage drills preserve parent in stack
4. Deep links fallback to Command Center

### Data Flow Principles
1. **Single Source of Truth**: 
   - Core API (CRUD): contacts, deals, tasks, activities (mutable, record-level)
   - Analytics API (read-only aggregates): KPIs, series, funnels, cohorts, breakdowns

2. **UI Separation**:
   - Hub (Command Center): Dashboard with widgets summarizing each domain
   - Spokes (Dedicated Pages): Full-featured pages for CRM, Analytics, Calendar, etc.

3. **Drill-Through Pattern**:
   - Analytics widgets show aggregates → User clicks → Fetch sample IDs → Core API for details

---

## What's Been Implemented

### January 14, 2025 (Latest Session)

**Navigation System Implementation**
- Created navigation context and utilities (`/lib/navigation/`):
  - `NavigationContext.tsx` - Provider with navigation stack, returnTo tracking
  - `NavLink.tsx` - Navigation-aware link component
  - `Breadcrumbs.tsx` - Shows page hierarchy
  - `BackButton.tsx` - Consistent back behavior
- Created `PageHeader` component (`/admin-v2/components/PageHeader.tsx`)
  - Includes back button, breadcrumbs, title, actions
- Updated `ThemeWrapper` to include `NavigationProvider`
- Updated CRM Dashboard to use `PageHeader`
- Updated Content Forge to use `PageHeader`

**Hub-and-Spoke Architecture Consolidation**
- Created shared UI component library (`/admin-v2/components/shared/`):
  - `KPICard` - Reusable metric card with sparkline, trends, drill action
  - `FunnelChart` - Conversion funnel visualization
  - `TimeSeriesChart` - Time series with compare line
  - `DataTable` - Flexible table with selection, sorting, actions
- Created API client structure (`/lib/api/`):
  - `analyticsApi.ts` - Read-only aggregates with `meta` (lastProcessedAt, cacheTtl)
  - `coreApi.ts` - CRUD operations for leads/records
- New CRM Analytics endpoint (`/api/analytics/crm`):
  - `?type=kpis` - KPI summary (leads, conversions, revenue, pipeline)
  - `?type=funnel` - Pipeline funnel stages
  - `?type=trends` - Time series of lead activity
  - `?type=sources` - Breakdown by lead source
- Consolidated CRM Dashboard (`/admin-v2/crm-dashboard`):
  - KPI strip using shared `KPICard` components (powered by analyticsApi)
  - Lead table using shared `DataTable` (powered by coreApi)
  - Detail rail, Quick Add modal
  - Date range selector, status filters
- Created `CRMWidget` component for Command Center hub
- Redirected old `/admin-v2/crm` to consolidated dashboard

**Login Page Fix**
- Removed corrupted duplicate code (~40 lines)
- Verified `autoComplete="off"` already in place

### Previous Sessions
- Email verification flow fixed (migration 025)
- Calendar/Booking system scaffolded (migration 026)
- Retell AI agent architecture designed
- Magic Link authentication
- CRM database schema

---

## File Structure (Key Files)

```
/app/webapp/
├── app/
│   ├── admin-v2/
│   │   ├── page.tsx                    # Command Center (Hub)
│   │   ├── crm-dashboard/page.tsx      # CRM Dashboard (Spoke) - CONSOLIDATED
│   │   ├── crm/page.tsx                # Redirects to crm-dashboard
│   │   ├── analytics/page.tsx          # Analytics (Spoke)
│   │   ├── calendar/page.tsx           # Calendar (Spoke)
│   │   └── components/
│   │       ├── shared/                 # NEW: Shared UI components
│   │       │   ├── KPICard.tsx
│   │       │   ├── FunnelChart.tsx
│   │       │   ├── TimeSeriesChart.tsx
│   │       │   ├── DataTable.tsx
│   │       │   └── index.ts
│   │       ├── CRMWidget.tsx           # NEW: Hub widget
│   │       └── ...existing components
│   └── api/
│       ├── analytics/
│       │   ├── route.ts                # Platform analytics
│       │   └── crm/route.ts            # NEW: CRM analytics
│       └── crm/
│           └── leads/route.ts          # Lead CRUD
├── lib/
│   └── api/                            # NEW: API clients
│       ├── analyticsApi.ts
│       ├── coreApi.ts
│       └── index.ts
└── supabase/
    └── migrations/
        ├── 025_add_verification_columns.sql
        └── 026_flexible_booking_system.sql
```

---

## Prioritized Backlog

### P0 - Critical
- [x] Fix login page (autocomplete, code cleanup)
- [x] Consolidate CRM with hub-and-spoke architecture
- [x] Create shared UI component library
- [x] Create analytics API with `meta` responses
- [ ] **USER ACTION**: Test CRM lead sync (waitlist → verify → CRM)
- [ ] **USER ACTION**: Configure Retell custom functions
- [ ] Provide Retell system prompt (blocked on user)

### P1 - High Priority
- [ ] Add CRMWidget to Command Center page
- [ ] Build unique GreenLine analytics endpoints:
  - [ ] `/api/analytics/bookings` - Booking performance
  - [ ] `/api/analytics/content` - Content engagement
  - [ ] `/api/analytics/ai-receptionist` - Call analytics
  - [ ] `/api/analytics/email` - Campaign performance
- [ ] Test calendar/booking flow end-to-end
- [ ] Build CRM Phase 2 (Pipeline/Kanban view)

### P2 - Medium Priority
- [ ] Sports Research Workflow (Phase 1 of advanced blog)
- [ ] Google Calendar integration
- [ ] Live Code Sandbox
- [ ] Double opt-in for all forms

### P3 - Future
- [ ] Living Blog enhancements
- [ ] Website template marketplace
- [ ] AI-powered insights and recommendations

---

## Unique Analytics (Differentiator)

GreenLine365's unique value comes from combining these data sources:

| Data Source | Metrics | Use Case |
|-------------|---------|----------|
| **AI Receptionist** | Call volume, answer rate, conversion, top intents | Understand customer inquiries |
| **Booking System** | Completion rate, peak hours, source breakdown | Optimize scheduling |
| **Content/Posts** | Views, shares, clicks, engagement rate | Content ROI |
| **Email Campaigns** | Open rate, click rate, unsubscribes | Campaign effectiveness |
| **CRM** | Pipeline value, conversion funnel, source ROI | Sales performance |

All combined in one unified analytics view with drill-through to records.

---

## Tech Stack
- **Frontend**: Next.js 14, React, Tailwind, Framer Motion
- **Backend**: Next.js API Routes, Supabase (DB, Auth, Storage)
- **Integrations**: Retell AI, SendGrid, OpenRouter
- **Architecture**: Hub-and-Spoke UI, Two-API pattern (Core + Analytics)

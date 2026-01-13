# GreenLine365 - Product Requirements Document

## Latest Update: January 2026
### Build Status: ✅ MIGRATIONS COMPLETE

## Recent Changes (This Session - January 2026)
- ✅ Fixed `audit_logs` RLS policies (uses `tenant_id` + `actor_id`, not `user_id`)
- ✅ Fixed CRM tables RLS policies (`crm_leads`, `crm_customers`, `crm_revenue`)
- ✅ Fixed `social_connections` RLS policies
- ✅ All tables secured with Row Level Security

## Migration Status: COMPLETE
All migrations have been successfully applied:
- `audit_logs` - RLS enabled, append-only for SOC2
- `crm_leads`, `crm_customers`, `crm_revenue` - RLS with user_id
- `social_connections` - RLS with user_id

## Original Problem Statement
Build a comprehensive multi-tenant Business Operating System for local businesses called "GreenLine365".

## Core Architecture: Multi-Tenant System

### The 4-Layer Memory System
Each tenant has isolated data using RLS with `tenant_id`/`user_id` columns:

1. **Layer 1: Tenant Identity (Persona)**
   - Table: `memory_core_profiles`
   - Content: Business name, brand voice, personality, biography
   - UI: `/admin-v2/brand-voice`

2. **Layer 2: Tenant Warehouse (Knowledge Base)**
   - Table: `memory_knowledge_chunks` with pgvector
   - Content: Services, pricing, FAQs, processes
   - UI: `/admin-v2/knowledge`

3. **Layer 3: Tenant Journal (Track Record)**
   - Table: `memory_event_journal`
   - Content: Published blogs, captured leads, engagement metrics
   - API: `/api/analytics`

4. **Layer 4: Live Buffer (Active Task)**
   - Table: `memory_context_buffer`
   - Content: Current session/conversation context
   - TTL: 24 hours

### Tenant CRM System (NEW)
- **Tables:** `crm_leads`, `crm_customers`, `crm_email_events`, `crm_revenue`
- **UI:** `/admin-v2/crm` (placeholder)
- **API:** `/api/crm`
- **Purpose:** Each tenant tracks their own customers, leads, revenue, ROI

### SOC2 Audit Logging (NEW)
- **Table:** `audit_logs` (append-only, 7-year retention)
- **UI:** `/admin-v2/audit`
- **API:** `/api/audit`
- **Triggers:** Auto-log changes to CRM, Knowledge, Blog, Social tables

## What's Actually Working (Verified)
- ✅ Blog Polish tool (AI writing + image generation)
- ✅ Content Forge (content creation)
- ✅ Email campaigns and templates
- ✅ SMS templates (Twilio A2P pending)
- ✅ Booking management
- ✅ Brand Voice settings (Layer 1)
- ✅ Knowledge Base (Layer 2)
- ✅ Memory-enhanced chat (all 4 layers integrated)

## What's NOT Built Yet (Scaffolding Only)
- ❌ Tenant CRM Dashboard (UI placeholder exists)
- ❌ Analytics Dashboard (basic UI, needs enhancement)
- ❌ Onboarding Wizard (page exists, flow not implemented)
- ❌ Vector search for knowledge (pgvector schema ready)
- ❌ Social media posting (OAuth framework ready)
- ❌ Living Canvas publishing platform

## Prioritized Backlog

### P0 (Critical - Blockers)
- ✅ **Database Migrations** - COMPLETE

### P1 (High Priority)
- Integrate Event & Audit Loggers into API endpoints
- Build functional Tenant CRM Dashboard
- Enhance Analytics Dashboard with visualizations
- Implement Onboarding Wizard multi-step flow
- Knowledge Base bulk import (CSV/JSON)

### P2 (Medium Priority)
- Living Canvas Publishing Platform
- Complete Image Generation Features
- Social OAuth connections
- Vector search implementation (pgvector)

### P3 (Future)
- POS Integration & Payment Processing
- AI-driven Tax Reports
- "God Mode" CMS
- Retell AI agent "Aiden"

## File Structure
```
/app/webapp/
├── app/
│   ├── admin-v2/
│   │   ├── analytics/page.tsx       # Real data analytics
│   │   ├── audit/page.tsx           # SOC2 audit log viewer
│   │   ├── brand-voice/page.tsx     # Memory Layer 1
│   │   ├── crm/page.tsx             # Tenant CRM (placeholder)
│   │   ├── knowledge/page.tsx       # Memory Layer 2
│   │   └── living-canvas/page.tsx   # Publishing platform
│   ├── api/
│   │   ├── admin/analytics/route.ts # Admin-only metrics
│   │   ├── analytics/route.ts       # Tenant analytics
│   │   ├── audit/route.ts           # Audit logging
│   │   ├── chat/route.ts            # Memory-enhanced chat
│   │   ├── crm/route.ts             # CRM operations
│   │   └── knowledge/route.ts       # Knowledge management
│   └── onboarding/page.tsx          # Tenant onboarding
├── lib/
│   ├── audit-logger.ts              # Server-side audit utility
│   ├── event-logger.ts              # Event tracking utility
│   └── memory-bucket-service.ts     # 4-layer memory API
└── supabase/migrations/
    ├── 014_memory_bucket_system.sql
    ├── 015_social_and_analytics.sql
    ├── 016_tenant_crm.sql
    ├── 017_security_fixes.sql       # FIXED
    ├── 018_audit_logging.sql        # FIXED
    └── CONSOLIDATED_MIGRATION_FIX.sql # Run this!
```

## 3rd Party Integrations
- **Supabase:** DB, Auth, Storage, pgvector
- **OpenRouter:** Text AI generation
- **Kie.ai:** Image generation
- **Playwright:** Server-side screenshots

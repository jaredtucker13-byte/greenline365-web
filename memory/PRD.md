# GreenLine365 - Product Requirements Document

## Latest Update: January 13, 2026
### Build Status: ✅ BUILD PASSING + AI WEBSITE BUILDER FIXED

## Recent Changes (This Session - January 13, 2026)
- ✅ **Fixed Website Crawler Integration** - Syntax error in `startAnalysis` function resolved
- ✅ **Website Reverse-Engineering API** - `/api/crawl-website` fully functional
  - Extracts: title, description, favicon, colors, headlines, CTAs, navigation, images, structure
  - Auto-detects sections: Navigation, Hero, Features, Testimonials, Pricing, Footer
- ✅ **Start Analysis Button** - Now enables correctly when either image OR extracted website data is available
- ✅ Build passes successfully (`yarn build`)

## AI Website Builder Feature (`/admin-v2/website-analyzer`)
**Status: WORKING (requires deployment)**
- **URL Reverse-Engineering**: Crawl any website to extract content, colors, and structure
- **Multi-Section Workflow**: Build websites section-by-section (Header, Body, Footer)
- **Drag-and-Drop**: Reorder sections before final assembly
- **AI Models**: Gemini 3 Pro (vision), Claude 4.5 Sonnet (code), Nano Banana Pro (images)
- **API Providers**: OpenRouter (text/vision), KIE.ai (image generation)

### Key Files:
- `/app/webapp/app/admin-v2/website-analyzer/page.tsx` - Main UI
- `/app/webapp/app/api/crawl-website/route.ts` - Website crawler API
- `/app/webapp/app/api/design-workflow/analyze/route.ts` - Vision analysis
- `/app/webapp/app/api/design-workflow/generate-mockup/route.ts` - Image generation
- `/app/webapp/app/api/design-workflow/generate-code/route.ts` - Code generation

## Previous Session Changes
- ✅ Fixed `audit_logs` RLS policies (uses `tenant_id` + `actor_id`, not `user_id`)
- ✅ Fixed CRM tables RLS policies (`crm_leads`, `crm_customers`, `crm_revenue`)
- ✅ Fixed `social_connections` RLS policies
- ✅ All tables secured with Row Level Security
- ✅ **Liability Documentation System** - Full incident reporting with AI analysis

## NEW FEATURE: Liability Documentation System
Complete incident documentation flow for HVAC industry:
- **Upload**: Batch image upload with EXIF extraction
- **AI Analysis**: GPT-4o via OpenRouter for mold/damage/hazard detection
- **Report Generation**: Auto-generated professional liability reports
- **E-Signature**: Click-to-acknowledge or refuse with timestamp capture
- **PDF Generation**: Full professional 14-section PDF with all legal elements
- **Audit Trail**: Full tracking of views, signatures, and actions

### PDF Template Structure (14 Sections):
1. Document Header (company info, report ID, dates)
2. Parties Involved (contractor, client, witnesses)
3. Incident Summary (executive summary)
4. Incident Details (type, severity, location, status)
5. Evidence & Media (images with AI captions, EXIF data)
6. Timeline of Events (chronological with sources)
7. Findings & Analysis (AI-detected issues with severity)
8. Risk Assessment (overall risk level, concerns)
9. Recommendations (prioritized actions)
10. Liability Statement & Legal Notice
11. Customer Response & Acknowledgment (digital signature/refusal)
12. Report Author & Verification (technician signature)
13. Audit Metadata & Chain of Custody (SHA-256 hash, event log)
14. Data Retention & Legal (footer, retention policy)

### Files Created:
- `/app/api/incidents/route.ts` - CRUD operations
- `/app/api/incidents/analyze/route.ts` - GPT-4o image analysis
- `/app/api/incidents/upload/route.ts` - Image upload handling
- `/app/api/incidents/generate-report/route.ts` - AI report generation
- `/app/api/incidents/generate-pdf/route.ts` - **PDF generation with @react-pdf/renderer**
- `/app/api/incidents/send-for-signature/route.ts` - Email delivery
- `/app/api/incidents/sign/route.ts` - Public signing endpoint
- `/app/admin-v2/incidents/page.tsx` - Admin dashboard
- `/app/sign/[token]/page.tsx` - Public customer signing page
- `/lib/pdf/IncidentReportPDF.tsx` - **Full 14-section PDF template**

### Database Migrations to Run:
1. `020_liability_documentation.sql` - Tables: incidents, incident_images, signature_events
2. `021_incident_storage_bucket.sql` - Storage bucket for images

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

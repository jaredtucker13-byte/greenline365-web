# GreenLine365 Business Operating System - PRD

## Original Problem Statement
Build a Business Operating System with multi-tenant white-label support, AI-powered creative studio (ArtfulPhusion), and visual content management. The platform serves as infrastructure for local businesses to automate marketing, content creation, and customer engagement.

**Unique Value Proposition**: 
1. **White-Label Platform**: Agencies and brands can run their own branded instance ($1,200/mo Elite tier)
2. **AI Creative Studio**: Autonomous product photography and mockup generation using Gemini 3 Pro + Nano Banana Pro
3. **Visual Inline Editor**: "God Mode" for admins to edit any public page content without code

## User Personas
- **Platform Owner (Jared)**: God Mode admin with full visual editing capabilities
- **White-Label Clients**: Agencies/brands running their own branded platforms (e.g., ArtfulPhusion)
- **End Users**: Business owners using the platform for content creation and automation

## Architecture: Multi-Tenant White-Label System

### Tier Structure (Database-Driven)
- **Starter ($299/mo)**: Content Forge, Mockup Generator, Social Posting
- **Professional ($599/mo)**: + Creative Studio, CRM, Analytics, Knowledge Base
- **Enterprise ($999/mo)**: + Product Library, Email, SMS, AI Receptionist
- **Elite White-Label ($1,200/mo)**: + No branding, Custom domains, Visual editor

### White-Label Architecture
```
businesses
├── is_white_label: boolean     # Enables white-label features
├── can_edit_site: boolean      # Enables visual inline editor
└── monthly_price: integer      # Tier pricing

business_themes
├── logo_url, favicon_url       # Branding assets
├── company_name, tagline       # Override "GreenLine365"
├── primary_color, secondary_color... # CSS variables
├── hide_powered_by: boolean    # Remove "Powered by GreenLine365"
└── custom_css: text            # Advanced customization

custom_domains
├── domain: text                # e.g., "studio.artfulphusion.com"
├── verification_status         # DNS verification
├── ssl_status                  # Certificate status
└── cname_target                # Our target for DNS setup
```

---

## What's Been Implemented

### January 16, 2025 (Current Session)

**Phase 1: White-Label Foundation**
- Created database migration `/database/migrations/010_white_label_foundation.sql`:
  - Extended `businesses` table with `is_white_label`, `can_edit_site`, `monthly_price`
  - Created `business_themes` table for custom branding
  - Created `custom_domains` table for custom domain support
  - Created `pricing_tiers` table (database-driven pricing)
  - Created `site_content` table for editable regions
  - Created ArtfulPhusion as first white-label test tenant

- Created Theme Engine:
  - `/lib/theme/WhiteLabelThemeContext.tsx` - Theme provider with CSS variable injection
  - Supports custom logos, colors, fonts, and "Powered by" suppression

- Created Theme Settings Admin Page (`/admin-v2/theme-settings`):
  - Branding tab: Logo upload, company name, tagline
  - Colors tab: Full color palette editor with live preview
  - Typography tab: Font selection
  - Domains tab: Custom domain management UI
  - Advanced tab: Custom CSS, footer text

- Updated Sidebar Navigation:
  - Added "Creative Studio" nav item
  - Added "Theme Settings" nav item (white-label only)
  - Updated filtering logic for `whiteLabelOnly` items

- Created API Endpoints:
  - `GET/POST /api/pricing-tiers` - Database-driven pricing
  - `GET/POST /api/site-content` - Editable page regions

- Created Creative Studio Placeholder (`/admin-v2/creative-studio`):
  - Product type selection (apparel, wall_art, jewelry, home_decor, packaging, footwear)
  - Upload workflow UI
  - Character Vault tab (Photo-to-Seed + Virtual Generation)
  - Product Library tab

- Updated Business Context:
  - Added `isWhiteLabel()` and `canEditSite()` helper functions
  - Added `is_white_label`, `can_edit_site`, `monthly_price` to Business type

**Database Fix (P0)**
- Created `/database/FINAL_FIX_ALL.sql` - One-time idempotent fix for admin access
- User confirmed admin status: ✅

### January 15, 2025 (Previous Session)
- Multi-tenant system foundation (businesses, user_businesses, access_codes)
- SendGrid invite integration
- Creative Studio backend APIs (analyze-product, generate-mockups)
- Brain system backend APIs
- Feature gating system

### Earlier Sessions
- Navigation system with hub-and-spoke pattern
- CRM Dashboard consolidation
- Email verification flow
- Calendar/Booking system

---

## Upcoming Tasks (Prioritized)

### P0 - User Action Required
1. **Run Migration**: User must run `010_white_label_foundation.sql` in Supabase SQL Editor
2. **Upload ArtfulPhusion Logo**: Via Theme Settings page after migration

### P1 - Creative Studio Implementation
1. Implement full product upload flow with Gemini 3 Pro analysis
2. Build Character Vault with Identity Seed storage
3. Implement 6-Pack mockup generation with scene selection
4. Build Product Library with persistence
5. Add Omnichannel Export (Pinterest/TikTok formatting)

### P2 - Inline Visual Editor
1. Create "Editable Region" component wrapper
2. Implement hover-to-edit pencil overlay
3. Build rich text editor for text regions
4. Build image swap with preserved styling
5. Connect to `site_content` API for persistence

### P3 - Future Tasks
- Newsletter Forge (block-based editor)
- Content Multiplier (auto-generate blog/Pinterest/TikTok)
- "The Brain" system with Slack integration
- Cmd+K universal command bar

---

## Key Files Reference

### White-Label System
- `/lib/theme/WhiteLabelThemeContext.tsx` - Theme provider
- `/lib/business/BusinessContext.tsx` - Business context with white-label helpers
- `/app/admin-v2/theme-settings/page.tsx` - Theme configuration UI
- `/database/migrations/010_white_label_foundation.sql` - Schema migration

### Creative Studio
- `/app/admin-v2/creative-studio/page.tsx` - Main studio UI
- `/app/api/studio/analyze-product/route.ts` - Gemini 3 Pro analysis
- `/app/api/studio/generate-mockups/route.ts` - Nano Banana Pro generation

### APIs
- `/app/api/pricing-tiers/route.ts` - Database-driven pricing
- `/app/api/site-content/route.ts` - Editable content regions

### Navigation
- `/app/admin-v2/components/CollapsibleSidebar.tsx` - Main sidebar with feature gating

---

## 3rd Party Integrations
- **Supabase**: Database, Auth, Storage
- **SendGrid**: Transactional emails
- **OpenRouter**: LLM gateway (Gemini 3 Pro)
- **Emergent LLM Key**: Nano Banana Pro image generation
- **Slack**: Planned for "The Brain" integration

---

## Test Tenants
1. **GreenLine365** (Default): Standard owner tenant
2. **ArtfulPhusion** (White-Label): First test tenant with custom purple/pink branding

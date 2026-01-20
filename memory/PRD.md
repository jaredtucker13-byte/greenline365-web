# GreenLine365 Business Operating System - PRD

## ⚠️ HARD RULES (DO NOT OVERRIDE)
1. **DO NOT use EMERGENT_LLM_KEY for image generation** - Emergent does NOT have Nano Banana
2. **For Nano Banana / Image Generation: Use kie.ai** (KIE_API_KEY) - User's preferred provider
3. **For LLM text analysis: Use OpenRouter with Gemini 3 Pro**
4. **GreenLine365 = Primary admin account, ArtfulPhusion = White-label test tenant (separate)**

---

## Original Problem Statement
Build a Business Operating System with multi-tenant white-label support, AI-powered creative studio (ArtfulPhusion), and visual content management. The platform serves as infrastructure for local businesses to automate marketing, content creation, and customer engagement.

**Unique Value Proposition**: 
1. **White-Label Platform**: Agencies and brands can run their own branded instance ($1,200/mo Elite tier)
2. **AI Creative Studio**: Autonomous product photography and mockup generation using Gemini 3 Pro + **kie.ai**
3. **Visual Inline Editor**: "God Mode" for admins to edit any public page content without code

## User Personas
- **Platform Owner (Jared)**: God Mode admin with full visual editing capabilities
- **White-Label Clients**: Agencies/brands running their own branded platforms (e.g., ArtfulPhusion)
- **End Users**: Business owners using the platform for content creation and automation

---

## Architecture

### Tier Structure (Database-Driven)
| Tier | Price | Features |
|------|-------|----------|
| Starter | $299/mo | Content Forge, Mockup Generator, Social Posting |
| Professional | $599/mo | + Creative Studio, CRM, Analytics, Knowledge Base |
| Enterprise | $999/mo | + Product Library, Email, SMS, AI Receptionist |
| Elite White-Label | $1,200/mo | + No branding, Custom domains, Visual editor |

### Database Schema

```sql
-- White-Label Foundation
businesses (is_white_label, can_edit_site, monthly_price)
business_themes (logo, colors, fonts, hide_powered_by)
custom_domains (domain, verification_status, ssl_status)
pricing_tiers (tier_key, price, features JSONB)
site_content (page_slug, region_key, content)

-- Creative Studio
signature_models (name, model_type, reference_images, ethnicity, age_range, style_tags)
studio_products (name, product_type, original_images, ai_analysis JSONB, status)
studio_mockups (product_id, scene_type, image_url, variants JSONB)
mockup_scenes (name, slug, category, prompt_template)
```

---

## What's Been Implemented

### January 16, 2025 (Current Session)

#### ✅ CRITICAL BUG FIX: Business Switching UI Stability
- **Issue**: Dashboard crashed with NaN SVG errors and widgets disappeared when switching between businesses
- **Root Cause**: Components re-rendered with new business ID before data was loaded, causing division-by-zero errors
- **Fix Applied**:
  - Added `isSwitchingBusiness` state to BusinessContext
  - Added full-page loading overlay during business transition
  - Added NaN guards to all SVG chart calculations
  - BrainWidget now shows skeleton loader instead of disappearing
  - Sidebar dropdown disabled during switch with spinner indicator
- **Files Modified**:
  - `/lib/business/BusinessContext.tsx` - Added isSwitchingBusiness state
  - `/app/admin-v2/page.tsx` - Added loading overlay (z-index 100)
  - `/app/admin-v2/components/AnalyticsWidgets.tsx` - NaN guards in SVG
  - `/app/admin-v2/components/BrainWidget.tsx` - Skeleton during switch
  - `/app/admin-v2/components/CollapsibleSidebar.tsx` - Disabled dropdown + spinner
  - `/app/admin-v2/components/shared/TimeSeriesChart.tsx` - NaN guards
  - `/app/admin-v2/components/shared/KPICard.tsx` - NaN guards in sparkline

#### ✅ Phase 1: White-Label Foundation
- **Database Migration** (`010_white_label_MINIMAL.sql`):
  - Added `is_white_label`, `can_edit_site`, `monthly_price` to businesses
  - Created `business_themes` table with full branding options
  - Created `custom_domains` table (CNAME-ready)
  - Created `pricing_tiers` table with 4 default tiers
  - Created `site_content` table for editable regions
  - **ArtfulPhusion** created as first white-label tenant

- **Theme Engine** (`/lib/theme/WhiteLabelThemeContext.tsx`):
  - CSS variable injection
  - Logo/branding override support
  - "Powered by" suppression for white-label

- **Theme Settings Page** (`/admin-v2/theme-settings`):
  - Branding tab: Logo upload, company name, tagline
  - Colors tab: Full palette editor with live preview
  - Typography tab: Font selection
  - Domains tab: Custom domain management UI
  - Advanced tab: Custom CSS, footer text

#### ✅ Phase 2: Creative Studio Foundation
- **Database Migration** (`011_creative_studio_schema.sql`):
  - `signature_models` - Character Vault storage
  - `studio_products` - Product Library
  - `studio_mockups` - Generated mockups
  - `mockup_scenes` - 6 default scene presets

- **Creative Studio UI** (`/admin-v2/creative-studio`):
  - 5-step workflow: Select Type → Upload → AI Analysis → Select Scenes → Results
  - 8 product types (apparel, wall_art, jewelry, home_decor, packaging, footwear, accessories, default)
  - Drag & drop file upload
  - AI analysis review with editable fields
  - Scene selection for 6-Pack mockup generation
  - Character Vault tab (Photo-to-Seed + Virtual Generation)
  - Product Library tab with grid view

- **API Endpoints**:
  - `POST /api/studio/analyze-product` - Gemini 3 Pro via OpenRouter
  - `POST /api/studio/generate-mockups` - Nano Banana Pro via Emergent
  - `GET/POST /api/studio/models` - Character Vault CRUD
  - `GET/POST/PATCH/DELETE /api/studio/products` - Product Library
  - `GET/POST /api/studio/export` - Omnichannel export (Pinterest/TikTok)
  - `GET/POST /api/pricing-tiers` - Database-driven pricing
  - `GET/POST /api/site-content` - Editable page regions

#### ✅ Infrastructure
- Sidebar updated with "Creative Studio" and "Theme Settings" nav items
- Business Context updated with `isWhiteLabel()` and `canEditSite()` helpers
- Storage buckets SQL ready (`STORAGE_BUCKETS.sql`)

---

## Pending User Actions

### SQL Scripts to Run (in order):
1. ✅ `FINAL_FIX_ALL.sql` - Admin access fix (COMPLETED)
2. ✅ `010_white_label_MINIMAL.sql` - White-label foundation (COMPLETED)
3. ✅ `011_creative_studio_schema.sql` - Creative Studio schema (COMPLETED)
4. ⏳ `LINK_USER_TO_ARTFULPHUSION.sql` - Link admin to ArtfulPhusion
5. ⏳ `STORAGE_BUCKETS.sql` - Create storage buckets for uploads

---

## Upcoming Tasks

### P1 - Visual Inline Editor (Phase 3)
1. Create "Editable Region" component wrapper with pencil overlay
2. Implement hover-to-edit behavior for God Mode admins
3. Build rich text editor for text regions
4. Build image swap modal with preserved styling
5. Connect to `site_content` API for persistence
6. Mark specific regions on Home, Pricing, About, TOS pages

### P2 - Creative Studio Enhancements
1. Implement actual image resizing for export
2. Add virtual model preview generation
3. Implement product "Rerun" feature for new mockups
4. Add bulk download with ZIP packaging

### P3 - "The Brain" System (Phase 4)
1. Build full Brain dashboard UI
2. Implement Slack webhook integration
3. Create cron jobs for daily/weekly reminders
4. Add AI categorization for thoughts

### P4 - Newsletter Forge (Phase 5)
1. Block-based drag-and-drop editor
2. Template library
3. SendGrid integration for sending

### P5 - Content Multiplier (Phase 6)
1. Auto-generate blog posts from mockups
2. Pinterest pin generation
3. TikTok script generation

---

## Key Files Reference

### White-Label System
- `/lib/theme/WhiteLabelThemeContext.tsx`
- `/lib/business/BusinessContext.tsx`
- `/app/admin-v2/theme-settings/page.tsx`
- `/database/migrations/010_white_label_MINIMAL.sql`

### Creative Studio
- `/app/admin-v2/creative-studio/page.tsx`
- `/app/api/studio/analyze-product/route.ts`
- `/app/api/studio/generate-mockups/route.ts`
- `/app/api/studio/models/route.ts`
- `/app/api/studio/products/route.ts`
- `/app/api/studio/export/route.ts`
- `/database/migrations/011_creative_studio_schema.sql`

### Navigation
- `/app/admin-v2/components/CollapsibleSidebar.tsx`

---

## 3rd Party Integrations
| Service | Purpose | Key |
|---------|---------|-----|
| Supabase | Database, Auth, Storage | Configured |
| SendGrid | Transactional emails | Configured |
| OpenRouter | LLM gateway (Gemini 3 Pro, Perplexity Sonar) | `OPENROUTER_API_KEY` |
| **kie.ai** | **4.5 Text-to-Image (seedream)** | `KIE_API_KEY` |
| OpenWeather | Real-Feel weather context | `OPENWEATHER_API_KEY` |
| Retell AI | Voice AI booking agent | Planned |
| Slack | "The Brain" integration | Planned |

> ⚠️ **IMPORTANT**: Do NOT use Emergent LLM Key for image generation. Use kie.ai with KIE_API_KEY.
> 📝 **Note**: Switched from Nano Banana to 4.5 Text-to-Image (seedream) for cost efficiency.

---

## Test Tenants
1. **GreenLine365** (Default): Standard owner tenant, primary branding
2. **ArtfulPhusion** (White-Label): Purple/pink branding, "Creative Sanctuary" tagline, hide_powered_by=true

---

## Real-Feel AI Booking System (January 18, 2025)

### Overview
Multi-tenant "Real-Feel" AI Booking & Sales Ecosystem with weather awareness, intelligent call routing, and automated rescheduling.

### Core Features
1. **Weather-Aware Booking**: Outdoor businesses get contextual suggestions based on weather forecasts
2. **Nudge Strategy**: Revenue protection by pivoting cancellation requests to reschedules
3. **Warm Transfer Protocol**: AI-powered research during call hold, whisper briefing for sales reps
4. **Industry Context Gating**: Differentiated behavior for indoor vs. outdoor businesses

### Database Schema (013_realfeel_booking_system.sql)
```sql
-- Business config additions
businesses: is_weather_dependent, weather_threshold, context_config, tenant_status, zip_code

-- New tables
call_logs: business_id, call_id, weather_context, perplexity_brief, intent_detected, action_taken, nudge tracking
call_audits: audit_type, severity, context_snapshot (for optimization loop)
weather_alerts: alert_type, severity_level, weather_data, auto_reschedule_triggered
warm_transfer_queue: perplexity_research, weather_context, whisper_script, status
```

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/realfeel/weather` | GET | Public weather check by ZIP code |
| `/api/realfeel/weather` | POST | Internal weather check with business context |
| `/api/realfeel/research` | POST | Perplexity research for warm transfers |
| `/api/realfeel/research` | GET | Retrieve existing transfer research |
| `/api/realfeel/calls` | POST | Create call log |
| `/api/realfeel/calls` | GET | List call logs with stats |
| `/api/realfeel/calls` | PATCH | Update call log (outcome, nudge tracking) |
| `/api/realfeel/context` | GET | Get business context config |
| `/api/realfeel/context` | PATCH | Update business context config |

### Retell AI Integration (Planned)
- Function definitions for calendar operations (check_availability_cal, book_appointment_cal)
- Silent Syntax guardrails in system prompts
- Absolute date conversion enforcement
- Rule of Three: Max 3 availability options verbalized

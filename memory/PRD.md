# GreenLine365 Business Operating System - PRD

## HARD RULES (DO NOT OVERRIDE)
1. **DO NOT use EMERGENT_LLM_KEY for image generation** - Use kie.ai (KIE_API_KEY)
2. **For LLM text analysis: Use OpenRouter with Gemini 3 Pro**
3. **Badges are EARNED, never bought** — even $899/mo Dominator stays Blue until a GL365 Pro stamps the ledger
4. **Florida Two-Party Consent**: Recording disclosure MANDATORY
5. **Master Term**: "Property Intelligence Engine"
6. **Schema**: `address_line1`, `zip_code`, `model_number`, `property_interactions` (not `interactions`), `actor_id` (not `user_id` in audit_logs)

---

## Architecture

- **Frontend**: Next.js 16 | **Database**: Supabase PostgreSQL + RLS | **Auth**: Supabase Auth
- **AI Voice**: Retell AI + Twilio | **Calendar**: Cal.com | **Weather**: OpenWeather

### RBAC: Owner → Manager → Tech → Guest

### Database Tables
```
-- Property Intelligence
properties → contacts, assets, property_interactions
filing_cabinet, audit_logs, team_members

-- Referral Network
contractor_directory, referrals, contractor_reviews

-- Global Directory
directory_listings, directory_badges, directory_feedback
```

---

## What's Been Implemented (Feb 6, 2026)

### Property Intelligence Module
- **Commander** (`/admin-v2/commander`) — KPIs, property list, quick actions, activity feed
- **Property Passport** (`/admin-v2/property-passport`) — Timeline, assets, warranty vault, contacts, health score
- **Filing Cabinet** (`/admin-v2/filing-cabinet`) — Upload, categories, CPA export, audit trail
- **Referral Network** (`/admin-v2/referral-network`) — Contractor directory, ratings, referral tracker

### Global Directory Foundation
- **Public Directory** (`/directory`) — Zero-auth public search page
- **Search** by industry, city/ZIP, text
- **Industry filters**: HVAC, Plumbing, Roofing, Electrical, Barbers, Restaurants, Gyms
- **Badge display**: Earned badges shown on listing cards
- **Tier display**: Growth/Authority/Dominator visual indicators
- **Feedback API**: Public QR feedback submission with auto-badge trigger

### Sidebar: PROPERTY INTEL (Commander, Passports, Filing Cabinet, Referral Network) + TOOLS

### SQL Migrations
- 016: RBAC, filing cabinet, audit logs
- 017: Referral network + ratings
- 018: property_interactions, performance indexes
- 019: Global directory (listings, badges, feedback)

### API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `/api/properties` | Property CRUD |
| `/api/filing-cabinet` | Document vault |
| `/api/audit-log` | Compliance |
| `/api/contractors` | Contractor directory |
| `/api/referrals` | Referral tracking |
| `/api/directory` | Public directory search + create |
| `/api/directory/feedback` | QR feedback (public, no auth) |

---

## Upcoming Tasks

### P0 - User must run migration
- `019_global_directory.sql` in Supabase SQL Editor

### P1 - Directory Enhancements
1. AI Web Scraper ("Add My Business" via URL → auto-profile)
2. Individual listing detail page (`/directory/[slug]`)
3. QR code generation for businesses
4. Incident → Property Passport wiring (RED/GREEN status loop)

### P1 - Webhooks & Voice
1. Deploy pre-greeting Edge Function
2. Emergency Alert webhook
3. Call Analyzed webhook (CRS updates)

### P2 - Badge Automation
1. Service stamp badges (GL365 Pro does work → badge earned)
2. Feedback-driven badges (sentiment analysis → clean space badge)
3. Auto-revoke on expiry (edge function cron)

### P2 - Directory Tiers
1. Growth ($299): multi-category, media gallery, SMS alerts, XP tracking
2. Authority ($599): leaderboard, sentiment AI, auto-responder, zip boost
3. Dominator ($899): unlimited blogs, king status, auto-dispatch, benchmarking

### P3 - Second Brain, Founding 30, Stripe Connect, Homeowner $9/mo subscription

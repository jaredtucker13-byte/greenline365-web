# GreenLine365 Business Operating System - PRD

## HARD RULES (DO NOT OVERRIDE)
1. **DO NOT use EMERGENT_LLM_KEY for image generation** - Emergent does NOT have Nano Banana
2. **For Nano Banana / Image Generation: Use kie.ai** (KIE_API_KEY) - User's preferred provider
3. **For LLM text analysis: Use OpenRouter with Gemini 3 Pro**
4. **GreenLine365 = Primary admin account, ArtfulPhusion = White-label test tenant (separate)**
5. **Florida Two-Party Consent**: Recording disclosure is MANDATORY and non-negotiable
6. **Master Term**: "Property Intelligence Engine" (NOT "AI Receptionist" or "Booking Bot")

---

## Brand Positioning

### The Pivot
We are NOT a "chatbot" or "AI receptionist." We are a **Property Intelligence Engine**.

### Tagline
"We Built the Brain Your Business Was Missing."

### Value Proposition
- **Property-First**: We anchor data to the Physical Address, not just the customer
- **Predictive Logic**: Weather awareness, asset decay tracking, relationship scoring
- **Superhuman Service**: 24/7 availability with the memory of a master technician

---

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (Turbopack)
- **Backend**: Next.js API Routes (no separate backend)
- **Database**: Supabase PostgreSQL with RLS
- **Auth**: Supabase Auth (Google OAuth + Email/Password)
- **Storage**: Supabase Storage
- **AI Voice**: Retell AI + Twilio
- **Calendar**: Cal.com
- **Weather**: OpenWeather API

### RBAC Role Hierarchy (NEW - Feb 2026)
| Level | Role | Permissions |
|-------|------|-------------|
| 1 | Owner | Full access - Filing Cabinet, billing, team, AI Brain |
| 2 | Manager | Operations - leads, calendar, call recordings. No Filing Cabinet |
| 3 | Tech | Assigned jobs only. Upload-only to Filing Cabinet |
| 4 | Guest | Read-only Property Passport for their address |

### Database Schema
```sql
-- Core Multi-Tenant
businesses (tenant anchor)
profiles (user_id, tenant_id, tenant_role)
team_members (tenant_id, user_id, email, role, permissions)
user_businesses (user_id, business_id, role)

-- Property Intelligence Engine
properties (tenant_id, address, full_address, google_place_id)
contacts (tenant_id, property_id, phone, relationship_score)
assets (property_id, asset_type, metadata JSONB, install_date, confidence_score)
interactions (property_id, contact_id, type, summary, sentiment_score)
industry_configs (tenant_id, industry_type, decay_logic, emergency_keywords)
location_flavors (location_name, climate_quirk, witty_hooks JSONB)

-- Filing Cabinet (Secure Vault)
filing_cabinet (tenant_id, property_id, file_name, category, amount, 
                uploaded_by, uploaded_by_role, visibility, tags)

-- Compliance
audit_logs (tenant_id, user_id, action, entity_type, entity_id, severity)
```

---

## What's Been Implemented

### February 6, 2026 - Property Intelligence Module

#### Commander Dashboard (`/admin-v2/commander`)
- KPI strip: Active Properties, Linked Contacts, Tracked Assets, Avg Health Score
- Properties list with links to individual Property Passports
- Quick Actions: Property Passports, Filing Cabinet, Schedule
- Recent Activity feed from interactions table
- Emergency Alerts placeholder (for webhook integration)

#### Property Passport (`/admin-v2/property-passport`)
- Properties grid with search (address + contact name)
- Property detail view with tabs: Timeline, Assets, Warranty, Contacts
- Property At-A-Glance header: Address, Health Score ring, Total Invested
- Interactive Timeline: Chronological "Carfax" view of all interactions + installations
- Assets View: Equipment cards with age, brand, confidence score
- Warranty Vault: Grid of system types (HVAC, Plumbing, Roofing, Electrical, Water Heater, Security)
- Contacts View: Linked people with CRS (Customer Relationship Score)

#### Filing Cabinet (`/admin-v2/filing-cabinet`)
- Stats strip: Total Files, Total Amount, Tax Year selector, CPA Export
- Category tabs: All Files, Receipts, Warranties, Contracts, Invoices, Tax Docs, Job Photos, General
- File list with category badges, amounts, sizes, dates
- Upload modal: Drag & drop, category selector, amount field, description
- CSV Export for CPA (one-click download)
- Soft delete with audit logging
- Drag & drop zone overlay

#### Sidebar Navigation Update
- New "PROPERTY INTEL" section divider with Commander, Passports, Filing Cabinet
- New "TOOLS" section divider for existing features
- New icons: commander (shield), home, cabinet

#### SQL Migration (`016_rbac_filing_cabinet_audit.sql`)
- Enhanced profiles table with `tenant_role` column
- `team_members` table for staff management
- `filing_cabinet` table with role-based visibility
- `audit_logs` table for compliance
- RLS policies: Upload-only for techs, View for owners/managers
- Helper functions: `get_user_tenant_role()`, `log_audit_event()`, `calculate_property_health_score()`

#### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/properties` | GET | List/search properties by tenant |
| `/api/properties` | POST | Create new property |
| `/api/filing-cabinet` | GET | List files with totals by category/year |
| `/api/filing-cabinet` | POST | Upload file record |
| `/api/filing-cabinet` | DELETE | Soft delete with audit trail |
| `/api/audit-log` | GET | List audit events |
| `/api/audit-log` | POST | Create audit event |

---

## Pending User Actions

### SQL Migration to Run:
1. `016_rbac_filing_cabinet_audit.sql` - RBAC, Filing Cabinet, Audit Logs tables

### Previous Migrations (already run):
- 015a-h: Property Intelligence Engine core tables

---

## Upcoming Tasks

### P0 - Deploy & Connect
1. Run migration `016_rbac_filing_cabinet_audit.sql` in Supabase SQL Editor
2. Deploy `pre-greeting` Edge Function to Supabase
3. Configure Retell Webhook to point to pre-greeting function
4. Create Supabase Storage bucket `filing-cabinet`

### P1 - Webhooks & Real-Time
1. Build Emergency Alert webhook (`/api/emergency-alert`)
2. Build Call Analyzed webhook (updates CRS post-call)
3. Real-time dashboard updates via Supabase Realtime

### P1 - Commander Dashboard Enhancements
1. Live call monitoring widget
2. "One-Tap Swap" for emergency rescheduling
3. Real-time Emergency Alert feed (connected to webhook)

### P2 - RBAC Enforcement
1. Team member invite flow (email-based)
2. Role selection UI in Settings
3. Admin "Impersonate User" feature
4. Signed URLs for homeowner Property Passport access

### P2 - Filing Cabinet Enhancements
1. AI OCR for receipt scanning (auto-categorize, extract amounts)
2. Slack integration (photo → AI files as PDF)
3. Job Costing AI (margin calculation)
4. ZIP export with all files + CSV summary

### P2 - Second Brain (Slack Integration)
1. Private Slack channel capture
2. AI categorization of messages
3. Sunday Recap email (summary + action items + dates)

### P3 - Founding 30 Onboarding
1. A2P Compliance Wizard
2. "Safe-Way" onboarding wizard (Business Vitals → Integration Handshake → Brain Activation)
3. Stripe Connect for billing (ACH priority)

### P3 - Homeowner Subscription ($9/mo)
1. Public Property Passport view (signed URLs)
2. AI proactive monitoring ("Your AC is 8 years old...")
3. Contractor recommendation from Greenline network

---

## Key Files Reference

### Property Intelligence Module (NEW)
- `/app/admin-v2/commander/page.tsx`
- `/app/admin-v2/property-passport/page.tsx`
- `/app/admin-v2/filing-cabinet/page.tsx`
- `/app/admin-v2/components/CollapsibleSidebar.tsx`
- `/app/api/properties/route.ts`
- `/app/api/filing-cabinet/route.ts`
- `/app/api/audit-log/route.ts`
- `/database/migrations/016_rbac_filing_cabinet_audit.sql`

### Property-First Engine
- `/supabase/functions/pre-greeting/index.ts`
- `/app/api/mcp/route.ts`
- `/docs/RETELL_SYSTEM_PROMPT_V2.md`
- `/database/migrations/015a-h*.sql`

### Documentation
- `/docs/PROJECT_BIBLE.md`
- `/docs/PRE_LAUNCH_TESTING_CHECKLIST.md`
- `/docs/TAMPA_ELECTRIC_DEMO.md`

---

## 3rd Party Integrations
| Service | Purpose | Key |
|---------|---------|-----|
| Supabase | Database, Auth, Storage | Configured |
| SendGrid | Transactional emails | Configured |
| OpenRouter | LLM gateway (Gemini 3 Pro) | `OPENROUTER_API_KEY` |
| kie.ai | 4.5 Text-to-Image (seedream) | `KIE_API_KEY` |
| OpenWeather | Real-Feel weather context | `OPENWEATHER_API_KEY` |
| Retell AI | Voice AI booking agent | `RETELL_API_KEY` |
| Twilio | SMS messaging | Configured |
| Cal.com | Appointment booking | `CALCOM_API_KEY` |

---

## Test Tenants
1. **GreenLine365** (Default): Standard owner tenant, primary branding
2. **ArtfulPhusion** (White-Label): Purple/pink branding, hide_powered_by=true

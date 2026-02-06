# GreenLine365 Business Operating System - PRD

## HARD RULES
1. **Badges are EARNED, never bought**
2. **Schema**: `address_line1`, `zip_code`, `model_number`, `property_interactions`, `actor_id` in audit_logs
3. SendGrid key in Vercel must match current key

---

## What's Been Built (Feb 6, 2026)

### Property Intelligence Module
- Commander, Property Passport, Filing Cabinet, Referral Network
- Sidebar: PROPERTY INTEL section + TOOLS section

### Global Directory
- Public page at `/directory` with category mosaic, testimonials, grouped listing grid
- AI Web Scraper (`/api/directory/scrape`) — scrapes any URL, AI extracts business info
- Bulk scraper processed 200 businesses (100% success rate)
- 200 businesses in directory + 200 leads in CRM

### Email Campaign System
- **Email 1**: "Is this correct?" — confirmation request, no links, reply-only
- **Inbound Parse**: Reply → AI parses corrections → auto-updates listing → sends Email 2 with listing link
- **Email 1b**: 72-hour follow-up for non-responders
- **Campaign API**: `/api/email/campaign` (send_initial, send_followup, status check)
- SendGrid Inbound Parse → `reply@reply.greenline365.com` → `/api/email/inbound`

### SQL Migrations (016-019)
- RBAC, Filing Cabinet, Referral Network, Performance, Global Directory

### Key API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `/api/directory` | Public directory CRUD |
| `/api/directory/scrape` | AI web scraper |
| `/api/directory/feedback` | QR feedback (public) |
| `/api/email/campaign` | Campaign sender (initial + followup) |
| `/api/email/inbound` | Inbound reply webhook |
| `/api/properties` | Property CRUD |
| `/api/filing-cabinet` | Document vault |
| `/api/contractors` | Contractor directory |
| `/api/referrals` | Referral tracking |

---

## Upcoming
- Batch 5+ URL scraping (more markets)
- Individual listing detail pages
- Claim flow UI
- QR code generation
- Stripe Connect ($0.60 platform fee)
- Incident → Property Passport wiring

# GreenLine365 Business Operating System - PRD

## HARD RULES
1. Badges are EARNED, never bought
2. Schema: `address_line1`, `zip_code`, `model_number`, `property_interactions`, `actor_id`
3. **NO campaign emails without explicit approval**
4. Email 1 = ZERO links, reply "STOP" to opt out
5. Stripe test key active — switch to live when ready

---

## Complete System Built (Feb 6, 2026)

### Property Intelligence Module
- Commander Dashboard (`/admin-v2/commander`)
- Property Passport (`/admin-v2/property-passport`) — Carfax for Homes
- Filing Cabinet (`/admin-v2/filing-cabinet`) — secure vault with RBAC
- Referral Network (`/admin-v2/referral-network`) — contractor directory + ratings

### Global Directory
- Public page at `/directory` — 200 businesses live
- AI Web Scraper — any URL → auto-profile
- Category-organized: Home Services, Dining, Style, Fitness, Professional, Retail
- Badge system (earned only)
- QR feedback endpoint

### Email Campaign System
- Email 1 via Gmail SMTP (warmed personal account) — no links
- Inbound Parse: `reply@reply.greenline365.com` → AI parses corrections → auto-updates
- STOP handling → auto-unsubscribe
- 72-hour follow-up for non-responders
- 200 CRM leads loaded and ready

### Stripe Payments
- 3 subscription tiers: Growth $299, Authority $599, Dominator $899
- Checkout, status, and webhook endpoints
- Auto-upgrades listing tier on payment
- Tags "golden_customer" in CRM on purchase
- Webhook configured at Stripe dashboard

### SQL Migrations (016-020)
- 016: RBAC, Filing Cabinet, Audit Logs
- 017: Referral Network + Ratings
- 018: Property Interactions + Performance Indexes
- 019: Global Directory (listings, badges, feedback)
- 020: Payment Transactions

### Key API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `/api/directory` | Public directory CRUD |
| `/api/directory/scrape` | AI web scraper |
| `/api/directory/feedback` | QR feedback |
| `/api/email/campaign` | Email campaign sender |
| `/api/email/inbound` | Reply webhook |
| `/api/stripe/checkout` | Subscription checkout |
| `/api/stripe/status` | Payment status |
| `/api/stripe/webhook` | Stripe events |
| `/api/properties` | Property CRUD |
| `/api/filing-cabinet` | Document vault |
| `/api/contractors` | Contractor directory |
| `/api/referrals` | Referral tracking |

## Upcoming
- Campaign Dashboard (admin panel)
- Image upload with auto-compression
- Individual listing detail pages
- Claim Your Listing flow
- QR code generation
- Stripe Connect ($0.60 marketplace fee)
- Incident → Property Passport RED/GREEN loop
- Domain warming for SendGrid

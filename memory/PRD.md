# GreenLine365 Business Operating System - PRD

## HARD RULES
1. Badges are EARNED, never bought
2. Schema: `address_line1`, `zip_code`, `model_number`, `property_interactions`, `actor_id`
3. **NO campaign emails without explicit approval** — test emails to personal only
4. Email 1 has ZERO links — reply "STOP" to opt out
5. Email 2+ can have links (listing URL, unsubscribe)

---

## Email Campaign Architecture
- **Email 1**: FROM Gmail (warmed) → reply-to `reply@reply.greenline365.com` → no links
- **Reply "STOP"**: Auto-unsubscribe, remove listing, mark CRM as lost
- **Reply with corrections**: AI parses → auto-updates listing → sends Email 2 via SendGrid with listing link
- **Reply "Looks good"**: Mark verified → send Email 2 with listing link
- **72hr no reply**: Email 1b via Gmail (soft follow-up, still no links)

## What's Built
- Property Intelligence: Commander, Passport, Filing Cabinet, Referral Network
- Global Directory: 200 businesses scraped, category-organized, public at `/directory`
- CRM: 200 leads loaded, tagged by industry/city
- AI Web Scraper: `/api/directory/scrape`
- Campaign System: `/api/email/campaign` (Gmail SMTP for Email 1, SendGrid for Email 2)
- Inbound Parse: `reply@reply.greenline365.com` → `/api/email/inbound` → AI + CRM
- SQL Migrations: 016-019

## Upcoming
- Campaign Dashboard (admin panel)
- Batch 5+ URL scraping
- Individual listing detail pages
- Claim flow UI
- QR code generation
- Stripe Connect ($0.60 fee)
- Purchase tracking (golden customers)
- Domain warming strategy for SendGrid

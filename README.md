# GreenLine365

AI-powered business operating system for local service companies. Reputation management, booking automation, property intelligence, and embeddable trust badges — all in one platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript, React |
| Database | Supabase (PostgreSQL) + Row-Level Security |
| Auth | Supabase Auth |
| AI | OpenRouter (Claude, Gemini, Perplexity) |
| Payments | Stripe (Checkout, Subscriptions, Customer Portal) |
| Voice | Retell AI + Twilio (A2P 10DLC) |
| Email | SendGrid |
| SMS | Twilio |
| Calendar | Cal.com |
| Hosting | Vercel |

## Key Directories

```
greenline365-web/
├── webapp/                        # Main Next.js application
│   ├── app/                       # App Router pages + API routes
│   │   ├── api/badges/            # Badge API (Trust Network Phase 1)
│   │   ├── api/bookings/          # Booking endpoints
│   │   ├── api/campaigns/         # Campaign management
│   │   ├── api/billing/           # Stripe checkout + portal
│   │   ├── api/subscriptions/     # Subscription management
│   │   └── admin-v2/              # Tactical Command Center
│   ├── public/badge.js            # Embeddable badge widget (vanilla JS)
│   ├── database/                  # Schema + migrations (001-032)
│   ├── config/                    # YAML configs (industries, prompts)
│   └── lib/                       # Supabase client, utilities
├── docs/                          # Architecture docs, gap analysis
├── memory/                        # Operational Bible, PRD, pricing
└── TRUST_NETWORK_ROADMAP.md       # Badge & Trust Network roadmap
```

## Recent Major Features

### Trust Network Phase 1 — Badge API & Embed Engine (Feb 21, 2026)
- `GET /api/badges/[partnerId]` — Public badge JSON API (CORS, 5min CDN cache)
- `GET /api/badges/[partnerId]/embed` — HTML embed snippet (3 styles)
- `GET /api/badges` — Authenticated internal API for portal UI
- `public/badge.js` — Zero-dep vanilla JS widget, IntersectionObserver lazy load
- Subscription-aware gating: inactive badges grayscale when tier = free

### Hub-and-Spoke Subscription System (Feb 20, 2026)
- 4 plans (Free, Starter, Professional, Enterprise)
- Stripe Checkout + Customer Portal integration
- Feature flags + tier-based gating
- Role-based access control (Owner, Admin, Member, Viewer)

### Directory & Discovery Pipeline
- 8 Florida destinations with 150+ business listings
- Perplexity + Google Places enrichment pipeline
- 9-category directory with sub-filtering
- Bentley Standard UI (glassmorphism, neon accents)

## What's Next

- Review widget: extend `/api/directory/reviews` with embed params
- Portal snippet generator UI component
- `/trust` page with badge immutability content
- `/use-cases` vertical content (HVAC, Roofing, Remodeling)
- `/status` uptime page
- `/docs` knowledge vault

## Getting Started

See `webapp/README.md` for setup instructions, environment variables, and database migration guide.

## License

Proprietary — GreenLine365

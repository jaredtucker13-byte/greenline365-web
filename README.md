# GreenLine365 — The Unrivaled Standard in Home Services

> **This is the Source of Truth for the `greenline365-web` Main branch.**
> > Last updated: February 23, 2026 — "Premium Evolution" Merge
> >
> > ---
> >
> > ## What Is GreenLine365?
> >
> > GreenLine365 is a curated, verified home services directory built on a trust-based accountability model. The **Directory is the front door** — a cinematic, glassmorphism-designed platform where only vetted professionals earn a listing. All backend products (Booking, CRM, Home Ledger) are sold as separate, modular B2B services via email outreach — never displayed on the public site.
> >
> > **The design language:** Dark, cinematic, premium. Glassmorphism floating over deep-obsidian and cinematic backgrounds. Sage green (#84A98C) as the primary accent. Every screen should feel like a private, elite platform — not a generic SaaS dashboard.
> >
> > ---
> >
> > ## Architecture Overview
> >
> > ```
> > greenline365.com (Public)
> > ├── /                    Directory homepage — "THE UNRIVALED STANDARD IN HOME SERVICES"
> > ├── /pricing             Directory listing tiers ONLY — Free / Pro $45 / Premium $89
> > ├── /home-ledger         [BUILD NEEDED] — Private Luxury Vault landing page
> > └── /admin-v2            Command Center (back-end, sold via outreach — NOT public)
> >     ├── /commander       Master dashboard + Live Local Pulse widget
> >     ├── /content         AI content calendar (glassmorphism grid)
> >     ├── /property-passport  GL365 Home Ledger
> >     ├── /filing-cabinet  AES-256 encrypted document storage
> >     ├── /incidents       Damage documentation + signature collection
> >     ├── /referral-network  Trusted contractor directory
> >     └── /campaigns       Email sequences, outreach pipelines, lead tracking
> > ```
> >
> > ---
> >
> > ## 1. Pricing — Source of Truth
> >
> > > **The public `/pricing` page shows ONLY the three Directory tiers below.**
> > > > All references to $299 / $599 / $899 bundles are DELETED. Those prices are old and incorrect.
> > > >
> > > > | Tier | Price | Key Features |
> > > > |------|-------|--------------|
> > > > | **Free** | $0/mo | Basic listing — name, address, phone, hours, search visibility |
> > > > | **Pro** | $45/mo | + Verification badge, 2 custom images, Book Now CTA, description, trust signals |
> > > > | **Premium** | $89/mo | + Lead generation, Google photo sync, featured placement, AI Review Response, analytics |
> > > > | **Founding Member** | Locked-in forever | Featured homepage placement, priority support, badge, rate never increases |
> > > >
> > > > **Back-end product pricing** (Command Center, Booking System, Home Ledger) is TBD and delivered via direct email outreach — never shown on the public pricing page.
> > > >
> > > > ---
> > > >
> > > > ## 2. Visual Identity — Premium Glassmorphism
> > > >
> > > > We are 100% committed to a **Glassmorphism aesthetic** that creates an elite, professional atmosphere.
> > > >
> > > > ### The Directory (Front Door)
> > > >
> > > > - **Goal:** Establish the "Unrivaled Standard" in home services
> > > > - - **Aesthetic:** Cinematic, high-end backgrounds (deep dark, metallic, real-world photography) with glassmorphism UI floating over them as a translucent layer
> > > >   - - **Hero:** `THE UNRIVALED STANDARD IN HOME SERVICES. Curated. Verified. Your Home's Legacy.`
> > > >     - - **Search bar:** Glassmorphism pill — `Search for Excellence...` + `FIND A PRO` CTA
> > > >       - - **Category cards:** Frosted-glass cards with cinematic photography (Fine Dining, Luxury Wellness, Private Clubs, etc.)
> > > >         - - **Navigation:** Minimal — Home, Member, Products, Categories, Secure, Contact
> > > >          
> > > >           - ### The Home Ledger (Private Luxury Vault)
> > > >          
> > > >           - - **Goal:** "Your Home's Heritage. Documented." — a private, secure vault feel
> > > >             - - **Aesthetic:** Deep obsidian-style backgrounds (#0A0A0A) with metallic/gold accents and sleek frosted-glass cards
> > > >               - - **Branding:** GL365 Home Ledger (formerly "Property Passports" — rename everywhere)
> > > >                 - - **Tone:** Private. Exclusive. Secure. Like a luxury safe, not a filing cabinet.
> > > >                  
> > > >                   - ### Design Tokens (see `design_guidelines.json` for full spec)
> > > >                  
> > > >                   - | Token | Value |
> > > >                   - |-------|-------|
> > > >                   - | Primary color | Sage Green `#84A98C` |
> > > > | Background | Deep dark `#0A0A0A` + cinematic photo overlay |
> > > > | Glassmorphism | `backdrop-blur-2xl bg-white/10 border border-white/20` |
> > > > | Heading font | Playfair Display, Poppins |
> > > > | Body font | Manrope, Inter |
> > > > | Mono font | JetBrains Mono |
> > > > | Animation | GSAP 3.14.2 + ScrollTrigger |
> > > > | Accent | Gold/Champagne for Directory; Metallic/Obsidian for Home Ledger |
> > > >
> > > > ---
> > > >
> > > > ## 3. Product Stack
> > > >
> > > > | Product | Status | Access Model | Pricing |
> > > > |---------|--------|--------------|---------|
> > > > | Directory Listing | ✅ Live | Public | Free / $45 / $89/mo |
> > > > | Command Center | ✅ Live (admin) | Email outreach only | TBD (~$297–$497/mo) |
> > > > | Live Local Pulse | ✅ Creator only | Waitlist | TBD add-on |
> > > > | GL365 Home Ledger | ✅ Module live | /home-ledger page needed | TBD |
> > > > | AI Booking Widget | 🔵 Roadmap | White-label ready | TBD |
> > > > | AI Chat Widget | 🔵 Roadmap | White-label ready | TBD |
> > > > | Campaigns Module | ✅ Live (admin) | Bundled w/ Command Center | TBD |
> > > >
> > > > ---
> > > >
> > > > ## 4. Founding Member Programs
> > > >
> > > > Two separate programs. Do not confuse them.
> > > >
> > > > **Program 1 — Directory Founding Members (Public)**
> > > > - Cap: First 50 verified Tampa Bay businesses
> > > > - - Offer: Featured placement, priority support, locked-in listing rate forever, Founding Member badge
> > > >   - - Purpose: Front-door trust signal (replaces missing testimonials)
> > > >     - - Homepage section: "Be the Business Everyone Else References"
> > > >      
> > > >       - **Program 2 — Booking System Founding Members (Private)**
> > > >       - - Cap: First 30 businesses — hard stop
> > > >         - - Offer: $500 off setup + $500/mo off for life + beta access + 25% off all future features
> > > >           - - Funnel position: Sold through Email 3 of the outreach sequence — never publicly listed
> > > >            
> > > >             - ---
> > > >
> > > > ## 5. Email Outreach Sequence
> > > >
> > > > The back-end sales engine. Triggered when a business claims a directory listing.
> > > >
> > > > | Day | Email | Goal |
> > > > |-----|-------|------|
> > > > | 1 | Value Bomb | Deliver a Local Pulse snapshot for their ZIP. Zero ask. |
> > > > | 4 | Soft Reveal | Show Command Center dashboard screenshot. No price. |
> > > > | 8 | Personalized Offer | Founding Member pitch — specific, direct, time-limited. |
> > > > | 14 | Follow-Up | One gentle bump if no reply. |
> > > > | 21 | Graceful Exit | Close the loop. Leave door open. |
> > > >
> > > > Target metrics: Email 1 open rate >55% · Email 3 booking click >20% · Full funnel conversion >5%
> > > >
> > > > ---
> > > >
> > > > ## 6. Accountability Model
> > > >
> > > > The Directory is a **trust-based system**. This is not passive — it is actively enforced:
> > > >
> > > > - Professionals must maintain the standard to stay listed
> > > > - - If they don't maintain the standard (complaints, failed verifications, lapses), **they get kicked off**
> > > >   - - The Verified badge is earned and revocable
> > > >     - - This accountability is the core differentiator — "Curated. Verified. Unrivaled."
> > > >      
> > > >       - ---
> > > >
> > > > ## 7. Live Local Pulse
> > > >
> > > > Real-time market intelligence widget inside the Command Center.
> > > >
> > > > | Tier | Behavior |
> > > > |------|----------|
> > > > | Creator (Jared) | Fully live, ZIP 33619, scans every 3h, AI fallback cards when no live signal |
> > > > | Free Users | Blurred lock overlay with waitlist CTA — never shows real data |
> > > > | Paid Subscribers | Full access, ZIP from their listing, same fallback as creator |
> > > >
> > > > Fallback cards rotate by current date using a pre-built seasonal library (Tampa Bay / 33619). The widget never shows "No live opportunities" for the creator.
> > > >
> > > > ---
> > > >
> > > > ## 8. GL365 Home Ledger
> > > >
> > > > Formerly "Property Passports" — **renamed everywhere**.
> > > >
> > > > The property intelligence hub. All modules (Filing Cabinet, Incidents, Referral Network) connect back to it.
> > > >
> > > > **Rename checklist:**
> > > > - Sidebar nav: "Passports" → "Home Ledger"
> > > > - - Sidebar subtitle: → "GL365 Home Ledger"
> > > >   - - Commander quick actions: → "Home Ledger"
> > > >     - - Module page title: → "GL365 Home Ledger"
> > > >       - - `/home-ledger` landing page: Currently 404 — **must be built**
> > > >        
> > > >         - Target niches for outreach: Property managers, real estate investors, HVAC/plumbing/electrical contractors, insurance agents, homeowners with active renovations.
> > > >        
> > > >         - ---
> > > >
> > > > ## 9. Infrastructure & Security
> > > >
> > > > | Layer | Detail |
> > > > |-------|--------|
> > > > | DNS & CDN | Cloudflare (Free) — joselyn.ns + rohin.ns |
> > > > | SSL | Universal SSL — active, auto-renewing, covers *.greenline365.com |
> > > > | HTTPS | Always Use HTTPS enforced |
> > > > | HSTS | Enabled, 6-month max-age |
> > > > | TLS | Minimum TLS 1.2 |
> > > > | DDoS | Cloudflare unmetered protection |
> > > > | AI Bot Blocking | Enabled — blocks training scrapers on all pages |
> > > > | Origin IP | Hidden behind Cloudflare proxy |
> > > > | Hosting | Hostinger VPS |
> > > > | Encryption at rest | AES-256 (Filing Cabinet module) |
> > > >
> > > > ---
> > > >
> > > > ## 10. Build Roadmap
> > > >
> > > > Two pages first. The rest of the ecosystem follows once these are locked.
> > > >
> > > > | Phase | Description | Status | ETA |
> > > > |-------|-------------|--------|-----|
> > > > | 0 | Foundation (legal pages, DB integration) | ✅ Complete | Done |
> > > > | 1 | Design System (GSAP, Glassmorphism, tokens) | ✅ Complete | Done |
> > > > | **2A** | **Directory Homepage** (hero, search, category cards) | 🔵 Next | ~3–4h |
> > > > | **2B** | **Home Ledger Landing Page** (/home-ledger — builds from obsidian vault aesthetic) | 🔵 Next | ~3–4h |
> > > > | 3 | /pricing page (3 tiers ONLY — $0/$45/$89) | 🔵 Planned | ~2h |
> > > > | 4 | Navigation & Global UI | 🔵 Planned | ~2–3h |
> > > > | 5 | Command Center polish + Live Local Pulse | 🔵 Planned | ~4–5h |
> > > > | 6 | Advanced Animations (GSAP ScrollTrigger, phone draw) | 🔵 Planned | ~5–6h |
> > > > | 7 | CTA Bands, Footer, Polish & Accessibility | 🔵 Planned | ~3–4h |
> > > >
> > > > See full details: `webapp/IMPLEMENTATION_ROADMAP.md`
> > > >
> > > > ---
> > > >
> > > > ## 11. Repo Structure
> > > >
> > > > ```
> > > > greenline365-web/                  ← THIS IS THE MAIN / SOURCE OF TRUTH REPO
> > > > ├── webapp/                        # Next.js frontend application
> > > > │   ├── app/
> > > > │   │   ├── admin-v2/              # Command Center (protected)
> > > > │   │   ├── pricing/               # Directory listing tiers ($0/$45/$89 ONLY)
> > > > │   │   └── home-ledger/           # [BUILD NEEDED] Private Luxury Vault landing
> > > > │   ├── components/ui/os/          # Design system components
> > > > │   │   ├── GlassCard.tsx          # ✅ Ready
> > > > │   │   ├── Button.tsx             # ✅ Ready
> > > > │   │   └── NeonText.tsx           # ✅ Ready
> > > > │   ├── lib/
> > > > │   │   ├── gsap.ts                # Animation utilities
> > > > │   │   └── utils.ts               # Helper functions
> > > > │   └── IMPLEMENTATION_ROADMAP.md
> > > > ├── backend/                       # API / server logic
> > > > ├── docs/
│   └── brainstorming/             # Internal strategy docs (do not publish)
│       ├── founding-members-SOT.md
│       ├── pricing-strategy.md
│       ├── email-outreach-sequence.md
│       ├── live-local-pulse-spec.md
│       └── home-ledger-launch.md
├── design_guidelines.json         # ← Design token reference (Glassmorphism SOT)
└── README.md                      # ← This file — THE SOURCE OF TRUTH
```

---

## 12. Key Design Decisions

**Directory-first strategy.** GL365 pivoted from service-first to directory-first. The free listing is the low-friction entry point. All premium products are sold on the back-end through email — never through the public site.

**Service pages are hidden.** They exist but are not in the main nav. Accessible via direct links in outreach emails or via the Command Center.

**The absence of testimonials is a feature.** The Founding Member offer flips the script — no social proof becomes a founding identity play. Scarcity > empty carousel.

**Command Center is personal, not SaaS-generic.** The outreach pitch is founder-to-founder. Jared builds it specifically for their business — positioned closer to a done-for-you service than a software subscription.

**Accountability is the moat.** Unlike passive directories, GL365 enforces the standard. If they don't maintain it, they lose their listing. This is the trust signal that justifies premium pricing.

---

## 13. Open Decisions (Blocking Items)

These must be resolved before certain build steps and outreach can be finalized:

- Command Center base price — needed before Email 3 can be sent (target: $297–$497/mo)
- Home Ledger pricing — standalone tier vs. bundle-only
- Live Local Pulse pricing — add-on or tier-included
- Campaigns Module — separate add-on or bundled
- White-label priority — before or after first 30 founding members?
- Annual billing discount — 2 months free?
- `/home-ledger` page — must be built before property manager outreach begins

---

## Contact

**Jared Tucker** — Creator, GreenLine365
- Email: jared@greenline365.com
- Help: Greenline365help@gmail.com
- Live site: greenline365.com
- ZIP focus: 33619 (East Tampa / Brandon, FL)

> *This README is a living document. Update it when decisions are made.*
> *Last major update: February 23, 2026 — "Premium Evolution" merge from greenline365-web-v2*

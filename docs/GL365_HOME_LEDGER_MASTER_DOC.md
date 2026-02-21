# GL365 Home Ledger — Master Document
**Version:** 2.0 — Updated & Approved
**Last Updated:** February 20, 2026
**Owner:** GL365 / Jared Tucker

> This is the single source of truth for GL365. It covers the Home Ledger product, the three-system architecture, all locked pricing, the frontend build roadmap, and the live audit status. No page, checkout flow, or developer task should contradict this document.
>
> ---
>
> ## I. Core Philosophy — The "Verified Value" Ecosystem
>
> GL365 Home Ledger is a fraud-proof property record system that turns home maintenance history into a luxury asset for the real estate market.
>
> - **The Mission:** To provide a "Carfax for Homes" — a verified, certified, tamper-proof record of every improvement, repair, and inspection a property has ever had.
> - - **The Market:** Homeowners and real estate agents closing transactions on homes valued at $400,000 and above. Agents earning 10% commissions on $500K+ deals. The pricing reflects this — these are closing tools, not consumer books.
>   - - **The Edge:** Truth is verified by licensed professionals, not typed by homeowners. Zero self-reporting. Every entry is third-party certified.
>    
>     - ---
>
> ## II. The Three Separate Systems (CRITICAL — Do Not Cross These)
>
> GL365 operates three completely independent systems. They share a brand but must never share logic, data, or AI personas.
>
> ### System 1 — GL365 Home Ledger (This Document)
> - The physical product and property verification platform
> - - Lives at the Home Ledger portal
>   - - NO embedded chat widgets, NO booking logic, NO sales agents
>     - - Purely a data entry, verification, and display utility
>      
>       - ### System 2 — The Public Directory (Separate)
>       - - The "Address Hero" public search experience
>         - - Runs the Directory Concierge AI (booking-capable, directory-aware)
>           - - Handles public property lookups, trust scores, and report purchases
>             - - Has NO knowledge of the SaaS widget platform
>              
>               - ### System 3 — The SaaS Widget Platform (Separate)
>               - - The embeddable widget product sold to contractors and businesses
>                 - - Runs Ada, Aiden, GL365 Assistant, Reed, Sage personas
>                   - - Tenant_ID + Persona_Type enforced at widget init
>                     - - Has NO knowledge of the Home Ledger portal internals
>                      
>                       - ---
>
> ## III. The Physical Product Line
>
> | Item | Description |
> |---|---|
> | Custom Walnut Vault | Dovetail-joint walnut box, blue velvet interior, laser-engraved GL365 logo, brass nameplate with Ledger No. and address |
> | Hardcover Home Ledger | Professional hardback, GL365 shield cover, property photo, full verified history printed inside |
> | Softcover Home Ledger | Same content as hardcover, perfect-bound softcover format |
> | Gold-Foil Certificate | Formal certification document with gold foil seal |
> | Metal/Walnut QR Tag | Laser-engraved QR code linking to the live digital Ledger |
> | Flyer/Postcard Pack (50) | 50 branded marketing flyers for open houses and listing marketing |
>
> **Fulfillment:** Books via Lulu API | Flyers via Lob API | Boxes & Tags via 3PL
> **All physical orders require Admin Command Center approval before printing is triggered.**
>
> ---
>
> ## IV. Pricing Matrix — LOCKED
>
> > Do not discount these prices without written approval. They are calibrated for the luxury real estate market.
> >
> > ### A La Carte Anchors
> >
> > | Item | Price |
> > |---|---|
> > | Custom Walnut Vault (Box) | $450 |
> > | Hardcover Home Ledger | $195 |
> > | Softcover Home Ledger | $95 |
> > | Gold-Foil Certificate | $125 |
> > | Metal/Walnut QR Tag | $125 |
> > | Flyer/Postcard Pack (50) | $175 |
> > | Digital Pro Unlock (Annual) | $79/year |
> > | Certified PDF Download | $65 |
> > | Public Report Access | $49 |
> >
> > **Total a la carte: $1,150+ — this number must appear on the Platinum Vault page.**
> >
> > ### The Bundles
> >
> > | Bundle | Price | Includes | A La Carte Value | Saves |
> > |---|---|---|---|---|
> > | The Starter Record | $149 | Softcover + Certified PDF + Digital Unlock (1yr) | $239 | $90 (38%) |
> > | The Seller's Showcase | $299 | Hardcover + Certificate + Flyer Pack + Digital Unlock | $574 | $275 (48%) |
> > | The Homeowner's Legacy | $449 | Hardcover + Certificate + QR Tag + Flyers + Digital Unlock | $699 | $250 (36%) |
> > | The Platinum Asset Vault | $999 | Everything + 5-Year Hosting + Concierge Data Entry | $1,450+ | $450+ |
> >
> > **Platinum positioning:** "The definitive asset record for a home worth protecting. One vault. Every document. Zero questions at closing."
> >
> > ### Public Search / Buyer-Facing Prices
> >
> > | Option | Price | Description |
> > |---|---|---|
> > | Digital Access | $49 | Instant full unlock of one address history |
> > | Certified PDF | $65 | Bank-ready certified PDF download |
> > | Physical Softcover | $95 | Printed copy shipped to buyer |
> >
> > ### Pro Certification Stamp Fee
> > - **$9.99 per stamp** — charged to the Pro each time they certify a Ledger entry
> > - - 20 jobs/month per Pro = ~$200/month | 50 active Pros = $5K–$10K/month passive revenue
> >   - - Invisible to homeowners and agents — backend B2B revenue only
> >    
> >     - ### Digital Subscription Renewal (After Year 1)
> >    
> >     - | Tier | Price |
> >     - |---|---|
> >     - | Basic | $29/year |
> > | Pro (+ PDF export + priority verification) | $79/year |
> > | Lifetime (Platinum only — 5 years included, then $29/yr) | Included in $999 |
> >
> > ---
> >
> > ## V. The Integrity Layer — Professional-Only Verification
> >
> > 1. Homeowner uploads receipt → clicks "Request Audit"
> > 2. 2. System generates One-Time Handshake Code
> >    3. 3. Pro enters code in Pro Portal → inspects work → clicks "Certify"
> >       4. 4. Entry marked Verified — homeowner has ZERO edit access to certified entries
> >          5. 5. Pro charged $9.99 stamp fee automatically
> >            
> >             6. **The Hard Rule:** Homeowners upload. Only licensed Pros certify. This rule cannot be bypassed.
> >             7. **Pro revenue loop:** Contractors charge homeowners $99–$150 for a "GL365 Certification Visit." GL365 earns $9.99 per stamp.
> >            
> >             8. ---
> >            
> >             9. ## VI. The Website Architecture (Sitemap)
> >
> > **Public Facing:** Home Page | Address Search ("Address Hero") | Partner Portal Landing | Vault Gallery
> > **Store / Checkout:** Bundle Product Pages | Dynamic Checkout with Upsells | "Claim Your Home" Mobile Page (QR destination)
> > **Portals:** Homeowner Dashboard | Pro Portal | Admin Command Center
> >
> > ---
> >
> > ## VII. AI Persona System — Isolation Rules
> >
> > The Home Ledger portal has NO AI widget. It is a data utility only.
> >
> > | Persona | System | Has Booking? | Has Sales? |
> > |---|---|---|---|
> > | Directory Concierge | Public Directory | YES (Cal.com/Retell) | NO |
> > | Ada | SaaS Widget Platform | NO | YES |
> > | Aiden | SaaS Widget Platform | NO | YES |
> > | GL365 Assistant | SaaS Widget Platform | NO | NO |
> > | Reed | SaaS Widget Platform | NO | NO |
> > | Sage | SaaS Widget Platform | NO | NO |
> >
> > **Rule:** Tenant_ID + Persona_Type checked at /api/widgets/init before any knowledge base or tool loads.
> >
> > ---
> >
> > ## VIII. Visual Identity
> >
> > - **Vault:** Walnut, dovetail joints, blue velvet, laser-engraved lid, brass nameplate
> > - - **Book:** Navy hardcover, GL365 shield logo, property photo, gold-foil title
> >   - - **Certificate:** Cream/ivory stock, gold-foil seal
> >     - - **Colors:** Navy #1B2B5E | Gold #C9A84C | White #FFFFFF | Walnut Brown #5C3D1E
> >      
> >       - ---
> >
> > ## IX. Developer & Legal Checklist
> >
> > - [ ] API Handbook: Handshake Code logic, QR ownership transfer, Pro certification flow
> > - [ ] - [ ] Fulfillment Specs: Lulu API (books), Lob API (postcards), 3PL webhook (boxes/tags)
> > - [ ] - [ ] Terms of Service: Verified status requires licensed third-party professional sign-off
> > - [ ] - [ ] Property ID Registry: DB table connecting addresses to unique Ledger IDs
> > - [ ] - [ ] Pro Certification Agreement: Contract pros sign before Pro Portal access
> > - [ ] - [ ] Privacy Policy: Data retention for records, certifications, and report purchases
> > - [ ] - [ ] Stripe Integration: $9.99 stamp fee monthly billing + bundle checkout + public report purchases
> >
> > - [ ] ---
> >
> > - [ ] ## X. Frontend Build Roadmap — Futuristic OS Redesign
> >
> > - [ ] **Progress: 28% Complete (2/7 phases done)**
> > - [ ] **Full spec:** `webapp/IMPLEMENTATION_ROADMAP.md` | **Components:** `webapp/DESIGN_SYSTEM.md`
> >
> > - [ ] | Phase | Name | Status | ETA |
> > - [ ] |---|---|---|---|
> > - [ ] | 0 | Foundation (legal pages, CMS, admin panel) | COMPLETE | Done |
> > - [ ] | 1 | Design System (GSAP, Tailwind, Glass components) | COMPLETE | Done |
> > - [ ] | 2 | Navigation & Global UI | NEXT | ~2-3 hrs |
> > - [ ] | 3 | Hero Section (dark bg, phone mockup, GSAP text) | Planned | ~3-4 hrs |
> > - [ ] | 4 | Content Sections (glassmorphism card grids) | Planned | ~4-5 hrs |
> > - [ ] | 5 | Advanced Animations (GSAP scroll, flip cards) | Planned | ~5-6 hrs |
> > - [ ] | 6 | CTA Band & Footer | Planned | ~2-3 hrs |
> > - [ ] | 7 | Polish & Optimization (Lighthouse 90+, a11y) | Planned | ~3-4 hrs |
> >
> > - [ ] **Total remaining: ~19-25 hours**
> >
> > - [ ] ### What's Been Built (Phases 0 & 1)
> > - [ ] - Legal pages (Privacy, Terms, Trust) with DB integration and fallback
> > - [ ] - Admin panel at /admin/content functional
> > - [ ] - GSAP 3.14.2 + ScrollTrigger, clsx, tailwind-merge installed
> > - [ ] - Complete Tailwind OS design system with neon-green/teal/amber color scales
> > - [ ] - Glassmorphism utilities: .glass .glass-strong .glass-green .glass-teal .os-panel
> > - [ ] - Components ready: GlassCard, Button (3 variants), NeonText, OSPanel
> > - [ ] - Animation library: fadeIn, stagger, parallax, pin, scrub utilities
> > - [ ] - DESIGN_SYSTEM.md — 680 lines of documentation
> >
> > - [ ] ### Phase 2 Next Steps — Navigation
> > - [ ] - Redesign logo: futuristic mark + Poppins Bold wordmark in neon green
> > - [ ] - Sticky nav with GSAP ScrollTrigger blur-on-scroll effect
> > - [ ] - Apply glass-strong + neon border bottom to navbar
> > - [ ] - Replace all legacy buttons with new Button component system
> > - [ ] - Files to modify: `webapp/components/Navbar.tsx`, `webapp/components/Footer.tsx`
> >
> > - [ ] ### Completion Checklist (Phase 7)
> > - [ ] - [ ] All 7 phases complete
> > - [ ] - [ ] Homepage matches futuristic OS reference aesthetic
> > - [ ] - [ ] Glassmorphism + neon accents on all sections
> > - [ ] - [ ] GSAP scroll-triggered animations throughout
> > - [ ] - [ ] Mobile responsive 320px – 1920px+
> > - [ ] - [ ] Lighthouse score 90+
> > - [ ] - [ ] WCAG AA accessibility
> > - [ ] - [ ] prefers-reduced-motion respected
> > - [ ] - [ ] Cross-browser: Chrome, Firefox, Safari
> >
> > - [ ] ---
> >
> > - [ ] ## XI. Audit Status (February 20, 2026)
> >
> > - [ ] ### Supabase — ai_personalities Table (6 Personas)
> >
> > - [ ] | Persona | context_type | Home Ledger ref? | Booking ref? | Sales ref? |
> > - [ ] |---|---|---|---|---|
> > - [ ] | Ada | chat | No | No | YES |
> > - [ ] | Aiden | chat | No | No | YES |
> > - [ ] | aiden_default | general | No | No | No |
> > - [ ] | GL365 Assistant | chat | No | No | No |
> > - [ ] | Reed | chat | No | No | No |
> > - [ ] | Sage | chat | No | No | No |
> >
> > - [ ] **GAP:** No Directory Concierge persona exists yet — must be created with Cal.com/Retell booking tools.
> > - [ ] **GAP:** `agents` table has 2 rows with NULL summaries — consolidate into `ai_personalities`.
> >
> > - [ ] ### GitHub Codebase
> > - [ ] - Zero "home ledger" references in active code — clean
> > - [ ] - `property-passport` admin page exists at `webapp/app/admin-v2/property-passport/page.tsx`
> > - [ ] - `tenant_id` + `persona` logic documented in 19 files but NOT enforced in widget init code yet
> >
> > - [ ] ### Repository Structure
> > - [ ] ```
> > - [ ] greenline365-web/
> > - [ ] ├── docs/
> > - [ ] │   ├── GL365_HOME_LEDGER_MASTER_DOC.md   <- THIS FILE (source of truth)
> > - [ ] │   ├── production-readiness-gap-analysis.md
> > - [ ] │   ├── retell-ai-agent-base-template.md
> > - [ ] │   ├── saas-product-architecture.md
> > - [ ] │   └── voice-agent-research-roadmap.md
> > - [ ] ├── webapp/
> > - [ ] │   ├── IMPLEMENTATION_ROADMAP.md         <- Frontend build phases
> > - [ ] │   ├── DESIGN_SYSTEM.md                  <- Component docs (680 lines)
> > - [ ] │   ├── FEATURE_INVENTORY.md
> > - [ ] │   ├── app/                              <- Next.js pages & routes
> > - [ ] │   ├── components/ui/os/                 <- GlassCard, Button, NeonText (ready)
> > - [ ] │   ├── lib/                              <- gsap.ts, utils.ts (ready)
> > - [ ] │   └── supabase/                         <- DB migrations
> > - [ ] ├── backend/                              <- FastAPI proxy (8001 -> 3000)
> > - [ ] ├── n8n-workflows/                        <- Automation workflows
> > - [ ] └── memory/                               <- AI agent memory files
> > - [ ] ```
> >
> > - [ ] ### Developer Priority Queue
> > - [ ] 1. **[CRITICAL]** Enforce Tenant_ID + Persona_Type in `/api/widgets/init`
> > - [ ] 2. **[CRITICAL]** Create Directory Concierge persona in `ai_personalities` with Cal.com/Retell
> > - [ ] 3. **[HIGH]** Start Phase 2 frontend: Navigation redesign (~2-3 hours)
> > - [ ] 4. **[HIGH]** Consolidate `agents` table into `ai_personalities`
> > - [ ] 5. **[MEDIUM]** Map or remove `aiden_default` catch-all persona
> > - [ ] 6. **[MEDIUM]** Build Pro Certification stamp fee Stripe billing ($9.99/stamp monthly)
> > - [ ] 7. **[LOW]** Define Year 5+ renewal flow for Platinum Vault digital hosting
> >
> > - [ ] ### Recently Completed (February 21, 2026)
> > - [x] Trust Network Phase 1 — Badge API + Embed Engine (4 files, 415 lines)
> > - [x] Deep codebase audit — `directory_badges` and `payment_transactions` tables confirmed existing
> > - [x] Migration 032 (`payment_events`) — created and run in Supabase production
> > - [x] `schema.sql` updated with `payment_events` block
> >
> > - [ ] ---
> >
> > - [ ] *Version 2.1 — Updated February 21, 2026*
> > - [ ] *Owner: Jared Tucker | jared.tucker13@gmail.com*

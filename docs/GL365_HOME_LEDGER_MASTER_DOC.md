# GL365 Home Ledger — Master Document
**Version:** 1.0 — Locked & Approved
**Last Updated:** February 2026
**Owner:** GL365 / Jared Tucker

> This is the single source of truth for the GL365 Home Ledger product. All pricing, architecture, system logic, and product decisions documented here are locked. No page, checkout flow, or developer task should contradict this document.
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
> ### What's In the Box (Per Item)
>
> | Item | Description |
> |---|---|
> | Custom Walnut Vault | Dovetail-joint walnut box, blue velvet interior, laser-engraved GL365 Home Ledger logo, brass nameplate with Ledger No. and property address |
> | Hardcover Home Ledger | Professional hardback book, GL365 shield cover, property photo, full verified maintenance history printed inside |
> | Softcover Home Ledger | Same content as hardcover, perfect-bound softcover format |
> | Gold-Foil Certificate | Formal certification document, gold foil seal, certifying the property's verified status |
> | Metal/Walnut QR Tag | Laser-engraved QR code tag linking to the live digital Ledger; scannable at any showing |
> | Flyer/Postcard Pack (50) | 50 branded marketing flyers with GL365 verification callout for open houses and listing marketing |
>
> ### Fulfillment Partners
> - **Books (Hardcover & Softcover):** Lulu API
> - - **Flyers/Postcards:** Lob API
>   - - **Boxes & Tags:** 3PL (third-party logistics partner)
>     - - **Admin Approval:** All physical orders pass through the GL365 Admin Command Center before printing is triggered
>      
>       - ---
>
> ## IV. Pricing Matrix — LOCKED
>
> > These prices are final. They reflect the luxury real estate market. Agents closing $500K+ homes spend $599–$999 without hesitation on tools that differentiate their listing and accelerate closing. Do not discount these without written approval.
> >
> > ### A La Carte Anchors
> > *These exist to make bundles feel like exceptional value. The goal is that no one buys a la carte.*
> >
> > | Item | A La Carte Price |
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
> > **Total a la carte value if buying everything separately: $1,150+**
> > This number must appear on the Platinum Vault product page.
> >
> > ---
> >
> > ### The Bundles (What Homeowners & Agents Actually Buy)
> >
> > #### The Starter Record — $149
> > **Includes:** Softcover Book + Certified PDF + Digital Unlock (1 year)
> > **A la carte value:** $239
> > **Saves:** $90 (38%)
> > **Who buys it:** Homeowners just getting started, or agents on smaller listings who want basic documentation.
> >
> > ---
> >
> > #### The Seller's Showcase — $299
> > **Includes:** Hardcover Book + Gold-Foil Certificate + Flyer Pack (50) + Digital Unlock (1 year)
> > **A la carte value:** $574
> > **Saves:** $275 (48%)
> > **Who buys it:** Listing agents who want a credibility package to hand to sellers as part of their listing presentation. The #1 volume driver.
> >
> > ---
> >
> > #### The Homeowner's Legacy — $449
> > **Includes:** Hardcover Book + Gold-Foil Certificate + QR Tag + Flyer Pack (50) + Digital Unlock (1 year)
> > **A la carte value:** $699
> > **Saves:** $250 (36%)
> > **Who buys it:** Homeowners with 10–20 years of documented improvements who want to present their home professionally before going to market.
> >
> > ---
> >
> > #### The Platinum Asset Vault — $999
> > **Includes:** Walnut Vault Box + Hardcover Book + Gold-Foil Certificate + QR Tag + Flyer Pack (50) + 5-Year Digital Hosting + Concierge Data Entry
> > **A la carte value:** $1,150+ physical + $300+ in services = $1,450+ total
> > **Saves:** $450+
> > **Who buys it:** Agents and homeowners on listings $400K and above who want the complete, definitive asset record. The prestige anchor that makes every other bundle feel affordable.
> > **Positioning:** "The definitive asset record for a home worth protecting. One vault. Every document. Zero questions at closing."
> >
> > ---
> >
> > ### Public Search / Buyer-Facing Prices
> > *For buyers, agents, lenders, and attorneys searching an address on the public directory.*
> >
> > | Option | Price | Description |
> > |---|---|---|
> > | Digital Access | $49 | Instant full unlock of Home Ledger history for one address |
> > | Certified PDF | $65 | Downloadable, bank-ready certified PDF of verified history |
> > | Physical Softcover | $95 | Printed softcover copy of the property record, shipped |
> >
> > ---
> >
> > ### Pro Certification Stamp Fee
> > - **$9.99 per certification** — charged to the Pro (HVAC, roofer, inspector, etc.) each time they certify a Ledger entry through the Pro Portal
> > - - Pros doing 20 jobs/month = ~$200/month recurring per Pro partner
> >   - - 50 active Pro partners = $5,000–$10,000/month passive recurring revenue
> >     - - This fee is invisible to the homeowner and agent — it is a backend B2B revenue layer
> >      
> >       - ---
> >
> > ### Digital Subscription Renewal (After Year 1)
> >
> > | Tier | Price | Notes |
> > |---|---|---|
> > | Basic Digital Access | $29/year | Renews after Starter bundle |
> > | Pro Digital Access | $79/year | Includes certified PDF export + priority verification |
> > | Lifetime (Platinum only) | Included in $999 | 5 years baked in; renews at $29/yr after year 5 |
> >
> > ---
> >
> > ## V. The Integrity Layer — Professional-Only Verification
> >
> > This is the core trust mechanism. It cannot be bypassed.
> >
> > 1. Homeowner uploads a receipt and clicks "Request Audit"
> > 2. 2. System generates a One-Time Handshake Code
> >    3. 3. The Pro (HVAC tech, roofer, inspector) enters the code in the Pro Portal, inspects the work, and clicks "Certify"
> >       4. 4. Entry is marked Verified — homeowner has ZERO edit access to certified entries
> >          5. 5. Pro is charged $9.99 certification stamp fee automatically
> >            
> >             6. **The Hard Rule:** Homeowners can upload. Only licensed Pros can certify. The Ledger is only as trustworthy as this rule is enforced.
> >            
> >             7. **Revenue Loop for Pros:** Contractors can charge homeowners $99–$150 for a "GL365 Certification Visit" — this is a new billable service line for them. GL365 earns $9.99 on every stamp.
> >            
> >             8. ---
> >
> > ## VI. The Website Architecture (Sitemap)
> >
> > ### Public Facing
> > - **Home Page:** Grand entry — multi-service directory, Home Ledger hero section, trust signals
> > - - **Address Search ("Address Hero"):** Enter an address, see blurred Property Passport teaser, upgrade to unlock
> >   - - **Partner Portal Landing:** Pitch page for HVAC, roofers, inspectors to join the Verified Pro network
> >     - - **Vault Gallery:** High-end product page showing all four bundle options with a la carte anchors
> >      
> >       - ### The Store / Checkout
> >       - - **Bundle Product Pages:** Individual pages for each bundle with full value breakdown
> >         - - **Checkout Flow:** Dynamic upsells at cart (e.g., "Add a QR Tag for $125" or "Upgrade to Hardcover for $40 more")
> >           - - **"Claim Your Home" Mobile Page:** QR tag scan destination — "Welcome Home. Claim Your Ledger." with Transfer Security Code entry
> >            
> >             - ### Portals (Logged-In)
> >             - - **Homeowner Dashboard:** View assets, upload receipts to Pending, request Pro-Verification, view Ledger status
> >               - - **Pro Portal:** Enter Handshake Code, certify entries, view certification history, see monthly stamp fee billing
> >                 - - **Admin Command Center:** Fulfillment queue, approve/reject print orders, Lulu/Lob/3PL API status, order tracking
> >                  
> >                   - ---
> >
> > ## VII. The AI Persona System (Home Ledger — Specific)
> >
> > The Home Ledger portal has NO conversational AI widget. It is a data utility. The only AI-adjacent feature is automated status notifications (e.g., "Your HVAC entry has been certified by ABC Heating & Cooling").
> >
> > For AI persona details across all three GL365 systems, see: `docs/AI_PERSONA_ISOLATION.md`
> >
> > ---
> >
> > ## VIII. The Physical Product — Visual Identity
> >
> > - **The Vault:** Walnut box, dovetail joints, blue velvet interior, laser-engraved lid, brass nameplate with Ledger No. and property address
> > - - **The Book:** Navy hardcover, GL365 shield logo, property photo on cover, gold-foil title text
> >   - - **The Certificate:** Cream/ivory stock, gold-foil seal, formal document layout
> >     - - **The QR Tag:** Metal or walnut, laser-engraved QR code, GL365 logo
> >       - - **Color System:** Navy (#1B2B5E), Gold (#C9A84C), White (#FFFFFF), Walnut Brown (#5C3D1E)
> >        
> >         - ---
> >
> > ## IX. Necessary Documentation (Developer & Legal Checklist)
> >
> > - [ ] **API Handbook:** Handshake Code generation logic, ownership transfer on QR scan, Pro certification flow
> > - [ ] - [ ] **Fulfillment Specs:** Lulu API endpoints (books), Lob API endpoints (postcards), 3PL webhook (boxes/tags)
> > - [ ] - [ ] **Terms of Service:** Must state "Verified status requires third-party licensed professional sign-off. GL365 does not self-certify homeowner uploads."
> > - [ ] - [ ] **Property ID Registry:** Master database table connecting property addresses to unique Ledger IDs
> > - [ ] - [ ] **Pro Certification Agreement:** Contract pros sign before accessing the Pro Portal
> > - [ ] - [ ] **Privacy Policy:** Data retention policy for homeowner records, pro certifications, and buyer report purchases
> > - [ ] - [ ] **Stripe Integration:** Certification stamp fee ($9.99) billed monthly to Pro accounts; bundle checkout; public report purchases
> >
> > - [ ] ---
> >
> > - [ ] ## X. Audit Status (February 2026)
> >
> > - [ ] ### Supabase Database
> > - [ ] - `ai_personalities` table: 6 personas exist (Ada, Aiden, aiden_default, GL365 Assistant, Reed, Sage)
> > - [ ] - No cross-contamination found in system prompts — Home Ledger and directory references are clean
> > - [ ] - **GAP:** No "Property Asset Manager" Home Ledger persona exists (not needed — no widget in portal)
> > - [ ] - **GAP:** No "Directory Concierge" persona exists yet — needs to be created
> > - [ ] - `agents` table: 2 rows (aiden_sales, susan_booking) — both have NULL personality summaries — needs consolidation
> >
> > - [ ] ### GitHub Codebase
> > - [ ] - Zero "home ledger" references in active code files — clean
> > - [ ] - `property-passport` page exists at `webapp/app/admin-v2/property-passport/page.tsx`
> > - [ ] - `tenant_id` + `persona` logic exists in documentation (19 files) but NOT yet enforced in widget init code — **Priority 1 developer task**
> >
> > - [ ] ### Developer Priority Queue
> > - [ ] 1. Build `Tenant_ID` + `Persona_Type` enforcement into `/api/widgets/init`
> > - [ ] 2. Create Directory Concierge persona in `ai_personalities` with Cal.com/Retell booking tools
> > - [ ] 3. Consolidate `agents` table into `ai_personalities` — pick one source of truth
> > - [ ] 4. Audit and remove `aiden_default` catch-all or assign strict page mapping
> > - [ ] 5. Build Pro Certification stamp fee billing (Stripe, $9.99/stamp, monthly invoice to Pro)
> >
> > - [ ] ---
> >
> > - [ ] *Document locked. Last reviewed and approved: February 2026.*
> > - [ ] *For questions contact: jared.tucker13@gmail.com*

# GL365 Home Ledger — Deep Vision & Architecture Brainstorm

**File:** `docs/brainstorming/home-ledger-vision-deep-dive.md`
**Status:** Draft — Brainstorming
**Created:** 2026-02-27
**Author:** Jared Tucker (Creator, GL365)
**Source:** Full brainstorming session with Gemini, reviewed and annotated

> This document captures the complete vision for the Home Ledger ecosystem — the "Carfax for Homes" — including the Property Health & Liability Assessment, the Digital Employee model, the Forensic Documentation Protocol, the Universal Accountability Grid, and the QR Unit Passport system. It is the narrative companion to `home-ledger-launch.md` (decisions & pricing) and `GL365_HOME_LEDGER_MASTER_DOC.md` (product spec).

---

## DEPRECATION NOTICE

**Google Apps Script (GAS) / gas-automator is DEPRECATED.** All references to GAS, Google App Scripts, and the `gas-automator` skill in prior brainstorming documents are no longer valid. The platform will NOT use GAS for any automation. Disregard any overlapping information from those references.

---

## I. THE CORE PHILOSOPHY — "THE HOME AS THE SOVEREIGN"

The fundamental shift is moving data away from the "Contractor Island" (ServiceTitan, Housecall Pro, etc.) and onto the **Property Mainland.**

- **Data Ownership:** The property history belongs to the address (`property_id`), not the business (`contractor_id`). When you switch from one company to another, that company can get all your information.
- **The "Stain vs. Shield" Incentive:** Homeowners are incentivized to perform repairs to keep their "Home Health Score" green and avoid a permanent "Stain" on the Ledger.
- **Asset Portability:** Homeowners can switch contractors without losing their "medical history," forcing contractors to compete on service quality, not data-holding.
- **Industry Accountability:** Only bad actors and cheap customers will not want to use this platform. The goal is to shape the industry through accountability.

> "I see a world where you don't 'buy a house' — you inherit a data-rich Property Passport. When a technician walks up to a home, they don't ask the owner what's wrong; they scan the Greenline QR Shield on the unit and instantly see its entire life history."

---

## II. THE THREE-LAYER DATA ARCHITECTURE

Every service visit generates data that gets split into three distinct layers. **These layers must never cross-contaminate.**

### Layer 1 — The Sales Presentation ("The Value Bomb")

**Purpose:** Education, marketing, and closing the deal.

- **Photo Coverage:** This is where all 20+ photos live. The AI uses thumbnail grids for less critical shots and full-page features for the hazards.
- **Content:** Includes the technician's name, their bio, the company's license number, and "Educational Briefs" (e.g., "Why microbial growth matters for your lungs").
- **Pricing:** This is the ONLY place where the 4-tier pricing lives (Maintenance, Band-Aid, Restoration, Replacement).
- **Fate:** Once the job is closed, this document is saved in the "Marketing/Sales" database for follow-up but is **NOT** part of the permanent home record.

### Layer 2 — The Official Incident Report ("The Forensic Record")

**Purpose:** Legal protection and professional documentation.

- **Content:** Stripped of ALL "sales" language. Strictly: Findings, Proposed Fix, Was it performed or not, Response.
- **Photo Selection:** If the tech snaps 20 photos, the AI selects the 5 most relevant/verifying images to include here.
- **The Ledger Link:** This document is what "flags" the Home Ledger if a hazard is left unaddressed.
- **No Pricing:** No pitch, no cost estimates, no presentation — just the technical facts.

### Layer 3 — The Home Ledger ("The Asset Value")

**Purpose:** Proving the home's worth to future buyers, insurers, or inspectors.

- **The Rule:** No pricing. No "pitches."
- **Success Entries:** "02/2026: Certified HVAC Restoration performed by [Company]. 100% Clearance." → This ADDS value.
- **Failure Entries:** "02/2026: Active Biological Hazard Reported. Status: Unresolved." → This DETRACTS value.
- **The Only Numbers:** Only time something like numbers would go in the Home Ledger is when it affects the value of the home.

### The Incentive Logic

> "Mr. Jones, because I'm a Certified Greenline Pro, I have a duty to report this biological growth to the Home Ledger system. If I file this now, it becomes a 'Stain' on your property's history. However, if we perform the restoration today, I can skip the Incident Report and instead file a 'Certified Maintenance Success,' which actually proves to your insurance company that this home is being perfectly maintained. Which would you prefer?"

If the homeowner fixes the problem, the tech doesn't even need to file a negative incident report — they file a **Maintenance Success** instead. That's the only true way to keep it off the house record.

---

## III. THE PROPERTY HEALTH & LIABILITY ASSESSMENT (The 4-Page Report)

When a technician presents to a homeowner, they receive a branded multi-page report — the "Value Bomb." This is Layer 1 (Sales Presentation).

### Page Structure (Flexible — Not Hard-Capped)

The page count is NOT fixed. If a technician is thorough and takes 20 photos, the report expands. Photos get narrowed into thumbnails as needed.

**Page 1 — The Cover Letter & Executive Summary**
- The high-level Health Score (e.g., 42/100)
- **Cover letter explaining the purpose of the technician's visit**
- **Technician name documented**
- **Company's license on the report**
- Financial Impact: A chart showing their "Efficiency Tax" (overpaying the power company)
- Authority Statement: This audit was generated by the Greenline365 AI Engine based on factory specs, not technician opinion

**Page 2+ — Forensic Evidence & Education**
- Before photos: High-res images of biological growth, rusted coils, leaking drain pans
- AI Annotations: Red circles and arrows highlighting danger zones
- **Educational explanations:** What they're looking at, why it's healthy or not, educating the customer
- Vertical Integration: For plumbing — pipe corrosion; for electrical — panel hotspots

**Action Plan Page — The 4-Option Choice**
- The "Choose Your Own Adventure" for the homeowner
- Option 1: $0 Maintenance / Liability Waiver
- Option 2: The Band-Aid Fix
- Option 3: The Restoration (Peace of Mind)
- Option 4: The System Pivot (Full Replacement)
- **Psychology:** By putting the $0 option next to the full replacement, the middle options look reasonable

**Final Page — Liability Shield & Ledger Sync**
- The Warning: What happens if they don't act
- The Ledger Stamp: Visual showing a Red Stain being applied if hazard goes unresolved
- **The "Proof of Presence" data** (GPS, timestamps, service order reference)

### The "On-Site Print" Concept — "The Van Office"

Workflow:
1. **Snap:** Tech takes photos via Slack or app
2. **Generate:** AI produces the PDF in seconds
3. **Review:** Tech reviews on tablet with the homeowner
4. **Print:** Tech prints from tablet to a mobile color printer (Brother PocketJet or vehicle-mounted Epson)
5. **Present:** Tech walks back with a warm, color-printed report

> **Why this wins:** Homeowners often say "Email it to me" as a way to get the tech to leave so they can ignore the problem. If the tech says, "I actually have your Official Property Audit printed out for your records right here," that excuse disappears. It stays on their kitchen counter, staring at them until they fix the problem.

---

## IV. THE "DIGITAL EMPLOYEE" MODEL

The AI isn't a tool — it's an employee of the specific company it's deployed for.

### What It Does

- **The Auditor:** Reviews every photo. If the tech claims the system is "fine" but the AI sees biological growth, it interrupts: "Wait, I see potential microbial growth in Photo 3. Per company SOP, we must generate a Hazard Notification before closing this job."
- **The Sales Closer:** Applies the "4-Option Strategy" perfectly every time using the company's specific pricing. Takes the "opinion" out of the technician's mouth.
- **The Technical Writer:** Turns the technician's messy notes into the Property Health & Liability Assessment in seconds.
- **The Record Keeper:** Handles sync to the GL365 Home Ledger. Knows when to issue a "Certificate of Maintenance Success" (Shield) vs. an "Active Incident Report" (Stain).

### The Knowledge Base = The Company Bible

Each business uploads their "Company Bible" — their specific price book, preferred equipment brands, warranty terms, and service SOPs. The AI then acts as the Company's Digital Supervisor.

**What the Knowledge Base contains:**
- **The Price Book:** Exactly what they charge for every part, service, and hour
- **The Service Standards:** Does this company require a "Nitrogen Purge" on every install? The AI will ask the tech for verification photos
- **The "Vibe" & Branding:** Does the company want to sound "Hometown Friendly" or "High-Tech Corporate"? The AI adjusts the report's tone to match

### Eliminating the "Rogue Tech"

A technician tries to skip a step or give an unauthorized discount:
- The System says: "Company Policy (Knowledge Base Section 4.2) requires a full static pressure test for all 10+ year units. Please upload a photo of the manometer reading to proceed."
- The tech can't skip it. The AI enforces the business owner's standards across 100 techs as easily as it does for one.

### The Business Owner's "Commander Dashboard"

The portal becomes the "Brain Surgery" room:
1. **Upload Knowledge:** Drag and drop PDF price books and company manuals
2. **Set Rules:** Toggle on/off things like "Mandatory Liability Waiver for Mold" or "Auto-Trigger Option 4 for units over 12 years"
3. **Monitor Intelligence:** Live feed of reports being generated

---

## V. DOMAIN ISOLATION — THE "VERTICAL GATE" ARCHITECTURE

The AI must stay in its lane. An HVAC tech's AI must NOT offer plumbing advice. A roofer's AI must NOT suggest electrical work.

### How It Works

When a technician starts a job, the system checks their **Company Profile** to determine vertical:
- Company A: "Tampa Heat & Air" → Role: HVAC Specialist → Only loads HVAC knowledge
- Company B: "Clear Flow Plumbing" → Role: Master Plumber → Only loads plumbing knowledge

The AI doesn't load every skill at once. It only "injects" the knowledge for the relevant trade. It literally cannot see the plumbing codes if it's in HVAC mode.

### The Knowledge Base Makes It Company-Specific

The system is set up to the specific business's knowledge base. It has all that information pre-loaded. The AI becomes an employee of THAT company, using THEIR prices and THEIR licenses.

### The "Professional Hand-off" (Cross-Trade Lead Loop)

When an HVAC tech notices a plumbing leak in the background of a photo:

1. **Detection:** AI notices a plumbing leak in a "Context Photo"
2. **Internal Flag:** AI tells the tech: "I noticed a plumbing leak in Photo 4. This is outside your scope. Would you like me to flag this as a 'Community Lead'?"
3. **The Result:** The tech clicks "Yes." The system sends a notification to the homeowner: "During your HVAC audit, our system detected a potential plumbing hazard. Connect with a Verified Greenline Plumber for a safety assessment."

This protects the tech's liability but captures the referral revenue for the platform.

---

## VI. MANDATORY EVIDENCE MATRIX — UNIVERSAL TECH CHECKLIST

Every vertical needs a Must-Have Photo List. If a tech misses one, the "Digital Employee" won't generate the report.

### Universal Must-Haves (All Trades)

| # | Photo | Why |
|---|-------|-----|
| 1 | **Screenshot of Dispatch/Work Order** | Establishes date, time, and initial complaint. Proof of presence. |
| 2 | **Asset Identity (Model/Serial Plate)** | The "VIN Number" of the equipment. Documentation purposes. |
| 3 | **Context Shot** | Wide-angle of the unit in its environment (attic, backyard, closet) — shows workspace safety and code compliance |

### Trade-Specific Deep Data Photos

| Industry | Mandatory Photos | AI "Secret Tip" Logic |
|----------|-----------------|----------------------|
| **HVAC** | Manifold/Gauges (pressures), Thermometer, Inside of air handler, Ductwork photos, Outside unit | AI reads the gauge dials. If pressures are low but tech says "system is fine," AI whispers: "Sub-cooling indicates a 15% charge loss. Suggest a leak search." Over time, it predicts when the system is leaking based on historical pressure photos. |
| **Roofing** | Flashing detail, Granule loss close-up, Drip edge | AI analyzes shingle wear. "Granule loss indicates 85% of life consumed." |
| **Plumbing** | Water meter flow, P-Traps, Water heater relief valve | AI detects slow leaks at the meter. "Continuous flow detected. Pressure at 80PSI; high risk for pipe burst." |
| **Electrical** | Panel interior (bus bars), GFCI testing, Service entrance | AI spots "Double Taps" or scorched wires. "Arcing detected on breaker 12. Potential fire hazard." |
| **Mold/Remediation** | Moisture meter reading, Thermal imaging (FLIR) | AI cross-references humidity and temp. "Dew point reached behind this wall." |
| **Insulation** | Attic photos, R-value measurement | AI analyzes: "R-Value is currently R-19 (Code is R-38 in Florida)." |

### HVAC-Specific Deep Dive

- **Gauges/Manifolds:** AI extracts the pressure readings from photos, knows what pressures are supposed to be for that specific model. Can give the technician tips based on readings.
- **Predictive Maintenance:** Over time, tracks pressure readings across visits. "3 years ago, gauges showed 120 PSI. Today: 105 PSI. This system has a slow leak in the evaporator coil."
- **Address-Centric History:** Because data is linked to the address, ANY company that goes to that home can access historical gauge photos. This is what sets GL365 apart.

---

## VII. THE "SECRET WINDOW" — TECH-ONLY INTELLIGENCE

While the customer gets the "Value Bomb," the technician gets a **private, high-level Field Coach** that the customer cannot see.

- **Predictive Maintenance:** "Hey Joe, 3 years ago, the gauges showed 120 PSI. Today they are at 105 PSI. This system has a slow leak in the evaporator coil. Check there first."
- **Troubleshooting Tips:** "Based on the model number you just snapped, this specific unit is known for faulty TXV valves. Here is how to test it."
- **Safety Warnings:** "That panel you just opened is a Zinsco. DO NOT pull the breaker without a face shield."
- **Company-Specific Training:** The business owner can program their sales training into the AI. If the owner uses the "Four-Option Rule," they set it as a global mandate.

---

## VIII. THE FORENSIC DOCUMENTATION PROTOCOL (NO MANDATORY SIGNATURE)

### The Decision

**Digital signatures are NOT the end-all for the incident report.** Many homeowners won't want to sign. As long as all the photos are there with the service order screenshot, that should be enough. There's actual proof that the service pro was at that home. As long as everything is reported and documented, that's all that really matters.

### The "Proof of Presence" Protocol — Triple-Lock Verification

Instead of a signature, the Incident Report is "Locked" by three data points:

1. **The Service Order Screenshot:** Establishes "Contractual Intent." Proves the pro was invited to the home to perform specific work.
2. **GPS Geofencing:** Every photo is tagged with latitude/longitude coordinates. Cross-referenced with the address in the Ledger. Proves the tech was standing at the customer's property.
3. **The Timestamp:** A permanent, uneditable epoch timestamp on every image.

### "Certified Delivery" Logic

If the homeowner won't sign:
1. Tech hits "Send Report" in the app
2. System sends the report via Email and SMS
3. We track "Open" and "Click" events
4. The Ledger logs: "Notification of Hazard delivered and viewed by Property Owner on [Date/Time]"

From a liability standpoint, "I sent it and they viewed it" combined with forensic photos is powerful documentation.

### Updated Report Language (No Signature Required)

```
NOTICE OF DOCUMENTED HAZARD
• Status: Unresolved / Refused
• Verification: GPS Verified @ [Coordinates] | Timestamped @ [Time]
• Professional Duty: This document serves as a formal record that the
  Property Owner was notified of the hazards listed below. Professional
  recommendations were provided to mitigate risk to life and property.
• Record Status: This incident has been permanently logged in the GL365
  Home Ledger to ensure the transparency of the property's health history.
```

### Signature is Still Available — Just Not Required

The existing digital signature infrastructure (`webapp/app/sign/[token]/page.tsx`) remains available as an **optional** enhancement. When a homeowner IS willing to sign, it adds another layer of verification. But the system does NOT block report filing if the homeowner declines.

---

## IX. INDIVIDUAL ASSET HEALTH SCORES (Per-Unit "Medical Records")

Every major appliance in the home gets its own individual Health Score (1-100). This is the heart of the system.

### The Scan Experience

When someone scans the QR sticker on a unit, they see a Visual Dashboard (Obsidian Silk / Bentley Standard):

**Section 1 — Vital Signs (Red/Yellow/Green)**
- Health Score: Overall grade (e.g., 92/100)
- Life Expectancy: Countdown based on "Repair vs. Replace" logic. "Estimated 4 years of optimal life remaining."
- Efficiency Rating: "Performing at 98% of factory spec."

**Section 2 — Verification Badges**
- Maintenance Success Shield: Unit has passed its last 3 inspections
- Warranty Status: Digital proof of parts and labor coverage
- Pro-Verified: Logo of the company that last touched it, linking to their Greenline Rating

**Section 3 — Transparent History (For Buyers)**
- Scrollable timeline of every "Success" stamp
- If there was a "Stain" that was fixed, it shows as "Hazard Resolved & Certified" — which actually builds MORE trust than if nothing was ever reported

### Health Score Calculation by Vertical

| Asset | Health Score Factors |
|-------|---------------------|
| **Air Handler** | Suction Pressure + Temperature Split + Static Pressure + Visual Cleanliness of Coil |
| **Water Heater** | Age + Anode Rod presence + History of Tank Flushes + Leak Sensor status |
| **Electrical Panel** | Brand (non-recalled?) + Surge Protection + Thermal Scan history (no hotspots) |
| **Roof** | Shingle wear + Flashing integrity + Age + Storm damage history |
| **Plumbing Main Line** | Water pressure + Pipe material + Leak history + Water chemistry |

---

## X. THE QR UNIT PASSPORT — PHYSICAL STICKER SYSTEM

Greenline365 QR Code stickers that the technician puts directly onto a unit. Anyone can scan that unit and pull up the history.

### Context-Aware Scanning

The QR code knows who is scanning and changes the experience:

| Who Scans? | What They See | The Result |
|------------|--------------|------------|
| **The Technician** | The Medical Record: Past pressures, photos of the coil, "Secret Tips," Action Plan generator | Instant intelligence. No more guessing what the last guy did. |
| **The Homeowner** | The Concierge: "Is my unit healthy?" status, "Book Service" button, leave a review | Frictionless loyalty. They don't search Google — they scan the sticker. |
| **The Buyer/Inspector** | The Verification: Certified history of every maintenance stamp. Health Score. | Asset value proof. House sells for more because the data proves it's cared for. |

### The Feedback & Review Loop

- **Verified Scans Only:** To leave a review that affects a business's badge, the user must scan the physical QR code. Proves they were actually at the house.
- **The Nudge:** 24 hours after a tech closes a job, the homeowner gets a notification: "Scan the sticker on your AC unit to verify the repair and unlock your 'System Shield' warranty."
- **The Review Gate:** After scanning, first thing they see: "How did Joe do today? Rate 1-5 stars to update their Greenline Professional Badge."

### The "Portability" Advantage

1. **Old Way:** New company says, "I don't know what they did, I have to charge you $250 just to figure it out."
2. **The Greenline Way:** New company scans the sticker. AI says, "Welcome. This unit has a 5-year history of 115 PSI suction pressure. Last coil cleaning was 06/2025."

The homeowner is in total control. The data stays with the house, making the transition between companies seamless.

### Sticker Application Workflow

A mandatory step in the AI Audit:
1. Tech snaps a photo of the unit
2. AI Check: "No Greenline QR detected. Please apply Sticker #GL-XXXX and scan it to initialize this unit's Property Passport."
3. Tech peels, sticks, and scans
4. Sync: That sticker is permanently "married" to that serial number and that address in Supabase

### Sticker Design Specs

- **Material:** High-heat, UV-resistant brushed silver or "Obsidian Silk" vinyl
- **Text:** "Certified Greenline365 Protected Asset. Scan for History & Service."
- **The Look:** Should look like it came from the factory — giving the homeowner the feeling their unit is part of an elite "Monitored" network

---

## XI. CERTIFICATES — THE "SHIELD" STRATEGY

By flipping the narrative from "You have a problem" to "You have an opportunity to earn a Certificate," the technician changes from a bearer of bad news into a Value Creator.

| Certificate | Trigger | Why It Matters |
|------------|---------|----------------|
| **Certified Maintenance Success (CMS)** | Full inspection + No outstanding Stains | Lowers insurance risk profile; proves "pride of ownership" to buyers |
| **Indoor Air Quality (IAQ) Clearance** | Post-mold remediation or UV/Air Scrubber install + Lab tests | Removes health liability; essential for selling homes with leak history |
| **Energy Efficiency Seal** | Blown-in insulation top-off or SEER2 upgrade + Manual J load calc | Proves lower utility bills; can increase home value 1-3% |
| **Safe-to-Sell Audit** | Full electrical, plumbing, and HVAC check within 90 days of listing | Pre-empts home inspectors; gives seller the upper hand |

### The "Founding Member — Est. 2026" Badge

- **Decision: YES.** Founding homeowners get a visible badge on their Ledger.
- This isn't just a vanity metric — it tells a future buyer: "This homeowner has been obsessively transparent about this property's health since the day this system launched."
- When that home goes on the market in 2030, that "2026" badge proves four years of unbroken maintenance records.

---

## XII. ASSET VALUE RESEARCH — HOW STAINS COST MONEY

The Greenline365 Brain cross-examines three data sources to quantify the financial impact of unresolved issues:

1. **Cost-to-Complete Research:** AI pulls local market data for what a typical remediation or replacement costs. If a fix costs $10k, the "Ledger Stain" is at LEAST -$10k because a buyer will demand that credit.
2. **Inspection Failure Data:** Homes with "deferred maintenance" on inspection reports typically sell for 5-10% less than "turn-key" homes.
3. **Insurance Premium Modeling:** "Active Water Leaks" or "Outdated Electrical Panels" increase insurance premiums. The AI translates "Monthly Extra Cost" into a "Lump Sum" value loss.

---

## XIII. THE "OPEN HOUSE" ADVANTAGE

This creates a new standard for selling a home. Instead of a seller saying "Everything works great," they provide a **Greenline Asset Portfolio.**

- **The Buyer's Peace of Mind:** They scan the QR on the AC, the Roof, and the Panel. They see "Green" across the board. They make a higher offer with fewer contingencies.
- **The Inspector's Shortcut:** A home inspector sees the Greenline QR codes and realizes the data entry is already done. They can cross-verify the AI's findings, making inspections faster.
- **The Seller's Edge:** A "Greenline Verified Home" with 4+ years of verified maintenance records sells faster and for more money.

---

## XIV. THE UNIVERSAL SERVICE SCHEMA

To handle any industry, a Hierarchical Price Book allows the same "Action Plan" logic to work for any trade.

| Level | Data Point | Example (HVAC) | Example (Plumbing) |
|-------|-----------|----------------|-------------------|
| Industry | `vertical_id` | HVAC | Plumbing |
| Category | `service_cat` | Indoor Air Quality | Main Line |
| Item | `unit_type` | UV-C Germicidal Light | Tankless Water Heater |
| Action | `repair_code` | Sanitize Coil ($285) | De-scale Unit ($350) |
| Impact | `ledger_effect` | +5 Health / +2 Value | +8 Reliability / +4 Value |

---

## XV. PLATFORM REVENUE MODEL — WHY BUSINESSES PAY

For a business owner, the "Digital Employee" solves their three biggest headaches:

1. **Consistency:** Every customer gets the same "Gold Standard" presentation, whether it's the tech's first day or their tenth year.
2. **Liability:** The AI never skips the signature on a hazard report. It is the company's "Iron Dome" against future lawsuits.
3. **Revenue Capture:** By objectively identifying "Option 4" (Replacement) opportunities based on age/repair math, it generates leads the sales team might have missed.

### The "Employee" Math

- If a "Digital Supervisor" costs $1,750/mo, it's $21,000/year. A human supervisor costs $80,000+. That's a 75% savings.
- If the "Option 4" logic closes just one extra HVAC install per month ($12,000–$18,000), the system pays for itself for the entire year in 30 days.

---

## XVI. IMPLEMENTATION PRIORITIES — WHAT NEEDS TO BE BUILT

### Production Ready (Use Now)

| Component | Location | Status |
|-----------|----------|--------|
| Incident Report PDF | `webapp/lib/pdf/IncidentReportPDF.tsx` | Professional multi-section report, 927 lines |
| AI Image Analysis | `webapp/app/api/incidents/analyze/route.ts` | Claude Opus 4.6 HVAC damage detection |
| AI Report Generation | `webapp/app/api/incidents/generate-report/route.ts` | Structured findings, risk assessment, recommendations |
| PDF Generation API | `webapp/app/api/incidents/generate-pdf/route.ts` | Generates, SHA-256 hashes, stores to Supabase |
| Digital Signatures (optional) | `webapp/app/sign/[token]/page.tsx` | Secure token, acknowledge/refuse, IP logging — available but NOT required |
| /home-ledger Page Shell | `webapp/app/home-ledger/page.tsx` | Structure exists, needs freemium rewrite |
| QR Code Generation | `webapp/lib/qr/generate.ts` + `webapp/app/api/qr/route.ts` | Self-hosted using `qrcode` npm package |
| QR Scan Handler | `webapp/app/scan/[type]/[id]/page.tsx` | Context-aware scan routing |

### Schema Ready — Needs Wiring

| Component | What Exists | What's Missing |
|-----------|-------------|----------------|
| EXIF/GPS Extraction | `exif_data` JSONB column on `incident_images` | No EXIF parsing library installed. Fix: Install `exifr`, extract on upload. |
| GPS in PDFs | `IncidentReportPDF.tsx` line 599-603 renders GPS if exists | Data never populated. Wiring EXIF extraction fixes this. |
| Photo Timestamps | `taken_at` column on `incident_images` | Never populated from EXIF. Same fix. |

### Needs to Be Built (New Work)

| Priority | Component | Notes |
|----------|-----------|-------|
| **HIGH** | /home-ledger page rewrite | Add freemium tier comparison, $19 founding offer with urgency counter, "Free Home Health Score" hook |
| **HIGH** | Home Ledger Founding Member DB schema | `home_ledger_members` table with tier, price lock, founding number. Counter for "X of 500 spots remaining." |
| **HIGH** | Founding Member enrollment + Stripe payment | $19/mo founding or $29/mo standard. Self-serve from landing page. |
| **HIGH** | Standalone homeowner dashboard | Stripped-down consumer view. Health scores, certificates, locked/unlocked Filing Cabinet. |
| **MEDIUM** | "Founding Member — Est. 2026" badge | New badge type for homeowner Ledger dashboard |
| **MEDIUM** | Per-asset Health Score engine | 1-100 score calculation logic per vertical (HVAC, Plumbing, Electrical, Roofing) |
| **MEDIUM** | QR "Unit Passport" sticker system | Context-aware scan → Tech view / Homeowner view / Buyer view |
| **MEDIUM** | "Proof of Presence" PDF template | GPS-verified photos + service order screenshots + timestamps |
| **MEDIUM** | "Connect with Verified Greenline Pro" CTA | Triggered when asset health drops below threshold → routes to GL365 directory |
| **MEDIUM** | Knowledge Base Ingestor | Tool to turn PDF price books into structured AI-readable data |
| **MEDIUM** | Post-visit review loop via QR scan | Scan sticker → rate technician → update Greenline Professional Badge |
| **LOW** | Certificate generation system | CMS, IAQ Clearance, Energy Efficiency Seal, Safe-to-Sell Audit |
| **LOW** | Property Manager portfolio dashboard | Multi-property view, bulk pricing ($24/mo at 20+ units), bad-actor flagging |
| **LOW** | Asset Value Research engine | Cross-reference repair costs with home appraisal data |
| **LOW** | "Secret Window" tech-only tips | Private intelligence channel for technicians |
| **LOW** | Inter-trade hand-off / Lead Loop | Flag plumbing issues during HVAC calls, route to appropriate Greenline Pro |

---

## XVII. KEY DECISIONS LOG

| Date | Decision | Details |
|------|----------|---------|
| 2026-02-27 | **No GAS / Google Apps Script** | All GAS/gas-automator references deprecated. Platform will NOT use GAS. |
| 2026-02-27 | **Signatures optional, not required** | Forensic documentation (GPS + Timestamps + Service Order) is sufficient. Signature available but not mandatory. |
| 2026-02-27 | **Home Ledger is standalone** | Homeowners can buy it without the Command Center. Creates dual-sided marketplace. |
| 2026-02-27 | **Freemium model confirmed** | Free read-only tier activated by Pro scan. $29/mo for full access. |
| 2026-02-27 | **500 founding homeowners at $19/mo for life** | Price locked forever. Creates viral growth engine. |
| 2026-02-27 | **Founding Member badge — YES** | "Founding Member — Est. 2026" visible on Ledger. Proves data vintage. |
| 2026-02-27 | **/home-ledger landing page update — YES** | Must show freemium model + founding offer before outreach begins. |
| 2026-02-27 | **PM bulk pricing confirmed** | $29/mo per property (1-19 units), $24/mo per property (20+ units) |
| 2026-02-27 | **Walnut Vault is Platinum-only** | Custom Walnut Vault only available in The Platinum Asset Vault ($999). $450 a la carte. |
| 2026-02-27 | **Three-layer data separation** | Sales Presentation / Incident Report / Home Ledger are distinct and never cross-contaminate. |

---

## RELATED DOCUMENTS

- `docs/brainstorming/home-ledger-launch.md` — Launch spec, pricing decisions, codebase audit
- `docs/GL365_HOME_LEDGER_MASTER_DOC.md` — Product spec, physical product line, pricing matrix
- `docs/brainstorming/pricing-strategy.md` — Full pricing strategy across all products
- `docs/brainstorming/master-spec-2026.md` — Full 2026 ecosystem vision
- `memory/AUDIT_SYSTEM_SPEC.md` — Audit system and Clean Bill of Health spec

---

*Created: 2026-02-27*
*Status: Brainstorming — captures full vision for Home Ledger ecosystem, Digital Employee model, QR Unit Passport system, and Universal Accountability Grid.*

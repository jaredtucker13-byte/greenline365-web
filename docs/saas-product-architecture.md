# GreenLine365 SaaS Product Architecture
## Voice Agent + Booking System — Multi-Industry Platform

Version: 1.0 | Date: February 19, 2026 | Status: Brainstorm Complete

---

## PART 1: Moving On From Grace

Grace was the prototype. Now we build the platform.

The three questions that define every client deployment:
1. How many people/resources need their own calendar?
2. Does the client have a CRM already, or do they need ours?
3. How complex is their sales/booking process?

---

## PART 2: The Three Product Configurations

### Config A — Solo Agent + Single Calendar ("The Answering Machine That Books")
Best for: 1-2 person businesses who just need calls answered and appointments booked.
Includes: 1 Retell agent, 1 Cal.com calendar, optional GL365 lite CRM, SMS confirmation, call logs.
Industries: Solo HVAC tech, plumber, electrician, accountant, therapist, coach, notary, trainer, photographer.
Logic: 1 business -> 1 Cal.com account -> 1 event type -> 1 phone -> 1 agent.
Pricing: $2,500 setup + $1,500/mo

### Config B — Multi-Resource Agent + Multi-Calendar + GL365 CRM ("The Full Command Center")
Best for: Multi-staff businesses without an existing CRM who want the full Property Intelligence system.
Includes: 1 Retell agent (routes by service to correct staff), multi-resource Cal.com, GL365 CRM, Property Intelligence Engine, Pre-Greeting Edge Function, emergency alerts, outbound reminders, dashboard.
Industries: HVAC (3-10 techs), barbershop (4-8 barbers), auto repair (3-5 bays), law firm, medical/dental, roofing (multiple crews), cleaning service, spa/salon.
Logic: 1 business -> 1 Cal.com account -> multiple event types (per service) -> multiple calendars (per staff) -> 1 agent that routes to correct calendar -> 1 source of truth (GL365 CRM).
Barbershop routing example: "I want Marcus" -> check_availability(resource:marcus) -> book on Marcus calendar. "Anyone available" -> check all calendars -> first open slot.
Pricing: $3,500 setup + $2,000/mo

### Config C — Agent + External CRM Integration ("The Bridge Builder")
Best for: Businesses that already have a CRM and want our voice agent to plug INTO their existing system.
Includes: 1 Retell agent, Cal.com or their existing booking system, webhook bridge (GL365 to their CRM), custom MCP function mapping to their API, call logs in GL365 admin.
Supported integrations: HighLevel, HubSpot, Jobber, ServiceTitan, Square Appointments, Mindbody, Calendly.
Logic: Agent calls -> their availability API -> books in their system -> syncs call log back as CRM note.
Pricing: $5,500 setup + $3,500/mo (custom integration labor)

---

## PART 3: Industry Deep Dives

### HVAC — Complexity: High
Discovery questions: How many techs? Residential/commercial/both? Emergency/after-hours coverage? Current software (ServiceTitan, Jobber, Housecall Pro)? Maintenance agreements? Service types (install, repair, tune-up, emergency)? Financing offered? Service area?
Calendar: 1 per tech. Separate event types per service. Buffer time for travel. Seasonal demand spikes.
Agent behavior: Emergency detection critical (no heat/AC = emergency). Must ask before scheduling. Know after-hours rates. Cancellation nudge — high no-show rate.
Existing CRM: ServiceTitan, Jobber, Housecall Pro, or nothing.

### Barbershop — Complexity: Medium-High
Discovery questions: How many barbers? Preferred barber or first-available OK? Services (haircut, fade, beard, shape-up, color, kids)? Duration per service? Walk-ins or appointments or both? Current booking app (Booksy, StyleSeat, Square, GlossGenius)? Walk-in waitlist by SMS? Hours per barber (vary by person)?
Calendar: 1 per BARBER (not per shop). Each barber has own services and pricing. First-available mode. Preferred barber mode. Senior barbers may charge more.
Agent behavior: Match to barber preference using memory. Handle "I don't care who." SMS-based walk-in queue. "Is Marcus available today?" before recommending another.
Existing CRM: Booksy, StyleSeat, Square Appointments, or none.

### Auto Repair — Complexity: Medium
Discovery questions: How many service bays? Specialized mechanics (e.g., transmission only)? Services (oil change, brakes, tires, diagnostics, transmission)? Estimates needed before booking? Same-day or drop-off? Average job time? Shuttle/loaner car? Current system?
Calendar: Calendars = bays (not mechanics). Duration varies widely. Drop-off vs. wait appointment types. First available bay logic.
Agent behavior: "What is the issue with your vehicle?" before booking. Know which services need in-person estimate first. "Need a shuttle?" after booking. Collect year/make/model for work order.
Existing CRM: Mitchell1, AutoFluent, or none.

### Restaurant — Complexity: Medium
Discovery questions: Reservations, walk-ins, or both? Seat count? Private dining/event space? Catering calls? Off-peak fill strategy? Large party bookings (6+)? OpenTable/Resy/custom? Pre-order or dietary collection?
Calendar: Reservation slots = table availability by party size. More capacity management than traditional calendar.
Agent behavior: "How many in your party?" is always the first question. Upsell opportunities. Cancellation nudge. 24hr SMS confirmation.
Existing CRM: OpenTable, Resy, Toast POS, or none.

### Roofing — Complexity: Medium
Discovery questions: How many crews? Storm damage vs. scheduled replacement vs. repair split? Free inspections offered? Close process after inspection (in-person quote, email quote)? Insurance company work? Service area? Financing?
Calendar: 1 per crew. Inspections = 45min. Replacements = full day. Repairs = half day. Storm season surge.
Agent behavior: "Storm damage or planned replacement?" determines urgency. Insurance claim number collection. Cancellation nudge critical. Weather intelligence built in.
Existing CRM: Leap, JobNimbus, HubSpot, or none.

### Cleaning Service — Complexity: Low-Medium
Discovery questions: Residential/commercial/both? How many teams? One-time or recurring (weekly/bi-weekly/monthly)? Service area? Specialty services (move-in/out, deep clean, post-construction)? Estimate by phone or walkthrough?
Calendar: 1 per cleaning team. Recurring blocks. First-available team logic.
Agent behavior: "How many bedrooms and bathrooms?" for time estimation. Set up recurring bookings. Upsell deep clean add-ons. Supplies provided or client provides?
Existing CRM: Jobber, HouseCallPro, or none.

### Medical/Dental/Wellness — Complexity: High (HIPAA)
Discovery questions: How many providers? New vs. existing patient workflows? Insurance verification before booking? Appointment types and durations? EHR/PMS (Epic, Athena, Dentrix, Jane App)?
Calendar: 1 per provider. Separate event types (new patient vs. follow-up). Insurance check before booking may need human transfer.
Agent behavior: PII redaction MUST be enabled. "New or existing patient?" determines entire flow. No diagnosis or medical advice ever. Strict liability language required.
Existing CRM: Athena, Jane App, Dentrix, or standalone.

---

## PART 4: Sales Discovery Framework — 5 Categories

We must extract these from every prospect before building anything.

Category 1 — Business Basics:
Business name, owner name, industry, single or multiple locations, years in business, monthly call volume estimate, current pain points (missed calls, no-shows, after-hours gaps, double bookings).

Category 2 — Team and Resources:
How many staff need their own calendar? Does every staff member take appointments or only some? Any specialty staff that cannot be substituted? Hours per staff member — same schedule or varies? Who handles after-hours or emergency calls?

Category 3 — Services and Booking:
Full list of all services. Duration per service. Pricing model (flat/estimate/hourly). Which services require in-person estimate before booking? Emergency or rush service tiers? Cancellation policy?

Category 4 — Existing Tech Stack:
Current CRM (which one?). Current booking system (which one?). Automation tools (Zapier, Make, HighLevel)? On Google Business Profile? Current phone system (landline, RingCentral, Google Voice)? How do they collect reviews today?

Category 5 — Goals and Success Metrics:
What does success look like in 90 days? The number one problem to solve first? Inbound coverage only or outbound reminders too? Are they comfortable with an AI answering calls (will their customers know)? Budget awareness confirmed?

Output: Completed Intake Blueprint JSON stored in Supabase prospects table. Triggers Stage 2 of the sales workflow.

---

## PART 5: Intake Blueprint JSON Structure

```json
{
  "client": { "business_name": "", "owner_name": "", "industry": "", "location": "", "phone": "", "email": "", "website": "" },
    "configuration": { "type": "A|B|C", "tier": "1|2|3", "crm_integration": "none|gl365|external", "external_crm_name": "" },
      "team": {
          "total_staff_needing_calendar": 0,
              "staff": [{ "name": "", "role": "", "services": [], "hours": "", "phone_direct": "" }]
                },
                  "services": [{ "name": "", "duration_minutes": 0, "price": "", "requires_estimate": false, "is_emergency": false }],
                    "calendar": { "platform": "calcom|existing", "calendars_needed": 0, "buffer_time_minutes": 0, "advance_booking_days": 0 },
                      "agent": { "voice": "", "persona_name": "", "brand_voice": "", "emergency_keywords": [], "transfer_number": "", "business_hours": "", "after_hours_behavior": "take_message|book_callback|emergency_only" },
                        "sms": { "enabled": true, "reminder_hours_before": 24, "value_bomb_content": "" },
                          "payment": { "setup_fee": 0, "monthly_fee": 0, "contract_signed": false, "payment_method": "stripe|invoice|other" },
                            "goals": { "primary_pain": "", "success_metric_90_days": "", "go_live_target_date": "" }
                            }
                            ```

                            ---

                            ## PART 6: End-to-End SaaS Sales Workflow

                            STAGE 1 — DISCOVERY (AI-Led):
                            Prospect hits website or calls -> AI Concierge runs the 5-category Discovery Framework -> Collects all answers -> Stores Intake Blueprint in Supabase prospects table -> Fires webhook -> Notifies Jared via dashboard + personal email.

                            STAGE 2 — REPORT GENERATION (Human-in-Loop):
                            Jared receives notification "New discovery complete: [Business Name]" -> Opens dashboard, reviews Intake Blueprint -> Clicks "Generate System Report" -> AI produces custom System Design Report (config recommendation, full tech stack, calendar structure diagram, function list, timeline, pricing) -> Jared reviews, edits if needed -> Jared approves -> Status moves to "Proposal Sent".

                            STAGE 3 — PROPOSAL DELIVERY (Automated):
                            System emails prospect: branded PDF of System Design Report + contract link (PandaDoc/DocuSign) + payment link (Stripe or invoice) + approve/decline button -> Notification to Jared: "Proposal sent to [Business Name]".

                            STAGE 4 — CUSTOMER APPROVAL (Human-in-Loop):
                            Prospect reviews, signs contract, completes payment -> System confirms receipt -> Notification to Jared: "CONTRACT SIGNED + PAID — [Business Name] ready to build" -> Dashboard status moves to "Building".

                            STAGE 5 — BUILD AND DEPLOY (Semi-Automated):
                            Jared clicks "Deploy Client System" (future: auto-triggers on payment confirmation) -> Onboarding automation: clone Retell agent, configure system prompt variables, create Cal.com event types, create Cal.com calendar resources per staff, purchase and assign phone number, configure webhook with tenant_id, configure MCP URL, send client credentials and onboarding guide -> Notification to Jared: "Build complete — [Business Name] is LIVE" -> Status moves to "Active".

                            STAGE 6 — MONITORING (Ongoing):
                            Per-client dashboard: call volume, booking conversion rate, call logs with summary and sentiment, CRS trend, missed calls, revenue generated (bookings x avg ticket). Monthly report auto-generated and emailed to client.

                            ---

                            ## PART 7: Notification System

                            Every notification goes to TWO places simultaneously:
                            1. GL365 Admin Dashboard — bell icon with unread count, notification drawer
                            2. Jared's personal email — always-on backup

                            Key triggers: new discovery complete (high), no response in 48hrs (medium), contract signed (high), payment received (high), build complete (high), client call volume drops 50%+ (high), agent function failure (critical), monthly report ready (low), contract renewal in 30 days (medium).

                            Dashboard notification panel: bell icon + unread count in navbar, drawer showing type/client/timestamp/action button, mark-as-read and dismiss, filter by client/type/priority, auto-email fallback if dashboard not opened within 2 hours.

                            ---

                            ## PART 8: Payment and Contract System

                            PRIMARY — Stripe:
                            Stripe Checkout for setup fee (one-time), Stripe Subscriptions for monthly recurring, Stripe Customer Portal for client self-management, payment_intent.succeeded webhook triggers build workflow.

                            BACKUP (for early clients before Stripe is fully configured):
                            Recommended: Wave (wavapps.com) — free professional invoices, accepts credit cards and ACH, auto-sends receipts. Or Sumup Invoices — free, instant card payment via email link.

                            CONTRACT AND E-SIGNATURE:
                            Recommended v1: PandaDoc ($19/mo) — one contract template, fill client name/price/scope, send for signature, auto-stores signed PDF, has free trial. Alternatives: DocuSign ($15/mo), HelloSign ($15/mo), signNow ($8/mo), or free Adobe Acrobat digital signature as fallback.

                            DOCUMENT STORAGE (New Dashboard Section):
                            Documents tab per client: signed contract, invoices, onboarding guide, monthly reports. Stored in Supabase Storage client_documents bucket. Upload auto-triggered by PandaDoc/DocuSign webhook on signing. Manual upload available.

                            New database table needed:
                            client_documents (id UUID, business_id UUID, document_type TEXT, document_name TEXT, storage_url TEXT, signed_at TIMESTAMPTZ, created_at TIMESTAMPTZ)

                            ---

                            ## PART 9: New Dashboard Sections Needed

                            1. CLIENT PIPELINE
                            Kanban: Discovery -> Proposal Sent -> Contract Signed -> Building -> Active -> Churned.
                            Per card: business name, config type (A/B/C), MRR, last activity date.
                            Action buttons per stage: Generate Report, Send Proposal, Trigger Build, View Logs.

                            2. NOTIFICATIONS CENTER
                            Bell icon + unread count in navbar. Drawer with all system events. Email fallback always on.

                            3. VOICE AGENT MONITOR
                            Per client: agent status (live/inactive), call volume chart (30 days), booking conversion rate, last 10 calls with summary and sentiment scores, function error rate.

                            4. DOCUMENTS
                            Per-client file storage. Signed contracts, invoices, reports. Upload and download. Auto-populated from PandaDoc/DocuSign webhooks.

                            5. INTAKE BLUEPRINT FORM
                            Web form mapping to the Intake Blueprint JSON. Shareable link — send to prospect to self-fill before discovery call. Or Jared fills it during/after the call. Output goes directly to the Client Pipeline (Stage 2 trigger).

                            6. SYSTEM BUILDER (Future)
                            Visual configurator: select config type (A/B/C) -> fill variables -> preview the full system -> one-click deploy. Shows exact tech stack being spun up. Trigger button for onboarding automation.

                            ---

                            ## PART 10: The Repeatable Skill

                            Once the first 3 agents are deployed successfully, document the exact steps as an AI-executable Skill.

                            SKILL: Deploy Voice Booking Agent

                            Required inputs: Completed Intake Blueprint JSON, signed contract, payment confirmed.

                            Steps:
                            1. Read Intake Blueprint -> determine config type A, B, or C
                            2. Clone base Retell agent via Management API
                            3. Replace all template variables in system prompt with client values
                            4. Create Cal.com event types per services list
                            5. Create Cal.com calendar resources per staff member list
                            6. Set buffer times and advance booking window
                            7. Purchase phone number in Retell -> assign to agent
                            8. Update webhook URL with client tenant_id
                            9. Update MCP URL parameters
                            10. Make test call -> verify availability check works -> verify booking creates correctly
                            11. Send client onboarding guide with their new phone number and credentials
                            12. Configure monitoring alerts for this client
                            13. Set dashboard status to Active

                            Decision branches:
                            - Config C selected: also run CRM Integration Skill
                            - Multiple staff members: run Multi-Calendar Setup Skill
                            - Emergency keywords in intake: add to system prompt before deploy
                            - After-hours coverage needed: configure after-hours prompt variant

                            Turning the Skill into a Workflow: After 3 validated deployments, automate every step. Trigger: contract signed + payment confirmed. Human checkpoints: Jared approves the generated report and approves go-live. All other steps execute automatically. Dashboard shows real-time progress per step.

                            ---

                            ## PART 11: Three Agent Variants to Build (A/B/C Test)

                            Agent A — Refined Single Prompt:
                            The production-ready version of Grace. 5 core functions. Cancellation nudge added to prompt. Cal.com actually wired. Phone number assigned. Tests the single-prompt architecture at production quality.

                            Agent B — Conversation Flow (Multi-Node):
                            Built with Retell's Conversation Flow builder. Nodes: Greeting -> Identify Intent -> Booking Flow -> Manage Booking -> Transfer -> End Call. Nodes pass variables between them. Better for complex service routing. Tests node-based architecture for Config B scenarios.

                            Agent C — Supabase-Powered Knowledge Agent:
                            Minimal system prompt. All knowledge (services, hours, pricing, FAQs, staff) lives in Supabase tables. MCP functions query Supabase directly for every response. Business owner can update their info via dashboard form without touching Retell at all. Tests the architecture that scales to true multi-tenant without per-client prompt engineering.

                            ---

                            ## PART 12: Go-To-Market

                            What we sell: Three configurations of the same platform. A voice AI booking agent customized to exactly how a service business operates.

                            How we sell:
                            1. Inbound: website chat widget (GL365 Concierge) runs discovery
                            2. Outbound: cold call or referral -> book discovery call -> AI or Jared runs 5-category intake
                            3. After discovery: AI generates report -> Jared approves -> proposal to client
                            4. Client signs and pays -> automated build -> live within days

                            What makes GL365 different from every other booking bot:
                            - Customized to exact services, staff count, and sales process — not a generic template
                            - Property Intelligence Engine for home services — no competitor does address-anchored memory
                            - CRM included OR bridges to existing CRM — client's choice
                            - True multi-resource calendaring — barbershop-level complexity handled natively
                            - AI that remembers callers, adjusts greeting by relationship score, tracks loyalty
                            - 24/7 coverage with weather intelligence, emergency routing, and cancellation nudge

                            Target industries for v1: HVAC, plumbing, electrical, roofing, cleaning, barbershop, salon, auto repair.

                            Revenue model:
                            - 10 clients x Config A at $1,500/mo = $15,000 MRR
                            - 5 clients x Config B at $2,000/mo = $10,000 MRR
                            - 3 clients x Config C at $3,500/mo = $10,500 MRR
                            - Total at 18 clients: $35,500 MRR

                            ---

                            Last Updated: February 19, 2026
                            Next step: Build Agent A, B, and C. Run A/B/C test. Document winning steps as the Deploy Skill. Wire it into dashboard workflow. First client deploy.

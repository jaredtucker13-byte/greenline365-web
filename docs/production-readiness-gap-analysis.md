<!-- AGENT METADATA
  status: active
  updated: 2026-02-19
  scope: Voice booking agent launch gaps — Cal.com, phone numbers, multi-tenant routing
  read-when: Working on Retell voice AI or voice booking features
-->

# Production Readiness Gap Analysis
## GreenLine365 Voice Booking Agent — SaaS Launch Checklist

**Document Version:** 1.0
**Date:** February 19, 2026
**Status:** Pre-Launch Analysis
**Goal:** Identify every gap between current state and a production-ready, multi-tenant SaaS product

---

## Executive Summary

The GreenLine365 voice booking system has excellent bones — a documented agent, a working MCP/webhook layer, Supabase backend, and a clear product vision. But several critical gaps exist between the current "demo-ready" state and a "production-ready SaaS" state.

**Current State:** Single-tenant, manually configured, partially wired stack
**Target State:** Multi-tenant, self-onboarding, fully automated, monitored at scale

The three biggest missing pieces are:
1. **Cal.com is not actually wired** — availability and booking functions exist but Cal.com credentials/event types are not connected per client
2. 2. **No multi-tenancy** — the agent is hardcoded to one domain (greenline365.com), not per-client routing
   3. 3. **No phone number** — Twilio/Retell phone number not purchased or assigned; calls can't come in
     
      4. ---
     
      5. ## Part 1: Function Reduction — From 10 to 5 Core Functions
     
      6. ### Current 10 Functions (Grace Agent)
      7. | # | Function | Type | Keep? | Reason |
      8. |---|----------|------|-------|--------|
      9. | 1 | check_availability | Custom | ✅ KEEP | Core booking — agent must call Cal.com for real slots |
      10. | 2 | create_booking | Custom | ✅ KEEP | Core booking — creates the Cal.com appointment |
      11. | 3 | get_memory | Custom | ✅ KEEP | CRS/property intelligence — returning caller recognition |
      12. | 4 | store_memory | Custom | ✅ KEEP | Saves preferences/history for future calls |
      13. | 5 | transfer_to_human | Custom | ✅ KEEP | Safety valve — agent must be able to hand off |
      14. | 6 | lookup_booking | Custom | ⚠️ MERGE | Fold into check_availability or transfer_to_human |
      15. | 7 | get_services | Custom | ❌ REMOVE | Bake services into system prompt instead; reduces latency |
      16. | 8 | get_business_hours | Custom | ❌ REMOVE | Bake hours into system prompt; static data doesn't need API call |
      | 9 | end_call | Built-in | ✅ KEEP | Required for clean call termination |
| 10 | transfer_call | Built-in | ✅ KEEP | Required for warm transfer routing |

### Recommended Lean Production Set: 5 Custom + 2 Built-in

```
CORE 5 (Custom via MCP):
1. check_availability    → Cal.com slots for a given date
2. create_booking        → Books the Cal.com slot + Supabase record
3. get_memory            → Returns CRS, name, property, past bookings
4. store_memory          → Saves notes/preferences post-call
5. transfer_to_human     → Warm transfer with whisper context

BUILT-IN 2 (Retell native):
6. end_call              → Graceful hang-up
7. transfer_call         → Dynamic routing via {{transfer_number}}
```

### Why Remove get_services and get_business_hours?
- **Latency:** Every function call adds 200-500ms. Static data in prompt = zero latency.
- - **Reliability:** Fewer API calls = fewer failure points in production.
  - - **Cost:** Fewer tokens consumed per call.
    - - **Rule:** Only call APIs for data that changes (availability, bookings, customer memory). Never API-call for static config.
     
      - ### Why Merge lookup_booking?
      - - `lookup_booking` is only needed before reschedule/cancel.
        - - Fold its behavior into `transfer_to_human` (hand off to human for changes) OR add a `manage_booking` function that handles lookup + reschedule + cancel in one call.
          - - In a lean v1 production agent, cancellations/reschedules can transfer to human. Add self-serve manage_booking in v2.

          ---

          ## Part 2: What's Missing — The "Missing Gas"

          ### 🔴 CRITICAL (Blocks Launch)

          #### 1. Cal.com Not Wired
          **What's missing:** The `check_availability` and `create_booking` functions call `https://greenline365.com/api/mcp` but that MCP endpoint must actually proxy to Cal.com API with a valid API key and event type ID.
          **What needs to happen:**
          - Cal.com account created for each client (or sub-account under GL365 org)
          - - Cal.com API key stored in Supabase per tenant (`businesses` table: `calcom_api_key`, `calcom_event_type_id`)
            - - MCP functions updated to pull client's Cal.com credentials from Supabase before making the API call
              - - Cal.com event type configured (duration, buffer time, location, confirmation email)
               
                - **Files to update:**
                - - `webapp/app/api/mcp/route.ts` — add tenant lookup before Cal.com call
                  - - `webapp/app/api/retell/functions/route.ts` — same
                    - - Supabase: add `calcom_api_key` and `calcom_event_type_id` to `businesses` table

                    #### 2. No Phone Number Assigned
                    **What's missing:** No Twilio or Retell phone number purchased and assigned to the Grace agent.
                    **What needs to happen:**
                    - Purchase a Retell-managed number (simplest) OR
                    - - Set up Twilio SIP trunk (for multi-tenant, preferred for production)
                      - - Assign phone number to agent in Retell dashboard
                        - - Per-client: each business gets their own number assigned to their cloned agent
                         
                          - **Steps:**
                          - 1. In Retell dashboard → Phone Numbers → Buy Number
                          2. Assign to the agent
                          3. 3. For multi-tenant: store `retell_phone_number` and `retell_agent_id` in `businesses` table

                          #### 3. No Multi-Tenant Agent Routing
                          **What's missing:** All functions hardcode `greenline365.com` as the endpoint. For SaaS, each client needs their agent to route to their data, not GL365's.
                          **Two approaches:**
                          - **Option A (Simpler):** One shared MCP endpoint that reads `tenant_id` from the call metadata (Retell passes `agent_id` in the webhook). Lookup `agent_id → tenant_id → client data`.
                          - - **Option B (Scalable):** Each client gets a cloned agent with their own subdomain or URL parameter. `clientname.greenline365.com/api/mcp`
                           
                            - **Recommended for v1:** Option A — shared MCP with agent_id-to-tenant routing in Supabase.
                           
                            - #### 4. Webhook Not Processing Events
                            - **What's missing:** The webhook URL `https://www.greenline365.com/api/retell/webhook` exists but the handler must process these events and write to Supabase:
                            - - `call_started` → log to `call_logs`, trigger pre-greeting memory lookup
                              - - `call_ended` → store call summary, update CRS, log sentiment
                                - - `call_analyzed` → store post-call extraction data
                                 
                                  - **What needs to happen:**
                                  - - `retell/webhook/route.ts` must handle all three event types
                                    - - Write to `call_logs` table in Supabase on every event
                                      - - Trigger CRS update on `call_ended`
                                        - - Send post-call SMS confirmation if not sent during call
                                         
                                          - ---

                                          ### 🟡 HIGH PRIORITY (Required for SaaS, not Day-1 blocker)

                                          #### 5. No Client Onboarding Flow
                                          **What's missing:** When a new client signs up for Tier 1 ($1,500/mo), there's no automated flow to:
                                          - Clone the Grace agent in Retell for their account
                                          - - Set their Cal.com event type
                                            - - Assign them a phone number
                                            - Configure their dynamic variables

                                            **What needs to happen:**
                                            - Build `/api/admin/onboard-client` endpoint
                                            - - Uses Retell API to clone agent → update system prompt variables → assign phone number
                                              - - Sets up Cal.com event type via API
                                              - Stores everything in `businesses` table
                                             
                                              - #### 6. Pre-Greeting Edge Function Not Live
                                              - **What's missing:** The "200ms before hello" context load described in the system prompt and TAMPA_ELECTRIC_DEMO.md doesn't exist as a real Supabase Edge Function.
                                              - **What needs to happen:**
                                              - Create `supabase/functions/pre-greeting/index.ts`
                                              - Triggered by Retell webhook `call_started` event
                                              - - Looks up: phone → contact → property → assets → CRS → weather → Cal.com slots
                                                - - Returns structured JSON to inject into agent's dynamic variables
                                                 
                                                  - #### 7. No Real CRS (Customer Relationship Score) System
                                                  **What's missing:** The CRS is documented thoroughly but no table or calculation logic exists in the codebase.
                                                  **What needs to happen:**
                                                  - Add `contacts` table with `relationship_score` column
                                                  - - Add `properties` table with service history
                                                  - Add `assets` table with equipment tracking
                                                  - - CRS formula: frequency + longevity + sentiment + booking_reliability (0-100)
                                                    - - Update CRS after every `call_ended` webhook

                                                    #### 8. No SMS Confirmation Firing
                                                    **What's missing:** Post-booking SMS (the "Value Bomb") is described in all docs but there's no Twilio send trigger wired to the `create_booking` function response.
                                                    **What needs to happen:**
                                                    - After `create_booking` succeeds → call `webapp/app/api/twilio/send/route.ts`
                                                    - - Include: confirmation number, date/time, address, equipment-specific tip
                                                      - - Requires Twilio `ACCOUNT_SID` and `AUTH_TOKEN` in env vars
                                                       
                                                        - #### 9. No Emergency Alert System
                                                        - **What's missing:** Emergency keyword detection (sparks, burning smell, no power) described in system prompt should trigger a real-time alert to the business owner. Currently only in the prompt text, not wired to any notification system.
                                                        - **What needs to happen:**
                                                        - - Add emergency keyword list to Retell agent system prompt (already there)
                                                          - - When `transfer_to_human` is called with `reason: "emergency"`, webhook fires
                                                            - - Supabase Edge Function sends SMS via Twilio to business owner immediately
                                                             
                                                              - #### 10. No Monitoring / Observability
                                                              **What's missing:** No call monitoring dashboard, no error alerting, no latency tracking for production.
                                                              **What needs to happen:**
                                                              - Retell dashboard: set up call analytics and alerts
                                                              - - Sentry or similar for Next.js API error tracking
                                                              - Supabase: query `call_logs` for success rate, avg duration, booking conversion rate
                                                              - - Uptime monitor on `/api/mcp` and `/api/retell/webhook` endpoints
                                                               
                                                                - ---

                                                                ### 🟢 IMPORTANT (v1.1 / First Month After Launch)

                                                                #### 11. Voicemail Detection Off
                                                                Currently disabled. For outbound campaigns and missed calls, enable voicemail detection in Retell call settings. Prevents the agent from leaving a message to a robocall screener.

                                                                #### 12. PII Redaction Not Configured
                                                                Data storage is set to "Everything." For any healthcare or financial clients, PII redaction must be enabled. Even for standard clients, enabling redaction of phone numbers and emails in transcripts is best practice.

                                                                #### 13. No Knowledge Base Attached
                                                                The agent relies entirely on function calls and system prompt for knowledge. For industries with complex FAQs (pricing, warranty, service areas), a knowledge base reduces token usage and hallucination risk.

                                                                #### 14. Backchanneling Off
                                                                Backchanneling ("mm-hmm", "I see") makes conversations more natural. Test enabling at 0.5 sensitivity for production. Current setting is Off.

                                                                #### 15. No Boosted Keywords
                                                                Transcription accuracy for industry-specific terms (HVAC, GFCI, Square D, Lennox, etc.) can be improved by adding boosted keywords per client industry in Retell transcription settings.

                                                                #### 16. Cancellation Nudge Not in Grace Agent Prompt
                                                                The RETELL_SETUP_GUIDE.md documents a cancellation nudge strategy ("Would you prefer to move this to next week?") but the current Grace agent system prompt doesn't include it. Add to the prompt.

                                                                #### 17. No Outbound Call Capability
                                                                The `retell/outbound` directory exists but is not wired. For appointment reminders 24hrs before, confirmation calls, and re-engagement campaigns — outbound calling is a major revenue protection feature.

                                                                ---

                                                                ## Part 3: Production-Ready SaaS Architecture (Target State)

                                                                ```
                                                                INBOUND CALL FLOW (Production):
                                                                Phone rings → Retell routes to correct agent (by phone number)
                                                                             ↓
                                                                                 Retell fires call_started webhook (200ms)
                                                                                              ↓
                                                                                                  Pre-Greeting Edge Function runs:
                                                                    - Phone → Contact lookup (CRS)
                                                                    - Property + Asset lookup
                                                                        - Weather API check
                                                                    - Cal.com availability cache
                                                                        - Returns JSON to agent dynamic variables
                                                                                     ↓
                                                                                         Agent greets caller using CRS vibe (stranger/regular/VIP)
                                                                                                      ↓
                                                                    Agent uses 5 core functions during call:
                                                                    check_availability → Cal.com (per tenant credentials)
                                                                    create_booking → Cal.com + Supabase bookings table
                                                                    get_memory / store_memory → Supabase contacts/properties
                                                                    transfer_to_human → Warm transfer with whisper
                                                                             ↓
                                                                    Call ends → Retell fires call_ended webhook
                                                                             ↓
                                                                                 Post-call processing:
                                                                    - Store call summary and sentiment to Supabase
                                                                        - Update CRS for the contact
                                                                            - Send Value Bomb SMS via Twilio (if booking was made)
                                                                                - Log to call_logs table
                                                                    - Async CRM sync (if client uses HighLevel/HubSpot)
                                                                    ```

                                                                ---

                                                                ## Part 4: Priority Build Order (Sprint Plan)

                                                                ### Sprint 1 — Wire the Core (Week 1-2) 🔴
                                                                | Task | Owner | Files |
                                                                |------|-------|-------|
                                                                | Wire Cal.com to MCP functions (with tenant lookup) | Dev | `api/mcp/route.ts`, `api/retell/functions/route.ts` |
                                                                | Buy phone number in Retell, assign to agent | Config | Retell Dashboard |
                                                                | Fix webhook handler for call_started/call_ended/call_analyzed | Dev | `api/retell/webhook/route.ts` |
                                                                | Add calcom_api_key + calcom_event_type_id to businesses table | DB | Supabase migration |
                                                                | Add agent_id → tenant_id routing in MCP | Dev | `api/mcp/route.ts` |
                                                                | Test full call: phone in → availability check → book → confirm | QA | End-to-end |

                                                                ### Sprint 2 — Intelligence Layer (Week 2-3) 🟡
                                                                | Task | Owner | Files |
                                                                |------|-------|-------|
                                                                | Build contacts + properties + assets tables in Supabase | DB | Supabase migrations |
                                                                | Build Pre-Greeting Edge Function | Dev | `supabase/functions/pre-greeting/index.ts` |
                                                                | Implement CRS calculation and update logic | Dev | Edge Function + webhook |
                                                                | Wire Twilio SMS send after create_booking | Dev | `api/twilio/send/route.ts` |
                                                                | Build emergency alert system (keyword → SMS to owner) | Dev | Webhook handler |
                                                                | Reduce Grace agent to 5 core functions | Config | Retell Dashboard |
                                                                | Add cancellation nudge to system prompt | Config | Retell Dashboard |

                                                                ### Sprint 3 — SaaS Infrastructure (Week 3-4) 🟡
                                                                | Task | Owner | Files |
                                                                |------|-------|-------|
                                                                | Build /api/admin/onboard-client endpoint | Dev | `api/admin/` |
                                                                | Cal.com client account creation via API | Dev | `api/calcom/` |
                                                                | Retell agent clone via API (Retell Management API) | Dev | `api/retell/agents/route.ts` |
                                                                | Phone number assignment per client | Dev | Retell API |
                                                                | Add monitoring (Sentry + uptime checks) | DevOps | `instrumentation.ts` |
                                                                | Build basic admin dashboard for call logs | Dev | `admin-v2/` |

                                                                ### Sprint 4 — Polish & Harden (Week 4-5) 🟢
                                                                | Task | Owner | Files |
                                                                |------|-------|-------|
                                                                | Enable voicemail detection for outbound scenarios | Config | Retell Dashboard |
                                                                | Configure PII redaction | Config | Retell Dashboard |
                                                                | Add boosted keywords per industry | Config | Retell Dashboard |
                                                                | Build knowledge base for top 3 industries | Content | Retell Dashboard |
                                                                | A/B/C agent testing (Single Prompt vs Conv Flow vs Supabase) | Dev | Retell Dashboard |
                                                                | Outbound reminder call system | Dev | `api/retell/outbound/route.ts` |

                                                                ---

                                                                ## Part 5: Environment Variables Checklist

                                                                All of these must be set in Vercel + `.env.local` before production:

                                                                ```bash
                                                                # Retell AI
                                                                RETELL_API_KEY=                    # ❌ Needed for agent management API

                                                                # Cal.com
                                                                CALCOM_API_KEY=                    # ❌ Global/org key OR per-tenant in Supabase
                                                                CALCOM_EVENT_TYPE_ID=              # ❌ Default event type ID

                                                                # Twilio
                                                                TWILIO_ACCOUNT_SID=                # ❌ For SMS confirmations
                                                                TWILIO_AUTH_TOKEN=                 # ❌ For SMS confirmations
                                                                TWILIO_FROM_NUMBER=                # ❌ GL365's Twilio number for SMS

                                                                # Supabase (already set)
                                                                NEXT_PUBLIC_SUPABASE_URL=          # ✅ Set
                                                                NEXT_PUBLIC_SUPABASE_ANON_KEY=     # ✅ Set
                                                                SUPABASE_SERVICE_ROLE_KEY=         # ✅ Set

                                                                # OpenWeather (for weather intelligence)
                                                                OPENWEATHER_API_KEY=               # ❌ For pre-greeting weather context

                                                                # Stripe (already set)
                                                                STRIPE_SECRET_KEY=                 # ✅ Set
                                                                STRIPE_WEBHOOK_SECRET=             # ✅ Set
                                                                ```

                                                                ---

                                                                ## Part 6: Database Tables Needed (Not Yet Confirmed to Exist)

                                                                ```sql
                                                                -- Required for Production (confirm existence or create):

                                                                contacts (
                                                                  id UUID,
                                                                    tenant_id UUID,          -- multi-tenant isolation
                                                                      phone TEXT,
                                                                  email TEXT,
                                                                  first_name TEXT,
                                                                    last_name TEXT,
                                                                  relationship_score INT,  -- CRS 0-100
                                                                    vibe_category TEXT,      -- stranger/regular/vip
                                                                      created_at TIMESTAMPTZ,
                                                                  updated_at TIMESTAMPTZ
                                                                  );

                                                                  properties (
                                                                  id UUID,
                                                                  tenant_id UUID,
                                                                    address TEXT,
                                                                      city TEXT,
                                                                  state TEXT,
                                                                    zip TEXT,
                                                                  owner_contact_id UUID,
                                                                  years_of_service FLOAT
                                                                  );

                                                                  assets (
                                                                    id UUID,
                                                                  property_id UUID,
                                                                  asset_type TEXT,         -- HVAC, Water Heater, Panel, etc.
                                                                    brand TEXT,
                                                                      model TEXT,
                                                                  install_year INT,
                                                                    confidence_score INT,    -- 0-100 data freshness
                                                                  last_verified TIMESTAMPTZ
                                                                );

                                                                call_logs (
                                                                  id UUID,
                                                                    tenant_id UUID,
                                                                      retell_call_id TEXT,
                                                                  contact_id UUID,
                                                                    agent_id TEXT,
                                                                  call_duration INT,
                                                                  outcome TEXT,            -- booked/transferred/callback/no_action
                                                                    summary TEXT,
                                                                      sentiment TEXT,
                                                                  call_successful BOOLEAN,
                                                                    created_at TIMESTAMPTZ
                                                                );

                                                                businesses (
                                                                  -- EXISTING, but add:
                                                                  retell_agent_id TEXT,          -- Retell agent ID for this client
                                                                  retell_phone_number TEXT,      -- E.164 phone number
                                                                  calcom_api_key TEXT,           -- Cal.com API key
                                                                  calcom_event_type_id INT,      -- Cal.com event type
                                                                  transfer_phone TEXT,           -- Human escalation number
                                                                  emergency_keywords TEXT[],     -- Industry-specific emergency words
                                                                    industry TEXT,                 -- hvac/electrical/plumbing/roofing/etc.
                                                                      location_flavor TEXT           -- Tampa/Phoenix/Denver humor hooks
                                                                      );
                                                                      ```

                                                                ---

                                                                ## Part 7: What's "Missing Gas" — One-Line Summary Per Gap

                                                                | Gap | Missing Gas | Effort |
                                                                |-----|-------------|--------|
                                                                | Cal.com not wired | No API key + no event type ID per tenant | Medium |
                                                                | No phone number | Not purchased/assigned in Retell | Low (1hr) |
                                                                | No multi-tenancy | Agent hardcoded to GL365 domain | High |
                                                                | Webhook not processing | call_started/ended events not writing to Supabase | Medium |
                                                                | No pre-greeting function | 200ms context load doesn't exist yet | High |
                                                                | No CRS system | contacts/properties/assets tables don't exist or aren't populated | High |
                                                                | No SMS after booking | Twilio send not wired to create_booking | Low-Medium |
                                                                | No emergency alerts | Emergency keyword → owner SMS not wired | Low |
                                                                | No monitoring | No error tracking, no uptime checks | Low |
                                                                | No client onboarding | Manual agent clone per client, not automated | High |
                                                                | Cancellation nudge missing | Not in current system prompt | Low (30min) |
                                                                | 5 extra functions | get_services, get_business_hours, lookup_booking are dead weight | Low (config) |

                                                                ---

                                                                ## Conclusion

                                                                **The biggest wins you can do RIGHT NOW (same day):**

                                                                1. ✅ Remove `get_services`, `get_business_hours` from the Grace agent (30 min, Retell dashboard)
                                                                2. ✅ Add cancellation nudge paragraph to system prompt (30 min, Retell dashboard)
                                                                3. ✅ Buy a phone number in Retell and assign to the agent (15 min)
                                                                4. ✅ Wire Cal.com credentials to the MCP functions (2-4 hrs, code)
                                                                5. ✅ Add env vars: TWILIO_*, CALCOM_*, OPENWEATHER_API_KEY, RETELL_API_KEY

                                                                **The biggest ROI for production SaaS:**
                                                                - Pre-Greeting Edge Function (transforms it from booking bot → Property Intelligence Engine)
                                                                - Multi-tenant routing via agent_id → tenant_id in Supabase
                                                                - Client onboarding automation (what makes this SaaS, not freelance work)

                                                                ---

                                                                *Last Updated: February 19, 2026*
                                                                *Source: Analysis of memory/, webapp/docs/, webapp/app/api/, and Retell dashboard configuration*

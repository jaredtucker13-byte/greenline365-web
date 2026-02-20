# GreenLine365 — AI Voice Agent SaaS Platform

## What This Is
GreenLine365 (GL365) is a multi-tenant SaaS that deploys AI voice agents for local service businesses.
When someone calls a client's phone number, a Retell AI agent answers, books appointments on Cal.com,
remembers returning callers, and syncs everything to their CRM. The customer never repeats themselves.

## The 3 Product Configs

| Config | Name | Best For | Pricing |
|--------|------|----------|---------|
| **A** | The Answering Machine That Books | 1-2 person businesses (solo HVAC, plumber, therapist) | $2,500 setup + $1,500/mo |
| **B** | The Full Command Center | Multi-staff businesses without CRM (barbershop, dental, roofing) | $3,500 setup + $2,000/mo |
| **C** | The Bridge Builder | Businesses with existing CRM (HighLevel, HubSpot, ServiceTitan) | $5,500 setup + $3,500/mo |

**The 3 intake questions that determine config:**
1. How many people/resources need their own calendar?
2. Does the client have a CRM already?
3. How complex is their booking process?

## Agent Template System

Templates live in `webapp/config/agent-templates/`:
- `template-a-solo.ts` — Solo agent, single calendar, static services in prompt
- `template-b-multi-resource.ts` — Multi-staff routing, per-resource calendars, CRS
- `template-c-bridge.ts` — External CRM bridge, webhook sync, custom MCP mapping
- `index.ts` — Exports all templates + `IntakeBlueprint` interface + `CONFIG_TEMPLATES` pricing

Each template exports a `generateTemplate{A|B|C}Prompt(vars)` function that takes client data
and returns a complete Retell system prompt with all variables filled in.

## Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/admin/onboard-client` | **The deploy button.** Creates Twilio sub-account, Retell agent, Cal.com config, updates Supabase. |
| `POST /api/admin/generate-a2p-package` | AI generates A2P 10DLC compliance content from intake data |
| `POST /api/admin/generate-privacy-policy` | Generates A2P-compliant privacy policy HTML for a client |
| `GET /api/admin/tenants` | Lists all tenants for admin dropdowns |
| `GET /api/admin/a2p?tenant_id=xxx` | Returns A2P registration data for a tenant |
| `POST /api/retell/functions` | **Retell agent function handler.** Handles check_availability, book_appointment, etc. |
| `POST /api/retell/webhook` | Retell call lifecycle events (call_started, call_ended, call_analyzed) |
| `POST /api/mcp/route` | MCP tool server — the full tool suite including memory, property, SMS |
| `POST /api/webhooks/calcom` | Cal.com booking event webhook → auto-journals to customer_journal |

## Database Tables (Supabase)

**Core:**
- `tenants` — One row per client business. Has ALL per-tenant config: Cal.com keys, Retell IDs, Twilio sub-account, agent config, staff, CRM integration, onboarding status
- `agents` — AI agent personalities (Susan booking, Aiden sales)
- `agent_memory` — Customer memory vault. Phone → memories. Used by get_memory at call start.
- `bookings` — All appointments. Has `external_calendar_id` for Cal.com booking UID sync.

**Auto-Journal System:**
- `customer_journal` — Timeline of every customer interaction across all platforms. Sources: ai_call, calcom, servicetitan, jobber, hubspot, google_reviews, sms, n8n
- `a2p_registrations` — 10DLC compliance data per tenant. Vault-protected EIN fields.
- `a2p_audit_log` — Tracks who accessed vault fields and when

**Property Intelligence (Config B):**
- `properties` — Service addresses with gate codes, property type
- `assets` — Equipment at properties (brand, model, install date, confidence score)
- `contacts` — People linked to properties with relationship scores
- `interactions` — Call/service history per property

## Cal.com Integration (Per-Tenant)

**How it works:** Each tenant has their own Cal.com API key stored in `tenants.calcom_api_key`.
The retell/functions route reads this per-tenant key and calls Cal.com's real API:
- `check_availability` → `GET /v1/slots?apiKey={tenant_key}&eventTypeId={tenant_event_type}`
- `book_appointment` → `POST /v1/bookings?apiKey={tenant_key}`

Falls back to global env vars if per-tenant not set (backwards compatible for demo).

**Calendar-First Setup Order (CRITICAL):**
1. Connect Google Calendar / Outlook FIRST
2. Create event types SECOND
3. Set availability schedule THIRD
4. Generate API key FOURTH

## n8n Auto-Journal Workflows

Templates in `docs/n8n-templates/`:
- `gl365-base-auto-journal.json` — Base template: webhook → normalize → AI summary → Supabase journal
- `gl365-servicetitan-journal.json` — ServiceTitan job/customer events
- `gl365-jobber-journal.json` — Jobber job/client/invoice events
- `gl365-hubspot-journal.json` — HubSpot contact/deal/meeting events
- `gl365-google-reviews-journal.json` — Google Reviews polling + bad review alerts

Each workflow writes to `customer_journal` table with an AI-generated 1-sentence summary.

## Claude Code Skills

Skills in `.claude/skills/`:
- `deploy-client.md` — Full client deployment from signed contract to live agent
- `fix-agent.md` — Diagnose and fix live agent issues
- `offboard-client.md` — Safely suspend/deactivate a client

## New Client Deploy Flow

When Jared says "deploy [business name]":

1. **Tenant must exist** in Supabase (created during sales discovery)
2. **Call** `POST /api/admin/onboard-client` with intake blueprint data
3. This creates: Twilio sub-account → Retell LLM + agent → Cal.com config → Supabase update
4. **Generate A2P package**: `POST /api/admin/generate-a2p-package`
5. **Generate privacy policy**: `POST /api/admin/generate-privacy-policy`
6. **Test call** — verify availability check returns real slots, booking creates real event
7. **Go live** — update `onboarding_status = 'active'`

## A2P 10DLC Compliance

Every client needs A2P registration for SMS. The portal is at `/admin-v2/campaigns/a2p`.
The AI generates all campaign content from intake data. EIN and contact info are stored in
Supabase Vault (encrypted, zero-knowledge). Never expose EIN to any AI conversation.

## Environment Variables (All Set in Vercel)

`RETELL_API_KEY`, `CALCOM_API_KEY`, `CALCOM_EVENT_TYPE_ID`, `CALCOM_API_URL`,
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_SMS_NUMBER`,
`OPENROUTER_API_KEY`, `OPENWEATHER_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `SENDGRID_API_KEY`, `stripe_secret_key`

## The "Time Traveler" Principle

The AI should feel like a time traveler made it. The customer never repeats themselves:
- **Layer 1 — Memory:** `get_memory` runs at call start. Phone → full history.
- **Layer 2 — Calendar Intelligence:** Cal.com syncs with their real calendar.
- **Layer 3 — Cross-Platform CRM Sync:** n8n auto-journals everything from every platform.

When Sarah calls back 6 months later, the agent says: "Hey Sarah! Last time Marcus came out
for your AC repair. How's everything running?" She never gives her name or address again.

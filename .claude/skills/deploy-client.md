# Deploy New GL365 Client

## Purpose
Fully onboard a new GL365 client from approved Intake Blueprint to live AI voice agent.
This is the master deployment skill — it orchestrates all platform setup across Twilio, Retell, Cal.com, n8n, A2P, and privacy policy generation.

## When to Use
- After a client contract is signed and payment is confirmed
- When Jared says "deploy [business name]" or "onboard [business name]"
- When resuming a partially completed onboarding

## Inputs Required
- `tenant_id` (UUID from Supabase tenants table — must exist before deploy)
- `config_type` (A, B, or C — determines which template)

## Pre-Deploy Checklist
Before running deployment, verify:
1. Tenant exists in Supabase: `SELECT * FROM tenants WHERE id = '{tenant_id}'`
2. Intake Blueprint is complete: `SELECT intake_blueprint FROM tenants WHERE id = '{tenant_id}'`
3. Payment has been confirmed (check `contract_signed_at`)
4. Owner has provided: business name, phone, email, services list, hours, timezone

---

## Step 1: Fetch Intake Blueprint
```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/tenants?id=eq.{tenant_id}&select=*" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```
Verify all required fields are populated. If intake_blueprint is null, ask Jared before proceeding.

## Step 2: Determine Config and Generate System Prompt
- Config A: Use `config/agent-templates/template-a-solo.ts`
- Config B: Use `config/agent-templates/template-b-multi-resource.ts`
- Config C: Use `config/agent-templates/template-c-bridge.ts`
Fill all `{{variables}}` from the Intake Blueprint.

## Step 3: Create Twilio Sub-Account + Purchase Phone Number

### 3a: Create Twilio Sub-Account
```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -d "FriendlyName=GL365 - {business_name}"
```
Save the returned `sid` as `twilio_sub_sid` and `auth_token` as `twilio_sub_auth_token_enc`.

### 3b: Purchase Phone Number in Client's Area Code
```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/{twilio_sub_sid}/IncomingPhoneNumbers.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -d "AreaCode={area_code}" \
  -d "VoiceUrl=https://api.retellai.com/twilio-voice-webhook/{retell_agent_id}" \
  -d "SmsUrl=https://www.greenline365.com/api/webhooks/sms"
```

**HUMAN CHECKPOINT**: Confirm area code with Jared before purchasing. Once purchased, the number costs money monthly.

### 3c: Store Twilio Credentials
```sql
UPDATE tenants SET
  twilio_sub_sid = '{sub_sid}',
  twilio_sub_auth_token_enc = '{auth_token}',
  twilio_phone_number = '{purchased_number}'
WHERE id = '{tenant_id}';
```

## Step 4: Cal.com Calendar-First Setup (4-Step Sequence)

**CRITICAL**: Follow this exact order. Creating event types before connecting the real calendar causes double-booking issues.

### Step 4a: Verify Calendar Connection (calcom_setup_step = 1)
The client must connect their Google/Outlook calendar FIRST via Cal.com app install.
```bash
curl "https://api.cal.com/v1/selected-calendars?apiKey={calcom_api_key}" \
  -H "Content-Type: application/json"
```
- If empty response or no calendars → STOP. Tell Jared the client needs to connect their calendar first.
- If calendars are connected → proceed.

```sql
UPDATE tenants SET calcom_setup_step = 1, calcom_google_linked = true
WHERE id = '{tenant_id}';
```

### Step 4b: Create Event Types (calcom_setup_step = 2)
Create event types AFTER calendar is connected so they inherit the right calendar.
```bash
curl -X POST "https://api.cal.com/v1/event-types?apiKey={calcom_api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "{service_name}",
    "slug": "{service_slug}",
    "length": {duration_minutes},
    "description": "Book {service_name} with {business_name}",
    "locations": [{"type": "inPerson", "address": "{business_address}"}]
  }'
```
For Config B (multi-resource), create one event type per staff member or service.

```sql
UPDATE tenants SET
  calcom_setup_step = 2,
  calcom_event_type_id = {primary_event_type_id},
  calcom_event_type_ids = '{event_type_ids_json}'
WHERE id = '{tenant_id}';
```

### Step 4c: Set Availability Schedule (calcom_setup_step = 3)
Verify the client's availability matches their business hours.
```bash
curl "https://api.cal.com/v1/schedules?apiKey={calcom_api_key}" \
  -H "Content-Type: application/json"
```
If no schedule exists or hours don't match business_hours from the blueprint:
```bash
curl -X POST "https://api.cal.com/v1/schedules?apiKey={calcom_api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{business_name} Hours",
    "timeZone": "{timezone}",
    "availability": [
      {"days": [1,2,3,4,5], "startTime": "{open_time}", "endTime": "{close_time}"}
    ]
  }'
```

```sql
UPDATE tenants SET calcom_setup_step = 3 WHERE id = '{tenant_id}';
```

### Step 4d: Store API Key and Mark Complete (calcom_setup_step = 4)
```sql
UPDATE tenants SET
  calcom_setup_step = 4,
  calcom_status = 'configured',
  calcom_api_key = '{api_key}',
  calcom_booking_url = 'https://cal.com/{calcom_username}/{event_slug}'
WHERE id = '{tenant_id}';
```

Test that slots are returned:
```bash
curl "https://api.cal.com/v1/slots?apiKey={calcom_api_key}&eventTypeId={event_type_id}&startTime={tomorrow}T00:00:00Z&endTime={tomorrow}T23:59:59Z&timeZone={timezone}"
```
Must return at least one available slot during business hours.

## Step 5: Create Retell LLM + Agent

### 5a: Create Retell LLM with System Prompt
```bash
curl -X POST "https://api.retellai.com/v2/create-retell-llm" \
  -H "Authorization: Bearer $RETELL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "general_prompt": "{generated_system_prompt}",
    "begin_message": "{greeting_phrase}",
    "general_tools": [
      {"type": "end_call", "name": "end_call"},
      {"type": "custom", "name": "check_availability_cal", "url": "https://www.greenline365.com/api/retell/functions"},
      {"type": "custom", "name": "create_booking_cal", "url": "https://www.greenline365.com/api/retell/functions"},
      {"type": "custom", "name": "check_existing_customer", "url": "https://www.greenline365.com/api/retell/functions"},
      {"type": "custom", "name": "transfer_to_human", "url": "https://www.greenline365.com/api/retell/functions"}
    ]
  }'
```

### 5b: Create Retell Agent and Link to Twilio Number
```bash
curl -X POST "https://api.retellai.com/v2/create-agent" \
  -H "Authorization: Bearer $RETELL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "llm_websocket_url": "{retell_llm_ws_url}",
    "agent_name": "GL365 - {business_name}",
    "voice_id": "{selected_voice_id}",
    "metadata": {"tenant_id": "{tenant_id}", "business_id": "{tenant_id}"}
  }'
```

```sql
UPDATE tenants SET
  retell_agent_id = '{agent_id}',
  retell_llm_id = '{llm_id}',
  retell_phone_number = '{twilio_phone_number}'
WHERE id = '{tenant_id}';
```

## Step 6: Deploy Cal.com Webhook for Auto-Journal
Configure Cal.com to send booking events to our webhook:
```bash
curl -X POST "https://api.cal.com/v1/webhooks?apiKey={calcom_api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriberUrl": "https://www.greenline365.com/api/webhooks/calcom?tenant_id={tenant_id}",
    "eventTriggers": ["BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED", "MEETING_ENDED"],
    "active": true
  }'
```
This ensures every booking, reschedule, and cancellation is logged to `customer_journal`.

## Step 7: Deploy n8n CRM Bridge Workflow (Config C Only)
For Config C clients with external CRM integration:

1. Determine CRM platform: ServiceTitan, Jobber, HubSpot, etc.
2. Import the correct template from `docs/n8n-templates/`:
   - `gl365-servicetitan-journal.json`
   - `gl365-jobber-journal.json`
   - `gl365-hubspot-journal.json`
   - `gl365-google-reviews-journal.json`
3. In n8n, configure the workflow:
   - Set `tenant_id` in the webhook URL or metadata
   - Add the client's Supabase credentials to n8n environment
   - Set the client's CRM API key in n8n credentials
4. Activate the workflow

For non-Config-C clients, skip this step — their journal entries come from Cal.com webhooks and AI calls only.

## Step 8: Generate A2P Compliance Package
```bash
curl -X POST "https://www.greenline365.com/api/admin/generate-a2p-package" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "{tenant_id}"}'
```
This AI-generates the campaign description, 5 SMS samples, and opt-in copy for Twilio A2P 10DLC registration.

## Step 9: Generate Privacy Policy
```bash
curl -X POST "https://www.greenline365.com/api/admin/generate-privacy-policy" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "{tenant_id}"}'
```
This creates an A2P-compliant privacy policy HTML, stores it in Supabase Storage, and saves the URL to `tenants.privacy_policy_url`. Required for Twilio A2P campaign registration.

## Step 10: Submit A2P Registration to Twilio
After reviewing the generated A2P package:
1. Open the A2P compliance portal: `/admin-v2/campaigns/a2p`
2. Select the tenant
3. Copy fields to Twilio Brand Registration form
4. Copy fields to Twilio Campaign Registration form
5. Submit and record the Twilio Brand SID and Campaign SID

```sql
UPDATE a2p_registrations SET
  twilio_brand_sid = '{brand_sid}',
  twilio_campaign_sid = '{campaign_sid}',
  brand_status = 'pending',
  campaign_status = 'pending',
  submitted_at = NOW()
WHERE tenant_id = '{tenant_id}';
```

## Step 11: Call the Onboard Client Endpoint
This orchestrates Steps 3-5 automatically if they haven't been done individually:
```bash
curl -X POST "https://www.greenline365.com/api/admin/onboard-client" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "{tenant_id}",
    "config_type": "{A|B|C}",
    "business_name": "{from_blueprint}",
    "owner_name": "{from_blueprint}",
    "agent_name": "{from_blueprint}",
    "brand_voice": "{from_blueprint}",
    "greeting_phrase": "{from_blueprint}",
    "business_hours": "{from_blueprint}",
    "services": "{from_blueprint}",
    "transfer_number": "{from_blueprint}",
    "emergency_keywords": [],
    "industry": "{from_blueprint}",
    "area_code": "{from_blueprint}",
    "timezone": "{from_blueprint}"
  }'
```
Use `skip_twilio`, `skip_retell`, `skip_calcom` flags if those steps were already completed manually.

## Step 12: "Customer Never Repeats Themselves" Verification Test

This is the final quality gate. The deployed agent must pass ALL of these checks:

### Test A: First-Time Caller Recognition
1. Make a test call to the agent's number from an unknown number
2. Verify the agent asks for name, service needed, and preferred time
3. Book an appointment
4. Confirm `customer_journal` has a `booking_created` entry with the right data

### Test B: Return Caller Memory
1. Call again from the SAME number within 5 minutes
2. The agent should greet by name ("Welcome back, {name}!")
3. The agent should NOT re-ask for name or basic info
4. Verify: `SELECT * FROM customer_journal WHERE contact_phone = '{test_phone}' ORDER BY created_at DESC`

### Test C: Calendar Intelligence
1. Check availability via the agent — it should return REAL Cal.com slots
2. Book a slot — it should appear on the actual Cal.com calendar
3. Cancel or reschedule — `customer_journal` should log the event automatically via webhook

### Test D: Cross-Platform Sync (Config C only)
1. Trigger a test event from the CRM (create a job, send an invoice, etc.)
2. Verify the n8n workflow fires and writes to `customer_journal`
3. Call the agent again — it should reference the CRM event in context

### Test E: Emergency Detection
1. Call and say an emergency keyword (e.g., "my pipes burst" for a plumber)
2. The agent should immediately offer to transfer to the owner's phone
3. Verify `transfer_phone` is being used correctly

### Verification Query
```sql
SELECT source, event_type, summary, created_at
FROM customer_journal
WHERE tenant_id = '{tenant_id}'
ORDER BY created_at DESC
LIMIT 20;
```
Must show entries from at least: `ai_call`, `calcom` sources. Config C should also show CRM source entries.

## Step 13: Go Live
```sql
UPDATE tenants SET
  onboarding_status = 'active',
  onboarding_completed_at = NOW(),
  calcom_status = 'live'
WHERE id = '{tenant_id}';
```

## Step 14: Notify
- Send Slack notification: "Client {business_name} is LIVE — {phone_number}"
- Send onboarding email via SendGrid with:
  - Their AI phone number
  - Link to their privacy policy
  - Instructions for "text STOP to opt out"
  - Dashboard link (if applicable)

---

## Human Checkpoints (MUST pause for approval)
- [ ] Confirm phone number area code before purchasing (Step 3b)
- [ ] Confirm test call passed before sending onboarding email (Step 12)
- [ ] Review A2P package before submitting to Twilio (Step 10)
- [ ] Do NOT send onboarding email if any verification test fails — escalate to Jared

## On Failure
- Log error: `INSERT INTO a2p_audit_log (tenant_id, action, field_name) VALUES ('{tenant_id}', 'deploy_failed', '{error_details}')`
- Set status: `UPDATE tenants SET onboarding_status = 'building' WHERE id = '{tenant_id}'`
- Notify Jared with error details and which step failed
- If Cal.com step fails: check `calcom_setup_step` to know exactly where it stopped

## Reference Docs
- `/docs/saas-product-architecture.md`
- `/docs/retell-ai-agent-base-template.md`
- `/webapp/config/agent-templates/` (all 3 template files)
- `/webapp/app/api/admin/onboard-client/route.ts`
- `/webapp/app/api/admin/generate-a2p-package/route.ts`
- `/webapp/app/api/admin/generate-privacy-policy/route.ts`
- `/webapp/app/api/webhooks/calcom/route.ts`
- `/docs/n8n-templates/` (CRM bridge workflow templates)
- `CLAUDE.md` (project root institutional memory)

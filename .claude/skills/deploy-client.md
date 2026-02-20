# Deploy New GL365 Client

## Purpose
Fully onboard a new GL365 client from approved Intake Blueprint to live AI voice agent.
This is the master deployment skill — it orchestrates all platform setup across Twilio, Retell, and Cal.com.

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
3. A2P compliance package has been generated (or generate it now)
4. Payment has been confirmed (check `contract_signed_at`)

## Steps

### Step 1: Fetch Intake Blueprint
```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/tenants?id=eq.{tenant_id}&select=*" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### Step 2: Determine Config and Generate System Prompt
- Config A: Use `config/agent-templates/template-a-solo.ts`
- Config B: Use `config/agent-templates/template-b-multi-resource.ts`
- Config C: Use `config/agent-templates/template-c-bridge.ts`
Fill all `{{variables}}` from the Intake Blueprint.

### Step 3: Call Onboard Client Endpoint
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

### Step 4: Verify Cal.com Connection
After the endpoint returns, verify:
- `calcom_api_key` is stored in tenants table
- `calcom_event_type_id` is set
- Test: call `/api/mcp` with `check_availability_cal` and the new tenant's credentials

### Step 5: Generate A2P Package
```bash
curl -X POST "https://www.greenline365.com/api/admin/generate-a2p-package" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "{tenant_id}"}'
```

### Step 6: Test Call Verification
- Make a test call via Retell outbound API
- Verify check_availability returns real Cal.com slots
- Verify create_booking creates a real appointment
- Verify webhook logs to call_logs table
- Verify customer_journal gets an entry

### Step 7: Go Live
```sql
UPDATE tenants SET onboarding_status = 'active', onboarding_completed_at = NOW()
WHERE id = '{tenant_id}';
```

### Step 8: Notify
- Send Slack notification: "Client {business_name} is LIVE"
- Send onboarding email via SendGrid with phone number + dashboard link

## Human Checkpoints
- Confirm phone number area code before purchasing
- Confirm test call passed before sending onboarding email
- Do NOT send onboarding email if test call fails — escalate to Jared

## On Failure
- Log error to Supabase: `INSERT INTO a2p_audit_log (tenant_id, action, field_name) VALUES ('{tenant_id}', 'deploy_failed', '{error}')`
- Set status: `UPDATE tenants SET onboarding_status = 'building' WHERE id = '{tenant_id}'`
- Notify Jared with error details

## Reference Docs
- `/docs/saas-product-architecture.md`
- `/docs/retell-ai-agent-base-template.md`
- `/webapp/config/agent-templates/` (all 3 template files)
- `/webapp/app/api/admin/onboard-client/route.ts`

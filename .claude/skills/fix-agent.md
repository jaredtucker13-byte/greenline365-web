# Fix Live Agent Issue

## Purpose
Diagnose and fix issues with a live GL365 client's AI voice agent.

## When to Use
- Client reports their AI isn't answering
- Cal.com availability is returning wrong slots
- Bookings aren't appearing on the calendar
- Emergency keywords aren't triggering transfer
- Agent is using wrong greeting or tone

## Diagnostic Steps

### Step 1: Check Tenant Status
```sql
SELECT id, business_name, config_type, onboarding_status,
       retell_agent_id, calcom_api_key, calcom_event_type_id,
       twilio_phone_number, retell_phone_number
FROM tenants WHERE business_name ILIKE '%{client_name}%';
```

### Step 2: Check Recent Call Logs
```sql
SELECT * FROM call_logs
WHERE business_id = '{tenant_id}'
ORDER BY created_at DESC LIMIT 10;
```

### Step 3: Test Cal.com Availability
```bash
curl "https://api.cal.com/v1/slots?apiKey={calcom_api_key}&eventTypeId={event_type_id}&startTime={today}T00:00:00Z&endTime={today}T23:59:59Z&timeZone=America/New_York"
```

### Step 4: Test MCP Function
```bash
curl -X POST "https://www.greenline365.com/api/retell/functions" \
  -H "Content-Type: application/json" \
  -d '{"name":"check_availability_cal","args":{"start_time":"{today}"},"call":{"metadata":{"business_id":"{tenant_id}"}}}'
```

### Step 5: Check Retell Agent Config
```bash
curl "https://api.retellai.com/get-agent/{retell_agent_id}" \
  -H "Authorization: Bearer $RETELL_API_KEY"
```

## Common Fixes
- **Cal.com 401**: API key expired → regenerate in Cal.com dashboard, update tenants table
- **No slots returned**: Event type ID wrong → check `/api/calcom/event-types` with their key
- **Wrong greeting**: Update system prompt in Retell LLM → PATCH `/v2/update-retell-llm/{llm_id}`
- **Booking not syncing**: Check `external_calendar_id` column in bookings table
- **Emergency not triggering**: Check `emergency_keywords` array in tenants table

## Reference
- `/webapp/app/api/retell/functions/route.ts` — the function handler
- `/webapp/app/api/mcp/route.ts` — the MCP server (alternative path)

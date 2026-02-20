# Offboard / Suspend GL365 Client

## Purpose
Safely deactivate a client's AI agent when they churn or pause their subscription.
All data is preserved (not deleted) so it can be reactivated later.

## When to Use
- Client cancels their GL365 subscription
- Client requests temporary pause
- Non-payment after grace period

## Steps

### Step 1: Suspend Twilio Sub-Account
```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/{twilio_sub_sid}.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -d "Status=suspended"
```
This immediately stops all calls to their number. The number is preserved and can be reactivated.

### Step 2: Deactivate Retell Agent
Delete the phone number binding (not the agent itself):
```bash
curl -X DELETE "https://api.retellai.com/delete-phone-number/{retell_phone_number}" \
  -H "Authorization: Bearer $RETELL_API_KEY"
```

### Step 3: Update Supabase
```sql
UPDATE tenants SET
  onboarding_status = 'paused',  -- or 'churned'
  is_active = false
WHERE id = '{tenant_id}';
```

### Step 4: Cancel Stripe Subscription (if applicable)
```bash
curl -X DELETE "https://api.stripe.com/v1/subscriptions/{stripe_subscription_id}" \
  -u "$STRIPE_SECRET_KEY:"
```

### Step 5: Notify
- Log to audit: `INSERT INTO a2p_audit_log (tenant_id, action) VALUES ('{tenant_id}', 'client_offboarded')`
- Notify Jared via Slack

## Reactivation
To bring a client back online:
1. Unsuspend Twilio: `Status=active`
2. Re-bind Retell phone number to agent
3. Update tenants: `onboarding_status = 'active'`, `is_active = true`
4. Test call to verify

## Important
- NEVER delete the tenant row or their data
- NEVER release their phone number (it takes 30+ days to get back)
- Always preserve call logs and customer journal for potential reactivation

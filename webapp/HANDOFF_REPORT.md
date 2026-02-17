# Coder's Hand-Off Report
## Greenline365 Booking Suite - Build Complete

**Prepared for**: Tester ("Hands")
**Date**: February 17, 2026
**Build Version**: Booking Suite v1.0

---

## 1. Deployment URL

**Staging Dashboard**: `{DEPLOYMENT_URL}/admin-v2/booking-suite`

> Replace `{DEPLOYMENT_URL}` with your Vercel deployment URL once deployed.
> Example: `https://greenline365-web.vercel.app/admin-v2/booking-suite`

The Booking Suite is accessible from the sidebar navigation under "BOOKING SUITE" section.

---

## 2. The "Key" List

### Client_ID / Tenant_ID
- **Tenant Name**: Volt-Amps Electrical Services
- **Tenant_ID**: Created via migration `027_booking_suite_onboarding.sql`
- **Business_ID**: Created in parallel in `businesses` table
- **Plan Level**: `trial_pro`
- **has_booking_suite**: `true`
- **test_mode**: `true`

> To retrieve the actual UUID after running the migration:
> ```sql
> SELECT id, business_name, has_booking_suite, test_mode, plan_level
> FROM tenants WHERE business_name = 'Volt-Amps Electrical Services';
> ```

### Retell AI Phone Number
- **Phone Number**: Configured per tenant via `retell_phone_number` column
- **Webhook**: `POST /api/retell/webhook`
- **Agent ID**: Set via `RETELL_API_KEY` env var and tenant's `retell_agent_id`

> Set in environment:
> ```env
> RETELL_API_KEY=your_retell_api_key
> ```

### Cal.com Booking Link
- **Booking Link**: Configured per tenant via `calcom_booking_link` column
- **Event Type ID**: Set via tenant's `calcom_event_type_id`
- **Webhook**: `POST /api/webhooks/booking-sync`

> Set in environment:
> ```env
> CALCOM_API_KEY=your_calcom_api_key
> ```

---

## 3. Environment Confirmation

### TEST_PERSONAL_EMAIL Variable

The email routing system uses a conditional environment switch:

```typescript
const recipient = is_test_mode ? process.env.TEST_PERSONAL_EMAIL : payload.customer_email;
```

**Current Configuration**:
- `TEST_PERSONAL_EMAIL` defaults to `jared.tucker13@gmail.com` (from tenants table owner_email)
- `test_mode` is set to `true` on the Volt-Amps tenant
- All booking confirmation emails will route to the test email while `test_mode = true`

**Verification**: When a test booking is created:
1. The email subject will be prefixed with `[TEST]`
2. The email body includes an orange banner showing the original intended recipient
3. The `booking_sync_log` table records `email_test_mode = true` and `email_recipient` for each send

> To verify in database:
> ```sql
> SELECT email_sent, email_recipient, email_test_mode
> FROM booking_sync_log
> ORDER BY created_at DESC LIMIT 5;
> ```

**Required env vars**:
```env
TEST_PERSONAL_EMAIL=jared.tucker13@gmail.com
SENDGRID_API_KEY=your_sendgrid_key
SENDER_EMAIL=greenline365help@gmail.com
```

---

## 4. Endpoint Status Table

| # | Endpoint | Route | Status |
|---|----------|-------|--------|
| 1 | Supabase Realtime | WebSocket subscription on `bookings` table | [ ] Listening |
| 2 | Retell AI Hook | `POST /api/retell/webhook` | [ ] Listening |
| 3 | Cal.com Hook | `POST /api/webhooks/booking-sync` | [ ] Listening |
| 4 | Google Calendar API | `googleapis.com/calendar/v3/freeBusy` | [ ] Listening |
| 5 | Email Service | `POST /api/email/send` (SendGrid) | [ ] Listening |

### How to Verify Endpoints

1. **Supabase Realtime**: Open the Booking Suite Command Center tab - look for the green "LIVE" indicator
2. **Retell AI Hook**: Make a test call to the assigned phone number, check `/api/retell/webhook` logs
3. **Cal.com Hook**: Create a test booking via Cal.com link, check `booking_sync_log` table
4. **Google Calendar API**: Click "Check All" on the Endpoint Status tab in the Booking Suite
5. **Email Service**: Create a booking via `/api/webhooks/booking-sync` - check email delivery

### Test Booking API Call

```bash
curl -X POST https://YOUR_DEPLOYMENT_URL/api/webhooks/booking-sync \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "booking.created",
    "source": "api",
    "tenant_id": "YOUR_TENANT_ID",
    "customer_name": "Test Customer",
    "customer_email": "test@example.com",
    "service_type": "Electrical Inspection",
    "start_time": "2026-02-18T10:00:00Z",
    "duration_minutes": 60
  }'
```

---

## 5. 5-Persona Test Script (for the Tester)

Execute these tests after deployment to validate the full booking flow.

### Pre-requisites
- Log into `{DEPLOYMENT_URL}/admin-v2/booking-suite` as Business Owner
- Keep the Command Center tab open to watch for real-time updates
- Have your personal email inbox open

### Test Sequence

| # | Persona | Action | API Payload | Validation |
|---|---------|--------|-------------|------------|
| 1 | **Marcus** | Book 10:00 AM Standard Diagnostic | `event_type: "booking.created", start_time: "2026-02-18T10:00:00Z", duration_minutes: 60, service_type: "Standard Diagnostic"` | Email received? Marcus appears on Dashboard? Google Calendar shows `[Volt-Amps] - Marcus Sterling`? |
| 2 | **Elena** | Try to book 11:10 AM (within buffer) | `event_type: "booking.created", start_time: "2026-02-18T11:10:00Z"` | Should get **409 Conflict** with buffer message. Marcus's booking ends at 11:00 AM + 15-min buffer = blocked until 11:15 AM. |
| 3 | **David** | Try to book 10:00 AM via Cal.com | Use Cal.com booking link | Slot should be greyed out / unavailable because of Marcus. |
| 4 | **Sarah** | Reschedule from 2:00 PM to 4:00 PM | `event_type: "booking.updated", booking_id: "{SARAH_BOOKING_ID}", new_start_time: "2026-02-18T16:00:00Z"` | Dashboard **updates the existing row** (not new one). Google Calendar event moves. Old buffers deleted, new buffers created. |
| 5 | **Arthur** | Cancel his Friday appointment | `event_type: "booking.cancelled", booking_id: "{ARTHUR_BOOKING_ID}"` | Slot instantly available on Cal.com. All Google Calendar events (main + buffers) deleted. |

### Test Curl Commands

**Marcus - Create booking:**
```bash
curl -X POST {DEPLOYMENT_URL}/api/webhooks/booking-sync \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "booking.created",
    "source": "retell",
    "tenant_id": "{TENANT_ID}",
    "customer_name": "Marcus Sterling",
    "customer_email": "marcus@example.com",
    "customer_phone": "+15551234567",
    "service_type": "Standard Diagnostic",
    "start_time": "2026-02-18T10:00:00-06:00",
    "duration_minutes": 60,
    "staff_assigned": "Mike (Lead Tech)"
  }'
```

**Elena - Buffer conflict test:**
```bash
curl -X POST {DEPLOYMENT_URL}/api/webhooks/booking-sync \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "booking.created",
    "source": "retell",
    "tenant_id": "{TENANT_ID}",
    "customer_name": "Elena Vasquez",
    "customer_email": "elena@example.com",
    "service_type": "Panel Upgrade Consultation",
    "start_time": "2026-02-18T11:10:00-06:00",
    "duration_minutes": 30
  }'
```

**Sarah - Reschedule:**
```bash
curl -X POST {DEPLOYMENT_URL}/api/webhooks/booking-sync \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "booking.updated",
    "source": "retell",
    "tenant_id": "{TENANT_ID}",
    "booking_id": "{SARAH_BOOKING_ID}",
    "customer_name": "Sarah Chen",
    "customer_email": "sarah@example.com",
    "service_type": "EV Charger Installation",
    "start_time": "2026-02-18T14:00:00-06:00",
    "new_start_time": "2026-02-18T16:00:00-06:00",
    "duration_minutes": 45
  }'
```

**Arthur - Cancel:**
```bash
curl -X POST {DEPLOYMENT_URL}/api/webhooks/booking-sync \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "booking.cancelled",
    "source": "retell",
    "tenant_id": "{TENANT_ID}",
    "booking_id": "{ARTHUR_BOOKING_ID}",
    "customer_name": "Arthur Williams",
    "customer_email": "arthur@example.com",
    "service_type": "General Electrical Work"
  }'
```

### Final Verification Checklist

- [ ] Google Calendar shows events in format: `[Volt-Amps] - Marcus Sterling`
- [ ] 15-minute buffer blocks appear as separate `[Travel/Buffer]` events (gray)
- [ ] Elena's 11:10 AM request returned 409 Conflict
- [ ] David's Cal.com attempt showed 10:00 AM as unavailable
- [ ] Sarah's reschedule UPDATED the existing row (not a new booking)
- [ ] Arthur's cancellation freed the slot (check Cal.com availability)

---

## 6. Required Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Retell AI
RETELL_API_KEY=your_retell_api_key

# Cal.com
CALCOM_API_KEY=your_calcom_api_key

# Google Calendar (Service Account)
GOOGLE_CALENDAR_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_CALENDAR_ID=primary

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_key
SENDER_EMAIL=greenline365help@gmail.com
TEST_PERSONAL_EMAIL=jared.tucker13@gmail.com

# Webhook Security
BOOKING_WEBHOOK_SECRET=your_webhook_secret

# Stripe (existing)
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

---

## 6. Files Created/Modified

### New Files
| File | Purpose |
|------|---------|
| `supabase/migrations/027_booking_suite_onboarding.sql` | DB migration: has_booking_suite columns, sync log table, upsert function, Volt-Amps tenant |
| `app/api/onboarding/tenant/route.ts` | Tenant upsert API endpoint |
| `app/api/webhooks/booking-sync/route.ts` | Multi-sync webhook orchestrator |
| `app/admin-v2/booking-suite/page.tsx` | Booking Suite page with all tabs |
| `app/admin-v2/components/BookingSuiteGate.tsx` | Feature gate HOC/wrapper for has_booking_suite |
| `app/admin-v2/components/BookingCommandCenter.tsx` | Real-time booking table with Supabase Realtime |
| `lib/google-calendar.ts` | Google Calendar Free/Busy integration |
| `lib/email-routing.ts` | Dynamic email routing with test mode |
| `HANDOFF_REPORT.md` | This document |

### Modified Files
| File | Change |
|------|--------|
| `lib/business/BusinessContext.tsx` | Added `has_booking_suite`, `plan_level`, `test_mode`, etc. to Business interface |
| `app/admin-v2/components/CollapsibleSidebar.tsx` | Added Booking Suite nav item with zap icon |

---

## 8. Architecture Overview

```
Cal.com Webhook ──┐
                  │
Retell AI Call ───┤──→ /api/webhooks/booking-sync (Orchestrator)
                  │         │
Manual API Call ──┘         ├─→ 1. Validate signature (Retell x-retell-signature / Cal.com x-cal-signature)
                            │
                            ├── booking.created (Marcus):
                            │   ├─→ 2. Google Calendar Free/Busy check (buffer window)
                            │   ├─→ 3. Supabase conflict check (+ 15-min buffer)
                            │   ├─→ 4. Write to Supabase bookings table
                            │   ├─→ 5. Create Google Calendar event: [Volt-Amps] - Customer Name
                            │   ├─→ 5b. Create buffer-before event (15 min, gray)
                            │   ├─→ 5c. Create buffer-after event (15 min, gray)
                            │   ├─→ 6. Sync to Cal.com (if not origin)
                            │   ├─→ 7. Send email (test mode → TEST_PERSONAL_EMAIL)
                            │   └─→ 8. Log to booking_sync_log
                            │
                            ├── booking.updated (Sarah - Reschedule):
                            │   ├─→ Conflict check for NEW time (excluding self)
                            │   ├─→ UPDATE existing booking row (not insert new)
                            │   ├─→ Delete old Google Calendar buffer events
                            │   ├─→ PATCH main Google Calendar event with new time
                            │   └─→ Create new buffer events for new time
                            │
                            └── booking.cancelled (Arthur):
                                ├─→ Set status = 'cancelled' (slot freed instantly)
                                ├─→ Delete ALL Google Calendar events (main + buffers)
                                └─→ Cancel on Cal.com if applicable

                   Supabase Realtime ──→ Command Center Dashboard (live updates)

Elena scenario: booking.created at 11:10 AM → 409 Conflict (within Marcus's buffer)
David scenario: Cal.com availability check → slot shows unavailable
```

# GreenLine365 Supabase Edge Functions

## Overview

This directory contains Supabase Edge Functions for the GreenLine365 Tactical Command Center.

## Functions

### 1. Schedule Blast (`/functions/schedule-blast`)

Handles content scheduling and social media posting.

**Actions:**
- `schedule` - Schedule content for future publishing
- `publish_now` - Publish content immediately
- `cancel` - Cancel scheduled content
- `list` - List all scheduled content

**Example Request:**
```json
{
  "action": "schedule",
  "content": {
    "title": "Monday Motivation Post",
    "content": "Start your week strong! 💪",
    "platforms": ["instagram", "facebook"],
    "scheduled_at": "2026-01-12T09:00:00Z"
  }
}
```

### 2. Local Trends (`/functions/local-trends`)

Fetches and manages local intelligence for the Daily Trend Hunter.

**Actions:**
- `fetch` - Fetch new trends for a location
- `refresh` - Force refresh trends
- `list` - List existing trends

**Example Request:**
```json
{
  "action": "fetch",
  "location": "Tampa, FL"
}
```

### 3. Lead Alerts (`/functions/lead-alerts`)

Handles real-time lead notifications from the AI Concierge.

**Actions:**
- `create` - Create a new lead and send notifications
- `notify` - Send notification for existing lead
- `update` - Update lead information
- `list` - List all leads

**Example Request:**
```json
{
  "action": "create",
  "lead": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "message": "Interested in your services",
    "source": "chat"
  },
  "notification_channels": ["email", "slack"]
}
```

## Deployment

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref rawlqwjdfzicjepzmcng
   ```

### Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy schedule-blast
supabase functions deploy local-trends
supabase functions deploy lead-alerts
```

### Set Environment Variables

Set required secrets in Supabase Dashboard or via CLI:

```bash
supabase secrets set SENDGRID_API_KEY=your_sendgrid_key
supabase secrets set TWILIO_SID=your_twilio_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_twilio_token
```

## Database Tables

Make sure these tables exist in your Supabase database:

### content_schedule
```sql
CREATE TABLE content_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  media_urls TEXT[],
  status TEXT DEFAULT 'scheduled',
  client_id TEXT,
  metadata JSONB DEFAULT '{}',
  publish_results JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### local_trends
```sql
CREATE TABLE local_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  event_date TIMESTAMPTZ,
  expected_traffic TEXT,
  category TEXT,
  suggested_action TEXT,
  source TEXT,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### leads
```sql
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'chat',
  score INTEGER,
  tags TEXT[],
  conversation_id TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

### activity_log
```sql
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Scheduled Jobs (Cron)

To set up the daily trend hunter cron job, add this to your Supabase dashboard under "Database > Scheduled Jobs":

```sql
SELECT net.http_post(
  url := 'https://rawlqwjdfzicjepzmcng.supabase.co/functions/v1/local-trends',
  body := '{"action": "fetch", "location": "Tampa, FL"}'::jsonb,
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
  )
);
```

Schedule: `0 6 * * *` (Runs daily at 6 AM)

## Local Development

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# Test a function
curl -X POST http://localhost:54321/functions/v1/local-trends \
  -H "Content-Type: application/json" \
  -d '{"action": "list", "location": "Tampa, FL"}'
```

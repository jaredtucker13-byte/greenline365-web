# Weather Watcher Edge Function Setup

## Overview
The Weather Watcher is a Supabase Edge Function that monitors weather conditions for all businesses with configured ZIP codes. It runs periodically and:

1. Checks for severe weather alerts via OpenWeather API
2. Updates business `tenant_status` to `extreme_weather` when severe conditions are detected
3. Logs weather alerts to the `weather_alerts` table
4. Checks rain forecast for outdoor-dependent businesses

## Prerequisites

1. Supabase CLI installed: `npm install -g supabase`
2. OpenWeather API key (already configured as `OPENWEATHER_API_KEY`)
3. Migration `013_realfeel_booking_system_FIXED.sql` has been run

## Deployment Steps

### 1. Initialize Supabase Functions (if not done)
```bash
cd webapp
supabase init  # Skip if already initialized
```

### 2. Set Environment Secrets
```bash
supabase secrets set OPENWEATHER_API_KEY=01c4fcd1427b885071211a7d50dca7bd
```

### 3. Deploy the Function
```bash
supabase functions deploy weather-watcher
```

### 4. Test the Function
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/weather-watcher \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Setting Up Scheduled Execution

### Option A: Using pg_cron (Recommended)

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension (if not enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job that runs every 30 minutes
SELECT cron.schedule(
  'weather-watcher-job',  -- Job name
  '*/30 * * * *',         -- Every 30 minutes
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weather-watcher',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- To check scheduled jobs
SELECT * FROM cron.job;

-- To unschedule
-- SELECT cron.unschedule('weather-watcher-job');
```

### Option B: Using n8n Webhook

1. Create a new n8n workflow
2. Add a **Schedule Trigger** node (every 30 minutes)
3. Add an **HTTP Request** node:
   - Method: POST
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/weather-watcher`
   - Headers:
     - `Authorization`: `Bearer YOUR_SERVICE_ROLE_KEY`
     - `Content-Type`: `application/json`
4. Activate the workflow

## How It Works

### Business Status Flow
```
normal → extreme_weather → normal
         (auto-triggered)    (manual or auto-clear)
```

### Severity Levels
| Level | Description | Action |
|-------|-------------|--------|
| 1 | Minor | Log only |
| 2 | Unknown | Log only |
| 3 | Moderate | Log + optional alert |
| 4 | Severe | Log + status change |
| 5 | Extreme | Log + status change + emergency mode |

### Emergency Events (Trigger Status Change)
- Hurricane
- Tornado
- Blizzard
- Ice Storm
- Flood
- Winter Storm
- Severe Thunderstorm

## Configuring Businesses for Weather Awareness

Update a business to be weather-aware:

```sql
UPDATE businesses 
SET 
  is_weather_dependent = true,
  weather_threshold = 50,  -- Rain % that triggers warnings
  zip_code = '33619'       -- Business location ZIP
WHERE slug = 'your-business-slug';
```

Or use the API:

```bash
curl -X PATCH http://localhost:3000/api/realfeel/context \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "business_id": "YOUR_BUSINESS_ID",
    "is_weather_dependent": true,
    "weather_threshold": 50,
    "zip_code": "33619"
  }'
```

## Monitoring

Check weather alerts in Supabase:
```sql
SELECT 
  b.name as business,
  wa.alert_type,
  wa.severity_level,
  wa.forecast_summary,
  wa.created_at
FROM weather_alerts wa
JOIN businesses b ON b.id = wa.business_id
ORDER BY wa.created_at DESC
LIMIT 20;
```

Check business statuses:
```sql
SELECT name, tenant_status, zip_code, is_weather_dependent
FROM businesses
WHERE zip_code IS NOT NULL;
```

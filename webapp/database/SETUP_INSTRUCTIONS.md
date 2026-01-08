# Database Setup Instructions for Supabase

## Step 1: Apply the Schema
1. Open your Supabase Dashboard: https://rawlqwjdfzicjepzmcng.supabase.co
2. Go to **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Copy the ENTIRE contents of `schema.sql` and paste it into the editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Wait for it to complete - you should see "Success. No rows returned"

## Step 2: Set Up the Auth Trigger (Manual)
Because we can't create triggers on `auth.users` directly via SQL, you need to set this up in the dashboard:

1. In Supabase Dashboard, go to **Database** → **Triggers**
2. Click **Create a new trigger**
3. Fill in these settings:
   - **Name**: `on_auth_user_created`
   - **Table**: Select `auth.users` from the dropdown
   - **Events**: Check only **INSERT**
   - **Type**: **AFTER**
   - **Orientation**: **ROW**
   - **Function to trigger**: Select `public.handle_new_user()` from dropdown
4. Click **Confirm**

## Step 3: Make Yourself Admin
After you sign up through the app, run this SQL to give yourself admin access:

```sql
UPDATE profiles SET is_admin = true WHERE email = 'jared.tucker13@gmail.com';
```

## Troubleshooting

### If you get "relation already exists" errors:
This means some tables already exist. You have two options:

**Option A: Drop and recreate (WILL DELETE DATA)**
```sql
-- Run this first to drop all tables
DROP TABLE IF EXISTS ingested_website_data CASCADE;
DROP TABLE IF EXISTS demo_local_pulse_events CASCADE;
DROP TABLE IF EXISTS demo_weekly_trend_ideas CASCADE;
DROP TABLE IF EXISTS demo_requests CASCADE;
DROP TABLE IF EXISTS demo_sessions CASCADE;
DROP TABLE IF EXISTS industries CASCADE;
DROP TABLE IF EXISTS demo_profiles CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS site_content CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS waitlist_submissions CASCADE;
DROP TABLE IF EXISTS client_config CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS local_trends CASCADE;
DROP TABLE IF EXISTS content_schedule CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;

-- Then run schema.sql again
```

**Option B: Keep existing data**
Just ignore the "already exists" errors - the `IF NOT EXISTS` clauses will skip those tables.

### If trigger creation fails:
Make sure you're creating the trigger through the Supabase Dashboard UI (Database → Triggers), not via SQL.

### If the trigger doesn't appear in the list:
It might be in the `auth` schema. Check the dropdown filter to show triggers for the `auth` schema.

## Verification

After setup, verify everything worked:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check the trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' AND trigger_name = 'on_auth_user_created';
```

You should see all your tables listed and the trigger should appear.

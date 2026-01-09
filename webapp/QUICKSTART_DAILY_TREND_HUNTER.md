# 🚀 DAILY TREND HUNTER - QUICK START GUIDE

## ✅ STATUS: Files Created, Build Fixed

All files have been created and the build is now successful!

---

## 📋 STEP-BY-STEP SETUP

### STEP 1: Run Database Migration ⭐ CRITICAL

**Option A: Copy-Paste in Supabase SQL Editor** (Easiest)

1. Go to: https://supabase.com/dashboard/project/rawlqwjdfzicjepzmcng/sql/new
2. Copy the SQL below and paste into SQL Editor
3. Click "Run" or press Cmd/Ctrl + Enter
4. Verify you see success message: "✅ Daily Trend Hunter tables created successfully!"

```sql
-- Copy everything from /app/webapp/database/migrations/005_daily_trend_hunter_tables.sql
-- Or use the direct link above to open the file and copy its contents
```

**Option B: View File Locally**

```bash
cat /app/webapp/database/migrations/005_daily_trend_hunter_tables.sql
```

Then copy the output and paste into Supabase SQL Editor.

---

### STEP 2: Restart Frontend (if needed)

```bash
sudo supervisorctl restart frontend
```

Wait 10 seconds for the service to start.

---

### STEP 3: Test Daily Trend Hunter

Visit: **http://localhost:3000/trend-hunter-demo**

1. Enter a zip code (try: `10001` for New York)
2. Click **"Hunt Trends"**
3. Wait 3-5 seconds for N8N webhook response
4. See results displayed in cards

---

## 🔍 WHAT TO VERIFY

### In Supabase:

After running the migration, check that these tables exist:

1. Go to: Database → Tables
2. Look for:
   - ✅ `trend_history`
   - ✅ `business_services`
   - ✅ `content_performance`
   - ✅ `platform_metrics`
   - ✅ `user_actions`
   - ✅ `local_trends` (should have new columns: `expires_at`, `user_id`, `zip_code`)

### On Frontend:

Visit `/trend-hunter-demo` and:
- ✅ Page loads without errors
- ✅ Zip code input accepts 5 digits
- ✅ "Hunt Trends" button is enabled when zip is valid
- ✅ Click button and see loading state
- ✅ Results display in cards after a few seconds
- ✅ Each card shows: title, description, category icon, traffic level, suggested action

---

## 🧪 TEST WITH REAL ZIP CODES

Try these:
- `10001` - New York, NY
- `90210` - Beverly Hills, CA  
- `60601` - Chicago, IL
- `33101` - Miami, FL
- `78701` - Austin, TX

---

## 📊 VERIFY DATA IN DATABASE

After testing, check Supabase:

```sql
-- Check trend_history logs
SELECT * FROM trend_history ORDER BY created_at DESC LIMIT 5;

-- Check local_trends
SELECT * FROM local_trends ORDER BY created_at DESC LIMIT 5;

-- Check user_actions
SELECT * FROM user_actions WHERE action_type = 'daily_trend_hunter_request' ORDER BY created_at DESC LIMIT 5;
```

You should see entries from your test!

---

## 🚨 TROUBLESHOOTING

### Issue: "Failed to fetch trends"
- Check N8N webhook is live: https://n8n.srv1f56042.hstgr.cloud/webhook-test/d25b2519-f339-49a2-be95-c7faafa9242a
- Verify backend logs: `tail -50 /var/log/supervisor/frontend.err.log`

### Issue: Page doesn't load
- Restart frontend: `sudo supervisorctl restart frontend`
- Check status: `sudo supervisorctl status`

### Issue: No data in database
- Verify migration ran successfully
- Check RLS policies are enabled
- Ensure `user_id` matches: `67f6536d-6521-4ac8-a6a5-9827bb35f4cc`

---

## 📁 FILES CREATED

1. **/app/webapp/database/migrations/005_daily_trend_hunter_tables.sql**
   - All database tables for auto-journaling

2. **/app/webapp/app/api/daily-trend-hunter/route.ts**
   - Backend API route with N8N integration

3. **/app/webapp/app/components/DailyTrendHunter.tsx**
   - Frontend component with UI

4. **/app/webapp/app/trend-hunter-demo/page.tsx**
   - Demo page to test the feature

5. **/app/webapp/database/DAILY_TREND_HUNTER.md**
   - Technical documentation

---

## 🎯 NEXT STEPS AFTER TESTING

Once you confirm Daily Trend Hunter works:

### Phase 1B: Enhance Features
1. Add Live Pulse (3-hour auto-refresh)
2. Build Weekly Batch (3-5 scheduled suggestions)
3. Add Business Services profile setup
4. Connect "Forge Content" button

### Phase 2: Dashboards
1. Build God Mode (`/god-mode`)
2. Build Content Command Center (`/dashboard`)
3. Enhanced navbar with role detection
4. Integrate Daily Trend Hunter into dashboard

### Phase 3: Landing Page
1. Card design improvements
2. Premium typography
3. Subtle animations
4. Glassmorphism depth

---

## ✅ SUCCESS CHECKLIST

- [ ] Database migration executed in Supabase
- [ ] All 5 new tables created
- [ ] Frontend restarted (if needed)
- [ ] Demo page loads at `/trend-hunter-demo`
- [ ] Zip code input works
- [ ] "Hunt Trends" button triggers API call
- [ ] Results display after 3-5 seconds
- [ ] Data appears in Supabase tables
- [ ] No console errors
- [ ] Ready to integrate into dashboards!

---

**You're ready to test!** 🚀

Start with Step 1 (database migration), then visit `/trend-hunter-demo` to see it in action!

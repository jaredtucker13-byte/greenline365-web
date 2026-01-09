# 🧹 SUPABASE CLEANUP & OPTIMIZATION PLAN

## 📊 CURRENT STATE ANALYSIS

**Database Stats:**
- 97 Total Tables in Production
- 18 Tables with RLS in schema.sql
- **79 Tables WITHOUT RLS policies** ⚠️ (CRITICAL SECURITY ISSUE)
- 37 Indexes defined
- 665 Total Issues (25 Security + 640 Performance)

---

## 🚨 CRITICAL FINDINGS

### 1. **MISSING RLS POLICIES** (79 tables)
The following tables in schema.sql have RLS:
✅ bookings, content_schedule, local_trends, leads, activity_log
✅ client_config, demo_profiles, demo_sessions, industries
✅ waitlist_submissions, newsletter_subscriptions, demo_requests
✅ ingested_website_data, demo_local_pulse_events
✅ demo_weekly_trend_ideas, profiles, site_content, site_settings

**79 tables in Supabase are NOT in schema.sql and likely have NO RLS!**

Tables we know exist from screenshots but missing RLS:
- agent_memories
- ai_personalities
- api_usage_tracking
- appointments
- artifacts
- audit_events
- audit_logs
- availability_overrides
- availability_rules
- blog_images
- blog_performance
- booking_logs
- brand_facts
- brand_profiles
- brand_voice_profiles
- business_directory
- business_journal
- business_metrics
- businesses
- campaign_presets
- chat_agents
- chat_histories
- chat_messages
- chat_sessions
- clients
- consumer_accounts
- content_approvals
- content_assets
- content_briefs
- content_requests
- content_templates
- conversations
- customer_records
- customers
- device_fingerprints
- districts
- document_embeddings
- entitlements
- events
- executions
- generated_content
- geography_columns (PostGIS issue)
- geometry_columns (PostGIS issue)
- global_config
- interactions
- job_queue
- knowledge_base
- learning_feedback
- And ~40 more...

### 2. **OVERLY PERMISSIVE POLICIES**
Many existing policies use `USING (true)` which allows ANYONE to access:
```sql
CREATE POLICY "Allow all for local_trends" ON local_trends
  FOR ALL USING (true);
```

This is a MAJOR security vulnerability!

### 3. **MISSING INDEXES**
Only 37 indexes exist. For 97 tables, we need:
- Foreign key indexes
- Status column indexes
- Timestamp indexes (created_at, updated_at)
- User/owner relationship indexes
- Search column indexes

---

## 🎯 CLEANUP STRATEGY

### **PHASE 1: SECURITY FIXES** (PRIORITY: CRITICAL)

#### 1.1 Enable RLS on ALL 79 Missing Tables
```sql
-- For each table without RLS:
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
```

#### 1.2 Create Proper RLS Policies Based on Table Type

**A. User-Scoped Tables** (owned by specific users)
```sql
-- Examples: user content, user settings, user data
CREATE POLICY "Users can view own data" ON [table_name]
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON [table_name]
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON [table_name]
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON [table_name]
  FOR DELETE USING (auth.uid() = user_id);
```

**B. Admin-Only Tables** (system config, admin data)
```sql
CREATE POLICY "Admins only" ON [table_name]
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );
```

**C. Public Read, Auth Write** (public content, authenticated actions)
```sql
CREATE POLICY "Public read" ON [table_name]
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write" ON [table_name]
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

**D. Service Role Only** (system tables, sensitive data)
```sql
CREATE POLICY "Service role only" ON [table_name]
  FOR ALL USING (auth.role() = 'service_role');
```

**E. Multi-Tenant Tables** (client_id based)
```sql
CREATE POLICY "Tenant isolation" ON [table_name]
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );
```

---

### **PHASE 2: PERFORMANCE OPTIMIZATION**

#### 2.1 Add Critical Indexes

**Standard Indexes for ALL Tables:**
```sql
-- Primary lookup columns
CREATE INDEX IF NOT EXISTS idx_[table]_id ON [table](id);

-- Foreign keys (CRITICAL for joins)
CREATE INDEX IF NOT EXISTS idx_[table]_user_id ON [table](user_id);
CREATE INDEX IF NOT EXISTS idx_[table]_client_id ON [table](client_id);

-- Status/filtering columns
CREATE INDEX IF NOT EXISTS idx_[table]_status ON [table](status);

-- Timestamps (for sorting/filtering)
CREATE INDEX IF NOT EXISTS idx_[table]_created_at ON [table](created_at DESC);
CREATE INDEX IF NOT EXISTS idx_[table]_updated_at ON [table](updated_at DESC);

-- Email lookups
CREATE INDEX IF NOT EXISTS idx_[table]_email ON [table](email);
```

**Composite Indexes for Common Queries:**
```sql
-- User + Status queries
CREATE INDEX IF NOT EXISTS idx_[table]_user_status 
  ON [table](user_id, status);

-- Time-range queries
CREATE INDEX IF NOT EXISTS idx_[table]_user_created 
  ON [table](user_id, created_at DESC);

-- Multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_[table]_client_status 
  ON [table](client_id, status);
```

#### 2.2 Optimize Existing Queries
- Review slow query log
- Add indexes for N+1 query patterns
- Use `EXPLAIN ANALYZE` on slow queries
- Consider materialized views for complex reports

---

### **PHASE 3: DATABASE CLEANUP**

#### 3.1 Zero-Row Table Audit
**Action Items:**
1. Query all tables: `SELECT count(*) FROM [table];`
2. Categorize zero-row tables:
   - **DELETE:** Unused/legacy tables
   - **KEEP:** Awaiting future population
   - **DOCUMENT:** Purpose unclear, needs investigation
3. Archive/delete unused tables

#### 3.2 Fix Naming Issues
- **Fix PostGIS tables:** `geography_columns`, `geometry_columns`
- **Standardize naming:** Ensure consistent snake_case + plural
- **Resolve duplicates:**
  - Clarify: clients vs customers vs consumer_accounts
  - Clarify: brand_facts vs brand_profiles vs brand_voice_profiles

#### 3.3 Add Table Descriptions
```sql
COMMENT ON TABLE [table_name] IS 'Clear description of table purpose';
```

---

### **PHASE 4: DATABASE DOCUMENTATION**

#### 4.1 Create Database Dictionary
Document for each table:
- **Purpose:** What data does it store?
- **Owner:** Which service/feature uses it?
- **Relationships:** Foreign keys and related tables
- **RLS Policy:** Security approach
- **Indexes:** Performance optimization strategy
- **Status:** Active, Deprecated, or Awaiting Data

#### 4.2 Schema Visualization
- Use Supabase Schema Visualizer (built-in)
- Export ERD (Entity Relationship Diagram)
- Document table relationships

---

## 📋 IMPLEMENTATION CHECKLIST

### **IMMEDIATE ACTIONS** (Start Now)

#### Security (CRITICAL)
- [ ] List all 97 tables from Supabase
- [ ] Identify 79 tables without RLS
- [ ] Enable RLS on ALL 79 tables
- [ ] Create appropriate policies for each table type
- [ ] Remove overly permissive `USING (true)` policies
- [ ] Add `is_super_admin` column to profiles table
- [ ] Test RLS policies with authenticated/anon users

#### Performance (HIGH)
- [ ] Check slow query logs in Supabase
- [ ] Add indexes to ALL foreign keys
- [ ] Add indexes to status columns
- [ ] Add indexes to created_at/updated_at
- [ ] Add indexes to user_id/client_id columns
- [ ] Test query performance after indexes

#### Cleanup (MEDIUM)
- [ ] Query row counts for all 97 tables
- [ ] Delete unused zero-row tables
- [ ] Document remaining zero-row tables
- [ ] Fix PostGIS configuration
- [ ] Standardize table names
- [ ] Add descriptions to ALL tables

#### Documentation (MEDIUM)
- [ ] Create database dictionary spreadsheet
- [ ] Document table relationships
- [ ] Export schema visualization
- [ ] Create RLS policy reference guide

---

## 🎯 SUCCESS CRITERIA

**Database is production-ready when:**
- ✅ 0 Security Issues (all 25 fixed)
- ✅ <50 Performance Issues (590+ fixed)
- ✅ 100% of tables have RLS enabled
- ✅ All user data is properly isolated
- ✅ Critical queries run in <100ms
- ✅ All tables are documented
- ✅ Zero-row tables cleaned up
- ✅ Can handle 1000+ concurrent users

---

## 🔧 TOOLS & RESOURCES

**Supabase Built-In Tools:**
1. **Schema Visualizer:** Database → Schema Visualizer
2. **Security Advisor:** Tools → Security Advisor
3. **Performance Monitor:** Database performance metrics
4. **SQL Editor:** For running cleanup scripts

**External Tools:**
- pgAdmin (if needed for complex queries)
- dbdiagram.io (for ERD visualization)

---

## ⏱️ ESTIMATED TIMELINE

**Phase 1 (Security):** 3-4 hours
- Enable RLS: 1 hour
- Create policies: 2-3 hours

**Phase 2 (Performance):** 2-3 hours
- Add indexes: 1-2 hours
- Query optimization: 1 hour

**Phase 3 (Cleanup):** 2-3 hours
- Zero-row audit: 1 hour
- Naming fixes: 1 hour
- Descriptions: 1 hour

**Phase 4 (Documentation):** 1-2 hours
- Database dictionary: 1 hour
- Schema docs: 1 hour

**Total:** ~8-12 hours of focused work

---

## 🚀 NEXT STEPS

1. **Run this query in Supabase SQL Editor to list ALL tables:**
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  (SELECT count(*) FROM pg_indexes WHERE tablename = t.tablename) as index_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
```

2. **Check which tables have RLS enabled:**
```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

3. **Check existing policies:**
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

**Ready to start cleanup! 🔥**

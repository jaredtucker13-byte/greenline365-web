# 📚 GreenLine365 Database Documentation

## Overview

This document provides comprehensive documentation for all tables in the GreenLine365 Supabase database.

**Last Updated:** [Date]
**Total Tables:** 97
**Database:** PostgreSQL (Supabase)
**Environment:** Production (NANO tier)

---

## Table Categories

### 1. **Core Business Tables**
- bookings
- leads
- clients
- customers
- businesses

### 2. **Content Management**
- content_schedule
- content_requests
- content_approvals
- generated_content
- content_templates

### 3. **Daily Trend Hunter**
- local_trends
- demo_local_pulse_events
- demo_weekly_trend_ideas

### 4. **User Management**
- profiles
- auth.users (Supabase managed)
- consumer_accounts

### 5. **Demo & Marketing**
- demo_profiles
- demo_sessions
- demo_requests
- waitlist_submissions
- newsletter_subscriptions

### 6. **System & Tracking**
- activity_log
- api_usage_tracking
- audit_events
- audit_logs
- job_queue

### 7. **Chat & AI**
- chat_sessions
- chat_messages
- chat_agents
- agent_memories
- ai_personalities

### 8. **Brand Management**
- brand_profiles
- brand_facts
- brand_voice_profiles

### 9. **Configuration**
- client_config
- site_content
- site_settings
- industries

---

## Detailed Table Documentation

### Core Business Tables

#### `bookings`
**Purpose:** Stores customer booking requests and appointment scheduling

**Key Columns:**
- `id` (UUID, PK): Unique booking identifier
- `email` (TEXT): Customer email
- `preferred_datetime` (TIMESTAMPTZ): Requested appointment time
- `status` (TEXT): pending, confirmed, cancelled, completed
- `source` (TEXT): Tracks which widget/form created the booking

**Relationships:**
- None (standalone table)

**RLS Policy:**
- Public insert (anyone can book)
- Service role for select/update

**Indexes:**
- `idx_bookings_email` on email
- `idx_bookings_status` on status
- `idx_bookings_created_at` on created_at

**Usage:**
- Used by: Booking widgets, demo calendar
- Populated by: Public forms, authenticated users

**Performance Notes:**
- High write volume expected
- Consider partitioning by created_at if >1M records

---

#### `leads`
**Purpose:** Lead capture from multiple sources (chat, forms, bookings)

**Key Columns:**
- `id` (UUID, PK): Unique lead identifier
- `email` (TEXT): Lead email
- `source` (TEXT): chat, form, booking, external
- `status` (TEXT): new, contacted, qualified, converted, lost
- `score` (INTEGER): Lead scoring (0-100)
- `metadata` (JSONB): Flexible data storage

**Relationships:**
- Linked to conversations via `conversation_id`

**RLS Policy:**
- User-scoped (client_id based)
- Service role full access

**Indexes:**
- `idx_leads_email` on email
- `idx_leads_status` on status
- `idx_leads_score` on score DESC
- `idx_leads_metadata_gin` (GIN index for JSONB)

**Usage:**
- Used by: Chat system, lead alerts, CRM
- Populated by: AI agents, forms, webhooks

---

### Content Management

#### `content_schedule`
**Purpose:** Scheduled social media posts and content distribution

**Key Columns:**
- `id` (UUID, PK): Unique post identifier
- `title` (TEXT): Post title/description
- `content` (TEXT): Post content/caption
- `platforms` (TEXT[]): Instagram, Facebook, etc.
- `scheduled_at` (TIMESTAMPTZ): When to publish
- `status` (TEXT): draft, scheduled, published, failed, cancelled
- `client_id` (TEXT): Multi-tenant isolation

**Relationships:**
- Belongs to client via `client_id`

**RLS Policy:**
- User-scoped (can only see own client's content)
- CRUD operations restricted to client owners

**Indexes:**
- `idx_content_schedule_status` on status
- `idx_content_schedule_scheduled_at` on scheduled_at
- `idx_content_client_status` composite

**Usage:**
- Used by: Content calendar, auto-posting system
- Populated by: Content Forge, Daily Trend Hunter

**Performance Notes:**
- Query pattern: SELECT WHERE status='scheduled' AND scheduled_at <= NOW()
- Consider background job for publishing

---

### Daily Trend Hunter

#### `local_trends`
**Purpose:** Stores real-time local events, trends, and opportunities

**Key Columns:**
- `id` (UUID, PK): Unique trend identifier
- `title` (TEXT): Trend headline
- `location` (TEXT): City/region
- `event_date` (TIMESTAMPTZ): When event occurs
- `expected_traffic` (TEXT): low, medium, high
- `category` (TEXT): sports, community, business, entertainment, weather
- `suggested_action` (TEXT): AI-generated content suggestion
- `client_id` (TEXT): Client isolation

**Relationships:**
- Belongs to client via `client_id`

**RLS Policy:**
- Public trends (client_id IS NULL) visible to all
- Private trends scoped to client

**Indexes:**
- `idx_local_trends_location` on location
- `idx_local_trends_created_at` on created_at
- `idx_trends_location_date` composite

**Usage:**
- Used by: Daily Trend Hunter dashboard, Live Pulse (3-hour alerts)
- Populated by: N8N webhook, scraping services

**Auto-Journaling:**
- All trends logged for historical analysis
- Powers "What worked" metrics

---

### User Management

#### `profiles`
**Purpose:** Extended user data linked to Supabase auth.users

**Key Columns:**
- `id` (UUID, PK, FK): References auth.users(id)
- `email` (TEXT): User email (denormalized)
- `full_name` (TEXT): Display name
- `is_admin` (BOOLEAN): Admin access flag
- `is_super_admin` (BOOLEAN): God mode access
- `client_id` (TEXT): Multi-tenant association

**Relationships:**
- One-to-one with auth.users
- Has many: content, bookings, activity_log

**RLS Policy:**
- Users can view/update own profile
- Admins can view all profiles

**Indexes:**
- `idx_profiles_email` on email
- `idx_profiles_is_admin` partial index
- `idx_profiles_is_super_admin` partial index

**Usage:**
- Used by: Authentication, authorization, user settings
- Populated by: Sign-up flow, admin tools

---

### System & Tracking

#### `activity_log`
**Purpose:** Auto-journaling for all user actions (audit trail)

**Key Columns:**
- `id` (UUID, PK): Unique log entry
- `action` (TEXT): Action type (e.g., "content_created", "lead_converted")
- `details` (JSONB): Flexible event data
- `user_id` (TEXT): Actor
- `created_at` (TIMESTAMPTZ): Timestamp

**Relationships:**
- References profiles via `user_id`

**RLS Policy:**
- Read-only for users (own actions)
- Service role can insert

**Indexes:**
- `idx_activity_log_action` on action
- `idx_activity_log_created_at` on created_at DESC
- `idx_activity_user_action` composite

**Usage:**
- Used by: Audit trails, analytics, "What worked" metrics
- Populated by: Application events, webhooks

**Auto-Journaling:**
- Core table for metrics like "87% of users automate within 30 days"
- Powers platform_metrics calculations

**Performance Notes:**
- High write volume
- Consider partitioning by month
- Archive old logs after 1 year

---

## Multi-Tenancy Architecture

### Client Isolation Strategy

Most tables use `client_id` for multi-tenant isolation:

```sql
CREATE POLICY "Tenant isolation" ON [table_name]
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );
```

**Tables with client_id:**
- content_schedule
- local_trends
- leads
- brand_profiles
- customers

### User Ownership

Some tables use `user_id` for individual ownership:

```sql
CREATE POLICY "Users can view own data" ON [table_name]
  FOR SELECT USING (user_id = auth.uid());
```

**Tables with user_id:**
- activity_log
- chat_sessions
- appointments
- agent_memories

---

## Performance Optimization

### Index Strategy

**Standard indexes for ALL tables:**
1. Primary key (automatic)
2. Foreign keys
3. Status columns
4. Timestamp columns (created_at, updated_at)
5. Lookup columns (email, phone)

**Composite indexes for common queries:**
- (user_id, status)
- (client_id, created_at)
- (status, scheduled_at)

**Partial indexes for filtered queries:**
```sql
CREATE INDEX idx_bookings_active 
  ON bookings(preferred_datetime) 
  WHERE status IN ('pending', 'confirmed');
```

### Query Patterns

**Hot queries (optimize these first):**
1. User dashboard: `SELECT * FROM content_schedule WHERE client_id = ? AND status = 'scheduled'`
2. Trend lookup: `SELECT * FROM local_trends WHERE location = ? AND event_date >= NOW()`
3. Lead pipeline: `SELECT * FROM leads WHERE status IN ('new', 'contacted') ORDER BY score DESC`

---

## Security Model

### RLS Policy Types

1. **Public Read, Auth Write**
   - demo_profiles, industries
   
2. **User-Scoped**
   - profiles, activity_log, chat_sessions
   
3. **Client-Scoped (Multi-Tenant)**
   - content_schedule, local_trends, customers
   
4. **Admin Only**
   - site_settings, client_config (write)
   
5. **Service Role Only**
   - ingested_website_data, job_queue

### Super Admin Access

Super admins (`is_super_admin = true`) have:
- God Mode dashboard access
- Full CMS control
- All table visibility
- Platform metrics access

---

## Data Flow Diagrams

### Daily Trend Hunter Flow

```
[N8N Webhook] → [local_trends] → [Content Forge] → [content_schedule] → [Social Platforms]
                      ↓
                [activity_log] → [platform_metrics]
```

### Lead Capture Flow

```
[Chat Widget] → [chat_messages] → [AI Agent] → [leads] → [Lead Alerts]
                                                    ↓
                                              [activity_log]
```

### Content Publishing Flow

```
[Content Forge] → [content_schedule] → [Background Job] → [Social APIs]
                                              ↓
                                    [content_performance] → [platform_metrics]
```

---

## Maintenance Guidelines

### Daily
- Monitor slow query log
- Check failed jobs in job_queue
- Verify content publishing success rate

### Weekly
- Run VACUUM ANALYZE on high-traffic tables
- Review zero-row tables
- Check index usage stats

### Monthly
- Archive old activity_log entries (>90 days)
- Review and update RLS policies
- Performance audit with EXPLAIN ANALYZE

### Quarterly
- Full database cleanup
- Schema optimization review
- Update this documentation

---

## Migration History

1. **001_fix_rls_policies.sql** - Fixed overly permissive RLS policies
2. **002_add_performance_indexes.sql** - Added indexes for 1000+ users
3. **003_enable_rls_missing_tables.sql** - Enabled RLS on 79 missing tables
4. **004_cleanup_zero_row_tables.sql** - Zero-row table analysis and cleanup

---

## Quick Reference

### Get all tables
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

### Check RLS status
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

### View policies
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
```

### Check indexes
```sql
SELECT * FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;
```

### Table sizes
```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;
```

---

## Contact & Support

**Database Admin:** Jared Tucker (jared.tucker13@gmail.com)
**Last Audit:** [Date]
**Next Review:** [Date + 3 months]

---

**Note:** This is a living document. Update as schema evolves!
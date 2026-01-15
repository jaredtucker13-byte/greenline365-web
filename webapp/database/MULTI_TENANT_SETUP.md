# Multi-Tenant Architecture Setup Guide

## Overview
This guide walks you through setting up the multi-tenant architecture for GreenLine365, enabling you to manage multiple business tenants (like ArtfulPhusion) with proper data isolation and feature gating.

---

## Phase 1: Database Foundation ✅

### Step 1: Run the Migration
1. Open your **Supabase SQL Editor**
2. Copy the contents of `/database/migrations/007_multi_tenant_architecture.sql`
3. **IMPORTANT**: Before running, you need to find your user ID

### Step 2: Find Your User ID
Run this query in Supabase SQL Editor:
```sql
SELECT id, email FROM auth.users WHERE email = 'your@email.com';
```
Copy the `id` value (it looks like: `12345678-1234-1234-1234-123456789abc`)

### Step 3: Update the Migration
In the migration file, find this section near the bottom:
```sql
/*
-- Uncomment and run after replacing YOUR_USER_ID:

INSERT INTO user_businesses (user_id, business_id, role, is_primary) VALUES
  ('YOUR_USER_ID', 'a0000000-0000-0000-0000-000000000001', 'owner', true),
  ('YOUR_USER_ID', 'a0000000-0000-0000-0000-000000000002', 'owner', false);
...
*/
```

**Replace `YOUR_USER_ID`** with your actual ID from Step 2, then **uncomment** the entire block.

### Step 4: Run the Complete Migration
Execute the full migration script in Supabase SQL Editor.

### What This Creates:
✅ `businesses` table - stores tenant information (GreenLine365, ArtfulPhusion, etc.)  
✅ `user_businesses` table - links users to businesses (many-to-many)  
✅ `memory_identity_chunks` table - Layer 1 (Brand Voice)  
✅ `memory_knowledge_chunks` table - Layer 2 (Knowledge Base)  
✅ RLS policies for data isolation  
✅ Helper functions for tenant context  
✅ Two seed businesses:
  - **GreenLine365** (Tier 3 - Full Access)
  - **ArtfulPhusion** (Tier 2 - Testing tenant)

---

## Tier Structure

### Tier 1 ($299/month)
**Features:**
- ✅ Content Forge
- ✅ Mockup Generators
- ✅ Social Media Posting
- 🔒 Everything else locked

### Tier 2 ($599/month) - YOUR TESTING TIER
**Features:**
- ✅ All Tier 1 features
- ✅ CRM
- ✅ Analytics
- ✅ Knowledge Base
- ✅ Blog
- 🔒 Email, SMS, Bookings, AI Receptionist, Calendar locked

### Tier 3 ($999/month)
**Features:**
- ✅ All features unlocked
- ✅ Email campaigns
- ✅ SMS
- ✅ Bookings
- ✅ AI Receptionist
- ✅ Calendar

**Multi-location pricing:** 30% discount per additional location

---

## Verification

After running the migration, verify everything is set up:

```sql
-- Check businesses were created
SELECT id, name, slug, tier FROM businesses;

-- Check your user is linked to both businesses
SELECT 
  ub.role, 
  ub.is_primary,
  b.name as business_name,
  b.tier
FROM user_businesses ub
JOIN businesses b ON b.id = ub.business_id
WHERE ub.user_id = 'YOUR_USER_ID';

-- Check feature access for ArtfulPhusion
SELECT get_business_features('a0000000-0000-0000-0000-000000000002');
```

Expected results:
- 2 businesses (GreenLine365, ArtfulPhusion)
- You're an owner of both
- GreenLine365 is your primary business
- ArtfulPhusion shows tier2 features

---

## Next Steps

Once Phase 1 is complete and verified:
- ✅ **Phase 2**: Backend Infrastructure (APIs & middleware)
- ✅ **Phase 3**: Frontend Tenant Switcher
- ✅ **Phase 4**: Feature Gating
- ✅ **Phase 5**: Testing & Refinement

---

## Troubleshooting

**Issue**: RLS policies blocking queries  
**Solution**: Ensure you're logged in with the correct user account in Supabase

**Issue**: Can't see businesses  
**Solution**: Check that `user_businesses` has entries linking your user ID to the businesses

**Issue**: Existing data not showing up  
**Solution**: Run the UPDATE queries at the bottom of the migration to assign existing data to GreenLine365

---

## Database Schema Reference

### Key Tables:
- `businesses` - Tenant information
- `user_businesses` - User ↔ Business membership
- `memory_identity_chunks` - Brand Voice (Layer 1)
- `memory_knowledge_chunks` - Knowledge Base (Layer 2)

### Key Functions:
- `get_user_active_business(user_id)` - Get user's active business
- `user_has_business_access(user_id, business_id)` - Check access
- `get_business_features(business_id)` - Get tier-based features

---

**Ready for Phase 2?** Let the agent know once you've successfully run the migration! 🚀

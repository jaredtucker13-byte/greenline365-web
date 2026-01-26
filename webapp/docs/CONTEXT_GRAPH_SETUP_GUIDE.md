# CONTEXT GRAPH IMPLEMENTATION - COMPLETE SETUP GUIDE

## 🎯 What This Does

Your AI agents will now have **intelligent memory** that:
- ✅ Remembers customer preferences across calls
- ✅ Recalls past issues and solutions
- ✅ Connects related information automatically
- ✅ Uses semantic search (understands meaning, not just keywords)
- ✅ Builds a knowledge graph of customer relationships

---

## STEP 1: RUN THE DATABASE MIGRATION

**File:** `/app/webapp/database/migrations/020_context_graph_system.sql`

1. Go to Supabase SQL Editor
2. Copy the entire migration file
3. Click **Run**
4. Watch for success message: "Context Graph System Installed!"

**What this creates:**
- `context_nodes` table - Stores content with vector embeddings
- `context_edges` table - Stores relationships between nodes
- `match_context_nodes()` function - For semantic search
- Indexes optimized for vector similarity search

---

## STEP 2: VERIFY INSTALLATION

Run this in Supabase SQL Editor:

```sql
-- Check if pgvector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('context_nodes', 'context_edges');

-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'match_context_nodes';
```

**Expected Results:**
- pgvector extension: 1 row
- Tables: 2 rows (context_nodes, context_edges)
- Function: 1 row (match_context_nodes)

---

## STEP 3: DEPLOY TO VERCEL

The new API endpoints are already created:
- `/app/webapp/app/api/embeddings/generate/route.ts` - Generate embeddings
- `/app/webapp/app/api/embeddings/search/route.ts` - Semantic search
- `/app/webapp/app/api/embeddings/relate/route.ts` - Create relationships

**Push to Vercel:**
Your code is already committed. Vercel will auto-deploy, or you can manually redeploy in Vercel dashboard.

---

## STEP 4: HOW IT WORKS

### When a Call Comes In:

1. **Customer calls:** "My outlets are sparking!"
2. **AI calls `get_memory`** with customer_phone
3. **System searches:**
   - Traditional table lookup (agent_memory)
   - Vector search (context_nodes) for semantic matches
   - Graph traversal to find related information
4. **AI receives context:**
   ```json
   {
     "customer_name": "John Smith",
     "memories": [...],
     "context_graph": [
       {
         "content": "Customer had breaker issue 3 months ago at same address",
         "similarity": 0.89,
         "relationships": ["related_to: previous_call"]
       }
     ],
     "graph_insights": "Previous electrical work at this location..."
   }
   ```
5. **AI uses this context:**
   "I see you called about a breaker issue back in October. Is this in the same area?"

### When Lead is Captured:

1. **AI calls `capture_lead`** with customer info
2. **System automatically:**
   - Stores in `call_logs` table
   - Generates embedding for the call
   - Creates `context_node` with vector
   - Links to customer profile node
   - Sends priority-based SMS

---

## STEP 5: EXAMPLE USE CASES

### Use Case 1: Repeat Customer Recognition
```
Call 1 (January): "Fix my kitchen outlet"
Call 2 (March): "Another outlet issue"

AI on Call 2: "I see you had an outlet issue in your kitchen back in January. Is this the same circuit, or a different area?"
```

### Use Case 2: Pattern Detection
```
Multiple calls from same zip code about "breaker trips"

AI insight: "We've had 3 calls from the 33601 area about breaker issues this month. Might be a grid problem."
```

### Use Case 3: Solution Recall
```
Previous call: "Installed surge protector, fixed spark issue"
New call: "Sparks again"

AI: "I see we installed a surge protector last time you had sparks. Is that surge protector still working, or is this a new circuit?"
```

---

## STEP 6: MONITORING & ANALYTICS

### Query to See Context Graph Activity

```sql
-- See most accessed context nodes
SELECT 
  content,
  node_type,
  access_count,
  last_accessed_at
FROM context_nodes
ORDER BY access_count DESC
LIMIT 20;

-- See relationship patterns
SELECT 
  relationship_type,
  COUNT(*) as count
FROM context_edges
GROUP BY relationship_type
ORDER BY count DESC;

-- See customer memory graph
SELECT 
  cn1.content as source_content,
  ce.relationship_type,
  cn2.content as target_content
FROM context_edges ce
JOIN context_nodes cn1 ON ce.source_node_id = cn1.id
JOIN context_nodes cn2 ON ce.target_node_id = cn2.id
WHERE cn1.customer_phone = '+15188799207'
ORDER BY ce.created_at DESC;
```

---

## STEP 7: HOW TO USE IN YOUR DEMO

### Update Your System Prompt

Add this to the SIMULATION phase:

```
BEFORE responding, if customer provides their phone number, call get_memory to check for:
- Previous calls about electrical issues
- Past service history
- Known preferences

If memories exist, acknowledge them naturally:
"I see you called us back in [month] about [issue]. Is this related, or a completely new problem?"

This shows prospects that the AI has TRUE memory, not just note-taking.
```

---

## ADVANCED: GRAPH RELATIONSHIPS

The system automatically creates these relationship types:

| Relationship | Example |
|--------------|---------|
| `customer_of` | John Smith → Bright Spark Electric |
| `related_to` | Kitchen outlet issue → Previous breaker problem |
| `solved_by` | Sparking outlet → Surge protector installation |
| `mentioned_in` | Customer preference → Morning appointments only |
| `caused_by` | Circuit overload → Too many appliances |

---

## TESTING THE CONTEXT GRAPH

### Test 1: Create a Customer Memory

```bash
curl -X POST https://www.greenline365.com/api/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "John Smith prefers morning appointments and has a recurring breaker issue in the kitchen",
    "node_type": "customer_preference",
    "customer_phone": "+15551234567"
  }'
```

### Test 2: Search for Context

```bash
curl -X POST https://www.greenline365.com/api/embeddings/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "electrical problems in kitchen",
    "customer_phone": "+15551234567",
    "match_threshold": 0.7,
    "match_count": 5
  }'
```

### Test 3: Make a Call and Check Memory

1. Call your Retell agent
2. Give phone number: +15551234567
3. AI should say: "I see you had a kitchen breaker issue before. Is this related?"

---

## WHAT YOU'VE BUILT

**Before Context Graph:**
- AI: Generic responses
- No memory between calls
- Every customer feels like first-time caller

**After Context Graph:**
- AI: "I remember you. Last time was X..."
- Connections between issues, solutions, preferences
- Customers feel known and valued
- More professional, human-like service

---

## NEXT STEPS

1. ✅ Run migration 020 in Supabase
2. ✅ Redeploy to Vercel (auto-happens)
3. ✅ Test with a simulated repeat customer
4. ✅ Update your demo prompt to use get_memory
5. ✅ Show prospects the "memory" feature in demos

---

## ROI FOR YOUR CLIENTS

**New Pitch Addition:**

"Not only does the AI answer 24/7, but it REMEMBERS your customers. If someone calls twice, it knows their history. If there's a pattern of issues at an address, it flags it. This isn't just answering—it's relationship building."

**Demo Script:**
"Watch this—I'm going to call back as the same customer from earlier. See how it remembers me..."

---

Ready to deploy! Run migration 020 and let me know when it's done.

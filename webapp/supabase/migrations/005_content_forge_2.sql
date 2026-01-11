-- GreenLine365 Content Forge 2.0: Temporal Content Architecture
-- From 15 years in the future

-- =====================================================
-- CONTENT BLUEPRINTS (Format Templates on Steroids)
-- These aren't templates - they're living content DNA
-- =====================================================
CREATE TABLE content_blueprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identity
  blueprint_code TEXT UNIQUE NOT NULL,
  blueprint_name TEXT NOT NULL,
  blueprint_icon TEXT,                    -- Emoji or icon code
  
  -- Classification
  category TEXT NOT NULL,                 -- 'authority', 'conversion', 'viral', 'seo', 'trust'
  difficulty_level TEXT DEFAULT 'standard', -- 'quick', 'standard', 'deep'
  estimated_time_minutes INTEGER,
  
  -- The DNA Structure
  structure JSONB NOT NULL,               -- Section-by-section blueprint
  
  -- Psychological Framework
  emotional_arc TEXT,                     -- 'problem-agitate-solve', 'hero-journey', 'before-after'
  persuasion_triggers TEXT[],             -- ['social_proof', 'scarcity', 'authority', 'reciprocity']
  
  -- AI Generation Prompts (per section)
  ai_prompts JSONB,                       -- Prompts for each section
  
  -- Prediction Metrics
  avg_engagement_score DECIMAL,
  avg_time_on_page_seconds INTEGER,
  avg_conversion_rate DECIMAL,
  
  -- SEO Intelligence
  ideal_word_count_min INTEGER,
  ideal_word_count_max INTEGER,
  recommended_headers INTEGER,
  recommended_images INTEGER,
  
  -- Multi-Format Output
  outputs_to TEXT[],                      -- ['blog', 'twitter_thread', 'linkedin', 'email', 'video_script']
  
  -- Metadata
  use_count INTEGER DEFAULT 0,
  success_rate DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTENT PILLARS (Tenant's Content Universe)
-- =====================================================
CREATE TABLE content_pillars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  
  -- Pillar Identity
  pillar_name TEXT NOT NULL,
  pillar_description TEXT,
  pillar_icon TEXT,
  color_code TEXT,                        -- For UI visualization
  
  -- Content Strategy
  target_audience TEXT,
  pain_points TEXT[],
  desired_outcomes TEXT[],
  
  -- Keywords & SEO
  primary_keywords TEXT[],
  secondary_keywords TEXT[],
  competitor_gaps TEXT[],                 -- Topics competitors miss
  
  -- Content Mix
  recommended_blueprints TEXT[],          -- Which formats work best for this pillar
  posting_frequency TEXT,                 -- 'weekly', 'biweekly', 'monthly'
  
  -- Performance
  total_posts INTEGER DEFAULT 0,
  avg_engagement DECIMAL,
  top_performing_post_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTENT CALENDAR (The Temporal Grid)
-- =====================================================
CREATE TABLE content_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  publish_status TEXT DEFAULT 'planned',  -- 'planned', 'drafted', 'reviewing', 'scheduled', 'published'
  
  -- Content Link
  pillar_id UUID REFERENCES content_pillars(id),
  blueprint_id UUID REFERENCES content_blueprints(id),
  
  -- Content Details
  working_title TEXT,
  final_title TEXT,
  target_keyword TEXT,
  
  -- AI-Generated Preview
  hook_preview TEXT,                      -- First 2 sentences
  outline JSONB,                          -- Section breakdown
  
  -- Predictions (from the future!)
  predicted_engagement_score DECIMAL,
  predicted_ranking_position INTEGER,
  predicted_traffic INTEGER,
  confidence_level DECIMAL,               -- How confident the AI is
  
  -- Multi-Platform
  platforms TEXT[],                       -- Where this will be published
  platform_variants JSONB,                -- Different versions per platform
  
  -- CTA Strategy
  primary_cta TEXT,
  cta_type TEXT,                          -- 'book', 'download', 'subscribe', 'buy', 'share'
  
  -- Temporal Metadata
  content_type TEXT,                      -- 'evergreen', 'timely', 'seasonal', 'trending'
  relevance_window TEXT,                  -- 'forever', '1_week', '1_month', 'seasonal'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTENT PIECES (The Actual Content)
-- =====================================================
CREATE TABLE content_pieces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  calendar_id UUID REFERENCES content_calendar(id),
  
  -- Content
  title TEXT NOT NULL,
  subtitle TEXT,
  content_body JSONB,                     -- Structured content blocks
  raw_markdown TEXT,
  
  -- Media
  featured_image_url TEXT,
  images JSONB,                           -- All images with alt text
  videos JSONB,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  slug TEXT,
  keywords TEXT[],
  
  -- Quality Scores (Blog Scorer)
  overall_score DECIMAL,
  hook_score DECIMAL,                     -- First impression
  structure_score DECIMAL,                -- Scannability
  value_score DECIMAL,                    -- Actual usefulness
  cta_score DECIMAL,                      -- Clear next step
  seo_score DECIMAL,
  readability_score DECIMAL,
  
  -- A/B Headlines
  headline_variants JSONB,                -- Multiple headline options with predictions
  winning_headline TEXT,
  
  -- Repurposed Versions
  twitter_thread TEXT,
  linkedin_post TEXT,
  instagram_caption TEXT,
  email_version TEXT,
  video_script TEXT,
  
  -- Performance (actual results)
  views INTEGER DEFAULT 0,
  avg_time_on_page INTEGER,
  scroll_depth_avg DECIMAL,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INSERT FUTURISTIC CONTENT BLUEPRINTS
-- =====================================================

-- 1. THE PROBLEM CRUSHER (How-To Guide 2.0)
INSERT INTO content_blueprints (
  blueprint_code, blueprint_name, blueprint_icon, category, difficulty_level,
  estimated_time_minutes, emotional_arc, persuasion_triggers,
  ideal_word_count_min, ideal_word_count_max, recommended_headers, recommended_images,
  outputs_to, structure, ai_prompts
) VALUES (
  'problem_crusher',
  'The Problem Crusher',
  '⚡',
  'authority',
  'standard',
  45,
  'problem-agitate-solve',
  ARRAY['authority', 'social_proof', 'reciprocity'],
  1200, 2000, 5, 3,
  ARRAY['blog', 'twitter_thread', 'linkedin', 'email'],
  '{
    "sections": [
      {"id": "hook", "name": "The Hook", "purpose": "Stop the scroll. Name their pain.", "word_count": 50, "required": true},
      {"id": "agitate", "name": "The Agitation", "purpose": "Make the problem feel urgent and real.", "word_count": 150, "required": true},
      {"id": "promise", "name": "The Promise", "purpose": "Tell them exactly what they will learn/gain.", "word_count": 75, "required": true},
      {"id": "steps", "name": "The Steps", "purpose": "Numbered, actionable steps. Each with a mini-result.", "word_count": 800, "required": true},
      {"id": "proof", "name": "The Proof", "purpose": "Show someone who did this and won.", "word_count": 200, "required": false},
      {"id": "cta", "name": "The Next Move", "purpose": "Tell them exactly what to do now.", "word_count": 75, "required": true}
    ]
  }',
  '{
    "hook": "Write a punchy 2-sentence opening that names a specific pain point the reader has. Make them feel seen. No fluff.",
    "agitate": "Expand on why this problem is costing them time, money, or sanity. Use second person (you). Be specific.",
    "promise": "Tell them exactly what they will walk away with. Be specific about the outcome.",
    "steps": "Write 5-7 clear, actionable steps. Each step should have: a clear action, why it matters, and a mini-win they will feel.",
    "proof": "Share a brief story of someone who used these steps and got results. Include specific numbers if possible.",
    "cta": "End with ONE clear action they should take right now. Make it easy and obvious."
  }'
);

-- 2. THE AUTHORITY STACK (List Post 2.0)
INSERT INTO content_blueprints (
  blueprint_code, blueprint_name, blueprint_icon, category, difficulty_level,
  estimated_time_minutes, emotional_arc, persuasion_triggers,
  ideal_word_count_min, ideal_word_count_max, recommended_headers, recommended_images,
  outputs_to, structure, ai_prompts
) VALUES (
  'authority_stack',
  'The Authority Stack',
  '📚',
  'seo',
  'quick',
  30,
  'value-dump',
  ARRAY['authority', 'curiosity', 'specificity'],
  800, 1500, 7, 5,
  ARRAY['blog', 'twitter_thread', 'instagram_carousel', 'pinterest'],
  '{
    "sections": [
      {"id": "hook", "name": "Pattern Interrupt", "purpose": "Challenge a common belief or promise insider knowledge.", "word_count": 50, "required": true},
      {"id": "context", "name": "Why This Matters Now", "purpose": "Create urgency. Why should they care TODAY?", "word_count": 100, "required": true},
      {"id": "list", "name": "The Stack", "purpose": "Numbered items. Each one specific, actionable, memorable.", "word_count": 600, "required": true},
      {"id": "bonus", "name": "The Bonus Insight", "purpose": "One unexpected tip that shows deep expertise.", "word_count": 100, "required": false},
      {"id": "cta", "name": "The Challenge", "purpose": "Challenge them to implement ONE item this week.", "word_count": 50, "required": true}
    ]
  }',
  '{
    "hook": "Start with a surprising statement or contrarian take. Make them stop scrolling.",
    "context": "Explain why this list matters right now. Connect it to a current pain or trend.",
    "list": "Write [NUMBER] items. Each should be: specific (not generic), actionable (they can do it), and have a clear benefit.",
    "bonus": "Add one unexpected tip that shows you really know this topic deeply.",
    "cta": "Challenge them to pick ONE item and implement it this week. Make it feel achievable."
  }'
);

-- 3. THE TRANSFORMATION PROOF (Case Study 2.0)
INSERT INTO content_blueprints (
  blueprint_code, blueprint_name, blueprint_icon, category, difficulty_level,
  estimated_time_minutes, emotional_arc, persuasion_triggers,
  ideal_word_count_min, ideal_word_count_max, recommended_headers, recommended_images,
  outputs_to, structure, ai_prompts
) VALUES (
  'transformation_proof',
  'The Transformation Proof',
  '🔄',
  'trust',
  'deep',
  60,
  'hero-journey',
  ARRAY['social_proof', 'storytelling', 'specificity', 'transformation'],
  1500, 2500, 6, 4,
  ARRAY['blog', 'linkedin', 'email', 'video_script', 'sales_page'],
  '{
    "sections": [
      {"id": "before", "name": "The Before State", "purpose": "Paint a vivid picture of the struggle. Make readers see themselves.", "word_count": 200, "required": true},
      {"id": "breaking_point", "name": "The Breaking Point", "purpose": "The moment they knew something had to change.", "word_count": 150, "required": true},
      {"id": "discovery", "name": "The Discovery", "purpose": "How they found the solution (your product/service).", "word_count": 150, "required": true},
      {"id": "journey", "name": "The Journey", "purpose": "What they did, step by step. Include obstacles overcome.", "word_count": 400, "required": true},
      {"id": "after", "name": "The After State", "purpose": "Specific results. Numbers, feelings, lifestyle changes.", "word_count": 200, "required": true},
      {"id": "lesson", "name": "The Lesson", "purpose": "What the reader can learn from this story.", "word_count": 150, "required": true},
      {"id": "cta", "name": "Your Turn", "purpose": "Invite them to start their own transformation.", "word_count": 100, "required": true}
    ]
  }',
  '{
    "before": "Describe the person/business BEFORE the transformation. Be specific about struggles, frustrations, and what wasn'\''t working.",
    "breaking_point": "What was the final straw? The moment they decided enough was enough?",
    "discovery": "How did they find the solution? Make it feel relatable and organic.",
    "journey": "Walk through the process. Include at least one obstacle they overcame.",
    "after": "Describe the results with SPECIFIC numbers and outcomes. Before: X, After: Y.",
    "lesson": "What'\''s the one takeaway readers should remember from this story?",
    "cta": "Invite them to start their own transformation. Make it feel possible."
  }'
);

-- 4. THE BATTLE ROYALE (Comparison 2.0)
INSERT INTO content_blueprints (
  blueprint_code, blueprint_name, blueprint_icon, category, difficulty_level,
  estimated_time_minutes, emotional_arc, persuasion_triggers,
  ideal_word_count_min, ideal_word_count_max, recommended_headers, recommended_images,
  outputs_to, structure, ai_prompts
) VALUES (
  'battle_royale',
  'The Battle Royale',
  '⚔️',
  'conversion',
  'standard',
  45,
  'decision-guide',
  ARRAY['authority', 'specificity', 'reduction_of_risk'],
  1000, 1800, 6, 2,
  ARRAY['blog', 'youtube_script', 'email'],
  '{
    "sections": [
      {"id": "hook", "name": "The Dilemma", "purpose": "Name the decision they are struggling with.", "word_count": 75, "required": true},
      {"id": "criteria", "name": "How to Decide", "purpose": "Give them a framework for making this choice.", "word_count": 150, "required": true},
      {"id": "breakdown", "name": "The Breakdown", "purpose": "Compare each option across the criteria. Be fair but clear.", "word_count": 600, "required": true},
      {"id": "verdict", "name": "The Verdict", "purpose": "State your recommendation clearly. Own your opinion.", "word_count": 150, "required": true},
      {"id": "scenarios", "name": "Choose This If...", "purpose": "Help different reader types pick the right option for them.", "word_count": 200, "required": true},
      {"id": "cta", "name": "Make Your Move", "purpose": "Clear action step to move forward.", "word_count": 75, "required": true}
    ]
  }',
  '{
    "hook": "Name the exact decision your reader is stuck on. Show you understand their dilemma.",
    "criteria": "List 3-5 factors that matter when making this decision. Explain why each matters.",
    "breakdown": "Compare the options honestly. Use a consistent structure for each.",
    "verdict": "State your recommendation clearly. Don'\''t be wishy-washy.",
    "scenarios": "Help readers self-select: '\''Choose X if you... Choose Y if you...'\''",
    "cta": "Give them a clear next step to act on their decision."
  }'
);

-- 5. THE TRUTH BOMB (Opinion/Rant 2.0)
INSERT INTO content_blueprints (
  blueprint_code, blueprint_name, blueprint_icon, category, difficulty_level,
  estimated_time_minutes, emotional_arc, persuasion_triggers,
  ideal_word_count_min, ideal_word_count_max, recommended_headers, recommended_images,
  outputs_to, structure, ai_prompts
) VALUES (
  'truth_bomb',
  'The Truth Bomb',
  '💣',
  'viral',
  'quick',
  25,
  'contrarian-reveal',
  ARRAY['controversy', 'authority', 'authenticity', 'pattern_interrupt'],
  600, 1200, 4, 1,
  ARRAY['blog', 'twitter_thread', 'linkedin', 'tiktok_script'],
  '{
    "sections": [
      {"id": "bomb", "name": "The Bomb", "purpose": "Drop the contrarian statement. Be bold.", "word_count": 50, "required": true},
      {"id": "why_wrong", "name": "Why Everyone Else Is Wrong", "purpose": "Explain the common belief and why it'\''s broken.", "word_count": 200, "required": true},
      {"id": "receipts", "name": "The Receipts", "purpose": "Back up your claim with evidence or experience.", "word_count": 250, "required": true},
      {"id": "real_truth", "name": "The Real Truth", "purpose": "Share what people SHOULD believe/do instead.", "word_count": 200, "required": true},
      {"id": "cta", "name": "The Wake-Up Call", "purpose": "Challenge them to think differently or take action.", "word_count": 50, "required": true}
    ]
  }',
  '{
    "bomb": "Start with a bold, contrarian statement that challenges common wisdom. Make people react.",
    "why_wrong": "Explain the popular belief and systematically show why it'\''s flawed or outdated.",
    "receipts": "Back up your claim with specific evidence, data, or personal experience. Show your credibility.",
    "real_truth": "Share what you believe is the actual truth. Be specific and actionable.",
    "cta": "End with a challenge or wake-up call. Make them choose a side."
  }'
);

-- 6. THE ANSWER VAULT (FAQ Roundup 2.0)
INSERT INTO content_blueprints (
  blueprint_code, blueprint_name, blueprint_icon, category, difficulty_level,
  estimated_time_minutes, emotional_arc, persuasion_triggers,
  ideal_word_count_min, ideal_word_count_max, recommended_headers, recommended_images,
  outputs_to, structure, ai_prompts
) VALUES (
  'answer_vault',
  'The Answer Vault',
  '🗄️',
  'seo',
  'deep',
  60,
  'comprehensive-resource',
  ARRAY['authority', 'convenience', 'thoroughness'],
  2000, 4000, 15, 3,
  ARRAY['blog', 'help_center', 'chatbot_training'],
  '{
    "sections": [
      {"id": "intro", "name": "The Promise", "purpose": "Tell them this post will answer everything they need to know.", "word_count": 100, "required": true},
      {"id": "toc", "name": "Quick Navigation", "purpose": "Clickable table of contents so they can jump to their question.", "word_count": 50, "required": true},
      {"id": "questions", "name": "The Questions", "purpose": "10-20 real questions with thorough, helpful answers.", "word_count": 1500, "required": true},
      {"id": "bonus", "name": "Questions You Didn'\''t Know to Ask", "purpose": "2-3 advanced questions that show expertise.", "word_count": 300, "required": false},
      {"id": "cta", "name": "Still Have Questions?", "purpose": "Invite them to reach out for personalized help.", "word_count": 75, "required": true}
    ]
  }',
  '{
    "intro": "Promise the reader that this is the definitive resource. Tell them they won'\''t need to look anywhere else.",
    "toc": "Create a clickable list of all questions so readers can jump to what they need.",
    "questions": "Answer 10-20 real questions your audience asks. Each answer should be complete but concise.",
    "bonus": "Add 2-3 questions that only an expert would think to ask. Show your depth.",
    "cta": "Invite readers to reach out if they have questions not covered here."
  }'
);

-- 7. THE DEEP DIVE (Explainer 2.0)
INSERT INTO content_blueprints (
  blueprint_code, blueprint_name, blueprint_icon, category, difficulty_level,
  estimated_time_minutes, emotional_arc, persuasion_triggers,
  ideal_word_count_min, ideal_word_count_max, recommended_headers, recommended_images,
  outputs_to, structure, ai_prompts
) VALUES (
  'deep_dive',
  'The Deep Dive',
  '🔬',
  'authority',
  'deep',
  90,
  'comprehensive-mastery',
  ARRAY['authority', 'thoroughness', 'expertise'],
  2500, 5000, 8, 5,
  ARRAY['blog', 'ebook_chapter', 'course_module', 'whitepaper'],
  '{
    "sections": [
      {"id": "hook", "name": "Why This Matters", "purpose": "Explain why understanding this topic is crucial.", "word_count": 150, "required": true},
      {"id": "basics", "name": "The Fundamentals", "purpose": "Explain the basics so everyone is on the same page.", "word_count": 400, "required": true},
      {"id": "deep", "name": "Going Deeper", "purpose": "Advanced concepts, nuances, and insider knowledge.", "word_count": 800, "required": true},
      {"id": "examples", "name": "Real-World Examples", "purpose": "Show this in action with specific examples.", "word_count": 400, "required": true},
      {"id": "mistakes", "name": "Common Mistakes", "purpose": "What most people get wrong and how to avoid it.", "word_count": 300, "required": true},
      {"id": "advanced", "name": "Advanced Tactics", "purpose": "For readers who want to go even further.", "word_count": 400, "required": false},
      {"id": "resources", "name": "Resources & Next Steps", "purpose": "Tools, links, and recommended next actions.", "word_count": 150, "required": true},
      {"id": "cta", "name": "Put This Into Action", "purpose": "Challenge them to apply ONE thing from this guide.", "word_count": 100, "required": true}
    ]
  }',
  '{
    "hook": "Explain why mastering this topic will change their business/life. Create urgency to keep reading.",
    "basics": "Cover the fundamentals. Assume they'\''re smart but new to this specific topic.",
    "deep": "Share advanced insights that show real expertise. Include nuances that others miss.",
    "examples": "Provide 2-3 specific real-world examples. Show don'\''t just tell.",
    "mistakes": "List 3-5 common mistakes and how to avoid them. Be specific.",
    "advanced": "For the power users: share tactics that most guides don'\''t cover.",
    "resources": "List helpful tools, resources, or next reads. Be genuinely helpful.",
    "cta": "Challenge them to implement ONE thing from this guide today."
  }'
);

-- Create indexes
CREATE INDEX idx_blueprints_category ON content_blueprints(category);
CREATE INDEX idx_pillars_tenant ON content_pillars(tenant_id);
CREATE INDEX idx_calendar_tenant_date ON content_calendar(tenant_id, scheduled_date);
CREATE INDEX idx_pieces_tenant ON content_pieces(tenant_id);
CREATE INDEX idx_pieces_status ON content_pieces(status);

-- Verify
SELECT '🚀 Content Blueprints Created:' as status, count(*) as count FROM content_blueprints;
SELECT blueprint_name, blueprint_icon, category, difficulty_level FROM content_blueprints ORDER BY blueprint_code;

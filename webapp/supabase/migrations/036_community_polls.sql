-- ============================================================
-- 036: Community Polls System
-- GL365-curated "Best of" polls for community engagement
-- Winners earn "Voted Best" badges on their listings
-- ============================================================

-- 1. Polls table — GL365 staff creates these
CREATE TABLE IF NOT EXISTS community_polls (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,                          -- e.g. "Best Plumber in Tampa"
  description   text,
  category      text NOT NULL,                          -- e.g. "plumbing", "dining"
  destination_slug text,                                -- nullable, for location-specific polls
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'active', 'closed')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  closes_at     timestamptz                             -- nullable, polls can be open-ended
);

-- 2. Options table — businesses that can be voted for in a poll
CREATE TABLE IF NOT EXISTS community_poll_options (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id        uuid NOT NULL REFERENCES community_polls(id) ON DELETE CASCADE,
  business_id    uuid NOT NULL,                         -- references directory_listings.id
  business_name  text NOT NULL,                         -- denormalized for display speed
  business_image text,                                  -- denormalized cover image URL
  vote_count     integer NOT NULL DEFAULT 0,            -- denormalized vote tally
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, business_id)                         -- one entry per business per poll
);

-- 3. Votes table — anonymous community votes
CREATE TABLE IF NOT EXISTS community_poll_votes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id            uuid NOT NULL REFERENCES community_polls(id) ON DELETE CASCADE,
  option_id          uuid NOT NULL REFERENCES community_poll_options(id) ON DELETE CASCADE,
  voter_fingerprint  text NOT NULL,                     -- anonymous hash to prevent duplicates
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, voter_fingerprint)                   -- one vote per person per poll
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_community_polls_status        ON community_polls(status);
CREATE INDEX idx_community_polls_category      ON community_polls(category);
CREATE INDEX idx_community_polls_destination   ON community_polls(destination_slug) WHERE destination_slug IS NOT NULL;
CREATE INDEX idx_community_poll_options_poll    ON community_poll_options(poll_id);
CREATE INDEX idx_community_poll_options_votes   ON community_poll_options(poll_id, vote_count DESC);
CREATE INDEX idx_community_poll_votes_poll     ON community_poll_votes(poll_id);
CREATE INDEX idx_community_poll_votes_dedup    ON community_poll_votes(poll_id, voter_fingerprint);

-- ============================================================
-- RLS — Polls and options are publicly readable, votes are insert-only
-- ============================================================
ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_poll_votes ENABLE ROW LEVEL SECURITY;

-- Public read access to active polls
CREATE POLICY "Anyone can view active polls"
  ON community_polls FOR SELECT
  USING (status = 'active');

-- Public read access to poll options
CREATE POLICY "Anyone can view poll options"
  ON community_poll_options FOR SELECT
  USING (true);

-- Anyone can cast a vote (insert only, no update/delete)
CREATE POLICY "Anyone can vote"
  ON community_poll_votes FOR INSERT
  WITH CHECK (true);

-- Voters cannot read other votes (privacy)
CREATE POLICY "No public read on votes"
  ON community_poll_votes FOR SELECT
  USING (false);

-- Service role has full access (handled by Supabase default for service key)

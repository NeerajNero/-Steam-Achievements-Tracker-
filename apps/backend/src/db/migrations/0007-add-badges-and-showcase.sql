-- Badges and profile showcase foundation.
-- Converts milestone history into earned badges and lets users curate public
-- Steam profile showcase items.

ALTER TABLE activity_events
  DROP CONSTRAINT activity_events_event_type_check;

ALTER TABLE activity_events
  ADD CONSTRAINT activity_events_event_type_check CHECK (
    event_type IN (
      'profile_synced',
      'game_completed',
      'rare_achievement_synced',
      'guide_published',
      'guide_commented',
      'guide_voted',
      'session_created',
      'session_joined',
      'session_commented',
      'milestone_reached',
      'badge_earned'
    )
  );

ALTER TABLE activity_events
  DROP CONSTRAINT activity_events_entity_type_check;

ALTER TABLE activity_events
  ADD CONSTRAINT activity_events_entity_type_check CHECK (
    entity_type IN (
      'steam_profile',
      'game',
      'achievement',
      'guide',
      'guide_comment',
      'gaming_session',
      'session_comment',
      'milestone',
      'badge'
    )
  );

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  badge_type TEXT NOT NULL,
  tier TEXT,
  icon_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT badges_badge_type_check CHECK (
    badge_type IN ('milestone', 'completion', 'rarity', 'community', 'special')
  ),
  CONSTRAINT badges_tier_check CHECK (
    tier IS NULL OR tier IN ('bronze', 'silver', 'gold', 'platinum')
  )
);

COMMENT ON TABLE badges IS
  'Product-defined badge definitions for Steam achievement milestones and future community recognition.';
COMMENT ON COLUMN badges.code IS
  'Stable application badge code used for milestone-to-badge mapping.';
COMMENT ON COLUMN badges.icon_key IS
  'Logical icon key. Steam images are not mirrored and no upload pipeline is used for badges yet.';

CREATE INDEX badges_badge_type_idx ON badges (badge_type);
CREATE INDEX badges_is_active_idx ON badges (is_active);
CREATE INDEX badges_sort_order_idx ON badges (sort_order);

CREATE TRIGGER badges_set_updated_at
  BEFORE UPDATE ON badges
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

INSERT INTO badges (
  code,
  name,
  description,
  badge_type,
  tier,
  icon_key,
  sort_order
) VALUES
  ('first-sync', 'First Sync', 'Synced a Steam profile for the first time.', 'milestone', 'bronze', 'spark', 10),
  ('first-completed-game', 'First Completion', 'Completed the first tracked Steam game.', 'completion', 'bronze', 'check-circle', 20),
  ('completed-games-1', 'One And Done', 'Completed 1 tracked Steam game.', 'completion', 'bronze', 'trophy', 30),
  ('completed-games-5', 'Completion Streak', 'Completed 5 tracked Steam games.', 'completion', 'silver', 'trophy', 40),
  ('completed-games-10', 'Completion Hunter', 'Completed 10 tracked Steam games.', 'completion', 'gold', 'trophy', 50),
  ('completed-games-25', 'Completion Veteran', 'Completed 25 tracked Steam games.', 'completion', 'platinum', 'trophy', 60),
  ('achievements-100', '100 Unlocks', 'Unlocked 100 tracked Steam achievements.', 'milestone', 'bronze', 'award', 70),
  ('achievements-500', '500 Unlocks', 'Unlocked 500 tracked Steam achievements.', 'milestone', 'silver', 'award', 80),
  ('achievements-1000', '1000 Unlocks', 'Unlocked 1000 tracked Steam achievements.', 'milestone', 'gold', 'award', 90),
  ('completion-25', '25% Average', 'Reached 25% average completion.', 'completion', 'bronze', 'bar-chart', 100),
  ('completion-50', '50% Average', 'Reached 50% average completion.', 'completion', 'silver', 'bar-chart', 110),
  ('completion-75', '75% Average', 'Reached 75% average completion.', 'completion', 'gold', 'bar-chart', 120),
  ('completion-90', '90% Average', 'Reached 90% average completion.', 'completion', 'platinum', 'bar-chart', 130),
  ('completion-100', 'Perfect Average', 'Reached 100% average completion.', 'completion', 'platinum', 'star', 140)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE profile_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  steam_profile_id UUID NOT NULL REFERENCES steam_profiles(id) ON DELETE RESTRICT,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE RESTRICT,
  source_milestone_id UUID REFERENCES profile_milestones(id) ON DELETE RESTRICT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profile_badges_unique_profile_badge UNIQUE (steam_profile_id, badge_id),
  CONSTRAINT profile_badges_metadata_object_check CHECK (
    jsonb_typeof(metadata) = 'object'
  )
);

COMMENT ON TABLE profile_badges IS
  'Badges earned by a synced Steam profile. Rows are derived from profile milestones and future award sources.';
COMMENT ON COLUMN profile_badges.metadata IS
  'Safe public metadata only. Never store secrets, cookies, tokens, token hashes, OpenID payloads, or raw upstream payloads.';

CREATE INDEX profile_badges_steam_profile_id_idx
  ON profile_badges (steam_profile_id);
CREATE INDEX profile_badges_badge_id_idx
  ON profile_badges (badge_id);
CREATE INDEX profile_badges_earned_at_desc_idx
  ON profile_badges (earned_at DESC);

CREATE TABLE profile_showcase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  steam_profile_id UUID NOT NULL REFERENCES steam_profiles(id) ON DELETE RESTRICT,
  owner_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'public',
  title_override TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profile_showcase_items_item_type_check CHECK (
    item_type IN ('badge', 'milestone', 'achievement', 'guide', 'gaming_session')
  ),
  CONSTRAINT profile_showcase_items_visibility_check CHECK (
    visibility IN ('public', 'private')
  ),
  CONSTRAINT profile_showcase_items_position_check CHECK (position >= 0),
  CONSTRAINT profile_showcase_items_unique_profile_item UNIQUE (
    steam_profile_id,
    item_type,
    item_id
  ),
  CONSTRAINT profile_showcase_items_unique_profile_position UNIQUE (
    steam_profile_id,
    position
  )
);

COMMENT ON TABLE profile_showcase_items IS
  'Owner-curated Steam profile showcase items. Public endpoints return only items with public visibility.';
COMMENT ON COLUMN profile_showcase_items.item_id IS
  'References the selected item according to item_type. Eligibility is enforced by application services.';
COMMENT ON COLUMN profile_showcase_items.visibility IS
  'Controls whether an item appears on public showcase endpoints.';

CREATE INDEX profile_showcase_items_profile_position_idx
  ON profile_showcase_items (steam_profile_id, position);
CREATE INDEX profile_showcase_items_owner_user_id_idx
  ON profile_showcase_items (owner_user_id);
CREATE INDEX profile_showcase_items_item_idx
  ON profile_showcase_items (item_type, item_id);
CREATE INDEX profile_showcase_items_visibility_idx
  ON profile_showcase_items (visibility);

CREATE TRIGGER profile_showcase_items_set_updated_at
  BEFORE UPDATE ON profile_showcase_items
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

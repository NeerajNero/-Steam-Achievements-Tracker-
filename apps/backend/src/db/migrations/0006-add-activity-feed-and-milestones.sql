-- Activity feed and milestone foundation.
-- Stores public platform events and profile milestone history.

CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES app_users(id) ON DELETE RESTRICT,
  steam_profile_id UUID REFERENCES steam_profiles(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public',
  entity_type TEXT NOT NULL,
  entity_id UUID,
  steam_app_id INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT activity_events_event_type_check CHECK (
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
      'milestone_reached'
    )
  ),
  CONSTRAINT activity_events_visibility_check CHECK (
    visibility IN ('public', 'private')
  ),
  CONSTRAINT activity_events_entity_type_check CHECK (
    entity_type IN (
      'steam_profile',
      'game',
      'achievement',
      'guide',
      'guide_comment',
      'gaming_session',
      'session_comment',
      'milestone'
    )
  ),
  CONSTRAINT activity_events_metadata_object_check CHECK (
    jsonb_typeof(metadata) = 'object'
  )
);

COMMENT ON TABLE activity_events IS
  'Public/private activity feed events for Steam-only platform workflows.';
COMMENT ON COLUMN activity_events.metadata IS
  'Safe public metadata only. Never store secrets, cookies, tokens, token hashes, OpenID payloads, or raw upstream payloads.';
COMMENT ON COLUMN activity_events.visibility IS
  'Controls whether the event can appear on public activity endpoints.';

CREATE INDEX activity_events_occurred_at_desc_idx
  ON activity_events (occurred_at DESC);
CREATE INDEX activity_events_event_type_idx
  ON activity_events (event_type);
CREATE INDEX activity_events_visibility_idx
  ON activity_events (visibility);
CREATE INDEX activity_events_actor_occurred_at_desc_idx
  ON activity_events (actor_user_id, occurred_at DESC);
CREATE INDEX activity_events_profile_occurred_at_desc_idx
  ON activity_events (steam_profile_id, occurred_at DESC);
CREATE INDEX activity_events_steam_app_occurred_at_desc_idx
  ON activity_events (steam_app_id, occurred_at DESC);
CREATE INDEX activity_events_entity_idx
  ON activity_events (entity_type, entity_id);

CREATE TABLE profile_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  steam_profile_id UUID NOT NULL REFERENCES steam_profiles(id) ON DELETE RESTRICT,
  milestone_type TEXT NOT NULL,
  threshold_value INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_snapshot_id UUID REFERENCES profile_snapshots(id) ON DELETE RESTRICT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profile_milestones_milestone_type_check CHECK (
    milestone_type IN (
      'first_sync',
      'first_completed_game',
      'completed_games_count',
      'unlocked_achievements_count',
      'completion_percentage',
      'rare_achievement'
    )
  ),
  CONSTRAINT profile_milestones_threshold_non_negative_check CHECK (
    threshold_value IS NULL OR threshold_value >= 0
  ),
  CONSTRAINT profile_milestones_metadata_object_check CHECK (
    jsonb_typeof(metadata) = 'object'
  )
);

COMMENT ON TABLE profile_milestones IS
  'Milestones reached by a synced Steam profile, derived from stored snapshots and achievement data.';
COMMENT ON COLUMN profile_milestones.source_snapshot_id IS
  'Snapshot that caused this milestone, when generated from profile snapshot data.';
COMMENT ON COLUMN profile_milestones.metadata IS
  'Safe public metadata only. Never store secrets, cookies, tokens, token hashes, OpenID payloads, or raw upstream payloads.';

CREATE UNIQUE INDEX profile_milestones_profile_type_threshold_key
  ON profile_milestones (
    steam_profile_id,
    milestone_type,
    coalesce(threshold_value, -1)
  );
CREATE INDEX profile_milestones_profile_achieved_at_desc_idx
  ON profile_milestones (steam_profile_id, achieved_at DESC);
CREATE INDEX profile_milestones_milestone_type_idx
  ON profile_milestones (milestone_type);
CREATE INDEX profile_milestones_achieved_at_desc_idx
  ON profile_milestones (achieved_at DESC);

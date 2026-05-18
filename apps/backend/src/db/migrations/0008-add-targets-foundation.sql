-- Targets / achievement to-do list foundation.
-- Lets signed-in Steam users save private game and achievement targets for
-- completion planning. No auto-completion, notifications, or calendar
-- automation are introduced in this migration.

CREATE TABLE game_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  steam_profile_id UUID NOT NULL REFERENCES steam_profiles(id) ON DELETE RESTRICT,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active',
  priority TEXT NOT NULL DEFAULT 'medium',
  notes TEXT,
  target_completion_percentage NUMERIC(5,2),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT game_targets_user_game_key UNIQUE (user_id, game_id),
  CONSTRAINT game_targets_status_check CHECK (
    status IN ('active', 'paused', 'completed', 'ignored', 'archived')
  ),
  CONSTRAINT game_targets_priority_check CHECK (
    priority IN ('low', 'medium', 'high')
  ),
  CONSTRAINT game_targets_target_completion_percentage_check CHECK (
    target_completion_percentage IS NULL OR (
      target_completion_percentage >= 0
      AND target_completion_percentage <= 100
    )
  )
);

COMMENT ON TABLE game_targets IS
  'Private signed-in user game completion targets for Steam games. Lifecycle is status-based; rows are not hard-deleted by API archive operations.';
COMMENT ON COLUMN game_targets.user_id IS
  'Application user who owns this private target.';
COMMENT ON COLUMN game_targets.steam_profile_id IS
  'Linked primary Steam profile used when this target was created or updated.';
COMMENT ON COLUMN game_targets.game_id IS
  'Canonical Steam game being targeted.';
COMMENT ON COLUMN game_targets.status IS
  'Target lifecycle state. Archive instead of hard deleting from the API.';
COMMENT ON COLUMN game_targets.priority IS
  'Manual priority used for dashboard ordering.';
COMMENT ON COLUMN game_targets.notes IS
  'Private user notes. Do not store secrets, cookies, tokens, token hashes, or upstream keyed URLs.';
COMMENT ON COLUMN game_targets.target_completion_percentage IS
  'Optional desired completion percentage for this game target.';
COMMENT ON COLUMN game_targets.due_date IS
  'Optional user-entered due date. There is no reminder or calendar automation yet.';

CREATE INDEX game_targets_user_status_idx
  ON game_targets (user_id, status);
CREATE INDEX game_targets_steam_profile_status_idx
  ON game_targets (steam_profile_id, status);
CREATE INDEX game_targets_game_id_idx
  ON game_targets (game_id);
CREATE INDEX game_targets_priority_idx
  ON game_targets (priority);
CREATE INDEX game_targets_due_date_idx
  ON game_targets (due_date);

CREATE TRIGGER game_targets_set_updated_at
  BEFORE UPDATE ON game_targets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE achievement_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  steam_profile_id UUID NOT NULL REFERENCES steam_profiles(id) ON DELETE RESTRICT,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active',
  priority TEXT NOT NULL DEFAULT 'medium',
  notes TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT achievement_targets_user_achievement_key UNIQUE (
    user_id,
    achievement_id
  ),
  CONSTRAINT achievement_targets_status_check CHECK (
    status IN ('active', 'paused', 'completed', 'ignored', 'archived')
  ),
  CONSTRAINT achievement_targets_priority_check CHECK (
    priority IN ('low', 'medium', 'high')
  )
);

COMMENT ON TABLE achievement_targets IS
  'Private signed-in user achievement targets for canonical Steam achievements. Unlock state can be unknown.';
COMMENT ON COLUMN achievement_targets.user_id IS
  'Application user who owns this private target.';
COMMENT ON COLUMN achievement_targets.steam_profile_id IS
  'Linked primary Steam profile used when this target was created or updated.';
COMMENT ON COLUMN achievement_targets.achievement_id IS
  'Canonical Steam achievement being targeted.';
COMMENT ON COLUMN achievement_targets.status IS
  'Target lifecycle state. Archive instead of hard deleting from the API.';
COMMENT ON COLUMN achievement_targets.priority IS
  'Manual priority used for dashboard ordering.';
COMMENT ON COLUMN achievement_targets.notes IS
  'Private user notes. Do not store secrets, cookies, tokens, token hashes, or upstream keyed URLs.';
COMMENT ON COLUMN achievement_targets.due_date IS
  'Optional user-entered due date. There is no reminder or calendar automation yet.';

CREATE INDEX achievement_targets_user_status_idx
  ON achievement_targets (user_id, status);
CREATE INDEX achievement_targets_steam_profile_status_idx
  ON achievement_targets (steam_profile_id, status);
CREATE INDEX achievement_targets_achievement_id_idx
  ON achievement_targets (achievement_id);
CREATE INDEX achievement_targets_priority_idx
  ON achievement_targets (priority);
CREATE INDEX achievement_targets_due_date_idx
  ON achievement_targets (due_date);

CREATE TRIGGER achievement_targets_set_updated_at
  BEFORE UPDATE ON achievement_targets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

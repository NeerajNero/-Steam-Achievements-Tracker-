-- Steam Achievement Tracker MVP schema.
-- Migration-first PostgreSQL schema. Do not replace this with ORM schema sync.

-- ============================================================================
-- Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Updated-at trigger support
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_updated_at() IS
  'Maintains updated_at timestamps for rows changed by application sync or edits.';

-- ============================================================================
-- Steam profiles
-- ============================================================================

CREATE TABLE steam_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  steam_id TEXT NOT NULL,
  persona_name TEXT,
  avatar_url TEXT,
  profile_url TEXT,
  visibility_state INTEGER,
  is_private BOOLEAN NOT NULL DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT steam_profiles_steam_id_key UNIQUE (steam_id)
);

COMMENT ON TABLE steam_profiles IS
  'Steam profile identity and public metadata synced from Steam.';
COMMENT ON COLUMN steam_profiles.id IS
  'Internal UUID primary key used by this application.';
COMMENT ON COLUMN steam_profiles.steam_id IS
  'Steam 64-bit external profile identifier. Kept separate from the internal UUID.';
COMMENT ON COLUMN steam_profiles.persona_name IS
  'Current Steam display name from the latest profile sync.';
COMMENT ON COLUMN steam_profiles.avatar_url IS
  'Steam avatar URL from the latest profile sync.';
COMMENT ON COLUMN steam_profiles.profile_url IS
  'Public Steam profile URL when Steam provides it.';
COMMENT ON COLUMN steam_profiles.visibility_state IS
  'Steam community visibility state returned by the Steam API.';
COMMENT ON COLUMN steam_profiles.is_private IS
  'True when the profile should be treated as private or unavailable for detailed sync.';
COMMENT ON COLUMN steam_profiles.last_synced_at IS
  'Timestamp of the latest successful profile-level sync.';
COMMENT ON COLUMN steam_profiles.created_at IS
  'Timestamp when this profile row was first created.';
COMMENT ON COLUMN steam_profiles.updated_at IS
  'Timestamp when this profile row was last updated.';

CREATE TRIGGER steam_profiles_set_updated_at
BEFORE UPDATE ON steam_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Games
-- ============================================================================

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  steam_app_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  icon_url TEXT,
  logo_url TEXT,
  has_achievements BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT games_steam_app_id_key UNIQUE (steam_app_id)
);

COMMENT ON TABLE games IS
  'Canonical Steam game/app metadata shared across synced profiles.';
COMMENT ON COLUMN games.id IS
  'Internal UUID primary key used by this application.';
COMMENT ON COLUMN games.steam_app_id IS
  'Steam external app identifier. Kept separate from the internal UUID.';
COMMENT ON COLUMN games.name IS
  'Current Steam game name from the latest game metadata sync.';
COMMENT ON COLUMN games.icon_url IS
  'Steam-provided small icon URL when available.';
COMMENT ON COLUMN games.logo_url IS
  'Steam-provided logo URL when available.';
COMMENT ON COLUMN games.has_achievements IS
  'True when achievement metadata or unlock data indicates the game has achievements.';
COMMENT ON COLUMN games.created_at IS
  'Timestamp when this game row was first created.';
COMMENT ON COLUMN games.updated_at IS
  'Timestamp when this game row was last updated.';

CREATE TRIGGER games_set_updated_at
BEFORE UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Profile games
-- ============================================================================

CREATE TABLE profile_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES steam_profiles(id) ON DELETE RESTRICT,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  playtime_minutes INTEGER NOT NULL DEFAULT 0,
  playtime_two_weeks_minutes INTEGER NOT NULL DEFAULT 0,
  total_achievements INTEGER NOT NULL DEFAULT 0,
  unlocked_achievements INTEGER NOT NULL DEFAULT 0,
  completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profile_games_profile_id_game_id_key UNIQUE (profile_id, game_id),
  CONSTRAINT profile_games_playtime_minutes_check CHECK (playtime_minutes >= 0),
  CONSTRAINT profile_games_playtime_two_weeks_minutes_check CHECK (playtime_two_weeks_minutes >= 0),
  CONSTRAINT profile_games_total_achievements_check CHECK (total_achievements >= 0),
  CONSTRAINT profile_games_unlocked_achievements_check CHECK (unlocked_achievements >= 0),
  CONSTRAINT profile_games_unlocked_not_above_total_check CHECK (unlocked_achievements <= total_achievements),
  CONSTRAINT profile_games_completion_percentage_check CHECK (
    completion_percentage >= 0
    AND completion_percentage <= 100
  )
);

COMMENT ON TABLE profile_games IS
  'Per-profile ownership, playtime, and completion rollup for a canonical Steam game.';
COMMENT ON COLUMN profile_games.id IS
  'Internal UUID primary key used by this application.';
COMMENT ON COLUMN profile_games.profile_id IS
  'Internal profile UUID. Deletes are restricted to preserve user progress history.';
COMMENT ON COLUMN profile_games.game_id IS
  'Internal game UUID. Deletes are restricted to preserve user progress history.';
COMMENT ON COLUMN profile_games.playtime_minutes IS
  'Total Steam playtime in minutes for this profile and game.';
COMMENT ON COLUMN profile_games.playtime_two_weeks_minutes IS
  'Steam playtime in minutes during the most recent two-week window when available.';
COMMENT ON COLUMN profile_games.total_achievements IS
  'Total achievement count known for this game at the latest sync.';
COMMENT ON COLUMN profile_games.unlocked_achievements IS
  'Achievement count unlocked by this profile at the latest sync.';
COMMENT ON COLUMN profile_games.completion_percentage IS
  'Stored completion percentage from 0 to 100 for dashboard and nearest-100 queries.';
COMMENT ON COLUMN profile_games.last_played_at IS
  'Timestamp when Steam reports the game was last played, when available.';
COMMENT ON COLUMN profile_games.last_synced_at IS
  'Timestamp of the latest profile-game sync.';
COMMENT ON COLUMN profile_games.created_at IS
  'Timestamp when this profile-game row was first created.';
COMMENT ON COLUMN profile_games.updated_at IS
  'Timestamp when this profile-game row was last updated.';

CREATE TRIGGER profile_games_set_updated_at
BEFORE UPDATE ON profile_games
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Achievements
-- ============================================================================

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  steam_app_id INTEGER NOT NULL,
  api_name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  icon_url TEXT,
  icon_gray_url TEXT,
  global_percentage NUMERIC(6,3),
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT achievements_steam_app_id_api_name_key UNIQUE (steam_app_id, api_name),
  CONSTRAINT achievements_global_percentage_check CHECK (
    global_percentage IS NULL
    OR (
      global_percentage >= 0
      AND global_percentage <= 100
    )
  )
);

COMMENT ON TABLE achievements IS
  'Canonical Steam achievement metadata for a game, separate from profile unlock state.';
COMMENT ON COLUMN achievements.id IS
  'Internal UUID primary key used by this application.';
COMMENT ON COLUMN achievements.steam_app_id IS
  'Steam external app identifier for the game that owns this achievement.';
COMMENT ON COLUMN achievements.api_name IS
  'Steam API achievement identifier, unique within a Steam app.';
COMMENT ON COLUMN achievements.display_name IS
  'Human-readable achievement name when Steam metadata provides it.';
COMMENT ON COLUMN achievements.description IS
  'Achievement description when Steam metadata provides it.';
COMMENT ON COLUMN achievements.icon_url IS
  'Unlocked achievement icon URL when available.';
COMMENT ON COLUMN achievements.icon_gray_url IS
  'Locked achievement icon URL when available.';
COMMENT ON COLUMN achievements.global_percentage IS
  'Global unlock percentage from Steam, from 0 to 100, when available.';
COMMENT ON COLUMN achievements.hidden IS
  'True when Steam marks the achievement as hidden or metadata implies hidden status.';
COMMENT ON COLUMN achievements.created_at IS
  'Timestamp when this achievement row was first created.';
COMMENT ON COLUMN achievements.updated_at IS
  'Timestamp when this achievement row was last updated.';

CREATE TRIGGER achievements_set_updated_at
BEFORE UPDATE ON achievements
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Profile achievements
-- ============================================================================

CREATE TABLE profile_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES steam_profiles(id) ON DELETE RESTRICT,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE RESTRICT,
  achieved BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profile_achievements_profile_id_achievement_id_key UNIQUE (profile_id, achievement_id)
);

COMMENT ON TABLE profile_achievements IS
  'Per-profile achievement unlock state, separate from canonical achievement metadata.';
COMMENT ON COLUMN profile_achievements.id IS
  'Internal UUID primary key used by this application.';
COMMENT ON COLUMN profile_achievements.profile_id IS
  'Internal profile UUID. Deletes are restricted to preserve user achievement history.';
COMMENT ON COLUMN profile_achievements.achievement_id IS
  'Internal achievement UUID. Deletes are restricted to preserve user achievement history.';
COMMENT ON COLUMN profile_achievements.achieved IS
  'True when this profile has unlocked the achievement.';
COMMENT ON COLUMN profile_achievements.unlocked_at IS
  'Steam unlock timestamp when available.';
COMMENT ON COLUMN profile_achievements.last_synced_at IS
  'Timestamp of the latest profile-achievement sync.';
COMMENT ON COLUMN profile_achievements.created_at IS
  'Timestamp when this profile-achievement row was first created.';
COMMENT ON COLUMN profile_achievements.updated_at IS
  'Timestamp when this profile-achievement row was last updated.';

CREATE TRIGGER profile_achievements_set_updated_at
BEFORE UPDATE ON profile_achievements
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Sync runs
-- ============================================================================

CREATE TABLE sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES steam_profiles(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sync_runs_sync_type_check CHECK (
    sync_type IN ('profile', 'games', 'achievements', 'full')
  ),
  CONSTRAINT sync_runs_status_check CHECK (
    status IN ('queued', 'running', 'success', 'partial_success', 'failed')
  ),
  CONSTRAINT sync_runs_finished_at_check CHECK (
    finished_at IS NULL
    OR finished_at >= started_at
  )
);

COMMENT ON TABLE sync_runs IS
  'Records sync attempts, status, timing, and safe error details for Steam data ingestion.';
COMMENT ON COLUMN sync_runs.id IS
  'Internal UUID primary key used by this application.';
COMMENT ON COLUMN sync_runs.profile_id IS
  'Profile associated with the sync run. Set null if the profile row is removed so sync history can remain.';
COMMENT ON COLUMN sync_runs.sync_type IS
  'Scope of sync work: profile, games, achievements, or full.';
COMMENT ON COLUMN sync_runs.status IS
  'Current or final sync status.';
COMMENT ON COLUMN sync_runs.started_at IS
  'Timestamp when the sync run started or was queued.';
COMMENT ON COLUMN sync_runs.finished_at IS
  'Timestamp when the sync run reached a terminal state.';
COMMENT ON COLUMN sync_runs.error_message IS
  'Safe user-readable error summary. Must not contain API keys or sensitive request details.';
COMMENT ON COLUMN sync_runs.metadata IS
  'Structured non-sensitive sync metadata such as counts, app IDs, or partial failure summaries.';
COMMENT ON COLUMN sync_runs.created_at IS
  'Timestamp when this sync run row was first created.';

-- ============================================================================
-- Dashboard and sync read indexes
-- ============================================================================

-- Covered by unique constraints:
-- - steam_profiles(steam_id)
-- - games(steam_app_id)

CREATE INDEX profile_games_profile_id_idx
  ON profile_games (profile_id);

CREATE INDEX profile_games_game_id_idx
  ON profile_games (game_id);

CREATE INDEX profile_games_profile_completion_idx
  ON profile_games (profile_id, completion_percentage);

CREATE INDEX profile_games_profile_unlocked_total_idx
  ON profile_games (profile_id, unlocked_achievements, total_achievements);

CREATE INDEX achievements_steam_app_id_idx
  ON achievements (steam_app_id);

CREATE INDEX achievements_steam_app_global_percentage_idx
  ON achievements (steam_app_id, global_percentage);

CREATE INDEX profile_achievements_profile_id_idx
  ON profile_achievements (profile_id);

CREATE INDEX profile_achievements_achievement_id_idx
  ON profile_achievements (achievement_id);

CREATE INDEX profile_achievements_profile_achieved_idx
  ON profile_achievements (profile_id, achieved);

CREATE INDEX profile_achievements_profile_unlocked_at_idx
  ON profile_achievements (profile_id, unlocked_at);

CREATE INDEX sync_runs_profile_started_at_idx
  ON sync_runs (profile_id, started_at DESC);

CREATE INDEX sync_runs_status_idx
  ON sync_runs (status);

CREATE TABLE gaming_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  steam_app_id INTEGER NOT NULL REFERENCES games(steam_app_id) ON DELETE RESTRICT,
  host_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  visibility TEXT NOT NULL DEFAULT 'public',
  scheduled_start_at TIMESTAMPTZ NOT NULL,
  scheduled_end_at TIMESTAMPTZ,
  timezone TEXT,
  max_participants INTEGER NOT NULL DEFAULT 4,
  external_voice_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gaming_sessions_status_check
    CHECK (status IN ('open', 'full', 'completed', 'cancelled')),
  CONSTRAINT gaming_sessions_visibility_check
    CHECK (visibility IN ('public', 'unlisted', 'private')),
  CONSTRAINT gaming_sessions_max_participants_check
    CHECK (max_participants >= 2 AND max_participants <= 100),
  CONSTRAINT gaming_sessions_schedule_check
    CHECK (scheduled_end_at IS NULL OR scheduled_end_at > scheduled_start_at),
  CONSTRAINT gaming_sessions_external_voice_url_check
    CHECK (
      external_voice_url IS NULL OR
      external_voice_url ~* '^https?://[^[:space:]]+$'
    )
);

CREATE INDEX gaming_sessions_steam_app_id_idx ON gaming_sessions (steam_app_id);
CREATE INDEX gaming_sessions_host_user_id_idx ON gaming_sessions (host_user_id);
CREATE INDEX gaming_sessions_status_idx ON gaming_sessions (status);
CREATE INDEX gaming_sessions_visibility_idx ON gaming_sessions (visibility);
CREATE INDEX gaming_sessions_scheduled_start_at_idx
  ON gaming_sessions (scheduled_start_at);
CREATE INDEX gaming_sessions_game_status_visibility_start_idx
  ON gaming_sessions (steam_app_id, status, visibility, scheduled_start_at);

COMMENT ON TABLE gaming_sessions IS
  'Scheduled Steam game sessions for co-op, multiplayer, or boosting achievement plans.';
COMMENT ON COLUMN gaming_sessions.steam_app_id IS
  'Canonical Steam app id for the session game.';
COMMENT ON COLUMN gaming_sessions.host_user_id IS
  'Internal app user that hosts and manages the session.';
COMMENT ON COLUMN gaming_sessions.status IS
  'Session lifecycle: open, full, completed, or cancelled.';
COMMENT ON COLUMN gaming_sessions.visibility IS
  'Session visibility: public, unlisted, or private.';
COMMENT ON COLUMN gaming_sessions.external_voice_url IS
  'Optional external voice/chat link supplied by the host. Chat integration is deferred.';

CREATE TRIGGER gaming_sessions_updated_at
  BEFORE UPDATE ON gaming_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE gaming_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES gaming_sessions(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  role TEXT NOT NULL DEFAULT 'participant',
  status TEXT NOT NULL DEFAULT 'joined',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gaming_session_participants_session_user_key
    UNIQUE (session_id, user_id),
  CONSTRAINT gaming_session_participants_role_check
    CHECK (role IN ('host', 'participant')),
  CONSTRAINT gaming_session_participants_status_check
    CHECK (status IN ('joined', 'left', 'removed', 'no_show'))
);

CREATE INDEX gaming_session_participants_session_id_idx
  ON gaming_session_participants (session_id);
CREATE INDEX gaming_session_participants_user_id_idx
  ON gaming_session_participants (user_id);
CREATE INDEX gaming_session_participants_session_status_idx
  ON gaming_session_participants (session_id, status);

COMMENT ON TABLE gaming_session_participants IS
  'App users participating in Steam gaming sessions.';
COMMENT ON COLUMN gaming_session_participants.role IS
  'Participant role in the session: host or participant.';
COMMENT ON COLUMN gaming_session_participants.status IS
  'Participation state: joined, left, removed, or no_show.';

CREATE TRIGGER gaming_session_participants_updated_at
  BEFORE UPDATE ON gaming_session_participants
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE gaming_session_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES gaming_sessions(id) ON DELETE RESTRICT,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gaming_session_achievements_session_achievement_key
    UNIQUE (session_id, achievement_id)
);

CREATE INDEX gaming_session_achievements_session_id_idx
  ON gaming_session_achievements (session_id);
CREATE INDEX gaming_session_achievements_achievement_id_idx
  ON gaming_session_achievements (achievement_id);

COMMENT ON TABLE gaming_session_achievements IS
  'Mappings from gaming sessions to canonical Steam achievements targeted by the session.';

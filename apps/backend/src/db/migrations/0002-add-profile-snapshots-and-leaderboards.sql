-- Profile snapshots and leaderboard v1.
-- Snapshot rows are generated explicitly after sync or manual requests.

-- ============================================================================
-- Profile snapshots
-- ============================================================================

CREATE TABLE profile_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  steam_profile_id UUID NOT NULL REFERENCES steam_profiles(id) ON DELETE RESTRICT,
  total_games INTEGER NOT NULL DEFAULT 0,
  completed_games INTEGER NOT NULL DEFAULT 0,
  total_achievements INTEGER NOT NULL DEFAULT 0,
  unlocked_achievements INTEGER NOT NULL DEFAULT 0,
  remaining_achievements INTEGER NOT NULL DEFAULT 0,
  average_completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_playtime_minutes INTEGER NOT NULL DEFAULT 0,
  rarest_unlocked_global_percentage NUMERIC(6,3),
  snapshot_reason TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profile_snapshots_total_games_check CHECK (total_games >= 0),
  CONSTRAINT profile_snapshots_completed_games_check CHECK (completed_games >= 0),
  CONSTRAINT profile_snapshots_total_achievements_check CHECK (total_achievements >= 0),
  CONSTRAINT profile_snapshots_unlocked_achievements_check CHECK (unlocked_achievements >= 0),
  CONSTRAINT profile_snapshots_remaining_achievements_check CHECK (remaining_achievements >= 0),
  CONSTRAINT profile_snapshots_unlocked_not_above_total_check CHECK (unlocked_achievements <= total_achievements),
  CONSTRAINT profile_snapshots_completed_not_above_total_games_check CHECK (completed_games <= total_games),
  CONSTRAINT profile_snapshots_average_completion_check CHECK (
    average_completion_percentage >= 0
    AND average_completion_percentage <= 100
  ),
  CONSTRAINT profile_snapshots_rarest_unlocked_check CHECK (
    rarest_unlocked_global_percentage IS NULL
    OR (
      rarest_unlocked_global_percentage >= 0
      AND rarest_unlocked_global_percentage <= 100
    )
  ),
  CONSTRAINT profile_snapshots_snapshot_reason_check CHECK (
    snapshot_reason IN ('manual', 'sync_completed', 'scheduled')
  )
);

COMMENT ON TABLE profile_snapshots IS
  'Periodic aggregate Steam profile stats used for history and leaderboard reads.';
COMMENT ON COLUMN profile_snapshots.steam_profile_id IS
  'Steam profile UUID this snapshot summarizes.';
COMMENT ON COLUMN profile_snapshots.average_completion_percentage IS
  'Average profile game completion at the time the snapshot was created.';
COMMENT ON COLUMN profile_snapshots.rarest_unlocked_global_percentage IS
  'Lowest global achievement percentage among unlocked achievements at snapshot time.';
COMMENT ON COLUMN profile_snapshots.snapshot_reason IS
  'Reason this snapshot was created: manual, sync_completed, or scheduled.';

CREATE INDEX profile_snapshots_steam_profile_id_idx
  ON profile_snapshots (steam_profile_id);
CREATE INDEX profile_snapshots_created_at_desc_idx
  ON profile_snapshots (created_at DESC);
CREATE INDEX profile_snapshots_profile_created_at_desc_idx
  ON profile_snapshots (steam_profile_id, created_at DESC);
CREATE INDEX profile_snapshots_average_completion_desc_idx
  ON profile_snapshots (average_completion_percentage DESC);
CREATE INDEX profile_snapshots_completed_games_desc_idx
  ON profile_snapshots (completed_games DESC);
CREATE INDEX profile_snapshots_unlocked_achievements_desc_idx
  ON profile_snapshots (unlocked_achievements DESC);
CREATE INDEX profile_snapshots_rarest_unlocked_asc_idx
  ON profile_snapshots (rarest_unlocked_global_percentage ASC);

-- ============================================================================
-- Snapshot function
-- ============================================================================

CREATE OR REPLACE FUNCTION create_profile_snapshot(
  p_steam_profile_id uuid,
  p_snapshot_reason text DEFAULT 'manual'
)
RETURNS uuid AS $$
DECLARE
  inserted_snapshot_id uuid;
BEGIN
  IF p_snapshot_reason NOT IN ('manual', 'sync_completed', 'scheduled') THEN
    RAISE EXCEPTION 'Invalid snapshot reason: %', p_snapshot_reason
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO profile_snapshots (
    steam_profile_id,
    total_games,
    completed_games,
    total_achievements,
    unlocked_achievements,
    remaining_achievements,
    average_completion_percentage,
    total_playtime_minutes,
    rarest_unlocked_global_percentage,
    snapshot_reason
  )
  SELECT
    sp.id,
    count(pg.id)::integer,
    count(pg.id) FILTER (WHERE pg.completion_percentage = 100)::integer,
    coalesce(sum(pg.total_achievements), 0)::integer,
    coalesce(sum(pg.unlocked_achievements), 0)::integer,
    greatest(
      coalesce(sum(pg.total_achievements), 0)::integer
        - coalesce(sum(pg.unlocked_achievements), 0)::integer,
      0
    ),
    coalesce(avg(pg.completion_percentage), 0)::numeric(5,2),
    coalesce(sum(pg.playtime_minutes), 0)::integer,
    (
      SELECT min(a.global_percentage)::numeric(6,3)
      FROM profile_achievements pa
      JOIN achievements a ON a.id = pa.achievement_id
      WHERE pa.profile_id = sp.id
        AND pa.achieved = true
        AND a.global_percentage IS NOT NULL
    ),
    p_snapshot_reason
  FROM steam_profiles sp
  LEFT JOIN profile_games pg ON pg.profile_id = sp.id
  WHERE sp.id = p_steam_profile_id
  GROUP BY sp.id
  RETURNING id INTO inserted_snapshot_id;

  IF inserted_snapshot_id IS NULL THEN
    RAISE EXCEPTION 'Steam profile % does not exist', p_steam_profile_id
      USING ERRCODE = '23503';
  END IF;

  RETURN inserted_snapshot_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_profile_snapshot(uuid, text) IS
  'Creates one aggregate profile snapshot from current stored Steam profile progress. Called explicitly after sync or manual snapshot requests.';

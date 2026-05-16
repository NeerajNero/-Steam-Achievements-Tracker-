-- ============================================================================
-- 0002 - Achievement progress refresh function
-- ============================================================================
-- Keeps profile_games achievement progress derived from canonical achievement
-- metadata and profile-specific unlock state.

CREATE OR REPLACE FUNCTION refresh_profile_game_achievement_progress(
  p_profile_id uuid,
  p_steam_app_id integer
)
RETURNS TABLE (
  total_achievements integer,
  unlocked_achievements integer,
  completion_percentage numeric(5, 2)
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_game_id uuid;
  v_total_achievements integer;
  v_unlocked_achievements integer;
  v_completion_percentage numeric(5, 2);
BEGIN
  SELECT games.id
  INTO v_game_id
  FROM games
  WHERE games.steam_app_id = p_steam_app_id;

  IF v_game_id IS NULL THEN
    RAISE EXCEPTION 'Steam app % does not exist in games', p_steam_app_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  SELECT count(*)::integer
  INTO v_total_achievements
  FROM achievements
  WHERE achievements.steam_app_id = p_steam_app_id;

  SELECT count(*)::integer
  INTO v_unlocked_achievements
  FROM profile_achievements
  INNER JOIN achievements
    ON achievements.id = profile_achievements.achievement_id
  WHERE profile_achievements.profile_id = p_profile_id
    AND achievements.steam_app_id = p_steam_app_id
    AND profile_achievements.achieved = true;

  v_completion_percentage := CASE
    WHEN v_total_achievements = 0 THEN 0
    ELSE round(
      (v_unlocked_achievements::numeric / v_total_achievements::numeric) * 100,
      2
    )
  END;

  UPDATE games
  SET
    has_achievements = v_total_achievements > 0,
    updated_at = now()
  WHERE games.id = v_game_id;

  UPDATE profile_games
  SET
    total_achievements = v_total_achievements,
    unlocked_achievements = v_unlocked_achievements,
    completion_percentage = v_completion_percentage,
    last_synced_at = now(),
    updated_at = now()
  WHERE profile_games.profile_id = p_profile_id
    AND profile_games.game_id = v_game_id;

  total_achievements := v_total_achievements;
  unlocked_achievements := v_unlocked_achievements;
  completion_percentage := v_completion_percentage;

  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION refresh_profile_game_achievement_progress(uuid, integer)
IS 'Recalculates one profile/game achievement progress row from achievements and profile_achievements. Called explicitly by achievement sync after per-game upserts.';

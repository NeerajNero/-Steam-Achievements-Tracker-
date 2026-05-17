CREATE TABLE guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  steam_app_id INTEGER NOT NULL REFERENCES games(steam_app_id) ON DELETE RESTRICT,
  author_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  visibility TEXT NOT NULL DEFAULT 'public',
  estimated_difficulty INTEGER,
  estimated_hours INTEGER,
  is_spoiler_heavy BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT guides_steam_app_id_slug_key UNIQUE (steam_app_id, slug),
  CONSTRAINT guides_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT guides_visibility_check CHECK (visibility IN ('public', 'unlisted', 'private')),
  CONSTRAINT guides_estimated_difficulty_check CHECK (
    estimated_difficulty IS NULL OR (
      estimated_difficulty >= 1 AND estimated_difficulty <= 10
    )
  ),
  CONSTRAINT guides_estimated_hours_check CHECK (
    estimated_hours IS NULL OR estimated_hours >= 0
  ),
  CONSTRAINT guides_slug_check CHECK (slug ~ '^[a-z0-9-]{3,80}$')
);

CREATE INDEX guides_steam_app_id_idx ON guides (steam_app_id);
CREATE INDEX guides_author_user_id_idx ON guides (author_user_id);
CREATE INDEX guides_status_idx ON guides (status);
CREATE INDEX guides_visibility_idx ON guides (visibility);
CREATE INDEX guides_published_at_idx ON guides (published_at DESC);
CREATE INDEX guides_steam_app_id_status_visibility_idx
  ON guides (steam_app_id, status, visibility);

COMMENT ON TABLE guides IS
  'Steam game guide and roadmap documents authored by app users.';
COMMENT ON COLUMN guides.steam_app_id IS
  'Canonical Steam app id for the game this guide covers.';
COMMENT ON COLUMN guides.author_user_id IS
  'Internal app user that authored the guide.';
COMMENT ON COLUMN guides.status IS
  'Guide lifecycle state: draft, published, or archived.';
COMMENT ON COLUMN guides.visibility IS
  'Guide visibility: public, unlisted, or private.';
COMMENT ON COLUMN guides.slug IS
  'Game-scoped public slug, unique per Steam app id.';

CREATE TRIGGER guides_updated_at
  BEFORE UPDATE ON guides
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE guide_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT guide_sections_position_check CHECK (position >= 0)
);

CREATE INDEX guide_sections_guide_id_idx ON guide_sections (guide_id);
CREATE INDEX guide_sections_guide_id_position_idx
  ON guide_sections (guide_id, position);

COMMENT ON TABLE guide_sections IS
  'Ordered text sections that make up a Steam game guide.';
COMMENT ON COLUMN guide_sections.content IS
  'Plain text guide content. Rich text and media uploads are deferred.';
COMMENT ON COLUMN guide_sections.position IS
  'Zero-based display order within one guide.';

CREATE TRIGGER guide_sections_updated_at
  BEFORE UPDATE ON guide_sections
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE guide_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE RESTRICT,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE RESTRICT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT guide_achievements_guide_id_achievement_id_key
    UNIQUE (guide_id, achievement_id)
);

CREATE INDEX guide_achievements_guide_id_idx ON guide_achievements (guide_id);
CREATE INDEX guide_achievements_achievement_id_idx
  ON guide_achievements (achievement_id);

COMMENT ON TABLE guide_achievements IS
  'Mappings from guides to canonical Steam achievements covered by the guide.';
COMMENT ON COLUMN guide_achievements.note IS
  'Optional short note about why the achievement is attached.';

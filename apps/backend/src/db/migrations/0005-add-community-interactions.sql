CREATE TABLE guide_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  value INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT guide_votes_guide_user_key UNIQUE (guide_id, user_id),
  CONSTRAINT guide_votes_value_check CHECK (value IN (-1, 1))
);

CREATE INDEX guide_votes_guide_id_idx ON guide_votes (guide_id);
CREATE INDEX guide_votes_user_id_idx ON guide_votes (user_id);
CREATE INDEX guide_votes_guide_value_idx ON guide_votes (guide_id, value);

COMMENT ON TABLE guide_votes IS
  'One authenticated user vote per Steam guide. Votes are used for lightweight guide quality signals.';
COMMENT ON COLUMN guide_votes.value IS
  'Guide vote value: 1 for upvote, -1 for downvote.';

CREATE TRIGGER guide_votes_updated_at
  BEFORE UPDATE ON guide_votes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE guide_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT guide_comments_status_check
    CHECK (status IN ('visible', 'hidden', 'deleted')),
  CONSTRAINT guide_comments_body_length_check
    CHECK (char_length(body) >= 1 AND char_length(body) <= 2000)
);

CREATE INDEX guide_comments_guide_id_idx ON guide_comments (guide_id);
CREATE INDEX guide_comments_user_id_idx ON guide_comments (user_id);
CREATE INDEX guide_comments_guide_created_at_idx
  ON guide_comments (guide_id, created_at);

COMMENT ON TABLE guide_comments IS
  'Flat comments on Steam achievement guides. Nested threads and moderation workflows are deferred.';
COMMENT ON COLUMN guide_comments.status IS
  'Comment visibility lifecycle: visible, hidden, or deleted. Deletes are soft deletes.';

CREATE TRIGGER guide_comments_updated_at
  BEFORE UPDATE ON guide_comments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE session_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES gaming_sessions(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT session_comments_status_check
    CHECK (status IN ('visible', 'hidden', 'deleted')),
  CONSTRAINT session_comments_body_length_check
    CHECK (char_length(body) >= 1 AND char_length(body) <= 2000)
);

CREATE INDEX session_comments_session_id_idx ON session_comments (session_id);
CREATE INDEX session_comments_user_id_idx ON session_comments (user_id);
CREATE INDEX session_comments_session_created_at_idx
  ON session_comments (session_id, created_at);

COMMENT ON TABLE session_comments IS
  'Flat comments on Steam gaming sessions. Real-time chat and nested threads are deferred.';
COMMENT ON COLUMN session_comments.status IS
  'Comment visibility lifecycle: visible, hidden, or deleted. Deletes are soft deletes.';

CREATE TRIGGER session_comments_updated_at
  BEFORE UPDATE ON session_comments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_reports_target_type_check
    CHECK (target_type IN ('guide', 'guide_comment', 'gaming_session', 'session_comment')),
  CONSTRAINT content_reports_reason_check
    CHECK (reason IN ('spam', 'abuse', 'off_topic', 'cheating', 'other')),
  CONSTRAINT content_reports_status_check
    CHECK (status IN ('open', 'reviewed', 'dismissed', 'actioned')),
  CONSTRAINT content_reports_details_length_check
    CHECK (details IS NULL OR char_length(details) <= 2000)
);

CREATE INDEX content_reports_reporter_user_id_idx
  ON content_reports (reporter_user_id);
CREATE INDEX content_reports_target_idx
  ON content_reports (target_type, target_id);
CREATE INDEX content_reports_status_idx ON content_reports (status);
CREATE INDEX content_reports_created_at_idx ON content_reports (created_at DESC);

COMMENT ON TABLE content_reports IS
  'Authenticated user reports for future moderation intake. No moderation dashboard exists yet.';
COMMENT ON COLUMN content_reports.target_type IS
  'Reported content type: guide, guide_comment, gaming_session, or session_comment.';
COMMENT ON COLUMN content_reports.status IS
  'Moderation intake status. Reports are not publicly exposed.';

CREATE TRIGGER content_reports_updated_at
  BEFORE UPDATE ON content_reports
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

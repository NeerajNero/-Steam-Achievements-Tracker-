# Future Roadmap

## Phase 1: MVP

- Steam profile sync.
- Owned games sync.
- Achievement metadata sync.
- User achievement unlock sync.
- Dashboard summary.
- Game library list.
- Game details.
- Nearest 100% games.
- Rarest unlocked achievements.
- Sync history and status.

## Phase 2: Analytics And Planner

- Advanced library filters and sorts.
- Coherent dashboard navigation and shared frontend UI primitives across public
  profile, game, leaderboard, guide, session, and activity pages.
- Global Steam game browsing.
- Latest-snapshot leaderboard v1.
- Basic Steam game guides and achievement roadmaps.
- Basic Steam gaming sessions for co-op/multiplayer achievement boosting.
- Public activity feed and snapshot-derived profile milestones.
- Milestone-derived badges and owner-curated profile showcase items.
- Backlog optimization based on remaining achievements, rarity, and playtime.
- Suggested next games to complete.
- Suggested achievement targets for near-complete games.
- Completion distribution views.
- Rarity distribution views.
- Profile snapshots as the historical tracking foundation.
- Achievement goals.
- Richer guide editing, comment moderation, nested threads, and voting analytics
  after the community foundation proves useful.
- Session chat, reminders, notifications, calendar export, and no-show tracking
  after the session/community foundations prove useful.
- Real-time activity, notifications, share cards, and milestone artwork after the
  database-backed activity/milestone foundation proves stable.
- Badge artwork, drag-and-drop showcase editing, generated share cards, and
  gamercards after the badge/showcase foundation proves stable.

## Phase 3: Public Profiles And Sharing

- Optional public profile pages.
- Privacy-aware public data rules.
- Shareable dashboard summaries.
- Shareable rare achievement showcase.
- Shareable nearest 100% list.
- Public profile freshness indicators.

## Phase 4: Social Comparison

- Friend profile import or linking.
- Compare completion percentage, completed games, rare unlocks, and backlog shape.
- Similar-player recommendations.
- Group or friend leaderboards.
- Materialized leaderboard batches if ranking costs or fairness rules require
  them.
- Privacy controls for comparison visibility.

## Phase 5: AI And Backlog Intelligence

- AI-assisted backlog explanations.
- AI-generated next-step plans for selected completion goals.
- AI summaries of recent progress.
- AI discovery for rare or interesting achievements.
- Recommendation explanations grounded in synced data.

## Phase 6: Steam Ecosystem Expansion

- Keep the product Steam-first and avoid platform-neutral abstractions until
  there is a concrete reviewed need.
- Add Steam guide images, share cards, and generated gamercards through the
  future media asset flow.
- Add Steam-focused community surfaces such as guide moderation and group
  leaderboards.

## Decision

Build the roadmap in layers: reliable sync first, deterministic intelligence second, sharing third, social and AI later.

## Why

Each later phase depends on trustworthy profile, game, achievement, and sync data. Social and AI features will be weak if the core completion model is not accurate.

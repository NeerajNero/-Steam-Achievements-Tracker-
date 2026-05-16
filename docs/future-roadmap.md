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
- Backlog optimization based on remaining achievements, rarity, and playtime.
- Suggested next games to complete.
- Suggested achievement targets for near-complete games.
- Completion distribution views.
- Rarity distribution views.
- Profile snapshots for historical tracking.
- Achievement goals.

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
- Privacy controls for comparison visibility.

## Phase 5: AI And Backlog Intelligence

- AI-assisted backlog explanations.
- AI-generated next-step plans for selected completion goals.
- AI summaries of recent progress.
- AI discovery for rare or interesting achievements.
- Recommendation explanations grounded in synced data.

## Phase 6: Multi-Platform Support

- Evaluate support for non-Steam platforms.
- Add platform-aware domain models only after Steam flows are stable.
- Normalize achievements, games, and profiles across platforms where practical.
- Keep platform-specific API payloads isolated from internal models.

## Decision

Build the roadmap in layers: reliable sync first, deterministic intelligence second, sharing third, social and AI later.

## Why

Each later phase depends on trustworthy profile, game, achievement, and sync data. Social and AI features will be weak if the core completion model is not accurate.

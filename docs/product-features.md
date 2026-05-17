# Product Features

## Product Positioning

Steam Achievement Intelligence Tracker is a completion-focused analytics product for Steam players. It tracks achievements, explains completion progress, identifies practical next targets, and helps players plan their backlog.

The product can take inspiration from public profile/stat tracking, completion dashboards, rarity discovery, and later social comparison patterns, but it should not copy another product's UI, branding, or community model.

## Core Features

### MVP

- Steam profile sync by Steam ID.
- Owned game library sync.
- Achievement metadata sync per game where Steam data is available.
- User achievement unlock sync.
- Dashboard summary with total games, completed games, total achievements, unlocked achievements, and completion percentage.
- Game library list with completion stats.
- Game details with achievements and unlock state.
- Nearest 100% games based on remaining achievements.
- Rarest unlocked achievements based on global rarity data where available.
- Sync history and latest sync status.

### V1

- Better filtering and sorting for games and achievements.
- Global Steam game browsing pages.
- Snapshot-backed public leaderboards for completion percentage, completed
  games, unlocked achievements, and rarest unlocks.
- Basic Steam game guides and achievement roadmaps.
- Completion bands such as complete, close, started, untouched, and low-progress.
- Recently completed games and recently unlocked achievements.
- Data freshness indicators per profile and per game.
- Manual resync controls with clear status feedback.

### V2

- Public profile pages.
- Shareable completion summaries.
- Historical progress charts.
- Goal tracking for selected games or achievements.
- Richer guide editing and achievement planning workflows.

### Later

- Import/export options.
- External profile embeds or widgets.

## Quality-Of-Life Features

### MVP

- Clear handling for private Steam profiles.
- Clear handling when games have no achievements.
- Clear handling when achievement metadata is missing.
- Sync failure state with safe, user-readable messages.
- Dashboard reads from stored data instead of calling Steam live on every page load.

### V1

- Library search by game name.
- Filters for completion percentage, playtime, achievement count, and rarity.
- Sort by closest completion, rarest unlocked, playtime, recently played, and total remaining achievements.
- Resync disabled or delayed when a recent sync is already fresh enough.

### V2

- Saved filters.
- Pinned games.
- Hidden/ignored games for backlog calculations.
- Custom completion preferences.

### Later

- Notification preferences.
- Exportable profile reports.
- Browser share cards or image summaries.

## Analytics Features

### MVP

- Overall achievement completion percentage.
- Completed game count.
- Remaining achievements count.
- Nearest 100% games.
- Rarest unlocked achievements.
- Per-game completion percentage.
- Per-game unlocked and locked achievement counts.

### V1

- Backlog difficulty signals based on remaining achievements, rarity, and playtime.
- Rarity distribution for unlocked achievements.
- Completion distribution across the owned library.
- Games grouped by practical completion effort.
- Stale progress detection for games with old playtime but unfinished achievements.
- Latest profile snapshots for leaderboard and progress foundations.

### V2

- Progress over time using profile snapshots.
- Completion velocity.
- Estimated effort tiers for 100% completion candidates.
- Achievement rarity trend views.

### Later

- Cross-profile benchmark analytics.
- Seasonal or monthly completion reports.
- Personalized achievement discovery.

## Social And Sharing Features

### MVP

- No friends or social comparison.

### V1

- Optional share links for static profile summaries if public profile support is ready.
- Public leaderboard v1 from latest profile snapshots.
- Public activity feed for synced profiles, guide/session events, and milestones.
- Milestone-derived badges and profile showcase customization.

### V2

- Public profile pages with privacy-aware data.
- Shareable rare achievement showcase.
- Shareable nearest-completion list.

### Later

- Friend comparison.
- Materialized, moderated, or group-specific leaderboards.
- Similar-player comparisons.
- Community showcases.

## Planner Features

### MVP

- Nearest 100% recommendations based on stored completion counts.
- Basic rarest unlocked achievement showcase.

### V1

- Backlog optimization using remaining achievements, rarity, and playtime.
- Suggested next games to complete.
- Suggested achievements to target in games already close to 100%.
- Basic authored roadmaps for game completion.
- Scheduled Steam game sessions for co-op and multiplayer achievement boosting.
- Snapshot-derived profile milestones for visible progress moments.
- Earned badge showcase on public Steam profiles.

### V2

- Achievement goals.
- Completion plans by game.
- Guide comments, voting, and report intake exist as a foundation; richer
  moderation workflows remain deferred.
- Ignore or defer games from recommendation calculations.
- Weekly or monthly completion targets.

### Later

- Calendar-style achievement planner.
- Session reminders and calendar export.
- Rich milestone artwork, share cards, and notification delivery.
- Completion campaigns across multiple games.

## Future AI-Assisted Features

### MVP

- AI recommendations are excluded.

### V1

- No AI requirement. Focus on deterministic analytics first.

### V2

- Prepare clean internal models and snapshots that could support future AI-assisted planning.

### Later

- AI backlog intelligence that explains why a game is a good next target.
- AI achievement planner that turns completion goals into practical steps.
- AI-generated progress summaries.
- AI-assisted rare achievement discovery.

## Decision

Prioritize deterministic tracking, analytics, and planner foundations before AI or social features.

The frontend should present these foundations as a coherent Steam achievement
hunting platform: profile dashboards, global game hubs, leaderboards, guides,
sessions, activity, milestones, badges, and public showcases should all be
discoverable from the primary navigation.

## Why

The product needs reliable Steam sync, correct stored stats, and useful completion metrics before advanced recommendations or sharing features can be trusted.

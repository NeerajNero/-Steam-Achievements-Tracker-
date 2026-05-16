# Steam API Notes

Steam API integration is not implemented yet.

## Planned Boundary

- Load `STEAM_API_KEY` only in the backend.
- Use `STEAM_API_BASE_URL` for the Steam Web API base URL.
- Keep external HTTP calls inside a dedicated Steam API client/provider.
- Normalize Steam responses before passing data into sync or persistence layers.

## Cases To Handle Later

- Private profiles.
- Invalid Steam IDs.
- Missing Steam API key.
- Timeouts and rate limits.
- Games with no achievements.
- Games with achievements but unavailable metadata.
- Profiles with zero owned games.

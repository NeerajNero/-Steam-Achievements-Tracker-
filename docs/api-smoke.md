# API Smoke Checks

Run the development seed first:

```sh
docker-compose exec backend pnpm seed:dev
```

Then run the scripted smoke check:

```sh
docker-compose exec backend pnpm api:smoke
```

The script uses `API_BASE_URL` when provided and otherwise calls
`http://localhost:3000`, which works from the backend container because the Nest
dev server runs in the same container.

## Curl Examples

From the host machine:

```sh
curl http://localhost:3000/health
curl http://localhost:3000/profiles/76561198000000000
curl http://localhost:3000/profiles/76561198000000000/summary
curl "http://localhost:3000/profiles/76561198000000000/games"
curl "http://localhost:3000/profiles/76561198000000000/games?status=completed"
curl "http://localhost:3000/profiles/76561198000000000/games/nearest-completions"
curl "http://localhost:3000/profiles/76561198000000000/achievements/rarest"
curl "http://localhost:3000/profiles/76561198000000000/sync-runs"
curl "http://localhost:3000/profiles/76561198000000000/games/910002"
curl "http://localhost:3000/profiles/76561198000000000/games/910002/achievements"
```

These endpoints are database-backed only. They do not call the live Steam API.

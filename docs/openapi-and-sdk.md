# OpenAPI And SDK

OpenAPI is the backend-to-frontend API contract. Future frontend code should use
the generated TypeScript SDK instead of hand-written fetch wrappers.

## Local URLs

- Backend tools home: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

Swagger is enabled by default outside production. Set `OPENAPI_ENABLED=false` to
disable it locally, or `OPENAPI_ENABLED=true` to explicitly enable it in a
production-like environment.

## Generated Files

OpenAPI JSON is generated at:

```txt
docs/openapi/openapi.json
```

The TypeScript SDK package lives at:

```txt
libs/client-sdk
```

Generated SDK internals live under:

```txt
libs/client-sdk/src/generated
```

Do not manually edit generated files. Update backend controllers/DTOs, regenerate
OpenAPI, then regenerate the SDK.

## Commands

Generate OpenAPI JSON:

```sh
pnpm openapi:generate
```

Generate the SDK from the local OpenAPI JSON:

```sh
pnpm sdk:generate
```

Build the SDK package:

```sh
pnpm --filter @steam-achievement/client-sdk build
```

Convenience root script:

```sh
pnpm sdk:build
```

## Frontend Consumption

Frontend packages should import generated clients from the workspace SDK:

```ts
import { Configuration, ProfilesApi } from '@steam-achievement/client-sdk';

const profilesApi = new ProfilesApi(
  new Configuration({ basePath: 'http://localhost:3000' }),
);
```

React Query hooks should wrap SDK calls later. Keep cache keys and UI loading
state in the frontend layer; keep request/response types in the generated SDK.
Do not add raw fetch wrappers for endpoints that already exist in the SDK.

Current frontend SDK setup:

```txt
apps/web/src/lib/api/client.ts
```

Frontend hooks should import the configured clients from that file. Do not
instantiate SDK clients in page components, reusable UI components, or random
feature files.

The shared SDK configuration includes `credentials: "include"` so auth session
cookies work for `AuthApi.getCurrentUser` and `AuthApi.logout` without changing
the browser API base URL.

Account and public profile SDK calls use the same shared configuration. The
frontend should use the generated `AccountApi` for authenticated settings and
`PublicProfilesApi` for `/public-profiles/:slug`.

Generated DTOs and enums should be reused directly in frontend hooks and
components. Frontend-local types should describe only UI state, component props,
or derived view models.

## Backend Documentation Rules

- Add stable `operationId` values for every endpoint.
- Keep `class-validator` decorators aligned with Swagger decorators.
- Use explicit enum metadata for query/body enum fields.
- Use explicit response DTO classes with `@ApiProperty` metadata.
- Keep controllers thin; Swagger annotations describe the contract but do not add
  business logic.
- Do not document secrets or backend-only environment values such as
  `STEAM_API_KEY`.

## Reference Practices Adopted

The `in-old-news` reference project uses Swagger as the backend contract and
generates a TypeScript fetch SDK for frontend consumption. This project adopts
that contract-first workflow while avoiding unrelated patterns that conflict
with current constraints, such as Prisma/TypeORM schema flows, auth, or frontend
UI implementation.

## Regeneration Workflow

1. Change backend DTOs/controllers.
2. Run `pnpm --filter @steam-achievement/backend test`.
3. Run `pnpm openapi:generate`.
4. Review `docs/openapi/openapi.json`.
5. Run `pnpm sdk:generate`.
6. Run `pnpm --filter @steam-achievement/client-sdk build`.
7. Run `pnpm sdk:build` before handing frontend contract changes over.

After regeneration, run the web checks too:

```sh
pnpm --filter @steam-achievement/web type-check
pnpm --filter @steam-achievement/web build
```

## Current Notes

- The generated SDK currently uses the OpenAPI Generator `typescript-fetch`
  output structure under `src/generated/src`.
- The hand-written SDK entrypoint is `libs/client-sdk/src/index.ts`.
- OpenAPI generator requires Java and downloads the pinned generator JAR on first
  run.
- `enqueueProfileSync` now accepts `scope: "profile" | "games" |
  "achievements"` and optional `appIds` for selected achievement sync.
- `AuthApi` is generated for `GET /auth/me` and `POST /auth/logout`.
  `GET /auth/steam/login` and `GET /auth/steam/callback` are redirect endpoints;
  the frontend starts login by browser navigation rather than by fetching JSON.
- `AccountApi` is generated for authenticated account, preferences, and public
  profile settings endpoints.
- `PublicProfilesApi` is generated for public slug lookups.

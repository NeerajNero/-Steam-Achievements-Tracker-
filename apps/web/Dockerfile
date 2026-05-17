# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /workspace

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY libs/client-sdk/package.json libs/client-sdk/package.json

RUN pnpm install --filter @steam-achievement/web... --frozen-lockfile

FROM base AS development

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /workspace/libs/client-sdk/node_modules ./libs/client-sdk/node_modules
COPY . .

WORKDIR /workspace/apps/web

EXPOSE 3000

CMD ["pnpm", "dev"]

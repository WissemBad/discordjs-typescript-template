# syntax=docker/dockerfile:1

ARG BUN_IMAGE=oven/bun:1.3.11-debian

FROM ${BUN_IMAGE} AS base
WORKDIR /app

COPY package.json bun.lock tsconfig.json biome.json prisma.config.ts ./
COPY apps/runtime/package.json apps/runtime/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/logger/package.json packages/logger/package.json

RUN bun install --frozen-lockfile

FROM base AS runtime
WORKDIR /app

COPY . .

ENV NODE_ENV=production
ENV API_PORT=3000
ENV DATABASE_URL=file:/data/app.db

RUN bun run db:generate
RUN mkdir -p /data && chown -R bun:bun /app /data

USER bun

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD bun -e "const port = process.env.API_PORT || '3000'; const response = await fetch(`http://127.0.0.1:${port}/health`); process.exit(response.ok ? 0 : 1);"

CMD ["sh", "-c", "bunx --bun prisma migrate deploy && bun run start"]

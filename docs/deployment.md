# Deployment

The most reliable production command is still Bun running TypeScript directly:

```bash
bun install --frozen-lockfile
bun run db:generate
bunx --bun prisma migrate deploy
bun run start
```

`bun run build` is kept as a packaging check. It generates Prisma first and bundles the runtime with external packages:

```bash
bun run build
```

Do not switch production to `dist/main.js` without testing it in the target environment with your real database adapter.

## Docker

```bash
docker compose up --build
```

The compose file stores SQLite data in the `bot-data` volume and runs Prisma migrations on container start.
Avoid sharing `docker compose config` output: Docker expands values from `.env`, including Discord tokens.

For a managed database, change `DATABASE_URL` and the Prisma datasource provider before deploying.

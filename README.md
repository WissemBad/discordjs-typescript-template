<div align="center">

# Discord JS Bot Template

Modern, feature-first Discord bot template built with Bun, TypeScript, discord.js, Express and Prisma.

[![Bun](https://img.shields.io/badge/Bun-1.3.11-000?logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![discord.js](https://img.shields.io/badge/discord.js-14.26.4-5865f2?logo=discord&logoColor=white)](https://discord.js.org)
[![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2d3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Biome](https://img.shields.io/badge/Biome-2.4.15-60a5fa?logo=biome&logoColor=white)](https://biomejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

## Why this template?

- **Full Bun**: runtime, package manager, scripts and tests.
- **Feature-first architecture**: each feature owns its commands, events, components, modals, routes and services.
- **Modern Discord examples**: slash commands, embeds, buttons, select menus, modals and Components V2.
- **Clean backend surface**: Express API, request logging, API key auth, Prisma repositories and graceful shutdown.
- **Public-ready tooling**: Biome, Bun tests, Docker, GitHub Actions CI and release workflow.

## Quick Start

```bash
bun install
cp .env.example .env
bun run db:generate
bun run db:migrate
bun run db:seed
bun run dev
```

Fill `.env` with your Discord application credentials before starting the bot.

```txt
DISCORD_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=... # required only for guild command deployment
DATABASE_URL=file:./dev.db
API_PORT=3000
API_KEY=...
```

## Project Layout

```txt
apps/runtime            # Discord client + Express API in one Bun process
packages/core           # contracts, registries, guards, custom ids, safe replies
packages/config         # fail-fast env validation
packages/logger         # shared logger
packages/database       # Prisma schema, generated client, repositories
docs/                   # short operational docs
```

Features live in `apps/runtime/src/features/<feature-name>` and depend only on stable contracts such as `AppContext`, `Database`, `Logger`, `Config` and registries.

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the runtime in watch mode |
| `bun run start` | Start the runtime with Bun |
| `bun run build` | Generate Prisma and bundle the runtime as a packaging check |
| `bun run check` | Run Biome lint, format check and import sorting check |
| `bun run check:write` | Apply Biome fixes |
| `bun run typecheck` | Run strict TypeScript checks |
| `bun test` | Run unit tests |
| `bun run db:migrate` | Run Prisma migrations |
| `bun run commands:deploy` | Deploy global slash commands |
| `bun run commands:deploy:guild` | Deploy development guild slash commands |
| `bun run commands:reset` | Reset registered slash commands |

## Included Examples

- `/ping` simple slash command.
- `/echo` command with options.
- `/components` command showing embeds, buttons, link buttons, select menus, modals and Components V2.
- `/debug features` admin command backed by Prisma feature flags.
- Express routes for health, status, Discord message sending and feature-owned configuration.

## Components V2

The template uses official `discord.js@14.26.4` builders such as `ContainerBuilder`, `TextDisplayBuilder`, `SectionBuilder`, `SeparatorBuilder`, `ThumbnailBuilder` and `MediaGalleryBuilder`.

Components V2 messages use `MessageFlags.IsComponentsV2`. Do not mix V2 messages with classic `content` or `embeds`; keep those in regular messages.

## API

Core routes:

```txt
GET  /health
GET  /status
POST /bot/messages
```

Protected routes require `x-api-key`. Add rate limiting or a reverse proxy before exposing the API publicly.

## Docker

```bash
docker compose up --build
```

The image runs as the non-root `bun` user and stores SQLite data in the `bot-data` volume.

## CI/CD

GitHub Actions are included:

- `ci.yml`: install, Prisma generate, Biome, typecheck, tests, build and Docker build.
- `release.yml`: on `v*` tags, run the quality gate and publish `.zip`, `.tar.gz` and `SHA256SUMS.txt`.
- `dependabot-auto-merge.yml`: approves safe Dependabot updates and lets branch protection merge them after CI passes.

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Documentation

- [Architecture](docs/architecture.md)
- [Features](docs/features.md)
- [Deployment](docs/deployment.md)
- [CI/CD](docs/ci-cd.md)
- [Security Notes](docs/security.md)
- [Public Release Checklist](docs/public-release.md)

## License

MIT. See [LICENSE](LICENSE).

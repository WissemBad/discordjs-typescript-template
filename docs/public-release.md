# Public Release Checklist

This template is ready to publish when these checks pass on a clean clone:

```bash
bun install --frozen-lockfile
bun run db:generate
bun run typecheck
bun run check
bun test
bun run build
```

The same gate runs in GitHub Actions on pull requests and pushes to `main`.

## Known tradeoffs

- SQLite is convenient for templates and small bots. Move to Postgres before running a busy public bot.
- The API uses a static key. Put it behind a reverse proxy and add rate limiting if it is reachable from the internet.
- Feature flags are operational switches, not permission boundaries.
- Global slash command deploys may take time to propagate. Use guild deploys during development.
- Components V2 support should be rechecked when upgrading discord.js.
- `bun run build` verifies bundling, but direct Bun TypeScript runtime remains the recommended production path unless `dist/main.js` is tested in the target environment.

## Before publishing a derived bot

- Rotate all Discord and API secrets.
- Replace example copy, images and routes that do not belong in production.
- Review Discord command permissions and default member permissions.
- Add backups and monitoring for the chosen database.
- Add request rate limits if API routes can be called by untrusted clients.
- Pin dependency updates through reviewed PRs rather than using `latest`.
- Push tags as `vX.Y.Z` to create a GitHub Release with source archives and checksums.

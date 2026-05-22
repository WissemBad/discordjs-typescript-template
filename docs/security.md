# Security Notes

Before publishing a bot built from this template:

- Rotate `DISCORD_TOKEN` if it has ever been pasted into a chat, issue, log or screenshot.
- Use a long random `API_KEY`; do not reuse the Discord token.
- Keep `/bot/messages` protected, and add rate limits before exposing the API to the internet.
- Review command permissions before global command deployment.
- Treat feature flags as operational controls, not as authorization.
- Keep dependencies pinned and update them deliberately.
- Do not commit `.env`, local database files, generated Prisma client output or IDE folders.
- Run containers as a non-root user. The included Dockerfile switches to the `bun` user after dependency installation and Prisma generation.

The template uses SQLite for quick local use. For larger public bots, prefer Postgres or another managed database with backups.

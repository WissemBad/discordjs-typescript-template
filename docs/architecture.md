# Architecture

The runtime is intentionally small: one Bun process starts the Discord client and the Express API. This keeps the API able to talk to the connected bot without a queue, websocket bridge or second service.

Workspace boundaries:

- `apps/runtime`: application entrypoint, API server, Discord router and features.
- `@bot/core`: public contracts used by features.
- `@bot/config`: fail-fast environment loading.
- `@bot/logger`: shared logger factory.
- `@bot/database`: Prisma client ownership and repositories.

Features are loaded from `apps/runtime/src/features/index.ts`. A feature may register commands, events, buttons, select menus, modals, routes and jobs. It should not import another feature directly.

## Startup

1. Load config.
2. Create logger.
3. Connect database.
4. Create Discord client.
5. Load feature manifests.
6. Register handlers.
7. Start Express.
8. Login Discord.

Shutdown closes the HTTP server, stops jobs, calls feature teardowns, destroys the Discord client and disconnects Prisma.

import { loadFeatures } from "@bot/core";
import { createApiServer } from "./api/create-api-server";
import { createAppContext } from "./app/create-app-context";
import { installDiscordRouter } from "./discord/interaction-router";
import { features } from "./features";

const ctx = await createAppContext();
let apiServer: ReturnType<typeof createApiServer> | undefined;

try {
  await loadFeatures(ctx, features);
  installDiscordRouter(ctx);

  for (const job of ctx.registries.jobs.values()) {
    await job.start(ctx);
  }

  apiServer = createApiServer(ctx);
  await ctx.client.login(ctx.config.discordToken);
} catch (error) {
  ctx.logger.error(
    { error: error instanceof Error ? error.message : String(error) },
    "Startup failed",
  );
  await shutdown(1);
}

process.on("SIGINT", () => void shutdown(0));
process.on("SIGTERM", () => void shutdown(0));

async function shutdown(exitCode: number): Promise<void> {
  ctx.logger.info("Shutting down");

  await new Promise<void>((resolve) => {
    if (!apiServer) {
      resolve();
      return;
    }
    apiServer.close(() => resolve());
  });

  for (const job of ctx.registries.jobs.values()) {
    await job.stop?.(ctx);
  }

  for (const feature of [...ctx.registries.features.values()].reverse()) {
    await feature.teardown?.(ctx);
  }

  ctx.client.destroy();
  await ctx.database.disconnect();
  process.exit(exitCode);
}

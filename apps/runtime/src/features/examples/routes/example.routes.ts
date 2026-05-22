import { type ApiRouteDefinition, apiKeyRequired } from "@bot/core";
import { Router } from "express";
import { z } from "zod";

const guildConfigSchema = z.object({
  prefix: z.string().min(1).max(8),
});

const featureFlagSchema = z.object({
  enabled: z.boolean(),
});

/** Feature-owned API routes: mounted by the runtime, implemented beside the feature services. */
export const exampleRoutes: ApiRouteDefinition = {
  basePath: "/features/examples",
  buildRouter: (ctx) => {
    const router = Router();

    router.use(apiKeyRequired(ctx.config));

    router.get("/guilds/:guildId/config", async (req, res, next) => {
      try {
        const config = await ctx.database.repositories.guildConfigs.findByGuildId(
          req.params.guildId,
        );
        res.json({ config });
      } catch (error) {
        next(error);
      }
    });

    router.put("/guilds/:guildId/config", async (req, res, next) => {
      try {
        const body = guildConfigSchema.parse(req.body);
        await ctx.database.repositories.guildConfigs.upsertPrefix(req.params.guildId, body.prefix);
        res.json({ guildId: req.params.guildId, prefix: body.prefix });
      } catch (error) {
        next(error);
      }
    });

    router.get("/guilds/:guildId/features", async (req, res, next) => {
      try {
        const flags = await ctx.database.repositories.featureFlags.listForGuild(req.params.guildId);
        res.json({ flags });
      } catch (error) {
        next(error);
      }
    });

    router.patch("/guilds/:guildId/features/:featureName", async (req, res, next) => {
      try {
        const body = featureFlagSchema.parse(req.body);
        const flag = await ctx.database.repositories.featureFlags.setEnabled(
          req.params.guildId,
          req.params.featureName,
          body.enabled,
        );
        res.json({ flag });
      } catch (error) {
        next(error);
      }
    });

    return router;
  },
};

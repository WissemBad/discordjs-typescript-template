import type { Server } from "node:http";
import {
  type AppContext,
  apiKeyRequired,
  createApiErrorMiddleware,
  NotFoundError,
} from "@bot/core";
import express, { type RequestHandler } from "express";
import { z } from "zod";

const sendMessageSchema = z.object({
  channelId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

export function createApiServer(ctx: AppContext): Server {
  const app = express();

  app.use(express.json());
  app.use(requestId());
  app.use(requestLogger(ctx));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get("/status", apiKeyRequired(ctx.config), (_req, res) => {
    res.json({
      botReady: ctx.client.isReady(),
      guildCount: ctx.client.guilds.cache.size,
      startedAt: ctx.startedAt.toISOString(),
      uptimeSeconds: Math.floor((Date.now() - ctx.startedAt.getTime()) / 1000),
      user: ctx.client.user
        ? {
            id: ctx.client.user.id,
            tag: ctx.client.user.tag,
          }
        : null,
    });
  });

  app.post("/bot/messages", apiKeyRequired(ctx.config), async (req, res, next) => {
    try {
      const body = sendMessageSchema.parse(req.body);
      const channel = await ctx.client.channels.fetch(body.channelId);

      if (!channel?.isTextBased() || channel.isDMBased()) {
        throw new NotFoundError("Target channel is not a guild text-based channel.");
      }

      const message = await channel.send({ content: body.content });
      res.status(201).json({ channelId: message.channelId, messageId: message.id });
    } catch (error) {
      next(error);
    }
  });

  for (const route of ctx.registries.routes) {
    app.use(route.basePath, ...(route.guards ?? []), route.buildRouter(ctx));
  }

  app.use(createApiErrorMiddleware(ctx.logger));

  return app.listen(ctx.config.apiPort, () => {
    ctx.logger.info({ port: ctx.config.apiPort }, "API server listening");
  });
}

function requestId(): RequestHandler {
  return (req, res, next) => {
    const incomingRequestId = req.header("x-request-id");
    const requestId = isSafeRequestId(incomingRequestId) ? incomingRequestId : crypto.randomUUID();
    req.headers["x-request-id"] = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  };
}

function isSafeRequestId(value: string | undefined): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9._:-]{1,128}$/.test(value);
}

function requestLogger(ctx: AppContext): RequestHandler {
  return (req, res, next) => {
    const startedAt = performance.now();
    res.on("finish", () => {
      ctx.logger.info(
        {
          durationMs: Math.round(performance.now() - startedAt),
          method: req.method,
          path: req.path,
          requestId: req.header("x-request-id"),
          statusCode: res.statusCode,
        },
        "API request completed",
      );
    });
    next();
  };
}

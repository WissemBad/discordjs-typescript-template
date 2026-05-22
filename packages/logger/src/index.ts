import type { Logger } from "@bot/core";
import pino from "pino";

export function createLogger(level = "info"): Logger {
  return pino({
    level,
    transport:
      process.env.NODE_ENV === "production"
        ? undefined
        : {
            options: {
              colorize: true,
              ignore: "pid,hostname",
              translateTime: "HH:MM:ss",
            },
            target: "pino-pretty",
          },
  }) as Logger;
}

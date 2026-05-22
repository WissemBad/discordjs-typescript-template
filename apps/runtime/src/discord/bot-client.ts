import { Client, GatewayIntentBits, Partials } from "discord.js";

export class BotClient extends Client {
  constructor() {
    super({
      intents: [GatewayIntentBits.Guilds],
      partials: [Partials.Channel],
    });
  }

  get uptimeSeconds(): number {
    return Math.floor((this.uptime ?? 0) / 1000);
  }
}

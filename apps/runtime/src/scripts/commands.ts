import { loadConfig } from "@bot/config";
import { AppRegistries } from "@bot/core";
import { REST, Routes } from "discord.js";
import { features } from "../features";

const action = process.argv[2];
const config = loadConfig({ requireGuildId: action === "deploy:guild" });
const rest = new REST({ version: "10" }).setToken(config.discordToken);
const registries = new AppRegistries();

for (const feature of features) {
  registries.registerFeature(feature);
}

const commandPayloads = registries.toCommandPayloads();

switch (action) {
  case "deploy:global": {
    await rest.put(Routes.applicationCommands(config.discordClientId), { body: commandPayloads });
    console.log(`Deployed ${commandPayloads.length} global command(s).`);
    break;
  }
  case "deploy:guild": {
    await rest.put(
      Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId ?? ""),
      {
        body: commandPayloads,
      },
    );
    console.log(`Deployed ${commandPayloads.length} guild command(s).`);
    break;
  }
  case "reset": {
    await rest.put(Routes.applicationCommands(config.discordClientId), { body: [] });
    if (config.discordGuildId) {
      await rest.put(
        Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
        {
          body: [],
        },
      );
    }
    console.log("Reset application commands.");
    break;
  }
  default: {
    throw new Error(
      "Usage: bun apps/runtime/src/scripts/commands.ts deploy:global|deploy:guild|reset",
    );
  }
}

import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { commands } from "./commands.js";

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

try {
  if (config.DISCORD_GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.DISCORD_GUILD_ID), { body: commands });
    console.log("Registered Airi commands in test guild:", config.DISCORD_GUILD_ID);
  } else {
    await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), { body: commands });
    console.log("Registered Airi global commands. Global propagation may take time.");
  }
} catch (error) {
  console.error("Failed to register slash commands:", error);
  process.exitCode = 1;
}

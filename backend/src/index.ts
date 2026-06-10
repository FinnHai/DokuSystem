import { createApp } from "./app";
import { config } from "./config";
import { initDb } from "./db";
import { logger } from "./logger";
import { seedDemoData } from "./seed";

async function main(): Promise<void> {
  await initDb();
  if (config.seedDemoData) {
    await seedDemoData();
  }
  const app = createApp();
  app.listen(config.port, () => {
    logger.info(`BesiDoc-Backend läuft auf Port ${config.port}`);
  });
}

main().catch((err) => {
  logger.error({ err }, "Start fehlgeschlagen");
  process.exit(1);
});

import { env } from './env.js';
import { connectMongo, disconnectMongo } from './db.js';
import { logger } from '../utils/logger.js';
import { buildApp } from '../app.js';

const app = buildApp();

async function start() {
  try {
    await connectMongo(env.mongoUri);
    const server = app.listen(env.port, () => {
      logger.info({ port: env.port }, 'User service started');
    });

    const shutdown = async (signal) => {
      logger.info({ signal }, 'Shutting down');
      server.close(async () => {
        await disconnectMongo();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    logger.error({ err }, 'Failed to start');
    process.exit(1);
  }
}

start();

/**
 * HTTP server bootstrap
 *
 * Connects to MongoDB, starts the Express server, and wires up basic
 * process level handlers for graceful shutdown.
 */

import http from 'http';
import app from '../app.js';
import { env } from './env.js';
import { connectMongo, disconnectMongo } from './db.js';
import { logger } from '../utils/logger.js';

let server;

/**
 * Start the application.
 * 1) Connect to Mongo
 * 2) Start the HTTP server
 */
export async function start() {
  try {
    await connectMongo(env.mongoUri);

    server = http.createServer(app);
    server.listen(env.port, () => {
      logger.info({ port: env.port }, 'User service started');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start');
    process.exit(1);
  }
}

/**
 * Gracefully stop the server and close Mongo connection.
 */
export async function stop() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectMongo();
}

// Handle Ctrl C and platform stops
process.on('SIGINT', async () => {
  logger.info('Stopping on SIGINT');
  await stop();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  logger.info('Stopping on SIGTERM');
  await stop();
  process.exit(0);
});

// Helpful for unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});

// Start if invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

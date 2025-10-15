/**
 * Mongo connection helper
 *
 * Exposes connectMongo and disconnectMongo.
 * Adds lightweight retry logic so the app does not crash if Mongo is briefly unavailable.
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const RETRIES = 10;          // number of attempts before failing
const DELAY_MS = 1000;       // delay between attempts
const SELECT_TIMEOUT = 5000; // server selection timeout per attempt

/**
 * Connect to MongoDB using the provided URI.
 * @param {string} uri - Full Mongo connection string
 */
export async function connectMongo(uri) {
  if (!uri) {
    throw new Error('Missing MongoDB URI');
  }

  mongoose.set('strictQuery', true);

  // Useful connection lifecycle logs
  mongoose.connection.on('connected', () => logger.info('Mongo connected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'Mongo error'));
  mongoose.connection.on('disconnected', () => logger.warn('Mongo disconnected'));

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: SELECT_TIMEOUT
      });
      // success
      return;
    } catch (err) {
      const remaining = RETRIES - attempt;
      logger.warn({ attempt, remaining, err: err?.message }, 'Mongo connect failed');
      if (attempt === RETRIES) throw err;
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }
}

/**
 * Close the MongoDB connection.
 */
export async function disconnectMongo() {
  await mongoose.disconnect();
}

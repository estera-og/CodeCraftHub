/**
 * Application logger
 *
 * Central logging using pino.
 * - Structured JSON logs by default (fast and suitable for production).
 * - Log level comes from env.LOG_LEVEL (default "info").
 */

import pino from 'pino';
import { env } from '../config/env.js';

/**
 * Export a singleton logger so every module logs consistently.
 * Example:
 *   import { logger } from '../utils/logger.js'
 *   logger.info({ userId }, 'User created')
 */
export const logger = pino({
  level: env.logLevel
});

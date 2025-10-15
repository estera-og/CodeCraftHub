/**
 * Central error handler
 *
 * Converts thrown or passed errors into consistent JSON responses.
 * Logs server errors once through the central logger to avoid duplicate stack traces.
 */

import { logger } from './logger.js';

/**
 * Express error-handling middleware
 * @param {any} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
export function errorHandler(err, _req, res, _next) {
  // Log internal errors
  if (err && err.stack) {
    logger.error({ err }, 'request failed');
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: { message } });
}

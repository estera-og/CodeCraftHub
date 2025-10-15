/**
 * Environment configuration
 *
 * Reads settings from process.env and provides typed, safe defaults for development.
 * Centralising this avoids sprinkling process.env access across the codebase.
 */

import 'dotenv/config';

function parseList(v) {
  if (!v) return [];
  return v.split(',').map(s => s.trim()).filter(Boolean);
}

export const env = {
  /** Node environment. Usually development or production. */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** Port the HTTP server listens on. */
  port: Number(process.env.PORT || 3000),

  /** Mongo connection string. Example:
   *  mongodb://user:pass@host:27017/userdb?authSource=admin
   */
  mongoUri: process.env.MONGO_URI,

  /** JWT secrets and time to live. Use strong values in production. */
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
  accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTtl: process.env.REFRESH_TOKEN_TTL || '7d',

  /** Allowed CORS origins as a comma separated list. Example:
   *  http://localhost:5173,https://your-frontend.example.com
   */
  corsOrigins: parseList(process.env.CORS_ORIGINS),

  /** Log level. Options depend on logger, typical values: debug, info, warn, error. */
  logLevel: process.env.LOG_LEVEL || 'info'
};

/**
 * Basic required checks
 * It is acceptable to start in development with defaults, but fail fast if critical
 * values are missing in production.
 */
if (env.nodeEnv === 'production') {
  if (!env.mongoUri) throw new Error('MONGO_URI is required in production');
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets are required in production');
  }
}

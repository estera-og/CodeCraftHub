/**
 * Express application
 *
 * Wires up middleware, routes, and error handling.
 * This file does not start the HTTP server. See src/config/server.js for that.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

// --- Swagger UI ---
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openapi = YAML.load(path.join(__dirname, 'docs/openapi.yaml'));
// --- end Swagger UI ---

import { env } from './config/env.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './utils/errorHandler.js';

const app = express();

/**
 * Security and parsing middleware
 * - helmet: sets safe HTTP headers
 * - cors: restricts cross origin requests based on env
 * - express.json: parses JSON request bodies
 */
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // If no origins configured, allow all during development
      if (!env.corsOrigins || env.corsOrigins.length === 0) return cb(null, true);
      if (!origin) return cb(null, true); // allow curl and same origin
      const allowed = env.corsOrigins.includes(origin);
      return cb(allowed ? null : new Error('Not allowed by CORS'), allowed);
    },
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));

/**
 * Request logging
 * morgan logs concise request details. In production you could switch to a JSON format.
 */
app.use(morgan('tiny'));

/**
 * Rate limits
 * - A gentle global limit for all routes
 * - A stricter limit for login to slow credential stuffing
 */
const globalLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 300
});
app.use(globalLimiter);

const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: 20
});
app.use('/users/login', loginLimiter);

/**
 * Health check
 * Useful for uptime monitors and container orchestrators.
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Swagger UI (interactive API docs) at /docs
 */
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));

/**
 * User routes
 * Mounted under /users
 */
app.use('/users', userRoutes);

/**
 * Fallback for unknown routes
 */
app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Not found' } });
});

/**
 * Central error handler
 * Converts thrown errors into consistent JSON responses.
 */
app.use(errorHandler);

export default app;

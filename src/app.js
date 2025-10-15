import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './utils/errorHandler.js';
import userRoutes from './routes/userRoutes.js';

export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(hpp());
  app.use(
    cors({
      origin: env.corsOrigins.length ? env.corsOrigins : true,
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('combined'));

  // Basic global rate limit
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/users', userRoutes);

  app.use((req, res) => res.status(404).json({ error: { message: 'Not found' } }));
  app.use(errorHandler);

  return app;
}

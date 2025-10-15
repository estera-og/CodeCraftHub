import 'dotenv/config';

function required(name, value) {
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongoUri: required('MONGO_URI', process.env.MONGO_URI),
  jwtAccessSecret: required('JWT_ACCESS_SECRET', process.env.JWT_ACCESS_SECRET),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET),
  accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  logLevel: process.env.LOG_LEVEL || 'info'
};

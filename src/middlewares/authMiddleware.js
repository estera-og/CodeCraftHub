import createError from 'http-errors';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Reads Bearer token, verifies, and sets req.user
export function requireAuth(req, _res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) throw createError(401, 'Missing token');

    const payload = jwt.verify(token, env.jwtAccessSecret);
    req.user = payload;
    next();
  } catch (_e) {
    next(createError(401, 'Unauthorised'));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createError(403, 'Forbidden'));
    }
    next();
  };
}

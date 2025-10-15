/**
 * Auth middleware
 *
 * Verifies JSON Web Tokens on incoming requests and attaches a `user` claim
 * to `req` when present. Also provides a simple role check.
 *
 * Usage:
 *   router.get('/me', requireAuth, controller.me)
 *   router.get('/admin', requireAuth, requireRole('admin'), controller.admin)
 */

import createError from 'http-errors';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Parse a Bearer token from the Authorization header.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function getBearerToken(req) {
  const h = req.headers.authorization || '';
  const parts = h.split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return null;
}

/**
 * Require that the request has a valid access token.
 * On success, sets `req.user` to the decoded JWT payload.
 */
export function requireAuth(req, _res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) throw createError(401, 'Unauthorised');

    const payload = jwt.verify(token, env.jwtAccessSecret);
    // Keep only the essentials on req.user
    req.user = { sub: payload.sub, role: payload.role };
    next();
  } catch (_e) {
    next(createError(401, 'Unauthorised'));
  }
}

/**
 * Require a specific role for the route.
 * Example: `requireRole('admin')`
 * If the user does not have the role, responds with 403.
 * @param {'student' | 'mentor' | 'admin'} role
 */
export function requireRole(role) {
  return function roleGuard(req, _res, next) {
    if (!req.user || !req.user.role) {
      return next(createError(401, 'Unauthorised'));
    }
    if (req.user.role !== role) {
      return next(createError(403, 'Forbidden'));
    }
    return next();
  };
}

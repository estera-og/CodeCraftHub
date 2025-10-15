/**
 * User controller
 *
 * Handles HTTP requests and responses for user related tasks.
 * Validates input, calls the service layer, and shapes the output.
 * Security:
 *  - Never return password fields
 *  - Normalise emails before lookups
 *  - Use role claims in the access token for authorisation
 */

import createError from 'http-errors';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { userService } from '../services/userService.js';
import { env } from '../config/env.js';

/**
 * Remove sensitive fields before returning data to clients.
 * This is a final safety net. The model also hides some fields by default.
 */
const sanitize = (u) => {
  if (!u) return u;
  const { passwordHash, resetTokenHash, ...safe } = u;
  return safe;
};

/** Validation schemas */
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().max(120).allow(''),
  password: Joi.string().min(8).max(128).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateMeSchema = Joi.object({
  name: Joi.string().max(120)
}).min(1);

/** JWT helpers */
function signAccess(sub, claims = {}) {
  return jwt.sign({ sub, ...claims }, env.jwtAccessSecret, { expiresIn: env.accessTtl });
}
function signRefresh(sub) {
  return jwt.sign({ sub, typ: 'refresh' }, env.jwtRefreshSecret, { expiresIn: env.refreshTtl });
}

export const userController = {
  /**
   * POST /users/register
   * Create a new account. Returns the new id.
   */
  async register(req, res, next) {
    try {
      // validate body and remove unknown fields
      const { error, value } = registerSchema.validate(req.body || {}, {
        abortEarly: false,
        stripUnknown: true
      });
      if (error) {
        throw createError(400, error.details.map((d) => d.message).join(', '));
      }

      // normalise email for uniqueness
      const email = value.email.trim().toLowerCase();

      // prevent duplicate accounts
      const existing = await userService.getByEmail(email);
      if (existing) throw createError(409, 'Email already in use');

      // hash password and create user
      const passwordHash = await argon2.hash(value.password);
      const user = await userService.create({
        email,
        name: value.name || '',
        passwordHash,
        role: 'student'
      });

      res.status(201).json({ id: user._id });
    } catch (e) {
      next(e);
    }
  },

  /**
   * POST /users/login
   * Verify credentials and issue tokens.
   */
  async login(req, res, next) {
    try {
      const { error, value } = loginSchema.validate(req.body || {}, {
        abortEarly: false,
        stripUnknown: true
      });
      if (error) {
        throw createError(400, error.details.map((d) => d.message).join(', '));
      }

      const email = value.email.trim().toLowerCase();

      // include passwordHash for verification
      const user = await userService.getByEmail(email, { includePassword: true });
      if (!user || !user.passwordHash) throw createError(401, 'Invalid credentials');

      const ok = await argon2.verify(user.passwordHash, value.password);
      if (!ok) throw createError(401, 'Invalid credentials');

      // record successful login for audit and future policy
      await userService.updateById(user._id, {
        lastLoginAt: new Date(),
        failedLoginCount: 0
      });

      const access = signAccess(String(user._id), { role: user.role });
      const refresh = signRefresh(String(user._id));
      res.json({ accessToken: access, refreshToken: refresh });
    } catch (e) {
      next(e);
    }
  },

  /**
   * POST /users/refresh
   * Exchange a valid refresh token for a new access token.
   */
  async refresh(req, res, next) {
    try {
      const body = req.body || {};
      const token = body.refreshToken || null;
      if (!token) throw createError(400, 'Missing refresh token');

      const payload = jwt.verify(token, env.jwtRefreshSecret);
      if (payload.typ !== 'refresh') throw createError(401, 'Invalid token');

      const user = await userService.getById(payload.sub);
      if (!user) throw createError(401, 'Invalid token');

      const access = signAccess(String(user._id), { role: user.role });
      res.json({ accessToken: access });
    } catch (_e) {
      // conceal exact reason from clients
      next(createError(401, 'Invalid token'));
    }
  },

  /**
   * GET /users/me
   * Return the caller’s profile.
   */
  async me(req, res, next) {
    try {
      if (!req.user || !req.user.sub) throw createError(401, 'Unauthorised');
      const user = await userService.getById(req.user.sub);
      if (!user) throw createError(404, 'User not found');
      res.json(sanitize(user));
    } catch (e) {
      next(e);
    }
  },

  /**
   * PATCH /users/me
   * Update the caller’s own profile. Only safe fields are allowed.
   */
  async updateMe(req, res, next) {
    try {
      if (!req.user || !req.user.sub) throw createError(401, 'Unauthorised');
      const { error, value } = updateMeSchema.validate(req.body || {}, {
        abortEarly: false,
        stripUnknown: true
      });
      if (error) {
        throw createError(400, error.details.map((d) => d.message).join(', '));
      }

      const updated = await userService.updateById(req.user.sub, value);
      res.json(sanitize(updated));
    } catch (e) {
      next(e);
    }
  },

  /**
   * GET /users
   * Admin only. Returns paginated users with optional search.
   */
  async list(req, res, next) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;

      const data = await userService.list({ page, limit, q });
      res.json({ ...data, items: data.items.map(sanitize) });
    } catch (e) {
      next(e);
    }
  },

  /**
   * GET /users/:id
   * Admin only. Fetch a single user by id.
   */
  async getById(req, res, next) {
    try {
      const user = await userService.getById(req.params.id);
      if (!user) throw createError(404, 'User not found');
      res.json(sanitize(user));
    } catch (e) {
      next(e);
    }
  },

  /**
   * PATCH /users/:id
   * Admin only. Update role, name, or activation state.
   */
  async adminUpdate(req, res, next) {
    try {
      const patchSchema = Joi.object({
        name: Joi.string().max(120),
        role: Joi.string().valid('student', 'mentor', 'admin'),
        isActive: Joi.boolean()
      }).min(1);

      const { error, value } = patchSchema.validate(req.body || {}, {
        abortEarly: false,
        stripUnknown: true
      });
      if (error) {
        throw createError(400, error.details.map((d) => d.message).join(', '));
      }

      const updated = await userService.updateById(req.params.id, value);
      if (!updated) throw createError(404, 'User not found');
      res.json(sanitize(updated));
    } catch (e) {
      next(e);
    }
  }
};

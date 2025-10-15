import createError from 'http-errors';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { userService } from '../services/userService.js';
import { env } from '../config/env.js';

// Remove sensitive fields before returning to clients
const sanitize = (u) => {
  if (!u) return u;
  const { passwordHash, resetTokenHash, ...safe } = u;
  return safe;
};

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
  name: Joi.string().max(120),
  isActive: Joi.boolean()
}).min(1);

function signAccess(sub, claims = {}) {
  return jwt.sign({ sub, ...claims }, env.jwtAccessSecret, { expiresIn: env.accessTtl });
}
function signRefresh(sub) {
  return jwt.sign({ sub, typ: 'refresh' }, env.jwtRefreshSecret, { expiresIn: env.refreshTtl });
}

export const userController = {
  // Auth
  async register(req, res, next) {
    try {
      const { error, value } = registerSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) throw createError(400, error.details.map(d => d.message).join(', '));

      // normalise here
      const email = value.email.trim().toLowerCase();

      const existing = await userService.getByEmail(email);
      if (existing) throw createError(409, 'Email already in use');

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

  async login(req, res, next) {
    try {
      const { error, value } = loginSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) throw createError(400, error.details.map(d => d.message).join(', '));

      // normalise here
      const email = value.email.trim().toLowerCase();

      const user = await userService.getByEmail(email);
      if (!user || !user.passwordHash) throw createError(401, 'Invalid credentials');

      const ok = await argon2.verify(user.passwordHash, value.password);
      if (!ok) throw createError(401, 'Invalid credentials');

      // record successful login here
      await userService.updateById(user._id, { lastLoginAt: new Date(), failedLoginCount: 0 });

      const access = signAccess(String(user._id), { role: user.role });
      const refresh = signRefresh(String(user._id));

      res.json({ accessToken: access, refreshToken: refresh });
    } catch (e) {
      next(e);
    }
  },

  async refresh(req, res, next) {
    try {
      const token = req.body?.refreshToken;
      if (!token) throw createError(400, 'Missing refresh token');

      const payload = jwt.verify(token, env.jwtRefreshSecret);
      if (payload.typ !== 'refresh') throw createError(401, 'Invalid token');

      // Could also check a store for rotation in a fuller build
      const user = await userService.getById(payload.sub);
      if (!user) throw createError(401, 'Invalid token');

      const access = signAccess(String(user._id), { role: user.role });
      res.json({ accessToken: access });
    } catch (e) {
      next(createError(401, 'Invalid token'));
    }
  },

  // Self service
  async me(req, res, next) {
    try {
      const user = await userService.getById(req.user.sub);
      if (!user) throw createError(404, 'User not found');
      res.json(sanitize(user));
    } catch (e) {
      next(e);
    }
  },

  async updateMe(req, res, next) {
    try {
      const { error, value } = updateMeSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) throw createError(400, error.details.map(d => d.message).join(', '));
      const updated = await userService.updateById(req.user.sub, value);
      res.json(sanitize(updated));
    } catch (e) {
      next(e);
    }
  },

  // Admin
  async list(req, res, next) {
    try {
      const page = Number(req.query.page || 1);
      const limit = Math.min(Number(req.query.limit || 20), 100);
      const q = req.query.q;
      const data = await userService.list({ page, limit, q });
      // scrub items before returning
      res.json({ ...data, items: data.items.map(sanitize) });
    } catch (e) {
      next(e);
    }
  },

  async getById(req, res, next) {
    try {
      const user = await userService.getById(req.params.id);
      if (!user) throw createError(404, 'User not found');
      res.json(sanitize(user));
    } catch (e) {
      next(e);
    }
  },

  async adminUpdate(req, res, next) {
    try {
      const patchSchema = Joi.object({
        name: Joi.string().max(120),
        role: Joi.string().valid('student', 'mentor', 'admin'),
        isActive: Joi.boolean()
      }).min(1);

      const { error, value } = patchSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) throw createError(400, error.details.map(d => d.message).join(', '));

      const updated = await userService.updateById(req.params.id, value);
      if (!updated) throw createError(404, 'User not found');
      res.json(sanitize(updated));
    } catch (e) {
      next(e);
    }
  }
};

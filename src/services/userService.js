/**
 * User service
 *
 * Thin data-access layer over the User model.
 * Keeps controllers free of persistence details and makes testing simpler.
 */

import { User } from '../models/userModel.js';

export const userService = {
  /**
   * Create a new user.
   * The controller is responsible for hashing the password before calling this.
   * @param {Object} data - Partial user document
   * @returns {Promise<Object>} The created mongoose document
   */
  async create(data) {
    return User.create(data);
  },

  /**
   * Find a user by id.
   * Returns a plain object rather than a mongoose document for cleaner JSON.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    return User.findById(id).lean().exec();
  },

  /**
   * Find a user by email.
   * By default sensitive fields are excluded at the model.
   * Use includePassword to explicitly fetch passwordHash for login.
   * @param {string} email
   * @param {{includePassword?: boolean}} opts
   * @returns {Promise<Object|null>}
   */
  async getByEmail(email, { includePassword = false } = {}) {
    const q = User.findOne({ email });
    if (includePassword) q.select('+passwordHash');
    return q.lean().exec();
  },

  /**
   * Patch a user by id and return the updated document.
   * @param {string} id
   * @param {Object} patch
   * @returns {Promise<Object|null>}
   */
  async updateById(id, patch) {
    return User.findByIdAndUpdate(id, patch, { new: true }).lean().exec();
  },

  /**
   * List users with simple pagination and optional text query.
   * @param {{page?: number, limit?: number, q?: string}} params
   * @returns {Promise<{items: Object[], total: number, page: number, pages: number}>}
   */
  async list({ page = 1, limit = 20, q }) {
    const filter = {};
    if (q) {
      filter.$or = [
        { email: new RegExp(q, 'i') },
        { name: new RegExp(q, 'i') }
      ];
    }

    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean()
        .exec(),
      User.countDocuments(filter)
    ]);

    return { items, total, page: safePage, pages: Math.ceil(total / safeLimit) };
  }
};

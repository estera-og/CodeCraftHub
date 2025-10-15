import { User } from '../models/userModel.js';

export const userService = {
  async create(data) {
    return User.create(data);
  },

  async getById(id) {
    return User.findById(id).lean().exec();
  },

  async getByEmail(email) {
    return User.findOne({ email }).lean().exec();
  },

  async updateById(id, patch) {
    return User.findByIdAndUpdate(id, patch, { new: true }).lean().exec();
  },

  async list({ page = 1, limit = 20, q }) {
    const filter = {};
    if (q) {
      filter.$or = [
        { email: new RegExp(q, 'i') },
        { name: new RegExp(q, 'i') }
      ];
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      User.countDocuments(filter)
    ]);
    return { items, total, page, pages: Math.ceil(total / limit) };
  }
};

// src/models/userModel.js
import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, default: '' },
    role: { type: String, enum: ['student', 'mentor', 'admin'], default: 'student' },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    failedLoginCount: { type: Number, default: 0 },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date }
  },
  { timestamps: true }
);

// Remove this line if it exists in your file:
// userSchema.index({ email: 1 }, { unique: true });

export const User = model('User', userSchema);

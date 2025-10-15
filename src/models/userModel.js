/**
 * User model
 *
 * This schema stores application users.
 * Security notes:
 *  - passwordHash is excluded by default (select: false). Only query it when needed for login.
 *  - email is stored normalised and unique to prevent duplicates.
 */

import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    /**
     * Email address used for login and notifications.
     * Normalised to lower case and trimmed. Must be unique.
     */
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },

    /** Display name shown in the UI. */
    name: { type: String, default: '' },

    /**
     * Role controls authorisation.
     *  - student: default
     *  - mentor: elevated read access for learning content
     *  - admin: full admin capabilities
     */
    role: { type: String, enum: ['student', 'mentor', 'admin'], default: 'student' },

    /**
     * Password hash produced by Argon2.
     * Hidden from normal queries to avoid accidental exposure.
     */
    passwordHash: { type: String, required: true, select: false },

    /** Soft activation flag for suspending accounts. */
    isActive: { type: Boolean, default: true },

    /** Timestamp of the last successful login. */
    lastLoginAt: { type: Date },

    /** Count of consecutive failed logins. Useful for lockout policy. */
    failedLoginCount: { type: Number, default: 0 },

    /** Password reset token hash. Hidden from normal queries. */
    resetTokenHash: { type: String, select: false },

    /** Expiry for the password reset token. */
    resetTokenExpiresAt: { type: Date }
  },
  {
    timestamps: true // adds createdAt and updatedAt
  }
);

// You can add future compound indexes here if needed, for example for search.

// Export the compiled model
export const User = model('User', userSchema);

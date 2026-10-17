import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/response.js';
import { isDbConnected } from '../config/database.js';
import { localStore } from '../utils/localStore.js';

// In-memory token blacklist for invalidated tokens during server session
const tokenBlacklist = new Set();

export class AuthService {
  /**
   * Generate signed JWT token.
   */
  static generateToken(user) {
    if (!config.jwt.secret) {
      throw new AppError('JWT_SECRET is not configured on the server', 500, 'AUTH_CONFIGURATION_ERROR');
    }
    return jwt.sign(
      {
        userId: (user._id || user.id).toString(),
        email: user.email,
        role: user.role || 'client'
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn
      }
    );
  }

  /**
   * Verify and decode a JWT token.
   */
  static verifyToken(token) {
    if (tokenBlacklist.has(token)) {
      throw new AppError('Token has been invalidated', 401, 'TOKEN_INVALIDATED');
    }
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Authentication token has expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid authentication token signature', 401, 'INVALID_TOKEN');
    }
  }

  /**
   * Register a new user.
   */
  static async register({ email, password, name, company }) {
    const normalizedEmail = email.trim().toLowerCase();

    if (isDbConnected()) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        throw new AppError('An account with this email already exists', 409, 'DUPLICATE_EMAIL');
      }

      const user = new User({
        email: normalizedEmail,
        password,
        name: name ? name.trim() : '',
        company: company ? company.trim() : ''
      });

      await user.save();
      const token = this.generateToken(user);
      return { user: user.toJSON(), token };
    } else {
      const existing = await localStore.findUserByEmail(normalizedEmail);
      if (existing) {
        throw new AppError('An account with this email already exists', 409, 'DUPLICATE_EMAIL');
      }

      const user = await localStore.createUser({ email: normalizedEmail, password, name, company });
      const token = this.generateToken(user);
      return { user: user.toJSON(), token };
    }
  }

  /**
   * Authenticate user with email and password.
   */
  static async login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      const token = this.generateToken(user);
      return { user: user.toJSON(), token };
    } else {
      const user = await localStore.findUserByEmail(normalizedEmail);
      if (!user) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      const token = this.generateToken(user);
      return { user: user.toJSON(), token };
    }
  }

  /**
   * Get authenticated user profile.
   */
  static async getCurrentUser(userId) {
    if (isDbConnected()) {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }
      return user.toJSON();
    } else {
      const user = await localStore.findUserById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }
      return user.toJSON();
    }
  }

  /**
   * Logout user and invalidate token.
   */
  static async logout(token) {
    if (token) {
      tokenBlacklist.add(token);
    }
    return { loggedOut: true };
  }
}

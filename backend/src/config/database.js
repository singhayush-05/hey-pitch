import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

/**
 * Connect to MongoDB.
 */
export async function connectDatabase() {
  if (!config.mongodbUri) {
    logger.warn('MONGODB_URI is not configured. Running without active database connection.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info('MongoDB connection established successfully');
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB connection lost');
    });

    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });

    isConnected = true;
    return true;
  } catch (err) {
    isConnected = false;
    logger.error('Failed to connect to MongoDB', { error: err.message });
    return false;
  }
}

/**
 * Gracefully close database connection.
 */
export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      isConnected = false;
      logger.info('MongoDB disconnected gracefully');
    } catch (err) {
      logger.error('Error disconnecting from MongoDB', { error: err.message });
    }
  }
}

/**
 * Check if database is currently connected.
 */
export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Get safe database status for health checks (without exposing secrets).
 */
export function getDbStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const state = mongoose.connection.readyState;
  return {
    status: states[state] || 'unknown',
    connected: state === 1,
    configured: Boolean(config.mongodbUri)
  };
}

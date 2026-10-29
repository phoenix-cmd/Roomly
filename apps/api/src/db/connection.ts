import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  const connectionUri = uri || env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true, // Build indexes automatically in development/testing
    });

    logger.info(`✅ Connected to MongoDB at ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost. Reconnecting...');
    });

    return conn;
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error during MongoDB disconnect:', error);
  }
}

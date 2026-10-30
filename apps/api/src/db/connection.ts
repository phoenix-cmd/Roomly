import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServerInstance: MongoMemoryServer | null = null;

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  let connectionUri = uri || env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 2000,
      autoIndex: true,
    });

    logger.info(`✅ Connected to MongoDB at ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    setupLifecycleEvents();
    return conn;
  } catch (initialErr) {
    // If local mongod is not running and we are in dev/test, launch embedded MongoDB engine
    if (env.NODE_ENV !== 'production') {
      logger.info('💡 Local MongoDB service not detected on default port. Launching embedded local MongoDB engine...');
      try {
        memoryServerInstance = await MongoMemoryServer.create({
          instance: {
            dbName: 'roomly',
          },
        });

        connectionUri = memoryServerInstance.getUri();
        logger.info(`🚀 Embedded MongoDB engine active at ${connectionUri}`);

        const conn = await mongoose.connect(connectionUri, {
          serverSelectionTimeoutMS: 5000,
          autoIndex: true,
        });

        logger.info(`✅ Connected to embedded MongoDB successfully.`);
        setupLifecycleEvents();
        return conn;
      } catch (embeddedErr) {
        logger.error('❌ Failed to launch embedded MongoDB:', embeddedErr);
        throw embeddedErr;
      }
    }

    logger.error('❌ Failed to connect to MongoDB:', initialErr);
    throw initialErr;
  }
}

function setupLifecycleEvents() {
  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB runtime connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost. Reconnecting...');
  });
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
      memoryServerInstance = null;
    }
    logger.info('MongoDB disconnected successfully.');
  } catch (error) {
    logger.error('Error during MongoDB disconnect:', error);
  }
}

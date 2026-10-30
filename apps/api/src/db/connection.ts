import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { Hotel } from '../models/Hotel.js';
import { seedData } from '../scripts/seed.js';

let memoryServerInstance: any = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureDatabaseInitialized(): Promise<void> {
  if (isInitialized && mongoose.connection.readyState >= 1) return;
  if (!initPromise) {
    initPromise = (async () => {
      await connectDatabase();
      const hotelCount = await Hotel.countDocuments();
      if (hotelCount === 0) {
        logger.info('🏨 Empty database detected on bootstrap. Auto-populating with luxury demo properties and staff...');
        await seedData(false);
      }
      isInitialized = true;
    })();
  }
  return initPromise;
}

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  let connectionUri = uri || env.MONGODB_URI;

  if (process.env.VERCEL && (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('127.0.0.1') || process.env.MONGODB_URI.includes('localhost'))) {
    const errorMsg = 'MONGODB_URI is not configured in Vercel Environment Variables. Please set MONGODB_URI in Vercel Project Settings -> Environment Variables to your cloud MongoDB connection string (e.g. MongoDB Atlas).';
    logger.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    const conn = await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: env.NODE_ENV !== 'production',
    });

    logger.info(`✅ Connected to MongoDB at ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    setupLifecycleEvents();
    return conn;
  } catch (initialErr) {
    // If local mongod is not running and we are in dev/test, launch embedded MongoDB engine
    if (env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      logger.info('💡 Local MongoDB service not detected on default port. Launching embedded local MongoDB engine...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
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

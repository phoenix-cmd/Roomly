import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './db/connection.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { Hotel } from './models/Hotel.js';
import { seedData } from './scripts/seed.js';
import {
  startHoldExpirationScheduler,
  stopHoldExpirationScheduler,
} from './jobs/holdExpirationJob.js';

export const app = createApp();

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureDatabaseInitialized(): Promise<void> {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      await connectDatabase();
      const hotelCount = await Hotel.countDocuments();
      if (hotelCount === 0 && env.NODE_ENV !== 'production') {
        logger.info('🏨 Empty database detected on bootstrap in non-production environment. Auto-populating with luxury demo properties and staff...');
        await seedData(false);
      }
      isInitialized = true;
    })();
  }
  return initPromise;
}

// Ensure database connection is active on incoming requests (for serverless environments)
app.use(async (_req, _res, next) => {
  try {
    await ensureDatabaseInitialized();
    next();
  } catch (error) {
    next(error);
  }
});

async function bootstrap() {
  try {
    await ensureDatabaseInitialized();

    // Start background hold expiration scheduler
    startHoldExpirationScheduler();

    // Start HTTP Server
    const server = app.listen(env.PORT, () => {
      logger.info(`✨ Roomly API is listening on port ${env.PORT} (${env.NODE_ENV})`);
      logger.info(`🌐 Health check available at http://localhost:${env.PORT}/api/v1/health`);
    });

    // Graceful shutdown handler
    const handleShutdown = async (signal: string) => {
      logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);
      stopHoldExpirationScheduler();

      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDatabase();
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forcing shutdown after 10s timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    logger.error('Fatal failure during server bootstrap:', error);
    process.exit(1);
  }
}

// Auto-start server only in standalone / local runtime (not in Vercel function context)
if (!process.env.VERCEL) {
  bootstrap();
}

export default app;
export { bootstrap };

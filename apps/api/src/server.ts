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

async function bootstrap() {
  try {
    // 1. Connect to MongoDB (with embedded fallback if local service not running)
    await connectDatabase();

    // 2. Check if database has been seeded; auto-seed if empty
    const hotelCount = await Hotel.countDocuments();
    if (hotelCount === 0) {
      logger.info('🏨 Empty database detected on bootstrap. Auto-populating with luxury demo properties and staff...');
      await seedData(false);
    }

    // 3. Start background hold expiration scheduler
    startHoldExpirationScheduler();

    // 4. Create Express App
    const app = createApp();

    // 5. Start HTTP Server
    const server = app.listen(env.PORT, () => {
      logger.info(`✨ Roomly API is listening on port ${env.PORT} (${env.NODE_ENV})`);
      logger.info(`🌐 Health check available at http://localhost:${env.PORT}/api/v1/health`);
    });

    // 6. Graceful shutdown handler
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

bootstrap();

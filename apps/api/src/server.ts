import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './db/connection.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import {
  startHoldExpirationScheduler,
  stopHoldExpirationScheduler,
} from './jobs/holdExpirationJob.js';

async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();

    // 2. Start background hold expiration scheduler
    startHoldExpirationScheduler();

    // 3. Create Express App
    const app = createApp();

    // 4. Start HTTP Server
    const server = app.listen(env.PORT, () => {
      logger.info(`✨ Roomly API is listening on port ${env.PORT} (${env.NODE_ENV})`);
      logger.info(`🌐 Health check available at http://localhost:${env.PORT}/api/v1/health`);
    });

    // 5. Graceful shutdown handler
    const handleShutdown = async (signal: string) => {
      logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);
      stopHoldExpirationScheduler();

      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force exit if hanging after 10 seconds
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

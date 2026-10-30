import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route modules
import { authRoutes } from './modules/auth/auth.routes.js';
import { hotelsRoutes } from './modules/hotels/hotels.routes.js';
import { roomsRoutes } from './modules/rooms/rooms.routes.js';
import { inventoryRoutes } from './modules/inventory/inventory.routes.js';
import { bookingsRoutes } from './modules/bookings/bookings.routes.js';
import { paymentsRoutes } from './modules/payments/payments.routes.js';
import { operationsRoutes } from './modules/operations/operations.routes.js';
import { housekeepingRoutes } from './modules/housekeeping/housekeeping.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { releaseExpiredHolds } from './jobs/holdExpirationJob.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows flexible CDN font/image assets
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowed = [
          env.CLIENT_URL,
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:3002',
        ];
        if (
          allowed.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          (process.env.VERCEL_URL && origin === `https://${process.env.VERCEL_URL}`) ||
          (process.env.VERCEL_PROJECT_PRODUCTION_URL && origin === `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
        ) {
          return callback(null, true);
        }
        return callback(new Error('Blocked by CORS policy'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'stripe-signature'],
    })
  );

  // 3. Cookie parser & Body parsers (with rawBody capture for webhook signature verification)
  app.use(cookieParser());
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Rate Limiting
  app.use(generalLimiter);

  // 5. Health Check endpoint
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      service: 'roomly-api',
      timestamp: new Date().toISOString(),
    });
  });

  // 6. Mount Domain Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/hotels', hotelsRoutes);
  app.use('/api/v1/rooms', roomsRoutes);
  app.use('/api/v1/inventory', inventoryRoutes);
  app.use('/api/v1/bookings', bookingsRoutes);
  app.use('/api/v1/payments', paymentsRoutes);
  app.use('/api/v1/operations', operationsRoutes);
  app.use('/api/v1/housekeeping', housekeepingRoutes);
  app.use('/api/v1/reports', reportsRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // Scheduled job trigger (for Vercel Cron or external schedulers)
  app.all('/api/v1/jobs/release-expired-holds', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (env.NODE_ENV === 'production') {
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
          return res.status(401).json({ success: false, message: 'Unauthorized cron trigger' });
        }
      }
      const releasedCount = await releaseExpiredHolds();
      return res.status(200).json({ success: true, releasedCount, timestamp: new Date().toISOString() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested API endpoint was not found on this server.',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;

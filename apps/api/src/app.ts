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
      origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
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

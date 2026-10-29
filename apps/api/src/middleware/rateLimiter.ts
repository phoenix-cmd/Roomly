import rateLimit from 'express-rate-limit';
import { apiError } from '../utils/response.js';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return apiError(
      res,
      'Too many requests from this IP. Please try again after 15 minutes.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login/register attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return apiError(
      res,
      'Too many authentication attempts. Please try again after 15 minutes.',
      429,
      'AUTH_RATE_LIMIT_EXCEEDED'
    );
  },
});

export const bookingHoldLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // 15 hold requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return apiError(
      res,
      'Too many booking hold attempts. Please slow down and try again shortly.',
      429,
      'HOLD_RATE_LIMIT_EXCEEDED'
    );
  },
});

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(`Error processing ${req.method} ${req.originalUrl}:`, err);

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: formatted,
      },
      correlationId: req.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Mongoose CastError (e.g. invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid format for identifier '${err.path}'`,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Mongoose Validation Error
  if (err instanceof mongoose.Error.ValidationError) {
    const formatted = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Database schema validation error',
        details: formatted,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || {});
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY_ERROR',
        message: `A record with this ${fields.join(', ')} already exists.`,
        details: err.keyValue,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Custom App Error with status code
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const errorCode = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR');
  const message =
    statusCode === 500 && env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred.'
      : err.message || 'An unexpected error occurred.';

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
    correlationId: req.headers['x-request-id'],
    timestamp: new Date().toISOString(),
  });
}

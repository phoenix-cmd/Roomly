import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { apiError } from '../utils/response.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  globalRole: 'GUEST' | 'PLATFORM_ADMIN';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  // 1. Check Bearer token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.access_token) {
    // 2. Fallback to HttpOnly cookie
    token = req.cookies.access_token;
  }

  if (!token) {
    return apiError(res, 'Authentication required. Missing token.', 401, 'UNAUTHORIZED');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      sub: string;
      email: string;
      globalRole: 'GUEST' | 'PLATFORM_ADMIN';
    };

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      globalRole: decoded.globalRole,
    };

    return next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return apiError(res, 'Access token has expired. Please refresh your session.', 401, 'TOKEN_EXPIRED');
    }
    return apiError(res, 'Invalid access token.', 401, 'INVALID_TOKEN');
  }
}

/**
 * Optional authentication: populates req.user if a valid token is present, but does not block if absent.
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      sub: string;
      email: string;
      globalRole: 'GUEST' | 'PLATFORM_ADMIN';
    };
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      globalRole: decoded.globalRole,
    };
  } catch {
    // Ignore invalid optional tokens
  }

  return next();
}

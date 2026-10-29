import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service.js';
import { apiSuccess } from '../../utils/response.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await authService.register(validated);

      // Set refresh token in HttpOnly cookie
      res.cookie('refresh_token', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return apiSuccess(res, result, 201);
    } catch (err) {
      return next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await authService.login(validated);

      res.cookie('refresh_token', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return apiSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refresh_token || req.body?.refreshToken;
      if (!token) {
        return res.status(401).json({
          success: false,
          error: { code: 'NO_REFRESH_TOKEN', message: 'Missing refresh token.' },
        });
      }

      const tokens = await authService.refreshToken(token);

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return apiSuccess(res, { tokens });
    } catch (err) {
      return next(err);
    }
  }

  async logout(_req: Request, res: Response) {
    res.clearCookie('refresh_token');
    return apiSuccess(res, { message: 'Logged out successfully.' });
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.id);
      return apiSuccess(res, { user });
    } catch (err) {
      return next(err);
    }
  }
}

export const authController = new AuthController();

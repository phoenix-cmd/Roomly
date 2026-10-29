import { Request, Response, NextFunction } from 'express';
import { apiError } from '../utils/response.js';
import { HotelMembership, HotelRole, IHotelMembership } from '../models/HotelMembership.js';

declare global {
  namespace Express {
    interface Request {
      hotelMembership?: IHotelMembership;
    }
  }
}

/**
 * Ensures user has one of the specified global roles (e.g. PLATFORM_ADMIN)
 */
export function requireGlobalRole(roles: ('GUEST' | 'PLATFORM_ADMIN')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return apiError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!roles.includes(req.user.globalRole)) {
      return apiError(
        res,
        'Access denied. Insufficient global privileges.',
        403,
        'FORBIDDEN'
      );
    }

    return next();
  };
}

/**
 * Enforces multi-tenant property access:
 * Verifies that the user has an active HotelMembership for req.params.hotelId (or req.body.hotelId)
 * with one of the permitted hotel roles.
 * PLATFORM_ADMIN users automatically bypass this check.
 */
export function requireHotelRole(allowedRoles: HotelRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return apiError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    // Platform Admins have overarching authority
    if (req.user.globalRole === 'PLATFORM_ADMIN') {
      return next();
    }

    const hotelId = req.params.hotelId || req.body.hotelId || req.query.hotelId;

    if (!hotelId) {
      return apiError(
        res,
        'Missing hotel property context (hotelId).',
        400,
        'MISSING_TENANT_CONTEXT'
      );
    }

    try {
      const membership = await HotelMembership.findOne({
        userId: req.user.id,
        hotelId,
        isActive: true,
      });

      if (!membership) {
        return apiError(
          res,
          'Access denied. You do not hold an active membership for this hotel.',
          403,
          'HOTEL_TENANT_ACCESS_DENIED'
        );
      }

      if (!allowedRoles.includes(membership.role)) {
        return apiError(
          res,
          `Access denied. Role '${membership.role}' does not have permission for this operational action.`,
          403,
          'INSUFFICIENT_ROLE'
        );
      }

      req.hotelMembership = membership;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser, GlobalRole } from '../../models/User.js';
import { HotelMembership } from '../../models/HotelMembership.js';
import { env } from '../../config/env.js';

export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  globalRole: GlobalRole;
  isEmailVerified: boolean;
  memberships: Array<{
    hotelId: string;
    hotelName?: string;
    role: string;
    permissions: string[];
  }>;
}

export class AuthService {
  async register(dto: RegisterDTO): Promise<{ user: AuthUserResponse; tokens: AuthTokens }> {
    const existing = await User.findOne({ email: dto.email.toLowerCase().trim() });
    if (existing) {
      const err: any = new Error('An account with this email address already exists.');
      err.statusCode = 409;
      err.code = 'EMAIL_ALREADY_EXISTS';
      throw err;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await User.create({
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone?.trim(),
      globalRole: 'GUEST',
      isEmailVerified: true, // Auto-verified for seamless UX in development
    });

    const tokens = this.generateTokens(user);
    const userResponse = await this.buildUserResponse(user);

    return { user: userResponse, tokens };
  }

  async login(dto: LoginDTO): Promise<{ user: AuthUserResponse; tokens: AuthTokens }> {
    const user = await User.findOne({ email: dto.email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      const err: any = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      const err: any = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const tokens = this.generateTokens(user);
    const userResponse = await this.buildUserResponse(user);

    return { user: userResponse, tokens };
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
      const user = await User.findById(decoded.sub);
      if (!user) {
        const err: any = new Error('User not found.');
        err.statusCode = 401;
        throw err;
      }

      return this.generateTokens(user);
    } catch {
      const err: any = new Error('Invalid or expired refresh token.');
      err.statusCode = 401;
      err.code = 'INVALID_REFRESH_TOKEN';
      throw err;
    }
  }

  async getMe(userId: string): Promise<AuthUserResponse> {
    const user = await User.findById(userId);
    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }
    return this.buildUserResponse(user);
  }

  async requestPasswordReset(email: string): Promise<{ message: string; resetToken?: string }> {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return { message: 'If an account exists with this email address, password reset instructions have been dispatched.' };
    }

    const resetToken = jwt.sign(
      { sub: user._id.toString(), type: 'PASSWORD_RESET' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    return {
      message: 'If an account exists with this email address, password reset instructions have been dispatched.',
      resetToken: env.NODE_ENV !== 'production' ? resetToken : undefined,
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; type: string };
      if (decoded.type !== 'PASSWORD_RESET') {
        const err: any = new Error('Invalid reset token type.');
        err.statusCode = 400;
        throw err;
      }

      const user = await User.findById(decoded.sub).select('+passwordHash');
      if (!user) {
        const err: any = new Error('User not found.');
        err.statusCode = 404;
        throw err;
      }

      const salt = await bcrypt.genSalt(12);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();

      return { message: 'Password has been successfully reset. You may now sign in with your new credentials.' };
    } catch (err: any) {
      if (err.statusCode) throw err;
      const error: any = new Error('Invalid or expired password reset token.');
      error.statusCode = 400;
      throw error;
    }
  }

  generateTokens(user: IUser): AuthTokens {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      globalRole: user.globalRole,
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ sub: user._id.toString() }, env.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async buildUserResponse(user: IUser): Promise<AuthUserResponse> {
    const memberships = await HotelMembership.find({ userId: user._id, isActive: true })
      .populate('hotelId', 'name slug')
      .lean();

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      globalRole: user.globalRole,
      isEmailVerified: user.isEmailVerified,
      memberships: memberships.map((m: any) => ({
        hotelId: m.hotelId?._id?.toString() || m.hotelId?.toString(),
        hotelName: m.hotelId?.name,
        role: m.role,
        permissions: m.permissions,
      })),
    };
  }
}

export const authService = new AuthService();

import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env if present
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5001),
  API_URL: z.string().default('http://localhost:5001'),
  CLIENT_URL: z.string().default('http://localhost:3000'),

  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/roomly'),

  JWT_ACCESS_SECRET: z.string().min(16).default('roomly_default_jwt_access_secret_key_32_chars_min!'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16).default('roomly_default_jwt_refresh_secret_key_32_chars_min!'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  EMAIL_SERVICE: z.enum(['mock', 'smtp']).default('mock'),
  EMAIL_HOST: z.string().default('smtp.mailtrap.io'),
  EMAIL_PORT: z.coerce.number().default(2525),
  EMAIL_USER: z.string().default(''),
  EMAIL_PASSWORD: z.string().default(''),
  EMAIL_FROM: z.string().default('"Roomly Concierge" <concierge@roomly.luxury>'),

  PAYMENT_PROVIDER: z.enum(['MOCK_SANDBOX', 'STRIPE', 'RAZORPAY']).default('MOCK_SANDBOX'),
  STRIPE_PUBLIC_KEY: z.string().default('pk_test_mock'),
  STRIPE_SECRET_KEY: z.string().default('sk_test_mock'),
  STRIPE_WEBHOOK_SECRET: z.string().default('whsec_mock'),

  STORAGE_PROVIDER: z.enum(['LOCAL', 'S3']).default('LOCAL'),
  STORAGE_LOCAL_DIR: z.string().default('./uploads'),

  REDIS_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
}).refine(
  (data) => {
    if (data.NODE_ENV === 'production') {
      return (
        data.JWT_ACCESS_SECRET !== 'roomly_default_jwt_access_secret_key_32_chars_min!' &&
        data.JWT_REFRESH_SECRET !== 'roomly_default_jwt_refresh_secret_key_32_chars_min!'
      );
    }
    return true;
  },
  {
    message: 'Production deployment requires explicitly configured, secure JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.',
    path: ['JWT_ACCESS_SECRET'],
  }
);

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ FATAL: Invalid application environment configuration:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

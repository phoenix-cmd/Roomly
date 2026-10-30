import createApp from '../apps/api/dist/app.js';
import { ensureDatabaseInitialized } from '../apps/api/dist/db/connection.js';

let appInstance: any = null;

export default async function handler(req: any, res: any) {
  try {
    await ensureDatabaseInitialized();
    if (!appInstance) {
      appInstance = createApp();
    }
    return appInstance(req, res);
  } catch (error: any) {
    console.error('❌ Vercel Serverless Function Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_OR_INIT_ERROR',
        message: error.message || 'Internal server error during database connection.',
        hint: !process.env.MONGODB_URI
          ? 'MONGODB_URI environment variable is missing in Vercel. Please add a MongoDB Atlas URI (mongodb+srv://...) in Vercel Project Settings -> Environment Variables.'
          : undefined,
      },
    });
  }
}


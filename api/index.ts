import * as appModule from '../apps/api/dist/app.js';
import * as connModule from '../apps/api/dist/db/connection.js';

const getCreateApp = (): Function => {
  const mod: any = appModule;
  if (typeof mod.createApp === 'function') return mod.createApp;
  if (typeof mod.default === 'function') return mod.default;
  if (typeof mod.default?.createApp === 'function') return mod.default.createApp;
  if (typeof mod.default?.default === 'function') return mod.default.default;
  if (typeof mod === 'function') return mod;
  throw new Error('Could not resolve createApp function from app.js');
};

const getEnsureDatabaseInitialized = (): Function => {
  const mod: any = connModule;
  if (typeof mod.ensureDatabaseInitialized === 'function') return mod.ensureDatabaseInitialized;
  if (typeof mod.default?.ensureDatabaseInitialized === 'function') return mod.default.ensureDatabaseInitialized;
  throw new Error('Could not resolve ensureDatabaseInitialized function from connection.js');
};

let appInstance: any = null;

export default async function handler(req: any, res: any) {
  try {
    const ensureInit = getEnsureDatabaseInitialized();
    await ensureInit();

    if (!appInstance) {
      const createApp = getCreateApp();
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


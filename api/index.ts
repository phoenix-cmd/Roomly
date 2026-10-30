import createApp from '../apps/api/src/app.js';
import { connectDatabase } from '../apps/api/src/db/connection.js';

let appInstance: any = null;

export default async function handler(req: any, res: any) {
  if (!appInstance) {
    await connectDatabase();
    appInstance = createApp();
  }
  return appInstance(req, res);
}


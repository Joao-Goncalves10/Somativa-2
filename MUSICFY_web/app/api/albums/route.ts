import {
  handleApiError,
  sendJson,
  validateAlbum,
  verifyAdminSession,
  verifyOrigin,
  readJsonBody
} from '@/lib/api';
import { insertAlbum, listAlbums } from '@/lib/database';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return sendJson(await listAlbums());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    verifyOrigin(request);
    verifyAdminSession(request);
    const album = validateAlbum(await readJsonBody(request));
    return sendJson(await insertAlbum(album), 201);
  } catch (error) {
    return handleApiError(error);
  }
}

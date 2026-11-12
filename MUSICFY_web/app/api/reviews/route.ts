import {
  getDefaultProfile,
  handleApiError,
  readJsonBody,
  requireAccount,
  sendJson,
  validateReview,
  verifyOrigin
} from '@/lib/api';
import { getAccount, listAlbumReviews, saveAlbumReview } from '@/lib/database';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const albumId = new URL(request.url).searchParams.get('albumId');
    if (!albumId || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(albumId)) {
      return sendJson({ error: 'O identificador do álbum é inválido.' }, 400);
    }
    return sendJson(await listAlbumReviews(albumId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    verifyOrigin(request);
    const user = await requireAccount(request);
    const review = validateReview(await readJsonBody(request));
    await getAccount(user.id, getDefaultProfile(user));
    return sendJson(await saveAlbumReview(user.id, review.albumId, review.rating, review.comment));
  } catch (error) {
    return handleApiError(error);
  }
}

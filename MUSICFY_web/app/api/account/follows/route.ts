import { getAccount, setArtistFollow } from '@/lib/database';
import {
  getDefaultProfile,
  handleApiError,
  readJsonBody,
  requireAccount,
  sendJson,
  validateAccountItem,
  verifyOrigin
} from '@/lib/api';

export const runtime = 'nodejs';

export async function PATCH(request: Request) {
  try {
    verifyOrigin(request);
    const user = await requireAccount(request);
    const item = validateAccountItem(await readJsonBody(request), 'artistId');
    await getAccount(user.id, getDefaultProfile(user));
    await setArtistFollow(user.id, item.id, item.enabled);
    return sendJson({ saved: item.enabled });
  } catch (error) {
    return handleApiError(error);
  }
}

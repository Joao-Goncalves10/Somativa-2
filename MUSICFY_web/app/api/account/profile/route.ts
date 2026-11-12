import { getAccount, updateAccountProfile } from '@/lib/database';
import {
  getDefaultProfile,
  handleApiError,
  readJsonBody,
  requireAccount,
  sendJson,
  validateAccountProfile,
  verifyOrigin
} from '@/lib/api';

export const runtime = 'nodejs';

export async function PUT(request: Request) {
  try {
    verifyOrigin(request);
    const user = await requireAccount(request);
    await getAccount(user.id, getDefaultProfile(user));
    const profile = validateAccountProfile(await readJsonBody(request));
    return sendJson(await updateAccountProfile(user.id, profile));
  } catch (error) {
    return handleApiError(error);
  }
}

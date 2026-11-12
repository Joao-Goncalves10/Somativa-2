import { getAccount } from '@/lib/database';
import { getDefaultProfile, handleApiError, requireAccount, sendJson } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await requireAccount(request);
    return sendJson(await getAccount(user.id, getDefaultProfile(user)));
  } catch (error) {
    return handleApiError(error);
  }
}

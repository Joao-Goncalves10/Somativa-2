import { getAuthConfigResponse } from '@/lib/api';

export const runtime = 'nodejs';

export function GET() {
  return getAuthConfigResponse();
}

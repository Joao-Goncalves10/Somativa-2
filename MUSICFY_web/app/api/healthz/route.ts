import { checkDatabaseConnection } from '@/lib/database';
import { handleApiError, sendJson } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await checkDatabaseConnection();
    return sendJson({ status: 'ok' });
  } catch (error) {
    console.error('A verificação de saúde do banco de dados falhou.', error);
    return sendJson({ status: 'unavailable' }, 503);
  }
}

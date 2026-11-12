import { NextResponse } from 'next/server';
import {
  createSessionToken,
  getAdminSessionCookie,
  getClearedAdminSessionCookie
} from '@/lib/auth';
import {
  getAdminSessionResponse,
  handleApiError,
  readJsonBody,
  sendJson,
  verifyAdminPassword,
  verifyOrigin
} from '@/lib/api';

export const runtime = 'nodejs';

export function GET(request: Request) {
  return getAdminSessionResponse(request);
}

export async function POST(request: Request) {
  try {
    verifyOrigin(request);
    const body = await readJsonBody(request);
    const password = body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>).password
      : undefined;
    if (!verifyAdminPassword(password)) return sendJson({ error: 'Senha de administrador incorreta.' }, 401);
    const response = sendJson({ authenticated: true });
    response.headers.set('Set-Cookie', getAdminSessionCookie(request, createSessionToken()));
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export function DELETE(request: Request) {
  try {
    verifyOrigin(request);
    const response = sendJson({ authenticated: false });
    response.headers.set('Set-Cookie', getClearedAdminSessionCookie(request));
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

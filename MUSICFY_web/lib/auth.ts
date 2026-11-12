import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual
} from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
};

const adminCookieName = 'musicfy_admin';
const adminSessionDurationSeconds = 12 * 60 * 60;
let remoteJwks: ReturnType<typeof createRemoteJWKSet> | undefined;
let remoteJwksUrl: string | undefined;

export function getManagedAuthConfig() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  if (!baseUrl || !jwksUrl) return null;

  let parsedBaseUrl: URL;
  let parsedJwksUrl: URL;
  try {
    parsedBaseUrl = new URL(baseUrl);
    parsedJwksUrl = new URL(jwksUrl);
  } catch {
    throw new Error('NEON_AUTH_BASE_URL e NEON_AUTH_JWKS_URL devem ser URLs válidas.');
  }
  if (!['http:', 'https:'].includes(parsedBaseUrl.protocol)
    || !['http:', 'https:'].includes(parsedJwksUrl.protocol)
    || (process.env.NODE_ENV === 'production'
      && (parsedBaseUrl.protocol !== 'https:' || parsedJwksUrl.protocol !== 'https:'))) {
    throw new Error('A autenticação do Neon deve usar URLs HTTPS em produção.');
  }
  return {
    baseUrl: parsedBaseUrl.toString().replace(/\/$/, ''),
    jwksUrl: parsedJwksUrl.toString()
  };
}

function getRemoteJwks(url: string) {
  if (!remoteJwks || remoteJwksUrl !== url) {
    remoteJwks = createRemoteJWKSet(new URL(url));
    remoteJwksUrl = url;
  }
  return remoteJwks;
}

export async function authenticateUser(request: Request): Promise<AuthenticatedUser | null> {
  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer ([^\s]+)$/i);
  if (!match) return null;
  const config = getManagedAuthConfig();
  if (!config) {
    throw Object.assign(new Error('A autenticação ainda não foi configurada no servidor.'), {
      statusCode: 503
    });
  }
  try {
    const { payload } = await jwtVerify(match[1], getRemoteJwks(config.jwksUrl), {
      issuer: new URL(config.baseUrl).origin
    });
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    return {
      id: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : '',
      name: typeof payload.name === 'string' ? payload.name : ''
    };
  } catch (error) {
    const invalidTokenCodes = new Set([
      'ERR_JWS_INVALID',
      'ERR_JWS_SIGNATURE_VERIFICATION_FAILED',
      'ERR_JWT_CLAIM_VALIDATION_FAILED',
      'ERR_JWT_EXPIRED',
      'ERR_JWT_INVALID',
      'ERR_JWKS_NO_MATCHING_KEY'
    ]);
    if (error && typeof error === 'object' && 'code' in error
      && invalidTokenCodes.has(String(error.code))) return null;
    throw error;
  }
}

export function isAdminLoginRequired(): boolean {
  return process.env.NODE_ENV === 'production'
    || Boolean(process.env.ADMIN_PASSWORD)
    || Boolean(process.env.DATABASE_URL);
}

export function passwordsMatch(password: unknown): boolean {
  if (typeof password !== 'string' || !process.env.ADMIN_PASSWORD) return false;
  const providedHash = createHash('sha256').update(password).digest();
  const expectedHash = createHash('sha256').update(process.env.ADMIN_PASSWORD).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

export function createSessionToken(): string {
  if (!process.env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD não está configurada.');
  const payload = Buffer.from(JSON.stringify({
    expiresAt: Date.now() + adminSessionDurationSeconds * 1000,
    nonce: randomBytes(32).toString('base64url')
  })).toString('base64url');
  const signature = createHmac('sha256', process.env.ADMIN_PASSWORD)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function isSessionTokenValid(token: string | undefined): boolean {
  if (!process.env.ADMIN_PASSWORD || !token) return false;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return false;
  const expectedSignature = createHmac('sha256', process.env.ADMIN_PASSWORD)
    .update(payload)
    .digest('base64url');
  const receivedHash = createHash('sha256').update(signature).digest();
  const expectedHash = createHash('sha256').update(expectedSignature).digest();
  if (!timingSafeEqual(receivedHash, expectedHash)) return false;
  try {
    const session: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!session || typeof session !== 'object' || !('expiresAt' in session) || !('nonce' in session)) {
      return false;
    }
    return Number.isSafeInteger(session.expiresAt)
      && Number(session.expiresAt) > Date.now()
      && typeof session.nonce === 'string';
  } catch {
    return false;
  }
}

export function hasAdminSession(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${adminCookieName}=`))
    ?.slice(adminCookieName.length + 1);
  return isSessionTokenValid(token);
}

export function getAdminSessionCookie(request: Request, token: string): string {
  const secure = getRequestProtocol(request) === 'https';
  return `${adminCookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${adminSessionDurationSeconds}${secure ? '; Secure' : ''}`;
}

export function getClearedAdminSessionCookie(request: Request): string {
  const secure = getRequestProtocol(request) === 'https';
  return `${adminCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
}

function getRequestProtocol(request: Request): string {
  return request.headers.get('x-forwarded-proto')?.split(',')[0].trim()
    || new URL(request.url).protocol.replace(':', '');
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('x-forwarded-host')?.split(',')[0].trim()
    || request.headers.get('host');
  if (!host) return false;
  try {
    return new URL(origin).origin === `${getRequestProtocol(request)}://${host}`;
  } catch {
    return false;
  }
}

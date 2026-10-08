const {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual
} = require('node:crypto');

const sessionCookieName = 'musicfy_admin';
const sessionDurationSeconds = 12 * 60 * 60;

function isAdminLoginRequired() {
  return process.env.NODE_ENV === 'production'
    || Boolean(process.env.ADMIN_PASSWORD)
    || Boolean(process.env.DATABASE_URL);
}

function passwordsMatch(password) {
  if (typeof password !== 'string' || !process.env.ADMIN_PASSWORD) return false;

  const providedHash = createHash('sha256').update(password).digest();
  const expectedHash = createHash('sha256').update(process.env.ADMIN_PASSWORD).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({
    expiresAt: Date.now() + sessionDurationSeconds * 1000,
    nonce: randomBytes(32).toString('base64url')
  })).toString('base64url');
  const signature = createHmac('sha256', process.env.ADMIN_PASSWORD)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function isSessionTokenValid(token) {
  if (!process.env.ADMIN_PASSWORD || typeof token !== 'string') return false;

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return false;

  const expectedSignature = createHmac('sha256', process.env.ADMIN_PASSWORD)
    .update(payload)
    .digest('base64url');
  const receivedHash = createHash('sha256').update(signature).digest();
  const expectedHash = createHash('sha256').update(expectedSignature).digest();
  if (!timingSafeEqual(receivedHash, expectedHash)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isSafeInteger(session.expiresAt)
      && session.expiresAt > Date.now()
      && typeof session.nonce === 'string';
  } catch {
    return false;
  }
}

function hasAdminSession(request) {
  const cookies = request.headers.cookie || '';
  const sessionCookie = cookies.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${sessionCookieName}=`));
  return sessionCookie
    ? isSessionTokenValid(sessionCookie.slice(sessionCookieName.length + 1))
    : false;
}

function setSessionCookie(response, request, token) {
  const forwardedProtocol = request.headers['x-forwarded-proto']?.split(',')[0].trim();
  const secure = forwardedProtocol === 'https' || request.socket.encrypted;
  const secureAttribute = secure ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionDurationSeconds}${secureAttribute}`
  );
}

function clearSessionCookie(response, request) {
  const forwardedProtocol = request.headers['x-forwarded-proto']?.split(',')[0].trim();
  const secure = forwardedProtocol === 'https' || request.socket.encrypted;
  const secureAttribute = secure ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureAttribute}`
  );
}

function isSameOriginRequest(request) {
  const origin = request.headers.origin;
  if (!origin) return true;

  const forwardedProtocol = request.headers['x-forwarded-proto'];
  const protocol = forwardedProtocol ? forwardedProtocol.split(',')[0].trim() : 'http';
  try {
    return new URL(origin).origin === `${protocol}://${request.headers.host}`;
  } catch {
    return false;
  }
}

module.exports = {
  clearSessionCookie,
  createSessionToken,
  hasAdminSession,
  isAdminLoginRequired,
  isSameOriginRequest,
  passwordsMatch,
  setSessionCookie
};

let remoteJwks;
let remoteJwksUrl;

function getManagedAuthConfig() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  if (!baseUrl || !jwksUrl) return null;

  let parsedBaseUrl;
  let parsedJwksUrl;
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

  return { baseUrl: parsedBaseUrl.toString().replace(/\/$/, ''), jwksUrl: parsedJwksUrl.toString() };
}

function getRemoteJwks(jwksUrl, createRemoteJWKSet) {
  if (!remoteJwks || remoteJwksUrl !== jwksUrl) {
    remoteJwks = createRemoteJWKSet(new URL(jwksUrl));
    remoteJwksUrl = jwksUrl;
  }
  return remoteJwks;
}

async function authenticateUser(request) {
  const authorization = request.headers.authorization || '';
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(authorization);
  if (!match) return null;

  const config = getManagedAuthConfig();
  if (!config) {
    throw Object.assign(new Error('A autenticação ainda não foi configurada no servidor.'), {
      statusCode: 503
    });
  }

  const { createRemoteJWKSet, jwtVerify } = await import('jose');
  try {
    const { payload } = await jwtVerify(
      match[1],
      getRemoteJwks(config.jwksUrl, createRemoteJWKSet),
      { issuer: new URL(config.baseUrl).origin }
    );
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
    if (invalidTokenCodes.has(error.code)) return null;
    throw error;
  }
}

module.exports = {
  authenticateUser,
  getManagedAuthConfig
};

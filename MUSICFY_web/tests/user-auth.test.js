const assert = require('node:assert/strict');
const http = require('node:http');
const { after, before, test } = require('node:test');
const { exportJWK, generateKeyPair, SignJWT } = require('jose');
const { authenticateUser } = require('../server/user-auth');

let authServer;
let privateKey;
let jwksUrl;
const authBaseUrl = 'http://auth.example/neondb/auth';

before(async () => {
  const keys = await generateKeyPair('EdDSA');
  privateKey = keys.privateKey;
  const publicJwk = await exportJWK(keys.publicKey);
  publicJwk.kid = 'musicfy-test-key';
  publicJwk.alg = 'EdDSA';
  publicJwk.use = 'sig';

  authServer = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ keys: [publicJwk] }));
  });
  await new Promise((resolve, reject) => {
    authServer.once('error', reject);
    authServer.listen(0, '127.0.0.1', resolve);
  });
  jwksUrl = `http://127.0.0.1:${authServer.address().port}/jwks`;
  process.env.NODE_ENV = 'test';
  process.env.NEON_AUTH_BASE_URL = authBaseUrl;
  process.env.NEON_AUTH_JWKS_URL = jwksUrl;
});

after(async () => {
  await new Promise((resolve) => authServer.close(resolve));
  delete process.env.NEON_AUTH_BASE_URL;
  delete process.env.NEON_AUTH_JWKS_URL;
});

async function createToken(key) {
  return new SignJWT({ email: 'ana@example.com', name: 'Ana Silva' })
    .setProtectedHeader({ alg: 'EdDSA', kid: 'musicfy-test-key' })
    .setIssuer(new URL(authBaseUrl).origin)
    .setSubject('user-123')
    .setIssuedAt()
    .setExpirationTime('1m')
    .sign(key);
}

test('verifies the Neon Auth issuer and signature before returning an account identity', async () => {
  const token = await createToken(privateKey);
  const user = await authenticateUser({ headers: { authorization: `Bearer ${token}` } });
  assert.deepEqual(user, {
    id: 'user-123',
    email: 'ana@example.com',
    name: 'Ana Silva'
  });

  const wrongKey = await generateKeyPair('EdDSA');
  const invalidToken = await createToken(wrongKey.privateKey);
  assert.equal(
    await authenticateUser({ headers: { authorization: `Bearer ${invalidToken}` } }),
    null
  );
});

test('does not accept requests without a bearer token', async () => {
  assert.equal(await authenticateUser({ headers: {} }), null);
});

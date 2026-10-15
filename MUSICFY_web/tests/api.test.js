const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { exportJWK, generateKeyPair, SignJWT } = require('jose');

const projectRoot = path.resolve(__dirname, '..');
const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'musicfy-api-test-'));
const databasePath = path.join(tempDirectory, 'musicfy.db');
let appServer;
let authServer;
let appUrl;
let privateKey;
let publicJwk;
let appPort;

before(async () => {
  const keys = await generateKeyPair('EdDSA');
  privateKey = keys.privateKey;
  publicJwk = await exportJWK(keys.publicKey);
  publicJwk.kid = 'musicfy-api-test-key';
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

  const reservation = net.createServer();
  await new Promise((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', resolve);
  });
  appPort = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  appUrl = `http://127.0.0.1:${appPort}`;

  appServer = spawn(process.execPath, ['server/index.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: '',
      ADMIN_PASSWORD: '',
      MUSICFY_DB_PATH: databasePath,
      PORT: String(appPort),
      NEON_AUTH_BASE_URL: 'http://auth.example/neondb/auth',
      NEON_AUTH_JWKS_URL: `http://127.0.0.1:${authServer.address().port}/jwks`
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let output = '';
  appServer.stdout.on('data', (chunk) => { output += chunk.toString(); });
  appServer.stderr.on('data', (chunk) => { output += chunk.toString(); });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (appServer.exitCode !== null) throw new Error(`MUSICFY server exited early: ${output}`);
    try {
      const response = await fetch(`${appUrl}/healthz`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`MUSICFY server did not become ready: ${output}`);
});

after(async () => {
  if (appServer && appServer.exitCode === null) {
    appServer.kill();
    await new Promise((resolve) => appServer.once('exit', resolve));
  }
  if (authServer) await new Promise((resolve) => authServer.close(resolve));
  fs.rmSync(tempDirectory, { recursive: true, force: true });
});

async function createToken(userId, name, email) {
  return new SignJWT({ name, email })
    .setProtectedHeader({ alg: 'EdDSA', kid: 'musicfy-api-test-key' })
    .setIssuer('http://auth.example')
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('1m')
    .sign(privateKey);
}

async function accountRequest(pathname, token, options = {}) {
  const response = await fetch(`${appUrl}${pathname}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  return { response, body: await response.json() };
}

test('protects private account data and shares public album reviews', async () => {
  const authConfig = await accountRequest('/api/auth/config');
  assert.equal(authConfig.response.status, 200);
  assert.equal(authConfig.body.available, true);

  const unauthenticated = await accountRequest('/api/account');
  assert.equal(unauthenticated.response.status, 401);
  const publicBefore = await accountRequest('/api/reviews?albumId=sour');
  assert.equal(publicBefore.response.status, 200);
  assert.deepEqual(publicBefore.body, []);

  const firstToken = await createToken('user-1', 'Ana Silva', 'ana@example.com');
  const accountResponse = await accountRequest('/api/account', firstToken);
  assert.equal(accountResponse.response.status, 200);
  assert.equal(accountResponse.body.profile.name, 'Ana Silva');
  assert.deepEqual(accountResponse.body.followedArtists, []);

  const profileResponse = await accountRequest('/api/account/profile', firstToken, {
    method: 'PUT',
    headers: { Origin: appUrl },
    body: JSON.stringify({
      name: 'Ana Atualizada',
      handle: 'ana-silva',
      bio: 'Música pop e indie.',
      initials: 'AS',
      avatarImage: ''
    })
  });
  assert.equal(profileResponse.response.status, 200);
  assert.equal(profileResponse.body.name, 'Ana Atualizada');

  const followResponse = await accountRequest('/api/account/follows', firstToken, {
    method: 'PATCH',
    headers: { Origin: appUrl },
    body: JSON.stringify({ artistId: 'dua-lipa', enabled: true })
  });
  assert.equal(followResponse.response.status, 200);

  const presaveResponse = await accountRequest('/api/account/presaves', firstToken, {
    method: 'PATCH',
    headers: { Origin: appUrl },
    body: JSON.stringify({ albumId: 'upcoming-album', enabled: true })
  });
  assert.equal(presaveResponse.response.status, 200);

  const reviewResponse = await accountRequest('/api/reviews', firstToken, {
    method: 'POST',
    headers: { Origin: appUrl },
    body: JSON.stringify({ albumId: 'sour', rating: 5, comment: 'Amei.' })
  });
  assert.equal(reviewResponse.response.status, 200);
  assert.equal(reviewResponse.body.rating, 5);

  const invalidReview = await accountRequest('/api/reviews', firstToken, {
    method: 'POST',
    headers: { Origin: appUrl },
    body: JSON.stringify({ albumId: 'sour', rating: 6, comment: 'Inválida.' })
  });
  assert.equal(invalidReview.response.status, 400);

  const crossOrigin = await accountRequest('/api/account/follows', firstToken, {
    method: 'PATCH',
    headers: { Origin: 'https://attacker.example' },
    body: JSON.stringify({ artistId: 'dua-lipa', enabled: false })
  });
  assert.equal(crossOrigin.response.status, 403);

  const secondToken = await createToken('user-2', 'Bia Souza', 'bia@example.com');
  const secondAccount = await accountRequest('/api/account', secondToken);
  assert.equal(secondAccount.response.status, 200);
  assert.deepEqual(secondAccount.body.followedArtists, []);
  assert.deepEqual(secondAccount.body.presavedAlbums, []);
  assert.deepEqual(secondAccount.body.reviews, []);
  const duplicateHandle = await accountRequest('/api/account/profile', secondToken, {
    method: 'PUT',
    headers: { Origin: appUrl },
    body: JSON.stringify({
      name: 'Bia Souza',
      handle: 'ana-silva',
      bio: '',
      initials: 'BS',
      avatarImage: ''
    })
  });
  assert.equal(duplicateHandle.response.status, 409);

  const publicAfter = await accountRequest('/api/reviews?albumId=sour');
  assert.equal(publicAfter.response.status, 200);
  assert.equal(publicAfter.body.length, 1);
  assert.equal(publicAfter.body[0].name, 'Ana Atualizada');
  assert.equal(publicAfter.body[0].comment, 'Amei.');
});

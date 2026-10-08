const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { randomUUID } = require('node:crypto');
const {
  checkDatabaseConnection,
  closeDatabase,
  initializeDatabase,
  insertAlbum,
  listAlbums
} = require('./database');
const {
  clearSessionCookie,
  createSessionToken,
  hasAdminSession,
  isAdminLoginRequired,
  isSameOriginRequest,
  passwordsMatch,
  setSessionCookie
} = require('./admin-auth');

const projectRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(projectRoot, 'public');
const port = Number(process.env.PORT) || 5500;
const maximumRequestSize = 2 * 1024 * 1024;
const maximumCoverLength = 1_400_000;
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(value));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let requestSize = 0;

    request.on('data', (chunk) => {
      requestSize += chunk.length;
      if (requestSize > maximumRequestSize) {
        const error = new Error('A solicitação excede o limite de 2 MB.');
        error.statusCode = 413;
        reject(error);
        request.resume();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (requestSize > maximumRequestSize) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        const error = new Error('O corpo da solicitação deve ser um JSON válido.');
        error.statusCode = 400;
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function validateAlbum(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Os dados do álbum são inválidos.'), { statusCode: 400 });
  }

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const artist = typeof input.artist === 'string' ? input.artist.trim() : '';
  const image = typeof input.image === 'string' ? input.image : '';
  const genres = input.genres;
  const tracks = input.tracks;

  if (!name || name.length > 100 || !artist || artist.length > 80) {
    throw Object.assign(new Error('Informe um nome de álbum e artista válidos.'), { statusCode: 400 });
  }
  if (!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)
    || image.length > maximumCoverLength) {
    throw Object.assign(new Error('A capa deve ser PNG, JPG ou WEBP de até 1 MB.'), { statusCode: 400 });
  }
  if (!Array.isArray(genres) || genres.length === 0 || genres.length > 10
    || genres.some((genre) => typeof genre !== 'string' || !genre.trim() || genre.length > 30)) {
    throw Object.assign(new Error('Selecione entre 1 e 10 estilos válidos.'), { statusCode: 400 });
  }
  if (!Array.isArray(tracks) || tracks.length === 0 || tracks.length > 100
    || tracks.some((track) => typeof track !== 'string' || !track.trim() || track.length > 100)) {
    throw Object.assign(new Error('Informe entre 1 e 100 faixas válidas.'), { statusCode: 400 });
  }

  const id = input.id === undefined ? `created-${randomUUID()}` : input.id;
  if (typeof id !== 'string' || !/^created-[a-z0-9-]{1,200}$/.test(id)) {
    throw Object.assign(new Error('O identificador do álbum é inválido.'), { statusCode: 400 });
  }

  return {
    id,
    name,
    artist,
    image,
    genres: genres.map((genre) => genre.trim()),
    tracks: tracks.map((track) => track.trim())
  };
}

async function handleApiRequest(request, response, pathname) {
  if (pathname === '/api/admin/session') {
    if (request.method === 'GET') {
      const required = isAdminLoginRequired();
      sendJson(response, 200, {
        required,
        authenticated: !required || hasAdminSession(request)
      });
      return;
    }

    if (request.method === 'POST') {
      if (!isSameOriginRequest(request)) {
        sendJson(response, 403, { error: 'Solicitação de origem não autorizada.' });
        return;
      }
      const credentials = await readJsonBody(request);
      if (!passwordsMatch(credentials?.password)) {
        sendJson(response, 401, { error: 'Senha de administrador incorreta.' });
        return;
      }
      setSessionCookie(response, request, createSessionToken());
      sendJson(response, 200, { authenticated: true });
      return;
    }

    if (request.method === 'DELETE') {
      if (!isSameOriginRequest(request)) {
        sendJson(response, 403, { error: 'Solicitação de origem não autorizada.' });
        return;
      }
      clearSessionCookie(response, request);
      sendJson(response, 200, { authenticated: false });
      return;
    }

    response.setHeader('Allow', 'GET, POST, DELETE');
    sendJson(response, 405, { error: 'Método não permitido.' });
    return;
  }

  if (pathname !== '/api/albums') {
    sendJson(response, 404, { error: 'Endpoint não encontrado.' });
    return;
  }

  if (request.method === 'GET') {
    sendJson(response, 200, await listAlbums());
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    sendJson(response, 405, { error: 'Método não permitido.' });
    return;
  }

  if (!isSameOriginRequest(request)) {
    sendJson(response, 403, { error: 'Solicitação de origem não autorizada.' });
    return;
  }
  if (isAdminLoginRequired() && !hasAdminSession(request)) {
    sendJson(response, 401, { error: 'Entre como administrador para publicar álbuns.' });
    return;
  }

  const album = validateAlbum(await readJsonBody(request));
  const savedAlbum = await insertAlbum(album);
  sendJson(response, 201, savedAlbum);
}

const server = http.createServer(async (request, response) => {
  let requestUrl;
  try {
    requestUrl = new URL(request.url, 'http://localhost');
  } catch (error) {
    sendJson(response, 400, { error: 'Endereço da solicitação inválido.' });
    return;
  }

  if (requestUrl.pathname.startsWith('/api/')) {
    try {
      await handleApiRequest(request, response, requestUrl.pathname);
    } catch (error) {
      console.error('Falha ao processar solicitação da API.', error);
      sendJson(response, error.statusCode || 500, {
        error: error.statusCode ? error.message : 'Não foi possível acessar o banco de dados.'
      });
    }
    return;
  }

  if (requestUrl.pathname === '/healthz') {
    try {
      await checkDatabaseConnection();
      sendJson(response, 200, { status: 'ok' });
    } catch (error) {
      console.error('A verificação de saúde do banco de dados falhou.', error);
      sendJson(response, 503, { status: 'unavailable' });
    }
    return;
  }

  let requestPath;
  try {
    requestPath = decodeURIComponent(requestUrl.pathname);
  } catch {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Endereço inválido');
    return;
  }

  const relativePath = requestPath === '/' ? 'index.html' : requestPath.slice(1);
  const filePath = path.resolve(publicRoot, relativePath);
  if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}${path.sep}`)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Acesso negado');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Arquivo nao encontrado');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      'Referrer-Policy': 'origin'
    });
    response.end(data);
  });
});

initializeDatabase().then(() => {
  server.listen(port, '0.0.0.0', () => {
    console.log(`MUSICFY aberto na porta ${port}`);
    if (process.env.DATABASE_URL) {
      console.log('Banco de dados PostgreSQL conectado.');
      return;
    }

    const databasePath = path.resolve(
      process.env.MUSICFY_DB_PATH || path.join(projectRoot, 'data', 'musicfy.db')
    );
    Object.values(os.networkInterfaces())
      .flatMap((interfaces) => interfaces || [])
      .filter((networkInterface) => networkInterface.family === 'IPv4' && !networkInterface.internal)
      .forEach((networkInterface) => {
        console.log(`Acesso na rede local: http://${networkInterface.address}:${port}`);
      });
    console.log(`Banco de dados SQLite local: ${databasePath}`);
  });
}).catch(async (error) => {
  console.error('Não foi possível iniciar o MUSICFY ou conectar ao banco de dados.', error);
  try {
    await closeDatabase();
  } catch (closeError) {
    console.error('Não foi possível encerrar corretamente a conexão com o banco.', closeError);
  }
  process.exitCode = 1;
});

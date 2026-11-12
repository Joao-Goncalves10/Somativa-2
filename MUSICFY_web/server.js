const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const port = Number(process.env.PORT) || 5500;
const minimumAdminPasswordLength = 10;
const dataRoot = process.env.MUSICFY_DATA_DIR
  ? path.resolve(process.env.MUSICFY_DATA_DIR)
  : path.resolve(root, '..', 'musicfy-data');
const uploadRoot = path.join(dataRoot, 'uploads');
const releasesFile = path.join(dataRoot, 'home-releases.json');
const catalogFile = path.join(dataRoot, 'catalog.json');
const sessionCookie = 'musicfy_admin_session';
const sessionLifetimeMs = 12 * 60 * 60 * 1000;
const maximumRequestBytes = 80 * 1024 * 1024;
const maximumReleaseCount = 12;
const maximumReleaseBannerBytes = 5 * 1024 * 1024;
const sessions = new Map();
const loginAttempts = new Map();
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp3': 'audio/mpeg'
};

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
  response.end(JSON.stringify(value));
}

function readJson(request, limit = maximumRequestBytes) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytes = 0;
    let oversized = false;
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > limit) {
        oversized = true;
        return;
      }
      if (!oversized) body += chunk;
    });
    request.on('end', () => {
      if (oversized) {
        reject(Object.assign(new Error('A solicitação excedeu o tamanho permitido.'), { status: 413 }));
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error('O conteúdo enviado não é um JSON válido.'), { status: 400 }));
      }
    });
    request.on('error', reject);
  });
}

function isSecureRequest(request) {
  return request.socket.encrypted === true
    || process.env.TRUST_PROXY === '1'
      && request.headers['x-forwarded-proto']?.split(',')[0].trim().toLowerCase() === 'https';
}

function getRequestHost(request) {
  return process.env.TRUST_PROXY === '1'
    ? request.headers['x-forwarded-host'] || request.headers.host
    : request.headers.host;
}

function isLocalRequest(request) {
  const host = (request.headers.host || '').replace(/:\d+$/, '').replace(/^\[|\]$/g, '');
  return host === 'localhost' || host === '::1' || /^127\./.test(host);
}

function hasSecureAdminTransport(request) {
  return isSecureRequest(request) || isLocalRequest(request);
}

function hasSameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  const protocol = isSecureRequest(request) ? 'https' : 'http';
  const host = getRequestHost(request);
  return origin === `${protocol}://${host}`;
}

function getSessionId(request) {
  const cookie = request.headers.cookie || '';
  const match = cookie.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`));
  return match ? match.slice(sessionCookie.length + 1) : '';
}

function hasAdminSession(request) {
  const id = getSessionId(request);
  const expiresAt = sessions.get(id);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    sessions.delete(id);
    return false;
  }
  sessions.set(id, Date.now() + sessionLifetimeMs);
  return true;
}

function getYoutubeVideoId(value) {
  try {
    const url = new URL(value);
    const isYoutubeHost = url.hostname === 'youtu.be'
      || url.hostname === 'youtube.com'
      || url.hostname.endsWith('.youtube.com');
    if (!isYoutubeHost) return null;
    const videoId = url.hostname === 'youtu.be'
      ? url.pathname.slice(1).split('/')[0]
      : url.pathname === '/watch'
        ? url.searchParams.get('v')
        : url.pathname.startsWith('/shorts/')
          ? url.pathname.split('/')[2]
          : url.pathname.startsWith('/embed/')
            ? url.pathname.split('/')[2]
            : null;
    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

async function loadReleases() {
  try {
    const contents = await fs.promises.readFile(releasesFile, 'utf8');
    const releases = JSON.parse(contents);
    if (!Array.isArray(releases)) throw new TypeError('O arquivo de lançamentos não contém uma lista.');
    return releases;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function loadCatalog() {
  try {
    const contents = await fs.promises.readFile(catalogFile, 'utf8');
    const catalog = JSON.parse(contents);
    if (!catalog || typeof catalog !== 'object'
      || !Array.isArray(catalog.createdAlbums)
      || !catalog.albumOverrides || typeof catalog.albumOverrides !== 'object'
      || Array.isArray(catalog.albumOverrides)
      || !catalog.artistProfiles || typeof catalog.artistProfiles !== 'object'
      || Array.isArray(catalog.artistProfiles)) {
      throw new TypeError('O arquivo do catálogo não contém dados válidos.');
    }
    return catalog;
  } catch (error) {
    if (error.code === 'ENOENT') return { createdAlbums: [], albumOverrides: {}, artistProfiles: {} };
    throw error;
  }
}

async function writeCatalog(catalog) {
  await fs.promises.mkdir(dataRoot, { recursive: true });
  const temporaryFile = `${catalogFile}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.promises.writeFile(temporaryFile, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
    await fs.promises.rename(temporaryFile, catalogFile);
  } catch (error) {
    await fs.promises.rm(temporaryFile, { force: true });
    throw error;
  }
}

async function saveAsset(value, type, createdFiles, maximumBytes = type === 'audio' ? 4 * 1024 * 1024 : 1024 * 1024) {
  if (typeof value !== 'string' || value.length === 0) return '';

  if (type === 'image' && /^src\/img\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+$/.test(value)
    && !value.split('/').includes('..')) {
    return value;
  }

  const existingAsset = value.match(/^\/uploads\/([a-f0-9-]+\.(?:png|jpe?g|webp|avif|mp3))$/);
  if (existingAsset) {
    const extension = path.extname(existingAsset[1]).toLowerCase();
    const isAudio = extension === '.mp3';
    if ((type === 'audio') !== isAudio) throw Object.assign(new Error('O tipo de arquivo não corresponde ao destaque.'), { status: 400 });
    await fs.promises.access(path.join(uploadRoot, existingAsset[1]));
    return value;
  }

  const match = value.match(/^data:(image\/(?:png|jpeg|webp|avif)|audio\/mpeg);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) throw Object.assign(new Error('Um dos arquivos do destaque está inválido.'), { status: 400 });
  const declaredMimeType = match[1];
  const isAudio = declaredMimeType === 'audio/mpeg';
  if ((type === 'audio') !== isAudio) throw Object.assign(new Error('O tipo de arquivo não corresponde ao destaque.'), { status: 400 });
  const data = Buffer.from(match[2], 'base64');
  if (data.length === 0 || data.length > maximumBytes || data.toString('base64') !== match[2]) {
    throw Object.assign(new Error('Um dos arquivos excede o tamanho permitido ou está inválido.'), { status: 400 });
  }
  let mimeType = declaredMimeType;
  if (type === 'image') {
    mimeType = data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      ? 'image/png'
      : data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
        ? 'image/jpeg'
        : data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP'
          ? 'image/webp'
          : data.length >= 12 && data.toString('ascii', 4, 8) === 'ftyp'
            && ['avif', 'avis'].includes(data.toString('ascii', 8, 12))
            ? 'image/avif'
            : '';
  }
  const validAudioHeader = data.length >= 3
    && (data.toString('ascii', 0, 3) === 'ID3' || data[0] === 0xff && (data[1] & 0xe0) === 0xe0);
  if (type === 'image' ? !mimeType : !validAudioHeader) {
    throw Object.assign(new Error(type === 'image'
      ? 'A imagem precisa estar em formato PNG, JPG, WEBP ou AVIF válido.'
      : 'O arquivo de áudio não está em um formato MP3 válido.'), { status: 400 });
  }
  const extension = mimeType === 'image/jpeg' ? '.jpg'
    : mimeType === 'image/png' ? '.png'
      : mimeType === 'image/webp' ? '.webp'
        : mimeType === 'image/avif' ? '.avif'
          : '.mp3';
  const filename = `${crypto.randomUUID()}${extension}`;
  await fs.promises.writeFile(path.join(uploadRoot, filename), data, { flag: 'wx' });
  createdFiles.push(filename);
  return `/uploads/${filename}`;
}

function getCatalogAssetNames(catalog) {
  const albums = [
    ...(Array.isArray(catalog.createdAlbums) ? catalog.createdAlbums : []),
    ...Object.values(catalog.albumOverrides || {})
  ];
  const assets = albums.flatMap((album) => [
    album.image,
    ...(Array.isArray(album.tracks) ? album.tracks.map((track) => track.audioDataUrl) : [])
  ]);
  assets.push(...Object.values(catalog.artistProfiles || {}).flatMap((profile) => [profile.photo, profile.banner]));
  return new Set(assets
    .map((asset) => typeof asset === 'string'
      ? asset.match(/^\/uploads\/([a-f0-9-]+\.(?:png|jpe?g|webp|avif|mp3))$/)?.[1]
      : null)
    .filter(Boolean));
}

async function removeUnusedCatalogAssets(previousCatalog, nextCatalog) {
  const retained = getCatalogAssetNames(nextCatalog);
  const releases = await loadReleases();
  for (const asset of getReferencedAssets(releases)) retained.add(asset);
  for (const filename of getCatalogAssetNames(previousCatalog)) {
    if (retained.has(filename)) continue;
    try {
      await fs.promises.rm(path.join(uploadRoot, filename), { force: true });
    } catch (error) {
      console.error('Não foi possível remover um arquivo antigo do catálogo.', error);
    }
  }
}

function isValidText(value, maximumLength, allowEmpty = false) {
  return typeof value === 'string' && value.length <= maximumLength && (allowEmpty || value.trim().length > 0);
}

async function normalizeCatalogAlbum(album, createdFiles) {
  if (!album || typeof album !== 'object'
    || typeof album.id !== 'string' || !/^[A-Za-z0-9-]{1,120}$/.test(album.id)
    || !isValidText(album.name, 100)
    || !isValidText(album.artist, 80)
    || (album.type !== undefined && !['ÁLBUM', 'SINGLE', 'EP'].includes(album.type))
    || (album.releaseDate != null
      && (typeof album.releaseDate !== 'string' || !Number.isFinite(Date.parse(album.releaseDate))))
    || (album.genres !== undefined && (!Array.isArray(album.genres) || album.genres.length > 10))
    || (album.genres || []).some((genre) => !isValidText(genre, 40))
    || !Array.isArray(album.tracks) || album.tracks.length < 1 || album.tracks.length > 100) {
    throw Object.assign(new Error('Revise as informações do álbum antes de salvar.'), { status: 400 });
  }

  const image = await saveAsset(album.image, 'image', createdFiles);
  if (!image) throw Object.assign(new Error('O álbum precisa de uma capa válida.'), { status: 400 });
  const tracks = [];
  for (const track of album.tracks) {
    if (!track || typeof track !== 'object'
      || !isValidText(track.name, 100)
      || (track.explicit !== undefined && typeof track.explicit !== 'boolean')
      || !isValidText(track.lyrics || '', 100000, true)
      || !isValidText(track.translation || '', 100000, true)
      || !isValidText(track.audioFileName || '', 150, true)
      || !isValidText(track.youtubeUrl || '', 300, true)
      || !isValidText(track.audioDataUrl || '', 6 * 1024 * 1024, true)
      || (track.youtubeUrl && !getYoutubeVideoId(track.youtubeUrl))) {
      throw Object.assign(new Error('Revise as informações de uma das faixas do álbum.'), { status: 400 });
    }
    const audioDataUrl = await saveAsset(track.audioDataUrl || '', 'audio', createdFiles);
    tracks.push({
      name: track.name.trim(),
      reviews: Array.isArray(track.reviews)
        ? track.reviews.filter((review) => typeof review === 'string').slice(0, 100)
        : [],
      explicit: track.explicit === true,
      lyrics: track.lyrics || '',
      translation: track.translation || '',
      audioDataUrl,
      audioFileName: track.audioFileName || '',
      youtubeUrl: track.youtubeUrl || ''
    });
  }

  return {
    id: album.id,
    name: album.name.trim(),
    artist: album.artist.trim(),
    type: album.type || 'ÁLBUM',
    image,
    releaseDate: album.releaseDate || null,
    genres: (album.genres || []).map((genre) => genre.trim()),
    tracks,
    ...(typeof album.versionGroup === 'string' ? { versionGroup: album.versionGroup.slice(0, 120) } : {}),
    ...(typeof album.versionLabel === 'string' ? { versionLabel: album.versionLabel.slice(0, 120) } : {})
  };
}

async function saveCatalogAlbum(album) {
  const previous = await loadCatalog();
  const createdFiles = [];
  let catalogSaved = false;
  try {
    await fs.promises.mkdir(uploadRoot, { recursive: true });
    const normalized = await normalizeCatalogAlbum(album, createdFiles);
    const next = {
      ...previous,
      createdAlbums: [...previous.createdAlbums],
      albumOverrides: { ...previous.albumOverrides },
      artistProfiles: { ...previous.artistProfiles }
    };
    if (normalized.id.startsWith('created-')) {
      const index = next.createdAlbums.findIndex((entry) => entry.id === normalized.id);
      if (index === -1) next.createdAlbums.push(normalized);
      else next.createdAlbums[index] = normalized;
    } else {
      const { id, ...override } = normalized;
      next.albumOverrides[id] = override;
    }
    await writeCatalog(next);
    catalogSaved = true;
    await removeUnusedCatalogAssets(previous, next);
    return normalized;
  } catch (error) {
    if (!catalogSaved) {
      await Promise.all(createdFiles.map((filename) => fs.promises.rm(path.join(uploadRoot, filename), { force: true })));
    }
    throw error;
  }
}

async function saveCatalogArtist(body) {
  if (!body || typeof body !== 'object'
    || typeof body.id !== 'string' || !/^[a-z0-9-]{1,100}$/.test(body.id)
    || (body.oldId !== undefined && (typeof body.oldId !== 'string'
      || (body.oldId !== '' && !/^[a-z0-9-]{1,100}$/.test(body.oldId))))
    || !body.profile || typeof body.profile !== 'object'
    || !isValidText(body.profile.name, 80)) {
    throw Object.assign(new Error('Revise as informações do artista antes de salvar.'), { status: 400 });
  }

  const previous = await loadCatalog();
  const createdFiles = [];
  let catalogSaved = false;
  try {
    await fs.promises.mkdir(uploadRoot, { recursive: true });
    const photo = await saveAsset(body.profile.photo, 'image', createdFiles);
    const banner = await saveAsset(body.profile.banner, 'image', createdFiles);
    if (!photo || !banner) {
      throw Object.assign(new Error('O artista precisa de uma foto e um banner válidos.'), { status: 400 });
    }
    const next = {
      ...previous,
      createdAlbums: [...previous.createdAlbums],
      albumOverrides: { ...previous.albumOverrides },
      artistProfiles: { ...previous.artistProfiles }
    };
    if (body.oldId && body.oldId !== body.id) delete next.artistProfiles[body.oldId];
    next.artistProfiles[body.id] = {
      name: body.profile.name.trim(),
      photo,
      banner
    };
    await writeCatalog(next);
    catalogSaved = true;
    await removeUnusedCatalogAssets(previous, next);
    return next.artistProfiles[body.id];
  } catch (error) {
    if (!catalogSaved) {
      await Promise.all(createdFiles.map((filename) => fs.promises.rm(path.join(uploadRoot, filename), { force: true })));
    }
    throw error;
  }
}

async function normalizeReleases(releases, createdFiles) {
  if (!Array.isArray(releases) || releases.length > maximumReleaseCount) {
    throw Object.assign(new Error(`Cadastre no máximo ${maximumReleaseCount} lançamentos em destaque.`), { status: 400 });
  }

  const ids = new Set();
  const normalized = [];
  for (const release of releases) {
    if (!release || typeof release !== 'object'
      || typeof release.id !== 'string' || !/^[A-Za-z0-9-]{1,100}$/.test(release.id)
      || ids.has(release.id)
      || typeof release.title !== 'string' || !release.title.trim() || release.title.length > 100
      || typeof release.artist !== 'string' || !release.artist.trim() || release.artist.length > 80
      || typeof release.caption !== 'string' || release.caption.length > 160
      || typeof release.youtubeUrl !== 'string'
      || typeof release.albumId !== 'string') {
      throw Object.assign(new Error('Revise as informações dos lançamentos enviados.'), { status: 400 });
    }
    ids.add(release.id);
    const youtubeVideoId = release.youtubeUrl ? getYoutubeVideoId(release.youtubeUrl) : null;
    if (release.youtubeUrl && !youtubeVideoId) {
      throw Object.assign(new Error('Um dos links do YouTube não é válido.'), { status: 400 });
    }
    const banner = await saveAsset(release.banner, 'image', createdFiles, maximumReleaseBannerBytes);
    const audio = await saveAsset(release.audio, 'audio', createdFiles);
    if (!banner || (!audio && !youtubeVideoId)) {
      throw Object.assign(new Error('Cada destaque precisa de um banner e de um áudio ou link do YouTube.'), { status: 400 });
    }
    normalized.push({
      id: release.id,
      title: release.title.trim(),
      artist: release.artist.trim(),
      caption: release.caption.trim(),
      banner,
      audio,
      youtubeUrl: youtubeVideoId ? `https://www.youtube.com/watch?v=${youtubeVideoId}` : '',
      albumId: release.albumId.slice(0, 100)
    });
  }
  return normalized;
}

function getReferencedAssets(releases) {
  return new Set(releases.flatMap((release) =>
    [release.banner, release.audio]
      .map((asset) => asset.match(/^\/uploads\/([a-f0-9-]+\.(?:png|jpe?g|webp|avif|mp3))$/)?.[1])
      .filter(Boolean)
  ));
}

async function saveReleases(releases) {
  await fs.promises.mkdir(uploadRoot, { recursive: true });
  const previous = await loadReleases();
  const createdFiles = [];
  let releasesSaved = false;
  try {
    const normalized = await normalizeReleases(releases, createdFiles);
    await fs.promises.mkdir(dataRoot, { recursive: true });
    await fs.promises.writeFile(releasesFile, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
    releasesSaved = true;
    const references = getReferencedAssets(normalized);
    for (const asset of getCatalogAssetNames(await loadCatalog())) references.add(asset);
    for (const filename of getReferencedAssets(previous)) {
      if (!references.has(filename)) {
        try {
          await fs.promises.rm(path.join(uploadRoot, filename), { force: true });
        } catch (error) {
          console.error('Não foi possível remover um arquivo antigo de destaque.', error);
        }
      }
    }
    return normalized;
  } catch (error) {
    if (!releasesSaved) {
      await Promise.all(createdFiles.map((filename) => fs.promises.rm(path.join(uploadRoot, filename), { force: true })));
    }
    throw error;
  }
}

async function handleApi(request, response, pathname) {
  if (pathname === '/api/catalog' && request.method === 'GET') {
    try {
      sendJson(response, 200, await loadCatalog());
    } catch (error) {
      console.error('Não foi possível carregar o catálogo publicado.', error);
      sendJson(response, 500, { error: 'Não foi possível carregar o catálogo publicado.' });
    }
    return true;
  }

  if (pathname === '/api/home-releases' && request.method === 'GET') {
    try {
      sendJson(response, 200, await loadReleases());
    } catch (error) {
      console.error('Não foi possível ler os lançamentos publicados.', error);
      sendJson(response, 500, { error: 'Não foi possível carregar os lançamentos em destaque.' });
    }
    return true;
  }

  if (pathname === '/api/admin/catalog/album' && request.method === 'POST') {
    if (!hasSameOrigin(request)) {
      sendJson(response, 403, { error: 'A solicitação não veio deste site.' });
      return true;
    }
    if (!hasSecureAdminTransport(request)) {
      sendJson(response, 400, { error: 'Salve o catálogo usando uma conexão HTTPS segura.' });
      return true;
    }
    if (!hasAdminSession(request)) {
      sendJson(response, 401, { error: 'Sua sessão expirou. Entre novamente no painel.' });
      return true;
    }
    try {
      const body = await readJson(request);
      sendJson(response, 200, await saveCatalogAlbum(body.album));
    } catch (error) {
      console.error('Não foi possível salvar o álbum no servidor.', error);
      sendJson(response, error.status || 500, {
        error: error.status ? error.message : 'Não foi possível salvar o álbum no catálogo do servidor.'
      });
    }
    return true;
  }

  if (pathname === '/api/admin/catalog/artist' && request.method === 'POST') {
    if (!hasSameOrigin(request)) {
      sendJson(response, 403, { error: 'A solicitação não veio deste site.' });
      return true;
    }
    if (!hasSecureAdminTransport(request)) {
      sendJson(response, 400, { error: 'Salve o catálogo usando uma conexão HTTPS segura.' });
      return true;
    }
    if (!hasAdminSession(request)) {
      sendJson(response, 401, { error: 'Sua sessão expirou. Entre novamente no painel.' });
      return true;
    }
    try {
      const body = await readJson(request);
      sendJson(response, 200, await saveCatalogArtist(body));
    } catch (error) {
      console.error('Não foi possível salvar o artista no servidor.', error);
      sendJson(response, error.status || 500, {
        error: error.status ? error.message : 'Não foi possível salvar o artista no catálogo do servidor.'
      });
    }
    return true;
  }

  if (pathname === '/api/admin/session' && request.method === 'GET') {
    sendJson(response, 200, {
      authenticated: hasAdminSession(request),
      configured: typeof process.env.MUSICFY_ADMIN_PASSWORD === 'string'
        && process.env.MUSICFY_ADMIN_PASSWORD.length >= minimumAdminPasswordLength
    });
    return true;
  }

  if (pathname === '/api/admin/login' && request.method === 'POST') {
    if (!hasSameOrigin(request)) {
      sendJson(response, 403, { error: 'A solicitação não veio deste site.' });
      return true;
    }
    if (!hasSecureAdminTransport(request)) {
      sendJson(response, 400, { error: 'Entre no painel por uma conexão HTTPS segura.' });
      return true;
    }
    const adminPassword = process.env.MUSICFY_ADMIN_PASSWORD;
    if (!adminPassword || adminPassword.length < minimumAdminPasswordLength) {
      sendJson(response, 503, { error: `O administrador ainda não configurou MUSICFY_ADMIN_PASSWORD no servidor (mínimo de ${minimumAdminPasswordLength} caracteres).` });
      return true;
    }

    const address = request.socket.remoteAddress || 'unknown';
    const attempts = loginAttempts.get(address) || { count: 0, resetAt: Date.now() + 5 * 60 * 1000 };
    if (attempts.resetAt <= Date.now()) {
      attempts.count = 0;
      attempts.resetAt = Date.now() + 5 * 60 * 1000;
    }
    if (attempts.count >= 10) {
      sendJson(response, 429, { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
      return true;
    }

    try {
      const body = await readJson(request, 4096);
      const suppliedPassword = Buffer.from(typeof body.password === 'string' ? body.password : '');
      const configuredPassword = Buffer.from(adminPassword);
      const matches = suppliedPassword.length === configuredPassword.length
        && crypto.timingSafeEqual(suppliedPassword, configuredPassword);
      if (!matches) {
        attempts.count += 1;
        loginAttempts.set(address, attempts);
        sendJson(response, 401, { error: 'Senha incorreta.' });
        return true;
      }
      loginAttempts.delete(address);
      const id = crypto.randomBytes(32).toString('hex');
      sessions.set(id, Date.now() + sessionLifetimeMs);
      const secureAttribute = isSecureRequest(request) ? '; Secure' : '';
      sendJson(response, 200, { authenticated: true }, {
        'Set-Cookie': `${sessionCookie}=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionLifetimeMs / 1000}${secureAttribute}`
      });
    } catch (error) {
      sendJson(response, error.status || 400, { error: error.message || 'Não foi possível verificar a senha.' });
    }
    return true;
  }

  if (pathname === '/api/admin/logout' && request.method === 'POST') {
    const id = getSessionId(request);
    if (id) sessions.delete(id);
    sendJson(response, 200, { authenticated: false }, {
      'Set-Cookie': `${sessionCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${isSecureRequest(request) ? '; Secure' : ''}`
    });
    return true;
  }

  if (pathname === '/api/admin/home-releases' && request.method === 'PUT') {
    if (!hasSameOrigin(request)) {
      sendJson(response, 403, { error: 'A solicitação não veio deste site.' });
      return true;
    }
    if (!hasSecureAdminTransport(request)) {
      sendJson(response, 400, { error: 'Publique usando uma conexão HTTPS segura.' });
      return true;
    }
    if (!hasAdminSession(request)) {
      sendJson(response, 401, { error: 'Sua sessão expirou. Entre novamente no painel.' });
      return true;
    }
    try {
      const body = await readJson(request);
      sendJson(response, 200, await saveReleases(body));
    } catch (error) {
      console.error('Não foi possível publicar os lançamentos em destaque.', error);
      sendJson(response, error.status || 500, {
        error: error.status ? error.message : 'Não foi possível salvar no servidor. Verifique o espaço disponível.'
      });
    }
    return true;
  }

  if (pathname.startsWith('/api/')) {
    sendJson(response, 404, { error: 'Endpoint não encontrado.' });
    return true;
  }
  return false;
}

http.createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Solicitação inválida');
    return;
  }

  if (await handleApi(request, response, pathname)) return;

  if (pathname.startsWith('/uploads/')) {
    const filename = pathname.slice('/uploads/'.length);
    if (!/^[a-f0-9-]+\.(?:png|jpe?g|webp|avif|mp3)$/.test(filename)) {
      response.writeHead(404);
      response.end();
      return;
    }
    try {
      const data = await fs.promises.readFile(path.join(uploadRoot, filename));
      response.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filename).toLowerCase()],
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
      response.end(data);
    } catch {
      response.writeHead(404);
      response.end();
    }
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  const relativePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(root, `.${relativePath}`);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403);
    response.end();
    return;
  }

  try {
    const data = await fs.promises.readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'origin'
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Arquivo nao encontrado');
  }
}).listen(port, () => {
  console.log(`MUSICFY aberto em http://localhost:${port}`);
  if (!process.env.MUSICFY_ADMIN_PASSWORD || process.env.MUSICFY_ADMIN_PASSWORD.length < minimumAdminPasswordLength) {
    console.warn(`Configure MUSICFY_ADMIN_PASSWORD com pelo menos ${minimumAdminPasswordLength} caracteres para habilitar o painel administrativo.`);
  }
});

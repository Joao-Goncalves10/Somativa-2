import { Pool, type QueryResultRow } from '@neondatabase/serverless';

export type Album = {
  id: string;
  name: string;
  artist: string;
  image: string;
  genres: string[];
  tracks: { name: string; reviews: string[]; lyrics: string; translation: string }[];
};

export type AccountProfile = {
  name: string;
  handle: string;
  bio: string;
  initials: string;
  avatarImage: string;
};

type AlbumRow = QueryResultRow & {
  id: string;
  name: string;
  artist: string;
  image: string;
  genres: string[] | string;
  tracks: string[] | string;
};

type ProfileDefaults = AccountProfile;

const globalForDatabase = globalThis as typeof globalThis & {
  musicfyDatabasePool?: Pool;
  musicfyDatabaseReady?: Promise<void>;
};

function getPool(): Pool {
  if (globalForDatabase.musicfyDatabasePool) return globalForDatabase.musicfyDatabasePool;
  if (process.env.NODE_ENV === 'production'
    && (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 16)) {
    throw new Error('ADMIN_PASSWORD é obrigatória em produção e deve ter pelo menos 16 caracteres.');
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL é obrigatória para conectar ao PostgreSQL.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(connectionString);
  } catch {
    throw new Error('DATABASE_URL deve ser uma URL PostgreSQL válida.');
  }
  if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)
    || !parsedUrl.hostname || !parsedUrl.username || !parsedUrl.password) {
    throw new Error('DATABASE_URL deve ser uma URL PostgreSQL válida.');
  }
  parsedUrl.searchParams.set('sslmode', 'verify-full');
  const pool = new Pool({
    connectionString: parsedUrl.toString(),
    ssl: { rejectUnauthorized: true },
    max: 5,
    connectionTimeoutMillis: 10_000
  });
  globalForDatabase.musicfyDatabasePool = pool;
  return pool;
}

export async function initializeDatabase(): Promise<void> {
  if (globalForDatabase.musicfyDatabaseReady) return globalForDatabase.musicfyDatabaseReady;
  const pool = getPool();
  globalForDatabase.musicfyDatabaseReady = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS albums (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        artist TEXT NOT NULL,
        image TEXT NOT NULL,
        genres JSONB NOT NULL,
        tracks JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        handle TEXT NOT NULL UNIQUE,
        bio TEXT NOT NULL DEFAULT '',
        initials TEXT NOT NULL,
        avatar_image TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS user_follows (
        user_id TEXT NOT NULL,
        artist_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, artist_id)
      );
      CREATE TABLE IF NOT EXISTS user_presaves (
        user_id TEXT NOT NULL,
        album_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, album_id)
      );
      CREATE TABLE IF NOT EXISTS album_reviews (
        user_id TEXT NOT NULL,
        album_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, album_id)
      );
      CREATE INDEX IF NOT EXISTS album_reviews_by_album
        ON album_reviews (album_id, updated_at DESC)
    `);
  })().catch((error: unknown) => {
    globalForDatabase.musicfyDatabaseReady = undefined;
    throw error;
  });
  return globalForDatabase.musicfyDatabaseReady;
}

function getAlbumFromRow(row: AlbumRow): Album {
  const genres = typeof row.genres === 'string' ? JSON.parse(row.genres) as string[] : row.genres;
  const tracks = typeof row.tracks === 'string' ? JSON.parse(row.tracks) as string[] : row.tracks;
  return {
    id: row.id,
    name: row.name,
    artist: row.artist,
    image: row.image,
    genres,
    tracks: tracks.map((name) => ({
      name,
      reviews: [],
      lyrics: '',
      translation: ''
    }))
  };
}

export async function listAlbums(): Promise<Album[]> {
  await initializeDatabase();
  const result = await getPool().query<AlbumRow>(`
    SELECT id, name, artist, image, genres, tracks
    FROM albums
    ORDER BY created_at DESC, id DESC
  `);
  return result.rows.map(getAlbumFromRow);
}

export async function insertAlbum(album: Album): Promise<Album> {
  await initializeDatabase();
  const tracks = album.tracks.map((track) => typeof track === 'string' ? track : track.name);
  const result = await getPool().query<AlbumRow>(`
    INSERT INTO albums (id, name, artist, image, genres, tracks)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO NOTHING
    RETURNING id, name, artist, image, genres, tracks
  `, [album.id, album.name, album.artist, album.image, JSON.stringify(album.genres), JSON.stringify(tracks)]);
  if (result.rows[0]) return getAlbumFromRow(result.rows[0]);
  const existing = await getPool().query<AlbumRow>(`
    SELECT id, name, artist, image, genres, tracks FROM albums WHERE id = $1
  `, [album.id]);
  if (!existing.rows[0]) throw new Error('O álbum salvo não foi encontrado.');
  return getAlbumFromRow(existing.rows[0]);
}

export async function getAccount(userId: string, defaults: ProfileDefaults) {
  await initializeDatabase();
  const pool = getPool();
  await pool.query(`
    INSERT INTO user_profiles (user_id, name, handle, bio, initials, avatar_image)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id) DO NOTHING
  `, [userId, defaults.name, defaults.handle, defaults.bio, defaults.initials, defaults.avatarImage]);
  const [profile, follows, presaves, reviews] = await Promise.all([
    pool.query(`
      SELECT name, handle, bio, initials, avatar_image AS "avatarImage"
      FROM user_profiles WHERE user_id = $1
    `, [userId]),
    pool.query('SELECT artist_id AS id FROM user_follows WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    pool.query('SELECT album_id AS id FROM user_presaves WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    pool.query(`
      SELECT album_id AS "albumId", rating, comment, updated_at AS "updatedAt"
      FROM album_reviews WHERE user_id = $1 ORDER BY updated_at DESC
    `, [userId])
  ]);
  return {
    profile: profile.rows[0],
    followedArtists: follows.rows.map((row) => row.id as string),
    presavedAlbums: presaves.rows.map((row) => row.id as string),
    reviews: reviews.rows
  };
}

export async function updateAccountProfile(userId: string, profile: AccountProfile) {
  await initializeDatabase();
  const result = await getPool().query(`
    UPDATE user_profiles
    SET name = $2, handle = $3, bio = $4, initials = $5,
        avatar_image = $6, updated_at = NOW()
    WHERE user_id = $1
    RETURNING name, handle, bio, initials, avatar_image AS "avatarImage"
  `, [userId, profile.name, profile.handle, profile.bio, profile.initials, profile.avatarImage]);
  return result.rows[0];
}

export async function setArtistFollow(userId: string, artistId: string, following: boolean) {
  await initializeDatabase();
  if (following) {
    await getPool().query(`
      INSERT INTO user_follows (user_id, artist_id) VALUES ($1, $2)
      ON CONFLICT (user_id, artist_id) DO NOTHING
    `, [userId, artistId]);
  } else {
    await getPool().query('DELETE FROM user_follows WHERE user_id = $1 AND artist_id = $2', [userId, artistId]);
  }
}

export async function setAlbumPresave(userId: string, albumId: string, presaved: boolean) {
  await initializeDatabase();
  if (presaved) {
    await getPool().query(`
      INSERT INTO user_presaves (user_id, album_id) VALUES ($1, $2)
      ON CONFLICT (user_id, album_id) DO NOTHING
    `, [userId, albumId]);
  } else {
    await getPool().query('DELETE FROM user_presaves WHERE user_id = $1 AND album_id = $2', [userId, albumId]);
  }
}

export async function saveAlbumReview(userId: string, albumId: string, rating: number, comment: string) {
  await initializeDatabase();
  const result = await getPool().query(`
    INSERT INTO album_reviews (user_id, album_id, rating, comment)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, album_id) DO UPDATE
    SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
    RETURNING album_id AS "albumId", rating, comment, updated_at AS "updatedAt"
  `, [userId, albumId, rating, comment]);
  return result.rows[0];
}

export async function listAlbumReviews(albumId: string) {
  await initializeDatabase();
  const result = await getPool().query(`
    SELECT r.user_id AS "userId", p.name, p.handle, r.rating, r.comment,
           r.updated_at AS "updatedAt"
    FROM album_reviews r
    LEFT JOIN user_profiles p ON p.user_id = r.user_id
    WHERE r.album_id = $1
    ORDER BY r.updated_at DESC
  `, [albumId]);
  return result.rows;
}

export async function listUserReviews(userId: string) {
  await initializeDatabase();
  const result = await getPool().query(`
    SELECT album_id AS "albumId", rating, comment, updated_at AS "updatedAt"
    FROM album_reviews WHERE user_id = $1 ORDER BY updated_at DESC
  `, [userId]);
  return result.rows;
}

export async function checkDatabaseConnection(): Promise<void> {
  await initializeDatabase();
  await getPool().query('SELECT 1');
}

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const usePostgres = Boolean(process.env.DATABASE_URL);
let DatabaseSync;
let sqliteDatabase;
let postgresPool;
let sqliteStatements;

async function initializeDatabase() {
  if (process.env.NODE_ENV === 'production' && !usePostgres) {
    throw new Error('DATABASE_URL é obrigatória em produção; configure o PostgreSQL gerenciado.');
  }
  if (process.env.NODE_ENV === 'production'
    && (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 16)) {
    throw new Error('ADMIN_PASSWORD é obrigatória em produção e deve ter pelo menos 16 caracteres.');
  }

  if (usePostgres) {
    let connectionUrl;
    try {
      connectionUrl = new URL(process.env.DATABASE_URL);
    } catch {
      throw new Error('DATABASE_URL deve ser uma URL de conexão PostgreSQL válida.');
    }
    if (!['postgres:', 'postgresql:'].includes(connectionUrl.protocol)
      || !connectionUrl.hostname
      || !connectionUrl.username
      || !connectionUrl.password) {
      throw new Error('DATABASE_URL deve ser uma URL de conexão PostgreSQL válida.');
    }
    connectionUrl.searchParams.set('sslmode', 'verify-full');
    postgresPool = new Pool({
      connectionString: connectionUrl.toString(),
      ssl: { rejectUnauthorized: true },
      max: 10,
      connectionTimeoutMillis: 10_000
    });
    await postgresPool.query(`
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
    await postgresPool.query(`
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
    return;
  }

  ({ DatabaseSync } = require('node:sqlite'));
  const databasePath = path.resolve(
    process.env.MUSICFY_DB_PATH || path.join(__dirname, '..', 'data', 'musicfy.db')
  );
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  sqliteDatabase = new DatabaseSync(databasePath);
  sqliteDatabase.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      artist TEXT NOT NULL,
      image TEXT NOT NULL,
      genres TEXT NOT NULL,
      tracks TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      handle TEXT NOT NULL COLLATE NOCASE UNIQUE,
      bio TEXT NOT NULL DEFAULT '',
      initials TEXT NOT NULL,
      avatar_image TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_follows (
      user_id TEXT NOT NULL,
      artist_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, artist_id)
    );
    CREATE TABLE IF NOT EXISTS user_presaves (
      user_id TEXT NOT NULL,
      album_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, album_id)
    );
    CREATE TABLE IF NOT EXISTS album_reviews (
      user_id TEXT NOT NULL,
      album_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, album_id)
    );
    CREATE INDEX IF NOT EXISTS album_reviews_by_album
      ON album_reviews (album_id, updated_at DESC);
  `);
  sqliteStatements = {
    list: sqliteDatabase.prepare(`
      SELECT id, name, artist, image, genres, tracks
      FROM albums
      ORDER BY created_at DESC, rowid DESC
    `),
    find: sqliteDatabase.prepare(`
      SELECT id, name, artist, image, genres, tracks
      FROM albums
      WHERE id = ?
    `),
    insert: sqliteDatabase.prepare(`
      INSERT INTO albums (id, name, artist, image, genres, tracks)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `)
  };
}

async function listAlbums() {
  const result = usePostgres
    ? await postgresPool.query(`
      SELECT id, name, artist, image, genres, tracks
      FROM albums
      ORDER BY created_at DESC, id DESC
    `)
    : { rows: sqliteStatements.list.all() };
  return result.rows.map(listAlbumFromRow);
}

async function insertAlbum(album) {
  if (usePostgres) {
    const values = [
      album.id,
      album.name,
      album.artist,
      album.image,
      JSON.stringify(album.genres),
      JSON.stringify(album.tracks)
    ];
    const result = await postgresPool.query(`
      INSERT INTO albums (id, name, artist, image, genres, tracks)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
      RETURNING id, name, artist, image, genres, tracks
    `, values);
    if (result.rows[0]) return listAlbumFromRow(result.rows[0]);

    const existing = await postgresPool.query(`
      SELECT id, name, artist, image, genres, tracks
      FROM albums
      WHERE id = $1
    `, [album.id]);
    return listAlbumFromRow(existing.rows[0]);
  }

  sqliteStatements.insert.run(
    album.id,
    album.name,
    album.artist,
    album.image,
    JSON.stringify(album.genres),
    JSON.stringify(album.tracks)
  );
  return listAlbumFromRow(sqliteStatements.find.get(album.id));
}

async function getAccount(userId, defaultProfile) {
  if (usePostgres) {
    await postgresPool.query(`
      INSERT INTO user_profiles (user_id, name, handle, bio, initials, avatar_image)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO NOTHING
    `, [
      userId,
      defaultProfile.name,
      defaultProfile.handle,
      defaultProfile.bio,
      defaultProfile.initials,
      defaultProfile.avatarImage
    ]);
    const [profile, follows, presaves, reviews] = await Promise.all([
      postgresPool.query(`
        SELECT name, handle, bio, initials, avatar_image AS "avatarImage"
        FROM user_profiles WHERE user_id = $1
      `, [userId]),
      postgresPool.query(`
        SELECT artist_id AS id FROM user_follows
        WHERE user_id = $1 ORDER BY created_at DESC
      `, [userId]),
      postgresPool.query(`
        SELECT album_id AS id FROM user_presaves
        WHERE user_id = $1 ORDER BY created_at DESC
      `, [userId]),
      postgresPool.query(`
        SELECT album_id AS "albumId", rating, comment, updated_at AS "updatedAt"
        FROM album_reviews WHERE user_id = $1 ORDER BY updated_at DESC
      `, [userId])
    ]);
    return {
      profile: profile.rows[0],
      followedArtists: follows.rows.map((row) => row.id),
      presavedAlbums: presaves.rows.map((row) => row.id),
      reviews: reviews.rows
    };
  }

  sqliteDatabase.prepare(`
    INSERT INTO user_profiles (user_id, name, handle, bio, initials, avatar_image)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO NOTHING
  `).run(
    userId,
    defaultProfile.name,
    defaultProfile.handle,
    defaultProfile.bio,
    defaultProfile.initials,
    defaultProfile.avatarImage
  );
  const profile = sqliteDatabase.prepare(`
    SELECT name, handle, bio, initials, avatar_image AS avatarImage
    FROM user_profiles WHERE user_id = ?
  `).get(userId);
  const follows = sqliteDatabase.prepare(`
    SELECT artist_id AS id FROM user_follows
    WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId);
  const presaves = sqliteDatabase.prepare(`
    SELECT album_id AS id FROM user_presaves
    WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId);
  const reviews = sqliteDatabase.prepare(`
    SELECT album_id AS albumId, rating, comment, updated_at AS updatedAt
    FROM album_reviews WHERE user_id = ? ORDER BY updated_at DESC
  `).all(userId);
  return {
    profile,
    followedArtists: follows.map((row) => row.id),
    presavedAlbums: presaves.map((row) => row.id),
    reviews
  };
}

async function updateAccountProfile(userId, profile) {
  if (usePostgres) {
    const result = await postgresPool.query(`
      UPDATE user_profiles
      SET name = $2, handle = $3, bio = $4, initials = $5,
          avatar_image = $6, updated_at = NOW()
      WHERE user_id = $1
      RETURNING name, handle, bio, initials, avatar_image AS "avatarImage"
    `, [userId, profile.name, profile.handle, profile.bio, profile.initials, profile.avatarImage]);
    return result.rows[0];
  }
  sqliteDatabase.prepare(`
    UPDATE user_profiles
    SET name = ?, handle = ?, bio = ?, initials = ?, avatar_image = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(profile.name, profile.handle, profile.bio, profile.initials, profile.avatarImage, userId);
  return sqliteDatabase.prepare(`
    SELECT name, handle, bio, initials, avatar_image AS avatarImage
    FROM user_profiles WHERE user_id = ?
  `).get(userId);
}

async function setArtistFollow(userId, artistId, following) {
  if (usePostgres) {
    if (following) {
      await postgresPool.query(`
        INSERT INTO user_follows (user_id, artist_id) VALUES ($1, $2)
        ON CONFLICT (user_id, artist_id) DO NOTHING
      `, [userId, artistId]);
    } else {
      await postgresPool.query('DELETE FROM user_follows WHERE user_id = $1 AND artist_id = $2', [userId, artistId]);
    }
    return;
  }
  if (following) {
    sqliteDatabase.prepare(`
      INSERT INTO user_follows (user_id, artist_id) VALUES (?, ?)
      ON CONFLICT(user_id, artist_id) DO NOTHING
    `).run(userId, artistId);
  } else {
    sqliteDatabase.prepare('DELETE FROM user_follows WHERE user_id = ? AND artist_id = ?').run(userId, artistId);
  }
}

async function setAlbumPresave(userId, albumId, presaved) {
  if (usePostgres) {
    if (presaved) {
      await postgresPool.query(`
        INSERT INTO user_presaves (user_id, album_id) VALUES ($1, $2)
        ON CONFLICT (user_id, album_id) DO NOTHING
      `, [userId, albumId]);
    } else {
      await postgresPool.query('DELETE FROM user_presaves WHERE user_id = $1 AND album_id = $2', [userId, albumId]);
    }
    return;
  }
  if (presaved) {
    sqliteDatabase.prepare(`
      INSERT INTO user_presaves (user_id, album_id) VALUES (?, ?)
      ON CONFLICT(user_id, album_id) DO NOTHING
    `).run(userId, albumId);
  } else {
    sqliteDatabase.prepare('DELETE FROM user_presaves WHERE user_id = ? AND album_id = ?').run(userId, albumId);
  }
}

async function saveAlbumReview(userId, albumId, rating, comment) {
  if (usePostgres) {
    const result = await postgresPool.query(`
      INSERT INTO album_reviews (user_id, album_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, album_id) DO UPDATE
      SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
      RETURNING album_id AS "albumId", rating, comment, updated_at AS "updatedAt"
    `, [userId, albumId, rating, comment]);
    return result.rows[0];
  }
  sqliteDatabase.prepare(`
    INSERT INTO album_reviews (user_id, album_id, rating, comment)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, album_id) DO UPDATE
    SET rating = excluded.rating, comment = excluded.comment, updated_at = CURRENT_TIMESTAMP
  `).run(userId, albumId, rating, comment);
  return sqliteDatabase.prepare(`
    SELECT album_id AS albumId, rating, comment, updated_at AS updatedAt
    FROM album_reviews WHERE user_id = ? AND album_id = ?
  `).get(userId, albumId);
}

async function listAlbumReviews(albumId) {
  const result = usePostgres
    ? await postgresPool.query(`
      SELECT r.user_id AS "userId", p.name, p.handle, r.rating, r.comment,
             r.updated_at AS "updatedAt"
      FROM album_reviews r
      LEFT JOIN user_profiles p ON p.user_id = r.user_id
      WHERE r.album_id = $1
      ORDER BY r.updated_at DESC
    `, [albumId])
    : { rows: sqliteDatabase.prepare(`
      SELECT r.user_id AS userId, p.name, p.handle, r.rating, r.comment,
             r.updated_at AS updatedAt
      FROM album_reviews r
      LEFT JOIN user_profiles p ON p.user_id = r.user_id
      WHERE r.album_id = ?
      ORDER BY r.updated_at DESC
    `).all(albumId) };
  return result.rows;
}

async function listUserReviews(userId) {
  const result = usePostgres
    ? await postgresPool.query(`
      SELECT album_id AS "albumId", rating, comment, updated_at AS "updatedAt"
      FROM album_reviews WHERE user_id = $1 ORDER BY updated_at DESC
    `, [userId])
    : { rows: sqliteDatabase.prepare(`
      SELECT album_id AS albumId, rating, comment, updated_at AS updatedAt
      FROM album_reviews WHERE user_id = ? ORDER BY updated_at DESC
    `).all(userId) };
  return result.rows;
}

function listAlbumFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    artist: row.artist,
    image: row.image,
    genres: typeof row.genres === 'string' ? JSON.parse(row.genres) : row.genres,
    tracks: (typeof row.tracks === 'string' ? JSON.parse(row.tracks) : row.tracks)
      .map((name) => ({
        name,
        reviews: [],
        lyrics: '',
        translation: ''
      }))
  };
}

async function checkDatabaseConnection() {
  if (usePostgres) {
    await postgresPool.query('SELECT 1');
    return;
  }
  sqliteDatabase.prepare('SELECT 1').get();
}

async function closeDatabase() {
  if (postgresPool) await postgresPool.end();
  if (sqliteDatabase) sqliteDatabase.close();
}

module.exports = {
  checkDatabaseConnection,
  closeDatabase,
  getAccount,
  initializeDatabase,
  insertAlbum,
  listAlbumReviews,
  listAlbums,
  listUserReviews,
  saveAlbumReview,
  setAlbumPresave,
  setArtistFollow,
  updateAccountProfile
};

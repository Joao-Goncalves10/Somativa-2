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
  initializeDatabase,
  insertAlbum,
  listAlbums
};

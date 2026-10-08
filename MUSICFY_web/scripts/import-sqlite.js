const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

require('./load-env');

if (!process.env.DATABASE_URL) {
  console.error('Defina DATABASE_URL para apontar para o banco PostgreSQL de destino.');
  process.exit(1);
}

const sourcePath = path.resolve(
  process.env.MUSICFY_SQLITE_PATH || path.join(__dirname, '..', 'data', 'musicfy.db')
);
if (!fs.existsSync(sourcePath)) {
  console.error(`O banco SQLite de origem não foi encontrado: ${sourcePath}`);
  process.exit(1);
}

const {
  closeDatabase,
  initializeDatabase,
  insertAlbum
} = require('../server/database');

async function importAlbums() {
  const source = new DatabaseSync(sourcePath, { readOnly: true });
  try {
    const rows = source.prepare(`
      SELECT id, name, artist, image, genres, tracks
      FROM albums
      ORDER BY created_at, rowid
    `).all();

    await initializeDatabase();
    for (const row of rows) {
      const genres = JSON.parse(row.genres);
      const tracks = JSON.parse(row.tracks).map((track) =>
        typeof track === 'string' ? track : track.name
      );
      if (!tracks.every((track) => typeof track === 'string')) {
        throw new TypeError(`A lista de faixas do álbum "${row.id}" não é válida.`);
      }
      await insertAlbum({ ...row, genres, tracks });
    }

    console.log(`Importação concluída: ${rows.length} álbum(ns) processado(s).`);
    console.log('Álbuns com identificadores já existentes foram preservados, sem sobrescrita.');
  } finally {
    source.close();
    await closeDatabase();
  }
}

importAlbums().catch((error) => {
  console.error('Não foi possível importar os álbuns para o PostgreSQL.', error);
  process.exitCode = 1;
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, test } = require('node:test');

delete process.env.DATABASE_URL;
const databasePath = path.join(os.tmpdir(), `musicfy-test-${process.pid}.db`);
process.env.MUSICFY_DB_PATH = databasePath;
const database = require('../server/database');

after(async () => {
  await database.closeDatabase();
  for (const suffix of ['', '-shm', '-wal']) {
    const filePath = `${databasePath}${suffix}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

test('stores profiles, preferences, and reviews separately per account', async () => {
  await database.initializeDatabase();

  const defaultProfile = {
    name: 'Ana Silva',
    handle: 'ana-12345678',
    bio: '',
    initials: 'AS',
    avatarImage: ''
  };
  const firstAccount = await database.getAccount('user-1', defaultProfile);
  assert.equal(firstAccount.profile.name, 'Ana Silva');
  assert.deepEqual(firstAccount.followedArtists, []);
  assert.deepEqual(firstAccount.presavedAlbums, []);
  assert.deepEqual(firstAccount.reviews, []);

  await database.setArtistFollow('user-1', 'dua-lipa', true);
  await database.setAlbumPresave('user-1', 'upcoming-album', true);
  await database.saveAlbumReview('user-1', 'sour', 4, 'Ótimo álbum.');

  const secondAccount = await database.getAccount('user-2', {
    ...defaultProfile,
    name: 'Bia Souza',
    handle: 'bia-87654321',
    initials: 'BS'
  });
  assert.deepEqual(secondAccount.followedArtists, []);
  assert.deepEqual(secondAccount.presavedAlbums, []);
  assert.deepEqual(secondAccount.reviews, []);

  const updatedReview = await database.saveAlbumReview('user-1', 'sour', 5, 'Mudei de ideia.');
  assert.equal(updatedReview.rating, 5);
  assert.equal(updatedReview.comment, 'Mudei de ideia.');
  assert.deepEqual(await database.listUserReviews('user-1').then((reviews) =>
    reviews.map(({ albumId, rating }) => ({ albumId, rating }))
  ), [{ albumId: 'sour', rating: 5 }]);

  const publicReviews = await database.listAlbumReviews('sour');
  assert.equal(publicReviews.length, 1);
  assert.equal(publicReviews[0].name, 'Ana Silva');

  await database.setArtistFollow('user-1', 'dua-lipa', false);
  await database.setAlbumPresave('user-1', 'upcoming-album', false);
  const clearedAccount = await database.getAccount('user-1', defaultProfile);
  assert.deepEqual(clearedAccount.followedArtists, []);
  assert.deepEqual(clearedAccount.presavedAlbums, []);
});

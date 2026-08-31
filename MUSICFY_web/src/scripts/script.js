const albums = {
  sour: {
    name: 'SOUR',
    artist: 'Olivia Rodrigo',
    image: 'src/img/SOUR_OliviaRodrigo_cover.jpg',
    tracks: [
      { name: 'brutal', reviews: ['5/5', '4/5', '5/5'] },
      { name: 'traitor', reviews: ['4/5', '5/5', '5/5'] },
      { name: 'drivers license', reviews: ['5/5', '5/5', '4/5'] },
      { name: '1 step forward, 3 steps back', reviews: ['5/5', '4/5', '5/5'] },
      { name: 'deja vu', reviews: ['4/5', '5/5', '3/5'] },
      { name: 'good 4 u', reviews: ['5/5', '4/5', '5/5'] },
      { name: 'enough for you', reviews: ['4/5', '5/5', '5/5'] },
      { name: 'happier', reviews: ['5/5', '1/5', '2/5'] },
      { name: 'jealousy, jealousy', reviews: ['4/5', '3/5', '5/5'] },
      { name: 'favorite crime', reviews: ['2/5', '3/5', '3/5'] },
      { name: 'hope ur ok', reviews: ['5/5', '3/5', '4/5'] }
    ]
  },
  petal: {
    name: 'Petal',
    artist: 'Ariana Grande',
    image: 'src/img/petal_cover.jpg',
    tracks: [
      { name: 'kiss me', reviews: ['4/5', '5/5', '4/5'] },
      { name: 'hate that i made you love me', reviews: ['5/5', '4/5', '5/5'] },
      { name: 'petal', reviews: ['4/5', '4/5', '5/5'] },
      { name: 'stay', reviews: ['4/5', '5/5', '4/5'] },
      { name: 'oh well', reviews: ['5/5', '4/5', '5/5'] },
      { name: 'big feelings', reviews: ['4/5', '4/5', '5/5'] },
      { name: 'freak', reviews: ['4/5', '5/5', '4/5'] },
      { name: 'warning signs', reviews: ['5/5', '4/5', '5/5'] },
      { name: 'like i do', reviews: ['4/5', '4/5', '5/5'] },
      { name: 'never get over me', reviews: ['4/5', '4/5', '5/5'] },
      { name: 'bad thing (bunny hop)', reviews: ['4/5', '4/5', '5/5'] },
      { name: 'nowhere, nobody', reviews: ['4/5', '4/5', '5/5'] }
    ]
  },
  'so-close-to-what': {
    name: 'So Close to What',
    artist: 'Tate McRae',
    image: 'src/img/SoCloseToWhat_Tate_cover.jpg',
    tracks: [
      { name: 'Miss Possessive', reviews: ['4/5', '5/5', '4/5'] },
      { name: '2 hands', reviews: ['5/5', '4/5', '5/5'] },
      { name: 'Revolving door', reviews: ['5/5', '5/5', '4/5'] },
      { name: 'bloodinmyhands (feat. Flo Milli)', reviews: ['4/5', '5/5', '4/5'] },
      { name: 'Dear god', reviews: ['5/5', '4/5', '5/5'] },
      { name: 'Purple lace bra', reviews: ['4/5', '5/5', '4/5'] },
      { name: 'Sports car', reviews: ['5/5', '4/5', '5/5'] },
      { name: 'Signs', reviews: ['4/5', '5/5', '4/5'] },
      { name: 'I know love (feat. The KID LAROI)', reviews: ['5/5', '2/5', '5/5'] },
      { name: 'Like i do', reviews: ['5/5', '5/5', '4/5'] },
      { name: 'Its ok im ok', reviews: ['4/5', '5/5', '4/5'] },
      { name: 'No im not in love', reviews: ['5/5', '5/5', '5/5'] },
      { name: 'Means i care', reviews: ['4/5', '5/5', '4/5'] },
      { name: 'Greenlight', reviews: ['4/5', '4/5', '1/5'] },
      { name: 'Nostalgia', reviews: ['4/5', '4/5', '3/5'] }
    ]
  }
};

document.addEventListener('DOMContentLoaded', function () {
  // 1. Redirecionamento dos botões da página principal (index.html)
  const albumIds = ['sour', 'petal', 'so-close-to-what'];
  const botoesAvaliar = document.querySelectorAll('.botao-avaliar');

  botoesAvaliar.forEach((button, index) => {
    button.addEventListener('click', function () {
      const id = albumIds[index];
      if (id) {
        window.location.href = `album.html?id=${id}`;
      }
    });
  });

  // 2. Preenchimento e eventos da página de detalhes (album.html)
  const params = new URLSearchParams(window.location.search);
  const albumId = params.get('id');

  if (albumId && albums[albumId]) {
    const album = albums[albumId];

    const albumName = document.getElementById('albumName');
    const albumArtist = document.getElementById('albumArtist');
    const albumCover = document.getElementById('albumCover');
    const trackList = document.getElementById('trackList');
    const trackReviews = document.getElementById('trackReviews');

    if (albumName) albumName.textContent = album.name;
    if (albumArtist) albumArtist.textContent = album.artist;
    if (albumCover) {
      albumCover.src = album.image;
      albumCover.alt = album.name;
    }

    if (trackList) {
      trackList.innerHTML = album.tracks.map((track, index) => 
        `<div class="track-item">
          <strong>${index + 1}. ${track.name}</strong>
          <span class="text-muted">${track.reviews.join(' • ')}</span>
        </div>`
      ).join('');
    }

    if (trackReviews) {
      trackReviews.innerHTML = album.tracks.map(track => 
        `<div class="card mb-3 shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-2 fw-bold">${track.name}</h5>
            <p class="mb-0 text-muted">${track.reviews.join(' • ')}</p>
          </div>
        </div>`
      ).join('');
    }

    const avaliarBtn = document.getElementById('avaliarAlbumBtn');
    const reviewForm = document.getElementById('albumReviewForm');

    if (avaliarBtn && reviewForm) {
      avaliarBtn.addEventListener('click', function () {
        reviewForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    if (reviewForm) {
      reviewForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const rating = document.getElementById('albumRating').value;
        const reviewText = document.getElementById('albumReviewText').value;

        const item = document.createElement('div');
        item.className = 'card mb-3 shadow-sm';
        item.innerHTML = `
          <div class="card-body">
            <h5 class="card-title mb-2 fw-bold">Sua Avaliação</h5>
            <p class="mb-1"><strong>Nota:</strong> ${rating} ★</p>
            <p class="mb-0 text-muted">${reviewText || 'Sem comentário'}</p>
          </div>`;

        if (trackReviews) {
          trackReviews.prepend(item);
        }

        reviewForm.reset();
        alert('Avaliação salva com sucesso!');
      });
    }
  }
});
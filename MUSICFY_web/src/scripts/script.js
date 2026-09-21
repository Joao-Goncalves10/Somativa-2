// Armazena as informações dos álbuns, das músicas e das avaliações exibidas no site.
const albums = {
  sour: {
    name: 'SOUR',
    artist: 'Olivia Rodrigo',
    image: 'src/img/SOUR_OliviaRodrigo_cover.jpg',
    tracks: [
      { name: 'brutal', reviews: ['5/5'] },
      { name: 'traitor', reviews: ['4/5'] },
      { name: 'drivers license', reviews: ['5/5'] },
      { name: '1 step forward, 3 steps back', reviews: ['5/5'] },
      { name: 'deja vu', reviews: ['4/5'] },
      { name: 'good 4 u', reviews: ['5/5'] },
      { name: 'enough for you', reviews: ['3/5'] },
      { name: 'happier', reviews: ['5/5'] },
      { name: 'jealousy, jealousy', reviews: ['4/5'] },
      { name: 'favorite crime', reviews: ['3/5'] },
      { name: 'hope ur ok', reviews: ['5/5'] }
    ]
  },
  ruby: {
    name: 'Ruby',
    artist: 'JENNIE',
    image: 'src/img/ruby_jennie_cover.svg',
    tracks: [
      { name: 'Intro: JANE (feat. FKJ)', reviews: ['4/5'] },
      { name: 'like JENNIE', reviews: ['5/5'] },
      { name: 'start a war', reviews: ['4/5'] },
      { name: 'Handlebars (feat. Dua Lipa)', reviews: ['4/5'] },
      { name: 'with the IE (way up)', reviews: ['4/5'] },
      { name: 'ExtraL (feat. Doechii)', reviews: ['5/5'] },
      { name: 'Mantra', reviews: ['5/5'] },
      { name: 'Love Hangover (feat. Dominick Fike)', reviews: ['4/5'] },
      { name: 'ZEN', reviews: ['5/5'] },
      { name: 'Damn Right (feat. Childish Gambino & Kali Uchis)', reviews: ['5/5'] },
      { name: 'FTS', reviews: ['4/5'] },
      { name: 'Filter', reviews: ['4/5'] },
      { name: 'Seoul City', reviews: ['4/5'] },
      { name: 'Starlight', reviews: ['4/5'] },
      { name: 'twin', reviews: ['4/5'] },
    ]
  },
  petal: {
    name: 'petal',
    artist: 'Ariana Grande',
    image: 'src/img/petal_cover.jpg',
    tracks: [
      { name: 'kiss me', reviews: ['4/5'] },
      { name: 'hate that i made you love me', reviews: ['5/5'] },
      { name: 'petal', reviews: ['4/5'] },
      { name: 'stay', reviews: ['4/5'] },
      { name: 'oh well', reviews: ['5/5'] },
      { name: 'big feelings', reviews: ['4/5'] },
      { name: 'freak', reviews: ['4/5'] },
      { name: 'warning signs', reviews: ['4/5'] },
      { name: 'like i do', reviews: ['4/5'] },
      { name: 'never get over me', reviews: ['4/5'] },
      { name: 'bad thing (bunny hop)', reviews: ['4/5'] },
      { name: 'nowhere, nobody', reviews: ['5/5'] }
    ]
    },
  positions: {
    name: 'positions',
    artist: 'Ariana Grande',
    image: 'src/img/positions_ariana_cover.svg',
    tracks: [
      { name: 'shut up', reviews: ['4/5'] },
      { name: '34+35', reviews: ['5/5'] },
      { name: 'motive', reviews: ['4/5'] },
      { name: 'just like magic', reviews: ['4/5'] },
      { name: 'off the table', reviews: ['5/5'] },
      { name: 'six thirty', reviews: ['4/5'] },
      { name: 'safety net', reviews: ['5/5'] },
      { name: 'my hair', reviews: ['4/5'] },
      { name: 'nasty', reviews: ['4/5'] },
      { name: 'west side', reviews: ['4/5'] },
      { name: 'love language', reviews: ['5/5'] },
      { name: 'positions', reviews: ['5/5'] },
      { name: 'obvious', reviews: ['4/5'] },
      { name: 'pov', reviews: ['5/5'] }
    ]
  },
  prima: {
    name: 'PRIMA',
    artist: 'ADÉLA',
    image: 'src/img/prima_cover.png.jpg',
    tracks: [
      {
        name: 'KGB',
        reviews: ['4/5'],
        lyrics: `Starin' at a TV screen till I got bloody eyes
Just a little European girl, was plottin' on my rise
Eighteen, immigrated (yeah)
A star in the makin' (yeah)
No, I'm not bein' cocky, I just worked my whole life

You want a popstar with a big bra for them big hits
I wanna pop off so these big mouths can't say shit
I was, like, eight, workin' the night shift to learn English
I'm like a spy, I studied this shit, call me the KGBitch

Call, call me the KGBitch
Call, call me the KG—, ah
I'm like a spy, I studied this shit, call me the KGBitch
Call, call me the KGBitch
Call, call me the KG—, haha
I'm like a spy, I studied this shit, call me the KGBitch

Lurkin' on my Instagram, my Twitter, and my TikTok
All my OG haters, yeah, they're swingin' from my dick now
Lurkin' on my Instagram, my Twitter, and my TikTok
All my OG haters, yeah, they're swingin' from my dick now

You want a popstar with a big bra for them big hits
I wanna pop off so these big mouths can't say shit
I was, like, eight, workin' the night shift to learn English
I'm like a spy, I studied this shit, call me the KGBitch

Call, call me the KGBitch
Call, call me the KG—, ah (ah)
I'm like a spy, I studied this shit, call me the KGBitch (ah)
Call, call me the KGBitch
Call, call me the KG—, haha (ah)
I'm like a spy, I studied this shit, call me the KGBitch (ah)

I'm forward, I'm foreign, forgive the way I say this
I'm pretty important, na-na-na-na-na-na
I'm forward, I'm foreign, forgive the way I say this
I'm pretty important, na-na-na-na-na-na

Call, call me the KGBitch (na-na-na-na-na-na)
Call, call me the KG—, ah (ah, na-na-na-na-na-na)
I'm like a spy, I studied this shit, call me the KGBitch (ah)
Call, call me the KGBitch (na-na-na-na-na-na)
Call, call me the KG—, haha (ah, na-na-na-na-na-na)
I'm like a spy, I studied this shit, call me the KGBitch (ah)

(Call me the)
(Call me the)
(I'm like a spy, I studied this shit, call me the KGBitch)`,
  translation: `Encarando uma tela de TV até meus olhos ficarem vermelhos
Só uma garotinha europeia, planejando minha ascensão
Dezoito anos, imigrante (yeah)
Uma estrela em formação (yeah)
Não estou sendo convencida, apenas trabalhei a vida inteira

Você quer uma popstar com um sutiã grande para aqueles grandes hits
Eu quero explodir para que essas bocas grandes não possam falar merda
Eu tinha, tipo, oito anos, trabalhando no turno da noite para aprender inglês
Sou como uma espiã, estudei tudo isso, pode me chamar de KGBitch

Me chame, me chame de KGBitch
Me chame, me chame de KG—, ah
Sou como uma espiã, estudei tudo isso, pode me chamar de KGBitch
Me chame, me chame de KGBitch
Me chame, me chame de KG—, haha
Sou como uma espiã, estudei tudo isso, pode me chamar de KGBitch

Fuçando meu Instagram, meu Twitter e meu TikTok
Todos os meus antigos haters, agora estão obcecados comigo
Fuçando meu Instagram, meu Twitter e meu TikTok
Todos os meus antigos haters, agora estão obcecados comigo

Você quer uma popstar com um sutiã grande para aqueles grandes hits
Eu quero explodir para que essas bocas grandes não possam falar merda
Eu tinha, tipo, oito anos, trabalhando no turno da noite para aprender inglês
Sou como uma espiã, estudei tudo isso, pode me chamar de KGBitch

Me chame, me chame de KGBitch
Me chame, me chame de KG—, ah (ah)
Sou como uma espiã, estudei tudo isso, pode me chamar de KGBitch (ah)
Me chame, me chame de KGBitch
Me chame, me chame de KG—, haha (ah)
Sou como uma espiã, estudei tudo isso, pode me chamar de KGBitch (ah)

Sou direta, sou estrangeira, perdoe o jeito que digo isso
Sou bastante importante, na-na-na-na-na-na
Sou direta, sou estrangeira, perdoe o jeito que digo isso
Sou bastante importante, na-na-na-na-na-na

Me chame, me chame de KGBitch (na-na-na-na-na-na)
Me chame, me chame de KG—, ah (ah, na-na-na-na-na-na)
Sou como uma espiã, estudei tudo isso, pode me chamar de KGBitch (ah)
Me chame, me chame de KGBitch (na-na-na-na-na-na)
Me chame, me chame de KG—, haha (ah, na-na-na-na-na-na)
Sou como uma espiã, estudei tudo isso, pode me chamar de KGBitch (ah)

(Me chame de)
(Me chame de)
(Sou como uma espiã, estudei tudo isso, pode me chamar de KGBitch)`
      },
      {
        name: 'Nicole Kidman',
        reviews: ['5/5'],
        lyrics: `(Oh-oh-whoa, whoa)
('Body with me)
(Oh, hey, yeah, yeah, ooh, you're so good, ooh, ooh)

Every single night
I pray that my tits are sittin' right
Moulin Rouge, my corset is so tight
Babygirl in control, I feel like Nicole
And every single day
I wake up, the world is my buffet
I fly out, fuck up another stage
Babygirl in control, I feel like Nicole
I feel like

Ooh, spend a couple hours in my room
Should I wear Louboutins or Jimmy Choos?
Try 'em in the mirror, fully nude
Like, ooh-ooh, ooh-ooh, ooh (ooh)
My bra should probably be a bigger size
Maybe that's why they can't look me in my eyes (they're up here)
Been a minute since the driver's been outside
I gotta slide, slide

I pull up (uh-huh), step out (uh-huh)
Get your pictures 'cause I'm not gonna stay for long
I'll say hi (I'm gone), bye-bye
Live vicariously through me, write my life like it's a movie, like

Every single night
I pray that my tits are sittin' right
Moulin Rouge, my corset is so tight
Babygirl in control, I feel like Nicole (I feel like)
And every single day
I wake up, the world is my buffet
I fly out, fuck up another stage
Babygirl in control, I feel like Nicole
I feel like

Don't (don't, don't) interrupt me
When I talk my shit, don't interrupt me
'Cause everything you say it dictates your destiny (uh-ah)
That's why I put Pop Princess on my license plate (ah)

I pull up (uh-huh), step out (uh-huh)
Get your pictures 'cause I'm not gonna stay for long
I'll say hi (I'm gone), bye-bye
Live vicariously through me, write my life like it's a movie, like

Every single night
I pray that my tits are sittin' right
Moulin Rouge, my corset is so tight
Babygirl in control, I feel like Nicole (I feel like Nicole)
And every single day
I wake up, the world is my buffet
I fly out, fuck up another stage
Babygirl in control, I feel like Nicole
I feel like

Tonight (tonight)
I'm so in control (I'm so in)
Tonight (tonight)
I feel like Nicole`,
  translation: `(Oh-oh-uau, uau)
(“Corpo comigo”)
(Oh, ei, yeah, yeah, ooh, você é tão bom, ooh, ooh)

Todas as noites
Eu rezo para que meus seios estejam no lugar certo
Moulin Rouge, meu espartilho está tão apertado
Garota no controle, eu me sinto como a Nicole
E todos os dias
Eu acordo, o mundo é o meu banquete
Eu saio voando, arraso em mais um palco
Garota no controle, eu me sinto como a Nicole
Eu me sinto como

Ooh, passo algumas horas no meu quarto
Será que uso Louboutins ou Jimmy Choos?
Experimento na frente do espelho, completamente nua
Tipo, ooh-ooh, ooh-ooh, ooh (ooh)
Meu sutiã provavelmente deveria ser de um tamanho maior
Talvez seja por isso que não conseguem olhar nos meus olhos (eles estão aqui em cima)
Faz um tempo que o motorista não sai
Eu tenho que ir, ir

Eu chego (uh-huh), saio do carro (uh-huh)
Tirem suas fotos, porque não vou ficar por muito tempo
Eu digo oi (já fui), tchau-tchau
Vivam através de mim, escrevam minha vida como se fosse um filme, tipo

Todas as noites
Eu rezo para que meus seios estejam no lugar certo
Moulin Rouge, meu espartilho está tão apertado
Garota no controle, eu me sinto como a Nicole (eu me sinto como)
E todos os dias
Eu acordo, o mundo é o meu banquete
Eu saio voando, arraso em mais um palco
Garota no controle, eu me sinto como a Nicole
Eu me sinto como

Não (não, não) me interrompa
Quando eu falo minhas verdades, não me interrompa
Porque tudo o que você diz determina o seu destino (uh-ah)
Por isso coloquei Princesa do Pop na minha placa (ah)

Eu chego (uh-huh), saio do carro (uh-huh)
Tirem suas fotos, porque não vou ficar por muito tempo
Eu digo oi (já fui), tchau-tchau
Vivam através de mim, escrevam minha vida como se fosse um filme, tipo

Todas as noites
Eu rezo para que meus seios estejam no lugar certo
Moulin Rouge, meu espartilho está tão apertado
Garota no controle, eu me sinto como a Nicole (eu me sinto como a Nicole)
E todos os dias
Eu acordo, o mundo é o meu banquete
Eu saio voando, arraso em mais um palco
Garota no controle, eu me sinto como a Nicole
Eu me sinto como

Esta noite (esta noite)
Estou totalmente no controle (estou mesmo)
Esta noite (esta noite)
Eu me sinto como a Nicole`
      },
      { name: 'Im The Man', reviews: ['4/5'] },
      { name: 'Boys', reviews: ['4/5'] },
      { name: 'Red Bottoms', reviews: ['5/5'] },
      { name: 'Hitachi', reviews: ['4/5'] },
      { name: 'Fantasize', reviews: ['4/5'] },
      { name: 'Starving Artist', reviews: ['5/5'] },
      { name: 'Marijuana', reviews: ['4/5'] },
      { name: 'Therapy', reviews: ['4/5'] },
      { name: 'Aint In LA', reviews: ['4/5'] },
    ]
  },
  'so-close-to-what': {
    name: 'So Close to What',
    artist: 'Tate McRae',
    image: 'src/img/soclosetowhat_cover.png.jpg',
    tracks: [
      { name: 'Miss Possessive', reviews: ['4/5'] },
      { name: '2 hands', reviews: ['5/5'] },
      { name: 'Revolving door', reviews: ['5/5'] },
      { name: 'bloodinmyhands (feat. Flo Milli)', reviews: ['4/5'] },
      { name: 'Dear god', reviews: ['5/5'] },
      { name: 'Purple lace bra', reviews: ['4/5'] },
      { name: 'Sports car', reviews: ['5/5'] },
      { name: 'Signs', reviews: ['4/5'] },
      { name: 'I know love (feat. The KID LAROI)', reviews: ['5/5'] },
      { name: 'Like i do', reviews: ['5/5'] },
      { name: 'Its ok im ok', reviews: ['4/5'] },
      { name: 'No im not in love', reviews: ['5/5'] },
      { name: 'Means i care', reviews: ['4/5'] },
      { name: 'Greenlight', reviews: ['4/5'] },
      { name: 'Nostalgia', reviews: ['2/5'] }
    ]
  },
  'worst-girl-in-america': {
    name: 'WOR$T GIRL IN AMERICA',
    artist: 'Slayyyter',
    image: 'src/img/worstgirlinamerica_cover.png',
    tracks: [
      { name: "DANCE...", reviews: ['4/5'] },
      { name: 'BEAT UP CHANEL$', reviews: ['5/5'] },
      { name: 'CANNIBALISM!', reviews: ['4/5'] },
      { name: 'OLD TECHNOLOGY', reviews: ['4/5'] },
      { name: 'CRANK', reviews: ['4/5'] },
      { name: 'GAS STATION', reviews: ['5/5'] },
      { name: 'YES GODDD', reviews: ['4/5'] },
      { name: 'UNKNOWN LOVERZ', reviews: ['4/5'] },
      { name: 'OLD FLING$', reviews: ['4/5'] },
      { name: "I'M ACTUALLY KINDA FAMOUS", reviews: ['4/5'] },
      { name: '$T. LOSER', reviews: ['4/5'] },
      { name: 'WHAT IS IT LIKE, TO BE LIKED?', reviews: ['4/5'] },
      { name: '*PRAYER*', reviews: ['4/5'] },
      { name: 'BRITNEY MURPHY.', reviews: ['4/5'] },
    ]
  },
  lemonade: {
    name: 'LEMONADE',
    artist: 'aespa',
    image: 'src/img/lemonade_aespa_cover.svg',
    tracks: [
      { name: 'WDA (Whole Different Animal) (feat. G-DRAGON)', reviews: ['4/5'] },
      { name: 'LEMONADE', reviews: ['4/5'] },
      { name: "SHAKIN'", reviews: ['4/5'] },
      { name: "Can't Help Myself", reviews: ['4/5'] },
      { name: 'Camouflage', reviews: ['5/5'] },
      { name: 'Bite', reviews: ['4/5'] },
      { name: 'Switchblade (feat. Ty Dolla $ign)', reviews: ['4/5'] },
      { name: 'Roll', reviews: ['4/5'] },
      { name: 'My Plan', reviews: ['4/5'] },
      { name: "'Till We Die", reviews: ['4/5'] },
    ]
  }
};

// Garante que todas as músicas tenham a mesma estrutura para letra e tradução.
Object.values(albums).forEach((album) => {
  album.tracks = album.tracks.map((track) => ({
    ...track,
    lyrics: track.lyrics || '',
    translation: track.translation || ''
  }));
});

document.addEventListener('DOMContentLoaded', function () {
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('musicfy-theme');

  function updateTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(isDark));
      themeToggle.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');
      themeToggle.querySelector('.theme-toggle__label').textContent = isDark ? 'Modo claro' : 'Modo escuro';
      themeToggle.querySelector('.theme-toggle__icon').textContent = isDark ? '☼' : '◐';
    }
  }

  updateTheme(savedTheme === 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const isDark = !document.body.classList.contains('dark-mode');
      updateTheme(isDark);
      localStorage.setItem('musicfy-theme', isDark ? 'dark' : 'light');
    });
  }

  const lyricsAlbumId = new URLSearchParams(window.location.search).get('album');
  const lyricsTrackIndex = Number.parseInt(new URLSearchParams(window.location.search).get('track'), 10);
  const lyricsAlbum = albums[lyricsAlbumId];
  const lyricsTrack = lyricsAlbum?.tracks[lyricsTrackIndex];

  if (lyricsAlbum && lyricsTrack && document.getElementById('lyricsTitle')) {
    document.getElementById('lyricsCover').src = lyricsAlbum.image;
    document.getElementById('lyricsCover').alt = lyricsAlbum.name;
    document.getElementById('lyricsAlbumName').textContent = lyricsAlbum.name;
    document.getElementById('lyricsArtist').textContent = lyricsAlbum.artist;
    document.getElementById('lyricsTitle').textContent = lyricsTrack.name;
    document.getElementById('lyricsAlbumLink').href = `album.html?id=${lyricsAlbumId}`;
    document.getElementById('lyricsText').textContent = lyricsTrack.lyrics || 'A letra desta música ainda não foi cadastrada.';
    document.getElementById('translationText').textContent = lyricsTrack.translation || 'A tradução será exibida quando houver uma versão autorizada cadastrada.';
  }

  const profileForm = document.getElementById('profileForm');
  const profileName = document.getElementById('profileName');
  const profileHandle = document.getElementById('profileHandle');
  const profileBio = document.getElementById('profileBio');
  const profileAvatar = document.getElementById('profileAvatar');

  if (profileForm && profileName && profileHandle && profileBio && profileAvatar) {
    const profileNameInput = document.getElementById('profileNameInput');
    const profileHandleInput = document.getElementById('profileHandleInput');
    const profileBioInput = document.getElementById('profileBioInput');
    const profileInitialsInput = document.getElementById('profileInitialsInput');
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    const removeProfilePhotoBtn = document.getElementById('removeProfilePhotoBtn');
    const savedProfile = JSON.parse(localStorage.getItem('musicfy-profile') || 'null');
    const initialProfile = savedProfile || {
      name: profileName.textContent,
      handle: profileHandle.textContent.replace(/^@/, ''),
      bio: profileBio.textContent,
      initials: profileAvatar.textContent,
      avatarImage: ''
    };
    let pendingAvatarImage = initialProfile.avatarImage || '';

    function renderProfile(profile) {
      profileName.textContent = profile.name;
      profileHandle.textContent = `@${profile.handle.replace(/^@/, '')}`;
      profileBio.textContent = profile.bio;
      profileAvatar.textContent = profile.initials.toUpperCase();
      profileAvatar.dataset.image = profile.avatarImage || '';
      profileAvatar.classList.toggle('has-image', Boolean(profile.avatarImage));
      profileAvatar.style.backgroundImage = profile.avatarImage
        ? `url("${profile.avatarImage}")`
        : '';
    }

    renderProfile(initialProfile);

    document.getElementById('editProfileBtn').addEventListener('click', function () {
      profileNameInput.value = profileName.textContent;
      profileHandleInput.value = profileHandle.textContent.replace(/^@/, '');
      profileBioInput.value = profileBio.textContent;
      profileInitialsInput.value = profileAvatar.textContent;
      pendingAvatarImage = profileAvatar.dataset.image || '';
      profilePhotoInput.value = '';
    });

    profilePhotoInput.addEventListener('change', function () {
      const file = profilePhotoInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.addEventListener('load', function () {
        pendingAvatarImage = reader.result;
        profileAvatar.dataset.image = pendingAvatarImage;
        profileAvatar.classList.add('has-image');
        profileAvatar.style.backgroundImage = `url("${pendingAvatarImage}")`;
      });
      reader.readAsDataURL(file);
    });

    removeProfilePhotoBtn.addEventListener('click', function () {
      pendingAvatarImage = '';
      profilePhotoInput.value = '';
      profileAvatar.dataset.image = '';
      profileAvatar.classList.remove('has-image');
      profileAvatar.style.backgroundImage = '';
    });

    profileForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const profile = {
        name: profileNameInput.value.trim(),
        handle: profileHandleInput.value.trim().replace(/^@/, ''),
        bio: profileBioInput.value.trim(),
        initials: profileInitialsInput.value.trim().slice(0, 3),
        avatarImage: pendingAvatarImage
      };

      renderProfile(profile);
      localStorage.setItem('musicfy-profile', JSON.stringify(profile));
      bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
    });
  }

  // 1. Configura o redirecionamento dos botões da página principal (index.html).
  const botoesAvaliar = document.querySelectorAll('.botao-avaliar');

  botoesAvaliar.forEach((button) => {
    button.addEventListener('click', function () {
      // O ID acompanha o próprio cartão, então a ordem visual não altera o destino.
      const id = button.dataset.albumId;
      if (id) {
        window.location.href = `album.html?id=${id}`;
      }
    });
  });

  // 2. Lê o ID do álbum presente na URL da página de detalhes (album.html).
  const params = new URLSearchParams(window.location.search);
  const albumId = params.get('id');

  if (albumId && albums[albumId]) {
    // Busca os dados do álbum somente quando o ID recebido é válido.
    const album = albums[albumId];

    // Localiza os elementos HTML que receberão as informações do álbum.
    const albumName = document.getElementById('albumName');
    const albumArtist = document.getElementById('albumArtist');
    const albumCover = document.getElementById('albumCover');
    const trackList = document.getElementById('trackList');
    const trackReviews = document.getElementById('trackReviews');

    // Preenche título, artista e imagem da capa do álbum.
    if (albumName) albumName.textContent = album.name;
    if (albumArtist) albumArtist.textContent = album.artist;
    if (albumCover) {
      albumCover.src = album.image;
      albumCover.alt = album.name;
    }

    // Monta a lista resumida de músicas e suas avaliações.
    if (trackList) {
      trackList.innerHTML = album.tracks.map((track, index) => 
        `<div class="track-item track-row">
          <button class="track-play-button" type="button" data-track-index="${index}" aria-label="Ouvir ${track.name}">
            <span aria-hidden="true">▶</span>
          </button>
          <div class="track-details">
          <strong>${index + 1}. ${track.name}</strong>
          <span class="text-muted">${track.reviews.join(' • ')}</span>
          </div>
          <a class="track-link" href="lyrics.html?album=${encodeURIComponent(albumId)}&track=${index}">Ver letra</a>
        </div>`
      ).join('');

      const audioPlayer = document.getElementById('audioPlayer');
      const audioFilesInput = document.getElementById('audioFilesInput');
      const playerTitle = document.getElementById('playerTitle');
      const playerStatus = document.getElementById('playerStatus');
      const youtubeUrlInput = document.getElementById('youtubeUrlInput');
      const connectYoutubeBtn = document.getElementById('connectYoutubeBtn');
      const youtubePlayer = document.getElementById('youtubePlayer');
      const youtubeFallbackLink = document.getElementById('youtubeFallbackLink');
      const audioFiles = [];
      const youtubeTracks = JSON.parse(localStorage.getItem(`musicfy-youtube-${albumId}`) || '{}');
      let selectedTrackIndex = 0;

      function getYoutubeId(value) {
        try {
          const url = new URL(value);
          if (url.hostname.includes('youtu.be')) return url.pathname.slice(1).split('/')[0];
          if (url.hostname.includes('youtube.com')) {
            if (url.pathname === '/watch') return url.searchParams.get('v');
            if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2];
            if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2];
          }
        } catch (error) {
          return null;
        }
        return null;
      }

      function loadTrack(index, shouldPlay = false) {
        const track = album.tracks[index];
        const audioUrl = audioFiles[index];
        if (!track || !audioPlayer) return;

        selectedTrackIndex = index;
        playerTitle.textContent = track.name;
        youtubeUrlInput.value = youtubeTracks[index] ? `https://www.youtube.com/watch?v=${youtubeTracks[index]}` : '';

        if (youtubeTracks[index]) {
          audioPlayer.pause();
          audioPlayer.removeAttribute('src');
          audioPlayer.load();
          youtubePlayer.innerHTML = `<iframe src="https://www.youtube.com/embed/${youtubeTracks[index]}?autoplay=${shouldPlay ? 1 : 0}&rel=0&origin=${encodeURIComponent(window.location.origin)}" title="${track.name}" referrerpolicy="origin" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
          youtubePlayer.hidden = false;
          youtubeFallbackLink.href = `https://www.youtube.com/watch?v=${youtubeTracks[index]}`;
          youtubeFallbackLink.hidden = false;
          playerStatus.textContent = `${album.name} · ${album.artist} · Clique em “Assistir vídeo” para iniciar`;
          return;
        }

        youtubePlayer.innerHTML = '';
        youtubePlayer.hidden = true;
        youtubeFallbackLink.hidden = true;
        if (!audioUrl) {
          playerStatus.textContent = 'Nenhum áudio carregado para esta faixa.';
          audioPlayer.removeAttribute('src');
          audioPlayer.load();
          return;
        }

        playerStatus.textContent = `${album.name} · ${album.artist}`;
        audioPlayer.src = audioUrl;
        audioPlayer.load();
        if (shouldPlay) audioPlayer.play().catch(() => {});
      }

      document.querySelectorAll('.track-play-button').forEach((button) => {
        button.addEventListener('click', function () {
          loadTrack(Number(button.dataset.trackIndex), true);
        });
      });

      if (audioFilesInput) {
        audioFilesInput.addEventListener('change', function () {
          audioFiles.forEach((url) => URL.revokeObjectURL(url));
          audioFiles.length = 0;
          Array.from(audioFilesInput.files).forEach((file) => {
            audioFiles.push(URL.createObjectURL(file));
          });
          loadTrack(0);
          playerStatus.textContent = `${audioFiles.length} áudio(s) carregado(s), na ordem das faixas.`;
        });
      }

      if (connectYoutubeBtn) {
        connectYoutubeBtn.addEventListener('click', function () {
          const videoId = getYoutubeId(youtubeUrlInput.value.trim());
          if (!videoId) {
            playerStatus.textContent = 'Cole uma URL válida do YouTube para conectar esta faixa.';
            return;
          }

          youtubeTracks[selectedTrackIndex] = videoId;
          localStorage.setItem(`musicfy-youtube-${albumId}`, JSON.stringify(youtubeTracks));
          loadTrack(selectedTrackIndex);
        });
      }

      loadTrack(0);
    }

    // Monta os cartões completos de avaliação de cada música.
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
        // Leva o usuário suavemente até o formulário de avaliação.
        reviewForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    if (reviewForm) {
      reviewForm.addEventListener('submit', function (event) {
        // Impede o recarregamento da página e coleta os dados preenchidos.
        event.preventDefault();
        const rating = document.getElementById('albumRating').value;
        const reviewText = document.getElementById('albumReviewText').value;

        // Cria um novo cartão com a avaliação enviada pelo usuário.
        const item = document.createElement('div');
        item.className = 'card mb-3 shadow-sm';
        item.innerHTML = `
          <div class="card-body">
            <h5 class="card-title mb-2 fw-bold">Sua Avaliação</h5>
            <p class="mb-1"><strong>Nota:</strong> ${rating} ★</p>
            <p class="mb-0 text-muted">${reviewText || 'Sem comentário'}</p>
          </div>`;

        // Exibe a nova avaliação no início da lista.
        if (trackReviews) {
          trackReviews.prepend(item);
        }

        // Limpa o formulário e informa que a avaliação foi adicionada.
        reviewForm.reset();
        alert('Avaliação salva com sucesso!');
      });
    }
  }
});
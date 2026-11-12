async function loadMusicfyCatalog() {
  try {
    const response = await fetch('/api/catalog', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('O servidor não disponibilizou o catálogo compartilhado.');
    window.musicfyCatalog = await response.json();
    window.musicfyCatalogServer = true;
  } catch (error) {
    window.musicfyCatalogServer = false;
    console.warn('O catálogo do servidor não está disponível; a área administrativa exige iniciar pelo iniciar-site.bat.', error);
  }

  const script = document.createElement('script');
  script.src = 'src/scripts/script.js';
  document.body.append(script);
}

loadMusicfyCatalog();

import { createAuthClient } from '@neondatabase/auth';

window.MusicfyAuth = {
  ready: (async () => {
    const response = await fetch('/api/auth/config');
    if (!response.ok) {
      throw new Error('Não foi possível carregar a configuração de autenticação.');
    }
    const config = await response.json();
    if (!config.available || !config.authUrl) {
      return { available: false, client: null };
    }
    return {
      available: true,
      client: createAuthClient(config.authUrl)
    };
  })()
};

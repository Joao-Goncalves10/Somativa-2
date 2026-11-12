'use client';

import { createAuthClient } from '@neondatabase/auth';
import { useEffect, useState } from 'react';

type LegacyAuth = {
  ready: Promise<{ available: boolean; client: ReturnType<typeof createAuthClient> | null }>;
};

declare global {
  interface Window {
    MusicfyAuth?: LegacyAuth;
  }
}

function loadScript(id: string, src: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === 'true') return Promise.resolve();
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Não foi possível carregar ${src}.`)), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Não foi possível carregar ${src}.`));
    document.body.appendChild(script);
  });
}

export default function LegacyRuntime({ page }: { page: string }) {
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function initializeLegacyPage() {
      try {
        await loadScript(
          'musicfy-bootstrap-runtime',
          'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
        );
        const authReady = (async () => {
          const response = await fetch('/api/auth/config');
          if (!response.ok) throw new Error('Não foi possível carregar a configuração de autenticação.');
          const config = await response.json() as { available: boolean; authUrl: string };
          if (!config.available || !config.authUrl) return { available: false, client: null };
          return { available: true, client: createAuthClient(config.authUrl) };
        })();
        window.MusicfyAuth = { ready: authReady };

        const pagePrefix = page === 'album.html' ? '/album/'
          : page === 'artista.html' ? '/artista/' : '';
        if (pagePrefix && window.location.pathname.startsWith(pagePrefix)) {
          const url = new URL(window.location.href);
          url.searchParams.set('id', decodeURIComponent(url.pathname.slice(pagePrefix.length)));
          window.history.replaceState(window.history.state, '', url);
        }

        await loadScript('musicfy-legacy-app', '/assets/js/app.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));
      } catch (cause) {
        console.error('Não foi possível iniciar a interface MUSICFY.', cause);
        if (active) setError('Não foi possível iniciar a interface. Atualize a página e tente novamente.');
      }
    }
    void initializeLegacyPage();
    return () => {
      active = false;
    };
  }, [page]);

  return error ? <p className="container alert alert-danger" role="alert">{error}</p> : null;
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MUSICFY',
  description: 'Descubra, explore e avalie álbuns e artistas.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <base href="/" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

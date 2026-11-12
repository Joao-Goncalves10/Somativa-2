import { readFile } from 'node:fs/promises';
import path from 'node:path';
import LegacyRuntime from '@/app/legacy-runtime';

function migrateLegacyLinks(markup: string): string {
  return markup
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script\b[^>]*\/?>/gi, '')
    .replace(/<link\b(?=[^>]*\bstylesheet\b)[^>]*>/gi, '')
    .replace(/((?:src|href)\s*=\s*["'])assets\//gi, '$1/assets/')
    .replace(/((?:src|href)\s*=\s*["'])index\.html(?:#([^"']*))?(["'])/gi, (_match, prefix, hash, quote) =>
      `${prefix}/${hash ? `#${hash}` : ''}${quote}`)
    .replace(/((?:src|href)\s*=\s*["'])explorar\.html(["'])/gi, '$1/explorar$2')
    .replace(/((?:src|href)\s*=\s*["'])artistas\.html(["'])/gi, '$1/artistas$2')
    .replace(/((?:src|href)\s*=\s*["'])perfil\.html(["'])/gi, '$1/perfil$2')
    .replace(/((?:src|href)\s*=\s*["'])criar-album\.html(["'])/gi, '$1/criar-album$2')
    .replace(/((?:src|href)\s*=\s*["'])album\.html\?id=([^&"']+)(?:&[^"']*)?(["'])/gi, '$1/album/$2$3')
    .replace(/((?:src|href)\s*=\s*["'])artista\.html\?id=([^&"']+)(?:&[^"']*)?(["'])/gi, '$1/artista/$2$3')
    .replace(/((?:src|href)\s*=\s*["'])lyrics\.html\?album=([^&"']+)&amp;track=(\d+)(["'])/gi,
      '$1/lyrics/$3?album=$2&track=$3$4')
    .replace(/((?:src|href)\s*=\s*["'])lyrics\.html\?album=([^&"']+)&track=(\d+)(["'])/gi,
      '$1/lyrics/$3?album=$2&track=$3$4');
}

export default async function LegacyPage({ file }: { file: string }) {
  const filePath = path.join(process.cwd(), 'public', file);
  const document = await readFile(filePath, 'utf8');
  const body = document.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1];
  if (!body) throw new Error(`A página HTML não contém um body válido: ${file}`);
  const markup = migrateLegacyLinks(body);
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: markup }} />
      <LegacyRuntime page={file} />
    </>
  );
}

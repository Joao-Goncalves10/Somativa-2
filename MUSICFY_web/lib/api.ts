import { NextResponse } from 'next/server';
import {
  authenticateUser,
  getManagedAuthConfig,
  hasAdminSession,
  isAdminLoginRequired,
  isSameOriginRequest,
  passwordsMatch
} from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/auth';
import type { AccountProfile, Album } from '@/lib/database';

const maximumRequestSize = 2 * 1024 * 1024;
const maximumImageLength = 1_400_000;

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export function sendJson(value: unknown, status = 200, headers?: HeadersInit): NextResponse {
  return NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) return sendJson({ error: error.message }, error.statusCode);
  if (error && typeof error === 'object') {
    const dbError = error as { code?: string; errcode?: number; statusCode?: number; message?: string };
    if (dbError.code === '23505' || dbError.errcode === 2067) {
      return sendJson({ error: 'Este nome de usuário já está em uso.' }, 409);
    }
    if (dbError.statusCode && dbError.message) {
      return sendJson({ error: dbError.message }, dbError.statusCode);
    }
  }
  console.error('Falha ao processar solicitação da API.', error);
  return sendJson({ error: 'Não foi possível processar a solicitação.' }, 500);
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > maximumRequestSize) throw new ApiError('A solicitação excede o limite de 2 MB.', 413);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError('O corpo da solicitação deve ser um JSON válido.', 400);
  }
  if (new TextEncoder().encode(JSON.stringify(body)).length > maximumRequestSize) {
    throw new ApiError('A solicitação excede o limite de 2 MB.', 413);
  }
  return body;
}

export function validateAlbum(input: unknown): Album {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError('Os dados do álbum são inválidos.', 400);
  }
  const value = input as Record<string, unknown>;
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const artist = typeof value.artist === 'string' ? value.artist.trim() : '';
  const image = typeof value.image === 'string' ? value.image : '';
  const genres = value.genres;
  const rawTracks = value.tracks;
  if (!name || name.length > 100 || !artist || artist.length > 80) {
    throw new ApiError('Informe um nome de álbum e artista válidos.', 400);
  }
  if (!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)
    || image.length > maximumImageLength) {
    throw new ApiError('A capa deve ser PNG, JPG ou WEBP de até 1 MB.', 400);
  }
  if (!Array.isArray(genres) || genres.length === 0 || genres.length > 10
    || genres.some((genre) => typeof genre !== 'string' || !genre.trim() || genre.length > 30)) {
    throw new ApiError('Selecione entre 1 e 10 estilos válidos.', 400);
  }
  if (!Array.isArray(rawTracks) || rawTracks.length === 0 || rawTracks.length > 100
    || rawTracks.some((track) => typeof track !== 'string' || !track.trim() || track.length > 100)) {
    throw new ApiError('Informe entre 1 e 100 faixas válidas.', 400);
  }
  const id = value.id === undefined ? `created-${crypto.randomUUID()}` : value.id;
  if (typeof id !== 'string' || !/^created-[a-z0-9-]{1,200}$/.test(id)) {
    throw new ApiError('O identificador do álbum é inválido.', 400);
  }
  return {
    id,
    name,
    artist,
    image,
    genres: genres.map((genre) => (genre as string).trim()),
    tracks: rawTracks.map((track) => ({
      name: (track as string).trim(),
      reviews: [],
      lyrics: '',
      translation: ''
    }))
  };
}

export function validateAccountProfile(input: unknown): AccountProfile {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError('Os dados do perfil são inválidos.', 400);
  }
  const value = input as Record<string, unknown>;
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const handle = typeof value.handle === 'string' ? value.handle.trim().toLowerCase() : '';
  const bio = typeof value.bio === 'string' ? value.bio.trim() : '';
  const initials = typeof value.initials === 'string' ? value.initials.trim().toUpperCase() : '';
  const avatarImage = typeof value.avatarImage === 'string' ? value.avatarImage : '';
  if (!name || name.length > 40 || !/^[a-z0-9._-]{3,30}$/.test(handle)
    || bio.length > 140 || !/^[\p{L}\p{N}]{1,3}$/u.test(initials)) {
    throw new ApiError('Informe nome, usuário, bio e iniciais válidos.', 400);
  }
  if (avatarImage && (!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(avatarImage)
    || avatarImage.length > maximumImageLength)) {
    throw new ApiError('A foto deve ser PNG, JPG ou WEBP de até 1 MB.', 400);
  }
  return { name, handle, bio, initials, avatarImage };
}

export function validateAccountItem(input: unknown, fieldName: 'artistId' | 'albumId') {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError('Os dados da preferência são inválidos.', 400);
  }
  const value = input as Record<string, unknown>;
  const id = value[fieldName];
  if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(id)) {
    throw new ApiError('O identificador informado é inválido.', 400);
  }
  if (typeof value.enabled !== 'boolean') throw new ApiError('O estado da preferência é inválido.', 400);
  return { id, enabled: value.enabled };
}

export function validateReview(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError('Os dados da avaliação são inválidos.', 400);
  }
  const value = input as Record<string, unknown>;
  const { id: albumId } = validateAccountItem({ albumId: value.albumId, enabled: true }, 'albumId');
  if (!Number.isInteger(value.rating) || Number(value.rating) < 1 || Number(value.rating) > 5
    || typeof value.comment !== 'string' || value.comment.trim().length > 1000) {
    throw new ApiError('Informe uma nota entre 1 e 5 e um comentário de até 1000 caracteres.', 400);
  }
  return { albumId, rating: Number(value.rating), comment: value.comment.trim() };
}

export function getDefaultProfile(user: AuthenticatedUser): AccountProfile {
  const emailName = user.email.split('@')[0] || '';
  const name = (user.name || emailName || 'Ouvinte MUSICFY').trim().slice(0, 40);
  const normalizedName = emailName.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 20);
  const suffix = user.id.toLowerCase().replace(/[^a-z0-9]/g, '').slice(-8) || 'ouvinte';
  const handle = `${normalizedName || 'ouvinte'}-${suffix}`.slice(0, 30);
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase().slice(0, 3);
  return { name, handle, bio: '', initials: initials || 'MU', avatarImage: '' };
}

export async function requireAccount(request: Request): Promise<AuthenticatedUser> {
  const user = await authenticateUser(request);
  if (!user) throw new ApiError('Entre na sua conta MUSICFY para continuar.', 401);
  return user;
}

export function getAuthConfigResponse() {
  const config = getManagedAuthConfig();
  return sendJson({ available: Boolean(config), authUrl: config?.baseUrl || '' });
}

export function getAdminSessionResponse(request: Request) {
  const required = isAdminLoginRequired();
  return sendJson({ required, authenticated: !required || hasAdminSession(request) });
}

export function verifyOrigin(request: Request): void {
  if (!isSameOriginRequest(request)) throw new ApiError('Solicitação de origem não autorizada.', 403);
}

export function verifyAdminSession(request: Request): void {
  if (isAdminLoginRequired() && !hasAdminSession(request)) {
    throw new ApiError('Entre como administrador para publicar álbuns.', 401);
  }
}

export function verifyAdminPassword(password: unknown): boolean {
  return passwordsMatch(password);
}

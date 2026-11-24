import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma.ts';

export const SESSION_COOKIE_NAME = 'faraz_session';
const SESSION_TTL_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export function setSessionCookie(res: Response, token: string): void {
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned; Max-Age=${maxAge}`
  );
}

export function clearSessionCookie(res: Response): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=None; Secure; Partitioned; Max-Age=0`
  );
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

export function extractTokenFromRequest(req: Request): { token: string | null; viaCookie: boolean } {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) {
      return { token: bearer, viaCookie: false };
    }
  }
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (cookieToken) {
    return { token: cookieToken, viaCookie: true };
  }
  return { token: null, viaCookie: false };
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionToken?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, viaCookie } = extractTokenFromRequest(req);
    if (!token) {
      res.status(401).json({ error: 'Please sign in to continue.' });
      return;
    }

    // CSRF protection for cookie-authenticated state-changing requests
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
    if (viaCookie && isMutation) {
      const requestedWith = req.headers['x-requested-with'];
      const origin = req.headers.origin;
      const host = (req.headers['x-forwarded-host'] as string | undefined) || req.headers.host;
      const originMatchesHost = origin && host ? origin.includes(host.split(',')[0].trim()) : false;
      if (requestedWith !== 'XMLHttpRequest' && !originMatchesHost) {
        res.status(403).json({ error: 'Invalid request origin.' });
        return;
      }
    }

    const session = await prisma.session.findUnique({
      where: { token },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      res.status(401).json({ error: 'Your session expired. Please sign in again.' });
      return;
    }

    req.userId = session.userId;
    req.sessionToken = token;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication verification failed.' });
  }
}

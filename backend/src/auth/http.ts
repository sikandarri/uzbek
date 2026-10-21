import type { RequestHandler, Response, Request } from 'express';
import type { Config } from '../config.js';
import type { Account, AuthRepository, SessionRecord } from './repository.js';
import { hashToken, csrfFor, equalToken, randomToken, privateKey } from './crypto.js';
import { HttpError } from '../middleware/errors.js';
export type AuthContext = { raw: string; session: SessionRecord; account: Account | null };
export function authHttp(repo: AuthRepository, config: Config) {
  const production = config.NODE_ENV === 'production';
  const name = production ? '__Host-nr_session' : 'nr_session';
  const options = { httpOnly: true, secure: production, sameSite: 'lax' as const, path: '/' };
  const context = (res: Response) => res.locals.auth as AuthContext | undefined;
  const cookie = (res: Response, raw: string, expires: Date) =>
    res.cookie(name, raw, { ...options, expires });
  const load: RequestHandler = async (req, res, next) => {
    const raw = req.cookies?.[name];
    if (typeof raw === 'string' && /^[A-Za-z0-9_-]{43}$/.test(raw)) {
      const session = await repo.getSession(hashToken(raw));
      const now = new Date();
      if (
        session &&
        !session.revokedAt &&
        session.expiresAt > now &&
        now.getTime() - session.lastSeenAt.getTime() < 24 * 3600_000
      ) {
        const account = session.userId ? await repo.getAccount(session.userId) : null;
        if (!session.userId || account?.status === 'ACTIVE') {
          res.locals.auth = { raw, session, account };
          if (now.getTime() - session.lastSeenAt.getTime() > 5 * 60_000)
            await repo.touchSession(session.tokenHash, now);
        }
      }
    }
    next();
  };
  const rate =
    (
      scope: string,
      limit: number,
      windowMs: number,
      identity?: (req: Request) => string,
    ): RequestHandler =>
    async (req, res, next) => {
      const bucket = Math.floor(Date.now() / windowMs);
      const who = identity ? identity(req) : (req.ip ?? 'unknown');
      const key = scope + ':' + privateKey(who, config.SESSION_SECRET) + ':' + bucket;
      const expiresAt = new Date((bucket + 1) * windowMs);
      if ((await repo.consumeRate(key, expiresAt)) > limit) {
        res.setHeader('Retry-After', Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
        throw new HttpError(429, 'RATE_LIMITED');
      }
      next();
    };
  const requireAuth: RequestHandler = (_req, res, next) => {
    if (!context(res)?.account) throw new HttpError(401, 'UNAUTHENTICATED');
    next();
  };
  const permission =
    (code: string): RequestHandler =>
    (_req, res, next) => {
      const a = context(res)?.account;
      if (!a) throw new HttpError(401, 'UNAUTHENTICATED');
      if (!a.permissions.includes(code)) throw new HttpError(403, 'FORBIDDEN');
      next();
    };
  const csrf: RequestHandler = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.get('origin') !== config.APP_ORIGIN) throw new HttpError(403, 'ORIGIN_REJECTED');
    const c = context(res),
      token = req.get('x-csrf-token');
    if (!c || !token || !equalToken(token, csrfFor(c.raw, config.SESSION_SECRET)))
      throw new HttpError(403, 'CSRF_REJECTED');
    if (!req.is('application/json')) throw new HttpError(415, 'JSON_REQUIRED');
    next();
  };
  async function rotate(res: Response, userId: string | null, action: string) {
    const raw = randomToken(),
      now = new Date(),
      expiresAt = new Date(now.getTime() + (userId ? 7 * 86400_000 : 3600_000));
    const session = {
      tokenHash: hashToken(raw),
      userId,
      expiresAt,
      lastSeenAt: now,
      revokedAt: null,
    };
    await repo.rotateSession(
      context(res)?.session.tokenHash ?? null,
      session,
      action,
      res.locals.requestId,
    );
    cookie(res, raw, expiresAt);
    return csrfFor(raw, config.SESSION_SECRET);
  }
  return {
    load,
    rate,
    requireAuth,
    permission,
    csrf,
    context,
    rotate,
    async bootstrap(res: Response) {
      const c = context(res);
      return c ? csrfFor(c.raw, config.SESSION_SECRET) : rotate(res, null, 'auth.bootstrap');
    },
    // Works even when the MongoDB authentication/session lookup is unavailable.
    // The HMAC-bound CSRF token proves possession of the session cookie but not
    // its database validity; only logout (not login or access) can use this path.
    csrfFromCookie(req: Request): string | null {
      const raw = req.cookies?.[name];
      return typeof raw === 'string' && /^[A-Za-z0-9_-]{43}$/.test(raw)
        ? csrfFor(raw, config.SESSION_SECRET) : null;
    },
    async resilientLogout(req: Request, res: Response) {
      if (req.get('origin') !== config.APP_ORIGIN) throw new HttpError(403, 'ORIGIN_REJECTED');
      const raw = req.cookies?.[name];
      if (typeof raw !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(raw)) {
        res.clearCookie(name, options);
        res.status(204).end();
        return;
      }
      const token = req.get('x-csrf-token');
      if (!token || !equalToken(token, csrfFor(raw, config.SESSION_SECRET)))
        throw new HttpError(403, 'CSRF_REJECTED');
      // Clear the browser cookie regardless of server connectivity. A 503
      // warns that the hashed token may remain active server-side until expiry.
      res.clearCookie(name, options);
      try {
        await repo.revokeSession(hashToken(raw), null, res.locals.requestId);
        res.status(204).end();
      } catch {
        console.error(JSON.stringify({event:'logout_revocation_failed',requestId:res.locals.requestId}));
        res.status(503).json({error:{code:'LOGOUT_PARTIAL',requestId:res.locals.requestId}});
      }
    },
    async logout(res: Response) {
      const c = context(res);
      try {
        if (c) await repo.revokeSession(c.session.tokenHash, c.account?.id ?? null, res.locals.requestId);
      } finally { res.clearCookie(name, options); }
    },
  };
}

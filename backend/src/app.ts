import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { registerSchema, loginSchema, profileSchema } from '../../shared/src/contracts.js';
import type { Config } from './config.js';
import { DuplicateAccountError, publicUser, type AuthRepository } from './auth/repository.js';
import { authHttp } from './auth/http.js';
import { hashPassword, verifyPassword } from './auth/crypto.js';
import { HttpError, errorHandler } from './middleware/errors.js';
import type { CatalogRepository } from './routes/catalog.js';
export async function createApp(
  config: Config,
  repo: AuthRepository,
  catalog: CatalogRepository,
  staticDir?: string,
) {
  const app = express(),
    auth = authHttp(repo, config);
  // Comparable password verification work for an unknown address.
  let dummyHashPromise: Promise<string> | undefined;
  const dummyHash = () => (dummyHashPromise ??= hashPassword(randomUUID()));
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY_HOPS);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: config.NODE_ENV === 'production' ? [] : null,
        },
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use((_req, res, next) => {
    res.locals.requestId = randomUUID();
    res.setHeader('X-Request-ID', res.locals.requestId);
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
    next();
  });
  app.get('/api/v1/health/live', (_req, res) => res.json({ data: { status: 'ok' } }));
  app.get('/api/v1/health/ready', async (_req, res) => {
    try {
      await catalog.health();
      res.json({ data: { status: 'ready', catalogSource: config.COURSE_CATALOG_SOURCE,
        database: config.COURSE_CATALOG_SOURCE === 'bundled' ? 'not_checked' : 'ready' } });
    } catch {
      throw new HttpError(503, 'NOT_READY');
    }
  });
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  const send = (res: express.Response, data: unknown, status = 200) =>
    res.status(status).json({ data, meta: { requestId: res.locals.requestId } });
  app.get('/api/v1/health/catalog', async (_req, res) => {
    const tracks = await catalog.tracks('EN');
    send(res, {
      source: config.COURSE_CATALOG_SOURCE, tracks: tracks.length,
      courseVariants: tracks.reduce((sum, track) => sum + track.courses.length, 0),
      lessonsAvailable: tracks.reduce((sum, track) =>
        sum + track.courses.reduce((count, course) => count + course.publishedLessons, 0), 0),
    });
  });
  // Public course reads must remain available when Atlas cannot handle transactions.
  // None of these four GET endpoints load cookies or write to MongoDB.
  app.get('/api/v1/tracks', async (req, res) => {
    const { locale } = z
      .object({ locale: z.enum(['uz-Latn', 'en']).default('uz-Latn') })
      .parse(req.query);
    send(res, await catalog.tracks(locale === 'en' ? 'EN' : 'UZ'));
  });
  app.get('/api/v1/courses/:slug', async (req, res) => {
    const slug = z
      .string()
      .regex(/^[a-z0-9-]{1,100}$/)
      .parse(req.params.slug);
    const locale = z.enum(['uz-Latn', 'en']).default('uz-Latn').parse(req.query.locale);
    const tracks = await catalog.tracks(locale === 'en' ? 'EN' : 'UZ');
    const course = tracks.flatMap((t) => t.courses).find((c) => c.slug === slug);
    if (!course) throw new HttpError(404, 'NOT_FOUND');
    send(res, course);
  });
  app.get('/api/v1/courses/:slug/outline', async (req, res) => {
    const slug = z.string().regex(/^[a-z0-9-]{1,100}$/).parse(req.params.slug);
    const locale = z.enum(['uz-Latn', 'en']).default('uz-Latn').parse(req.query.locale);
    const outline = await catalog.courseOutline?.(slug, locale === 'en' ? 'EN' : 'UZ');
    if (!outline) throw new HttpError(404, 'NOT_FOUND');
    send(res, outline);
  });
  app.get('/api/v1/lessons/:id', async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const locale = z.enum(['uz-Latn', 'en']).default('uz-Latn').parse(req.query.locale);
    const lesson = await catalog.lessonDetail?.(id, locale === 'en' ? 'EN' : 'UZ');
    if (!lesson) throw new HttpError(404, 'NOT_FOUND');
    send(res, lesson);
  });
  // Sign-out must be possible when MongoDB is briefly unreachable. Validate the
  // same-origin request and per-cookie CSRF proof before clearing HTTP-only cookies.
  // No user-data reads or privileged operations are allowed through this path.
  app.use(cookieParser());
  app.get('/api/v1/auth/csrf', (req, res, next) => {
    const existingToken = auth.csrfFromCookie(req);
    if (!existingToken) return next();
    send(res, { csrfToken: existingToken });
  });
  app.post('/api/v1/auth/logout', (req, res) => auth.resilientLogout(req, res));
  // Anonymous status reads likewise must not require a MongoDB rate-limit write.
  // All other mutable / authenticated operations retain their database limiter.
  const authenticatedRate = auth.rate('api', 300, 60_000);
  app.use('/api', (req, res, next) => {
    if (req.method === 'GET' && req.path === '/v1/me' && !req.headers.cookie) return next();
    return authenticatedRate(req, res, next);
  });
  app.use(express.json({ limit: '32kb' }));
  app.use('/api/v1', auth.load, auth.csrf);
  app.get('/api/v1/auth/csrf', auth.rate('bootstrap', 30, 60_000), async (_req, res) =>
    send(res, { csrfToken: await auth.bootstrap(res) }),
  );
  app.post('/api/v1/auth/register', auth.rate('register', 5, 3600_000), async (req, res) => {
    if (config.REGISTRATION_ENABLED !== 'true') throw new HttpError(503, 'REGISTRATION_DISABLED');
    const body = registerSchema.parse(req.body);
    try {
      const account = await repo.createAccount(
        {
          email: body.email,
          passwordHash: await hashPassword(body.password),
          displayName: body.displayName,
          locale: body.locale,
          marketingOptIn: body.marketingOptIn,
        },
        res.locals.requestId,
      );
      const csrfToken = await auth.rotate(res, account.id, 'auth.login');
      send(res, { user: publicUser(account), csrfToken }, 201);
    } catch (e) {
      if (e instanceof DuplicateAccountError) throw new HttpError(409, 'REGISTRATION_FAILED');
      throw e;
    }
  });
  app.post(
    '/api/v1/auth/login',
    auth.rate('login-ip', 20, 15 * 60_000),
    auth.rate('login-account', 10, 15 * 60_000, (req) =>
      typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : 'invalid',
    ),
    async (req, res) => {
      const body = loginSchema.parse(req.body),
        account = await repo.findAccount(body.email);
      const valid = await verifyPassword(account?.passwordHash ?? await dummyHash(), body.password);
      if (!account || !valid || account.status !== 'ACTIVE') {
        await repo.recordFailure(res.locals.requestId);
        throw new HttpError(401, 'INVALID_CREDENTIALS');
      }
      send(res, {
        user: publicUser(account),
        csrfToken: await auth.rotate(res, account.id, 'auth.login'),
      });
    },
  );
  app.get('/api/v1/me', auth.requireAuth, (_req, res) =>
    send(res, publicUser(auth.context(res)!.account!)),
  );
  app.patch('/api/v1/me/profile', auth.requireAuth, async (req, res) =>
    send(
      res,
      publicUser(
        await repo.updateProfile(
          auth.context(res)!.account!.id,
          profileSchema.parse(req.body),
          res.locals.requestId,
        ),
      ),
    ),
  );
  app.get('/api/v1/admin/overview', auth.permission('admin.access'), (_req, res) =>
    send(res, {
      phase: 1,
      features: {
        catalog: true,
        authentication: true,
        contentEditor: false,
        billing: false,
        aiTutor: false,
      },
    }),
  );
  app.use('/api', (_req, _res) => {
    throw new HttpError(404, 'NOT_FOUND');
  });
  if (staticDir && existsSync(path.join(staticDir, 'index.html'))) {
    app.use(express.static(staticDir, { index: false, maxAge: 0 }));
    app.get('/{*path}', (req, res, next) => {
      if (req.path.startsWith('/assets/') || path.extname(req.path)) return next();
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }
  app.use((_req, _res) => {
    throw new HttpError(404, 'NOT_FOUND');
  });
  app.use(errorHandler);
  return app;
}

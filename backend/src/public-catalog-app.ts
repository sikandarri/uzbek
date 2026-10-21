/**
 * Development-only public catalogue fallback.
 * Never reads MongoDB, never sets authentication cookies, and never accepts
 * account/permission mutations. This keeps the authored lessons available
 * while the developer repairs their environment or native dependencies.
 */
import express from 'express';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { bundledCatalog } from './routes/bundled-catalog.js';
import { HttpError, errorHandler } from './middleware/errors.js';

export function createPublicCatalogApp() {
  const app = express();
  const catalog = bundledCatalog();
  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"], frameAncestors: ["'none'"],
      },
    },
  }));
  app.use((_req, res, next) => {
    res.locals.requestId = randomUUID();
    res.setHeader('X-Request-ID', res.locals.requestId);
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  const send = (res: express.Response, data: unknown) => res.json({ data, meta: { requestId: res.locals.requestId } });
  const readLocale = (v: unknown) => z.enum(['en', 'uz-Latn']).default('uz-Latn').parse(v) === 'en' ? 'EN' : 'UZ';
  const readSlug = (v: unknown) => z.string().regex(/^[a-z0-9-]{1,100}$/).parse(v);

  app.get('/api/v1/health/live', (_req, res) => send(res, { status: 'ok', mode: 'development-public-only' }));
  app.get('/api/v1/health/ready', (_req, res) => send(res, { status: 'ready', catalogSource: 'bundled', database: 'not_checked', auth: 'unavailable' }));
  app.get('/api/v1/health/catalog', async (_req, res) => {
    const tracks = await catalog.tracks('EN');
    send(res, {
      source: 'bundled', mode: 'development-public-only', tracks: tracks.length,
      courseVariants: tracks.reduce((s, t) => s + t.courses.length, 0),
      lessonsAvailable: tracks.reduce((s, t) => s + t.courses.reduce((n, c) => n + c.publishedLessons, 0), 0),
    });
  });
  app.get('/api/v1/tracks', async (req, res) => send(res, await catalog.tracks(readLocale(req.query.locale))));
  app.get('/api/v1/courses/:slug', async (req, res) => {
    const slug = readSlug(req.params.slug);
    const tracks = await catalog.tracks(readLocale(req.query.locale));
    const course = tracks.flatMap(t => t.courses).find(c => c.slug === slug);
    if (!course) throw new HttpError(404, 'NOT_FOUND');
    send(res, course);
  });
  app.get('/api/v1/courses/:slug/outline', async (req, res) => {
    const outline = await catalog.courseOutline?.(readSlug(req.params.slug), readLocale(req.query.locale));
    if (!outline) throw new HttpError(404, 'NOT_FOUND');
    send(res, outline);
  });
  app.get('/api/v1/lessons/:id', async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const lesson = await catalog.lessonDetail?.(id, readLocale(req.query.locale));
    if (!lesson) throw new HttpError(404, 'NOT_FOUND');
    send(res, lesson);
  });
  // The frontend treats 401 as an anonymous visitor. No session lookup occurs.
  app.get('/api/v1/me', (_req, res) => res.status(401).json({error:{code:'UNAUTHENTICATED'}}));
  // Never perform partial auth actions without a configured session/database backend.
  app.use('/api/v1/auth', (_req, res) => res.status(503).json({error:{code:'AUTH_UNAVAILABLE',message:'Local public-only mode: fix backend/.env and database connectivity to enable accounts.'}}));
  app.use('/api', (_req, res) => { throw new HttpError(404, 'NOT_FOUND'); });
  app.use(errorHandler);
  return app;
}

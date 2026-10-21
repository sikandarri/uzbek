import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { parseConfig } from './config.js';

/**
 * Start the configured API when possible. In local development with the
 * bundled curriculum, fall back to a strictly read-only public lesson API if
 * a required .env setting, Prisma client, or native auth module is missing.
 * Production always fails closed rather than silently weakening auth.
 */
async function main() {
  const publicFallbackAllowed = process.env.NODE_ENV !== 'production' &&
    (process.env.COURSE_CATALOG_SOURCE ?? 'bundled') === 'bundled';
  let app;
  let prisma: (typeof import('./db.js'))['prisma'] | undefined;
  let mode: 'full' | 'public-only' = 'full';
  let port = 3001;
  try {
    const config = parseConfig(process.env);
    port = config.PORT;
    // A full authentication service must prove its native password module works.
    // In local bundled mode, a native-install problem switches to public-only
    // lessons instead of crashing Vite's API proxy. Production fails closed.
    await import('argon2');
    // Import Prisma and authentication AFTER configuration validation.
    // A broken native password package should not prevent reading lessons.
    const db = await import('./db.js');
    prisma = db.prisma;
    const { prismaAuth } = await import('./auth/prisma-repository.js');
    const { prismaCatalog } = await import('./routes/catalog.js');
    const { bundledCatalog } = await import('./routes/bundled-catalog.js');
    const { createApp } = await import('./app.js');
    if (config.COURSE_CATALOG_SOURCE === 'database') await prisma.$connect();
    const staticDir = fileURLToPath(new URL('../../../../frontend/dist/', import.meta.url));
    app = await createApp(config, prismaAuth(prisma),
      config.COURSE_CATALOG_SOURCE === 'database' ? prismaCatalog(prisma) : bundledCatalog(),
      config.NODE_ENV === 'production' ? staticDir : undefined);
  } catch (error) {
    if (!publicFallbackAllowed) {
      console.error('[api] Startup failed. Check backend/.env, Prisma generation and installed dependencies.');
      console.error('[api] No public fallback is permitted in production or database catalog mode.');
      // Show missing setting names only, never their values or database passwords.
      if (error && typeof error === 'object' && 'issues' in error) {
        const issues = (error as { issues?: { path?: (string | number)[] }[] }).issues ?? [];
        console.error('[api] Invalid environment fields:', issues.map(i => i.path?.join('.')).join(', '));
      } else if (error instanceof Error) console.error('[api] Failure type:', error.name);
      process.exitCode = 1;
      return;
    }
    const { createPublicCatalogApp } = await import('./public-catalog-app.js');
    mode = 'public-only';
    app = createPublicCatalogApp();
    const reason = error && typeof error === 'object' && 'issues' in error
      ? (error as { issues?: { path?: (string | number)[] }[] }).issues?.map(i=>i.path?.join('.')).join(', ')
      : error instanceof Error ? error.name : 'startup error';
    console.warn(`[api] Full backend unavailable (${reason || 'configuration problem'}).`);
    console.warn('[api] Serving all 170 bundled lessons in DEVELOPMENT-ONLY public mode.');
    console.warn('[api] Login, registration, saved accounts and server-side progress are DISABLED.');
    console.warn('[api] To restore all features, fix backend/.env and any native dependency issues.');
    const requestedPort = Number(process.env.PORT);
    if (Number.isInteger(requestedPort) && requestedPort >= 1 && requestedPort <= 65535) port = requestedPort;
  }
  const server = app.listen(port, '0.0.0.0', () => {
    console.info(JSON.stringify({event:'listening',port, mode, catalog:'bundled'}));
    console.info(`[api] Catalog check: http://localhost:${port}/api/v1/health/catalog`);
  });
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') console.error(`[api] Port ${port} is already occupied. Close the other process or change backend/.env PORT.`);
    else console.error(`[api] Cannot listen on port ${port}: ${error.code ?? error.name}`);
    process.exitCode = 1;
  });
  const shutdown = () => server.close(async () => {
    if (prisma) await prisma.$disconnect().catch(() => undefined);
    process.exit(0);
  });
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
await main();

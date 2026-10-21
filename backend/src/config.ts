import { z } from 'zod';
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().refine((value) => {
    if (!/^mongodb(\+srv)?:\/\//.test(value)) return false;
    try { return Boolean(new URL(value).pathname.replace(/^\//, '')); } catch { return false; }
  }, 'DATABASE_URL must be a MongoDB URI with a database name'),
  APP_ORIGIN: z.string().url().default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(48),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
  REGISTRATION_ENABLED: z.enum(['true', 'false']).default('true'),
  COURSE_CATALOG_SOURCE: z.enum(['bundled', 'database']).default('bundled'),
});
export function parseConfig(env: NodeJS.ProcessEnv) {
  const c = schema.parse(env);
  const u = new URL(c.APP_ORIGIN);
  if (u.origin !== c.APP_ORIGIN)
    throw new Error('APP_ORIGIN must be an origin with no path or trailing slash');
  if (
    c.NODE_ENV === 'production' &&
    (u.protocol !== 'https:' || /localhost|127\.0\.0\.1/.test(u.hostname))
  )
    throw new Error('Production APP_ORIGIN must use public HTTPS');
  if (/replace|example|changeme/i.test(c.SESSION_SECRET))
    throw new Error('Set a generated SESSION_SECRET');
  if (c.NODE_ENV === 'production' && env.REGISTRATION_ENABLED === undefined)
    c.REGISTRATION_ENABLED = 'false';
  return c;
}
export type Config = ReturnType<typeof parseConfig>;

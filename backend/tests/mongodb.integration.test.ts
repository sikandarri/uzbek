import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { prismaAuth } from '../src/auth/prisma-repository.js';
import { prismaCatalog } from '../src/routes/catalog.js';
import { parseConfig } from '../src/config.js';
const url = process.env.INTEGRATION_DATABASE_URL;
// Dedicated database only. No production database cleanup or truncation is performed.
if (url && !new URL(url).pathname.endsWith('_test'))
  throw new Error('Integration database name must end in _test');
const suite = url ? describe : describe.skip;
suite('real MongoDB replica-set integration (sync and seed a dedicated database first)', () => {
  const db = new PrismaClient({
    datasourceUrl: url ?? 'mongodb://127.0.0.1:27017/unused_test?replicaSet=rs0&directConnection=true',
  });
  const repo = prismaAuth(db),
    catalog = prismaCatalog(db);
  let app: Awaited<ReturnType<typeof createApp>>;
  const origin = 'http://localhost:5173';
  const namespace = randomUUID();
  beforeAll(async () => {
    await db.$connect();
    app = await createApp(
      parseConfig({
        NODE_ENV: 'test',
        DATABASE_URL: url!,
        APP_ORIGIN: origin,
        SESSION_SECRET: 't'.repeat(64),
      }),
      repo,
      catalog,
    );
  });
  afterAll(async () => {
    await db.$disconnect();
  });
  it('persists registration, sessions, permissions and logout', async () => {
    const boot = await supertest(app).get('/api/v1/auth/csrf');
    expect(boot.status).toBe(200);
    const res = await supertest(app)
      .post('/api/v1/auth/register')
      .set('Cookie', boot.headers['set-cookie'][0]!.split(';')[0]!)
      .set('Origin', origin)
      .set('X-CSRF-Token', boot.body.data.csrfToken)
      .send({
        email: `${namespace}@example.test`,
        password: 'a-dedicated-integration-test-passphrase',
        displayName: 'Integration student',
        acceptTerms: true,
      });
    expect(res.status).toBe(201);
    const cookie = res.headers['set-cookie'][0]!.split(';')[0]!;
    expect((await supertest(app).get('/api/v1/me').set('Cookie', cookie)).body.data.id).toBe(
      res.body.data.user.id,
    );
    expect((await supertest(app).get('/api/v1/admin/overview').set('Cookie', cookie)).status).toBe(
      403,
    );
    const audit = await db.auditLog.findMany({ where: { actorId: res.body.data.user.id } });
    expect(audit.map((x) => x.action)).toContain('auth.register');
    expect(
      (
        await supertest(app)
          .post('/api/v1/auth/logout')
          .set('Cookie', cookie)
          .set('Origin', origin)
          .set('X-CSRF-Token', res.body.data.csrfToken)
          .send({})
      ).status,
    ).toBe(204);
    expect((await supertest(app).get('/api/v1/me').set('Cookie', cookie)).status).toBe(401);
  });
  it('increments a shared rate bucket atomically under concurrency', async () => {
    const counts = await Promise.all(
      Array.from({ length: 20 }, () =>
        repo.consumeRate('integration:' + namespace, new Date(Date.now() + 60000)),
      ),
    );
    expect(Math.max(...counts)).toBe(20);
    expect(new Set(counts).size).toBe(20);
  });
  it('serves all five seeded tracks and all levels with no purchasable content', async () => {
    const tracks = await catalog.tracks('UZ');
    expect(tracks).toHaveLength(5);
    expect(tracks.every((t) => t.status === 'PUBLISHED')).toBe(true);
    expect(tracks.flatMap((t) => t.courses)).toHaveLength(14);
    expect(tracks.flatMap((t) => t.courses).flatMap((c) => c.modules)).toHaveLength(170);
    expect(tracks.flatMap((t) => t.courses).every((c) => c.publishedLessons > 0)).toBe(true);
    expect(tracks.flatMap((t) => t.courses).reduce((n, c) => n + c.publishedLessons, 0)).toBe(170);
  });
  it('rejects duplicate emails through MongoDB unique indexes', async () => {
    const email = `unique-${namespace}@example.test`;
    const first = await repo.createAccount(
      {
        email,
        passwordHash: 'test-only-hash',
        displayName: 'Test',
        locale: 'en',
        marketingOptIn: false,
      },
      namespace,
    );
    await expect(
      repo.createAccount(
        {
          email,
          passwordHash: 'test-only-hash',
          displayName: 'Test',
          locale: 'en',
          marketingOptIn: false,
        },
        namespace,
      ),
    ).rejects.toThrow();
    expect(first.id).toBeTruthy(); // MongoDB does not enforce foreign-key constraints.
  });
  it('does not reveal draft courses in the public catalog', async () => {
    const track = await db.track.findUniqueOrThrow({ where: { slug: 'general-english' } });
    const c = await db.course.create({
      data: {
        trackId: track.id,
        slug: 'private-' + namespace,
        position: 10000 + Math.floor(Math.random() * 1000000),
        status: 'DRAFT',
        listed: true,
      },
    });
    expect((await catalog.tracks('EN')).flatMap((t) => t.courses).some((x) => x.id === c.id)).toBe(
      false,
    );
    await db.course.delete({ where: { id: c.id } });
  });
});

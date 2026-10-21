import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { parseConfig } from '../src/config.js';
import { memoryRepository } from './memory-repository.js';
import { hashToken } from '../src/auth/crypto.js';
const origin = 'http://localhost:5173';
const config = parseConfig({
  NODE_ENV: 'test',
  DATABASE_URL: 'mongodb://127.0.0.1:27017/noldan_ravon_test?replicaSet=rs0&directConnection=true',
  APP_ORIGIN: origin,
  SESSION_SECRET: 'a'.repeat(64),
});
const credentials = { email: 'student@example.test', password: 'a-long-unique-test-passphrase' };
let mem: ReturnType<typeof memoryRepository>, app: Awaited<ReturnType<typeof createApp>>;
beforeEach(async () => {
  mem = memoryRepository();
  app = await createApp(config, mem.repo, { tracks: async () => [], health: async () => {} });
});
async function bootstrap() {
  const res = await supertest(app).get('/api/v1/auth/csrf');
  return {
    csrf: res.body.data.csrfToken as string,
    cookie: res.headers['set-cookie'][0]!.split(';')[0]!,
  };
}
async function register() {
  const boot = await bootstrap();
  const res = await supertest(app)
    .post('/api/v1/auth/register')
    .set('Cookie', boot.cookie)
    .set('Origin', origin)
    .set('X-CSRF-Token', boot.csrf)
    .send({ ...credentials, displayName: 'Aziza', acceptTerms: true });
  expect(res.status).toBe(201);
  return {
    res,
    boot,
    cookie: res.headers['set-cookie'][0]!.split(';')[0]!,
    csrf: res.body.data.csrfToken as string,
  };
}
describe('session authentication and authorization', () => {
  it('registers, hashes the password and rotates the anonymous session', async () => {
    const { res, boot, cookie } = await register();
    expect(cookie).not.toBe(boot.cookie);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.permissions).toEqual(['learning.read']);
    expect([...mem.accounts.values()][0]!.passwordHash).toMatch(/^\$argon2id\$/);
    expect([...mem.sessions.values()][0]!.tokenHash).toHaveLength(64);
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(res.headers['set-cookie'][0]).toContain('SameSite=Lax');
    expect((await supertest(app).get('/api/v1/me').set('Cookie', boot.cookie)).status).toBe(401);
    expect((await supertest(app).get('/api/v1/me').set('Cookie', cookie)).status).toBe(200);
  });
  it('requires authentication for profile and admin resources', async () => {
    expect((await supertest(app).get('/api/v1/me')).status).toBe(401);
    expect((await supertest(app).get('/api/v1/admin/overview')).status).toBe(401);
  });
  it('rejects CSRF-less and foreign-origin login', async () => {
    const { cookie, csrf } = await bootstrap();
    expect(
      (
        await supertest(app)
          .post('/api/v1/auth/login')
          .set('Origin', origin)
          .set('Cookie', cookie)
          .send(credentials)
      ).body.error.code,
    ).toBe('CSRF_REJECTED');
    expect(
      (
        await supertest(app)
          .post('/api/v1/auth/login')
          .set('Origin', 'https://attacker.test')
          .set('Cookie', cookie)
          .set('X-CSRF-Token', csrf)
          .send(credentials)
      ).body.error.code,
    ).toBe('ORIGIN_REJECTED');
  });
  it('rejects role injection and missing legal acceptance', async () => {
    const { cookie, csrf } = await bootstrap();
    for (const body of [
      { ...credentials, displayName: 'Aziza', acceptTerms: true, role: 'OWNER' },
      { ...credentials, displayName: 'Aziza', acceptTerms: false },
    ]) {
      const res = await supertest(app)
        .post('/api/v1/auth/register')
        .set('Cookie', cookie)
        .set('Origin', origin)
        .set('X-CSRF-Token', csrf)
        .send(body);
      expect(res.status).toBe(422);
    }
    expect(mem.accounts.size).toBe(0);
  });
  it('denies student admin access and reads permissions afresh', async () => {
    const { cookie, res } = await register();
    expect((await supertest(app).get('/api/v1/admin/overview').set('Cookie', cookie)).status).toBe(
      403,
    );
    const a = mem.accounts.get(res.body.data.user.id)!;
    a.permissions.push('admin.access');
    expect((await supertest(app).get('/api/v1/admin/overview').set('Cookie', cookie)).status).toBe(
      200,
    );
    a.permissions = [];
    expect((await supertest(app).get('/api/v1/admin/overview').set('Cookie', cookie)).status).toBe(
      403,
    );
  });
  it('does not allow user-id injection during profile update', async () => {
    const { cookie, csrf } = await register();
    const result = await supertest(app)
      .patch('/api/v1/me/profile')
      .set('Cookie', cookie)
      .set('Origin', origin)
      .set('X-CSRF-Token', csrf)
      .send({ displayName: 'Aziza New', locale: 'en', id: 'another-user' });
    expect(result.status).toBe(422);
  });
  it('updates only the signed-in profile and records an audit event', async () => {
    const { cookie, csrf } = await register();
    const r = await supertest(app)
      .patch('/api/v1/me/profile')
      .set('Cookie', cookie)
      .set('Origin', origin)
      .set('X-CSRF-Token', csrf)
      .send({ displayName: 'Aziza New', locale: 'en' });
    expect(r.status).toBe(200);
    expect(r.body.data.locale).toBe('en');
    expect(mem.events).toContain('profile.update');
  });
  it('invalidates the session on logout and rejects replay', async () => {
    const { cookie, csrf } = await register();
    expect(
      (
        await supertest(app)
          .post('/api/v1/auth/logout')
          .set('Cookie', cookie)
          .set('Origin', origin)
          .set('X-CSRF-Token', csrf)
          .send({})
      ).status,
    ).toBe(204);
    expect((await supertest(app).get('/api/v1/me').set('Cookie', cookie)).status).toBe(401);
  });
  it('rejects expired and idle sessions', async () => {
    const { cookie } = await register();
    const hash = hashToken(cookie.split('=')[1]!);
    mem.sessions.get(hash)!.expiresAt = new Date(0);
    expect((await supertest(app).get('/api/v1/me').set('Cookie', cookie)).status).toBe(401);
    mem.sessions.get(hash)!.expiresAt = new Date(Date.now() + 100000);
    mem.sessions.get(hash)!.lastSeenAt = new Date(0);
    expect((await supertest(app).get('/api/v1/me').set('Cookie', cookie)).status).toBe(401);
  });
  it('immediately rejects a suspended account even with a valid session', async () => {
    const { cookie, res } = await register();
    mem.accounts.get(res.body.data.user.id)!.status = 'SUSPENDED';
    expect((await supertest(app).get('/api/v1/me').set('Cookie', cookie)).status).toBe(401);
  });
  it('logs in using normalized email and rotates the session', async () => {
    await register();
    const { cookie, csrf } = await bootstrap();
    const res = await supertest(app)
      .post('/api/v1/auth/login')
      .set('Cookie', cookie)
      .set('Origin', origin)
      .set('X-CSRF-Token', csrf)
      .send({ ...credentials, email: ' STUDENT@EXAMPLE.TEST ' });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).not.toContain(cookie);
  });
  it('returns the same error for unknown accounts and wrong passwords', async () => {
    await register();
    const { cookie, csrf } = await bootstrap();
    for (const email of [credentials.email, 'unknown@example.test']) {
      const r = await supertest(app)
        .post('/api/v1/auth/login')
        .set('Cookie', cookie)
        .set('Origin', origin)
        .set('X-CSRF-Token', csrf)
        .send({ email, password: 'wrong' });
      expect(r.status).toBe(401);
      expect(r.body.error.code).toBe('INVALID_CREDENTIALS');
    }
  });
  it('enforces shared account throttles and sends Retry-After', async () => {
    const { cookie, csrf } = await bootstrap();
    for (let i = 0; i < 10; i++)
      await supertest(app)
        .post('/api/v1/auth/login')
        .set('Cookie', cookie)
        .set('Origin', origin)
        .set('X-CSRF-Token', csrf)
        .send({ email: 'none@example.test', password: 'wrong' });
    const r = await supertest(app)
      .post('/api/v1/auth/login')
      .set('Cookie', cookie)
      .set('Origin', origin)
      .set('X-CSRF-Token', csrf)
      .send({ email: 'none@example.test', password: 'wrong' });
    expect(r.status).toBe(429);
    expect(r.headers['retry-after']).toBeDefined();
  });
  it('does not create billing, AI or learning endpoints accidentally', async () => {
    expect((await supertest(app).get('/api/v1/plans')).status).toBe(404);
    expect((await supertest(app).get('/api/v1/lessons/private')).status).toBe(404);
  });
  it('sends security headers and no-store on personalized responses', async () => {
    const { cookie } = await register();
    const r = await supertest(app).get('/api/v1/me').set('Cookie', cookie);
    expect(r.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(r.headers['cache-control']).toBe('no-store');
    expect(r.headers['x-request-id']).toBeDefined();
    expect(r.headers['x-powered-by']).toBeUndefined();
  });
  it('sets Secure and __Host cookies in production', async () => {
    app = await createApp(
      { ...config, NODE_ENV: 'production', APP_ORIGIN: 'https://learning.example.test' },
      mem.repo,
      { tracks: async () => [], health: async () => {} },
    );
    const r = await supertest(app).get('/api/v1/auth/csrf');
    expect(r.headers['set-cookie'][0]).toMatch(/^__Host-nr_session=/);
    expect(r.headers['set-cookie'][0]).toContain('Secure');
  });
  it('does not leak parser errors or oversized payloads', async () => {
    const r = await supertest(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('BAD_REQUEST');
    expect(JSON.stringify(r.body)).not.toContain('SyntaxError');
    const huge = await supertest(app)
      .post('/api/v1/auth/login')
      .send({ x: 'a'.repeat(40000) });
    expect(huge.status).toBe(413);
  });
  it('closes registration when configured', async () => {
    app = await createApp({ ...config, REGISTRATION_ENABLED: 'false' }, mem.repo, {
      tracks: async () => [],
      health: async () => {},
    });
    const { cookie, csrf } = await bootstrap();
    expect(
      (
        await supertest(app)
          .post('/api/v1/auth/register')
          .set('Cookie', cookie)
          .set('Origin', origin)
          .set('X-CSRF-Token', csrf)
          .send({ ...credentials, displayName: 'Aziza', acceptTerms: true })
      ).status,
    ).toBe(503);
  });
});

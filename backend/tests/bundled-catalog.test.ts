import { describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { bundledCatalog } from '../src/routes/bundled-catalog.js';
import { createApp } from '../src/app.js';
import { parseConfig } from '../src/config.js';
import { memoryRepository } from './memory-repository.js';

describe('bundled courses work even if MongoDB is unavailable', () => {
  const catalog = bundledCatalog();
  it('publishes five tracks, 14 variants and all 170 authored lessons in both languages', async () => {
    for (const locale of ['EN', 'UZ'] as const) {
      const tracks = await catalog.tracks(locale);
      expect(tracks.map(t => t.courses.reduce((n,c) => n+c.publishedLessons,0)))
        .toEqual([71,22,33,37,7]);
      expect(tracks.every(t => t.status === 'PUBLISHED')).toBe(true);
      expect(tracks.flatMap(t => t.courses)).toHaveLength(14);
      for (const course of tracks.flatMap(t => t.courses)) {
        const outline = await catalog.courseOutline!(course.slug, locale);
        expect(outline).not.toBeNull();
        const lessons = outline!.modules.flatMap(m => m.lessons);
        expect(lessons).toHaveLength(course.publishedLessons);
        expect(outline!.modules.every(m => m.lessons.length === 1)).toBe(true);
        for (const l of lessons) {
          const detail = await catalog.lessonDetail!(l.id, locale);
          expect(detail?.blocks).toHaveLength(5);
          expect(detail?.courseSlug).toBe(course.slug);
          expect((detail?.blocks.find(b => b.type === 'MICROPHONE')?.content.drills as unknown[])?.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });
  it('routes anonymous study requests without hitting database-backed rate limiting or sessions', async () => {
    const conf = parseConfig({ NODE_ENV:'test',
      DATABASE_URL:'mongodb://127.0.0.1:27017/unused?replicaSet=rs0',
      SESSION_SECRET:'a'.repeat(64) });
    const repo = memoryRepository().repo;
    repo.consumeRate = async () => { throw new Error('database offline'); };
    repo.getSession = async () => { throw new Error('database offline'); };
    const app = await createApp(conf, repo, catalog);
    const response = await supertest(app).get('/api/v1/tracks?locale=en');
    expect(response.status).toBe(200);
    expect(response.body.data[0].courses[0].publishedLessons).toBe(13);
    const outlineResponse = await supertest(app).get('/api/v1/courses/general-english-a1/outline');
    expect(outlineResponse.status).toBe(200);
    const id = outlineResponse.body.data.modules[0].lessons[0].id;
    const lessonResponse = await supertest(app).get(`/api/v1/lessons/${id}`);
    expect(lessonResponse.status).toBe(200);
    expect(lessonResponse.body.data.blocks).toHaveLength(5);
    expect((await supertest(app).get('/api/v1/me')).status).toBe(401);
    expect((await supertest(app).get('/api/v1/courses/unknown-course/outline')).status).toBe(404);
  });
});

describe('curriculum clinics added to every course', () => {
  const catalog = bundledCatalog();
  it('offers one distinct learning lesson per module including three new clinics per variant', async () => {
    const tracks = await catalog.tracks('EN');
    for (const course of tracks.flatMap(t => t.courses)) {
      const outline = await catalog.courseOutline!(course.slug, 'EN');
      expect(outline!.modules.every(m => m.lessons.length === 1)).toBe(true);
      expect(outline!.modules.slice(-3)).toHaveLength(3);
      for (const module of outline!.modules.slice(-3)) {
        for (const lesson of module.lessons) {
          const detail = await catalog.lessonDetail!(lesson.id, 'EN');
          expect(detail?.blocks.map(b => b.type)).toEqual(['EXPLANATION','VOCABULARY','READING','MICROPHONE','QUESTION']);
        }
      }
    }
  });
});

describe('resilient logout during a MongoDB outage', () => {
  it('clears the HTTP-only browser cookie and reports a partial revocation', async () => {
    const conf = parseConfig({NODE_ENV:'test',
      DATABASE_URL:'mongodb://127.0.0.1:27017/unused?replicaSet=rs0',
      APP_ORIGIN:'http://localhost:5173',SESSION_SECRET:'a'.repeat(64)});
    const mock = memoryRepository();
    const app = await createApp(conf,mock.repo,bundledCatalog());
    const browser = supertest.agent(app);
    const bootstrap = await browser.get('/api/v1/auth/csrf');
    expect(bootstrap.status).toBe(200);
    mock.repo.consumeRate = async () => {throw new Error('Atlas down');};
    mock.repo.getSession = async () => {throw new Error('Atlas down');};
    mock.repo.revokeSession = async () => {throw new Error('Atlas down');};
    // The csrf-from-cookie endpoint must also work without database access.
    const csrf = await browser.get('/api/v1/auth/csrf');
    expect(csrf.status).toBe(200);
    const logout = await browser.post('/api/v1/auth/logout')
      .set('origin','http://localhost:5173')
      .set('x-csrf-token',csrf.body.data.csrfToken)
      .set('content-type','application/json')
      .send('{}');
    expect(logout.status).toBe(503);
    expect(logout.body.error.code).toBe('LOGOUT_PARTIAL');
    expect(logout.headers['set-cookie']?.some((v:string)=>v.startsWith('nr_session=') && v.includes('Expires='))).toBe(true);
  });
  it('refuses invalid origin or CSRF on logout', async () => {
    const conf = parseConfig({NODE_ENV:'test',DATABASE_URL:'mongodb://127.0.0.1:27017/unused?replicaSet=rs0',SESSION_SECRET:'a'.repeat(64)});
    const app = await createApp(conf,memoryRepository().repo,bundledCatalog());
    const browser = supertest.agent(app);
    await browser.get('/api/v1/auth/csrf');
    const bad = await browser.post('/api/v1/auth/logout').set('origin','https://attacker.example').send('{}');
    expect(bad.status).toBe(403);
  });
});

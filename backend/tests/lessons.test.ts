import { describe, expect, it, beforeAll } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { parseConfig } from '../src/config.js';
import { memoryRepository } from './memory-repository.js';
import type { CatalogRepository } from '../src/routes/catalog.js';
import type { LessonDetails, CourseOutline } from '../../shared/src/contracts.js';

const lessonId = '7b0b93ef-4891-4fd6-83db-cd801b64bb18';
const draftId = '3bc66e7e-c94d-4cdb-992c-3a02cffb4db0';
const lesson: LessonDetails = {
  id: lessonId, title: 'Greetings: lesson & practice', objectives: ['Speak politely.'],
  courseSlug: 'general-english-a1', courseName: 'General English · A1',
  moduleTitle: 'Greetings', estimatedMinutes: 25,
  blocks: [{ id: 'block-1', position: 0, type: 'EXPLANATION', content: {
    headingEn: 'Greetings', en: 'Start with hello.', uz: 'Salom bilan boshlang.',
  } }],
};
const outline: CourseOutline = {
  id: 'course-1', slug: 'general-english-a1', name: 'General English · A1',
  description: 'Self-study course', modules: [{ id: 'module-1', title: 'Greetings',
    position: 0, lessons: [{ id: lessonId, position: 0,
      title: lesson.title, estimatedMinutes: 25 }] }],
};

describe('published foundation lesson endpoints', () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  beforeAll(async () => {
    const config = parseConfig({ NODE_ENV: 'test',
      DATABASE_URL: 'mongodb://127.0.0.1:27017/noldan_ravon_test?replicaSet=rs0',
      APP_ORIGIN: 'http://localhost:5173', SESSION_SECRET: 'a'.repeat(64) });
    const catalog: CatalogRepository = {
      health: async () => {}, tracks: async () => [],
      courseOutline: async slug => slug === outline.slug ? outline : null,
      lessonDetail: async id => id === lessonId ? lesson : null,
    };
    app = await createApp(config, memoryRepository().repo, catalog);
  });
  it('serves a published lesson without a login or paid subscription', async () => {
    const res = await supertest(app).get(`/api/v1/lessons/${lessonId}?locale=uz-Latn`);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Greetings: lesson & practice');
    expect(res.body.data.blocks[0].type).toBe('EXPLANATION');
  });
  it('lists published lessons in the course outline', async () => {
    const res = await supertest(app).get('/api/v1/courses/general-english-a1/outline?locale=en');
    expect(res.status).toBe(200);
    expect(res.body.data.modules[0].lessons[0].id).toBe(lessonId);
  });
  it('returns not found for a non-published or unknown lesson', async () => {
    expect((await supertest(app).get(`/api/v1/lessons/${draftId}`)).status).toBe(404);
    expect((await supertest(app).get('/api/v1/courses/missing-course/outline')).status).toBe(404);
  });
});

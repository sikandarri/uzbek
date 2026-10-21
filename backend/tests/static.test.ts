import { afterAll, beforeAll, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { parseConfig } from '../src/config.js';
import { memoryRepository } from './memory-repository.js';
let dir: string;
let app: Awaited<ReturnType<typeof createApp>>;
beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'noldan-static-test-'));
  await mkdir(path.join(dir, 'assets'));
  await writeFile(path.join(dir, 'index.html'), '<!doctype html><title>Noldan Ravon</title>');
  await writeFile(path.join(dir, 'assets', 'app.js'), 'window.example = true;');
  const config = parseConfig({
    NODE_ENV: 'test',
    DATABASE_URL: 'mongodb://127.0.0.1:27017/noldan_ravon_test?replicaSet=rs0&directConnection=true',
    SESSION_SECRET: 's'.repeat(64),
  });
  app = await createApp(
    config,
    memoryRepository().repo,
    {
      tracks: async () => [],
      health: async () => {
        throw new Error('private database detail');
      },
    },
    dir,
  );
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});
it('serves SPA deep links and actual built assets from Express', async () => {
  const route = await supertest(app).get('/app/profile');
  expect(route.status).toBe(200);
  expect(route.text).toContain('<title>Noldan Ravon</title>');
  expect(route.headers['cache-control']).toBe('no-cache');
  expect((await supertest(app).get('/assets/app.js')).status).toBe(200);
});
it('never rewrites API errors or missing assets to the SPA', async () => {
  const api = await supertest(app).get('/api/v1/not-real');
  expect(api.status).toBe(404);
  expect(api.body.error.code).toBe('NOT_FOUND');
  const asset = await supertest(app).get('/assets/missing.js');
  expect(asset.status).toBe(404);
  expect(asset.text).not.toContain('<!doctype html>');
});
it('separates liveness from database readiness without leaking connection details', async () => {
  expect((await supertest(app).get('/api/v1/health/live')).status).toBe(200);
  const ready = await supertest(app).get('/api/v1/health/ready');
  expect(ready.status).toBe(503);
  expect(ready.body.error.code).toBe('NOT_READY');
  expect(ready.text).not.toContain('private database detail');
});

import { expect, it } from 'vitest';
import { parseConfig } from '../src/config.js';
const base = {
  DATABASE_URL: 'mongodb://127.0.0.1:27017/noldan_ravon_test?replicaSet=rs0&directConnection=true',
  SESSION_SECRET: 'z'.repeat(64),
};
it('rejects absent secrets and unsafe production origins', () => {
  expect(() => parseConfig({ DATABASE_URL: base.DATABASE_URL })).toThrow();
  expect(() => parseConfig({ ...base, NODE_ENV: 'production' })).toThrow();
  expect(() =>
    parseConfig({ ...base, NODE_ENV: 'production', APP_ORIGIN: 'https://localhost' }),
  ).toThrow();
  expect(() => parseConfig({ ...base, APP_ORIGIN: 'https://example.test/' })).toThrow();
});
it('requires a generated secret and bounded proxy trust', () => {
  expect(() => parseConfig({ ...base, SESSION_SECRET: 'replace'.repeat(12) })).toThrow();
  expect(() => parseConfig({ ...base, TRUST_PROXY_HOPS: 'true' })).toThrow();
  expect(
    parseConfig({ ...base, NODE_ENV: 'production', APP_ORIGIN: 'https://learn.example.test' })
      .TRUST_PROXY_HOPS,
  ).toBe(0);
});

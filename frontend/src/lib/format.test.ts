import { expect, it } from 'vitest';
import { formatDate, formatUZS } from './format';
it('converts tiyin to UZS without treating minor units as whole som', () => {
  expect(formatUZS('10000000', 'en')).toContain('100,000');
  expect(formatUZS('12345', 'en')).toContain('123.45');
  expect(() => formatUZS('999999999999999999')).toThrow();
});
it('uses Tashkent calendar dates across a UTC date boundary', () => {
  expect(formatDate('2026-10-17T22:00:00Z', 'en')).toContain('18 Oct 2026');
  expect(formatDate('2026-10-17T22:00:00Z', 'en')).toContain('03:00');
});

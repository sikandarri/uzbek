import { expect, it } from 'vitest';
import en from './en.json';
import uz from './uz.json';
function flatten(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value };
  return Object.fromEntries(
    Object.entries(value as object).flatMap(([k, v]) =>
      Object.entries(flatten(v, prefix ? prefix + '.' + k : k)),
    ),
  );
}
it('keeps all Uzbek and English interface keys in parity', () => {
  const a = flatten(en),
    b = flatten(uz);
  expect(Object.keys(a).sort()).toEqual(Object.keys(b).sort());
  for (const [k, v] of Object.entries(a)) {
    expect(b[k]!.trim().length).toBeGreaterThan(0);
    expect(v.match(/{{.*?}}/g) ?? []).toEqual(b[k]!.match(/{{.*?}}/g) ?? []);
  }
});

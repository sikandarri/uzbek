import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
// Defer the optional native module until a password operation is actually needed.
// Public bundled lessons should start even if native install scripts were blocked.
const loadArgon2 = async () => (await import('argon2')).default;
export const randomToken = () => randomBytes(32).toString('base64url');
export const hashToken = (v: string) => createHash('sha256').update(v).digest('hex');
export const csrfFor = (raw: string, secret: string) =>
  createHmac('sha256', secret)
    .update('csrf:' + raw)
    .digest('base64url');
export const privateKey = (value: string, secret: string) =>
  createHmac('sha256', secret).update(value).digest('hex');
export function equalToken(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export const hashPassword = async (v: string) => {
  const argon2 = await loadArgon2();
  return argon2.hash(v, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 });
};
export const verifyPassword = async (hash: string, v: string) => {
  const argon2 = await loadArgon2();
  return argon2.verify(hash, v);
};

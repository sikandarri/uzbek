import { access } from 'node:fs/promises';
const required = [
  '../backend/dist/backend/src/index.js',
  '../backend/dist/backend/src/app.js',
  '../backend/dist/shared/src/contracts.js',
  '../frontend/dist/index.html',
];
const missing = [];
for (const file of required) {
  try { await access(new URL(file, import.meta.url)); }
  catch { missing.push(file.slice(3)); }
}
if (missing.length) {
  console.error('Build incomplete. Missing: ' + missing.join(', '));
  console.error('Run npm run build:hostinger from the root containing frontend, backend and shared.');
  process.exitCode = 1;
} else {
  const { hashPassword, verifyPassword } = await import('../backend/dist/backend/src/auth/crypto.js');
  const probe = 'build-only-password-compatibility-probe';
  if (!await verifyPassword(await hashPassword(probe), probe)) {
    throw new Error('Password hashing runtime check failed');
  }
  console.info('Verified: compiled Express entry, shared contracts and React build are present.');
  console.info('Verified: password hashing native module loads and verifies passwords on the build host.');
}

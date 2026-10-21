import { devApiPort } from './dev-api-port.mjs';
const port = devApiPort();
const url = `http://127.0.0.1:${port}/api/v1/health/catalog`;
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
  const body = await response.json();
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = body.data;
  if (!data || typeof data.lessonsAvailable !== 'number') throw new Error('Invalid catalog response');
  console.log(`PASS: ${url}`);
  console.log(`Courses: ${data.courseVariants}; tracks: ${data.tracks}; lessons: ${data.lessonsAvailable}`);
  if (data.mode === 'development-public-only') {
    console.warn('WARNING: API is in read-only mode; sign-in and registration require fixing backend configuration.');
  }
  if (data.lessonsAvailable !== 170) process.exitCode = 1;
} catch (error) {
  console.error(`FAIL: Cannot load course catalog from ${url}`);
  console.error('Check the [api] terminal for the startup error. npm run dev must start both API and Vite.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

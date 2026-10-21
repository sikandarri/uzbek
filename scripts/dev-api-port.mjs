/** Resolve the API port used in local development without exposing .env secrets. */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const envPath = join(root, 'backend', '.env');
export function devApiPort() {
  const source = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  const match = source.match(/^\s*PORT\s*=\s*["']?(\d+)["']?\s*(?:#.*)?$/m);
  const port = Number(process.env.NOLDAN_API_PORT || process.env.PORT || match?.[1] || '3001');
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : 3001;
}

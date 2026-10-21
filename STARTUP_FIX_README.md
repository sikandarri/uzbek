# Fix for courses not loading (ECONNREFUSED 127.0.0.1:3001)

The screenshot means the React/Vite server started, but the Express API was unavailable on the port Vite was forwarding to. It is **not evidence that lesson data has disappeared**. The ZIP includes 170 unique authored lessons.

## Updated behavior

- Vite's local development proxy now follows `backend/.env` `PORT` instead of always assuming 3001.
- API startup no longer imports the native Argon2 binary or hashes a password merely to serve public lessons. The first account password operation loads Argon2 instead.
- When local **development** cannot initialize full auth because of missing or invalid settings or required libraries, it can start a strictly read-only public API with the 170 bundled lessons. It does **not** try to sign anyone in or write to MongoDB. Authentication requests return `AUTH_UNAVAILABLE`.
- Production does **not** use this fallback: invalid config remains a startup error. Never use development mode as a substitute for production account security.
- Console logs identify full vs. read-only mode. `npm run api:check` confirms port and published lesson count.
- `npm run dev` stops both processes when one exits unexpectedly, instead of leaving a broken frontend visible.

## Windows / Git Bash

1. Extract **full ZIP** into a new directory and copy your existing `backend/.env` to it. Never share your secret values or commit them into source control.
2. At the project root run:

   ```bash
   npm ci --include=dev
   npm run db:generate
   npm run courses:verify
   npm run dev
   ```

3. In another terminal in the same directory:

   ```bash
   npm run api:check
   ```

4. Visit `http://localhost:5173/courses`. The expected API health check is `170` lessons. If there is still no `[api] listening` message, run `npm run dev -w backend` separately and share its error output **without** pasting any `.env` values.

### About MongoDB

`COURSE_CATALOG_SOURCE=bundled` lets the public lesson reader function without MongoDB. Login, registration, persistent sessions and personal server-side progress still require working MongoDB Atlas credentials, connectivity and supported transactions. A public-only local fallback is intentionally *not* a logged-in session.

### If you set PORT=3000

The development proxy will now forward to port `3000`. Without this fix, the hardcoded `3001` proxy caused `ECONNREFUSED` even when the API was alive on 3000. If you change `PORT`, restart the Vite server to reload its proxy config.

### Deployment

Production requires valid `DATABASE_URL`, `SESSION_SECRET` and `APP_ORIGIN` as before. Use `NODE_ENV=production` and a working Node.js/Prisma environment; it will not bypass configuration with a public-only fallback.

### If the startup log reports `AUTH_UNAVAILABLE`

The API is serving only public lessons because secure login initialization could not be completed. This can happen when `.env` is missing/invalid, Prisma Client was not generated, or npm blocked the Argon2 native install. This mode is for **local development only**. Never use public-only development fallback for production authentication.

Check the terminal for `Invalid environment fields:` and use `npm run db:generate` to regenerate Prisma if needed. If `argon2` installation was skipped, fix the npm install-scripts warning and reinstall trusted dependencies, then restart the backend. If the database is unavailable, do not attempt login or registration until Atlas connectivity is fixed.

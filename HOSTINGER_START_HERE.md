# Hostinger deployment notes | Noldan Ravon (2026-10-20)

This is a React/Vite + Express Node.js project. Deploy the source as a Node.js application, not the frontend `dist` directory as a static-only website. The root build script generates Prisma and builds the frontend and API. The Node.js entry point is `scripts/start.mjs` (which imports `backend/dist/backend/src/index.js`).

For Hostinger, choose a supported Node.js 22 release; set build to `npm run build` (it runs `npm ci` during build), and set entry to `scripts/start.mjs`. Verify these settings against your hosting plan's current Node.js deployment form. Set `APP_ORIGIN=https://YOUR_HOSTNAME`, `NODE_ENV=production`, `DATABASE_URL=<private MongoDB Atlas URI with /database name>`, `SESSION_SECRET=<your securely generated 48+ character secret>`, and `COURSE_CATALOG_SOURCE=bundled` in the Hostinger environment configuration. Do not include secrets in a ZIP, Git commit or screenshot.

Do not deploy over an existing production site without a backup and confirming the site/account. This source package has not been deployed to your Hostinger account here.

After deployment verify `/api/v1/health/catalog` reports 5 tracks, 14 variants, **170 lessons**, then open several actual lessons. Login and server-side sessions require a working Atlas replica-set database. Microphone recognition works only under HTTPS/localhost and in browsers that support the relevant speech API; it is not a certified IELTS or CEFR scorer.

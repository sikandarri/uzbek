# MongoDB deployment notes

The original MySQL deployment notes were replaced with a MongoDB Atlas staging path. The full Phase 1 website is not a completed LMS and should not be marketed as a public-ready course system.

Use Hostinger Express/Other Node.js hosting (Node 22/24) with outbound TLS access to MongoDB Atlas. Set runtime variables only in your host's secure environment configuration, never in a Git repository or ZIP archive. Keep `APP_ORIGIN` exactly equal to the browser's HTTPS origin (no trailing slash). Use your assigned `PORT` and set `TRUST_PROXY_HOPS` only after validating the proxy chain. `REGISTRATION_ENABLED` defaults to false in production.

Upload the entire workspace source, not only the frontend, and set:

- Build command: `npm run build`
- Start: `npm start` or entry `scripts/start.mjs`
- Output/root: `.` (keep all workspaces and compiled app files)
- DB: `mongodb+srv://.../noldan_ravon?retryWrites=true&w=majority` with proper Atlas credentials

Prisma MongoDB **does not support Prisma Migrate**. One-time schema initialization requires `npm run db:sync` (`prisma db push`) and idempotent catalog bootstrap requires `npm run db:seed`, both from a trusted environment with Atlas connectivity. Backup/review indexes before syncing a populated database. Do not run `db:sync` on every build/start. No SQL migrations are shipped in this edition.

MongoDB Atlas provides replica-set support required for Prisma multi-document transactions and nested writes. Atlas Network Access must allow connections from local development or Hostinger's outbound address range, with least-privilege access and TLS. Do not publish a local unauthenticated MongoDB service.

Health routes: `/api/v1/health/live` checks the process and `/api/v1/health/ready` pings MongoDB. Test registration, session rotation, CSRF protections and catalog after deployment. Production account/email/password-recovery, lessons, billing, tutoring and privacy workflows remain pending; do not expose them as live.

An existing MySQL dataset must be migrated using a separate, verified export-transform-import process. Prisma MongoDB preserves string UUID identifiers in `_id` for new data, but this archive performs **no** existing user/content migration.

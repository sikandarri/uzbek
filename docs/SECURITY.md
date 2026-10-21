# Phase 1 security design

## Implemented controls

Passwords use Argon2id (64 MiB, three iterations, one lane). The server verifies an unknown email against a dummy hash to avoid a fast nonexistent-user path. Passwords are 12–128 characters for signup and never included in responses or logs. Password hashing parameters must be load-tested against the chosen host's memory budget before launch.

A 256-bit random opaque session value is kept only in a cookie. MongoDB stores its SHA-256 hash. Authenticated sessions have a seven-day absolute lifetime and a 24-hour idle deadline, checked on each request. Last-seen writes are throttled to five-minute intervals. Anonymous CSRF sessions expire after one hour. Login/signup rotate the current session; logout removes it. Existing sessions from other devices are not revoked by logging in on a new device. Password change/all-device logout are pending.

Cookies use HttpOnly, SameSite=Lax and Path=/ with no Domain. Production adds Secure and the `__Host-` prefix. `APP_ORIGIN` must be one public HTTPS origin without a path or trailing slash. Prefer one trusted HTTPS reverse proxy and block direct access to the application port in production.

Every API mutation requires the exact configured Origin, JSON content type and a constant-time-checked CSRF token derived with HMAC from the session secret and raw session value. Even login/signup are protected. The token is held in frontend memory, never local storage. Browser mutation retries are explicit, avoiding accidental duplicate mutations.

Permissions are fetched from the database on each authenticated request; suspensions and permission removal apply immediately. No frontend check is treated as authorization. `PATCH /me/profile` determines the target user from the session. All request schemas are strict and reject extra properties such as role/user ID/status.

Rate counters use atomic MongoDB upsert/increment, so multiple Node processes share counters. Keys contain keyed hashes of the client IP or normalized email, never raw values. API limit: 300/minute/IP; CSRF bootstrap: 30/minute/IP; signup: 5/hour/IP; login: 20/15 minutes/IP and 10/15 minutes/account. These are fixed-window controls with bounded bursts at window boundaries. They do not replace upstream DDoS protection. Tune for shared school networks and observe false positives before launch.

Origin-independent readiness/liveness endpoints carry no account data. They bypass expensive session handling; protect readiness at the edge if needed. APIs use no-store. Helmet sets a restrictive CSP, frame protections and other response headers. JSON input is limited to 32 KB. There is no raw HTML rendering, file upload, payment callback, recording or AI provider proxy in Phase 1.

Successful signup/login/logout/profile changes and failed credentials create audit events. Events omit passwords, session tokens, full request bodies and transcripts. The API exposes no audit update/delete route. Database administrators can still alter records: production requires insert-only application grants on AuditLog and restricted archival credentials, plus external append-only security logging if tamper evidence is required. Database-level immutability is not claimed.

## Secrets and persistence

Only `backend/.env.example` is committed. Use the hosting environment for real secrets. Rotating SESSION_SECRET invalidates outstanding CSRF tokens; to revoke all sessions, deliberately clear session records as an audited operator task. Never reuse production secrets in test/staging. The ZIP excludes local `.env`, dependencies and build outputs.

Run `npm run auth:cleanup -w backend` as a finite daily scheduled command to remove expired session, rate and auth-token rows. No worker is required. Avoid deleting audit or financial records with this maintenance task. Define legal retention and anonymization rules before real learners are invited.

## Production gates still open

- Email verification, password recovery/change, breached-password screening and optional staff MFA.
- Production owner provisioning and reviewed role-management mutations.
- Final legal/operator/age/retention notices and account erasure/export workflow.
- A MongoDB replica-set integration run and schema-sync rehearsal on a disposable/staging instance.
- Browser, keyboard and assistive-technology checks at mobile/tablet/desktop widths.
- Host-specific proxy trust validation, rate-limit tuning, HTTPS and cookie smoke tests.
- Safe media upload validation, private storage, malware policy and signed URLs in the media phase.
- Payment signature/authentication, idempotency and state machine in the billing phase.
- Model output validation, privacy, quota reservation and spend limits in the AI phase.

No secrets or public production login credentials are shipped. Phase 1 must remain private/staging until these launch gates and the requested later functionality are complete.

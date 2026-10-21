# Phase 1 API

Base path: `/api/v1`. JSON successes use `{data, meta?: {requestId}}`; errors use `{error: {code, requestId, fields?}}`. No stack traces, hashes or raw provider messages are returned. Health checks intentionally have minimal envelopes.

| Method | Path                       | Access / result                                                                        |
| ------ | -------------------------- | -------------------------------------------------------------------------------------- |
| GET    | `/health/live`             | Process liveness                                                                       |
| GET    | `/health/ready`            | MongoDB ping succeeds, otherwise 503                                                    |
| GET    | `/auth/csrf`               | Create/reuse short-lived anonymous server session; return session-bound token          |
| POST   | `/auth/register`           | CSRF/origin + registration limit; creates student and session, returns 201             |
| POST   | `/auth/login`              | CSRF/origin + IP/account limits; rotates session, returns safe user and new CSRF token |
| POST   | `/auth/logout`             | Signed-in + CSRF; revoke session and clear cookie, returns 204                         |
| GET    | `/me`                      | Signed-in account DTO, permissions and saved locale                                    |
| PATCH  | `/me/profile`              | Signed-in + CSRF; only displayName and locale allowed                                  |
| GET    | `/tracks?locale=uz-Latn`   | Five seeded tracks with localized course/module metadata                               |
| GET    | `/courses/:slug?locale=en` | One listed course; drafts return 404                                                   |
| GET    | `/admin/overview`          | `admin.access`; implementation feature flags, not fake analytics                       |

All other API paths return 404, including pending payment/AI/learning paths. The SPA history fallback never handles `/api` or missing asset files.

## Auth request sequence

1. `GET /auth/csrf` with same-origin credentials. Retain the returned token in memory; the browser stores the HttpOnly cookie.
2. Send mutation JSON with `Content-Type: application/json`, `X-CSRF-Token` and the exact configured Origin. A browser supplies Origin itself.
3. Replace the in-memory CSRF token after successful login or registration. Old anonymous cookie/token pairs cannot authenticate the new account.
4. On CSRF rejection, show a retry/refresh message. The client does not automatically replay a mutation. A following manual attempt bootstraps a fresh token.

Registration body:

```json
{
  "email": "student@example.test",
  "password": "a-local-unique-passphrase",
  "displayName": "Aziza",
  "locale": "uz-Latn",
  "acceptTerms": true,
  "marketingOptIn": false
}
```

Password length: 12–128 characters; email at most 254; name 2–80. JSON is strict: clients cannot set roles, IDs, status, emailVerifiedAt or permissions. Login accepts email/password only. Profile accepts displayName/locale only. Locale values are `uz-Latn` and `en`, mapped to `UZ`/`EN` in MongoDB.

Selected errors: `UNAUTHENTICATED` 401, `INVALID_CREDENTIALS` 401, `FORBIDDEN` 403, `ORIGIN_REJECTED` 403, `CSRF_REJECTED` 403, `NOT_FOUND` 404, `REGISTRATION_FAILED` 409, `VALIDATION_ERROR` 422, `RATE_LIMITED` 429, `NOT_READY` 503. Rate limits include Retry-After. Errors are translated in the UI; field paths contain no input values.

Catalog example (abbreviated):

```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "general-english",
      "titleKey": "general",
      "status": "COMING_SOON",
      "courses": [
        {
          "id": "uuid",
          "slug": "general-english-a1",
          "level": "A1",
          "status": "COMING_SOON",
          "name": "General English · A1",
          "description": "…",
          "publishedLessons": 0,
          "plannedLessons": 0,
          "modules": [{ "id": "uuid", "title": "Greetings", "status": "COMING_SOON" }]
        }
      ]
    }
  ]
}
```

`plannedLessons` counts actual visible lesson records. It does not invent the eventual curriculum inventory. Module outlines do not count as lessons.

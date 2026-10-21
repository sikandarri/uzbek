> **Updated October 2026:** The newest edition has **256 lessons** with microphone-based speech-to-text match scoring. See `EXPANDED_COURSES_AND_SPEAKING.md`. Older counts below describe the previous foundation release.

NEW (October 2026): For immediate access to all 128 foundation lessons, use this release with `COURSE_CATALOG_SOURCE=bundled` and `npm run dev`. The public course catalog no longer needs a MongoDB seed. Ignore older `db:repair-courses` instructions unless you choose `COURSE_CATALOG_SOURCE=database`. See RUN_COURSES_WITHOUT_MONGODB.md.

# Noldan Ravon: repair 0 published lessons

Your screenshot showed 0 published lessons and Coming soon in all five tracks. That means the API returned the structural catalog but no visible published lesson content for its current database. It is **not** caused by the logout transaction conflict.

## Replace old source code with this version

1. Unzip the new full-source project into a new folder, or apply the changed files to your existing project.
2. Copy `backend/.env` from your **working** local project to this new `backend/.env`. Preserve the actual Atlas password and session secret privately. Do not overwrite them with `.env.example`.
3. Open Git Bash / terminal in the project's root.

```bash
npm ci --include=dev
npm run db:generate
npm run db:status
npm run db:repair-courses
npm run dev
```

**Wait for the final line** `SUCCESS: All five tracks and 128 lessons are publicly readable.` The seed may take several minutes. Then visit `http://localhost:5173/courses` and hard-refresh (`Ctrl+Shift+R`).

Expected counts:

| Track | Published lessons |
|---|---:|
| General English | 56 |
| IELTS Preparation | 16 |
| CEFR/Multilevel | 24 |
| Spoken English | 28 |
| English Conversation | 4 |
| **Total** | **128** |

If `db:status` says 0, inspect the printed database **name and host** and verify they match `DATABASE_URL` in `backend/.env` and your running API. For Atlas, the URL path after `.mongodb.net/` must specify the database, e.g. `/uzbek`.

`db:repair-courses` is designed to be repeatable. It does not wipe learners or reset passwords. Avoid running multiple copies of the seed at once. If you manually changed lesson statuses or deleted draft content intentionally, review those modifications before rerunning the bulk publishing script.

The message `Transaction failed due to a write conflict or a deadlock` from `tx.session.deleteMany()` is a separate logout problem. The project now retries *transient* MongoDB conflicts for authentication transactions. Other database errors are still shown.

The ZIP intentionally excludes `.env`, database credentials, student records, and the MongoDB collections themselves. Lesson content is inserted **only after you run the seed command against your own Atlas database**.

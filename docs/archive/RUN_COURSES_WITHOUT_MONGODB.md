> **Updated October 2026:** The newest edition has **256 lessons** with microphone-based speech-to-text match scoring. See `EXPANDED_COURSES_AND_SPEAKING.md`. Older counts below describe the previous foundation release.

# Noldan Ravon: See all five courses immediately

This release fixes the **0 published lessons** symptom without requiring a working Atlas connection. The `backend/prisma/course-content.json` data file is published through the Express read-only API directly. All five tracks have 128 foundation lessons. Quiz practice remains browser-local.

## On Windows / Git Bash

1. Extract this full ZIP into a NEW folder; do not merge with the previous broken copy.
2. Copy your previous `backend/.env` (keep passwords private). Add this line to it:

   `COURSE_CATALOG_SOURCE=bundled`

3. From the root of the extracted folder, run:

   ```bash
   npm ci --include=dev
   npm run db:generate
   npm run dev
   ```

4. Open **http://localhost:5173/courses** and select General English → A1 → Greetings.
5. Verify the public API in your browser:

   `http://localhost:3001/api/v1/health/catalog`

   This should return `source: bundled`, `tracks: 5`, `courseVariants: 14`, `lessonsAvailable: 128`.

   You can also open `http://localhost:3001/api/v1/tracks?locale=en`.

   The five records should show statuses `PUBLISHED` and the sum of their publishedLessons should be 128.

**Do not run `db:repair-courses` for the bundled mode.** The database seed requires a functioning transaction-capable MongoDB replica set, which your supplied log did not have. Your database is not silently altered by this fix.

## Production / Hostinger

Set `COURSE_CATALOG_SOURCE=bundled` in Hostinger Node.js environment variables, deploy this project's full source, then start the standard Node.js entry script. The bundled dataset must remain inside `backend/prisma/course-content.json` in the deployed source tree. The normal frontend build and Express API can serve courses while Atlas is down.

## Limitations

- Course content is the authored **128-lesson foundation edition**, not a complete exam-preparation library.
- This mode is read-only and displays locally bundled content, not DB-published or admin-edited content.
- Registration, log-in, and server-side data depend on MongoDB and can fail independently until Atlas access and transaction support are fixed.
- If you still see 0 lessons, check that you extracted the new ZIP, restarted `npm run dev`, and aren't looking at an older server on port 3001.

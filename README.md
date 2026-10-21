> **CEFR B1–C1 content update:** 33 existing lessons expanded to 22–27 bilingual vocabulary entries, 12 full example sentences and 8 new repeat-aloud sentences each. See [CEFR_DEEP_CONTENT_UPDATE.md](CEFR_DEEP_CONTENT_UPDATE.md); run `npm run cefr:verify`.

> **Corrected October 2026:** This edition has 170 individually distinct modules/lessons (not 340 duplicated lessons). See `UNIQUE_CONTENT_AUDIT.md` and `COURSE_QA_REPORT.md`. Vocabulary headwords and full exercises must not repeat across lessons; common grammar words naturally recur.

# Noldan Ravon | Uzbekistan English Learning Platform

**2026-10-20 curriculum and sign-out update.** This is the current setup guide. Earlier project plans and release notes under `docs/` and `docs/archive/` describe older editions and may contain obsolete course counts.

## What this release contains

- 5 public English-language learning tracks, 14 course variants, 170 modules and **170 browseable bilingual lessons** (English teaching text + Uzbek Latin assistance).
- 71 General English A1–C1 lessons; 22 IELTS Academic/General Training; 33 Uzbekistan Multilevel B1–C1; 37 Spoken English; 7 situation-based Conversation lessons.
- Every lesson has distinct learning objectives, newly introduced English–Uzbek vocabulary (the count varies by lesson), a topic-specific reading, browser text-to-speech, spoken sentence practice, four auto-marked self-check questions and a writing activity. **No English vocabulary headword is introduced twice.**
- 42 additional Uzbekistan-context modules, 61 individually authored or replaced exam/spoken and advanced-reading cases, and corrected lesson-specific assessments. There are no cloned follow-up lessons.
- Per-course study roadmaps with English and Uzbek learning goals and links to the Council of Europe, IELTS and Uzbekistan assessment agency.
- Microphone recognition and **word-match score** for target sentences. Speech-to-text is an approximation and **does not measure pronunciation quality, fluency or official exam band**.
- Written response drafts and quiz/speaking results saved locally on the device, not synced between devices. Do not enter sensitive information into practice fields on a shared computer.
- Secure sign-out now navigates to `/` after revocation; when the database fails, a same-origin CSRF-protected endpoint clears the HTTP-only browser cookie, returns `LOGOUT_PARTIAL`, and the UI warns that server revocation was not confirmed.
- A public course catalog independent of MongoDB with `COURSE_CATALOG_SOURCE=bundled`.

## Start on Windows (PowerShell or Git Bash)

1. Unzip to a new folder. Copy your existing, working `backend/.env` into the new `backend/` folder. Never include your actual MongoDB password or session secret in a publicly shared ZIP.
2. Verify `COURSE_CATALOG_SOURCE=bundled` is in `backend/.env` (default if omitted). Keep the database URL and secret for login/profile; lessons do not require them to be reachable.
3. Open a terminal in the root folder and run:

```bash
npm ci --include=dev
npm run db:generate
npm run courses:verify
npm run dev
```

4. Open `http://localhost:3001/api/v1/health/catalog`. It should show `{ "source": "bundled", "tracks": 5, "courseVariants": 14, "lessonsAvailable": 170 }` inside `data`.
5. Open `http://localhost:5173/courses`. Select a track, a course and a lesson. To check sign-out, sign in, use **Chiqish / Sign out** in the workspace and confirm that the homepage opens.

If you use an Atlas database and wish to publish all lessons into it as well, ensure the connection supports Prisma transactions and a real MongoDB replica set, then run `npm run db:sync && npm run db:seed && npm run db:status`. **This database write is optional for bundled mode.** Do not run it on an incompatible deployment. Back up your database before changing seed/catalog structures.

## Verify the project

```bash
npm run courses:verify
python scripts/validate-course-content.py
npm run typecheck
npm test
npm run build:app
```

`npm run courses:verify` and the Python validator perform structural checks only. `npm test` and `npm run typecheck` require installed dependencies. The full browser, microphone, database and automated test suites still need to run in your local setup. The ZIP contains tests for the new sign-out and curriculum behavior but has **not** been verified with a live Atlas account from this environment.

## Honest scope and remaining work

These are **guided self-study courses aligned to selected CEFR goals and exam task categories**, not official accredited courses or verified full-coverage exams. A genuinely complete certified A1–C1 + IELTS + Uzbekistan Multilevel platform needs: expert review and standard-setting for every level, richer unique grammar syllabuses and authentic reading texts, independently recorded listening assets, full 40-question IELTS listening/reading tests with timing and item balance, current agency-format full mock tests, examiner-rated IELTS speaking/writing rubrics, statistically validated results, and student progress stored securely in the database. None of those is silently labelled "completed" here.

Browser recognition may be unavailable in some browsers, and its transcription may be processed by the browser's speech service. Microphone use requires HTTPS or localhost and permission.

**Official reference sites:** [Council of Europe CEFR descriptors](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors), [IELTS test format](https://takeielts.britishcouncil.org/what-is-ielts/how-it-works/test-format), [IELTS assessment](https://takeielts.britishcouncil.org/teach-ielts/test-information/assessment), [Uzbekistan Multilevel formats](https://uzbmb.uz/page/test_sinovlari_formati), [Uzbekistan speaking/writing criteria](https://gov.uz/oz/uzbmb/sections/view/49531).

See `UNIQUE_CONTENT_AUDIT.md` for the duplicate-removal audit and remaining editorial work. An older historical review is in `docs/archive/UZBEKISTAN_CURRICULUM_AUDIT.md`.

### IELTS expanded bilingual lesson content

The 22 IELTS Academic and General Training lessons now include 24–29 expressions and 12 distinct bilingual example sentences each, plus a different grammar focus, worked challenge and 8 check questions. Run `npm run ielts:verify` and read [`IELTS_DEEP_CONTENT_UPDATE.md`](./IELTS_DEEP_CONTENT_UPDATE.md) for data checks and known limitations. For the newest lessons, set `COURSE_CATALOG_SOURCE=bundled`.

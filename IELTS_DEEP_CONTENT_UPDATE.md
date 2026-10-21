# IELTS Deep Content Edition (English ↔ Uzbek)

## What was fixed

The prior IELTS lesson reader often showed only two to seven isolated vocabulary entries, and all 22 IELTS lessons had no bilingual example sentences. The course page also hid the reading passage and examples behind a **Reveal transcript** button on non-listening lessons. Those are content and presentation problems, not MongoDB problems.

This update **enriches the existing 22 IELTS lessons**, without duplicating modules, changing lesson IDs, or altering the 170-lesson curriculum structure.

| Content measure | After this update |
|---|---:|
| IELTS Academic + General Training lessons | 22 (11 each) |
| New, independently authored vocabulary expressions | 484 |
| Total IELTS vocabulary entries | 570 (24–29 per lesson) |
| New distinct English ↔ Uzbek example sentences | 264 (12 per lesson) |
| IELTS practice questions | 176 (8 per lesson) |
| New grammar notes + challenge + worked response + pitfall | 22 sets |
| Total distinct lessons across all five courses | 170 |

Every IELTS unit now includes a focused explanation, 24–29 topic expressions with Uzbek translations and text-to-speech, a bilingual grammar/usage note, 12 new bilingual sentences, its original authentic-looking *practice* case (not a real IELTS exam item), original speaking drills, an independent practice challenge, a worked example, a common mistake, eight quizzes, and a written exercise. The writing task and model have been made specific to the unit rather than reusing the same generic instructions.

A full A1–C1 language education is broader than IELTS test preparation. Use **General English A1–C1** and the **Essentials** library alongside IELTS. They are linked from the IELTS lesson page.

## Accurate test-format distinctions

The IELTS **Listening** and **Speaking** tests are the same in IELTS Academic and IELTS General Training. Reading and Writing differ. The full official test has approximately 30 minutes Listening, 60 minutes Reading, 60 minutes Writing and an 11–14 minute Speaking test. Writing Task 1 is at least 150 words (Academic: visual description; GT: letter), and Task 2 is at least 250 words in both versions. This app's exercises are shorter teaching exercises and are NOT full test simulations.

Official reference sources (check them for updates):
- https://ielts.org/take-a-test/test-types/ielts-academic-test/
- https://ielts.org/take-a-test/test-types/ielts-general-training-test/
- https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test
- https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test
- https://ielts.org/take-a-test/preparation-resources/writing-test-resources

## How to run (Windows / Git Bash)

1. Extract the **full ZIP** into a new folder, or apply the patch over the prior *Seasons Calendar Crash Fixed* edition.
2. Copy the existing `backend/.env` from your prior working project; never share credentials publicly.
3. Ensure `COURSE_CATALOG_SOURCE=bundled` is present so courses can load without a MongoDB connection.
4. Run:

```bash
npm ci --include=dev
npm run db:generate
npm run ielts:verify
npm run courses:verify
npm run dev
```

5. Open http://localhost:5173/courses, select **IELTS Preparation**, open any **Academic** or **General Training** lesson, and inspect the new vocabulary, grammar, examples and quiz sections.

No database migration is required for *bundled* course catalog mode. The existing database seed is intentionally non-destructive and **will not overwrite teacher-edited blocks in database catalog mode**. Database-backed course content can therefore remain older until deliberately migrated. For the updated IELTS lessons, keep `COURSE_CATALOG_SOURCE=bundled`.

## Validation performed

- `node scripts/check-ielts-depth.mjs`: PASS for all 22 IELTS lessons.
- `node scripts/check-bundled-data.mjs`: PASS for all 170 courses, 1,460 distinct introduced vocabulary headwords, 768 unique quiz prompts; no repeated reading passage at the existing similarity threshold.
- `python scripts/validate-course-content.py`: PASS.
- Changed TSX syntax parsed with TypeScript's `transpileModule`: PASS.
- Full production build and browser/microphone verification: **not completed in this environment** because `npm ci --offline` cannot find the `argon2` package archive. Test `npm run build:app` or `npm run build` on your laptop before Hostinger deployment.

## What is not yet exhaustive

This is an expanded self-study and exam-skills curriculum, not a certified or complete official IELTS course. The following still require additional professional development and testing: full-length timed Listening and Reading papers with appropriately calibrated questions, high-quality human-recorded audio with accents, task-specific Writing and Speaking assessment against expert-reviewed band descriptors, and a professionally reviewed comprehensive A1–C1 syllabus. Browser speech-to-text word similarity must never be presented as an IELTS band score.

## Authored source files

- `backend/prisma/course-content.json` is the actual bundled lesson data used by the app.
- `scripts/ielts-depth-vocabulary.txt` contains the 22 independently written topic vocabulary sets.
- `scripts/ielts-depth-sentences.txt` contains the 264 original bilingual examples.
- `scripts/ielts-depth-guides.tsv` contains each lesson's different grammar, challenge and worked response.
- `scripts/expand-ielts-depth.py` is an idempotent rebuild/check script.
- `scripts/check-ielts-depth.mjs` checks the current IELTS content without installing packages.

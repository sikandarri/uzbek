# Noldan Ravon: expanded CEFR / Uzbekistan Multilevel B1–C1

This update expands the *existing* 33 CEFR lessons in place. It does not clone lessons, create course variants, rename URLs, or change MongoDB accounts.

## Changes

- 20 additional bilingual, topic-specific terms for each of the 33 lessons: **660** newly introduced headwords and expressions.
- Each CEFR lesson now displays **22–27** English/Uzbek vocabulary entries, **12 distinct English sentences with Uzbek translations**, and **8 additional guided microphone repeat sentences** (in addition to previously authored drills and 12 free-response speaking missions).
- Added bilingual level-specific guidance for grammar, an independent practice task, a model sentence, and common pitfalls.
- Each lesson now has **8 quick knowledge-check questions** instead of 4.
- Each of the **33 existing end-of-lesson exams still has 22 scored objective questions**, two speaking self-review tasks and one writing task. The question mix was improved by replacing 155 low-value cloze items with new course-vocabulary questions, leaving the total unchanged.
- All 170 existing lesson routes and course IDs remain unchanged. The other 137 lessons are unchanged.

The CEFR vocabulary counts include existing items. They are B1: 260, B2: 254 and C1: 255, for 769 vocabulary entries across the 33 units. The 396 new model sentences are original, different across lessons and bilingual.

## Run locally

Copy your working `backend/.env` from your previous project (do not put secrets in a ZIP), and ensure the environment contains:

```dotenv
COURSE_CATALOG_SOURCE=bundled
```

In the **root project folder**, run:

```bash
npm ci --include=dev
npm run db:generate
npm run cefr:verify
npm run courses:verify
npm run speaking:verify
npm run ielts:verify
npm run dev
```

Then go to `http://localhost:5173/courses` → **CEFR / Multilevel** → B1, B2 or C1 → open **Diagnostic**, **Speaking**, or another lesson. It should show 22–27 expressions in the Vocabulary block and 12 bilingual sentences in the Reading block. The microphone section contains the new repeat sentences, while the end-of-lesson exam remains.

No database seeding is needed when `COURSE_CATALOG_SOURCE=bundled`. The MongoDB-backed catalog, if selected instead, still uses database records and needs a separate content import. Browser-based speech transcription requires a supported browser and microphone permission.

## Audit status

Passed (offline):
- CEFR vocabulary count, sentence count, bilingual coverage and question count for all 33 units
- Exact uniqueness of vocabulary, sentences, quiz prompts and original passages in the 170-lesson library
- All previous IELTS depth, speaking/exams and Essentials content tests
- Preservation of lesson identifiers and unchanged non-CEFR teaching content

**Not verified in this build environment:** Full production React/Express build and live microphone use. Offline `npm ci` failed because `argon2@0.41.1` was not cached. Run `npm run build` on your Windows computer before production deployment.

## Important educational limitations

This is independent bilingual study material for B1–C1 and practice of exam-type skills, not an official Uzbekistan national Multilevel examination or externally accredited CEFR certification. Real listening recordings, verified official-format mock papers, professional pronunciation marking, and human assessment of open-ended writing and speaking are still required for a fully standards-validated preparation product. Automatic speech-to-text word scores do not measure CEFR fluency.

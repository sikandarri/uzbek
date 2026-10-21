# Course QA report, distinct-content edition

The previous release's "340 lessons" was misleading: 170 generated follow-ups recycled their parents' words, passages and questions. This update intentionally removes them.

**Structural source checks:**

- `npm run courses:verify`: 5 tracks / 14 course variants / 170 modules / 170 lessons
- `python scripts/validate-course-content.py`: English–Uzbek content present, distinct module IDs, all five teaching block types, quiz answer keys valid, cross-lesson duplicate rejection
- Unique across lessons: 976 introduced English vocabulary headwords, 388 speaking targets, 170 full readings, 170 writing prompts, 680 quiz prompts
- Retained: browser speech-recognition practice and logout fallback from the previous source release
- Additional near-duplicate check: 0 pairs of readings above token-set Jaccard 0.62, after replacing 61 exam, spoken and General English cases

**Not equivalent to:** a fully expert-authored or CEFR-certified A1–C1 program, official IELTS-format mock tests, official Uzbekistan Multilevel exams, or native-quality listening audio. A recognized-word similarity score is not a pronunciation test.

**Local tests still necessary:** full npm/Prisma/TypeScript build, browser navigation (English and Uzbek), microphone permissions/recognition, Atlas auth and server-side saves. Bundled public lesson reading does not require Atlas.

See `UNIQUE_CONTENT_AUDIT.md` for the coverage caveat and exact uniqueness policy.

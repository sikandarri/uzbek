# Noldan Ravon: duplication correction and content policy

**October 2026, revised source edition**: `2026-10-unique-lessons-reviewed-v1`

## Why the previous release was unacceptable

- It labelled 340 pieces of content as lessons, but included generated `lesson-2` and `clinic-2` follow-ups with copied vocabulary, copied example sentences and repeated assessment instructions.
- In the prior file, 6,800 vocabulary *occurrences* represented only **824 distinct English headwords/phrases**. The same text appeared across unrelated tracks, including copied entries in practical skill clinics.
- The prior content also contained repeated complete readings, cloned speaking targets, and reused quiz questions. A higher lesson count was not evidence of more instruction.

## What the corrected edition does

- Removes the 170 cloned follow-ups, keeps **one distinct bilingual lesson per one of the 170 existing modules** across **5 tracks and 14 variants**.
- Preserves the strongest original authored topic readings and 42 specific Uzbekistan-oriented scenarios. Repeated full reading passages are replaced with distinguishable tasks. A deeper semantic-similarity audit also identified and replaced generic exam/spoken passages: 61 case-specific bilingual passages were authored or substituted. On the current 170 readings there are no pairs with word-set Jaccard similarity above 0.62.
- Adds **42 sets of case-specific English–Uzbek terms** to clinic lessons and allocates new vocabulary globally, so no introduced English vocabulary headword or phrase occurs in two lessons. Some lessons have fewer new words because the edition refuses to pad them with old or irrelevant words.
- Selects different lesson-specific speaking targets; keeps the microphone-based word-match practice and explicitly explains that it is not a phonetic or official examination score.
- Gives every lesson its own title, explanation, model, full reading, spoken target(s), four review questions, and writing prompt.
- Adds `npm run courses:verify` and `python scripts/validate-course-content.py` checks that reject repeated whole passages, vocabulary headwords, spoken targets, quiz-question prompts, writing assignments and titles **across separate lessons**.
- Retires the old double-the-lessons generators to prevent repeating this mistake.

## Exact counts (run `npm run courses:verify` for current numbers)

| Track | Distinct lessons |
|---|---:|
| General English A1–C1 | 71 |
| IELTS Academic and General Training | 22 |
| Uzbekistan Multilevel B1–C1 | 33 |
| Spoken English Beginner–Advanced | 37 |
| English Conversation | 7 |
| **Total** | **170** |

Verification of this edition returns **976 distinct new vocabulary headwords/phrases, 388 distinct English microphone targets and 680 answer-keyed practice MCQs** (the speech target count can change if a future editorial correction is made).

### Important scope and limitations

- **No repeat of an English word anywhere in a complete language course** would prevent sensible sentences (words like "I", "to", "the" must recur). This edition enforces **no repeated vocabulary headword/phrase across lessons** and **no identical complete exercise text across lessons**. Repeating a phrase within the **same** lesson for reading, listening and speaking practice is intentional.
- The total lesson count was deliberately reduced rather than falsely maintaining 340 cloned lessons.
- This is a **repaired foundation catalog**, **not** a certified fully comprehensive CEFR A1–C1, IELTS or official Uzbekistan Multilevel qualification. Several lessons still have brief vocabulary sections; exam recordings, calibrated mocks, controlled grammar sequencing, expert assessment and verified native-speaker recordings need separate editorial work.
- Tests are structural and distinctness tests, not pedagogical endorsement, official equivalence or live microphone grading.
- Public browsing defaults to `COURSE_CATALOG_SOURCE=bundled` and needs no MongoDB connection. **Existing older MongoDB records are not automatically deleted or overwritten**, so choosing database-backed catalog mode can still show old duplicates. Use bundled mode until legacy database records are reviewed and migrated with explicit approval.
- Never publish environment secrets. `backend/.env` should be copied from your existing installation locally and never added to the ZIP.

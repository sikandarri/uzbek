# Noldan Ravon: speaking expansion and end-of-lesson examinations

## What is new

- Every one of the existing **170 distinct lessons** contains an extended, source-based English repeat-and-recognize bank. The added repeat lines are not recycled across lessons. English audio is created by the learner's browser, and the score is an approximate transcription match rather than an evaluation of accent or fluency.
- Each lesson adds **12 distinct guided free-speaking missions**, with both English and Uzbek instructions, a suggested minimum speaking time, role-play and opinion tasks. Students can use the browser microphone to transcribe an open answer and mark a mission as practised. Open responses are **not automatically scored**.
- Each lesson adds an **end-of-lesson exam** with **22 auto-scored four-choice items** and bilingual explanations, covering vocabulary (as available in that lesson), reading evidence, browser-generated listening discrimination, and English expressions in context. All objective questions derive from the actual lesson source. Each exam also includes **two self-reviewed speaking tasks** and **one written assignment** with bilingual four-point review rubrics.
- The exam locks answers when submitted, reports a score and per-section breakdown, stores attempt history in browser storage, and supports retries. The existing four/eight-question study checkpoint is preserved. The student's Results screen now shows both checkpoint and full exam results.
- All 5 tracks, 14 variants, 170 lesson IDs, prior Essentials materials, premium design, speech recognition, and bundled public-course mode are preserved.

## Important academic limitations

These are **independently authored formative assessments**, not certified or official-equivalent IELTS / Uzbekistan Multilevel examinations. The listening exercises use text-to-speech rather than professional recordings, and reading passages are shorter than official examinations. The auto-score is for *objective multiple-choice questions only*. Actual speaking fluency, vocabulary range, pronunciation, coherence, and writing quality require teacher or qualified human review. Repeated question *formats* are intentional; the actual target vocabulary, text-based evidence, and exam questions are taken from each different lesson. These materials add substantial guided practice, but are not a substitute for full exam-length mock tests with calibrated marking.

## Install locally

1. Extract the full ZIP into a new folder, then copy your current `backend/.env` securely into its `backend` directory.
2. Keep `COURSE_CATALOG_SOURCE=bundled` to load the lessons without a live MongoDB connection.
3. From the project root, run:

   ```bash
   npm ci --include=dev
   npm run db:generate
   npm run courses:verify
   npm run speaking:verify
   npm run ielts:verify
   npm run dev
   ```
4. Open `http://localhost:5173/courses`. Pick any course → lesson, then scroll to the speaking lab, guided speaking missions and end-of-lesson assessment.
5. Complete and submit an exam. Open `/app/results` after signing in to view locally saved exam attempts alongside checkpoint scores. Exams themselves work with public bundled lessons and do not require MongoDB; authenticated account features still depend on a properly configured database.

## Verification performed

- All 170 distinct source lessons inspected: 3,740 auto-scored exam questions, 340 oral performance tasks, 170 writing performance tasks, 2,040 unique guided speaking missions and 1,099 non-repeated source-based repeat lines.
- Offline validator checked 4 sections, question option uniqueness, answer keys, feedback, English/Uzbek instructions, open-response rubrics, and cross-lesson prompt uniqueness.
- Bundled API catalog runtime check loaded all 170 lessons through 14 course outlines in two supported locales, with the new assessment data available in each response.
- Original course and IELTS depth validators passed. React / TypeScript file syntax checked by the TypeScript compiler's transpilation parser.

**Not verified here:** full npm/React production build, live browser microphone behavior and a Hostinger deployment. The npm offline cache lacked `argon2@0.41.1`; run `npm ci` and `npm run build:app` on your development computer before publishing.

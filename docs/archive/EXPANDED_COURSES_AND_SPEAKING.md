# Expanded lessons and speech recognition: setup and verification

## What changed

- All 128 modules now have two real, separately navigable lessons: an original bilingual foundation lesson and a new guided real-life speaking/challenge lesson. **256 published bundled lessons total**.
- Each lesson includes 20 vocabulary expressions (repeated for active review in the guided lesson), English and Uzbek instructional text, reading/situations, writing practice, four MCQs, and 4–7 speaking targets.
- Speaking practice is on each lesson's **Speak aloud** section. There is a target selector, speech synthesis to listen to the model, microphone start/stop, transcript, 0–100 score, missing/changed-word feedback, retry, and an average of best scores. Best scores are device-local, not stored in MongoDB.
- Public course catalog remains available with `COURSE_CATALOG_SOURCE=bundled` even if Atlas cannot connect.

## Windows / Git Bash

1. Extract the ZIP to a fresh folder.
2. Copy `backend/.env` from the previous working installation. Retain your real connection string and SESSION_SECRET, and set `COURSE_CATALOG_SOURCE=bundled`. Never share this .env file.
3. Run:

```sh
npm ci --include=dev
npm run db:generate
npm run courses:verify
npm run dev
```

4. Open `http://localhost:3001/api/v1/health/catalog`; expect `lessonsAvailable: 256` and `source: bundled`.
5. Visit `http://localhost:5173/courses`, then any course/module and select either **Lesson 1** or **Lesson 2: speaking lab & real-life challenge**.
6. In speaking lab, choose a sentence, click Listen, then Start speaking and allow microphone permissions. Say the sentence, wait for transcription and check the word-match score.

## Scoring explanation

The 0–100 mark is a **word-error-rate-based match** against the displayed English sentence. Recognition outputs a transcript; the app ignores case and punctuation, expands common contractions, then compares expected and recognized words. Score = max(0, round(100 × (1 − edit distance / number of target words))). This is a useful repeat-after-me practice metric, **not pronunciation, accent, grammar, content understanding, IELTS band, or CEFR level**. A student can score poorly if the recognizer misunderstands an accent or has poor audio quality even when they spoke correctly. Student free-form answers are not automatically graded. The lesson still includes independent open-ended speaking and writing prompts.

SpeechRecognition / webkitSpeechRecognition is only available in some browsers and may require internet. Chrome or Edge usually work; install a supported browser if the button is disabled. The page needs microphone permission and a secure origin (`https://` or localhost). If the browser reports `not-allowed`, enable microphone in site settings. If it reports `network`, check browser service/internet access. Audio is not stored or uploaded by the Noldan Ravon server, but the browser recognizer may send it to its vendor.

The best score for each sentence is stored in localStorage keyed by lesson ID and can be lost if browser data is cleared or private browsing is used. Score history is not synchronized between devices.

## Optional Atlas publishing

Run `npm run db:seed` only when your MongoDB URL points to a supported replica set and connection is healthy. The seed now knows about 256 lessons and preserves existing lesson translations and blocks; by default the bundled public catalog is authoritative. The Atlas issue `Transactions are not supported by this deployment` cannot be solved by browser speech recognition.

## Hostinger

This is the entire Node.js source repository. Deploy source (exclude `node_modules/`, `dist/`, `.env`) rather than a prebuilt static archive because Express powers the app. Configure `NODE_ENV=production`, `APP_ORIGIN=https://YOUR_DOMAIN`, `COURSE_CATALOG_SOURCE=bundled`, a real MongoDB URL with database name, and a generated `SESSION_SECRET`. Set `REGISTRATION_ENABLED=false` while Atlas is down. Node 22, install/build from the repository root, entry file `scripts/start.mjs`. Public lessons work without MongoDB, but logins still require database access. The microphone requires a valid HTTPS certificate on the final domain.

## Validation limitations

Content integrity, locale lookup, modules with two lessons, TypeScript syntax transpilation, and offline word-match scoring were checked. Full React bundling and browser microphone recognition cannot be exercised inside the current build environment because npm dependencies and live browser/audio access are unavailable. Verify microphone interaction in Chrome on the local site before pushing to production.

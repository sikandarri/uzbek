# Noldan Ravon · Premium UI + Listening accuracy update

This is a **full-source update** to the 170-distinct-lesson edition, not a database migration or a new deployment. It preserves the original 170 bundled course lessons, sign-out fix, login routes, and progress storage.

## What changed

### Speaking practice
- Normalizes *two hundred* vs `200`, `twenty-five` vs `25`, and Uzbek currency spelling variants (`so'm`, `som`, `so am`, `soum`, `song`) **only when the reference is actually talking about so'm**.
- A different amount (e.g. `200 thousand` vs `200`) remains a scoring error.
- Requests up to five browser-provided transcription alternatives. Uses the closest transcript match. Some browsers provide only one.
- Continuously listens until **Stop and score**, to reduce premature cutoff after a short pause. Browser speech services may still stop unexpectedly.
- Scores once, when the recognition session ends; no duplicate grade saves while partial results stream.
- Lets learners inspect and correct the browser's transcript. Manually corrected text is shown with its own *text match*, and is **not** saved as a microphone attempt or pronunciation score.
- UK/US accent toggle remains. Speech uses the browser's recognition engine; it cannot guarantee accurate recognition, and **does not** assess phoneme pronunciation, grammar, IELTS or CEFR bands. Browser provider may process audio.

### Five new public essentials sections
- `/essentials/alphabet`: A–Z (26 letters), rough Uzbek-friendly name guides and sample words with sound buttons.
- `/essentials/numbers`: 0–100 inclusive plus eight higher numbers, Uzbek translations, audio and a quick check.
- `/essentials/useful-words`: 80 distinct high-frequency question words, verbs, descriptions, adverbs, directions and daily actions.
- `/essentials/vocabulary`: 144 distinct English headwords across 12 practical categories, each with Uzbek translation, search and audio.
- `/essentials/phrases`: 48 useful contextual phrases across six categories, with Uzbek translations, search and audio.
- Each section is available *without login or a MongoDB connection* and includes guided speaking prompts.

### Site-wide visual refresh
- Warm ivory background, deep emerald/forest surfaces and restrained gold accents.
- New hero with illustrative (not fake user-performance) lesson preview, editorial headings, glass cards and responsive layout.
- Refined header, mobile navigation, course cards, student area, lesson headers, login cards and footer.
- Light card hover, accessible focus states and reduced-motion support.
- Inspired by 21st.dev landing and dashboard design patterns. Original implementation; not a copied 21st.dev component library.
- CSP updated to allow Google Fonts CSS and font files, while scripts remain self-only.

## Setup and verify (Windows Git Bash, from project root)

1. Copy your existing `backend/.env` to `backend/.env` in **this** extracted folder. Keep credentials private.
2. Check it has `COURSE_CATALOG_SOURCE=bundled`. You may keep your MongoDB URL; reading lessons does not depend on Atlas.
3. Run:

```bash
npm ci --include=dev
npm run db:generate
npm run courses:verify
npm run premium:verify
npm run dev
```

Then open:
- Home: `http://localhost:5173/`
- Essentials: `http://localhost:5173/essentials`
- Courses: `http://localhost:5173/courses`
- API catalog health: `http://localhost:3001/api/v1/health/catalog`

**Microphone:** use current Chrome or Edge on `localhost` or HTTPS; grant microphone permission. Speak the complete reference then click **Stop and score**. Use Listen to hear the model, and Review transcription if speech-to-text is wrong.

## Hostinger
Deploy the **source ZIP** as an existing Node.js app update. Set `APP_ORIGIN` to the production HTTPS origin, `NODE_ENV=production`, `COURSE_CATALOG_SOURCE=bundled`, and the existing secrets/DB settings via Hostinger environment variables, not in a ZIP. Keep build/start settings `npm run build` and `npm start` with `scripts/start.mjs` as entry if required. Take a backup before replacing an existing website.

## Validation and limitations
- The bundled-course uniqueness verifier checks all 170 current course lessons.
- The new essentials source check covers 26 letters, 109 number cards, 80 useful words, 144 everyday words and 48 phrases.
- Speech normalization and transcript-choice logic were tested with representative cases; tests do not establish real microphone accuracy.
- TypeScript/TSX source transpilation completed without syntax errors. The complete `tsc`, Vite/React build and real microphone test **could not be completed here**, because npm package installation was unsuccessful. Test `npm run build` locally before production deployment.
- No Hostinger account was modified and no MongoDB data was overwritten.

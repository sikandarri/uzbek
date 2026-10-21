# Noldan Ravon: Everyday English expansion (Uzbek learners)

This release extends the latest **API Startup and Courses Fix** edition. It keeps the original website, lessons, auth code, speech recognition, sign-out behavior, and Hostinger startup files intact.

## What is new

- `/essentials/calendar`: 7 days of the week, 12 months, 4 seasons, day parts, date/planning expressions, time expressions and 1st–31st ordinals. Includes English audio, Uzbek translations, a relevant quick check, model sentences and microphone practice.
- `/essentials/topics`: 41 **new** real-life reference collections, 693 English words or expressions paired with Uzbek translations, plus 82 distinct topic sentences.
- `/essentials/topics/:topicId`: individual topic page with search, hide/reveal translations, hear-a-word controls, "Mark learned" progress in browser localStorage, word-meaning checks and microphone sentence exercises.
- `/essentials/phrases`: expanded from 48 to 120 non-repeating everyday sentences across phone calls, restaurants, clinics, home, markets, bank services, interviews, and more.
- `/essentials`: clear beginner study path and links to the calendar and daily-topic collections.
- Homepage Essentials links to both new sections.

Reference coverage includes: fruits, vegetables, colors and shades, farm/wild/water animals, birds, insects, pets, body parts, clothing, routines, cooking, cleaning, kitchen tools, home appliances, school objects, technology, sports, hobbies, music, banking, meetings, documents, hotels, transit, healthcare, nature, gardening, shape/size and measurement, social situations, weather, emergencies and Uzbekistan-specific daily life. The earlier 11 core vocabulary topics, 80 useful words, alphabet and numbers remain.

### Counts and duplication checks

| Collection | Count |
| --- | ---: |
| New topic collections | 41 |
| Newly authored topic vocabulary entries | 693 |
| Topic-based practice sentences | 82 |
| Calendar groups | 8 |
| Calendar word/expression entries | 109 |
| Core original dictionary headwords (calendar words moved out) | 132 |
| Useful words | 80 |
| **Unique headwords and expressions across Essentials** | **1,014** |
| Phrasebook sentences (old + new) | 120 |
| Existing course lessons | 170 (unchanged) |

Uniqueness means no **exactly repeated English headword** across the 41 new topics, the 11 remaining core vocabulary groups, the useful-word groups and calendar groups. It does **not** prevent normal grammatical words such as "the" from recurring in complete sentences, or duplicate concepts from appearing appropriately inside the formal courses. The phrasebook and contextual examples also have no repeated full English sentences within their respective collections.

This is a broad self-study reference, not an accredited official course, a certified pronunciation score or a replacement for professional teacher review. Natural speech recognition requires browser support, microphone permission and often an internet connection. Locally marked words are saved only in the current browser and are not synced to MongoDB.

## Windows local setup

1. Extract the ZIP into a **new folder** and copy your existing `backend/.env` into the new `backend/` directory. Do **not** include the `.env` file in a deployment ZIP or share passwords.
2. Confirm `COURSE_CATALOG_SOURCE=bundled` in the copied `.env` file.
3. From the new project root, run:

```bash
npm ci --include=dev
npm run db:generate
npm run essentials:verify
npm run courses:verify
npm run design:verify
npm run premium:verify
npm run dev
```

4. Open `http://localhost:5173/essentials` and try `/essentials/calendar` and `/essentials/topics`.
5. Confirm your Express API is listening. If the course catalog errors, run `npm run api:check` and see `STARTUP_FIX_README.md`.

Before Hostinger deployment run `npm run build`. This content is bundled in the React source, so no MongoDB seed is required for the Essentials pages. User accounts and authentication still require functional database credentials.

## Validation

`npm run essentials:verify` checks exact uniqueness, translations, counts, presence of days/months/ordinals and key UI routes. `npm run courses:verify` checks the separate 170-lesson catalog. `npm run premium:verify` parses TypeScript/TSX and runs representative speech-scoring checks. Full browser, speech recognition and production bundler integration must be tested with installed npm dependencies before publishing.

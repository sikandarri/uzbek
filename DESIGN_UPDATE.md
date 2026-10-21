# Noldan Ravon: Typography and Hero Layout Update

## Changes
- Global headings and display text use **Manrope**, with fallback fonts (`Segoe UI`, system sans-serif).
- Body text, lesson content, labels, forms, buttons, and navigation use **DM Sans**, with the same system fallbacks.
- Removed the oversized Fraunces serif throughout the application and aligned Tailwind's `font-sans` to the new body stack.
- Rebuilt the homepage hero into **two real grid columns**, collapsing to a single column on small screens.
- Removed the absolutely positioned listening badge and pathway badge, as well as floating-card animations that could overlap the lesson panel.
- New lesson preview is a **single contained ivory panel** with a practice phrase, Uzbek translation, decorative sound wave, and lesson stages.
- Tuned contrast, line spacing, title sizes, small-screen overflow handling, and reduced-motion behavior.
- The emerald / ivory / gold brand colors and existing course routes are unchanged.

## Where the updates are
- `frontend/src/pages/home.tsx`: redesigned hero JSX.
- `frontend/src/styles.css`: font system and hero-specific styling.
- `frontend/tailwind.config.js`: consistent Tailwind body font family.
- `scripts/verify-design.mjs` and `package.json`: run `npm run design:verify` for source-level checks.

## How to test locally (Windows / Git Bash)
1. Unzip into a **new folder** (do not delete the working copy).
2. Copy `backend/.env` from your prior working copy. Never upload your real .env file to chats.
3. Keep `COURSE_CATALOG_SOURCE=bundled` to serve lessons without MongoDB.
4. Run:

   ```bash
   npm ci --include=dev
   npm run design:verify
   npm run premium:verify
   npm run courses:verify
   npm run dev
   ```

5. Open `http://localhost:5173/` and inspect in Chrome at approximately **360 px, 768 px, 1024 px, and 1440 px** wide.
6. Verify the courses, `/essentials`, and login routes are still available. Use `npm run build` as the final deployment check.

### Hosting
This is source code for the existing Node.js deployment. Build and deploy the **full source** on Hostinger (not just `frontend/src` or the home page). Do not overwrite or reset your database for these styling-only changes. Your Hostinger environment settings should be preserved.

### Verification scope
- `design:verify`: passed locally.
- `premium:verify`: passed local source-level TS/TSX checks; also checked bundled essentials/scoring fixtures.
- `courses:verify`: passed data integrity checks for the 170-lesson catalog.
- Complete `npm run build`, live React rendering, external webfont loading, microphone behavior and the actual Hostinger deployment were **not tested in this environment** because npm's registry dependencies were unavailable offline.

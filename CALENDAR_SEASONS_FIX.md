# Calendar / Seasons blank-page fix

The Calendar & Time page previously used `current.words[4]!.uz` to build the quick-check answers. The Seasons group has only four items, so `current.words[4]` is undefined and React crashes when the user selects Seasons.

Changes:
- The quick check now derives its target and distractor answers from the selected group's actual words. Answer order varies by section.
- Only valid, distinct English/Uzbek pairs are used. Empty or inadequate groups display a readable notice rather than crashing.
- Switching sections resets the quiz response. Answers show the correct Uzbek translation if the student selects incorrectly.
- Added `npm run calendar:verify` to test all eight real groups and five short/empty/duplicate edge-case sets, plus a Vitest regression test.
- No lesson, vocabulary, speech recognition, database, or Hostinger configuration was changed.

## Apply

Use the full ZIP as the updated project, or copy the patch files over the corresponding relative paths in your current project folder.

In the project root run:

```bash
npm run calendar:verify
npm run essentials:verify
npm run courses:verify
npm run dev
```

Then open `http://localhost:5173/essentials/calendar`, click **Seasons**, and try the **Quick check** options. Switch among Days, Months, Seasons and other tabs. Use Ctrl+Shift+R if your browser still shows cached output.

## Verification

Calendar quiz runtime checks, all expanded Essentials integrity checks, all 170 distinct course lesson audits, and TypeScript/TSX syntax checks passed in the packaging environment. Full browser and frontend production build testing were not available because the npm cache lacks the `argon2` package. Verify with `npm run build` on your machine before redeployment.

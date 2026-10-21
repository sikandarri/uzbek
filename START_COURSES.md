# Run the corrected Noldan Ravon edition (no cloned lessons)

1. Unzip into a **new** folder to avoid mixing old `dist` or generated lesson files.
2. Copy the working `backend/.env` from your existing local project; **never share credentials**.
3. Make sure `backend/.env` contains `COURSE_CATALOG_SOURCE=bundled`. This serves the corrected source without waiting for MongoDB Atlas.
4. From the root, run:

```bash
npm ci --include=dev
npm run db:generate
npm run courses:verify
npm run dev
```

5. Expect the verifier to report **170 unique lessons**, then open http://localhost:5173/courses . Verify http://localhost:3001/api/v1/health/catalog returns `lessonsAvailable: 170` and `source: bundled`.
6. Do **not** rerun older content generators or copy an older `backend/prisma/course-content.json` over this version.

The reduction from 340 to 170 is deliberate: copied second lessons have been removed. The included 170 modules still cover General English A1–C1, IELTS, Multilevel, Spoken English and Conversation. See `UNIQUE_CONTENT_AUDIT.md` for unique-content counts and limits.

If you switch `COURSE_CATALOG_SOURCE=database`, previously seeded duplicate lessons may still exist in MongoDB. No old database records are deleted by this package.

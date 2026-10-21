# Noldan Ravon MongoDB conversion changelog

Starting source: `Noldan_Ravon_Hostinger_Argon2_Fix.zip` (17 October 2026).

- Switched Prisma datasource provider `mysql` to `mongodb` and kept 51 models.
- Mapped all model primary IDs to `_id`, preserving UUID **string** IDs and corresponding relations.
- Removed MySQL native field annotations and SQL migrations. Replaced unsupported Prisma Decimal scalar types with Float for estimate/score/duration fields (prices remain BigInt minor units).
- Switched SQL readiness query (`SELECT 1`) to MongoDB `ping` through Prisma `$runCommandRaw`.
- Replaced `mysql://` validation, example URL, config test URLs and integration suite fixture URLs with MongoDB URIs.
- Replaced Prisma Migrate commands with explicit `db:sync` (`prisma db push`), excluded from app startup/build.
- Added local MongoDB replica-set Docker Compose, Mongo test CI and Windows PowerShell instructions.
- Updated course error notices to MongoDB, deployment docs and warnings about missing foreign keys and data migration.
- Removed prior backend/frontend compiled outputs so that stale SQL code cannot accidentally be run as the MongoDB build.

Data migration is **not included**: pre-existing MySQL records are not transferred automatically. A new MongoDB database starts empty until initialized and seeded.

**Verification limits:** JSON/YAML parse checks, TypeScript transpile syntax checks (38 files), Node startup script syntax checks and static Prisma consistency checks completed. Full `npm ci`, Prisma CLI schema validation, generated client, complete tests, database integration tests and build were not possible because the npm package registry could not be resolved here. Do not treat this as an already tested live deployment.

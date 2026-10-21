# Architecture and decisions

## Runtime boundaries

The browser only calls same-origin `/api/v1`. React Router owns public, `/app` and `/admin` screens. TanStack Query holds remote state and clears account-specific cache on authentication transitions. Session secrets and provider credentials are never in frontend code, local storage or build-time `VITE_*` variables. Language is the only local-storage value.

Express owns validation, authentication, permissions, serialization and public catalog filtering. Prisma adapters implement persistence behind small interfaces, allowing HTTP tests without substituting the production database. MongoDB is authoritative for sessions, account roles and rate counters. Future providers belong behind backend service interfaces with independent schemas, quotas and timeouts.

A single Express process serves the React build in production. This avoids cross-origin cookie configuration and works without workers or persistent job queues. The local-only source handoff intentionally does not deploy a different server stack.

## Repository layers

- `shared/src/contracts.ts`: input validation and safe response DTOs.
- `backend/src/auth`: crypto primitives, persistence interface, Prisma implementation and HTTP middleware.
- `backend/src/routes/catalog.ts`: approved catalog query, excluding drafts, reviews, scheduled and archived content.
- `backend/src/app.ts`: dependency-injected application factory; startup/DB lifecycle live separately in `index.ts`.
- `frontend/src/lib`: request client, session query and locale formatting.
- `frontend/src/components`: layout, route guards and honest loading/error/empty/unavailable states.
- `frontend/src/pages`: public content, catalog, forms and authenticated shells.

## Data domains (51 models)

| Domain      | Principal models                                                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity    | User, Session, AuthToken, Role, Permission, UserRole, RolePermission, RateLimit                                                                             |
| Content     | Track, Course, Module, Lesson, LessonBlock and separate translation tables; MediaAsset, ContentRevision                                                     |
| Assessments | Question, QuestionVersion, ExamBlueprint, Assessment, AssessmentQuestion, AssessmentAttempt, AssessmentAnswer                                               |
| Learning    | Enrollment, LessonProgress, ActivityProgress, ActivityAttempt, VocabularyItem, VocabularyTranslation, LessonVocabulary, ReviewCard, ReviewEvent, StudyEvent |
| AI          | AiSession, AiMessage, AiUsage, AiQuota                                                                                                                      |
| Commerce    | Plan, PlanCourse, Order, Payment, PaymentEvent, Subscription, Entitlement                                                                                   |
| Operations  | Certificate, ReleaseSchedule, AuditLog, Setting                                                                                                             |

MongoDB stores generated UUID **strings** in `_id`, preserving the application's string-ID API. No SQL `CHAR`, `DATETIME`, `DECIMAL`, foreign keys or collations are used. JavaScript Date values are stored as UTC instants; the interface presents dates in `Asia/Tashkent`. Money remains `BigInt` minor units and must be serialized safely for JSON. Cost-estimate fields use `Float` because the Prisma MongoDB connector does not support `Decimal`; do not use these estimates as authoritative payments or accounting values.

Unique MongoDB indexes cover email, token hashes, localized records, positions, enrollments, per-user progress, question responses, transaction/event identifiers and certificate tokens. `prisma db push` creates/updates Prisma-defined indexes, **not SQL constraints**. MongoDB does not enforce foreign keys or MySQL `CHECK` constraints. Future write services must validate referenced documents, account ownership, nonnegative values and valid date ranges before any action, and must use transactions for cross-document mutations.

QuestionVersion records retain answer keys and explanations for each version. Attempts reference the question version and store assessment/block snapshots and grader versions, so later editing need not rewrite historical results. ContentRevision is intentionally a polymorphic immutable snapshot history: its entity ID is checked by the future content service, while author/reviewer are referenced document IDs. Clients never receive answer keys in catalog responses.

Content is archived/soft-deleted rather than cascaded through attempts. High-value financial and progress records must be guarded by explicit application-layer deletion policies; do not assume SQL foreign-key restrictions exist. Localization rows may cascade when their parent is actually removed. User erasure must be implemented as an audited anonymization/retention workflow, not a blanket cascade delete.

Prerequisite references exist for modules and lessons. Phase 2 must enforce same-course boundaries, acyclic graphs, publication ancestry, published revision selection and entitlement checks transactionally. Merely having the columns does not enforce these policies. `lastBlockId` in LessonProgress is a cursor hint; the player must validate ownership against its lesson.

## Catalog seed

Five tracks, 14 courses and 128 module outlines: General English 5 levels / 56 modules; IELTS Academic and General Training / 16; Multilevel B1/B2/C1 / 24; Spoken Beginner/Intermediate/Advanced / 28; Conversation / 4. Courses and modules start Coming Soon. There are **zero lesson records** in Phase 1. Twenty substantial A1 lessons and the sample materials belong to Phase 2 and later assessment work.

Catalog seeding uses upserts with empty updates to avoid overwriting edited content on redeployment. RBAC seed adds missing role/permission records; it never revokes manually added permissions. Future role changes require an explicit reviewed migration, not rerunning the seed as an authority sync.

## API and publication invariants

Public catalog queries require visible Track → Course ancestry and only return Published or Coming Soon course/module metadata. Published lesson counts require published course and module ancestors. No lesson block, answer key, paid asset or private user information is returned. There is no enrollment or checkout until later phases.

Backend permissions are read on each authenticated request, so role revocation or suspension takes effect without waiting for a signed browser token to expire. Frontend guards are convenience only.

## Phase handoff rules

Add new REST handlers with validation, authorization, tests and audit logging where relevant. Keep new unimplemented pages explicitly unavailable. Never turn on a provider merely because its environment variables exist. Gateway credentials, merchant onboarding and current provider documentation are mandatory for billing implementation. Keep all integrations disabled until their phase is verified.

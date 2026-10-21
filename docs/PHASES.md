# Delivery status and next phases

## Phase 1: foundation

Implemented: npm workspaces; React/Vite/TypeScript frontend; Express/TypeScript API; 51-model MongoDB Prisma schema with explicit index synchronization; session auth; permission model; bilingual UI; catalog and module outline seed; public/student/admin navigation shells; profile; tests; deployment documentation and CI.

Public Home, Courses, Course Details, How It Works, About, FAQ, Login and Register have useful Phase 1 behavior/content. Pricing has an explicit no-sales disclosure. Blog, Contact and Placement Test show their incomplete state. Privacy/Terms contain clearly marked prelaunch notices, not final policies.

Student Dashboard has a real greeting and empty enrollment state, not invented learning metrics. Profile and Settings work. My Courses is an empty state. Lesson Player, AI Teacher, Vocabulary Review, Quiz Center, Exam Center, Results, Certificates and Subscription are unavailable shells.

Admin Overview is server-authorized. Analytics, Courses, Modules, Lessons, Content Editor, Question Bank, Exam Builder, Media Library, Translation Manager, Student Management, Payments, Subscription Plans, AI Usage, Release Scheduler, Staff Roles, Audit Logs and Settings are explicitly pending screens, not CRUD implementations.

Verification limitations: see VERIFICATION.md. Phase 1 is ready for a local/staging evaluation after database provisioning, not public launch.

## Phase 2: learning engine and starter content

Implement validated block content, versioned publication, prerequisites, enrollments, lesson/activity progress, retained attempts and review scheduling. Populate 20 substantial A1 lessons, two beginner Spoken modules and four scenario lesson flows. Validate translations and learning objectives. No paid access yet. Acceptance: server-authorized lesson access, correct activity scoring, replay-safe completion and progress across devices.

## Phase 3: admin editor and student dashboard

Implement author/reviewer/admin permissions, editable database content, preview, draft/review/publish flow, question bank foundations, safe media storage, translation checks and real dashboard aggregates. Enforce cross-course references and version locks. Acceptance: an author can edit but not publish, reviewer decisions are audited, and student progress remains attached to the original revision.

## Phase 4: AI tutor

Wire verified LLM/STT/TTS APIs using server-side environment credentials. Add turn-based recording, transcription, contextual tutor modes, validated model responses, quota reservation, cost ledger, privacy controls and transcript deletion. Default to no saved raw audio. Acceptance: real provider round-trip in a credentialed staging environment, recoverable errors, bounded spend and unofficial-score labeling. Credentials and vendor retention choices required.

## Phase 5: assessments

Implement placement, lesson/module tests, IELTS and versioned Multilevel blueprints with original sample content. Add server-enforced timers, immutable attempt snapshots, objective scoring, rubric feedback, retry rules and results. Recheck official current exam formats before publication. Automated writing/speaking estimates remain unofficial.

## Phase 6: billing

Verify current Click and Payme merchant documentation, obtain merchant/sandbox credentials and implement explicit provider adapters. Server-calculated UZS prices, order expiry, authenticated callbacks, transaction/event uniqueness, state transitions, reconciliation and transactional entitlement granting. Test duplicates, retries, mismatched amounts/currencies and refund/cancel behavior. Browser redirects never grant access. No provider gateway code is implemented in Phase 1.

## Phase 7: launch hardening and deployment

Finalize staff provisioning, email verification/recovery, user erasure, legal/operator details and age policy; verify Hostinger runtime/proxy/storage; run full MongoDB replica-set integration and browser/accessibility tests; configure HTTPS, logs, backups, restore drills, uptime alerts, media lifecycle and release scheduler. Add certificates only for completed, validated courses. No long-running workers unless hosting explicitly supports them.

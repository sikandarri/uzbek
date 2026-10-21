> Historical project blueprint, written for the earlier MySQL design. The actual implementation in this archive uses MongoDB. See `../README.md`, `../backend/prisma/schema.prisma`, and `DEPLOYMENT.md` for current setup.

# English Learning Platform for Uzbekistan
## Development blueprint and product requirements (v1.0)
**Date:** 17 October 2026  
**Target market:** Uzbekistan  
**Delivery model:** Self-paced online lessons plus AI English tutor  
**Technology:** React + TypeScript + Vite, Node.js + Express, MySQL, Hostinger

> Planning document. Product decisions, lesson counts, prices, success thresholds, and dates below are recommendations to validate, not claims about an existing deployed platform. The platform is an independent educational product and must not imply affiliation with official exam bodies.

---

## 1. Product vision and boundaries

Create a mobile-first bilingual learning management system with five visible course tracks on launch day:

1. General English A1-C1
2. IELTS preparation (Academic and General Training variants where relevant)
3. Uzbekistan CEFR/Multilevel preparation (B1, B2, C1 targets)
4. Spoken English (Beginner, Intermediate, Advanced)
5. English Conversation (real-life scenarios)

All tracks use the same accounts, course player, quiz engine, vocabulary review, AI speaking service, payment entitlements and progress records. Courses may reference a shared exercise or vocabulary item, but independent enrollment and track progress are preserved. Every unfinished unit is clearly labeled **Upcoming**, not falsely sold as already available. Newly published content becomes available automatically to eligible subscribers.

**Primary audiences:** school leavers, university applicants, university students, working adults and independent English learners in Uzbekistan. The first release is primarily designed for users 16+; if younger children are enrolled, implement verified parental permissions, age-appropriate AI restrictions and a child privacy review before launch.

**Business goals:** help learners achieve level-appropriate skills, encourage regular study, support paid subscriptions, and release professionally reviewed content continuously.

**Not included in MVP:** human live classes, peer video calls, an official test certification service, fully automated authoritative IELTS band scoring, social leaderboards, downloadable copyrighted exam papers, an offline native mobile app, or unsupported promises of achieving a particular CEFR level in a fixed number of days.

---

## 2. Roles and permissions

| Role | Capability |
|---|---|
| Guest | Browse published catalogs, free samples, pricing, FAQs, signup |
| Student | Enroll, learn, take quizzes and practice tests, use AI within quota, manage payments and settings |
| Content Author | Create and edit draft lessons, translations and question items |
| Academic Reviewer | Approve or reject lessons, validate answer keys and exam rubrics |
| Support Agent | View limited student account/payment status and help tickets; no voice data by default |
| Admin | Manage courses, promotions, enrollments, publishing and reporting |
| Owner/Superadmin | Configure billing, provider credentials, access control and security settings |

Use permission-based authorization on the server (`courses.write`, `courses.publish`, `users.read`, `billing.refund`, etc.), not just frontend navigation guards. Important operations create immutable audit records.

---

## 3. Full sitemap and route plan

### Public routes

```text
/
/courses
/courses/general-english
/courses/ielts-preparation
/courses/multilevel-preparation
/courses/spoken-english
/courses/conversation
/courses/:courseSlug/:moduleSlug        (public module preview)
/pricing
/placement-test
/how-it-works
/about
/blog
/blog/:articleSlug
/faq
/contact
/login
/register
/forgot-password
/verify-email
/terms
/privacy
/refund-policy
/ai-usage-policy
```

### Authenticated student routes

```text
/app/dashboard
/app/courses
/app/courses/:courseId/overview
/app/learn/:lessonId
/app/learn/:lessonId/activity/:activityId
/app/ai-tutor
/app/ai-tutor/:sessionId
/app/exams
/app/exams/:examId/start
/app/exams/attempts/:attemptId
/app/exams/attempts/:attemptId/results
/app/review
/app/vocabulary
/app/achievements
/app/certificates
/app/billing
/app/billing/receipts
/app/notifications
/app/profile
/app/settings/language
/app/settings/security
/app/settings/privacy
/app/help
```

### Admin routes

```text
/admin
/admin/courses
/admin/courses/new
/admin/courses/:courseId
/admin/courses/:courseId/modules
/admin/lessons/:lessonId/editor
/admin/question-bank
/admin/exams
/admin/exams/:examId/editor
/admin/ai/prompts
/admin/ai/usage
/admin/media
/admin/translations
/admin/releases
/admin/students
/admin/students/:studentId
/admin/enrollments
/admin/plans
/admin/payments
/admin/coupons
/admin/certificates
/admin/analytics
/admin/notifications
/admin/support
/admin/staff
/admin/roles
/admin/audit-log
/admin/settings
```

**Route conventions:** `/app/*` requires authenticated student access. `/admin/*` requires role checks. Course slugs are stable; content IDs are UUIDs. Public course previews reveal only approved free content.

---

## 4. Main screens and user experiences

### Landing page
1. Navigation: logo, Courses, IELTS, Multilevel, Pricing, How It Works, language switch, Sign In.
2. Hero: concise Uzbek headline, sample lesson action and free placement-test action.
3. Five track cards, each showing available lessons and a truthful release badge.
4. How learning works in four steps: placement, lessons, practice, progress.
5. Sample AI tutor interaction (noninteractive demo or clearly marked sample).
6. Progress and course experience screenshots, legitimate testimonials only.
7. Transparent plans and FAQs.
8. Footer: contact, legal, social links, support hours and privacy.

### Course detail
- Course outcomes, target level, course syllabus, estimated workload, available and upcoming units.
- Free preview lesson; sample quiz; AI tutor sample with a limited free quota.
- Prerequisites, language of explanations, course completion requirements.
- Enrollment or upgrade button; no misleading countdowns.

### Registration and onboarding
- Email/password, verification; optional approved phone OTP later.
- Explicit acceptance of terms and privacy policy; separate optional marketing opt-in.
- Language preference; exam goal; daily study goal; optional placement test.
- Placement result with a confidence caveat and recommended starting course.
- Paywall or free sample selection.

### Student dashboard
Desktop wireframe:

```text
+-------------------------------------------------------------+
| Logo   My Learning    Courses    AI Teacher     UZ / EN     |
+---------------------+---------------------------------------+
| Sidebar             | Hello! Continue your English journey  |
| Dashboard           | [ Current level ] [ Study streak ]    |
| My Courses          | [ Time studied  ] [ Weekly goal  ]    |
| AI Teacher          |                                       |
| Vocabulary          | Continue learning                     |
| Exam Practice       | [A1 Unit 2: My Family] [Resume]      |
| Results             |                                       |
| Certificates        | Skill progress                        |
| Billing             | Reading Listening Speaking Writing   |
| Settings            |                                       |
|                     | Review due today | AI practice task  |
+---------------------+---------------------------------------+
```

Cards: Continue Learning, Your Courses, Study Streak, Weekly Goal, Vocabulary Due, Speaking Practice, Mock Test Result, Next Recommended Lesson. Use accessible progress indicators and time-zone-aware streaks (`Asia/Tashkent`).

### Lesson player
Desktop: left course outline, central lesson content, optional right vocabulary/AI help; mobile: single-column content and bottom sticky Next/Previous controls. Resume exact previous activity. Display lesson objective and progress. Activities should save automatically when safe to do so.

Recommended exercise types: vocabulary flashcards, picture-word pairing, listening multiple choice, true/false, cloze, drag-to-reorder, short writing, dictation, voice recording, role-play and end-of-unit quiz.

### AI teacher screen
- Mode selector: Explain, Guided Practice, Free Conversation, Role-play, Exam Speaking.
- Level, goal and conversation topic controls; audio-input permission prompt.
- Microphone, playback, captions, corrected sentence and one actionable feedback point.
- Speak/stop/retry controls, optional slow audio, AI minutes remaining.
- Clear disclosure that feedback is automated and may be wrong.

### Exam center
- Choose exam type and target (IELTS Academic/General; Multilevel B1/B2/C1).
- Practice mode with feedback, or mock mode with timers and delayed feedback.
- Listening/reading objective grading; writing and speaking estimates with rubric evidence.
- Results: skill breakdown, weak skills, next lessons, previous attempts.
- Never present practice certificates as official IELTS or national examination certificates.

---

## 5. Course and content architecture

### Course content hierarchy
`Track -> Course -> Level/Section -> Module -> Lesson -> Activity -> Items -> Attempts`

Courses, modules and lessons have immutable IDs, version numbers, publish state (`draft`, `review`, `scheduled`, `published`, `archived`), `publish_at`, prerequisites and estimated minutes. Activities reference reusable questions and media. Each question and answer key is independently versioned. If a student took a test on version 3, preserve that version for reporting when version 4 is published.

### General English A1-C1: proposed content inventory
Each module includes 5 core lessons, 1 module quiz, review flashcards and AI practice prompts. This is a suggested editorial scope; times and difficulty should be piloted by qualified teachers.

| Level | Proposed modules | Themes and grammar progression | Target inventory |
|---|---:|---|---:|
| A1 | 10 | Greetings, personal information, family, routines, time, home, food, shopping, directions, basic past and future | 50 lessons |
| A2 | 10 | Habits, travel, health, work, comparisons, life experiences, plans, invitations, past narrative, functional writing | 50 lessons |
| B1 | 12 | Storytelling, work and study, opinions, experiences, media, conditionals, modals, present perfect, arguments, paragraphs | 60 lessons |
| B2 | 12 | Complex opinions, presentations, negotiations, academic topics, passive structures, reported speech, cohesion, longer essays | 60 lessons |
| C1 | 12 | Nuance, idioms in context, sophisticated argument, academic listening, register, inference, persuasive writing and presentations | 60 lessons |
| **Total** | **56** | **Five levels** | **280 planned lessons** |

**Completion rule suggestion:** at least 80% of required activity points and 80% on module knowledge checks, plus all mandatory tasks. Allow retries with explanations and fresh question variants; do not use quiz accuracy alone to assert CEFR proficiency. Provide an end-of-level capstone and achievement certificate.

### Standard General English lesson template
| Component | Illustrative quantity | Experience |
|---|---|---|
| Learning objectives | 2-3 | Measurable skill goals |
| Vocabulary | 10-20 words | Audio, Uzbek translation, contextual example |
| Grammar or language function | 1 | Short explanation, examples and controlled practice |
| Listening | 1-2 clips | Transcript available after attempt; captions as accessibility option |
| Reading | 1 short text | Comprehension questions |
| Speaking | 1 guided AI task | Speak, receive correction, retry |
| Quiz | 8-12 questions | Immediate explanations in practice mode |
| Review assignment | 5-10 cards | Scheduled review |

Keep each learning session to about 15-25 minutes plus optional conversation time. Longer topics become multiple lessons.

### IELTS preparation
**Modules:** Foundation and diagnostic; Listening; Academic Reading; General Training Reading; Academic Writing Task 1; General Training Writing Task 1; Writing Task 2; Speaking Parts 1-3; full mock tests; targeted band-improvement practice. The learner selects Academic or General Training to receive the appropriate tasks and plan. Listening, Writing Task 2 and Speaking can share some core practice content.

Use official public criteria where allowed for teaching, and write original passages, audio, question sets and sample responses. Store writing feedback as estimated task achievement/response, coherence/cohesion, vocabulary, grammar and overall estimate with uncertainty. Speaking feedback can cover fluency/coherence, pronunciation, vocabulary and grammar. Do not imply official band certification or reproduce protected test materials without permission.

### Uzbekistan CEFR/Multilevel
**Modules:** Exam overview; B1/B2/C1 diagnostics; Listening; Reading; Writing; Speaking; timed mocks; mistake analysis and targeted revision. Build **versioned exam blueprints** because the national test format can change. Admin should configure number of sections, questions, timing, speaking prompt patterns, marking scheme, target level and rubric version. Content staff must review the current Assessment Agency format before each exam bank release.

Official reference: https://uzbmb.uz/page/test_sinovlari_formati and https://uzbmb.uz/page/test_namunalari. The website describes Multilevel as a test intended to distinguish B1/B2/C1 ability.

### Spoken English
Three bands: Beginner (8 modules), Intermediate (10), Advanced (10). Example units: introductions, everyday situations, phone calls, describing experiences, explaining ideas, discussions, interviews, presentations, disagreement and persuasion. Every unit offers model pronunciation, read-aloud, guided Q&A, free response and feedback.

### English Conversation
Scenario-based units tagged by difficulty: cafe, travel, airport, hotel, transport, shopping, job interview, medical appointment, university, workplace, friendship, customer support and debate. A user picks a character, goal, pace and topic, then completes a simulated conversation. Include outcome-based feedback (“asked a clarification question,” “gave directions correctly”) rather than a single opaque score.

### Cross-track skills taxonomy
Every reusable activity is tagged by `skill` (listening, reading, writing, speaking, grammar, vocabulary, pronunciation), CEFR alignment, topic and prerequisite concepts. A dashboard can aggregate skill practice across courses without conflating practice completion with an accredited skill level.

---

## 6. AI teacher specification

### Initial interaction architecture (recommended MVP)

```text
Browser microphone (permission granted)
  -> short recorded audio (user can preview/delete)
  -> authenticated Express /api/ai/transcribe
  -> speech-to-text provider
  -> curriculum-aware tutoring request
  -> language model with level + topic + constraints
  -> structured JSON (answer, corrections, next prompt, explanation)
  -> optional text-to-speech provider
  -> student audio/text feedback panel
  -> minimal usage and feedback records
```

Start with **push-to-talk turn-based audio**. Live bidirectional voice streaming, persistent real-time sessions and heavy video processing can be added later when infrastructure and cost budgets are validated. Never expose AI vendor keys to React. Restrict AI to appropriate pedagogical requests, block prompt injection from user-submitted content, and cap output length. Validate model JSON with Zod and implement retries/fallback text responses.

### Tutor modes
| Mode | Behavior |
|---|---|
| Explain | Answer one learner question using concise Uzbek/English examples appropriate to level |
| Guided practice | Ask one question, check response, give one correction and one encouraging next step |
| Pronunciation | Play target phrase, record repeat, show targeted pronunciation guidance if analysis supports it |
| Free conversation | Respond naturally at appropriate CEFR difficulty; preserve short context |
| Scenario role-play | Assume character and objective, provide end-of-dialogue outcome feedback |
| Exam speaking | Ask exam-style questions and provide unofficial criterion-based estimate |
| Writing coach | Highlight errors, explain why, propose revision without replacing all student effort |

### Prompt inputs and safeguards
Inputs: content objective, CEFR level, locale, transcript, last 6-12 relevant turns, user goal, approved teaching snippets. Output: `reply`, `corrections[]`, `rubric_feedback[]`, `next_question`, `safety_flag`, `estimated_tokens`. Avoid sending full profile, payment records, phone number or unrelated student data to AI providers. Do not log raw recordings by default. Provide opt-in storage and deletion rules; default to short retention for raw audio. Speech-to-text accuracy is not a pronunciation score, and automated CEFR/IELTS ratings must be labeled practice estimates.

### AI quotas and controls
- Free trial: fixed introductory messages/minutes.
- Paid subscription: monthly quota by plan, shown clearly to users.
- Server-side rate limits per user, daily and monthly budget controls, moderation and abuse handling.
- Record usage counters by service, provider, model, token count, audio duration and approximate cost.
- Admin can disable expensive modes or providers with feature flags.
- Fall back to text-only if speech generation fails.

---

## 7. Assessment, progress and certification

### Assessment types
1. Lesson activity: instant practice feedback, repeatable.
2. Module quiz: versioned question bank, pass threshold and retry policy.
3. Placement test: adaptive or multistage starting recommendation, not an official CEFR certification.
4. End-of-level capstone: integrated grammar/vocabulary/listening/reading/writing/speaking practice.
5. Exam mock: timed, exam-specific paper blueprint and review report.

### Progress calculations
- Lesson progress = completed required activity weights / total required activity weights.
- Course progress = completed required lesson weights / all **currently published** required lesson weights, with a separate indicator for full planned-course completion to avoid giving 100% for only released material.
- Store raw assessment answers, scoring algorithm version and rubric version.
- A lesson is finished only after mandatory activities are completed and recorded.
- Daily streak is computed in `Asia/Tashkent`, based on qualified learning events.

### Vocabulary review
Create spaced-review cards after vocabulary exposure. Track due date, last review, recall rating, interval and ease/stability. Limit daily work based on available cards. Show accurate “due today” counts.

### Certificates
Branded completion certificates with course, student display name, issue date and unique verification ID; public verification page reveals only consented minimum details. Certificates clearly state **course completion** and never represent official IELTS or Uzbekistan state credentials.

---

## 8. Multilingual experience

**Launch UI:** Uzbek Latin (`uz-Latn`) default, English (`en`) optional. Future optional Russian (`ru`) and Uzbek Cyrillic (`uz-Cyrl`). Treat transliteration as separate reviewed localization; do not assume all Uzbek learners want Cyrillic.

Translate navigation, prompts, explanations, payment terms, emails, error messages, accessibility labels and certificates. Store content translations separately from UI translations:
- Frontend: `react-i18next` JSON namespaces (`common`, `auth`, `courses`, `lesson`, `exams`, `billing`).
- API: stable machine-readable error codes with frontend-localized messages.
- Database: `course_translations`, `module_translations`, `lesson_translations`, `exercise_translations` or generalized `content_localizations` with composite unique keys.
- English examples stay unchanged where they are the object of study. Uzbek guidance accompanies, not replaces, English.
- Missing translation fallback is defined and visible to editors. Do not silently release incomplete critical legal or payment text.
- UI should support Uzbek characters `o‘`, `g‘`, `ʻ`, `ʼ`, `sh`, `ch` correctly; use UTF-8 / `utf8mb4` throughout.
- Format UZS, dates and times appropriately; store timestamps in UTC and render in `Asia/Tashkent`.

---

## 9. MySQL data model

Use UUID or ULID primary keys, foreign keys, cascading rules reviewed per relation, timestamps (`created_at`, `updated_at`), soft deletion for content, explicit published revisions and audit history. Sensitive user deletion must anonymize dependent analytic data where required.

### Identity and permissions
- `users(id, email UNIQUE, password_hash, status, email_verified_at, created_at)`
- `student_profiles(user_id PK/FK, display_name, native_locale, study_goal, timezone, avatar_asset_id, settings_json)`
- `sessions(id, user_id FK, token_hash UNIQUE, expires_at, revoked_at, created_at)`
- `roles(id, name UNIQUE)`, `permissions(id, code UNIQUE)`, `role_permissions(role_id, permission_id)`, `user_roles(user_id, role_id)`
- `auth_events(id, user_id, event_type, ip_hash, created_at)`

### Catalog and content
- `tracks(id, slug UNIQUE, title_key, display_order, status)`
- `courses(id, track_id FK, slug UNIQUE, cefr_level, exam_variant, status, published_at)`
- `course_translations(course_id, locale, name, description, outcomes_json)`
- `modules(id, course_id FK, sequence, status, publish_at, prerequisite_module_id)`
- `module_translations(module_id, locale, title, description)`
- `lessons(id, module_id FK, sequence, lesson_type, estimated_minutes, status, publish_at, required)`
- `lesson_translations(lesson_id, locale, title, objectives_json, instructions_json)`
- `lesson_blocks(id, lesson_id FK, sequence, type, content_json, media_asset_id, version)`
- `media_assets(id, owner_id, kind, storage_key UNIQUE, mime_type, duration_sec, visibility, checksum)`
- `content_versions(id, entity_type, entity_id, version, snapshot_json, approved_by, published_at)`
- `content_releases(id, course_id, scheduled_at, published_at, status, notes)`
- `content_tags(id, code UNIQUE, skill, level)`; `lesson_tags(lesson_id, tag_id)`

### Assessment and learning
- `questions(id, type, difficulty, skill, status, version, stem_json, answer_key_json, explanation_json)`
- `question_options(id, question_id FK, sequence, content_json, is_correct)`
- `assessments(id, course_id, module_id, type, exam_blueprint_id, duration_sec, passing_score, status)`
- `assessment_questions(assessment_id, question_id, sequence, points)`
- `exam_blueprints(id, exam_type, version, sections_json, timing_json, scoring_json, source_reviewed_at)`
- `enrollments(id, user_id FK, course_id FK, status, entitlement_id, started_at, completed_at)`
- `lesson_progress(id, user_id FK, lesson_id FK, status, progress_percent, last_activity_id, completed_at)`
- `activity_attempts(id, user_id, lesson_block_id, answer_json, score, feedback_json, attempted_at)`
- `assessment_attempts(id, user_id, assessment_id, assessment_version, status, started_at, submitted_at, score, rubric_json)`
- `assessment_answers(id, attempt_id, question_id, answer_json, awarded_points, grader_version)`
- `vocabulary_items(id, lemma, part_of_speech, level, pronunciation, example_text)`
- `vocabulary_translations(item_id, locale, translation, notes)`
- `review_cards(id, user_id, vocabulary_item_id, due_at, interval_days, stability, difficulty, last_review_at)`
- `review_events(id, card_id, rating, reviewed_at)`
- `study_events(id, user_id, type, ref_id, active_seconds, occurred_at)`
- `certificates(id, user_id, course_id, serial UNIQUE, issued_at, status, public_verify_token)`

### AI tutoring
- `tutor_sessions(id, user_id, course_id, lesson_id, mode, locale, status, opened_at, closed_at)`
- `tutor_turns(id, session_id, role, transcript_text, feedback_json, audio_asset_id, created_at)`
- `ai_usage(id, user_id, session_id, provider, model, operation, input_tokens, output_tokens, audio_seconds, estimated_cost_minor, created_at)`
- `ai_prompt_versions(id, mode, version, template_text, approved_by, active)`

### Commerce and operations
- `plans(id, code UNIQUE, name, price_minor, currency, interval, ai_allowance, active)`
- `orders(id, user_id, plan_id, amount_minor, currency, status, created_at)`
- `payment_transactions(id, order_id, provider, provider_txn_id UNIQUE, status, amount_minor, verified_at, raw_event_digest)`
- `subscriptions(id, user_id, plan_id, status, start_at, end_at, renewal_mode)`
- `entitlements(id, user_id, scope_type, scope_id, valid_from, valid_until, source_order_id)`
- `coupons(id, code UNIQUE, discount_type, discount_value, valid_from, valid_until, usage_limit)`
- `notifications(id, user_id, template_key, payload_json, channel, status, scheduled_at, sent_at)`
- `support_tickets(id, user_id, assigned_to, status, subject, created_at)`
- `audit_logs(id, actor_id, action, resource_type, resource_id, before_json, after_json, created_at)`
- `feature_flags(key PK, enabled, config_json)`

### Constraints and performance
- UNIQUE `(user_id, course_id)` in `enrollments`, `(user_id, lesson_id)` in `lesson_progress`, `(course_id, locale)` in `course_translations`, and corresponding localization keys.
- Index `(user_id, due_at)` on `review_cards`, `(user_id, occurred_at)` on `study_events`, `(user_id, status)` on `subscriptions`, `(course_id, sequence)` on `modules` and `(module_id, sequence)` on `lessons`.
- Store provider events with unique identifiers for idempotency. Keep payment webhook payloads in a separate access-restricted retention store if required, not general logs.
- Do not store raw payment card details. Use decimal/integer minor currency units, not floating-point amounts.
- Avoid full media binaries in MySQL. Store paths and metadata for private object storage.

### Relationship summary

```text
user --< enrollment >-- course --< module --< lesson --< lesson_block
user --< lesson_progress >-- lesson
assessment --< assessment_questions >-- question
user --< assessment_attempt --< assessment_answer >-- question
user --< tutor_session --< tutor_turn
user --< order --< payment_transaction
user --< entitlement >-- course or all-access scope
user --< review_card >-- vocabulary_item
```

---

## 10. REST API contract (v1)

Use `/api/v1`; requests/responses are JSON except media upload streaming. Responses use `{ data, meta?, error? }`, with stable error codes, request IDs, pagination and validation.

### Auth and profiles
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- `POST /auth/verify-email`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- `GET /me`, `PATCH /me/profile`, `PATCH /me/preferences`

### Courses and learning
- `GET /tracks`, `GET /courses`, `GET /courses/:slug`, `GET /courses/:id/modules`
- `POST /courses/:id/enroll`, `GET /me/enrollments`
- `GET /lessons/:id`, `PUT /lessons/:id/progress`, `POST /lessons/:id/activities/:activityId/attempts`
- `GET /me/dashboard`, `GET /me/learning-analytics`, `GET /me/review/due`, `POST /me/review/:cardId`

### Assessments
- `POST /placement/start`, `POST /placement/:id/submit`
- `GET /assessments`, `POST /assessments/:id/start`
- `PUT /attempts/:id/answers/:questionId`, `POST /attempts/:id/submit`, `GET /attempts/:id/results`
- Submission must enforce timeout and single-final-submission semantics on the server.

### AI
- `POST /ai/sessions`, `POST /ai/sessions/:id/turns`
- `POST /ai/transcribe`, `POST /ai/speak`, `POST /ai/writing-feedback`
- `GET /ai/allowance`, `DELETE /ai/sessions/:id`

### Billing
- `GET /plans`, `POST /orders`, `POST /payments/:provider/create-checkout`
- `POST /webhooks/payme`, `POST /webhooks/click` (provider-validated callbacks)
- `GET /me/orders`, `GET /me/subscription`, `POST /me/subscription/cancel`

### Admin
- `GET/POST/PATCH /admin/courses`, `/admin/modules`, `/admin/lessons`, `/admin/questions`, `/admin/assessments`
- `POST /admin/content/:id/request-review`, `POST /admin/content/:id/approve`, `POST /admin/content/:id/publish`
- `GET /admin/students`, `GET /admin/revenue`, `GET /admin/ai-usage`, `GET /admin/audit-log`
- `POST /admin/media/upload-intent`, `POST /admin/releases`, `PATCH /admin/feature-flags/:key`

All mutations require validation, authorization, rate limits where appropriate and audit logging for sensitive actions. Do not let clients set raw scores, entitlements or payment status.

---

## 11. Admin dashboard requirements

### Overview KPIs
Registrations, weekly active learners, enrollments, active subscriptions, completed lessons, course completion rates, test attempts, estimated AI cost, failed payments, lesson error rates and upcoming scheduled releases.

### Course builder workflow
1. Create course and select track/level/exam variant.
2. Add modules, lessons and activities with drag-to-reorder.
3. Add Uzbek/English content, media and assessment items.
4. Preview as a student at each level and mobile size.
5. Run content checks (empty translations, invalid answer keys, missing accessibility labels, broken media).
6. Send to academic reviewer.
7. Reviewer approves or returns changes.
8. Schedule release time; publish revised versions atomically.
9. Track errors, learning analytics and questions needing revision.

### Exam builder
Admin maintains versioned test specification templates, sections, timing, question pool filters, scoring rubrics, answer keys and permissions. The system must support questions requiring audio, images, typed answers or recorded answers. If an official format changes, create a new blueprint version; do not silently alter previously started exams.

### AI administration
Modes, prompt versions, approved curriculum context, provider status, per-user quota, abuse reports, cost dashboard and sampling of anonymized feedback quality. Restrict full audio/transcript access to appropriately authorized roles and only where consent/legal basis exists.

### Finance and operations
Orders, refunds through provider processes, payment event reconciliation, subscription entitlements, coupon history, support escalations, role management and audit logs.

---

## 12. Billing and payment strategy

**Recommended initial business models:** limited free lessons; monthly General English; monthly Exam Prep; monthly Speaking+Conversation; and all-access. Optionally support annual plans later. Define exact prices in UZS after local user research and confirmed unit economics.

**Providers:** Click Business and Payme are relevant Uzbekistan payment pathways. Integrate approved merchant checkouts via server-side endpoints and verify signed/certified provider callbacks. Payme offers a documented hosted checkout URL flow and test environment. Merchant onboarding, recurring billing and fiscalization must be confirmed with the chosen provider and accountant before production.

Checkout sequence:
1. Server creates pending `order`, computes final price, never trusts client amount.
2. Server requests a checkout token/URL from provider.
3. User completes provider-hosted checkout.
4. Backend verifies asynchronous callback/authenticity and idempotency.
5. Database transaction changes order/payment status and grants entitlement exactly once.
6. Frontend checks actual backend payment status, rather than treating return URL as confirmation.
7. On refund/reversal/expiry, update entitlement according to published terms.

For an MVP, manual renewal (new monthly purchase) is simpler than promising automatic recurring subscriptions unless the provider contract supports tested recurring flows.

---

## 13. Visual/UI design system

**Design principles:** mobile-first, uncluttered, welcoming but not childish, strong readability, clear progression and large controls for speaking practice.

**Suggested design tokens (subject to brand approval):**
- Brand deep teal `#0F766E`; dark ink `#102A43`; accent amber `#F59E0B`.
- Background `#F8FAFC`; surface `#FFFFFF`; border `#E2E8F0`.
- Main typeface Inter or Noto Sans, with confirmed support for Uzbek Latin characters.
- Spacing based on 4/8px steps; cards with 12-16px radius; minimum 44x44px tap areas.
- WCAG 2.2 AA accessibility target, keyboard navigation, visible focus, meaningful labels, captions and no color-only statuses.

**Navigation:** desktop top nav plus left sidebar after login; mobile sticky bottom navigation for Dashboard, Courses, AI Tutor, Practice and Profile. A lesson screen keeps the most important activity within the first viewport and does not hide audio controls.

**Components:** AppShell, Sidebar, BottomNavigation, CourseCard, LevelChip, AvailabilityBadge, ProgressRing, LessonBlockRenderer, MediaPlayer, VoiceRecorder, QuizQuestion, StudyStreak, VocabularyCard, ExamTimer, ResultsRubric, Paywall, LanguageSwitch, AdminDataTable, TranslationEditor and ReleaseCalendar.

**Empty states:** no courses enrolled, not enough placement data, unavailable AI quota, missing microphone permission, upcoming content, no cards due, interrupted exam, failed payment, offline media and server error. Each must provide a useful recovery action.

---

## 14. Hostinger infrastructure and deployment

### Phase 1: supported managed-hosting path
- Hostinger **Business or eligible Cloud Node.js** service, with Express serving `/api/v1` and the Vite React compiled assets from one site. Use verified Node LTS available on the plan.
- Hostinger MySQL database and secrets managed through environment variables.
- GitHub deployment with separate staging and production environments where the plan allows.
- External AI speech/LLM APIs behind server-only keys; private media in object storage + CDN, not public repo.
- Transactional email service for verification/reset, with authorized sender domain.
- Backups and verified restore procedure; monitoring of health, errors, payment events and database connection pool.

Current Hostinger references: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/ and https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/ . Hostinger plan allowances and resource limits can change; check the exact purchased plan.

### Phase 2: move to Hostinger VPS if required
When needing Redis-backed workers, long-lived real-time voice streaming, advanced reverse proxy rules or high sustained concurrency, use a VPS. Suggested VPS topology: Caddy/Nginx -> Express service -> MySQL (managed separately or secured self-hosted), Redis/worker if needed, external object storage, process supervision, telemetry and offsite backups. A VPS increases responsibility for patching and network security.

### Example monorepo

```text
english-platform/
  apps/
    web/                         # React + Vite SPA
      src/{routes,components,features,locales,lib,styles}
    api/                         # Express + TypeScript
      src/{routes,controllers,services,validators,middleware,workers}
  packages/
    shared/                      # shared Zod schemas, types, permissions
    curriculum/                  # scoring, progression, CEFR tags
  prisma/
    schema.prisma
    migrations/
    seed/
  docs/
  .github/workflows/
  README.md
```

### Environment variable inventory
`NODE_ENV`, `PUBLIC_APP_URL`, `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN` (if separate domains), `MAIL_*`, `AI_API_KEY`, `AI_MODEL`, `SPEECH_TO_TEXT_KEY`, `TEXT_TO_SPEECH_KEY`, `MEDIA_BUCKET`, `MEDIA_ACCESS_KEY`, `PAYME_MERCHANT_ID`, `PAYME_SECRET`, `CLICK_*`, `WEBHOOK_SECRET`, `OBSERVABILITY_DSN`.

Keep secrets server-side and out of Git. Use least-privilege database credentials, rotate keys and separate test/live payment secrets. Never use public AI vendor keys in frontend code.

---

## 15. Security, privacy and compliance

1. Server-side sessions with `HttpOnly`, `Secure`, `SameSite` cookies, CSRF protection as appropriate, session rotation and password hashing (Argon2id or comparable modern algorithm).
2. Strict role/permission checks on all resources; prevent insecure direct object references.
3. HTTPS, validated input, prepared queries via ORM, API throttling, upload type/size restrictions, malware handling and signed media URLs.
4. Payment signature verification, replay protection, unique provider transaction IDs, audit and reconciliation.
5. Data lifecycle: collection notice, independent marketing consent, audio permissions, user export/delete process, retention limits and processor agreements.
6. Learners should be able to use nonvoice activities if microphone access is unavailable or declined.
7. AI voice recordings and transcripts are sensitive educational data. Limit collection, minimize retention, permit deletion and clearly identify third-party processors.
8. Under-18 student access needs special consent, safety, and product moderation planning.
9. Run a local legal review before choosing physical data center and third-party AI geography. Uzbekistan's personal data and localization obligations changed in March 2026; permitted transfers and locally required categories need confirmation under the current rules before deployment.
10. Review IP licensing for original exam passages, published source materials, illustrations, videos and voices. Do not use IELTS or government logos to imply official affiliation.

Recent legal analysis: https://www.dentons.com/en/insights/articles/2026/march/31/uzbekistan-dismantles-strict-data-localization-regime and https://tax-legal.uz/en/personal-data-protection-localization/ .

---

## 16. Quality assurance and operational targets

### Automated tests
- Unit tests: progression math, eligibility, score calculation, timezone logic, plan quotas and API validators.
- Integration tests: login, enrollments, migrations, lesson updates, assessment submission, signed provider callbacks, entitlement grants.
- E2E: full guest -> signup -> course -> lesson -> quiz -> AI practice -> purchase -> access flow on mobile and desktop.
- Accessibility checks: keyboard, focus, screen reader labels, color contrast, captions and transcript controls.
- Load tests: realistic peak student concurrency including media traffic routed via CDN; speech AI calls separately budgeted.
- Security tests: authorization boundaries, expired sessions, enumeration, SQL injection, webhook spoofing and private media leakage.

### Suggested targets (must be tested)
- 99.5% availability initially (not a contractual SLA unless supported).
- Under 2.5 seconds LCP for main student pages on representative mobile 4G after optimization.
- No lost answer on normal navigation; safe resumability after connectivity interruptions.
- Zero duplicate enrollments on repeated payment callbacks.
- Tracked successful completion rate for AI requests and clear fallback on provider failure.
- Production data backups plus a demonstrated restore exercise before launch.

### Analytics and reports
Conversion funnel: landing -> register -> placement -> sample lesson -> first paid order; retention D1/D7/D30; lessons/student/week; unit completion; AI minutes/student; estimated AI cost per active paid learner; score improvement by question objective; refund/failure rates. Respect opt-outs and collect only necessary analytics.

---

## 17. Release milestones and content launch strategy

These are estimates for a small team (approximately 2 developers, 1 designer/QA shared, and a separate content/review function). Actual schedule depends strongly on payment onboarding, AI providers, curriculum authoring and quality testing.

| Phase | Indicative timing | Release deliverables | Exit condition |
|---|---|---|---|
| 0. Discovery and specification | Weeks 1-2 | Content inventory, exam format validation, wireframes, backlog, security/privacy review | Approved scope |
| 1. Foundation | Weeks 3-4 | React shell, Express service, MySQL schema, auth, localization, CI/CD | Secure login and deployment |
| 2. Learning engine | Weeks 5-7 | Catalog, course builder, lesson player, quizzes, enrollments, progress | Learner completes end-to-end course sample |
| 3. AI tutor | Weeks 8-9 | Text tutor, turn-based speech, quotas, feedback capture | Reliable speaking practice with safe fallback |
| 4. Exam center | Weeks 10-11 | Placement, IELTS/Multilevel blueprint engine, mock results | Versioned exam samples pass review |
| 5. Commerce and admin | Weeks 12-13 | Payment sandbox, subscription entitlements, release scheduling, reports | Reconciled purchase and refund tests |
| 6. Hardening and pilot | Weeks 14-16 | Accessibility, mobile QA, load, backups, user pilot and defect fixing | Launch criteria passed |
| 7. Public launch | After pilot approval | Five visible tracks with truthful availability and starter content | Approved catalog and support readiness |

### Suggested launch-day published content
- General English: A1 modules 1-4 (20 lessons) plus visible planned A1-C1 roadmap.
- IELTS: diagnostic, beginner orientation, Listening sample, Reading sample and one each of original writing/speaking practice tasks.
- Multilevel: overview, published diagnostic, one listening/reading sample and a speaking practice set reviewed against the current test specification.
- Spoken English: Beginner modules 1-2, with microphone practice.
- Conversation: at least 4 tested scenarios at beginner/intermediate levels.

Do **not** advertise a full A1-C1 completed course until the content actually exists. Display both published lesson counts and upcoming modules. Plan subsequent releases after launch:
- Wave 2: complete A1, expand A2, IELTS Listening/Reading, Multilevel B1/B2.
- Wave 3: B1/B2 General English, full IELTS Writing/Speaking practice, Multilevel advanced mocks, expanded conversations.
- Wave 4: C1 curriculum, advanced speaking scenarios and deeper adaptive analytics.

Content creation usually remains on a different timeline from application engineering; release throughput depends on educators, reviewers, audio production and localization.

---

## 18. Prioritized implementation backlog

**Must-have for first public release (P0):** registration/login; locale switch; public pages; five catalog sections; clear published/upcoming state; lesson player; questions and grading; secure enrollment; basic placement; dashboard; text/push-to-talk tutor; audio permission and quotas; MySQL migrations; media; admin content editor/review; payments; progress; privacy/security; backups; responsive accessibility.

**Next (P1):** vocabulary spaced repetition, certificates, advanced mocks, coupons, full writing rubric report, better pronunciation feedback, recurring payment if supported, scheduled email nudges, search, advanced admin analytics.

**Later (P2):** realtime voice tutor, native mobile apps, offline downloads with rights management, personalized adaptive course paths, community discussions, instructor marketplace, peer challenges and live group lessons.

---

## 19. Definition of done and sign-off checklist

- [ ] Five public course pages exist and clearly distinguish released vs upcoming content.
- [ ] Uzbek Latin and English translations are complete for every shipped critical screen.
- [ ] New student can complete a verified signup, placement recommendation and free sample.
- [ ] Paid student can purchase access; payment status comes from verified provider callback.
- [ ] Student can complete, resume and review at least one lesson per launched course with activities.
- [ ] AI tutor provides responses within quotas, handles denied mic permission and labels estimates.
- [ ] Admin can create, review, schedule and publish a lesson without changing code.
- [ ] Test engine supports versioned IELTS/Multilevel practice structures.
- [ ] Analytics, subscription access, course progress and certificates behave as specified.
- [ ] Security review, privacy review, accessibility checks, backups and restore test pass.
- [ ] At least one pilot cohort has completed the onboarding-to-learning journey on mobile.

---

## 20. Reference documentation and validation points

- Hostinger Node.js deployment: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- Hostinger MySQL with Node.js: https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/
- Uzbekistan official Multilevel exam format: https://uzbmb.uz/page/test_sinovlari_formati
- Uzbekistan official exam samples: https://uzbmb.uz/page/test_namunalari
- Payme payment API introduction: https://docs.payme.uz/api/introduction/
- Payme checkout flow: https://docs.payme.uz/api/create-order/
- Click Business merchant onboarding: https://business.click.uz/en
- Uzbekistan personal-data changes (legal analysis): https://www.dentons.com/en/insights/articles/2026/march/31/uzbekistan-dismantles-strict-data-localization-regime
- Uzbekistan data law 2026 update: https://tax-legal.uz/en/personal-data-protection-localization/

**Recommended next technical deliverables:** clickable UI prototype; Prisma schema and migration; OpenAPI 3.1 spec; per-course content spreadsheet; complete UX state inventory; and staged implementation tickets with acceptance criteria.

---

## Appendix A. Module-by-module curriculum map

These module titles are a proposed authoring sequence. A curriculum specialist should translate each into CEFR-aligned can-do descriptors, prerequisite grammar, vocabulary scope, lesson objectives and marking rubrics before release.

### General English A1 (10 modules)
1. Hello, Names and Introductions
2. Countries, Numbers, Age and Personal Details
3. Family, Friends and Descriptions
4. My Home and Everyday Objects
5. Daily Routines, Time and Frequency
6. Food, Drinks and Ordering
7. Town, Places and Asking Directions
8. Hobbies, Abilities and Preferences
9. Shopping, Prices and Simple Requests
10. Yesterday, Tomorrow and A1 Review Project

### General English A2 (10 modules)
1. Daily Life and Better Conversations
2. Holidays and Travel Plans
3. Health, Symptoms and Advice
4. Past Events and Personal Stories
5. Learning, Work and Responsibilities
6. City Life, Transport and Services
7. Invitations, Arrangements and Polite Requests
8. Comparisons, Preferences and Choices
9. Life Experiences and Achievements
10. Future Plans, Practical Writing and A2 Project

### General English B1 (12 modules)
1. Telling Clear and Interesting Stories
2. Opinions, Reasons and Examples
3. Education, Careers and Aspirations
4. Travel Problems and Problem Solving
5. Digital Life, Media and Communication
6. Health, Fitness and Lifestyle
7. Environment, Communities and Solutions
8. Present Perfect, Past Narratives and Time
9. Advice, Obligation, Possibility and Modals
10. Real and Hypothetical Conditionals
11. Structured Speaking and Presentations
12. Emails, Paragraphs and B1 Integrated Project

### General English B2 (12 modules)
1. Fluency, Register and Precision
2. Extended Narratives and Emphasis
3. Workplace Meetings and Negotiations
4. Critical Reading and Recognizing Argument
5. Technology, Society and Ethical Questions
6. Culture, Identity and Social Change
7. Debate, Claims and Counterarguments
8. Passive Structures and Impersonal Style
9. Reporting, Paraphrasing and Source Integration
10. Advanced Listening and Note Taking
11. Essays, Reports and Formal Correspondence
12. B2 Integrated Communication Project

### General English C1 (12 modules)
1. Nuanced Opinions and Diplomatic Disagreement
2. Academic Discussion and Seminar Skills
3. Complex Listening, Inference and Intent
4. Identity, Society and Cultural Interpretation
5. Professional Persuasion and Correspondence
6. Evidence, Claims and Evaluating Research
7. Cohesion, Discourse and Rhetorical Structure
8. Collocations, Connotation and Idiomatic Precision
9. Counterarguments, Logic and Critical Thinking
10. Register, Style and Editorial Revision
11. Extended Presentations and Panel Discussions
12. C1 Integrated Capstone: Reading to Presentation

### IELTS preparation detailed modules
1. Orientation, test types, timing and diagnostic
2. IELTS foundational vocabulary and grammar readiness
3. Listening: question types, prediction and distractors
4. Reading: skimming, scanning, inference and time use (Academic and General Training variants)
5. Academic Writing Task 1: describing data and visuals
6. General Training Writing Task 1: purpose, tone and letters
7. Writing Task 2: ideas, argument, structure, language and revision
8. Speaking Parts 1, 2, 3: fluency and criterion-led practice
9. Timed sectional tests and feedback review
10. Full mocks, weak-skill plans and final diagnostic

### Uzbekistan Multilevel preparation detailed modules
1. Exam overview, current specification, diagnostic and target level
2. Listening strategies and original audio practice
3. Reading question types and evidence-finding
4. Writing Task 1: format-specific controlled practice
5. Writing Task 2: longer responses, coherence and accuracy
6. Speaking: current-format prompts, fluency and language range
7. B1-focused practice by skill
8. B2-focused practice by skill
9. C1-focused practice by skill
10. Timed full mock, error log and revision plan

*Exam staff must update the exact speaking tasks, writing lengths and assessment sections whenever the relevant official format changes. The word “CEFR” describes level alignment, while “Multilevel” describes the national assessment-preparation track.*

### Spoken English: proposed module map
**Beginner (8):** greetings; asking simple questions; daily routine; food and ordering; places and directions; shopping; talking about family; beginner review role-play.

**Intermediate (10):** experiences; narrating a problem; small talk; work/study conversations; giving advice; explaining a decision; telephone/video calls; interviews; explaining opinions; extended discussion capstone.

**Advanced (10):** complex opinions; moderating discussion; workplace negotiation; presentations; handling disagreement; storytelling with nuance; interpreting tone; persuasive language; abstract questions; advanced fluency capstone.

### English Conversation: scenario packs
1. Getting to Know Someone
2. Coffee Shop and Restaurant
3. Shopping and Customer Service
4. Public Transport and Directions
5. Airport and Hotel
6. Health Appointment
7. School and University
8. Job Interviews
9. Office Meetings
10. Networking and New Friends
11. Travel Problems
12. Resolving Complaints
13. Cultural Conversations
14. Debate and Opinion Exchange

Each pack contains beginner/intermediate/advanced variations where appropriate, character cards, one goal statement, 10-20 approved topic turns, alternate learner responses, voice playback and completion feedback. Scenarios are reusable across Spoken English and Conversation with distinct progress records.

---

## Appendix B. Example A1 unit content acceptance specification

**Unit:** Hello, Names and Introductions.  
**Lesson 1:** Saying Hello and Introducing Yourself.  
**Objective:** The student can greet someone, give their own name and ask another person's name in a brief exchange.

**Vocabulary:** hello, hi, good morning, good afternoon, goodbye, please, thank you, my, your, name, I, you. Review content for appropriate beginner difficulty and common usage before publishing.

**Sequence:**
1. Audio greeting and target-language example.
2. Uzbek Latin explanation of greeting usage, with an English toggle.
3. Vocabulary flashcards with text and audio.
4. Guided pattern: “My name is ...” / “What is your name?”
5. Listening comprehension, three questions.
6. Four sentence-assembly or cloze questions.
7. AI role-play: meet a new classmate; 3-5 turns.
8. End quiz, 8-10 items, threshold 80%.

**Admin publishing acceptance:** English and Uzbek texts reviewed; audio load success; correct answer keys; caption/transcript availability; no personal information in sample dialogue; keyboard and mobile navigation verified; QA lesson preview recorded.

---

## Appendix C. Typical API response and lesson block payload

An illustrative `GET /api/v1/lessons/:id` response, showing localization resolved by the server and activity configuration. This is a proposed contract, not existing backend code.

```json
{
  "data": {
    "id": "lesson_01",
    "title": "Introducing Yourself",
    "locale": "uz-Latn",
    "courseId": "general_english_a1",
    "objective": "O'zingizni ingliz tilida tanishtira olasiz.",
    "status": "published",
    "blocks": [
      {"id": "block_1", "type": "vocabulary", "items": ["vocab_hello", "vocab_name"]},
      {"id": "block_2", "type": "grammar_explanation", "htmlSafeAst": {"type": "paragraph", "children": []}},
      {"id": "block_3", "type": "listening", "mediaAssetId": "audio_1"},
      {"id": "block_4", "type": "guided_speaking", "scenarioId": "meet_a_classmate"},
      {"id": "block_5", "type": "quiz", "assessmentId": "quiz_01"}
    ],
    "progress": {"completedBlocks": 1, "requiredBlocks": 5}
  }
}
```

Use safe structured rich text, never allow arbitrary scripts in learner-authored or CMS HTML. Question answer keys must be omitted from student lesson fetches; grade on the backend and respond with appropriate feedback after submission.

---

## Appendix D. Suggested sprint tickets and dependencies

1. Foundation: Git monorepo, Node/React templates, shared schemas, lint/test, env template, staging deployment.
2. Identity: session service, CSRF, verify email, login, logout, role middleware, account deletion route.
3. Catalog: track/course/module models, course list endpoint, public detail pages, publish status badges.
4. CMS: editor, media upload, Uzbek/English localization workflow, reviewer approval, scheduled release.
5. Learning: lesson block renderer, quiz runtime, attempt persistence, progress and resume.
6. Student hub: dashboard widgets, study streak computation, course navigation and review cards.
7. Tutor: text turn exchange, voice capture, transcription, TTS, quotas, rubric output validation.
8. Exam: versioned blueprint, question bank, timers, mock marking, result report.
9. Commerce: plans, orders, gateway sandbox, callback verification, entitlement check, receipt.
10. Hardening: restore drill, content pilot, accessibility audit, performance and analytics.

**Blocking dependencies:** approved payment merchant accounts; legal decision on hosting/AI data transfers; licensed/generated media; verified national exam specs; written curriculum and reviewer capacity. Design these as explicit project risks rather than assuming they are already solved.

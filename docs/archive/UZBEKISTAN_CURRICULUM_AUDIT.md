# Noldan Ravon curriculum and website audit

**Date:** 2026-10-20. Independent learning website, not affiliated with IELTS, the Council of Europe, or the Uzbek assessment agency.

## Coverage table

| Learning track | Course variants | Lessons | Intended outcomes |
|---|---:|---:|---|
| General English | A1, A2, B1, B2, C1 | 142 | CEFR-referenced everyday, independent and academic/professional language activities |
| IELTS preparation | Academic, General Training | 44 | Reading, listening, speaking and two writing tasks, with format guidance |
| Uzbekistan CEFR/Multilevel | B1, B2, C1 | 66 | Guided practice for the Uzbekistan language assessment's four skills |
| Spoken English | Beginner, Intermediate, Advanced | 74 | Role-play, repair strategies, follow-up questions, discussion and presentations |
| English Conversation | Real-life scenarios | 14 | Travel, study, public services, banking, work and polite clarification |
| **Total** | **14** | **340** | **170 modules** |

## Specific gaps discovered and addressed

- **Logout used to remain within a protected route or fall to login.** Updated success navigation to `/`. Added DB-independent CSRF-checked logout cookie clearing, with an explicit warning when server revocation fails. Partial server revocation is never called a fully secure logout.
- **Course pages previously had no level/outcome standards map.** Added course-specific CEFR progression checklists, IELTS distinction between Academic and General Training, and guidance on Uzbekistan Multilevel test components. Links point to official organisations.
- **Unusable student navigation** included empty Courses and pending Lesson routes. Replaced Courses with the public track explorer, routed student lesson links to real lesson pages, added device-local quiz result summary; omitted nonfunctional study menu items instead of promising working AI tutor, billing or certificates.
- **Content gaps:** Added 42 carefully scoped new contextual topics (84 independent learn/transfer lessons), including Uzbek city situations, university admissions, local services, complaint writing, workplace negotiations, academic evidence and regional exam-task language.
- **Some speaking drills lacked Uzbek translations:** completed 24 missing instances covering 12 distinct utterances.
- **Exam simulation labels were misleading:** renamed "full mock tests" to shorter timed skill practice where there were no full-length listening/reading papers.
- **Writing responses disappeared when navigating between lessons:** added device-local draft save and word counter. Writing remains self-reviewed and is not automatically graded.
- **Exam listening exposed the text too early:** exam track readers now permit listen-first and reveal-transcript practice. Audio is browser TTS, not recorded official-style listening tests.

## What alignment means here

**CEFR**: The Council of Europe's Companion Volume provides communicative can-do descriptors at the levels. Noldan Ravon's goal checklists reflect common progression but have not been validated item-by-item by external CEFR specialists.

**IELTS**: Both formats use four skills. Academic vs General Training have different Reading/Writing forms; both feature four listening parts, three-part speaking, and two writing tasks. The site offers guided training, **not** full 40-question Listening/Reading examinations, professional examiner ratings, calibrated writing tasks, guaranteed bands or a recognised certificate.

**Uzbekistan Multilevel**: Official assessment agency specifications currently show a B1–C1 multilevel assessment with components for listening, reading, writing and speaking. Published written specifications include 45 minutes / 35 listening questions, 60 minutes / 35 reading questions, and 60 minutes / two writing tasks. Speaking and writing assessment documentation has been updated and candidates should check the **latest official agency materials before sitting an exam**. The site's small self-checks are not official test forms or validated national scores.

## Still needed before claiming complete standards compliance

1. Qualified Uzbek/English teacher and examination-specialist editorial review of each level's scope, input complexity and translation quality.
2. Enough **non-recycled** vocabulary, grammar explanation, unseen reading and authentic communicative tasks for complete A1–C1 training with adaptive review and diagnostic placement.
3. Licensed/professionally recorded listening material, full-length and timed IELTS/Multilevel sample papers in the *current* task format and calibrated question difficulty.
4. Examiner-based analytic scoring for writing and speaking, with human moderation and demonstrated reliability. The browser word match is not a phonetic/pronunciation or IELTS band score.
5. Proper progress persistence, enrolment, teacher feedback, multilingual accessibility audit, performance/security tests, and paid feature implementation if needed.

## Verification limits

Local structural validation and direct bilingual catalog lookups succeeded. The full React build, TypeScript dependency checks, browser automation, Atlas integration and real mic workflow need running on an environment where npm packages and the MongoDB connection are available. No Hostinger deployment was performed in this edit.

## Source references

- Council of Europe, CEFR descriptors: https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- IELTS test format (British Council): https://takeielts.britishcouncil.org/what-is-ielts/how-it-works/test-format
- IELTS assessment criteria (British Council): https://takeielts.britishcouncil.org/teach-ielts/test-information/assessment
- Uzbekistan assessment agency, test format: https://uzbmb.uz/page/test_sinovlari_formati
- Uzbekistan agency, marking criteria including new formats: https://gov.uz/oz/uzbmb/sections/view/49531

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import type { CatalogRepository } from './catalog.js';
import type { CourseOutline, CourseSummary, LessonDetails, TrackSummary } from '../../../shared/src/contracts.js';

type Locale = 'UZ' | 'EN';
type Unit = {
  courseSlug: string;
  modulePosition: number;
  lesson: {
    slug: string;
    position: number;
    estimatedMinutes: number;
    titleEn: string;
    titleUz: string;
    objectivesEn: string[];
    objectivesUz: string[];
    blocks: Array<{type: LessonDetails['blocks'][number]['type']; content: Record<string, unknown>}>;
  };
};

// Deterministic RFC 4122 version-5 UUID. Public lesson links stay stable on rebuilds.
function idFor(key: string): string {
  const namespace = Buffer.from('7c9e6679742540de944fe07fc1f90ae7', 'hex');
  const digest = createHash('sha1').update(namespace).update(key, 'utf8').digest();
  digest[6] = ((digest[6] ?? 0) & 0x0f) | 0x50;
  digest[8] = ((digest[8] ?? 0) & 0x3f) | 0x80;
  const hex = digest.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

const definitions = [
  { slug: 'general-english', key: 'general', en: 'General English', uz: 'Umumiy ingliz tili' },
  { slug: 'ielts-preparation', key: 'ielts', en: 'IELTS Preparation', uz: 'IELTS tayyorgarligi' },
  { slug: 'multilevel-preparation', key: 'multilevel', en: 'CEFR / Multilevel', uz: 'Multilevel tayyorgarligi' },
  { slug: 'spoken-english', key: 'spoken', en: 'Spoken English', uz: 'Og‘zaki ingliz tili' },
  { slug: 'conversation', key: 'conversation', en: 'English Conversation', uz: 'Inglizcha suhbat' },
] as const;

// Works from tsx in backend/src/routes and from compiled backend/dist/backend/src/routes.
// The authored dataset ships with the source archive; it never calls MongoDB.
function readUnits(): Unit[] {
  const candidateUrls = [
    new URL('../../prisma/course-content.json', import.meta.url),
    new URL('../../../../prisma/course-content.json', import.meta.url),
  ];
  const file = candidateUrls.find(u => existsSync(u));
  if (!file) throw new Error('Missing backend/prisma/course-content.json: bundled courses cannot start');
  const source = JSON.parse(readFileSync(file, 'utf8')) as { edition: string; lessons: Unit[] };
  if (source.edition !== '2026-10-unique-lessons-reviewed-v1' || source.lessons?.length !== 170)
    throw new Error('Bundled courses must include the 170 distinct bilingual lessons');
  const unique = new Set<string>();
  for (const unit of source.lessons) {
    const key = `${unit.courseSlug}:${unit.modulePosition}:${unit.lesson.position}`;
    if (unique.has(key) || unit.lesson.blocks.length < 5 || !unit.lesson.objectivesEn.length) {
      throw new Error(`Duplicate or incomplete bundled lesson: ${key}`);
    }
    unique.add(key);
  }
  return source.lessons;
}

function variantName(slug: string, trackSlug: string): string {
  const variant = slug.slice(trackSlug.length + 1);
  const display: Record<string, string> = {
    'general-training': 'General Training', 'academic': 'Academic',
    'beginner': 'Beginner', 'intermediate': 'Intermediate',
    'advanced': 'Advanced', 'scenarios': 'Scenarios',
  };
  return display[variant] ?? variant.toUpperCase();
}
function localName(unit: Unit, locale: Locale) {
  const title = locale === 'EN' ? unit.lesson.titleEn : unit.lesson.titleUz;
  return title.split(' · ')[0]!.replace(/: (?:lesson & practice|speaking lab & real-life challenge|contextual skill clinic|transfer and self-review|dars va mashq|gapirish laboratoriyasi va amaliy vazifa|amaliy dars|yangi vaziyat va tahlil)$/i, '');
}
export function bundledCatalog(): CatalogRepository {
  const units = readUnits();
  const byCourse = new Map<string, Unit[]>();
  const byId = new Map<string, Unit>();
  for (const unit of units) {
    const list = byCourse.get(unit.courseSlug) ?? [];
    list.push(unit);
    byCourse.set(unit.courseSlug, list);
    byId.set(idFor(`lesson/${unit.courseSlug}/${unit.modulePosition}/${unit.lesson.position}`), unit);
  }
  function parent(courseSlug: string) {
    return definitions.find(d => courseSlug.startsWith(d.slug + '-'));
  }
  function courseName(slug: string, locale: Locale): string {
    const def = parent(slug);
    return `${locale === 'EN' ? def?.en : def?.uz} · ${def ? variantName(slug, def.slug) : slug}`;
  }
  function courseDescription(locale: Locale) {
    return locale === 'EN'
      ? 'English–Uzbek guided lessons, exam skill clinics and contextual speaking/writing practice. These are independent training materials, not official-length mock exams or certified assessments.'
      : 'Inglizcha–o‘zbekcha darslar, imtihon ko‘nikmalari, suhbat va yozish amaliyoti. Bu rasmiy imtihon yoki sertifikat emas.';
  }
  const tracks = (locale: Locale): TrackSummary[] => definitions.map(def => ({
    id: idFor(`track/${def.slug}`), slug: def.slug, titleKey: def.key, status: 'PUBLISHED',
    courses: Array.from(byCourse.entries()).filter(([slug]) => slug.startsWith(def.slug + '-'))
      .map(([slug, lessons]): CourseSummary => ({
        id: idFor(`course/${slug}`), slug, status: 'PUBLISHED',
        level: /-(a1|a2|b1|b2|c1)$/.test(slug) ? slug.split('-').at(-1)?.toUpperCase() ?? null : null,
        name: courseName(slug, locale), description: courseDescription(locale),
        publishedLessons: lessons.length, plannedLessons: lessons.length,
        modules: lessons.filter(u => u.lesson.position === 0)
          .sort((a,b) => a.modulePosition - b.modulePosition).map(u => ({
            id: idFor(`module/${slug}/${u.modulePosition}`), title: localName(u, locale), status: 'PUBLISHED',
          })),
      })),
  }));
  return {
    async health() { /* bundled course reads do not need MongoDB */ },
    async tracks(locale) { return tracks(locale); },
    async courseOutline(slug, locale): Promise<CourseOutline | null> {
      const lessons = byCourse.get(slug);
      if (!lessons) return null;
      return {
        id: idFor(`course/${slug}`), slug, name: courseName(slug, locale),
        description: courseDescription(locale),
        modules: lessons.filter(u => u.lesson.position === 0)
          .sort((a, b) => a.modulePosition - b.modulePosition).map(first => ({
            id: idFor(`module/${slug}/${first.modulePosition}`), position: first.modulePosition,
            title: localName(first, locale),
            lessons: lessons.filter(u => u.modulePosition === first.modulePosition)
              .sort((a,b) => a.lesson.position-b.lesson.position).map(u => ({
                id: idFor(`lesson/${slug}/${u.modulePosition}/${u.lesson.position}`),
                position: u.lesson.position,
                title: locale === 'EN' ? u.lesson.titleEn : u.lesson.titleUz,
                estimatedMinutes: u.lesson.estimatedMinutes,
              })),
          })),
      };
    },
    async lessonDetail(id, locale): Promise<LessonDetails | null> {
      const unit = byId.get(id);
      if (!unit) return null;
      return {
        id, courseSlug: unit.courseSlug, courseName: courseName(unit.courseSlug, locale),
        moduleTitle: localName(unit, locale),
        title: locale === 'EN' ? unit.lesson.titleEn : unit.lesson.titleUz,
        objectives: locale === 'EN' ? unit.lesson.objectivesEn : unit.lesson.objectivesUz,
        estimatedMinutes: unit.lesson.estimatedMinutes,
        blocks: unit.lesson.blocks.map((block, pos) => ({
          id: idFor(`block/${id}/${pos}`), type: block.type, position: pos, content: block.content,
        })),
      };
    },
  };
}

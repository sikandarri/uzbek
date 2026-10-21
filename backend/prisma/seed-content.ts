import { readFileSync } from 'node:fs';
import type { PrismaClient, Prisma } from '@prisma/client';
import { retryMongoWrite } from '../src/mongo-retry.js';

type ContentBlock = { type: 'EXPLANATION'|'VOCABULARY'|'READING'|'MICROPHONE'|'QUESTION'; content: Prisma.InputJsonValue };
type ContentUnit = {
  courseSlug: string; modulePosition: number;
  lesson: { slug: string; position: number; estimatedMinutes: number;
    titleEn: string; titleUz: string; objectivesEn: string[]; objectivesUz: string[];
    blocks: ContentBlock[] };
};

/** Add distinct lessons to MongoDB without deleting earlier data.
 * NOTE: older two-per-module duplicate lesson records are NOT removed by this
 * non-destructive seed. Public course pages should use COURSE_CATALOG_SOURCE=bundled.
 * For database-mode migrations, reconcile teacher edits and obtain approval
 * before removing any legacy records. */
export async function seedCourseContent(db: PrismaClient): Promise<number> {
  const source = JSON.parse(readFileSync(new URL('./course-content.json', import.meta.url), 'utf8')) as {
    edition: string; lessons: ContentUnit[];
  };
  if (source.edition !== '2026-10-unique-lessons-reviewed-v1' || source.lessons.length !== 170)
    throw new Error('Content dataset failed integrity checks; refusing partial publish.');

  const grouped = new Map<string, ContentUnit[]>();
  for (const item of source.lessons) {
    if (!grouped.has(item.courseSlug)) grouped.set(item.courseSlug, []);
    grouped.get(item.courseSlug)!.push(item);
  }
  let total = 0;
  for (const [slug, units] of grouped) {
    const course = await db.course.findUnique({ where: { slug } });
    if (!course) throw new Error(`Course does not exist: ${slug}. Run the catalog seed first.`);
    for (const unit of units) {
      // New curriculum clinics have new module positions. Create them without
      // overwriting existing teacher-edited modules or blocks.
      let mod = await db.module.findUnique({ where: { courseId_position: {
        courseId: course.id, position: unit.modulePosition } } });
      if (!mod) {
        const clinic = unit.lesson.position === 0 ? unit : units.find(other =>
          other.modulePosition === unit.modulePosition && other.lesson.position === 0);
        if (!clinic) throw new Error(`Missing first lesson in ${slug}/${unit.modulePosition}`);
        mod = await db.module.create({ data: {
          courseId: course.id, position: unit.modulePosition, slug: `unit-${unit.modulePosition + 1}`,
          status: 'DRAFT',
          moduleTranslation_module: { create: [
            {locale: 'EN', title: clinic.lesson.titleEn.split(':')[0]!, description: 'Guided contextual practice module.'},
            {locale: 'UZ', title: clinic.lesson.titleUz.split(':')[0]!, description: 'Vaziyatga oid amaliy modul.'},
          ] },
        } });
      }
      await retryMongoWrite(async () => {
        const l = unit.lesson;
        let lesson = await db.lesson.findUnique({ where: { moduleId_position: {
          moduleId: mod.id, position: l.position } } });
        if (!lesson) {
          lesson = await db.lesson.create({ data: {
            moduleId: mod.id, slug: l.slug, position: l.position,
            estimatedMinutes: l.estimatedMinutes, status: 'DRAFT',
            lessonTranslation_lesson: { create: [
              { locale: 'EN', title: l.titleEn, objectives: l.objectivesEn },
              { locale: 'UZ', title: l.titleUz, objectives: l.objectivesUz },
            ] },
            lessonBlock_lesson: { create: l.blocks.map((b, pos) => ({
              position: pos, type: b.type, content: b.content,
            })) },
          } });
        } else {
          // Safe retry after an interrupted seed: fill gaps without destroying edited blocks.
          for (const [loc, title, objectives] of [
            ['EN', l.titleEn, l.objectivesEn], ['UZ', l.titleUz, l.objectivesUz],
          ] as const) {
            await db.lessonTranslation.upsert({
              where: { lessonId_locale: { lessonId: lesson.id, locale: loc } },
              create: { lessonId: lesson.id, locale: loc, title, objectives }, update: {},
            });
          }
          for (const [pos, block] of l.blocks.entries()) {
            await db.lessonBlock.upsert({
              where: { lessonId_position: { lessonId: lesson.id, position: pos } },
              create: { lessonId: lesson.id, position: pos, type: block.type, content: block.content },
              update: {},
            });
          }
        }
        // Mark the lesson live only after all blocks are present.
        const blockCount = await db.lessonBlock.count({ where: { lessonId: lesson.id } });
        if (blockCount < l.blocks.length) throw new Error(`Incomplete lesson ${slug}/${mod.slug}`);
        if (lesson.status !== 'PUBLISHED')
          await db.lesson.update({ where: { id: lesson.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
        await db.module.update({ where: { id: mod.id }, data: { status: 'PUBLISHED' } });
      });
      total++;
      if (total % 8 === 0) console.info(`Published ${total}/170 lessons; continuing...`);
    }
    if (course.status !== 'PUBLISHED')
      await db.course.update({ where: { id: course.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
    // Replace only the initial Coming Soon boilerplate, never an author's custom description.
    await db.courseTranslation.updateMany({
      where: { courseId: course.id, locale: 'EN', description: 'Curriculum structure is ready. Lessons will be published after editorial review. Enrollment and purchases are not available yet.' },
      data: { description: 'Learn with bilingual reading, topic vocabulary, practice questions, speaking and writing activities. Free self-study samples; enrollment and purchases are not enabled.' },
    });
    await db.courseTranslation.updateMany({
      where: { courseId: course.id, locale: 'UZ', description: 'Kurs tuzilmasi tayyor. Darslar tahririy tekshiruvdan so‘ng e’lon qilinadi. Hozircha kursga yozilish va xarid qilish imkoni yo‘q.' },
      data: { description: 'O‘zbekcha izohlar, lug‘at, matn, testlar, gapirish va yozish mashqlari bilan mustaqil o‘rganing. Hozircha pullik yozilish yoki xarid qilish mavjud emas.' },
    });
    await db.track.update({ where: { id: course.trackId }, data: { status: 'PUBLISHED' } });
    console.info(`Published ${units.length} lessons for ${slug}`);
  }
  console.info(`Published ${total} bilingual foundation lessons in five tracks.`);
  return total;
}

import type { PrismaClient } from '@prisma/client';
import type { TrackSummary, CourseOutline, LessonDetails } from '../../../shared/src/contracts.js';
export interface CatalogRepository {
  tracks(locale: 'UZ' | 'EN'): Promise<TrackSummary[]>;
  health(): Promise<void>;
  courseOutline?(slug: string, locale: 'UZ' | 'EN'): Promise<CourseOutline | null>;
  lessonDetail?(id: string, locale: 'UZ' | 'EN'): Promise<LessonDetails | null>;
}
export function prismaCatalog(db: PrismaClient): CatalogRepository {
  return {
    async health() {
      await db.$runCommandRaw({ ping: 1 });
    },
    async courseOutline(slug, locale) {
      const course = await db.course.findUnique({ where: { slug }, include: {
        courseTranslation_course: { where: { locale } },
        module_course: { where: { status: 'PUBLISHED', deletedAt: null }, orderBy: { position: 'asc' },
          include: { moduleTranslation_module: { where: { locale } },
            lesson_module: { where: { status: 'PUBLISHED', deletedAt: null }, orderBy: { position: 'asc' },
              include: { lessonTranslation_lesson: { where: { locale } } } } } },
      } });
      if (!course || course.status !== 'PUBLISHED' || !course.listed || course.deletedAt) return null;
      return { id: course.id, slug: course.slug,
        name: course.courseTranslation_course[0]?.name ?? course.slug,
        description: course.courseTranslation_course[0]?.description ?? '',
        modules: course.module_course.map(m => ({ id: m.id, position: m.position,
          title: m.moduleTranslation_module[0]?.title ?? m.slug,
          lessons: m.lesson_module.map(l => ({ id: l.id, position: l.position,
            title: l.lessonTranslation_lesson[0]?.title ?? l.slug,
            estimatedMinutes: l.estimatedMinutes })) })) };
    },
    async lessonDetail(id, locale) {
      const lesson = await db.lesson.findUnique({ where: { id }, include: {
        lessonTranslation_lesson: { where: { locale } },
        lessonBlock_lesson: { orderBy: { position: 'asc' } },
        module: { include: { moduleTranslation_module: { where: { locale } },
          course: { include: { courseTranslation_course: { where: { locale } } } } } },
      } });
      if (!lesson || lesson.status !== 'PUBLISHED' || lesson.deletedAt ||
          lesson.module.status !== 'PUBLISHED' || lesson.module.deletedAt ||
          lesson.module.course.status !== 'PUBLISHED' || lesson.module.course.deletedAt ||
          !lesson.module.course.listed) return null;
      return { id: lesson.id, title: lesson.lessonTranslation_lesson[0]?.title ?? lesson.slug,
        objectives: (lesson.lessonTranslation_lesson[0]?.objectives ?? []) as string[],
        estimatedMinutes: lesson.estimatedMinutes, courseSlug: lesson.module.course.slug,
        courseName: lesson.module.course.courseTranslation_course[0]?.name ?? lesson.module.course.slug,
        moduleTitle: lesson.module.moduleTranslation_module[0]?.title ?? lesson.module.slug,
        blocks: lesson.lessonBlock_lesson.map(block => ({ id: block.id,
          type: block.type as LessonDetails['blocks'][number]['type'], position: block.position,
          content: block.content as Record<string, unknown> })) };
    },
    async tracks(locale) {
      const tracks = await db.track.findMany({
        where: { status: { in: ['PUBLISHED', 'COMING_SOON'] } },
        orderBy: { position: 'asc' },
        include: {
          course_track: {
            where: { listed: true, deletedAt: null, status: { in: ['PUBLISHED', 'COMING_SOON'] } },
            orderBy: { position: 'asc' },
            include: {
              courseTranslation_course: { where: { locale } },
              module_course: {
                where: { deletedAt: null, status: { in: ['PUBLISHED', 'COMING_SOON'] } },
                orderBy: { position: 'asc' },
                select: {
                  id: true,
                  status: true,
                  moduleTranslation_module: { where: { locale }, select: { title: true } },
                  lesson_module: {
                    where: { deletedAt: null, status: { in: ['PUBLISHED', 'COMING_SOON'] } },
                    select: { status: true },
                  },
                },
              },
            },
          },
        },
      });
      return tracks.map((t) => ({
        id: t.id,
        slug: t.slug,
        titleKey: t.titleKey,
        status: t.status,
        courses: t.course_track.map((c) => ({
          id: c.id,
          slug: c.slug,
          level: c.level,
          status: c.status,
          name: c.courseTranslation_course[0]?.name ?? c.slug,
          description: c.courseTranslation_course[0]?.description ?? '',
          publishedLessons:
            c.status === 'PUBLISHED'
              ? c.module_course
                  .filter((m) => m.status === 'PUBLISHED')
                  .flatMap((m) => m.lesson_module)
                  .filter((l) => l.status === 'PUBLISHED').length
              : 0,
          plannedLessons: c.module_course.flatMap((m) => m.lesson_module).length,
          modules: c.module_course.map((m) => ({
            id: m.id,
            title: m.moduleTranslation_module[0]?.title ?? '',
            status: m.status,
          })),
        })),
      }));
    },
  };
}
